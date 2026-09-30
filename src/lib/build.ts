// Conteúdo do 7-Day Build: cada dia = entender → fazer → finalizar (+ ferramentas para copiar).
// É o produto. Editar texto aqui não exige mexer em nenhuma tela.

import { ROUTES, type RouteKey } from "./quiz";

export type Answers = Record<string, string>;

export type Field = {
  id: string;
  label: string;
  hint?: string;
  multiline?: boolean;
};

export type Tool = { title: string; body: string };

export type Day = {
  n: number;
  code: string;
  name: string;
  title: string;
  objective: string;
  understand: string[];
  fields: Field[];
  /** Monta o entregável do dia a partir das respostas. */
  finalize: (a: Answers, route: RouteKey) => string;
  outputLabel: string;
  tools: Tool[];
};

const v = (a: Answers, k: string, fallback = "…") => (a[k] || "").trim() || fallback;

export const DAY01_EXAMPLES: Record<RouteKey, string> = {
  servico: "Ex.: “Atendimento automático com IA no WhatsApp para clínicas de estética”.",
  produto: "Ex.: “Guia prático de planilhas financeiras para quem é MEI”.",
  bastidor: "Ex.: “Estruturar a primeira oferta digital de nutricionistas com audiência”.",
  distribuicao: "Ex.: “Distribuir produtos de organização pessoal num perfil de rotina produtiva”.",
};

export const DAYS: Day[] = [
  {
    n: 1,
    code: "DAY 01",
    name: "FIND",
    title: "Escolha sua direção",
    objective: "Sair com uma direção só — e a decisão do que você não vai fazer nestes 7 dias.",
    understand: [
      "Quem tem quinze ideias não tem nenhuma. O problema quase nunca é falta de opção: é excesso. Cada ideia nova parece melhor que a anterior justamente porque ainda não foi testada — e é por isso que nenhuma sai do papel.",
      "O quiz já te deu um ponto de partida. Ele cruzou o que você já tem, como prefere aparecer e o ritmo possível agora. Hoje você transforma essa rota numa direção concreta: um tipo de solução, para um público que você consegue alcançar.",
      "Uma boa direção passa em três filtros. Acesso: você consegue falar com essas pessoas esta semana? Capacidade: você consegue entregar algo útil com o que já sabe, ou aprende rápido? Pagamento: esse público já gasta dinheiro para resolver problemas parecidos?",
      "Não procure a direção perfeita. Procure a que você consegue testar em 7 dias. Direção não é casamento — é hipótese. No DAY 07 você vai ter dados reais para decidir se continua, ajusta ou troca.",
      "A parte mais importante de hoje é o corte. Escreva o que você não vai fazer. Sem isso, amanhã aparece uma ideia nova e o ciclo recomeça.",
    ],
    fields: [
      { id: "direcao", label: "Sua direção em uma frase", hint: "Tipo de solução + para quem." },
      { id: "publico", label: "Para quem, especificamente", hint: "Um público que você consegue alcançar esta semana." },
      { id: "vantagem", label: "Por que você", hint: "O que você já tem: habilidade, acesso, experiência, ferramenta.", multiline: true },
      { id: "corte", label: "O que você NÃO vai fazer nestes 7 dias", hint: "Ideias, canais e tarefas que ficam para depois.", multiline: true },
    ],
    finalize: (a) =>
      `Vou construir ${v(a, "direcao")} para ${v(a, "publico")}.\nParto de: ${v(a, "vantagem")}.\nNos próximos 7 dias, não vou: ${v(a, "corte")}.`,
    outputLabel: "Minha direção",
    tools: [
      {
        title: "Filtro de direção (nota de 1 a 5)",
        body: "1. Acesso — consigo falar com esse público esta semana?\n2. Dor — o problema incomoda de verdade, com frequência?\n3. Pagamento — esse público já paga por soluções parecidas?\n4. Capacidade — consigo entregar algo útil com o que já sei?\n5. Velocidade — dá para testar em 7 dias?\n\nSome as notas. Abaixo de 15: troque a direção. Empate: fique com a de maior nota em Acesso.",
      },
    ],
  },
  {
    n: 2,
    code: "DAY 02",
    name: "PROBLEM",
    title: "Escolha o problema específico",
    objective: "Sair com um problema escrito na linguagem de quem sente — e evidência de que ele existe.",
    understand: [
      "Ninguém compra “marketing”, “IA” ou “organização”. As pessoas compram o fim de um incômodo específico: “perco clientes porque demoro a responder no WhatsApp”, “não sei quanto sobra no fim do mês”.",
      "Um problema bom para começar tem três características. É específico — dá para descrever numa frase sem jargão. É frequente — acontece toda semana, não uma vez por ano. E é caro — custa tempo, dinheiro ou oportunidade de um jeito que a pessoa percebe.",
      "Escreva o problema como o cliente falaria, não como um especialista. “Baixa taxa de conversão no atendimento” é a sua linguagem. “Mando orçamento e a pessoa some” é a dele. Oferta escrita na linguagem do cliente vende sozinha; na sua, precisa ser explicada.",
      "Olhe também como ele resolve hoje. Se ninguém tenta resolver, talvez não doa o suficiente. Se todos resolvem mal — com gambiarra, planilha improvisada, alguém da família — é aí que você entra.",
      "Evidência vale mais que opinião. Hoje, procure pelo menos três sinais reais: uma conversa, um comentário, uma reclamação pública, uma pergunta repetida em grupo.",
    ],
    fields: [
      { id: "problema", label: "O problema, na linguagem do cliente", hint: "Como ele falaria numa mensagem." },
      { id: "quem", label: "Quem sente isso com mais intensidade" },
      { id: "hoje", label: "Como ele resolve hoje — e por que isso é ruim", multiline: true },
      { id: "custo", label: "Quanto custa não resolver", hint: "Tempo, dinheiro, clientes perdidos, estresse." },
      { id: "evidencia", label: "3 evidências reais", hint: "Onde você viu ou ouviu isso.", multiline: true },
    ],
    finalize: (a) =>
      `${v(a, "quem")} sofre com: “${v(a, "problema")}”.\nHoje resolve assim: ${v(a, "hoje")}.\nCusto de não resolver: ${v(a, "custo")}.\nEvidências: ${v(a, "evidencia")}.`,
    outputLabel: "O problema que vou resolver",
    tools: [
      {
        title: "Script de conversa de descoberta (DM)",
        body: "Oi, [nome]! Estou estudando como [público] lida com [tema] e queria te ouvir — são 3 perguntas rápidas, sem venda nenhuma. Pode ser?\n\n1. Qual a parte mais chata de [tema] no seu dia a dia hoje?\n2. Como você resolve isso atualmente?\n3. Se isso sumisse amanhã, o que mudaria para você?\n\nObrigado! Se eu montar algo para resolver isso, posso te mostrar primeiro?",
      },
      {
        title: "Onde procurar problemas reais",
        body: "• Comentários em vídeos e posts do seu nicho\n• Avaliações de 2 e 3 estrelas de produtos concorrentes\n• Perguntas repetidas em grupos de WhatsApp, Facebook e Reddit\n• O que as pessoas te perguntam com frequência\n• Reclamações no Reclame Aqui do setor",
      },
    ],
  },
  {
    n: 3,
    code: "DAY 03",
    name: "OFFER",
    title: "Transforme o problema em oferta",
    objective: "Sair com uma oferta que alguém consegue entender e comprar em uma leitura.",
    understand: [
      "Existe uma diferença enorme entre “tenho uma ideia” e “tenho algo que alguém pode comprar”. A ponte entre as duas é a oferta: quem compra, o que recebe, que resultado alcança e quanto paga.",
      "Uma oferta clara responde cinco perguntas sem esforço. Para quem é? Que problema resolve? O que exatamente a pessoa recebe? Qual resultado ela pode esperar? Por que o seu jeito funciona — o mecanismo?",
      "O mecanismo é o que te diferencia. Não é um nome bonito: é o seu caminho específico até o resultado. “Atendimento com IA” é genérico. “Respostas automáticas treinadas com as 30 perguntas mais comuns da sua clínica, em 48 horas” é um mecanismo.",
      "Sobre preço: no começo, o objetivo é validar, não maximizar. Escolha um preço que você consiga defender olhando o custo do problema que escreveu ontem. Se o problema custa R$ 2.000 por mês ao cliente, R$ 500 é fácil de justificar.",
      "Resultado prometido precisa ser controlável. Prometa o que depende de você entregar — não o que depende do mercado, da sorte ou do cliente.",
    ],
    fields: [
      { id: "quem", label: "Quem compra" },
      { id: "problema", label: "Qual problema você resolve" },
      { id: "entrega", label: "O que a pessoa recebe", hint: "Formato, prazo, quantidade.", multiline: true },
      { id: "resultado", label: "Resultado que ela pode esperar", hint: "Controlável — depende de você entregar." },
      { id: "mecanismo", label: "Seu mecanismo", hint: "O seu caminho específico até o resultado." },
      { id: "preco", label: "Preço e por quê" },
    ],
    finalize: (a) =>
      `Eu ajudo ${v(a, "quem")} a ${v(a, "resultado")}, resolvendo ${v(a, "problema")}.\nComo: ${v(a, "mecanismo")}.\nVocê recebe: ${v(a, "entrega")}.\nInvestimento: ${v(a, "preco")}.`,
    outputLabel: "Minha oferta",
    tools: [
      {
        title: "Template de oferta (uma página)",
        body: "OFERTA: [nome]\n\nPara: [quem compra]\nProblema: [na linguagem do cliente]\nResultado: [o que muda — controlável]\nMecanismo: [seu caminho específico]\nVocê recebe:\n• [entrega 1]\n• [entrega 2]\n• [entrega 3]\nPrazo: [quando]\nInvestimento: [preço]\nCondição: [garantia ou condição de entrada]",
      },
      {
        title: "Prompt de IA — testar a clareza da oferta",
        body: "Você é um potencial cliente cético do público [público]. Leia a oferta abaixo e responda: 1) Em uma frase, o que está sendo vendido? 2) O que ficou confuso? 3) Qual é a sua maior objeção para comprar? 4) Que pergunta você faria antes de pagar?\n\nOFERTA:\n[cole sua oferta]",
      },
    ],
  },
  {
    n: 4,
    code: "DAY 04",
    name: "MVP",
    title: "Defina o menor produto possível",
    objective: "O objetivo hoje não é construir tudo. É definir a menor versão capaz de entregar o resultado prometido.",
    understand: [
      "MVP não é uma versão ruim do produto. É a versão mais enxuta que ainda entrega o resultado que você prometeu ontem. Tudo o que não contribui diretamente para esse resultado é excesso — por enquanto.",
      "O erro clássico é inverter a ordem: passar três meses construindo logo, site, plataforma e automação antes de ter o primeiro cliente. Quando o produto fica pronto, descobre-se que o mercado queria outra coisa.",
      "Pergunte, item por item: se eu tirar isso, o cliente ainda alcança o resultado? Se sim, sai. O que sobra é o seu MVP. Muitas vezes ele é quase artesanal: você entrega manualmente, com uma planilha, uma call, um documento, uma ferramenta pronta ou IA — e automatiza depois.",
      "Se a sua direção envolve software, ele pode estar em construção. Tudo bem. O que precisa estar definido hoje é o escopo da primeira entrega, como ela chega ao cliente e quando fica pronta.",
      "Escreva também o que fica para a versão 2. Não é desistir dessas ideias — é dar um lugar para elas, para que parem de competir com o que precisa ser feito agora.",
    ],
    fields: [
      { id: "resultado", label: "O resultado prometido", hint: "Copie da sua oferta." },
      { id: "tudo", label: "Tudo o que você imaginou colocar", multiline: true },
      { id: "minimo", label: "O mínimo que ainda entrega o resultado", multiline: true },
      { id: "como", label: "Como vai entregar", hint: "Manual, planilha, call, documento, ferramenta pronta, IA." },
      { id: "v2", label: "O que fica para a versão 2", multiline: true },
      { id: "prazo", label: "Quando a primeira entrega fica pronta" },
    ],
    finalize: (a) =>
      `MVP: ${v(a, "minimo")}\nEntrega via: ${v(a, "como")}.\nResultado: ${v(a, "resultado")}.\nFica para a versão 2: ${v(a, "v2")}.\nPrimeira entrega pronta até: ${v(a, "prazo")}.`,
    outputLabel: "MVP definido",
    tools: [
      {
        title: "Formatos de MVP por rota",
        body: "AI Service Builder — entrega manual assistida por IA para 1 cliente, com escopo fechado.\nExpertise Builder — pré-venda + 1 encontro ao vivo ou documento-guia; grava depois.\nBackstage Builder — projeto-piloto com 1 especialista, divisão de resultado combinada.\nDistribution Builder — 1 canal + 1 produto + 1 página de recomendação honesta.",
      },
      {
        title: "Prompt de IA — cortar escopo",
        body: "Vou te passar uma oferta e a lista de tudo que imaginei incluir. Para cada item, diga se ele é ESSENCIAL para o cliente alcançar o resultado prometido ou se pode ficar para uma versão 2. Seja rigoroso: na dúvida, corte.\n\nOFERTA:\n[cole]\n\nLISTA:\n[cole]",
      },
    ],
  },
  {
    n: 5,
    code: "DAY 05",
    name: "POSITION",
    title: "Posicionamento, promessa e mensagem",
    objective: "Sair com a mensagem que vai para a página, para a bio e para cada conteúdo.",
    understand: [
      "Posicionamento é a resposta rápida para “por que eu deveria prestar atenção nisso?”. Se a pessoa precisa ler três parágrafos para entender, você já perdeu. A mensagem tem que caber em uma linha — e ser repetida em todo lugar.",
      "Comece pela headline. Ela nomeia o resultado para um público específico: “Pare de perder pacientes por demora no WhatsApp”. Depois a subheadline explica como: o mecanismo, o prazo, o formato.",
      "Uma promessa forte é específica e controlável. “Mude sua vida” não diz nada. “Seu atendimento respondendo em até 1 minuto, 24 horas por dia, configurado em 48 horas” diz exatamente o que a pessoa leva.",
      "Escolha um único CTA — a única ação que você quer que a pessoa tome. Chamar no WhatsApp, comentar uma palavra, clicar no link. Dois CTAs dividem a atenção; nenhum converte.",
      "No fim de hoje, você terá o esqueleto da sua página e a sua bio. Não precisa estar perfeito. Precisa estar publicado amanhã e ajustado com o que o mercado responder.",
    ],
    fields: [
      { id: "headline", label: "Headline", hint: "Resultado + para quem, em uma linha." },
      { id: "sub", label: "Subheadline", hint: "Como: mecanismo, prazo, formato." },
      { id: "promessa", label: "Promessa (específica e controlável)" },
      { id: "beneficios", label: "3 benefícios", hint: "Um por linha.", multiline: true },
      { id: "cta", label: "CTA — a única ação" },
      { id: "bio", label: "Bio do Instagram", hint: "Linha 1: o que você faz para quem. Linha 2: prova ou diferencial. Linha 3: CTA.", multiline: true },
    ],
    finalize: (a) =>
      `${v(a, "headline")}\n${v(a, "sub")}\n\nPromessa: ${v(a, "promessa")}\n\nBenefícios:\n${v(a, "beneficios")}\n\nCTA: ${v(a, "cta")}\n\nBio:\n${v(a, "bio")}`,
    outputLabel: "Meu posicionamento",
    tools: [
      {
        title: "Template de página (estrutura)",
        body: "1. Headline — resultado + público\n2. Subheadline — mecanismo, prazo, formato\n3. O problema — na linguagem do cliente (DAY 02)\n4. A solução — sua oferta e o mecanismo (DAY 03)\n5. O que você recebe — lista objetiva\n6. Para quem é / para quem não é\n7. Como funciona — 3 passos\n8. Prova — conversas, resultados, bastidores (só o que for real)\n9. Investimento — preço claro, sem âncora inventada\n10. FAQ — as 3 objeções que você mais ouve\n11. CTA — a única ação",
      },
      {
        title: "Prompt de IA — 10 headlines",
        body: "Escreva 10 headlines para a oferta abaixo. Regras: até 12 palavras, nomeie um resultado concreto para o público, sem promessa de renda, sem exagero, sem emoji. Depois, indique as 3 mais claras e explique por quê.\n\nOFERTA:\n[cole]",
      },
    ],
  },
  {
    n: 6,
    code: "DAY 06",
    name: "DISTRIBUTE",
    title: "Coloque pessoas diante da oferta",
    objective: "Sair com 1 canal, 3 hooks, 3 conteúdos e 1 CTA prontos para publicar.",
    understand: [
      "Uma oferta que ninguém vê não existe. Distribuição é o trabalho de colocar a sua mensagem na frente das pessoas certas com frequência — e, no começo, isso não precisa de anúncio.",
      "Escolha um canal só. O melhor é aquele onde o seu público já está e onde você consegue publicar com constância. Instagram, TikTok, YouTube, grupos, LinkedIn, abordagem direta — um, não cinco.",
      "Todo conteúdo que vende segue uma estrutura simples: Hook (para o scroll nos primeiros segundos) → Problema (a pessoa se reconhece) → Insight (algo útil que muda a forma de ver) → CTA (a próxima ação). É a mesma estrutura dos vídeos que te trouxeram até aqui.",
      "O hook é 80% do trabalho. Ele nasce do problema que você escreveu no DAY 02, na linguagem do cliente. “Se você manda orçamento e o cliente some, assiste isso” funciona porque a pessoa se vê na frase.",
      "Termine com um CTA de conversa — comentar uma palavra, chamar no direct. Conversa é onde a venda acontece, e é o que você vai fazer amanhã.",
    ],
    fields: [
      { id: "canal", label: "Canal principal" },
      { id: "hooks", label: "3 hooks", hint: "Um por linha, na linguagem do cliente.", multiline: true },
      { id: "conteudos", label: "3 ideias de conteúdo", hint: "Hook → Problema → Insight → CTA.", multiline: true },
      { id: "cta", label: "CTA / palavra-chave", hint: "Ex.: “Comenta AGENDA que te mando como funciona”." },
      { id: "frequencia", label: "Frequência nos próximos 7 dias" },
    ],
    finalize: (a) =>
      `Canal: ${v(a, "canal")} · ${v(a, "frequencia")}\n\nHooks:\n${v(a, "hooks")}\n\nConteúdos:\n${v(a, "conteudos")}\n\nCTA: ${v(a, "cta")}`,
    outputLabel: "Meu plano de distribuição",
    tools: [
      {
        title: "Estrutura de vídeo curto (HPIC)",
        body: "0–3s  HOOK — uma frase que o público reconhece como dele\n3–10s PROBLEMA — a situação concreta, sem jargão\n10–40s INSIGHT — o erro comum e o que muda quando se faz diferente\n40–60s CTA — uma ação: “Comenta [PALAVRA] que te mando…”",
      },
      {
        title: "12 hooks base para adaptar",
        body: "1. Se você [situação do problema], assiste isso.\n2. O erro que faz [público] [consequência] sem perceber.\n3. Pare de [ação comum]. Faça isso no lugar.\n4. Ninguém te conta isso sobre [tema].\n5. Como eu resolveria [problema] se começasse hoje.\n6. [Público]: isso está te custando [custo].\n7. 3 sinais de que [problema] já está acontecendo com você.\n8. A diferença entre quem [resultado] e quem não.\n9. Eu testei [solução] por [prazo]. O que aconteceu:\n10. Você não precisa de [coisa cara]. Precisa de [coisa simples].\n11. O jeito mais rápido de [resultado] em [prazo].\n12. Isso aqui resolve [problema] em [tempo].",
      },
    ],
  },
  {
    n: 7,
    code: "DAY 07",
    name: "LAUNCH",
    title: "Coloque no mercado",
    objective: "Publicar. Sair do dia de hoje com a oferta no ar e as primeiras conversas começando.",
    understand: [
      "Hoje não tem teoria nova. Tem publicação. Tudo o que você construiu nos últimos seis dias só vira ativo quando encontra o mercado — e o mercado só responde ao que existe.",
      "Publicar é colocar três coisas no ar: a oferta (página, post fixado ou mensagem pronta), o primeiro conteúdo com CTA e a lista das primeiras pessoas que você vai abordar diretamente.",
      "Abordagem direta não é spam. É conversa com quem tem o problema: pessoas que comentaram, que você conhece, que estão nos grupos certos. Comece pelas 10 mais prováveis. Use o script de venda por DM abaixo — ele conduz da conversa à oferta sem pressão.",
      "Escolha uma métrica para acompanhar nos próximos 7 dias: conversas iniciadas, propostas enviadas ou vendas. Uma. É ela que vai te dizer se a direção se sustenta ou precisa de ajuste.",
      "Depois de publicar, faça o Build Score. Ele não é uma nota: é um retrato de onde você está — e do próximo passo que faz sentido para você.",
    ],
    fields: [
      { id: "link", label: "Onde sua oferta está publicada", hint: "Link da página, post fixado ou mensagem pronta." },
      { id: "post", label: "Primeiro conteúdo: data e hora" },
      { id: "lista", label: "As 10 primeiras pessoas para abordar", hint: "Uma por linha.", multiline: true },
      { id: "metrica", label: "A métrica que você vai acompanhar" },
      { id: "revisao", label: "Data da revisão (daqui a 7 dias)" },
    ],
    finalize: (a) =>
      `Oferta no ar: ${v(a, "link")}\nPrimeiro conteúdo: ${v(a, "post")}\nMétrica: ${v(a, "metrica")}\nRevisão: ${v(a, "revisao")}\n\nPrimeiras abordagens:\n${v(a, "lista")}`,
    outputLabel: "Oferta pronta para o mercado",
    tools: [
      {
        title: "Script de venda por DM",
        body: "ABERTURA\nOi, [nome]! Vi que você [contexto — comentou, trabalha com, postou sobre]. Posso te fazer uma pergunta rápida?\n\nQUALIFICAÇÃO\nHoje, como você lida com [problema]? … E isso te custa mais tempo ou dinheiro?\n\nPONTE\nFaz sentido. Eu montei [oferta] justamente para [público] que [problema]. Funciona assim: [mecanismo em 1 frase].\n\nOFERTA\nO investimento é [preço] e você recebe [entrega principal]. Quer que eu te mande os detalhes?\n\nFOLLOW-UP (48h depois, sem resposta)\nOi, [nome]! Passando para saber se ficou alguma dúvida sobre [oferta]. Se não for o momento, tudo bem também.",
      },
      {
        title: "Objeções comuns",
        body: "“Está caro.” → Comparado a quê? Quanto custa hoje não resolver [problema]?\n“Vou pensar.” → Claro. O que precisaria estar claro para você decidir?\n“Não tenho tempo.” → Por isso a entrega é [formato enxuto]. Quanto tempo você perde hoje com [problema]?\n“Funciona para mim?” → Funciona para quem [critério]. É o seu caso?",
      },
      {
        title: "Checklist de lançamento",
        body: "☐ Oferta escrita e publicada\n☐ Bio atualizada com o CTA\n☐ Primeiro conteúdo publicado\n☐ 10 abordagens diretas enviadas\n☐ Respostas registradas numa planilha (nome, canal, etapa, próximo passo)\n☐ Métrica definida\n☐ Data de revisão na agenda",
      },
    ],
  },
];

export function routeName(key: RouteKey | null | undefined) {
  return key ? ROUTES[key].name : null;
}

/** Build Score: 7 critérios objetivos, respondidos no DAY 07. */
export const SCORE_QUESTIONS = [
  "Você definiu uma direção?",
  "Você escolheu um problema específico?",
  "Você tem uma oferta escrita?",
  "Seu MVP está definido?",
  "Seu posicionamento está pronto?",
  "Você definiu como distribuir?",
  "Você colocou a oferta no mercado?",
];

export const LEVELS = {
  1: { code: "BUILD 01", title: "Você começou.", text: "A base existe. O próximo passo é fechar os dias que ficaram abertos e publicar." },
  2: { code: "BUILD 02", title: "Você construiu.", text: "A oferta existe. Falta o passo que transforma construção em ativo: colocar no mercado." },
  3: { code: "BUILD 03", title: "Você colocou no mercado.", text: "You built something. Now let's build something bigger." },
} as const;

export type Level = keyof typeof LEVELS;

/** yes[i] = resposta da pergunta i. BUILD 03 exige oferta no mercado. */
export function computeLevel(yes: boolean[]): { score: number; level: Level } {
  const score = yes.filter(Boolean).length;
  const launched = yes[SCORE_QUESTIONS.length - 1];
  const level: Level = launched && score >= 6 ? 3 : score >= 4 ? 2 : 1;
  return { score, level };
}
