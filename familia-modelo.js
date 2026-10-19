/* Perguntas adaptadas da Diagnóstica para observações da família no cotidiano. */
window.QuestionarioFamiliaModelo = {
  versao: 1,
  opcoes: {
    observa:'Observo com frequência', as_vezes:'Observo às vezes', apoio:'Observo com apoio ou ajuda',
    ainda_nao:'Ainda não observo', nao_sabe:'Não sei informar', nao_observou:'Não tive oportunidade de observar', nao_informar:'Prefiro não responder'
  },
  grupos: [
    {key:'oralidade',titulo:'Comunicação',perguntas:[
      ['comunica_escolha','Como expressa desejos, necessidades ou escolhas? Você observa essa comunicação por fala, gestos, figuras ou outro recurso?'],
      ['comunica_chamado','Responde quando alguém chama ou procura sua atenção, usando a forma de comunicação habitual da criança?'],
      ['comunica_fatos','Conta ou mostra algo que aconteceu no dia, pela fala, gestos, imagens ou outros recursos?']
    ]},
    {key:'leitura',titulo:'Livros, imagens e leitura',perguntas:[
      ['leitura_nome','Reconhece o próprio nome escrito quando ele aparece em seus objetos ou materiais?'],
      ['leitura_imagens','Reconhece imagens, símbolos ou marcas presentes no cotidiano?'],
      ['leitura_historia','Acompanha histórias ou livros, com os recursos de acesso de que precisa?']
    ]},
    {key:'escrita',titulo:'Desenhos e registros',perguntas:[
      ['escrita_registro','Faz registros por desenhos, marcas, letras ou recursos de tecnologia?'],
      ['escrita_nome','Tenta registrar o próprio nome, com os recursos que utiliza?'],
      ['escrita_palavras','Tenta registrar palavras ou mensagens, com escrita, letras móveis ou tecnologia?']
    ]},
    {key:'percepcao',titulo:'Percepção e orientações',perguntas:[
      ['percepcao_comando','Compreende uma orientação simples do cotidiano, apresentada de forma acessível?'],
      ['percepcao_textura','Explora diferentes texturas em brincadeiras ou atividades do dia a dia, quando se sente confortável?'],
      ['percepcao_objeto','Reconhece objetos familiares ao vê-los, tocá-los ou utilizar outros sentidos e recursos?']
    ]},
    {key:'avd',titulo:'Atividades da vida diária',perguntas:[
      ['avd_alimentacao','Participa da própria alimentação, utilizando adaptações ou ajuda quando necessárias?'],
      ['avd_higiene','Participa dos cuidados de higiene e do uso do banheiro, com os apoios necessários?'],
      ['avd_vestir','Participa ao vestir ou tirar roupas e calçados, com as adaptações ou ajuda necessárias?']
    ]},
    {key:'social',titulo:'Convivência e participação',perguntas:[
      ['social_interacao','Participa de brincadeiras ou interações com pessoas conhecidas?'],
      ['social_emocoes','Expressa sentimentos ou sinaliza quando precisa de ajuda, pausa ou acolhimento?'],
      ['social_combinados','Participa dos combinados e das rotinas da família, com mediação quando necessária?']
    ]},
    {key:'numeros',titulo:'Quantidades e números',perguntas:[
      ['numeros_uso','Reconhece números em situações do cotidiano, como calendários, embalagens ou jogos?'],
      ['numeros_quantidade','Relaciona pequenas quantidades a números em brincadeiras ou situações diárias?'],
      ['numeros_compara','Percebe quando há mais ou menos objetos em situações do cotidiano?']
    ]},
    {key:'formas',titulo:'Formas e cores',perguntas:[
      ['formas_iguais','Agrupa ou combina objetos com formas parecidas em brincadeiras?'],
      ['formas_reconhece','Reconhece formas como círculo, quadrado ou triângulo em objetos do cotidiano?'],
      ['formas_cores','Reconhece ou combina cores em materiais e brincadeiras acessíveis?']
    ]},
    {key:'medidas',titulo:'Rotina, tempo e espaço',perguntas:[
      ['medidas_rotina','Reconhece momentos da rotina, como acordar, alimentar-se e dormir?'],
      ['medidas_sequencia','Compreende o que acontece antes ou depois em uma rotina conhecida?'],
      ['medidas_espaco','Percebe relações como dentro/fora, perto/longe ou grande/pequeno no cotidiano?']
    ]}
  ]
};
