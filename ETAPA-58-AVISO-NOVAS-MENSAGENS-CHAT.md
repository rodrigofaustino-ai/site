# Etapa 58 — Aviso de novas mensagens no chat

Inclui aviso discreto no canto inferior esquerdo, com autor, trecho da mensagem e Ver conversa. Fecha automaticamente em três segundos ou pelo botão ×. Clicar abre o chat pelo fluxo existente. Não muda o foco ao chegar, não envia mensagens e não registra leitura apenas por exibir o aviso. O contador de não lidas permanece disponível após ele sumir.

Avisa somente mensagens novas de outras pessoas enquanto a aba está visível e o usuário não está vendo o fim da conversa. Quando o chat está aberto e acompanhando as últimas mensagens, evita aviso redundante. Enquanto lê mensagens antigas, a posição da conversa é preservada e o aviso permite abrir o fim. Novas mensagens em sequência são agrupadas, mostrando o autor/trecho da mais recente e reiniciando o prazo de três segundos a partir da última chegada.

O primeiro snapshot confirmado pelo servidor estabelece a referência: não avisa histórico inicial, inclusive ao iniciar pelo cache e confirmar no servidor. A inscrição usa includeMetadataChanges para reconhecer essa confirmação mesmo sem alteração do conteúdo. IDs conhecidos evitam repetições e alterações; o limite temporal inicial evita tratar uma mensagem antiga que entrou na janela da consulta como novidade. Cache e escritas pendentes não geram avisos até confirmação. Não há consulta extra, coleção nova, regra nova ou gravação para a notificação.

Não avisa mensagens próprias, apagadas ou indisponíveis. Apagar uma mensagem remove seu trecho de um aviso ainda visível. Anexos aparecem por nome, sem baixar o arquivo por causa do aviso. Texto e autor são inseridos como texto simples; o recorte preserva emojis. Ocultar a aba, erro de conexão, logout ou troca de conta limpa aviso, conteúdo e timer. Um timer antigo não encerra um aviso mais novo. Não usa Notification API, som ou permissão do navegador.

## Validação

55 verificações novas em navegador com relógio controlado: ainda visível em 2.999 ms e oculto em 3.000 ms; foco e não lidas preservados; cache/servidor/metadados; próprias, alterações, exclusões e entradas antigas; mensagens em lote e reinício do timer; anexo, texto seguro e emoji; abrir chat; aba oculta; erro/reconexão; callback antigo após logout; nova conta; celular 390/320 pixels; ausência de gravações automáticas. Dados fictícios e pedidos externos bloqueados.

Regressões do chat: envio em duas sessões, leitura/recibos, busca, posição, histórico, emojis, exclusão, respostas e anexos; cobertura de IA e configuração/sintaxe. Simuladores de Firestore atualizados para a assinatura do SDK com opções de metadados. Prévias em previas/etapa-58.

## Publicação manual

Pacote cumulativo da etapa 58, incluindo as assinaturas padronizadas e demais melhorias. Sem alteração de Firebase para quem já publicou as permissões anteriores. Extraia e publique no Netlify a pasta que contém index.html, aguarde Published e atualize com Ctrl + Shift + R. Nenhum deploy ou alteração de dados reais foi executado pelo assistente.
