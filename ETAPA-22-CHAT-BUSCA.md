# Busca no chat

Branch cumulativa: `melhorias/etapa-22-chat-busca`.
Inclui agenda, resumo por período e leitura do chat. Preparada sem publicação
no Netlify; a última versão publicada pelo usuário foi a etapa 18.

## Como usar

Abrir o chat e Buscar mensagens. Digitar palavras do texto, nome ou e-mail do
autor. A busca ignora maiúsculas e acentos e exige todas as palavras informadas,
sem exigir a mesma ordem. Não é filtro por data nem busca em documentos.

As setas Anterior/Próximo ou Enter levam até a mensagem e mostram a posição do
resultado. A navegação é circular; antes da primeira seleção, Anterior leva ao
último resultado. Os resultados recebem fundo de destaque, e a mensagem atual
recebe contorno verde. Limpar busca remove o termo e os destaques.

A conversa inteira permanece disponível; a busca não apaga nem esconde mensagens
não correspondentes. Apenas navegar até um resultado muda a posição da leitura.
Novidades podem atualizar a contagem sem deslocar automaticamente a conversa.

## Escopo explícito

A busca consulta somente o mapa de mensagens carregadas nesta sessão: inicialmente
até as 100 mais recentes e os lotes anteriores que o usuário pedir para carregar.
A interface mostra a quantidade carregada e explica esse limite. Nenhum resultado
não significa que o termo nunca foi usado no histórico inteiro.

Carregar mensagens anteriores mantém o termo e incorpora o novo lote à busca.
Não existe consulta de mensagens ao digitar, limpar ou navegar entre resultados;
carregar histórico continua sendo uma ação explícita com o mecanismo anterior.
As confirmações de leitura continuam usando o mecanismo de exposição existente:
um resultado fora da área visível não é confirmado só por ter correspondido.
Ao navegar até ele e deixá-lo visível, a confirmação pode ser registrada normalmente.

## Interface e preservação

Campo com rótulo acessível, setas nomeadas, Enter, contagem com aviso de estado e
foco na mensagem localizada. A presença fica temporariamente oculta durante a
busca para liberar espaço e retorna quando a busca é recolhida. No celular o
painel fica mais alto durante a consulta; o rascunho permanece intacto.

Recolher apenas a busca preserva o termo na mesma conversa. Fechar o chat limpa
a busca sem apagar o rascunho; trocar conta ou sair limpa ambos. A consulta não
é persistida no navegador, enviada à IA ou gravada como mensagem.

Sem mudanças em campos/regras/índices Firebase, permissões ou modelos de exportação.
Esta etapa não inclui resposta citada, fixação de avisos ou anexos.

## Validação

Testes integrados do chat aprovados com duas contas e Firebase simulado:
- Termo não encontrado inicialmente aparece após carregar o lote anterior.
- Busca de autor com acento por texto sem acento, maiúsculas e múltiplas palavras.
- Nenhuma busca automática de mensagens ao digitar ou navegar.
- Consulta com texto HTML permanece segura, sem criar elementos executáveis.
- Setas circulares, Enter, destaque e limpeza.
- Novidade recebida atualiza o resultado sem selecioná-lo ou deslocar a leitura.
- Rascunho preservado; busca limpa ao fechar e ao trocar conta.
- Mensagem não exposta não recebe confirmação por constar nos resultados;
  navegar até ela permite confirmar exposição normalmente.
- Larguras de 390/320 px sem transbordamento, com área de mensagens utilizável.
- Regressões de envio, falha/reenvio sem duplicar, histórico, datas, não lidas,
  ampliação, aviso de novidades, Escape e logout.

Mais dez verificações dos estados de presença e 91 de isolamento/sintaxe.
Dados fictícios e pedidos externos bloqueados. Capturas do computador e celular
revisadas visualmente. Conferência manual no Netlify ainda pendente.

## Publicação futura

Baixar a branch completa quando decidir publicar no site de teste, incluindo
`chat-equipe.js/css` atualizados e os arquivos anteriores. Nenhuma alteração
Firebase necessária. Prévias em `previas/chat-busca.png` e
`previas/chat-busca-celular.png`.
