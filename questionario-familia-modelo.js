/* 27 grupos: seleção de 54 itens do DOCX, alimentação, sono e rotina. Sem conversão automática em S/N/P. */
(()=>{
'use strict';
const grupos=[
  {
    "numero": 1,
    "titulo": "Como a criança mostra o que quer ou precisa?",
    "ajuda": "Conte como pede água, comida, ajuda ou uma brincadeira. Pode usar mais de uma forma de comunicação.",
    "itens": [
      {
        "id": "oralidade_1",
        "pergunta": "Como mostra desejos e vontades?",
        "item": "EXPRESSA DESEJOS E VONTADES",
        "tipo": "descricao",
        "origem": "oralidade_1"
      },
      {
        "id": "oralidade_15",
        "pergunta": "Utiliza palavras faladas para se comunicar?",
        "item": "COMUNICA-SE POR MEIO DA FALA",
        "tipo": "habilidade",
        "origem": "oralidade_15"
      }
    ]
  },
  {
    "numero": 2,
    "titulo": "Quando alguém chama a criança pelo nome, como ela costuma responder?",
    "ajuda": "Considere fala, olhar, gesto ou aproximação. Conte se a resposta muda quando está distraída ou há barulho.",
    "itens": [
      {
        "id": "oralidade_12",
        "pergunta": "Quando alguém chama pelo nome, costuma responder, olhar, fazer um gesto ou demonstrar que percebeu?",
        "item": "RESPONDE AO SER CHAMADO PELO NOME",
        "tipo": "habilidade",
        "origem": "oralidade_12"
      }
    ]
  },
  {
    "numero": 3,
    "titulo": "Como participa quando alguém conversa ou conta alguma coisa para ela?",
    "ajuda": "Não é necessário ficar imóvel ou olhar nos olhos para demonstrar que está ouvindo. Conte o que ajuda a acompanhar a conversa.",
    "itens": [
      {
        "id": "oralidade_3",
        "pergunta": "Consegue escutar a outra pessoa durante a conversa e participar da troca?",
        "item": "SABE ESCUTAR",
        "tipo": "habilidade",
        "origem": "oralidade_3"
      },
      {
        "id": "oralidade_17",
        "pergunta": "Consegue acompanhar com atenção o que está sendo falado?",
        "item": "OUVE COM ATENÇÃO",
        "tipo": "habilidade",
        "origem": "oralidade_17"
      }
    ]
  },
  {
    "numero": 4,
    "titulo": "Ela conta o que aconteceu durante o dia? E consegue contar novamente uma história que ouviu?",
    "ajuda": "Considere acontecimentos vividos e histórias ouvidas separadamente. Pode utilizar fala, imagens, sinais ou outro recurso.",
    "itens": [
      {
        "id": "oralidade_4",
        "pergunta": "Conta acontecimentos do dia, como o que fez na escola ou em um passeio?",
        "item": "RELATA FATOS DO COTIDIANO",
        "tipo": "habilidade",
        "origem": "oralidade_4"
      },
      {
        "id": "oralidade_19",
        "pergunta": "Consegue contar novamente uma história que ouviu, mantendo os principais acontecimentos e sua ordem?",
        "item": "RECONTA HISTÓRIAS OUVIDAS COM COERÊNCIA",
        "tipo": "habilidade",
        "origem": "oralidade_19"
      }
    ]
  },
  {
    "numero": 5,
    "titulo": "Vocês percebem alguma dificuldade na fala?",
    "ajuda": "Conte apenas o que já percebe na fala. Não precisa identificar uma dificuldade pelo nome técnico.",
    "itens": [
      {
        "id": "oralidade_5",
        "pergunta": "Quando fala, você percebe repetições de sons, palavras prolongadas ou bloqueios para continuar?",
        "item": "FALA SEM HESITAR OU GAGUEJAR",
        "tipo": "percepcao",
        "origem": "oralidade_5"
      },
      {
        "id": "oralidade_6",
        "pergunta": "Troca ou deixa de pronunciar sons das palavras, dificultando compreender o que fala?",
        "item": "DIFICULDADE NA DICÇÃO (TROCA OU EMITE FONEMAS)",
        "tipo": "percepcao",
        "origem": "oralidade_6"
      }
    ]
  },
  {
    "numero": 6,
    "titulo": "Quando perguntam algo, ela consegue responder e mostrar o que pensa ou prefere?",
    "ajuda": "Por exemplo: escolher uma brincadeira, dizer se gostou de algo ou responder sobre o que está fazendo.",
    "itens": [
      {
        "id": "oralidade_10",
        "pergunta": "Consegue responder perguntas e mostrar sua opinião ou preferência? Como faz isso?",
        "item": "FORMULA RESPOSTAS / EMITE OPINIÕES",
        "tipo": "habilidade",
        "origem": "oralidade_10"
      }
    ]
  },
  {
    "numero": 7,
    "titulo": "Consegue levar um recado, fazer um pedido ou transmitir um aviso para outra pessoa?",
    "ajuda": "Por exemplo: avisar que a comida está pronta ou pedir um objeto para outra pessoa.",
    "itens": [
      {
        "id": "oralidade_20",
        "pergunta": "Consegue levar um recado, fazer um pedido ou transmitir um aviso a outra pessoa? Usa quais recursos?",
        "item": "TRANSMITE RECADOS, PEDIDOS OU AVISOS",
        "tipo": "habilidade",
        "origem": "oralidade_20"
      }
    ]
  },
  {
    "numero": 8,
    "titulo": "Nas brincadeiras e músicas, costuma imitar gestos ou acompanhar movimentos?",
    "ajuda": "Por exemplo: bater palmas, dar tchau ou acompanhar movimentos de uma música, com as adaptações que utiliza.",
    "itens": [
      {
        "id": "oralidade_14",
        "pergunta": "Imita gestos, movimentos de músicas ou pequenas sequências de dança, com as adaptações de que precisa?",
        "item": "IMITA GESTOS E COREOGRAFIAS",
        "tipo": "habilidade",
        "origem": "oralidade_14"
      }
    ]
  },
  {
    "numero": 9,
    "titulo": "Quando vê palavras escritas, reconhece o próprio nome e algumas letras?",
    "ajuda": "Reconhecer o nome e reconhecer letras são habilidades diferentes. Conte quais letras vocês já observaram.",
    "itens": [
      {
        "id": "leitura_2",
        "pergunta": "Reconhece o próprio nome quando está escrito entre outros nomes?",
        "item": "VISUALIZA E RECONHECE SEU NOME ESCRITO",
        "tipo": "habilidade",
        "origem": "leitura_2"
      },
      {
        "id": "leitura_3",
        "pergunta": "Quais letras do alfabeto reconhece quando estão escritas?",
        "item": "LÊ E RECONHECE AS LETRAS DO ALFABETO",
        "tipo": "descricao",
        "origem": "leitura_3"
      }
    ]
  },
  {
    "numero": 10,
    "titulo": "O que vocês já observaram a criança lendo em casa?",
    "ajuda": "Considere o que já observou lendo, sem pedir um teste agora. Se apenas decorou uma marca ou repetiu o que alguém leu, pode contar no exemplo.",
    "itens": [
      {
        "id": "leitura_7",
        "pergunta": "Lê sílabas, como PA, ME ou SOL, sem depender apenas de decorar uma palavra inteira? Dê exemplos que já tenha observado.",
        "item": "REALIZA LEITURA DE SÍLABAS",
        "tipo": "habilidade",
        "origem": "leitura_7"
      },
      {
        "id": "leitura_8",
        "pergunta": "Lê palavras simples, como PATO ou MALA? Quais exemplos vocês já observaram?",
        "item": "REALIZA LEITURA DE PALAVRAS SIMPLES",
        "tipo": "habilidade",
        "origem": "leitura_8"
      },
      {
        "id": "leitura_9",
        "pergunta": "Lê palavras com combinações mais complexas, como PRATO, CHAVE ou BRINQUEDO? Quais?",
        "item": "REALIZA LEITURA DE PALAVRAS COMPLEXAS",
        "tipo": "habilidade",
        "origem": "leitura_9"
      },
      {
        "id": "leitura_10",
        "pergunta": "Lê frases curtas? Conte um exemplo ou uma situação em que isso aconteceu.",
        "item": "REALIZA LEITURA DE FRASES",
        "tipo": "habilidade",
        "origem": "leitura_10"
      },
      {
        "id": "leitura_11",
        "pergunta": "Lê pequenos textos? Depois consegue contar ou mostrar o que entendeu?",
        "item": "REALIZA LEITURA DE PEQUENOS TEXTOS",
        "tipo": "habilidade",
        "origem": "leitura_11"
      }
    ]
  },
  {
    "numero": 11,
    "titulo": "O que ela já tenta ou consegue escrever?",
    "ajuda": "Em cada caso, indique se escreve sem modelo, copia ou precisa de ajuda. Considere também o recurso utilizado para escrever.",
    "itens": [
      {
        "id": "escrita_1",
        "pergunta": "Faz tentativas de escrever letras? Como são essas tentativas e quais recursos utiliza?",
        "item": "REALIZA TENTATIVA DE ESCRITA DE LETRAS",
        "tipo": "escrita",
        "origem": "escrita_1"
      },
      {
        "id": "escrita_2",
        "pergunta": "Escreve o próprio nome? Faz sem modelo, copiando ou com ajuda? Conte como.",
        "item": "ESCREVE SEU NOME",
        "tipo": "escrita",
        "origem": "escrita_2"
      },
      {
        "id": "escrita_4",
        "pergunta": "Escreve palavras simples, como CASA ou PATO? Faz por conta própria, copiando ou com ajuda?",
        "item": "ESCREVE PALAVRAS SIMPLES",
        "tipo": "escrita",
        "origem": "escrita_4"
      },
      {
        "id": "escrita_5",
        "pergunta": "Escreve palavras como PRATO, CHAVE ou BRINQUEDO? Faz por conta própria, copiando ou com ajuda?",
        "item": "ESCREVE PALAVRAS COMPLEXAS",
        "tipo": "escrita",
        "origem": "escrita_5"
      },
      {
        "id": "escrita_6",
        "pergunta": "Escreve frases? Conte um exemplo e diga se usa modelo ou ajuda.",
        "item": "ESCREVE FRASES",
        "tipo": "escrita",
        "origem": "escrita_6"
      },
      {
        "id": "escrita_7",
        "pergunta": "Escreve pequenos textos, bilhetes ou relatos? Que apoio costuma precisar?",
        "item": "ESCREVE TEXTOS PEQUENOS",
        "tipo": "escrita",
        "origem": "escrita_7"
      }
    ]
  },
  {
    "numero": 12,
    "titulo": "Como demonstra que entende o que vocês dizem ou pedem?",
    "ajuda": "Conte se precisa repetir, apontar, mostrar imagens ou fazer junto para compreender.",
    "itens": [
      {
        "id": "percepcao_4",
        "pergunta": "Demonstra compreender sons conhecidos e palavras faladas no cotidiano? Como vocês percebem isso?",
        "item": "COMPREENDE SONS OU PALAVRAS FALADAS",
        "tipo": "habilidade",
        "origem": "percepcao_4"
      },
      {
        "id": "percepcao_7",
        "pergunta": "Compreende pedidos simples, como pegar o copo ou guardar um brinquedo? Precisa de gesto, imagem, repetição ou outro apoio?",
        "item": "COMPREENDE COMANDOS SIMPLES",
        "tipo": "habilidade",
        "origem": "percepcao_7"
      }
    ]
  },
  {
    "numero": 13,
    "titulo": "Como reage aos sabores e a alimentos diferentes?",
    "ajuda": "Perceber um sabor e aceitar experimentá-lo são coisas diferentes. Não ofereça alimentos para responder: relate experiências já vividas.",
    "itens": [
      {
        "id": "percepcao_5",
        "pergunta": "Como demonstra que percebe diferenças entre doce, salgado e azedo?",
        "item": "IDENTIFICA NA PERCEPÇÃO GUSTATIVA (AZEDO, DOCE, SALGADO)",
        "tipo": "descricao",
        "origem": "percepcao_5"
      },
      {
        "id": "percepcao_6",
        "pergunta": "Quais sabores aceita experimentar e quais evita?",
        "item": "ACEITA EXPERIMENTAR NA PERCEPÇÃO GUSTATIVA (AZEDO, DOCE, SALGADO)",
        "tipo": "descricao",
        "origem": "percepcao_6"
      }
    ]
  },
  {
    "numero": 14,
    "titulo": "Quando há barulho ou pessoas se movimentando, como fica sua atenção?",
    "ajuda": "Conte se consegue continuar a atividade, se fica incomodada ou precisa se afastar. O que ajuda?",
    "itens": [
      {
        "id": "percepcao_8",
        "pergunta": "Consegue acompanhar uma atividade quando há barulho ou pessoas se movimentando? O que ajuda e o que dificulta?",
        "item": "CONCENTRA-SE DIANTE DE BARULHO E MOVIMENTOS",
        "tipo": "habilidade",
        "origem": "percepcao_8"
      }
    ]
  },
  {
    "numero": 15,
    "titulo": "Como se desloca pelos lugares que frequenta?",
    "ajuda": "Considere os equipamentos e adaptações habituais. Usar um recurso de mobilidade não significa precisar da ajuda de outra pessoa.",
    "itens": [
      {
        "id": "avd_0",
        "pergunta": "Como se desloca pelos ambientes do dia a dia? Faz com autonomia, com equipamentos ou com ajuda de alguém?",
        "item": "TEM AUTONOMIA EM SUA LOCOMOÇÃO",
        "tipo": "habilidade",
        "origem": "avd_0"
      }
    ]
  },
  {
    "numero": 16,
    "titulo": "No banheiro e nos cuidados de higiene, o que faz e em que precisa de ajuda?",
    "ajuda": "Conte as etapas que realiza e onde precisa de apoio. Não é necessário informar detalhes íntimos.",
    "itens": [
      {
        "id": "avd_1",
        "pergunta": "No uso do banheiro, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA O USO DO BANHEIRO",
        "tipo": "autonomia",
        "origem": "avd_1"
      },
      {
        "id": "avd_2",
        "pergunta": "Na higiene pessoal, como lavar mãos, escovar dentes e tomar banho, de que ajuda precisa?",
        "item": "POSSUI INDEPENDÊNCIA DE HIGIENE PESSOAL",
        "tipo": "autonomia",
        "origem": "avd_2"
      }
    ]
  },
  {
    "numero": 17,
    "titulo": "Na hora de comer e beber, o que consegue fazer por conta própria?",
    "ajuda": "Diferencie preparar ou cortar a comida de levar o alimento à boca. Pode mencionar utensílios adaptados e o que ajuda nas refeições.",
    "itens": [
      {
        "id": "avd_3",
        "pergunta": "Para comer e beber, de que ajuda precisa durante a refeição?",
        "item": "POSSUI INDEPENDÊNCIA DE ALIMENTAÇÃO",
        "tipo": "autonomia",
        "origem": "avd_3"
      },
      {
        "id": "avd_alimentacao_contexto",
        "origem": null,
        "item": "Contexto complementar: alimentação",
        "tipo": "descricao",
        "pergunta": "Como é a alimentação no dia a dia? Conte horários e locais das refeições, alimentos aceitos ou recusados e diferenças com textura, cheiro ou temperatura. Há alergia, intolerância, restrição, orientação profissional, engasgos ou dificuldade para mastigar ou engolir que a escola precise conhecer? O que ajuda a comer com conforto? Informe apenas o que considerar necessário."
      }
    ]
  },
  {
    "numero": 18,
    "titulo": "Ao trocar de roupa e cuidar dos calçados, o que faz sem ajuda e o que precisa de apoio?",
    "ajuda": "Cada atividade pode precisar de um apoio diferente. Se não usa cadarços ou ainda não teve oportunidade, informe isso.",
    "itens": [
      {
        "id": "avd_4",
        "pergunta": "Para vestir as roupas, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA VESTIR-SE",
        "tipo": "autonomia",
        "origem": "avd_4"
      },
      {
        "id": "avd_5",
        "pergunta": "Para tirar as roupas, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA DESPIR-SE",
        "tipo": "autonomia",
        "origem": "avd_5"
      },
      {
        "id": "avd_6",
        "pergunta": "Para colocar os calçados, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA CALÇAR",
        "tipo": "autonomia",
        "origem": "avd_6"
      },
      {
        "id": "avd_7",
        "pergunta": "Para tirar os calçados, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA DESCALÇAR",
        "tipo": "autonomia",
        "origem": "avd_7"
      },
      {
        "id": "avd_8",
        "pergunta": "Para amarrar os cadarços, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA AMARRAR O TÊNIS",
        "tipo": "autonomia",
        "origem": "avd_8"
      },
      {
        "id": "avd_9_ziper",
        "pergunta": "Para abrir e fechar zíperes, de que ajuda precisa?",
        "item": "ABRE E FECHA ZÍPER, TAMPAS (POTES, EMBALAGENS DE HIGIENE PESSOAL)",
        "tipo": "autonomia",
        "origem": "avd_9"
      },
      {
        "id": "avd_9_tampas",
        "pergunta": "Para abrir e fechar tampas de potes ou embalagens, de que ajuda precisa?",
        "item": "ABRE E FECHA ZÍPER, TAMPAS (POTES, EMBALAGENS DE HIGIENE PESSOAL)",
        "tipo": "autonomia",
        "origem": "avd_9"
      }
    ]
  },
  {
    "numero": 19,
    "titulo": "Como cuida das próprias coisas?",
    "ajuda": "Por exemplo: reconhecer e guardar mochila, roupas ou brinquedos. Precisa de lembretes ou ajuda?",
    "itens": [
      {
        "id": "avd_11",
        "pergunta": "Como cuida dos próprios objetos, como mochila, roupas e brinquedos? Guarda, reconhece e procura seus pertences?",
        "item": "APRESENTA CUIDADO COM SEUS PERTENCES",
        "tipo": "habilidade",
        "origem": "avd_11"
      }
    ]
  },
  {
    "numero": 20,
    "titulo": "Quando desenha, escreve ou monta brinquedos, como realiza essas atividades?",
    "ajuda": "Conte apenas situações que já observou. Se nunca teve acesso a esse brinquedo, marque que não sabe. Não precisa avaliar se a forma de segurar o lápis é correta.",
    "itens": [
      {
        "id": "avd_12",
        "pergunta": "Como segura o lápis ou outro recurso para desenhar e escrever? Há adaptação, desconforto ou cansaço?",
        "item": "SEGURA O LÁPIS CORRETAMENTE (PREENSÃO DE PINÇA)",
        "tipo": "descricao",
        "origem": "avd_12"
      },
      {
        "id": "avd_13",
        "pergunta": "Consegue montar um quebra-cabeça de quatro peças? Faz com ou sem ajuda? Se não teve acesso, informe.",
        "item": "CONSEGUE MONTAR QUEBRA CABEÇA COM 4 PEÇAS",
        "tipo": "habilidade",
        "origem": "avd_13"
      },
      {
        "id": "avd_14",
        "pergunta": "Consegue montar um quebra-cabeça com mais de cinquenta peças? Faz com ou sem ajuda? Se não teve acesso, informe.",
        "item": "CONSEGUE MONTAR QUEBRA CABEÇA COM MAIS DE 50 PEÇAS",
        "tipo": "habilidade",
        "origem": "avd_14"
      }
    ]
  },
  {
    "numero": 21,
    "titulo": "Como é a convivência com outras crianças e com o professor ou a professora?",
    "ajuda": "Sobre o professor, responda pelo que presenciou ou recebeu de informação da escola e diga qual foi a fonte. Se não sabe, marque essa opção.",
    "itens": [
      {
        "id": "social_0",
        "pergunta": "Como brinca e convive com outras crianças? O que ajuda a participar?",
        "item": "BRINCA E SOCIALIZA COM OS COLEGAS",
        "tipo": "descricao",
        "origem": "social_0"
      },
      {
        "id": "social_1",
        "pergunta": "O que sabe sobre a relação da criança com o professor ou a professora? Como recebeu essa informação?",
        "item": "RELACIONA-SE BEM COM A PROFESSORA",
        "tipo": "descricao",
        "origem": "social_1"
      }
    ]
  },
  {
    "numero": 22,
    "titulo": "O que desperta seu interesse em aprender ou experimentar algo novo?",
    "ajuda": "Conte quais atividades despertam interesse e o que ajuda a experimentar ou continuar. Precisar de apoio não significa falta de vontade.",
    "itens": [
      {
        "id": "social_2",
        "pergunta": "O que desperta seu interesse em aprender e o que a ajuda a continuar?",
        "item": "POSSUI MOTIVAÇÃO PARA APRENDER",
        "tipo": "descricao",
        "origem": "social_2"
      }
    ]
  },
  {
    "numero": 23,
    "titulo": "Como reage aos combinados e a situações que exigem cuidado?",
    "ajuda": "Conte situações já vividas, sem criar situações de risco. Compreender um combinado e perceber perigo são coisas diferentes.",
    "itens": [
      {
        "id": "social_3",
        "pergunta": "Como demonstra compreender combinados e as consequências das próprias atitudes?",
        "item": "DEMONSTRA NOÇÃO DE CERTO OU ERRADO",
        "tipo": "descricao",
        "origem": "social_3"
      },
      {
        "id": "social_4",
        "pergunta": "Como percebe perigos do cotidiano e de que orientação ou supervisão precisa?",
        "item": "DEMONSTRA TER NOÇÃO DE PERIGO",
        "tipo": "descricao",
        "origem": "social_4"
      }
    ]
  },
  {
    "numero": 24,
    "titulo": "Quando fica triste, irritada, frustrada ou com medo, como reage e o que a ajuda?",
    "ajuda": "Conte como demonstra o que sente e o que costuma ajudar ou piorar. Considere a situação e os apoios, sem julgar uma reação isolada.",
    "itens": [
      {
        "id": "social_5",
        "pergunta": "Como reage quando fica triste, frustrada, irritada ou com medo? O que ajuda a se reorganizar?",
        "item": "CONTROLA SUAS EMOÇÕES",
        "tipo": "descricao",
        "origem": "social_5"
      }
    ]
  },
  {
    "numero": 25,
    "titulo": "Como usa os números e percebe os horários da rotina?",
    "ajuda": "Reconhecer números escritos, contar, perceber a rotina e ler um relógio são habilidades diferentes. Responda separadamente.",
    "itens": [
      {
        "id": "numeros_4",
        "pergunta": "Quais números escritos reconhece? Já observou reconhecer números até 30? Conte quais ou até qual, se souber.",
        "item": "FAZ LEITURA DE NUMERAIS ATÉ 30",
        "tipo": "descricao",
        "origem": "numeros_4"
      },
      {
        "id": "numeros_5",
        "pergunta": "Até qual número costuma contar falando? Já observou contar até 30? Usa ajuda ou outro recurso de comunicação?",
        "item": "REALIZA CONTAGEM ORAL ATÉ 30",
        "tipo": "descricao",
        "origem": "numeros_5"
      },
      {
        "id": "medidas_8",
        "pergunta": "Como percebe os momentos de acordar, almoçar, jantar e dormir? Que lembretes ou apoios utiliza?",
        "item": "TEM NOÇÃO DOS HORÁRIOS DA VIDA DIÁRIA: ACORDAR, ALMOÇAR, JANTAR E DORMIR",
        "tipo": "descricao",
        "origem": "medidas_8"
      },
      {
        "id": "medidas_9",
        "pergunta": "Consegue ler as horas em relógio digital ou de ponteiros? Em qual deles e com que ajuda?",
        "item": "REALIZA LEITURA DAS HORAS",
        "tipo": "descricao",
        "origem": "medidas_9"
      }
    ]
  },
  {
    "numero": 26,
    "titulo": "Como costuma ser o sono da criança?",
    "ajuda": "Compartilhe apenas o que considerar útil à escola. Não precisa detalhar todos os pontos. Pode marcar “não sei” ou “prefiro não informar”.",
    "itens": [
      {
        "id": "rotina_sono",
        "origem": null,
        "item": "Contexto complementar: sono",
        "tipo": "descricao",
        "pergunta": "Em dias de aula, a que horas costuma dormir e acordar? Demora a adormecer, desperta durante a noite ou cochila de dia? Como fica sua disposição ao acordar e durante o dia? Conte o que ajuda, mudanças recentes ou diferenças nos fins de semana. Horários aproximados são suficientes."
      }
    ]
  },
  {
    "numero": 27,
    "titulo": "Como é um dia comum fora do horário escolar?",
    "ajuda": "Compartilhe apenas o que considerar útil à escola. Não precisa detalhar todos os pontos. Pode marcar “não sei” ou “prefiro não informar”.",
    "itens": [
      {
        "id": "rotina_dia",
        "origem": null,
        "item": "Contexto complementar: rotina diária",
        "tipo": "descricao",
        "pergunta": "Conte, com poucas palavras, o que costuma fazer de manhã, à tarde e à noite: brincadeiras, passeios, atividades físicas, convivência, tarefas e outros atendimentos. Se usa telas, quando e por quanto tempo, aproximadamente? Usa algum recurso digital para comunicação ou acessibilidade? Como reage às mudanças de atividade e o que ajuda?"
      }
    ]
  }
];
const areas=[
  {
    "key": "oralidade",
    "titulo": "Comunicação",
    "itens": [
      {
        "id": "oralidade_1",
        "pergunta": "Como mostra desejos e vontades?",
        "item": "EXPRESSA DESEJOS E VONTADES",
        "tipo": "descricao",
        "origem": "oralidade_1"
      },
      {
        "id": "oralidade_15",
        "pergunta": "Utiliza palavras faladas para se comunicar?",
        "item": "COMUNICA-SE POR MEIO DA FALA",
        "tipo": "habilidade",
        "origem": "oralidade_15"
      },
      {
        "id": "oralidade_12",
        "pergunta": "Quando alguém chama pelo nome, costuma responder, olhar, fazer um gesto ou demonstrar que percebeu?",
        "item": "RESPONDE AO SER CHAMADO PELO NOME",
        "tipo": "habilidade",
        "origem": "oralidade_12"
      },
      {
        "id": "oralidade_3",
        "pergunta": "Consegue escutar a outra pessoa durante a conversa e participar da troca?",
        "item": "SABE ESCUTAR",
        "tipo": "habilidade",
        "origem": "oralidade_3"
      },
      {
        "id": "oralidade_17",
        "pergunta": "Consegue acompanhar com atenção o que está sendo falado?",
        "item": "OUVE COM ATENÇÃO",
        "tipo": "habilidade",
        "origem": "oralidade_17"
      },
      {
        "id": "oralidade_4",
        "pergunta": "Conta acontecimentos do dia, como o que fez na escola ou em um passeio?",
        "item": "RELATA FATOS DO COTIDIANO",
        "tipo": "habilidade",
        "origem": "oralidade_4"
      },
      {
        "id": "oralidade_19",
        "pergunta": "Consegue contar novamente uma história que ouviu, mantendo os principais acontecimentos e sua ordem?",
        "item": "RECONTA HISTÓRIAS OUVIDAS COM COERÊNCIA",
        "tipo": "habilidade",
        "origem": "oralidade_19"
      },
      {
        "id": "oralidade_5",
        "pergunta": "Quando fala, você percebe repetições de sons, palavras prolongadas ou bloqueios para continuar?",
        "item": "FALA SEM HESITAR OU GAGUEJAR",
        "tipo": "percepcao",
        "origem": "oralidade_5"
      },
      {
        "id": "oralidade_6",
        "pergunta": "Troca ou deixa de pronunciar sons das palavras, dificultando compreender o que fala?",
        "item": "DIFICULDADE NA DICÇÃO (TROCA OU EMITE FONEMAS)",
        "tipo": "percepcao",
        "origem": "oralidade_6"
      },
      {
        "id": "oralidade_10",
        "pergunta": "Consegue responder perguntas e mostrar sua opinião ou preferência? Como faz isso?",
        "item": "FORMULA RESPOSTAS / EMITE OPINIÕES",
        "tipo": "habilidade",
        "origem": "oralidade_10"
      },
      {
        "id": "oralidade_20",
        "pergunta": "Consegue levar um recado, fazer um pedido ou transmitir um aviso a outra pessoa? Usa quais recursos?",
        "item": "TRANSMITE RECADOS, PEDIDOS OU AVISOS",
        "tipo": "habilidade",
        "origem": "oralidade_20"
      },
      {
        "id": "oralidade_14",
        "pergunta": "Imita gestos, movimentos de músicas ou pequenas sequências de dança, com as adaptações de que precisa?",
        "item": "IMITA GESTOS E COREOGRAFIAS",
        "tipo": "habilidade",
        "origem": "oralidade_14"
      }
    ]
  },
  {
    "key": "leitura",
    "titulo": "Leitura",
    "itens": [
      {
        "id": "leitura_2",
        "pergunta": "Reconhece o próprio nome quando está escrito entre outros nomes?",
        "item": "VISUALIZA E RECONHECE SEU NOME ESCRITO",
        "tipo": "habilidade",
        "origem": "leitura_2"
      },
      {
        "id": "leitura_3",
        "pergunta": "Quais letras do alfabeto reconhece quando estão escritas?",
        "item": "LÊ E RECONHECE AS LETRAS DO ALFABETO",
        "tipo": "descricao",
        "origem": "leitura_3"
      },
      {
        "id": "leitura_7",
        "pergunta": "Lê sílabas, como PA, ME ou SOL, sem depender apenas de decorar uma palavra inteira? Dê exemplos que já tenha observado.",
        "item": "REALIZA LEITURA DE SÍLABAS",
        "tipo": "habilidade",
        "origem": "leitura_7"
      },
      {
        "id": "leitura_8",
        "pergunta": "Lê palavras simples, como PATO ou MALA? Quais exemplos vocês já observaram?",
        "item": "REALIZA LEITURA DE PALAVRAS SIMPLES",
        "tipo": "habilidade",
        "origem": "leitura_8"
      },
      {
        "id": "leitura_9",
        "pergunta": "Lê palavras com combinações mais complexas, como PRATO, CHAVE ou BRINQUEDO? Quais?",
        "item": "REALIZA LEITURA DE PALAVRAS COMPLEXAS",
        "tipo": "habilidade",
        "origem": "leitura_9"
      },
      {
        "id": "leitura_10",
        "pergunta": "Lê frases curtas? Conte um exemplo ou uma situação em que isso aconteceu.",
        "item": "REALIZA LEITURA DE FRASES",
        "tipo": "habilidade",
        "origem": "leitura_10"
      },
      {
        "id": "leitura_11",
        "pergunta": "Lê pequenos textos? Depois consegue contar ou mostrar o que entendeu?",
        "item": "REALIZA LEITURA DE PEQUENOS TEXTOS",
        "tipo": "habilidade",
        "origem": "leitura_11"
      }
    ]
  },
  {
    "key": "escrita",
    "titulo": "Escrita",
    "itens": [
      {
        "id": "escrita_1",
        "pergunta": "Faz tentativas de escrever letras? Como são essas tentativas e quais recursos utiliza?",
        "item": "REALIZA TENTATIVA DE ESCRITA DE LETRAS",
        "tipo": "escrita",
        "origem": "escrita_1"
      },
      {
        "id": "escrita_2",
        "pergunta": "Escreve o próprio nome? Faz sem modelo, copiando ou com ajuda? Conte como.",
        "item": "ESCREVE SEU NOME",
        "tipo": "escrita",
        "origem": "escrita_2"
      },
      {
        "id": "escrita_4",
        "pergunta": "Escreve palavras simples, como CASA ou PATO? Faz por conta própria, copiando ou com ajuda?",
        "item": "ESCREVE PALAVRAS SIMPLES",
        "tipo": "escrita",
        "origem": "escrita_4"
      },
      {
        "id": "escrita_5",
        "pergunta": "Escreve palavras como PRATO, CHAVE ou BRINQUEDO? Faz por conta própria, copiando ou com ajuda?",
        "item": "ESCREVE PALAVRAS COMPLEXAS",
        "tipo": "escrita",
        "origem": "escrita_5"
      },
      {
        "id": "escrita_6",
        "pergunta": "Escreve frases? Conte um exemplo e diga se usa modelo ou ajuda.",
        "item": "ESCREVE FRASES",
        "tipo": "escrita",
        "origem": "escrita_6"
      },
      {
        "id": "escrita_7",
        "pergunta": "Escreve pequenos textos, bilhetes ou relatos? Que apoio costuma precisar?",
        "item": "ESCREVE TEXTOS PEQUENOS",
        "tipo": "escrita",
        "origem": "escrita_7"
      }
    ]
  },
  {
    "key": "percepcao",
    "titulo": "Percepção e atenção",
    "itens": [
      {
        "id": "percepcao_4",
        "pergunta": "Demonstra compreender sons conhecidos e palavras faladas no cotidiano? Como vocês percebem isso?",
        "item": "COMPREENDE SONS OU PALAVRAS FALADAS",
        "tipo": "habilidade",
        "origem": "percepcao_4"
      },
      {
        "id": "percepcao_7",
        "pergunta": "Compreende pedidos simples, como pegar o copo ou guardar um brinquedo? Precisa de gesto, imagem, repetição ou outro apoio?",
        "item": "COMPREENDE COMANDOS SIMPLES",
        "tipo": "habilidade",
        "origem": "percepcao_7"
      },
      {
        "id": "percepcao_5",
        "pergunta": "Como demonstra que percebe diferenças entre doce, salgado e azedo?",
        "item": "IDENTIFICA NA PERCEPÇÃO GUSTATIVA (AZEDO, DOCE, SALGADO)",
        "tipo": "descricao",
        "origem": "percepcao_5"
      },
      {
        "id": "percepcao_6",
        "pergunta": "Quais sabores aceita experimentar e quais evita?",
        "item": "ACEITA EXPERIMENTAR NA PERCEPÇÃO GUSTATIVA (AZEDO, DOCE, SALGADO)",
        "tipo": "descricao",
        "origem": "percepcao_6"
      },
      {
        "id": "percepcao_8",
        "pergunta": "Consegue acompanhar uma atividade quando há barulho ou pessoas se movimentando? O que ajuda e o que dificulta?",
        "item": "CONCENTRA-SE DIANTE DE BARULHO E MOVIMENTOS",
        "tipo": "habilidade",
        "origem": "percepcao_8"
      }
    ]
  },
  {
    "key": "avd",
    "titulo": "Autonomia e alimentação",
    "itens": [
      {
        "id": "avd_0",
        "pergunta": "Como se desloca pelos ambientes do dia a dia? Faz com autonomia, com equipamentos ou com ajuda de alguém?",
        "item": "TEM AUTONOMIA EM SUA LOCOMOÇÃO",
        "tipo": "habilidade",
        "origem": "avd_0"
      },
      {
        "id": "avd_1",
        "pergunta": "No uso do banheiro, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA O USO DO BANHEIRO",
        "tipo": "autonomia",
        "origem": "avd_1"
      },
      {
        "id": "avd_2",
        "pergunta": "Na higiene pessoal, como lavar mãos, escovar dentes e tomar banho, de que ajuda precisa?",
        "item": "POSSUI INDEPENDÊNCIA DE HIGIENE PESSOAL",
        "tipo": "autonomia",
        "origem": "avd_2"
      },
      {
        "id": "avd_3",
        "pergunta": "Para comer e beber, de que ajuda precisa durante a refeição?",
        "item": "POSSUI INDEPENDÊNCIA DE ALIMENTAÇÃO",
        "tipo": "autonomia",
        "origem": "avd_3"
      },
      {
        "id": "avd_alimentacao_contexto",
        "origem": null,
        "item": "Contexto complementar: alimentação",
        "tipo": "descricao",
        "pergunta": "Como é a alimentação no dia a dia? Conte horários e locais das refeições, alimentos aceitos ou recusados e diferenças com textura, cheiro ou temperatura. Há alergia, intolerância, restrição, orientação profissional, engasgos ou dificuldade para mastigar ou engolir que a escola precise conhecer? O que ajuda a comer com conforto? Informe apenas o que considerar necessário."
      },
      {
        "id": "avd_4",
        "pergunta": "Para vestir as roupas, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA VESTIR-SE",
        "tipo": "autonomia",
        "origem": "avd_4"
      },
      {
        "id": "avd_5",
        "pergunta": "Para tirar as roupas, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA DESPIR-SE",
        "tipo": "autonomia",
        "origem": "avd_5"
      },
      {
        "id": "avd_6",
        "pergunta": "Para colocar os calçados, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA CALÇAR",
        "tipo": "autonomia",
        "origem": "avd_6"
      },
      {
        "id": "avd_7",
        "pergunta": "Para tirar os calçados, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA DESCALÇAR",
        "tipo": "autonomia",
        "origem": "avd_7"
      },
      {
        "id": "avd_8",
        "pergunta": "Para amarrar os cadarços, de que ajuda precisa?",
        "item": "TEM AUTONOMIA PARA AMARRAR O TÊNIS",
        "tipo": "autonomia",
        "origem": "avd_8"
      },
      {
        "id": "avd_9_ziper",
        "pergunta": "Para abrir e fechar zíperes, de que ajuda precisa?",
        "item": "ABRE E FECHA ZÍPER, TAMPAS (POTES, EMBALAGENS DE HIGIENE PESSOAL)",
        "tipo": "autonomia",
        "origem": "avd_9"
      },
      {
        "id": "avd_9_tampas",
        "pergunta": "Para abrir e fechar tampas de potes ou embalagens, de que ajuda precisa?",
        "item": "ABRE E FECHA ZÍPER, TAMPAS (POTES, EMBALAGENS DE HIGIENE PESSOAL)",
        "tipo": "autonomia",
        "origem": "avd_9"
      },
      {
        "id": "avd_11",
        "pergunta": "Como cuida dos próprios objetos, como mochila, roupas e brinquedos? Guarda, reconhece e procura seus pertences?",
        "item": "APRESENTA CUIDADO COM SEUS PERTENCES",
        "tipo": "habilidade",
        "origem": "avd_11"
      },
      {
        "id": "avd_12",
        "pergunta": "Como segura o lápis ou outro recurso para desenhar e escrever? Há adaptação, desconforto ou cansaço?",
        "item": "SEGURA O LÁPIS CORRETAMENTE (PREENSÃO DE PINÇA)",
        "tipo": "descricao",
        "origem": "avd_12"
      },
      {
        "id": "avd_13",
        "pergunta": "Consegue montar um quebra-cabeça de quatro peças? Faz com ou sem ajuda? Se não teve acesso, informe.",
        "item": "CONSEGUE MONTAR QUEBRA CABEÇA COM 4 PEÇAS",
        "tipo": "habilidade",
        "origem": "avd_13"
      },
      {
        "id": "avd_14",
        "pergunta": "Consegue montar um quebra-cabeça com mais de cinquenta peças? Faz com ou sem ajuda? Se não teve acesso, informe.",
        "item": "CONSEGUE MONTAR QUEBRA CABEÇA COM MAIS DE 50 PEÇAS",
        "tipo": "habilidade",
        "origem": "avd_14"
      }
    ]
  },
  {
    "key": "social",
    "titulo": "Convivência e emoções",
    "itens": [
      {
        "id": "social_0",
        "pergunta": "Como brinca e convive com outras crianças? O que ajuda a participar?",
        "item": "BRINCA E SOCIALIZA COM OS COLEGAS",
        "tipo": "descricao",
        "origem": "social_0"
      },
      {
        "id": "social_1",
        "pergunta": "O que sabe sobre a relação da criança com o professor ou a professora? Como recebeu essa informação?",
        "item": "RELACIONA-SE BEM COM A PROFESSORA",
        "tipo": "descricao",
        "origem": "social_1"
      },
      {
        "id": "social_2",
        "pergunta": "O que desperta seu interesse em aprender e o que a ajuda a continuar?",
        "item": "POSSUI MOTIVAÇÃO PARA APRENDER",
        "tipo": "descricao",
        "origem": "social_2"
      },
      {
        "id": "social_3",
        "pergunta": "Como demonstra compreender combinados e as consequências das próprias atitudes?",
        "item": "DEMONSTRA NOÇÃO DE CERTO OU ERRADO",
        "tipo": "descricao",
        "origem": "social_3"
      },
      {
        "id": "social_4",
        "pergunta": "Como percebe perigos do cotidiano e de que orientação ou supervisão precisa?",
        "item": "DEMONSTRA TER NOÇÃO DE PERIGO",
        "tipo": "descricao",
        "origem": "social_4"
      },
      {
        "id": "social_5",
        "pergunta": "Como reage quando fica triste, frustrada, irritada ou com medo? O que ajuda a se reorganizar?",
        "item": "CONTROLA SUAS EMOÇÕES",
        "tipo": "descricao",
        "origem": "social_5"
      }
    ]
  },
  {
    "key": "numeros",
    "titulo": "Números",
    "itens": [
      {
        "id": "numeros_4",
        "pergunta": "Quais números escritos reconhece? Já observou reconhecer números até 30? Conte quais ou até qual, se souber.",
        "item": "FAZ LEITURA DE NUMERAIS ATÉ 30",
        "tipo": "descricao",
        "origem": "numeros_4"
      },
      {
        "id": "numeros_5",
        "pergunta": "Até qual número costuma contar falando? Já observou contar até 30? Usa ajuda ou outro recurso de comunicação?",
        "item": "REALIZA CONTAGEM ORAL ATÉ 30",
        "tipo": "descricao",
        "origem": "numeros_5"
      }
    ]
  },
  {
    "key": "medidas",
    "titulo": "Horários",
    "itens": [
      {
        "id": "medidas_8",
        "pergunta": "Como percebe os momentos de acordar, almoçar, jantar e dormir? Que lembretes ou apoios utiliza?",
        "item": "TEM NOÇÃO DOS HORÁRIOS DA VIDA DIÁRIA: ACORDAR, ALMOÇAR, JANTAR E DORMIR",
        "tipo": "descricao",
        "origem": "medidas_8"
      },
      {
        "id": "medidas_9",
        "pergunta": "Consegue ler as horas em relógio digital ou de ponteiros? Em qual deles e com que ajuda?",
        "item": "REALIZA LEITURA DAS HORAS",
        "tipo": "descricao",
        "origem": "medidas_9"
      }
    ]
  },
  {
    "key": "rotina",
    "titulo": "Sono e rotina diária",
    "itens": [
      {
        "id": "rotina_sono",
        "origem": null,
        "item": "Contexto complementar: sono",
        "tipo": "descricao",
        "pergunta": "Em dias de aula, a que horas costuma dormir e acordar? Demora a adormecer, desperta durante a noite ou cochila de dia? Como fica sua disposição ao acordar e durante o dia? Conte o que ajuda, mudanças recentes ou diferenças nos fins de semana. Horários aproximados são suficientes."
      },
      {
        "id": "rotina_dia",
        "origem": null,
        "item": "Contexto complementar: rotina diária",
        "tipo": "descricao",
        "pergunta": "Conte, com poucas palavras, o que costuma fazer de manhã, à tarde e à noite: brincadeiras, passeios, atividades físicas, convivência, tarefas e outros atendimentos. Se usa telas, quando e por quanto tempo, aproximadamente? Usa algum recurso digital para comunicação ou acessibilidade? Como reage às mudanças de atividade e o que ajuda?"
      }
    ]
  }
];
const comuns={nao_sabe:'Não sei / não teve oportunidade',nao_informar:'Prefiro não informar'};
const tipos={
 habilidade:{observa:'Faz habitualmente',apoio:'Em algumas situações ou com apoio',ainda_nao:'Ainda não observei fazer',...comuns},
 autonomia:{autonomo:'Realiza sem ajuda de outra pessoa, com seus recursos habituais',alguma_ajuda:'Precisa de lembretes ou alguma ajuda',muita_ajuda:'Precisa de ajuda na maior parte da atividade',...comuns},
 escrita:{sem_modelo:'Escreve sem modelo',copia:'Copia um modelo',com_ajuda:'Faz com ajuda',ainda_nao:'Ainda não observei fazer',...comuns},
 percepcao:{frequente:'Percebo frequentemente',as_vezes:'Percebo em algumas situações',nao_percebe:'Não percebo',nao_utiliza_fala:'Não utiliza fala',...comuns},
 descricao:{relato:'Quero contar como acontece',nao_sabe:'Não sei / ainda não observei',nao_informar:'Prefiro não informar'}
};
const opcoes={...Object.assign({},...Object.values(tipos)),observa:'Faz habitualmente',apoio:'Em algumas situações ou com apoio'};
const itens=areas.flatMap(a=>a.itens);
const opcoesDaPergunta=q=>tipos[q.tipo]||tipos.habilidade;
const rotulo=(q,v)=>opcoesDaPergunta(q)[v]||'Não informado';
function validar(d){
 if(!d||!d.responsavel?.trim()||d.responsavel.length>120||!d.vinculo?.trim()||d.vinculo.length>80||d.ciencia!==true)return 'Informe quem responde, seu vínculo e leia as informações sobre o uso das respostas.';
 if((d.contexto||'').length>2000||(d.observacoes||'').length>2000)return 'Os campos de contexto e informações finais devem ter até 2.000 caracteres.';
 for(const q of itens){const v=d.respostas?.[q.id],nota=d.observacoesPerguntas?.[q.id]||'';
  if(!Object.hasOwn(opcoesDaPergunta(q),v))return 'Responda ou marque não sei: '+q.pergunta;
  if(nota.length>1000)return 'Use até 1.000 caracteres na observação: '+q.pergunta;
  if(v==='relato'&&!nota.trim())return 'Escreva seu relato ou marque não sei: '+q.pergunta;
 }
 return '';
}
window.QuestionarioFamiliaModelo=Object.freeze({grupos,areas,itens,opcoes,tipos,opcoesDaPergunta,rotulo,validar});
})();
