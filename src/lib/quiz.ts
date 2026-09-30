// Perguntas, rotas e pontuação do quiz. O app do produto reaproveita este arquivo.

export type RouteKey = "distribuicao" | "bastidor" | "servico" | "produto";

type Weights = Partial<Record<RouteKey, number>>;

/** `trait` entra na frase personalizada do resultado ("Você parte de …"). */
export type Option = { label: string; trait: string; w: Weights };

export type Question = {
  id: string;
  title: string;
  hint?: string;
  options: Option[];
};

export const QUESTIONS: Question[] = [
  {
    id: "partida",
    title: "O que você já tem hoje para começar?",
    options: [
      {
        label: "Uma habilidade técnica — ou vontade real de dominar IA",
        trait: "de uma habilidade técnica",
        w: { servico: 3, bastidor: 1 },
      },
      {
        label: "Um assunto que eu domino e poderia ensinar",
        trait: "de um assunto que você domina",
        w: { produto: 3, bastidor: 1 },
      },
      {
        label: "Facilidade para organizar, escrever e vender",
        trait: "de facilidade para organizar e vender",
        w: { bastidor: 3, distribuicao: 1 },
      },
      {
        label: "Nada claro ainda — só a decisão de começar",
        trait: "da decisão de começar",
        w: { distribuicao: 3 },
      },
    ],
  },
  {
    id: "exposicao",
    title: "Aparecer faz parte do seu plano?",
    hint: "Sem resposta certa. A rota muda de acordo.",
    options: [
      { label: "Sim, sem problema", trait: "aceita aparecer", w: { produto: 3, servico: 1 } },
      {
        label: "Só voz, texto ou tela",
        trait: "prefere voz, texto ou tela",
        w: { distribuicao: 2, servico: 2, bastidor: 1 },
      },
      {
        label: "Prefiro ficar nos bastidores",
        trait: "prefere os bastidores",
        w: { bastidor: 3, distribuicao: 2, servico: 1 },
      },
    ],
  },
  {
    id: "ritmo",
    title: "Qual ritmo é possível para você agora?",
    options: [
      {
        label: "Menos de 1 hora por dia — quero começar pequeno",
        trait: "menos de 1 hora por dia",
        w: { distribuicao: 3, bastidor: 1 },
      },
      {
        label: "1 a 2 horas por dia — quero o primeiro cliente logo",
        trait: "1 a 2 horas por dia",
        w: { servico: 3, distribuicao: 1 },
      },
      {
        label: "2 horas ou mais — quero algo com o meu nome",
        trait: "2 horas ou mais por dia",
        w: { produto: 3, servico: 1 },
      },
      {
        label: "O que for preciso — ao lado de quem já tem público",
        trait: "disposição para operar ao lado de quem já tem público",
        w: { bastidor: 3, produto: 1 },
      },
    ],
  },
];

export type Route = {
  key: RouteKey;
  code: string;
  name: string;
  model: string;
  statement: string;
  objective: string[];
  day01: string;
};

export const ROUTES: Record<RouteKey, Route> = {
  servico: {
    key: "servico",
    code: "01",
    name: "AI Service Builder",
    model: "Serviço com IA",
    statement:
      "Seu perfil indica começar por uma solução simples para empresas, usando IA para entregar um resultado específico. Você vende execução — escopo fechado, preço claro.",
    objective: ["Encontrar 1 problema", "criar 1 solução", "colocar 1 oferta na rua"],
    day01: "Listar 10 tarefas repetitivas que negócios da sua região pagam para alguém resolver.",
  },
  produto: {
    key: "produto",
    code: "02",
    name: "Expertise Builder",
    model: "Produto próprio",
    statement:
      "Seu perfil indica transformar o que você domina em um produto enxuto com o seu nome. Validar a demanda primeiro, produzir depois — nada de meses gravando antes da primeira venda.",
    objective: ["Escolher 1 recorte", "desenhar 1 produto enxuto", "pré-vender antes de produzir"],
    day01: "Anotar as 10 perguntas que as pessoas mais te fazem sobre o seu assunto.",
  },
  bastidor: {
    key: "bastidor",
    code: "03",
    name: "Backstage Builder",
    model: "Coprodução",
    statement:
      "Seu perfil indica construir por trás de quem já tem audiência. Especialistas com público e sem estrutura existem aos montes — você entra com a oferta, o funil e a rotina que eles não montam.",
    objective: ["Mapear 1 especialista", "estruturar 1 oferta", "propor 1 projeto-piloto"],
    day01: "Mapear 10 especialistas com audiência e sem produto estruturado.",
  },
  distribuicao: {
    key: "distribuicao",
    code: "04",
    name: "Distribution Builder",
    model: "Distribuição de produtos validados",
    statement:
      "Seu perfil indica começar distribuindo o que já existe. Sem produto próprio, sem rosto, sem estoque — o ativo que você constrói é o canal, e canal se constrói com constância.",
    objective: ["Escolher 1 nicho", "escolher 1 produto", "abrir 1 canal de distribuição"],
    day01: "Escolher um nicho e três produtos validados nele para comparar.",
  },
};

const ORDER: RouteKey[] = ["distribuicao", "bastidor", "servico", "produto"];

/** answers[i] = índice da opção escolhida na pergunta i. */
export function scoreAnswers(answers: number[]): RouteKey {
  const total: Record<RouteKey, number> = { distribuicao: 0, bastidor: 0, servico: 0, produto: 0 };
  answers.forEach((optIdx, qIdx) => {
    const w = QUESTIONS[qIdx]?.options[optIdx]?.w ?? {};
    for (const k of Object.keys(w) as RouteKey[]) total[k] += w[k] ?? 0;
  });
  // Empate: vence a rota de menor barreira de entrada (ordem de ORDER).
  return ORDER.reduce((best, k) => (total[k] > total[best] ? k : best), ORDER[0]);
}

/** Frase montada com as próprias respostas — o "isso foi feito para mim". */
export function personalLine(answers: number[]): string {
  const [a, b, c] = answers.map((opt, q) => QUESTIONS[q].options[opt].trait);
  return `Você parte ${a}, ${b} e tem ${c}.`;
}

/** Código compacto das respostas (ex.: "102") — viaja no checkout e alimenta o app. */
export function encodeAnswers(answers: number[]): string {
  return answers.join("");
}

export function decodeAnswers(code: string): number[] | null {
  if (!/^\d+$/.test(code) || code.length !== QUESTIONS.length) return null;
  const arr = code.split("").map(Number);
  return arr.every((v, i) => v < QUESTIONS[i].options.length) ? arr : null;
}

/** O 7-Day Build: cada dia produz um entregável. Base do app. */
export const BUILD_DAYS = [
  { code: "DAY 01", name: "FIND", task: "Escolha sua direção e defina o que você vai construir.", output: "Minha direção" },
  { code: "DAY 02", name: "PROBLEM", task: "Encontre um problema específico que vale a pena resolver.", output: "O problema que vou resolver" },
  { code: "DAY 03", name: "OFFER", task: "Transforme o problema em uma oferta clara.", output: "Minha oferta" },
  { code: "DAY 04", name: "MVP", task: "Defina a menor versão capaz de entregar o resultado prometido.", output: "MVP definido" },
  { code: "DAY 05", name: "POSITION", task: "Construa seu posicionamento, promessa e mensagem.", output: "Meu posicionamento" },
  { code: "DAY 06", name: "DISTRIBUTE", task: "Defina como colocar sua oferta diante das pessoas certas.", output: "Meu plano de distribuição" },
  { code: "DAY 07", name: "LAUNCH", task: "Coloque sua oferta no mercado e comece a executar.", output: "Oferta pronta para o mercado" },
] as const;
