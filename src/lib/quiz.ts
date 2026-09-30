// Perguntas, perfis e pontuação do quiz. O app do produto reaproveita este arquivo.

export type ProfileKey = "afiliacao" | "coproducao" | "produto" | "servico";

type Weights = Partial<Record<ProfileKey, number>>;

export type Option = { label: string; w: Weights };

export type Question = {
  id: string;
  title: string;
  hint?: string;
  options: Option[];
};

export const QUESTIONS: Question[] = [
  {
    id: "tempo",
    title: "Quanto tempo por dia você consegue dedicar, de verdade?",
    options: [
      { label: "Menos de 1 hora", w: { afiliacao: 3, coproducao: 1 } },
      { label: "Entre 1 e 2 horas", w: { afiliacao: 2, coproducao: 2, servico: 1 } },
      { label: "Entre 2 e 4 horas", w: { coproducao: 1, produto: 2, servico: 2 } },
      { label: "Mais de 4 horas", w: { produto: 2, servico: 3 } },
    ],
  },
  {
    id: "habilidade",
    title: "Qual é a sua habilidade mais forte hoje?",
    options: [
      { label: "Escrever e comunicar ideias", w: { afiliacao: 2, coproducao: 2, produto: 1 } },
      { label: "Algo técnico: tráfego, design, edição, automação", w: { servico: 3, coproducao: 2 } },
      { label: "Ensinar um assunto que eu domino", w: { produto: 3, coproducao: 1 } },
      { label: "Ainda não tenho uma clara", w: { afiliacao: 3 } },
    ],
  },
  {
    id: "capital",
    title: "Quanto você pode investir para começar?",
    hint: "Considere só o que não faz falta no mês.",
    options: [
      { label: "Até R$ 200", w: { afiliacao: 2, servico: 2 } },
      { label: "De R$ 200 a R$ 1.000", w: { afiliacao: 2, coproducao: 2, servico: 1 } },
      { label: "De R$ 1.000 a R$ 5.000", w: { coproducao: 1, produto: 2 } },
      { label: "Mais de R$ 5.000", w: { produto: 3, coproducao: 1 } },
    ],
  },
  {
    id: "exposicao",
    title: "Aparecer em vídeo faz parte do seu plano?",
    options: [
      { label: "Sim, sem problema", w: { produto: 3, servico: 1 } },
      { label: "Só voz ou texto", w: { afiliacao: 2, coproducao: 1, servico: 1 } },
      { label: "Prefiro ficar nos bastidores", w: { afiliacao: 2, coproducao: 3, servico: 1 } },
    ],
  },
  {
    id: "meta",
    title: "O que você quer construir nos próximos 6 meses?",
    options: [
      { label: "Fazer a primeira venda online", w: { afiliacao: 3, servico: 1 } },
      { label: "Uma renda complementar consistente", w: { servico: 2, afiliacao: 1, coproducao: 1 } },
      { label: "Uma operação que cresça sem depender só de mim", w: { coproducao: 3, produto: 1 } },
      { label: "Um ativo próprio, com a minha marca", w: { produto: 3 } },
    ],
  },
  {
    id: "experiencia",
    title: "Qual é a sua experiência com vendas online?",
    options: [
      { label: "Nenhuma", w: { afiliacao: 2, servico: 1 } },
      { label: "Já tentei, sem resultado", w: { afiliacao: 1, coproducao: 2, servico: 1 } },
      { label: "Já vendi algumas vezes", w: { coproducao: 2, produto: 1, servico: 1 } },
      { label: "Vendo com frequência", w: { produto: 3, coproducao: 1 } },
    ],
  },
  {
    id: "trava",
    title: "O que mais te trava hoje?",
    options: [
      { label: "Não sei por onde começar", w: { afiliacao: 2, servico: 1 } },
      { label: "Não sei o que vender", w: { afiliacao: 2, coproducao: 1 } },
      { label: "Medo de me expor", w: { coproducao: 2, afiliacao: 1 } },
      { label: "Falta de método e constância", w: { produto: 2, servico: 2 } },
    ],
  },
];

export type Profile = {
  key: ProfileKey;
  code: string;
  name: string;
  model: string;
  summary: string;
  diagnosis: string[];
  firstMove: string;
};

export const PROFILES: Record<ProfileKey, Profile> = {
  afiliacao: {
    key: "afiliacao",
    code: "01",
    name: "Distribuidor Silencioso",
    model: "Afiliação",
    summary: "Você distribui o que já existe. Sem produto, sem rosto, sem estoque.",
    diagnosis: [
      "Seu ponto de partida mais curto não é criar — é distribuir. Produtos validados já existem; o que falta para eles é alcance, e alcance se constrói com constância, não com exposição.",
      "O risco do seu perfil é pular de oferta em oferta. O Mapa fixa um nicho, um produto e um canal por 14 dias para você medir o que funciona antes de trocar.",
    ],
    firstMove: "Escolher um único produto de nicho e um único canal de conteúdo.",
  },
  coproducao: {
    key: "coproducao",
    code: "02",
    name: "Arquiteto de Bastidor",
    model: "Coprodução",
    summary: "Você constrói a operação por trás de quem já tem audiência.",
    diagnosis: [
      "Você não precisa ser a vitrine. Existem especialistas com público e sem estrutura — a sua vantagem está em montar o que eles não montam: oferta, funil, página, rotina de lançamento.",
      "O risco do seu perfil é oferecer parceria sem prova. O Mapa organiza a abordagem, a proposta e o primeiro projeto-piloto para você entrar com método, não com pedido.",
    ],
    firstMove: "Mapear 10 especialistas com audiência e sem produto estruturado.",
  },
  produto: {
    key: "produto",
    code: "03",
    name: "Autoridade de Origem",
    model: "Produto próprio",
    summary: "Você transforma o que domina em um ativo com o seu nome.",
    diagnosis: [
      "Você tem o que a maioria não tem: um assunto que domina e disposição para ser visto. O caminho é empacotar esse conhecimento num produto enxuto e testar a demanda antes de construir algo grande.",
      "O risco do seu perfil é gastar meses produzindo antes de vender. O Mapa inverte a ordem: validar primeiro, produzir depois.",
    ],
    firstMove: "Definir a promessa de um produto enxuto e pré-vender antes de gravar.",
  },
  servico: {
    key: "servico",
    code: "04",
    name: "Operador Técnico",
    model: "Serviço",
    summary: "Você vende execução. Caixa primeiro, escala depois.",
    diagnosis: [
      "Sua habilidade já tem mercado. O movimento mais direto é vendê-la como serviço para negócios digitais, com escopo fechado e preço claro — o caixa que vem daí financia os próximos passos.",
      "O risco do seu perfil é virar freelancer sem sistema. O Mapa estrutura oferta, prospecção e entrega para você não depender de indicação.",
    ],
    firstMove: "Transformar a sua habilidade em uma oferta de escopo fechado com preço.",
  },
};

const ORDER: ProfileKey[] = ["afiliacao", "coproducao", "servico", "produto"];

/** answers[i] = índice da opção escolhida na pergunta i. */
export function scoreAnswers(answers: number[]): ProfileKey {
  const total: Record<ProfileKey, number> = { afiliacao: 0, coproducao: 0, produto: 0, servico: 0 };
  answers.forEach((optIdx, qIdx) => {
    const w = QUESTIONS[qIdx]?.options[optIdx]?.w ?? {};
    for (const k of Object.keys(w) as ProfileKey[]) total[k] += w[k] ?? 0;
  });
  // Empate: vence o modelo de menor barreira de entrada (ordem de ORDER).
  return ORDER.reduce((best, k) => (total[k] > total[best] ? k : best), ORDER[0]);
}

/** Código compacto das respostas (ex.: "1302213") — viaja no checkout e alimenta o app. */
export function encodeAnswers(answers: number[]): string {
  return answers.join("");
}

export function decodeAnswers(code: string): number[] | null {
  if (!/^\d+$/.test(code) || code.length !== QUESTIONS.length) return null;
  const arr = code.split("").map(Number);
  return arr.every((v, i) => v < QUESTIONS[i].options.length) ? arr : null;
}
