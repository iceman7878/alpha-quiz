-- ALPHA LAUNCH — schema mínimo. Rodar uma vez no SQL Editor do Supabase (projeto novo).
-- Tabelas: leads (quiz), members (compradores), progress (7-Day Build) + visão crm_build.

-- ---------- leads ----------
-- Leads do quiz. Só o servidor (service role) lê e escreve.
create table if not exists public.leads (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  nome          text not null,
  whatsapp      text not null,
  email         text,
  rota          text,
  r             text,
  utm           jsonb,
  consentimento boolean not null default false
);
alter table public.leads enable row level security;

-- ---------- members ----------
-- Um registro por comprador; id = usuário do Supabase Auth. Criado/atualizado pelo webhook.
create table if not exists public.members (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null unique,
  nome          text,
  whatsapp      text,
  route         text,
  r             text,
  access_status text not null default 'active' check (access_status in ('active', 'blocked')),
  score         smallint,
  level         smallint,
  score_answers jsonb,
  score_at      timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.members enable row level security;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

drop policy if exists "membro lê o próprio registro" on public.members;
create policy "membro lê o próprio registro" on public.members
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "membro ativo grava o próprio score" on public.members;
create policy "membro ativo grava o próprio score" on public.members
  for update to authenticated
  using (id = auth.uid() and access_status = 'active')
  with check (id = auth.uid() and access_status = 'active');

-- O membro só pode alterar as colunas do Build Score (access_status fica com o servidor).
revoke update on public.members from authenticated;
grant update (score, level, score_answers, score_at) on public.members to authenticated;

-- ---------- progress ----------
-- Uma linha por (usuário, dia). Respostas do dia em JSONB.
create table if not exists public.progress (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  day        smallint not null check (day between 1 and 7),
  completed  boolean not null default false,
  answers    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);
alter table public.progress enable row level security;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();

drop policy if exists "membro ativo acessa o próprio progresso" on public.progress;
create policy "membro ativo acessa o próprio progresso" on public.progress
  for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.members m where m.id = auth.uid() and m.access_status = 'active')
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.members m where m.id = auth.uid() and m.access_status = 'active')
  );

-- ---------- helper do webhook ----------
-- Recompra de quem já tem conta: o webhook precisa do id do usuário pelo e-mail.
create or replace function public.user_id_by_email(p_email text) returns uuid
language sql security definer set search_path = '' as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;
revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;

-- ---------- eventos do checkout ----------
-- Idempotência do webhook: cada (transação, tipo) é processado uma vez. Só o servidor acessa.
create table if not exists public.checkout_events (
  id         text primary key,          -- "<transação>:approved" | "<transação>:revoked"
  created_at timestamptz not null default now(),
  txn        text not null,
  kind       text not null,
  status     text,
  email      text,
  user_id    uuid                       -- no "approved": conta que esta transação liberou (o estorno bloqueia esta)
);
alter table public.checkout_events add column if not exists user_id uuid;
-- Posse da marca (F05): cada entrega grava o seu token; a retomada troca o dono num UPDATE condicional;
-- finalized_at = acesso liberado por esta transação.
alter table public.checkout_events add column if not exists claim_token text;
alter table public.checkout_events add column if not exists claimed_at timestamptz;
alter table public.checkout_events add column if not exists finalized_at timestamptz;
-- Linhas da versão anterior: "approved" com conta ligada já foi concluído; sem claimed_at, conta a partir de created_at.
update public.checkout_events set finalized_at = created_at where kind = 'approved' and user_id is not null and finalized_at is null;
update public.checkout_events set claimed_at = created_at where claimed_at is null;
alter table public.checkout_events enable row level security;
revoke all on public.checkout_events from anon, authenticated;

-- ---------- CRM ----------
-- Quem comprou → quem executou → quem avançou.
create or replace view public.crm_build as
select
  m.email, m.nome, m.whatsapp, m.route, m.access_status, m.created_at as comprou_em,
  count(p.id) filter (where p.completed) as dias_concluidos,
  m.score, m.level, m.score_at
from public.members m
left join public.progress p on p.user_id = m.id
group by m.id;

revoke all on public.crm_build from anon, authenticated;

-- ---------- liberação do acesso (webhook) ----------
-- Numa só transação: trava a marca, confere o dono (token) e que não há estorno, ativa o membro (na recompra só
-- sobrescreve o que veio preenchido), liga a conta à transação e finaliza. Quem perdeu a posse recebe 'lost' e não
-- produz efeito nenhum. Retorno: 'ok' | 'lost' | 'revoked'.
create or replace function public.finalize_checkout_claim(
  p_event_id text, p_token text, p_user_id uuid, p_email text, p_txn text,
  p_nome text, p_whatsapp text, p_r text, p_route text
) returns text
language plpgsql security invoker set search_path = '' as $$
declare v_token text;
begin
  select claim_token into v_token from public.checkout_events
   where id = p_event_id and finalized_at is null
   for update;
  if not found or v_token is distinct from p_token then
    return 'lost';
  end if;
  if exists (select 1 from public.checkout_events where id = p_txn || ':revoked') then
    return 'revoked';
  end if;
  insert into public.members as m (id, email, access_status, nome, whatsapp, r, route)
  values (p_user_id, p_email, 'active', p_nome, p_whatsapp, p_r, p_route)
  on conflict (id) do update set
    email = excluded.email,
    access_status = 'active',
    nome = coalesce(excluded.nome, m.nome),
    whatsapp = coalesce(excluded.whatsapp, m.whatsapp),
    r = coalesce(excluded.r, m.r),
    route = coalesce(excluded.route, m.route);
  update public.checkout_events set user_id = p_user_id, finalized_at = now() where id = p_event_id;
  return 'ok';
end $$;
revoke all on function public.finalize_checkout_claim(text, text, uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.finalize_checkout_claim(text, text, uuid, text, text, text, text, text, text) to service_role;

-- Conta do comprador por e-mail + hash do CPF/CNPJ (app_metadata.doc_hash, gravado por /api/conta).
-- Usada pelo webhook quando a Disrupty não devolve o externalId. Só o servidor (service_role) chama.
create or replace function public.user_id_by_email_doc(p_email text, p_doc_hash text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select u.id from auth.users u
  where lower(u.email) = lower(p_email)
    and coalesce(p_doc_hash, '') <> ''
    and u.raw_app_meta_data->>'doc_hash' = p_doc_hash
  limit 1;
$$;
revoke all on function public.user_id_by_email_doc(text, text) from public, anon, authenticated;
grant execute on function public.user_id_by_email_doc(text, text) to service_role;
