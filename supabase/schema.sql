-- ALPHA LAUNCH — schema mínimo. Rodar uma vez no SQL Editor do Supabase.
-- Três tabelas: leads (quiz), members (compradores) e progress (7-Day Build).

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

-- Compradores. Criados pelo webhook do checkout; e-mail sempre em minúsculas.
create table if not exists public.members (
  email         text primary key,
  created_at    timestamptz not null default now(),
  nome          text,
  whatsapp      text,
  rota          text,
  r             text,
  active        boolean not null default true,
  score         smallint,
  level         smallint,
  score_answers jsonb,
  score_at      timestamptz
);
alter table public.members enable row level security;

drop policy if exists "membro lê o próprio registro" on public.members;
create policy "membro lê o próprio registro" on public.members
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

drop policy if exists "membro grava o próprio score" on public.members;
create policy "membro grava o próprio score" on public.members
  for update to authenticated
  using (email = lower(auth.jwt() ->> 'email'))
  with check (email = lower(auth.jwt() ->> 'email'));

-- O membro só pode alterar as colunas do Build Score.
revoke update on public.members from authenticated;
grant update (score, level, score_answers, score_at) on public.members to authenticated;

-- Progresso do 7-Day Build: uma linha por dia.
create table if not exists public.progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  day          smallint not null check (day between 1 and 7),
  answers      jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.progress enable row level security;

drop policy if exists "membro ativo acessa o próprio progresso" on public.progress;
create policy "membro ativo acessa o próprio progresso" on public.progress
  for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.members m where m.email = lower(auth.jwt() ->> 'email') and m.active)
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.members m where m.email = lower(auth.jwt() ->> 'email') and m.active)
  );

-- Visão para CRM: quem comprou → quem executou → quem avançou.
create or replace view public.crm_build as
select
  m.email, m.nome, m.whatsapp, m.rota, m.created_at as comprou_em,
  count(p.completed_at) as dias_concluidos,
  m.score, m.level, m.score_at
from public.members m
left join auth.users u on lower(u.email) = m.email
left join public.progress p on p.user_id = u.id
group by m.email, m.nome, m.whatsapp, m.rota, m.created_at, m.score, m.level, m.score_at;

revoke all on public.crm_build from anon, authenticated;
