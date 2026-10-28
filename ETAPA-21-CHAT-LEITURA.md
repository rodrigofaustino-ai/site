# Chat: leitura e navegação

Branch cumulativa: `melhorias/etapa-21-chat-leitura`.
Inclui agenda, resumo por período e as melhorias anteriores. Preparada sem
publicação automática no Netlify; a última versão publicada pelo usuário foi a 18.

## Novidades

- Separadores de data na conversa, usando o calendário local do navegador.
  Mensagens ainda sem confirmação de data ficam em grupo próprio.
- Ampliar/Reduzir aumenta a área do painel sem sair do Diário. Preserva a
  mensagem digitada e o trecho da conversa em leitura; não envia nada.
- Quando chegam mensagens de outros profissionais e o leitor está longe do fim,
  o botão Novas mensagens indica quantas chegaram e permite ir ao fim.
  Atualizações repetidas da mesma mensagem não duplicam o contador.
- Se o leitor já está no fim, a conversa acompanha as novidades. Carregar
  mensagens anteriores não é tratado como chegada de novas mensagens.
- A posição usa o identificador de uma mensagem visível como referência, inclusive
  ao inserir separadores e carregar histórico. Escape fecha o painel e retorna
  o foco ao botão de abrir. A ampliação é mantida ao fechar/reabrir na mesma
  sessão; mudar de conta limpa esse estado, o rascunho e o aviso de novidades.

O aviso de novidades é navegação local; não substitui o indicador de não lidas
nem a confirmação individual de exposição na tela. Leituras continuam dependendo
da mensagem estar visível por pelo menos 700 ms com chat aberto e aba visível.

## Presença

Sem presença confirmada, a interface mostra Presença indisponível, sem apresentar
zero como se a consulta estivesse disponível. Quando existe conexão e uma lista
recebida sem erro, mostra Online agora e a quantidade confirmada. Uma falha na
consulta remove a lista anterior, inclusive no ciclo de atualização em memória.

O produtor de eventos agora informa disponibilidade separadamente da lista.
Não foi ativado o Realtime Database do teste e nenhuma URL/regra foi publicada.
Mensagens e presença continuam serviços independentes.

## Preservação

Sem alteração da estrutura das mensagens, permissões, modelos de documentos,
exportações, envio explícito, proteção contra reenvio duplicado e consulta de
leituras. Não adiciona consultas de busca de mensagens para agrupar datas, ampliar o
painel ou contar novidades.
As leituras e mensagens continuam usando os mecanismos anteriores do chat.
Não inclui busca, respostas citadas, anexos ou fixação de avisos nesta etapa.

## Validação

Testes do chat no Chromium aprovados: duas sessões, texto seguro, envio,
falha/reenvio sem duplicação, histórico, não lidas e confirmações de exposição.
Novas verificações: três grupos de datas, chegada enquanto lê trecho antigo,
posição preservada, contagem sem duplicação, novidade não confirmada fora da
área de leitura, ir ao fim, acompanhamento automático quando já está no fim,
ampliar/reduzir, preservação do rascunho, Escape, logout/troca de conta e
larguras de 390/320 px. Controles não criam mensagens por conta própria.

Dez verificações adicionais do produtor real de eventos de presença com SDK
simulado: lista disponível, falha, limpeza da lista antiga, atualização após
falha, recuperação, desconexão e encerramento. Mais 91 verificações de
isolamento/carregamento/sintaxe. Dados fictícios, pedidos externos bloqueados.
Não houve gravações reais nem teste de presença com o Realtime Database real.
Capturas do painel ampliado e celular revisadas visualmente.

## Próxima publicação

Baixar a branch completa quando decidir publicar no Netlify de teste, incluindo
as versões atualizadas de `chat-equipe.js/css` e `chat-presenca.js`, além dos
arquivos das etapas 19 e 20. Nenhuma alteração Firebase necessária. Prévias
na pasta `previas`; conferência manual ainda pendente no site publicado.
