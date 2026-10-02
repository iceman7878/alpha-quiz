// CONTEÚDO DO PRODUTO — só servidor. Importado apenas por /api/build/content, que exige
// sessão válida + access_status = active. Nunca importar em componente client.
//
// Estrutura de cada dia (V2): THE IDEA → THE PRINCIPLE → THE METHOD → SEE IT → FIELD NOTE
// → YOUR MOVE (campos) → YOUR OUTPUT (finalize) → NEXT MOVE → Arsenal (consulta).
// IDs de campo são estáveis: mudar um id apaga a resposta já salva de quem comprou.

import type { RouteKey } from "./quiz";
import type { Day } from "./build";

export const DAY01_EXAMPLES: Record<RouteKey, string> = {
  servico: "Ex.: “Respostas automáticas no WhatsApp para clínicas de estética da minha cidade”.",
  produto: "Ex.: “Planilha mensal para MEI que mistura a conta pessoal com a da empresa”.",
  bastidor: "Ex.: “Montar a primeira oferta digital de nutricionistas com audiência e sem produto”.",
  distribuicao: "Ex.: “Perfil de rotina de estudante que recomenda ferramentas de organização já validadas”.",
};

export const DAYS: Day[] = [
  // ───────────────────────────── DAY 01
  {
    n: 1,
    code: "DAY 01",
    name: "FIND",
    title: "Escolha sua direção",
    objective: "Sair com uma direção — solução, público e hipótese — e com a lista do que fica de fora nestes 7 dias.",
    idea: "Você não está sem ideia. Está com ideias demais — e cada ideia nova parece melhor que a anterior só porque ainda não foi testada.",
    principle: [
      "Ideia é um tema: “IA”, “finanças”, “nutrição”. Ninguém consegue comprar um tema. Direção é uma frase que junta três coisas: uma solução concreta, um público que você consegue alcançar e uma hipótese que dá para testar em 7 dias.",
      "Direção não é casamento. É uma aposta pequena, com prazo. Você não está decidindo o que vai fazer pelo resto da vida — está decidindo o que vai testar até o DAY 07. Quando a decisão fica pequena, ela fica possível.",
      "Quem troca de ideia toda semana não está sendo flexível: está fugindo do teste. Toda ideia é ótima até encontrar o mercado. O corte que você escreve hoje é o que impede a próxima ideia brilhante de sequestrar a sua semana.",
    ],
    method: [
      {
        title: "Liste 3 candidatas",
        text: "Escreva três direções no formato “solução para público”. Use a rota do quiz como ponto de partida — ela já cruzou o que você tem, como prefere aparecer e o ritmo possível agora. Comparar três é o que revela a melhor; uma sozinha sempre parece boa.",
      },
      {
        title: "Dê nota de 1 a 5 em cinco filtros",
        text: "Para cada candidata. Seja duro: nota 3 quer dizer “talvez”.",
        points: [
          "Acesso — consigo falar com 10 pessoas desse público esta semana? Por mensagem, no bairro, no meu círculo, num grupo.",
          "Dor — o problema incomoda com frequência? Toda semana, não uma vez por ano.",
          "Pagamento — esse público já gasta dinheiro com algo parecido? Se já paga por uma solução ruim, existe espaço para uma boa.",
          "Capacidade — consigo entregar algo útil com o que sei hoje, ou aprendo em poucos dias?",
          "Velocidade — dá para colocar uma primeira versão na frente de alguém em 7 dias?",
        ],
      },
      {
        title: "Corte o que fica abaixo de 15",
        text: "Some as notas. Abaixo de 15, a candidata sai. Se duas empatarem, fique com a de maior nota em Acesso: no começo, quem você consegue alcançar importa mais do que o tamanho do mercado.",
      },
      {
        title: "Escreva a hipótese",
        text: "Transforme a vencedora numa frase que pode estar errada: “Acredito que [público] pagaria por [solução] porque [motivo]”. Ela vai ser confirmada ou derrubada por conversas reais — não pela sua opinião.",
      },
      {
        title: "Escreva o corte",
        text: "Liste o que você não vai fazer nos próximos 7 dias: as outras ideias, outros canais, curso novo, logo, site. Sem corte, a direção vira só mais uma ideia na fila.",
      },
    ],
    seeIt: {
      before: "Ideia",
      after: "Direção",
      examples: [
        {
          route: "servico",
          before: "Trabalhar com IA.",
          after: "Respostas automáticas no WhatsApp para clínicas de estética da minha cidade.",
          why: "Tem solução (respostas automáticas), público (clínicas de estética) e acesso (da minha cidade — dá para visitar ou mandar mensagem amanhã).",
        },
        {
          route: "produto",
          before: "Ensinar finanças.",
          after: "Uma planilha mensal para MEI que mistura a conta pessoal com a da empresa.",
          why: "“Finanças” não se vende; “separar as contas” sim. O público é estreito e o problema é concreto o bastante para virar produto.",
        },
        {
          route: "bastidor",
          before: "Ajudar experts a vender.",
          after: "Montar a primeira oferta digital de nutricionistas com 5 a 20 mil seguidores e nenhum produto.",
          why: "Define quem (nutricionistas), o porte (5–20 mil) e a lacuna (sem produto). Dá para listar 30 perfis assim em uma hora.",
        },
        {
          route: "distribuicao",
          before: "Ser afiliado de alguma coisa.",
          after: "Um perfil sobre rotina de estudante que recomenda ferramentas de organização já validadas.",
          why: "O ativo é o canal (o perfil) e o critério de produto é claro (já validadas). Não depende de criar nada do zero.",
        },
      ],
    },
    fieldNote: "Você não precisa da ideia perfeita. Precisa de uma hipótese que consiga testar.",
    fields: [
      { id: "direcao", label: "Sua direção em uma frase", hint: "Solução + para quem." },
      { id: "publico", label: "Para quem, especificamente", hint: "Específico o bastante para você conseguir listar 10 pessoas." },
      { id: "vantagem", label: "Por que você", hint: "O que você já tem: habilidade, acesso, experiência, ferramenta. Uma vantagem pequena basta.", multiline: true },
      { id: "corte", label: "O que você NÃO vai fazer nestes 7 dias", hint: "Ideias, canais e tarefas que ficam para depois.", multiline: true },
    ],
    finalize: `Vou construir {direcao} para {publico}.\nParto de: {vantagem}.\nNos próximos 7 dias, não vou: {corte}.\n\nHipótese a testar até o DAY 07.`,
    outputLabel: "Minha direção",
    nextMove: {
      action: "Anote 5 pessoas do seu público com quem você consegue falar esta semana.",
      text: "Nome e onde encontrar cada uma. Elas são o começo do seu First 10 — amanhã você conversa com três delas.",
    },
    tools: [
      {
        title: "Filtro de direção (nota de 1 a 5)",
        body: "CANDIDATA: ______________________\n\nAcesso       __ / 5\nDor          __ / 5\nPagamento    __ / 5\nCapacidade   __ / 5\nVelocidade   __ / 5\n\nTOTAL        __ / 25\n\nAbaixo de 15: troque.\nEmpate: fique com a de maior nota em Acesso.",
      },
      {
        title: "Prompt de IA — gerar candidatas",
        body: "Quero escolher uma direção para testar em 7 dias. Minha rota: [rota do quiz]. O que eu já sei fazer / tenho acesso: [descreva]. Liste 10 direções no formato “solução concreta para público específico”. Para cada uma, dê nota de 1 a 5 em acesso, dor, pagamento, capacidade e velocidade, considerando o que eu disse. Não prometa renda; seja realista.",
      },
    ],
  },

  // ───────────────────────────── DAY 02
  {
    n: 2,
    code: "DAY 02",
    name: "PROBLEM",
    title: "Encontre o problema que vale resolver",
    objective: "Sair com um problema escrito na linguagem de quem sente — e com frases reais que provam que ele existe.",
    idea: "Ninguém compra IA, marketing ou organização. As pessoas compram o fim de um incômodo que elas mesmas conseguem descrever.",
    principle: [
      "Todo problema tem três camadas. O sintoma é o que aparece na superfície: “vendo pouco”, “vivo cansado”. O problema percebido é o que a pessoa acha que está errado: “preciso de mais seguidores”. O problema real é o que gera comportamento — aquilo que ela já tentou resolver, já gastou dinheiro, já reclamou com alguém.",
      "Você vende para o problema real, mas fala na linguagem do problema percebido. Por isso o trabalho de hoje é ouvir, não supor. A sua hipótese de ontem precisa encontrar pessoas reais.",
      "Problema que gera pagamento tem três marcas: é frequente (acontece toda semana), é caro (custa tempo, dinheiro ou clientes de um jeito que a pessoa percebe) e já tem uma solução ruim no lugar — uma gambiarra, uma planilha improvisada, um sobrinho que “mexe com isso”. Se ninguém tenta resolver, talvez não doa o suficiente.",
    ],
    method: [
      {
        title: "Observar",
        text: "Antes de falar com alguém, olhe onde as pessoas já reclamam sozinhas. Copie as frases exatamente como estão escritas — com os erros, as gírias e a irritação.",
        points: [
          "Comentários em posts e vídeos do seu nicho.",
          "Avaliações de 1 a 3 estrelas de concorrentes no Google, em marketplaces e no Reclame Aqui.",
          "Perguntas repetidas em grupos, comunidades e fóruns.",
          "O que as pessoas já te perguntam com frequência.",
        ],
      },
      {
        title: "Perguntar",
        text: "Converse com as pessoas da lista de ontem. Pergunte sobre o que já aconteceu, nunca sobre o que elas fariam. “Você pagaria por isso?” gera educação, não verdade. “Qual foi a última vez que isso aconteceu?” gera fatos. O roteiro está logo abaixo.",
      },
      {
        title: "Ouvir",
        text: "Fale pouco. Anote as palavras exatas, principalmente quando a pessoa se irrita, ri de nervoso ou diz “sempre” e “toda vez”. Essas frases viram seus hooks no DAY 06 e a sua headline no DAY 05.",
      },
      {
        title: "Identificar o padrão",
        text: "Uma reclamação é anedota. A mesma reclamação em três pessoas que não se conhecem é um padrão. Só padrão conta como evidência — o resto é opinião, inclusive a sua.",
      },
      {
        title: "Formular",
        text: "Escreva o problema como o cliente escreveria numa mensagem. Se você precisa de jargão para descrever, ainda é a sua linguagem, não a dele.",
      },
    ],
    scripts: [
      {
        title: "Conversa de descoberta",
        intro: "Por mensagem ou ao vivo, 10 a 15 minutos. Você não está vendendo — está aprendendo. Não apresente a sua solução durante a conversa: no momento em que você fala da sua ideia, a pessoa passa a ser educada em vez de honesta.",
        lines: [
          { who: "voce", text: "Oi, [nome]! Estou estudando como [público] lida com [tema] e queria te ouvir. São 5 perguntas, sem venda nenhuma. Pode ser?", note: "Contexto honesto + pedido pequeno." },
          { who: "voce", text: "Qual foi a última vez que [problema] aconteceu com você? Me conta como foi.", note: "Um acontecimento do passado, não uma opinião." },
          { who: "voce", text: "O que você já tentou para resolver?", note: "Quem sofre de verdade já tentou alguma coisa." },
          { who: "voce", text: "E por que não funcionou direito?", note: "Aqui aparece a lacuna que a sua oferta vai ocupar." },
          { who: "voce", text: "Quanto isso te custa — em tempo, dinheiro ou clientes?", note: "O custo percebido define o preço possível." },
          { who: "voce", text: "Se isso sumisse amanhã, o que mudaria no seu dia?", note: "A resposta é o resultado que você vai prometer." },
          { who: "voce", text: "Obrigado. Se eu montar algo para resolver isso, posso te mostrar primeiro?", note: "Deixa a porta aberta — sem oferta." },
        ],
      },
    ],
    seeIt: {
      before: "Sintoma",
      after: "Problema real",
      examples: [
        {
          route: "servico",
          before: "A clínica vende pouco.",
          after: "“Mando o orçamento e o paciente some. E quem chama depois das 18h fica sem resposta até o dia seguinte.”",
          why: "Dá para ver a cena, tem frequência (todo dia) e custo (paciente perdido). É uma frase que a dona da clínica diria.",
        },
        {
          route: "produto",
          before: "MEI desorganizado.",
          after: "“Chega o boleto do DAS e eu não sei se o dinheiro na conta é meu ou da empresa.”",
          why: "É a frase da pessoa — e aponta exatamente o que o produto precisa resolver.",
        },
        {
          route: "bastidor",
          before: "Nutricionista sem produto.",
          after: "“Toda semana alguém me pergunta se eu tenho curso e eu não tenho o que mandar.”",
          why: "É uma demanda que a própria especialista já percebe. Vira o gancho da sua proposta.",
        },
        {
          route: "distribuicao",
          before: "Estudante procrastina.",
          after: "“Monto um planner lindo no domingo e abandono na quarta.”",
          why: "Comportamento repetido + solução que já falhou. Abre espaço para uma ferramenta que funcione no meio da semana.",
        },
      ],
    },
    fieldNote: "Evidência vale mais que opinião — inclusive a sua.",
    fields: [
      { id: "problema", label: "O problema, na linguagem do cliente", hint: "Como ele escreveria numa mensagem. Sem jargão." },
      { id: "quem", label: "Quem sente isso com mais intensidade", hint: "O subgrupo que já tentou resolver." },
      { id: "hoje", label: "Como ele resolve hoje — e por que isso é ruim", multiline: true },
      { id: "custo", label: "Quanto custa não resolver", hint: "Tempo, dinheiro, clientes perdidos, estresse." },
      { id: "evidencia", label: "3 evidências reais", hint: "Frases literais de pessoas diferentes, entre aspas — e onde você viu ou ouviu cada uma.", multiline: true },
    ],
    finalize: `{quem} sofre com: “{problema}”.\nHoje resolve assim: {hoje}.\nCusto de não resolver: {custo}.\n\nEvidências:\n{evidencia}`,
    outputLabel: "O problema que vou resolver",
    nextMove: {
      action: "Tenha 3 conversas de descoberta.",
      text: "Com pessoas da lista de ontem. Use o roteiro, anote as frases literais e volte para completar as evidências.",
    },
    tools: [
      {
        title: "Roteiro de descoberta (para copiar)",
        body: "Oi, [nome]! Estou estudando como [público] lida com [tema] e queria te ouvir. São 5 perguntas, sem venda nenhuma. Pode ser?\n\n1. Qual foi a última vez que [problema] aconteceu com você? Me conta como foi.\n2. O que você já tentou para resolver?\n3. E por que não funcionou direito?\n4. Quanto isso te custa — em tempo, dinheiro ou clientes?\n5. Se isso sumisse amanhã, o que mudaria no seu dia?\n\nObrigado. Se eu montar algo para resolver isso, posso te mostrar primeiro?",
      },
      {
        title: "Prompt de IA — achar o padrão nas anotações",
        body: "Abaixo estão anotações de conversas e comentários de [público] sobre [tema]. 1) Agrupe as frases por problema. 2) Para cada grupo, diga quantas pessoas diferentes mencionaram. 3) Destaque as 5 frases mais fortes, exatamente como foram escritas. Não invente frases.\n\nANOTAÇÕES:\n[cole]",
      },
    ],
  },

  // ───────────────────────────── DAY 03
  {
    n: 3,
    code: "DAY 03",
    name: "OFFER",
    title: "Transforme o problema em oferta",
    objective: "Sair com uma oferta que alguém entende e consegue comprar em uma leitura — e que você explica em uma frase.",
    idea: "Produto é o que você entrega. Oferta é o motivo para alguém comprar agora.",
    principle: [
      "Produto é a coisa: a planilha, a configuração, o guia. Serviço é o seu tempo. Oferta é a promessa empacotada: para quem, que resultado, de que jeito, em que escopo e por quanto. Duas pessoas podem vender o mesmo produto com ofertas completamente diferentes — e só uma delas vende.",
      "Oferta = quem + resultado controlável + mecanismo + escopo + preço. Se faltar uma peça, o cliente preenche a lacuna com dúvida. E dúvida não compra.",
      "Controlável é a palavra mais importante. Você promete o que depende de você entregar — “seu WhatsApp respondendo as perguntas mais comuns em 7 dias” — e não o que depende do mercado — “dobre seu faturamento”. Promessa controlável é mais honesta e, por isso mesmo, mais fácil de acreditar.",
    ],
    method: [
      {
        title: "Quem",
        text: "Comece pelo público do DAY 02. Quanto mais estreito, mais fácil a pessoa se reconhecer na primeira linha.",
      },
      {
        title: "Resultado controlável",
        text: "O que muda para o cliente depois da entrega — e que você consegue garantir que entregou. Teste: se o cliente fizer a parte dele, isso acontece? Se depende de sorte, reescreva.",
      },
      {
        title: "Mecanismo",
        text: "O seu caminho específico até o resultado. Não é um nome bonito: é o “como” que torna a promessa crível. “Atendimento com IA” é genérico; “respostas treinadas com as perguntas que a sua clínica mais recebe” é mecanismo.",
      },
      {
        title: "Escopo",
        text: "Formato, prazo e quantidade. O que está incluído — e o que não está. Escopo fechado protege você e tranquiliza o cliente: ele sabe exatamente o que está comprando.",
      },
      {
        title: "Preço inicial",
        text: "No começo, o objetivo é validar, não maximizar. A referência é o custo do problema que você escreveu ontem e o que o cliente já paga hoje para resolver mal. Um preço que se paga rápido diante desse custo é fácil de defender numa conversa.",
      },
      {
        title: "Uma frase",
        text: "Junte tudo: “Eu ajudo [quem] a [resultado], com [mecanismo], em [escopo]”. Se não cabe em uma frase, tem coisa demais.",
      },
      {
        title: "Os 4 erros mais comuns",
        text: "Quase toda oferta que não vende cai em um destes:",
        points: [
          "Lista de funcionalidades — “12 módulos, 40 templates, bônus…”. O cliente não compra itens; compra o resultado que eles produzem.",
          "Resultado fora do seu controle — “fature 10 mil”. Você não controla o mercado; controla a entrega.",
          "Escopo infinito — “te ajudo no que precisar”. Sem limite, a pessoa não sabe o que está comprando, e você não sabe quando terminou.",
          "Preço sem referência — um número tirado do ar. Ancore no custo do problema, não no que você acha que vale.",
        ],
      },
    ],
    seeIt: {
      before: "Genérico",
      after: "Específico",
      examples: [
        {
          route: "servico",
          before: "Faço automação com IA para empresas.",
          after: "Configuro o WhatsApp da sua clínica para responder as perguntas mais comuns e oferecer horário de avaliação — pronto em 7 dias, com uma semana de ajustes.",
          why: "Quem, resultado, mecanismo e escopo numa frase. A dona da clínica já imagina funcionando.",
        },
        {
          route: "produto",
          before: "Curso completo de finanças pessoais.",
          after: "Uma planilha e um vídeo de 15 minutos para o MEI separar a conta pessoal da empresa numa tarde.",
          why: "Recorte pequeno, resultado visível, esforço baixo. É fácil de comprar porque é fácil de imaginar usando.",
        },
        {
          route: "bastidor",
          before: "Faço lançamentos para especialistas.",
          after: "Estruturo a primeira oferta da sua audiência — da ideia à página — num projeto-piloto, com a divisão de resultado combinada antes de começar.",
          why: "Tira o risco do especialista e deixa claro o que você faz e o que ele faz.",
        },
        {
          route: "distribuicao",
          before: "Vendo produtos digitais.",
          after: "Toda semana eu testo uma ferramenta de organização na rotina real de um estudante e mostro como uso — com o link para quem quiser testar.",
          why: "Para o público, a oferta é a curadoria honesta. A venda acontece pelo link, como consequência.",
        },
      ],
    },
    fieldNote: "Se você precisa explicar sua oferta por cinco minutos, ela está complicada demais.",
    fields: [
      { id: "quem", label: "Quem compra", hint: "O público do DAY 02, o mais estreito possível." },
      { id: "problema", label: "Qual problema você resolve", hint: "Na frase do cliente." },
      { id: "entrega", label: "O que a pessoa recebe", hint: "Formato, prazo, quantidade. O que está incluído — e o que não está.", multiline: true },
      { id: "resultado", label: "Resultado que ela pode esperar", hint: "Controlável — depende de você entregar." },
      { id: "mecanismo", label: "Seu mecanismo", hint: "O seu “como” específico. É o que torna a promessa crível." },
      { id: "preco", label: "Preço e por quê", hint: "Ancore no custo do problema e no que o cliente já paga hoje." },
    ],
    finalize: `Eu ajudo {quem} a {resultado}, resolvendo {problema}.\nComo: {mecanismo}.\nVocê recebe: {entrega}.\nInvestimento: {preco}.`,
    outputLabel: "Minha oferta",
    nextMove: {
      action: "Explique sua oferta em uma frase para uma pessoa real.",
      text: "De preferência alguém do público. Se ela pedir para repetir ou perguntar “mas o que exatamente?”, reescreva até ela entender de primeira.",
    },
    tools: [
      {
        title: "Template de oferta (uma página)",
        body: "OFERTA: [nome]\n\nPara: [quem compra]\nProblema: [na linguagem do cliente]\nResultado: [o que muda — controlável]\nMecanismo: [seu caminho específico]\nVocê recebe:\n• [entrega 1]\n• [entrega 2]\n• [entrega 3]\nNão inclui: [o que fica de fora]\nPrazo: [quando]\nInvestimento: [preço]",
      },
      {
        title: "Prompt de IA — testar a clareza da oferta",
        body: "Você é um potencial cliente cético do público [público]. Leia a oferta abaixo e responda: 1) Em uma frase, o que está sendo vendido? 2) O que ficou confuso? 3) Qual é a sua maior objeção para comprar? 4) Que pergunta você faria antes de pagar?\n\nOFERTA:\n[cole sua oferta]",
      },
    ],
  },

  // ───────────────────────────── DAY 04
  {
    n: 4,
    code: "DAY 04",
    name: "MVP",
    title: "Defina o menor produto possível",
    objective: "Definir a menor versão capaz de entregar o resultado prometido — e preparar a primeira entrega. Definir, não programar.",
    idea: "MVP não é app. É a menor versão capaz de entregar o resultado que você prometeu ontem.",
    principle: [
      "MVP não é uma versão ruim do produto. É a versão mais enxuta que ainda entrega o resultado. Tudo o que não contribui diretamente para esse resultado é excesso — por enquanto.",
      "O erro clássico é inverter a ordem: meses construindo logo, site, plataforma e automação antes do primeiro cliente. Quando fica pronto, descobre-se que o mercado queria outra coisa. Fazer à mão primeiro não é amadorismo; é o jeito mais rápido de aprender o que vale automatizar depois.",
      "Hoje você não precisa construir tudo. Precisa decidir o escopo da primeira entrega, como ela chega ao cliente e quando fica pronta.",
    ],
    method: [
      {
        title: "Escreva tudo o que você imaginou",
        text: "Despeje a lista inteira: funcionalidades, bônus, materiais, ferramentas, integrações. Tirar da cabeça é o que permite cortar.",
      },
      {
        title: "Marque só o que é essencial",
        text: "Item por item: se eu tirar isso, o cliente ainda alcança o resultado prometido? Se sim, sai. O que sobra é o seu MVP.",
      },
      {
        title: "Escolha o formato",
        text: "Quase sempre a primeira entrega cabe em um destes:",
        points: [
          "Manual — você faz com as próprias mãos: planilha, documento, mensagens.",
          "Concierge — você executa pelo cliente o que um dia será um produto. Ele recebe o resultado; você aprende o processo.",
          "Ferramenta pronta — você monta com o que já existe (WhatsApp Business, formulários, Notion, Canva, IA) em vez de construir.",
          "Documento — um guia, um checklist ou um modelo que resolve o problema sozinho.",
          "Serviço simples — uma sessão, uma análise ou uma configuração com escopo fechado.",
        ],
        byRoute: {
          servico: "Concierge ou ferramenta pronta: você configura à mão, com ferramentas que já existem, para 1 cliente — e acompanha de perto.",
          produto: "Documento ou manual: o guia, a planilha ou o modelo, entregue por link. Grava ou automatiza depois de vender.",
          bastidor: "Serviço simples: um projeto-piloto com 1 especialista — diagnóstico + oferta estruturada —, com a divisão de resultado combinada antes.",
          distribuicao: "Manual: 1 canal, 3 produtos testados e um link de recomendações. O resto vem depois de saber o que o público clica.",
        },
      },
      {
        title: "Mande o resto para a V2",
        text: "Escreva o que ficou de fora. Não é desistir dessas ideias: é dar um lugar para elas, para que parem de competir com o que precisa ser feito agora.",
      },
      {
        title: "Defina quando a primeira entrega fica pronta",
        text: "Uma data real e próxima. Se a primeira entrega não fica pronta em poucos dias, ainda tem coisa demais no escopo.",
      },
      {
        title: "O que não construir antes do primeiro cliente",
        text: "Tudo isso pode vir depois — e vai vir melhor, porque você vai saber o que o cliente realmente usa.",
        points: [
          "Logo e identidade visual.",
          "Site com várias páginas.",
          "Aplicativo.",
          "Área de membros.",
          "Automação de um processo que você ainda não fez à mão.",
        ],
      },
    ],
    seeIt: {
      before: "Inflado",
      after: "Mínimo",
      examples: [
        {
          route: "servico",
          before: "Um app de agendamento com IA integrado ao sistema da clínica.",
          after: "Eu configuro o WhatsApp Business de 1 clínica com respostas prontas e um fluxo simples de agendamento, e acompanho 7 dias ajustando.",
          why: "Entrega o mesmo resultado — paciente respondido — sem uma linha de código.",
        },
        {
          route: "produto",
          before: "Curso com 8 módulos, comunidade e certificado.",
          after: "A planilha + um vídeo de 15 minutos explicando como usar, entregues por link.",
          why: "O MEI quer as contas separadas, não um curso. Comunidade e módulos podem vir na V2 — se pedirem.",
        },
        {
          route: "bastidor",
          before: "Plataforma, funil completo e lançamento com tráfego pago.",
          after: "Um diagnóstico de 1 hora com a especialista e um documento com a oferta, a estrutura da página e a sequência de mensagens.",
          why: "Testa a parceria com pouco risco para os dois lados.",
        },
        {
          route: "distribuicao",
          before: "Site próprio, blog, newsletter e 20 produtos.",
          after: "Um perfil, 3 produtos testados e um link com as recomendações.",
          why: "O ativo é o canal. Produtos se adicionam depois de saber o que o público usa de verdade.",
        },
      ],
    },
    fieldNote: "Se você está construindo antes de alguém pedir, está adiando o teste.",
    fields: [
      { id: "resultado", label: "O resultado prometido", hint: "Copie da sua oferta." },
      { id: "tudo", label: "Tudo o que você imaginou colocar", hint: "Tudo mesmo. Despejar é o que permite cortar.", multiline: true },
      { id: "minimo", label: "O mínimo que ainda entrega o resultado", hint: "Só o que é essencial para o resultado.", multiline: true },
      { id: "como", label: "Como vai entregar", hint: "Manual, concierge, ferramenta pronta, documento ou serviço simples." },
      { id: "v2", label: "O que fica para a versão 2", multiline: true },
      { id: "prazo", label: "Quando a primeira entrega fica pronta", hint: "Uma data real e próxima." },
    ],
    finalize: `MVP: {minimo}\nEntrega via: {como}.\nResultado: {resultado}.\nFica para a versão 2: {v2}.\nPrimeira entrega pronta até: {prazo}.`,
    outputLabel: "MVP definido",
    nextMove: {
      action: "Monte hoje o esqueleto da primeira entrega.",
      text: "Não a versão final — a estrutura: o documento com os tópicos, a planilha com as colunas, a lista de respostas, o roteiro da sessão. Na conversa de venda, você vai precisar dizer exatamente o que a pessoa recebe.",
    },
    tools: [
      {
        title: "Formatos de MVP por rota",
        body: "AI Service Builder — configuração manual com ferramentas prontas para 1 cliente, com escopo fechado.\nExpertise Builder — documento, planilha ou guia entregue por link; grava depois de vender.\nBackstage Builder — projeto-piloto com 1 especialista, divisão de resultado combinada antes.\nDistribution Builder — 1 canal + 3 produtos testados + 1 link de recomendação honesta.",
      },
      {
        title: "Prompt de IA — cortar escopo",
        body: "Vou te passar uma oferta e a lista de tudo que imaginei incluir. Para cada item, diga se ele é ESSENCIAL para o cliente alcançar o resultado prometido ou se pode ficar para uma versão 2. Seja rigoroso: na dúvida, corte.\n\nOFERTA:\n[cole]\n\nLISTA:\n[cole]",
      },
    ],
  },

  // ───────────────────────────── DAY 05
  {
    n: 5,
    code: "DAY 05",
    name: "POSITION",
    title: "Posicionamento, promessa e mensagem",
    objective: "Sair com uma mensagem que alguém entende em 5 segundos — e que vai para a bio, a página, a DM e cada conteúdo.",
    idea: "Você tem 5 segundos. Se nesse tempo a pessoa não entende o que é, para quem é e o que fazer, ela continua rolando.",
    principle: [
      "Posicionamento é a resposta rápida para “por que eu deveria prestar atenção nisso?”. Não é o que você acha de si mesmo — é o lugar que você ocupa na cabeça de quem tem o problema.",
      "A ordem importa: posicionamento → mensagem → oferta → conteúdo. Primeiro você decide para quem é e contra o quê. Depois escreve a frase. A oferta encaixa nela. E o conteúdo repete a mesma frase de vinte formas diferentes.",
      "Especificidade vence criatividade. Uma frase clara e um pouco sem graça vende mais do que uma frase inteligente que precisa ser decifrada. No começo, diferenciação raramente vem de ser melhor: vem de ser o único falando exatamente com aquele público, sobre exatamente aquele problema.",
    ],
    method: [
      {
        title: "Posicionamento: para quem e contra o quê",
        text: "Complete: “Para [público] que [problema], diferente de [alternativa comum], eu [mecanismo]”. Essa frase não vai para a página — é a sua bússola para todas as outras.",
      },
      {
        title: "Headline = resultado + público",
        text: "Nomeie o resultado para quem tem o problema, em até 12 palavras. “Pare de perder pacientes por demora no WhatsApp” diz para quem é e o que muda.",
      },
      {
        title: "Subheadline = como",
        text: "Explica o mecanismo, o prazo ou o formato. É ela que torna a headline crível.",
      },
      {
        title: "Promessa específica e controlável",
        text: "“Mude sua vida” não diz nada. “Seu WhatsApp respondendo as perguntas mais comuns, configurado em 7 dias” diz exatamente o que a pessoa leva.",
      },
      {
        title: "Um único CTA",
        text: "A única ação que você quer que a pessoa tome: chamar no WhatsApp, comentar uma palavra, clicar no link. Dois CTAs dividem a atenção.",
      },
      {
        title: "A mesma mensagem em todo lugar",
        text: "Você não escreve cinco mensagens. Escreve uma e adapta o tamanho:",
        points: [
          "Bio — a headline encurtada + o CTA.",
          "DM — a frase que você usa quando alguém pergunta “o que você faz?”.",
          "Página — headline e subheadline no topo.",
          "Conteúdo — cada post é uma variação do mesmo problema e do mesmo resultado.",
          "Apresentação — a mesma frase, dita em voz alta.",
        ],
      },
      {
        title: "Teste dos 5 segundos",
        text: "Mostre a headline para alguém por 5 segundos e pergunte: “o que eu faço e para quem?”. Se a resposta não bater com o que você quis dizer, reescreva.",
      },
    ],
    seeIt: {
      before: "Mensagem ruim",
      after: "Mensagem boa",
      examples: [
        {
          route: "servico",
          before: "Soluções inteligentes em IA para impulsionar o seu negócio.",
          after: "Sua clínica respondendo pacientes no WhatsApp em minutos — mesmo depois das 18h.",
          why: "A ruim serve para qualquer empresa do mundo. A boa fala com uma clínica e mostra a cena.",
        },
        {
          route: "produto",
          before: "Transformando sua relação com o dinheiro.",
          after: "Separe a conta do MEI da sua em uma tarde. Planilha pronta + 15 minutos de vídeo.",
          why: "Resultado + prazo + formato. A pessoa sabe o que está comprando antes de clicar.",
        },
        {
          route: "bastidor",
          before: "Estrategista digital | Lançamentos | Mentalidade.",
          after: "Monto a primeira oferta digital de nutricionistas que já têm audiência.",
          why: "Bio em tópicos não diz o que você faz por ninguém. A boa já seleciona o cliente.",
        },
        {
          route: "distribuicao",
          before: "Dicas de produtividade e muito mais.",
          after: "Ferramentas de organização testadas na rotina real de um estudante. Uma por semana.",
          why: "“Muito mais” é ausência de posicionamento. A boa promete um critério e uma frequência.",
        },
      ],
    },
    fieldNote: "Clareza vende mais que criatividade.",
    fields: [
      { id: "headline", label: "Headline", hint: "Resultado + para quem, em até 12 palavras." },
      { id: "sub", label: "Subheadline", hint: "Como: mecanismo, prazo, formato." },
      { id: "promessa", label: "Promessa (específica e controlável)" },
      { id: "beneficios", label: "3 benefícios", hint: "Um por linha. O que muda para o cliente, não o que vem no pacote.", multiline: true },
      { id: "cta", label: "CTA — a única ação", hint: "Ex.: “Chama no WhatsApp”, “Comenta AGENDA”." },
      { id: "bio", label: "Bio do Instagram", hint: "Linha 1: o que você faz para quem. Linha 2: como ou diferencial. Linha 3: CTA.", multiline: true },
    ],
    finalize: `{headline}\n{sub}\n\nPromessa: {promessa}\n\nBenefícios:\n{beneficios}\n\nCTA: {cta}\n\nBio:\n{bio}`,
    outputLabel: "Meu posicionamento",
    nextMove: {
      action: "Troque sua bio hoje.",
      text: "Use o texto do campo Bio. É a primeira prova pública de que a oferta existe — e o lugar para onde todo conteúdo do DAY 06 vai apontar.",
    },
    tools: [
      {
        title: "Estrutura de página (uma rolagem)",
        body: "1. Headline — resultado + público\n2. Subheadline — mecanismo, prazo, formato\n3. O problema — na linguagem do cliente (DAY 02)\n4. A solução — sua oferta e o mecanismo (DAY 03)\n5. O que você recebe — lista objetiva (DAY 04)\n6. Para quem é / para quem não é\n7. Como funciona — 3 passos\n8. Prova — conversas, bastidores, resultados (só o que for real)\n9. Investimento — preço claro, sem âncora inventada\n10. Perguntas frequentes — as 3 objeções que você mais ouve\n11. CTA — a única ação",
      },
      {
        title: "Prompt de IA — 10 headlines",
        body: "Escreva 10 headlines para a oferta abaixo. Regras: até 12 palavras, nomeie um resultado concreto para o público, sem promessa de renda, sem exagero, sem emoji. Depois, indique as 3 mais claras e explique por quê.\n\nOFERTA:\n[cole]",
      },
    ],
  },

  // ───────────────────────────── DAY 06
  {
    n: 6,
    code: "DAY 06",
    name: "DISTRIBUTE",
    title: "Coloque pessoas diante da oferta",
    objective: "Sair com um caminho de aquisição, um canal, o mapa de onde estão as suas primeiras 30 pessoas e 3 conteúdos prontos para publicar.",
    idea: "Clientes não te encontram. Você vai até onde o problema já está sendo conversado.",
    principle: [
      "Uma oferta que ninguém vê não existe. Distribuição é o trabalho de colocar a sua mensagem diante das pessoas certas — e, no começo, isso não exige anúncio nem seguidores.",
      "O primeiro objetivo não é viralizar. É conversar com as 10 primeiras pessoas que podem comprar. Dez conversas boas ensinam mais sobre a sua oferta do que dez mil visualizações — e é delas que sai a primeira venda.",
      "Existem três caminhos para chegar até essas pessoas. Você vai escolher um — não os três. Dividir a energia entre três canais na primeira semana é o jeito mais comum de não fazer nenhum direito.",
    ],
    method: [
      {
        title: "Os três caminhos",
        text: "Cada um tem um custo e um tempo diferentes.",
        points: [
          "Conteúdo — você publica e as pessoas chegam até você. Faz sentido quando você já tem alguma atenção ou consegue publicar com constância. É o mais lento para começar e o que mais acumula com o tempo.",
          "Abordagem direta — você vai até as pessoas, uma a uma, com contexto. Faz sentido quando o público é identificável: negócios com nome e endereço, perfis de um nicho, cargos no LinkedIn. É o mais rápido para gerar as primeiras conversas.",
          "Parceiros — alguém que já tem a confiança do seu público te apresenta: um especialista, o dono de uma comunidade, um fornecedor do mesmo cliente. Faz sentido quando o público confia mais em quem indica do que em quem vende.",
        ],
      },
      {
        title: "Por onde começar na sua rota",
        text: "A sugestão é um ponto de partida. Se você tem um motivo claro para outro caminho, use o outro.",
        byRoute: {
          servico: "Abordagem direta. Negócios têm nome, endereço e WhatsApp público. Dez negócios abordados com contexto rendem mais conversas na primeira semana do que um mês de posts.",
          produto: "Conteúdo + abordagem direta. Publique para quem já se interessa pelo seu assunto e converse direto com quem comentou ou perguntou.",
          bastidor: "Abordagem direta com especialistas. O seu cliente é o especialista, não a audiência dele — e ele tem perfil público e caixa de mensagens.",
          distribuicao: "Conteúdo. O seu ativo é o canal; publicar com constância é o próprio trabalho. Parcerias com perfis do mesmo nicho aceleram.",
        },
      },
      {
        title: "Escolha um canal",
        text: "Dentro do caminho, um canal só: Instagram, TikTok, LinkedIn, WhatsApp, uma comunidade, visitas presenciais. O melhor é aquele onde o público já está e onde você consegue aparecer com constância nos próximos 7 dias.",
      },
      {
        title: "Encontre onde as pessoas estão",
        text: "Você precisa de uma lista de 30 nomes. Não procure “público” em geral: procure sinais de intenção — pessoas que já demonstraram ter o problema.",
        points: [
          "Comentários reclamando do problema em posts e vídeos do nicho.",
          "Perguntas repetidas em grupos, comunidades e fóruns.",
          "Posts pedindo indicação: “alguém conhece quem faz…?”.",
          "Avaliações de 1 a 3 estrelas de concorrentes no Google ou em marketplaces.",
          "Vagas abertas para uma função que você resolve como serviço.",
          "Pessoas que já te perguntaram sobre o assunto.",
        ],
        byRoute: {
          servico: "Google Maps do seu bairro ou cidade: clínicas, salões, escritórios. Mande uma pergunta no WhatsApp deles e veja quanto demoram para responder. Perfis locais no Instagram, avaliações que reclamam de atendimento, vagas de recepcionista ou atendente.",
          produto: "Quem comentou ou perguntou nos seus posts. Grupos e comunidades do seu tema. Comentários em vídeos de quem fala do assunto. Perguntas em fóruns e no Reddit. Seus contatos que vivem o problema.",
          bastidor: "Busca do Instagram e do TikTok pela profissão (ex.: “nutricionista”), filtrando perfis de 5 a 20 mil seguidores. Quem recebe “você tem curso?” nos comentários. Especialistas que fazem lives mas não têm link de produto na bio.",
          distribuicao: "Comunidades do nicho (Reddit, Discord, grupos). Comentários em vídeos do tema pedindo dicas. Buscas e hashtags do assunto. Perfis do mesmo nicho com quem dá para trocar divulgação.",
        },
      },
      {
        title: "First 10: de 30 para 10",
        text: "Da lista de 30, escolha 10 com três critérios: a pessoa tem o problema (você viu um sinal), você consegue falar com ela esta semana e ela pode pagar. Essas 10 são a sua lista de abordagem do DAY 07.",
        after: "First 10 é uma sequência: encontrar 30 → selecionar 10 → abordar → conversar → apresentar → follow-up. Hoje você faz as duas primeiras. Amanhã, o resto.",
      },
      {
        title: "Conteúdo como aquisição",
        text: "Conteúdo que vende não é dica solta: é uma conversa que começa em público e continua no privado.",
        points: [
          "Hook — a frase do problema, na linguagem do cliente (está nas suas evidências do DAY 02).",
          "Problema — a cena concreta, para a pessoa se reconhecer.",
          "Insight — o erro comum e o que muda quando se faz diferente. Útil por si só.",
          "CTA — uma ação: “comenta AGENDA”, “me chama no direct”.",
          "Conversa — quem responde ao CTA entra na mesma conversa de descoberta do DAY 02.",
        ],
        after: "Constância que você consegue sustentar vale mais do que um pico de esforço: 3 conteúdos publicados em 7 dias valem mais do que 10 planejados.",
      },
    ],
    seeIt: {
      before: "Ideia de conteúdo",
      after: "Conteúdo pronto para publicar",
      examples: [
        {
          route: "servico",
          before: "Dicas de IA para clínicas.",
          after:
            "HOOK — Se sua clínica responde paciente no dia seguinte, você está perdendo agendamento.\nPROBLEMA — O paciente pede preço às 19h, ninguém responde, e às 21h ele marcou com a clínica do lado.\nINSIGHT — Ele não escolheu a mais barata: escolheu a que respondeu primeiro. A maioria das perguntas se repete — preço, horário, como funciona — e dá para deixar respondidas.\nCTA — Comenta AGENDA que eu te mostro como fica no seu WhatsApp.",
          why: "Tem a cena, um insight útil mesmo para quem não compra e uma palavra que leva a conversa para o direct.",
        },
        {
          route: "produto",
          before: "Dicas de finanças para MEI.",
          after:
            "HOOK — Se no dia do DAS você não sabe se o dinheiro é seu ou da empresa, assiste isso.\nPROBLEMA — Tudo cai na mesma conta e no fim do mês sobra uma dúvida, não um número.\nINSIGHT — Não é falta de disciplina, é falta de regra: defina um valor fixo para você e transfira no mesmo dia, todo mês.\nCTA — Comenta PLANILHA que eu te mando o modelo.",
          why: "Entrega a regra de graça. Quem quer a ferramenta pronta pede a planilha — e começa a conversa.",
        },
        {
          route: "bastidor",
          before: "Post sobre lançamentos.",
          after:
            "HOOK — Nutricionista: se toda semana te perguntam “você tem curso?”, você já tem demanda.\nPROBLEMA — A audiência pede, você responde “ainda não” e a pergunta morre ali.\nINSIGHT — O primeiro produto não precisa ser um curso. Pode ser um guia sobre a pergunta que mais te fazem.\nCTA — Me chama no direct com a palavra PILOTO.",
          why: "Fala com o especialista, não com a audiência dele. O CTA filtra quem já está pensando nisso.",
        },
        {
          route: "distribuicao",
          before: "Dicas de produtividade.",
          after:
            "HOOK — Montei meu planner no domingo e abandonei na quarta. De novo.\nPROBLEMA — Planner bonito demais vira obrigação, não ferramenta.\nINSIGHT — Testei um app que mostra só 3 tarefas por dia, e foi a primeira semana em que cheguei à sexta com ele aberto.\nCTA — Comenta ROTINA que eu te mando o link e como configuro.",
          why: "É uma experiência real, não um anúncio. O link chega como resposta a quem pediu.",
        },
      ],
    },
    fieldNote: "Seus primeiros clientes provavelmente estão mais perto do que parecem.",
    fields: [
      { id: "caminho", label: "Seu caminho de aquisição", hint: "Conteúdo, abordagem direta ou parceiros — e por quê." },
      { id: "canal", label: "Canal principal", hint: "Um só." },
      { id: "onde", label: "Onde estão as suas 30 pessoas", hint: "Lugares concretos: buscas, grupos, perfis, bairros, comentários. Quanto mais específico, mais rápido você monta a lista.", multiline: true },
      { id: "hooks", label: "3 hooks", hint: "Um por linha, na linguagem do cliente.", multiline: true },
      { id: "conteudos", label: "3 conteúdos prontos para publicar", hint: "Para cada um: Hook → Problema → Insight → CTA. Escreva o que você realmente publicaria, não apenas o tema.", multiline: true },
      { id: "cta", label: "CTA / palavra-chave", hint: "Ex.: “Comenta AGENDA que te mando como funciona”." },
      { id: "frequencia", label: "Frequência nos próximos 7 dias" },
    ],
    finalize: `Caminho: {caminho}\nCanal: {canal} · {frequencia}\nOnde estão as primeiras 30 pessoas: {onde}\n\nHooks:\n{hooks}\n\nConteúdos prontos:\n{conteudos}\n\nCTA: {cta}`,
    outputLabel: "Meu plano de distribuição",
    nextMove: {
      action: "Monte a lista de 30 nomes antes do DAY 07.",
      text: "Numa planilha ou nas notas: nome, onde encontrou, o sinal que viu. Amanhã você escolhe as 10 primeiras e começa a falar com elas.",
    },
    tools: [
      {
        title: "Planilha First 10 (colunas)",
        body: "Nome | Onde encontrei | Sinal do problema | Contato | Etapa | Próximo passo | Data\n\nEtapas: encontrado → abordado → conversando → oferta apresentada → follow-up → fechou / não agora",
      },
      {
        title: "Estrutura de vídeo curto",
        body: "0–3s   HOOK — uma frase que o público reconhece como dele\n3–10s  PROBLEMA — a situação concreta, sem jargão\n10–40s INSIGHT — o erro comum e o que muda quando se faz diferente\n40–60s CTA — uma ação: “Comenta [PALAVRA] que te mando…”",
      },
      {
        title: "12 hooks base para adaptar",
        body: "1. Se você [situação do problema], assiste isso.\n2. O erro que faz [público] [consequência] sem perceber.\n3. Pare de [ação comum]. Faça isso no lugar.\n4. Ninguém te conta isso sobre [tema].\n5. Como eu resolveria [problema] se começasse hoje.\n6. [Público]: isso está te custando [custo].\n7. 3 sinais de que [problema] já está acontecendo com você.\n8. A diferença entre quem [resultado] e quem não.\n9. Eu testei [solução] por [prazo]. O que aconteceu:\n10. Você não precisa de [coisa cara]. Precisa de [coisa simples].\n11. O jeito mais rápido de [resultado] em [prazo].\n12. Isso aqui resolve [problema] em [tempo].",
      },
    ],
  },

  // ───────────────────────────── DAY 07
  {
    n: 7,
    code: "DAY 07",
    name: "LAUNCH",
    title: "Coloque no mercado",
    objective: "Sair de hoje com a oferta visível, as 10 primeiras conversas começando e uma data para revisar o que o mercado respondeu.",
    idea: "Se ninguém viu sua oferta, você ainda não validou nada.",
    principle: [
      "Tudo o que você construiu nos últimos seis dias ainda é hipótese. Só vira ativo quando encontra o mercado — e o mercado só responde ao que existe.",
      "Lançar, aqui, não é evento. É uma rotina simples: a oferta visível em algum lugar, 10 conversas iniciadas, uma métrica acompanhada e uma data para revisar. Quase ninguém faz isso — por isso essa porta vive vazia.",
      "Venda, no começo, é conversa. Não é convencer ninguém: é encontrar quem tem o problema, confirmar com a pessoa que ele existe e mostrar o caminho. Quem não tem o problema não é uma objeção a vencer — é só alguém fora do seu público.",
    ],
    method: [
      {
        title: "Publicar",
        text: "Coloque a oferta em algum lugar para onde dá para mandar alguém: um post fixado, uma página simples, um destaque, até uma mensagem pronta no WhatsApp. Publique o primeiro conteúdo do DAY 06 com o CTA. Feito é melhor que perfeito — você ajusta com o que ouvir.",
      },
      {
        title: "Abordar as 10",
        text: "Uma mensagem por pessoa, com o contexto real de onde você a encontrou. Nada de texto copiado para 50 pessoas. Quatro regras: contexto real, mensagem personalizada, aceitar o não, no máximo um follow-up.",
      },
      {
        title: "Conversar",
        text: "Comece pela descoberta, não pela oferta. As mesmas perguntas do DAY 02: o que acontece hoje, o que já tentou, quanto custa. A pessoa precisa falar mais do que você.",
      },
      {
        title: "Confirmar o problema",
        text: "Antes de falar da oferta, devolva o problema com as palavras da pessoa: “Então, se entendi, [problema], e isso te custa [custo]. É isso?”. Se ela disser que sim, você ganhou o direito de apresentar. Se disser que não, agradeça e siga — ela não é do seu público agora.",
      },
      {
        title: "Apresentar",
        text: "A frase da oferta (DAY 03), o que a pessoa recebe e o preço. Sem pressão, sem desconto inventado. Termine com uma pergunta simples: “Faz sentido para você?”.",
      },
      {
        title: "Follow-up",
        text: "Sem resposta em 48 horas, uma mensagem de retorno. Uma só, leve, com saída fácil. Depois disso, deixe a porta aberta e siga para a próxima pessoa.",
      },
      {
        title: "Medir",
        text: "Acompanhe uma métrica nos próximos 7 dias. A mais útil no começo é quantas ofertas você apresentou: depende só de você e puxa todas as outras. Vendas são consequência.",
      },
      {
        title: "Revisar",
        text: "Na data de revisão, olhe os números e as frases que ouviu e decida uma coisa: continuar, ajustar a oferta ou trocar de direção. Qualquer uma das três é avanço — porque agora é decisão com dados, não opinião.",
      },
    ],
    scripts: [
      {
        title: "Uma conversa completa",
        intro: "Exemplo na rota de serviço. Troque o problema e a oferta pelos seus — a lógica é a mesma em qualquer rota: abordagem → descoberta → confirmação → transição → apresentação → objeção → follow-up.",
        lines: [
          { who: "voce", text: "Oi, Carla! Vi a clínica no Maps e reparei que vocês atendem até as 18h. Posso te fazer uma pergunta rápida sobre o WhatsApp de vocês?", note: "Abordagem: contexto real e um pedido pequeno." },
          { who: "cliente", text: "Pode sim." },
          { who: "voce", text: "Quando um paciente manda mensagem à noite pedindo preço, o que acontece hoje?", note: "Descoberta: o que acontece, não o que ela acha." },
          { who: "cliente", text: "A gente só responde no dia seguinte. Muita gente nem responde mais." },
          { who: "voce", text: "E você tem ideia de quantos somem assim por semana?", note: "Custo." },
          { who: "cliente", text: "Uns cinco, seis. Nunca contei direito." },
          { who: "voce", text: "Então, se entendi: quem chama fora do horário esfria até o dia seguinte, e vocês perdem uns cinco pacientes por semana. É isso?", note: "Confirmação, com as palavras dela." },
          { who: "cliente", text: "É exatamente isso." },
          { who: "voce", text: "Eu trabalho justamente com isso. Posso te contar em uma frase como resolvo?", note: "Transição: pede licença antes de apresentar." },
          { who: "cliente", text: "Conta." },
          { who: "voce", text: "Eu configuro o WhatsApp da clínica para responder as perguntas mais comuns e oferecer horário de avaliação, inclusive à noite. Fica pronto em 7 dias e eu ajusto durante a primeira semana. O investimento é [preço]. Faz sentido para vocês?", note: "Apresentação: oferta, entrega e preço. Termina em pergunta." },
          { who: "cliente", text: "Vou pensar e te falo." },
          { who: "voce", text: "Claro. Só para eu entender: o que precisaria estar claro para você decidir?", note: "Objeção: entender antes de responder." },
          { who: "cliente", text: "Se funciona com o número que a gente já usa." },
          { who: "voce", text: "Funciona no mesmo número, no WhatsApp Business. Te mando um print de como fica a conversa?", note: "Responde a dúvida real e oferece um passo pequeno." },
          { who: "tempo", text: "48 horas depois, sem resposta" },
          { who: "voce", text: "Oi, Carla! Te mandei o print na terça. Ficou alguma dúvida? Se não for o momento, tudo bem também.", note: "Follow-up: um só, leve, com saída fácil." },
        ],
      },
    ],
    replies: [
      {
        says: "Vou pensar.",
        answer: "Claro. O que precisaria estar claro para você decidir?",
        why: "“Vou pensar” quase sempre esconde uma dúvida específica. Pergunte qual é — e responda só ela.",
      },
      {
        says: "Tá caro.",
        answer: "Entendo. Comparado a quê? Hoje, quanto [o problema] te custa por mês?",
        why: "Leva a conversa de volta ao custo do problema. Se o custo for menor que o preço, talvez a pessoa não seja seu cliente agora — e tudo bem.",
      },
      {
        says: "Me manda informações.",
        answer: "Mando sim. Para eu mandar o que importa: o que é mais importante para você nisso?",
        why: "Pedido de material costuma ser uma saída educada. Uma pergunta mantém a conversa viva e mostra o que mandar.",
      },
      {
        says: "Não tenho interesse.",
        answer: "Tranquilo, obrigado por responder. Se um dia [o problema] virar prioridade, estou por aqui.",
        why: "Aceite o não sem insistir. Sua reputação no nicho vale mais do que essa venda.",
      },
      {
        says: "Já tenho alguém.",
        answer: "Que bom que já está resolvido. Por curiosidade: tem algo que você gostaria que funcionasse melhor?",
        why: "Se está tudo bem, você sai com elegância. Se houver uma lacuna, ela aparece aqui — sem você atacar o concorrente.",
      },
    ],
    seeIt: {
      before: "Abordagem ruim",
      after: "Abordagem boa",
      examples: [
        {
          route: "servico",
          before: "Oi, tudo bem? Trabalho com IA e tenho uma oportunidade incrível para sua empresa! Posso te mandar uma proposta?",
          after: "Oi, Carla! Vi a clínica no Maps e reparei que vocês atendem até as 18h. Posso te fazer uma pergunta rápida sobre o WhatsApp de vocês?",
          why: "A ruim serviria para qualquer pessoa e pede algo grande. A boa prova que você olhou de verdade e pede só uma pergunta.",
        },
        {
          route: "produto",
          before: "Oi! Lancei minha planilha, dá uma olhada no link.",
          after: "Oi, Rafa! Você comentou no meu post que nunca sabe quanto sobra do MEI. Isso ainda acontece? Montei uma coisa para isso e queria a sua opinião.",
          why: "Parte de algo que a pessoa disse. Pedir opinião abre conversa; mandar link fecha.",
        },
        {
          route: "bastidor",
          before: "Olá, sou estrategista de lançamentos e posso escalar seu negócio digital.",
          after: "Oi, Ana! Vi que nos seus posts sempre perguntam se você tem curso. Você já pensou em ter uma primeira oferta para essas pessoas?",
          why: "Mostra que você conhece o perfil dela e nomeia uma demanda que ela já sente.",
        },
        {
          route: "distribuicao",
          before: "Compre pelo meu link e ganhe desconto!",
          after: "Você perguntou nos comentários qual app eu uso para organizar a semana. É este — e aqui está como eu configuro. Se quiser testar, o link está aqui.",
          why: "Responde uma pergunta real com algo útil. O link é consequência, não abordagem.",
        },
      ],
    },
    fieldNote: "Venda, no começo, é uma conversa sobre o problema da outra pessoa.",
    fields: [
      { id: "link", label: "Onde sua oferta está publicada", hint: "Link da página, post fixado ou mensagem pronta." },
      { id: "post", label: "Primeiro conteúdo: data e hora" },
      { id: "lista", label: "As 10 primeiras pessoas para abordar", hint: "Uma por linha, da sua lista de 30. Comece pela mais provável.", multiline: true },
      { id: "abordagem", label: "Sua primeira mensagem", hint: "Para a pessoa nº 1, com o contexto real de onde você a encontrou.", multiline: true },
      { id: "metrica", label: "A métrica que você vai acompanhar", hint: "Sugestão: ofertas apresentadas." },
      { id: "revisao", label: "Data da revisão (daqui a 7 dias)" },
    ],
    finalize: `Oferta no ar: {link}\nPrimeiro conteúdo: {post}\nMétrica: {metrica}\nRevisão: {revisao}\n\nPrimeira mensagem:\n{abordagem}\n\nFirst 10:\n{lista}`,
    outputLabel: "Oferta pronta para o mercado",
    nextMove: {
      action: "Mande agora a primeira mensagem para a pessoa nº 1.",
      text: "Antes de fechar esta tela. Depois, as outras 9 até a data de revisão — e faça o Build Score para ver onde você está.",
    },
    tools: [
      {
        title: "Roteiro de venda por DM (para copiar)",
        body: "ABORDAGEM\nOi, [nome]! Vi que você [contexto real — comentou, trabalha com, postou sobre]. Posso te fazer uma pergunta rápida?\n\nDESCOBERTA\nHoje, como você lida com [problema]? … O que já tentou? … Quanto isso te custa?\n\nCONFIRMAÇÃO\nEntão, se entendi, [problema], e isso te custa [custo]. É isso?\n\nTRANSIÇÃO\nEu trabalho justamente com isso. Posso te contar em uma frase como resolvo?\n\nAPRESENTAÇÃO\n[frase da oferta]. Você recebe [entrega]. O investimento é [preço]. Faz sentido para você?\n\nFOLLOW-UP (48h, uma vez)\nOi, [nome]! Ficou alguma dúvida sobre [oferta]? Se não for o momento, tudo bem também.",
      },
      {
        title: "Checklist de lançamento",
        body: "☐ Oferta publicada (post fixado, página ou mensagem pronta)\n☐ Bio atualizada com o CTA\n☐ Primeiro conteúdo publicado\n☐ 10 abordagens enviadas\n☐ Respostas registradas na planilha First 10\n☐ Métrica definida\n☐ Data de revisão na agenda",
      },
    ],
  },
];
