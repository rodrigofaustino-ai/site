# Firebase de teste: habilitar Apagar no chat

Status: o usuário confirmou a publicação e o funcionamento da etapa 24.
O ajuste visual da etapa 25 não exige nova atualização de regras.
Este documento registra a preparação anterior. As regras da etapa 23 já
foram publicadas e conferidas pelo usuário. Emojis não exigem alteração de regra;
a nova permissão é necessária para apagar o texto das próprias mensagens.

## Proposta pronta

Arquivo completo: `firebase/chat-emojis-exclusao-teste.rules`.
Parte de `firebase/chat-respostas-teste.rules`. Somente o bloco de mensagens do
chat foi alterado; demais coleções e confirmações de leitura foram preservadas.

Permite uma única transição pelo autor: texto vazio, apagada=true e apagadaEm
igual ao horário do servidor. Preserva autoria, createdAt e respostaId. Não
permite editar mensagens, trocar metadados, restaurar texto, apagar mensagem de
outra conta ou remover fisicamente o documento. Resposta nova para original
apagado é recusada. Assim, referências existentes mantêm seu contexto sem
mostrar novamente o conteúdo removido.

## Quando publicar

1. No Firebase Console, selecionar **Ambiente Teste — ambienteteste-e368e**.
2. Abrir **Firestore Database → Regras** e salvar uma cópia do texto atual.
3. Conferir a proposta completa deste pacote. Se as regras publicadas tiverem
   recebido mudanças fora destas etapas, revisar essas diferenças antes de
   substituir pelo conjunto proposto.
4. Copiar o conteúdo completo de `firebase/chat-emojis-exclusao-teste.rules`
   para o editor do projeto de teste e publicar.
5. Publicar a pasta completa da branch `melhorias/etapa-24-chat-emojis-exclusao`
   no Netlify de teste e atualizar as abas dos participantes com Ctrl+Shift+R.
6. Testar emojis e uma exclusão com duas contas e mensagens fictícias. Somente
   o autor deve ver Apagar; Cancelar deve manter o texto. Ao confirmar, a outra
   conta e as respostas devem mostrar a indicação de mensagem apagada.

Não aplicar ao projeto oficial. Não alterar Realtime Database, Storage ou índices.
Não há migração das mensagens antigas; a transição só ocorre quando o autor
confirma Apagar. Identificação e contexto permanecem, mas o texto removido não
possui opção de restauração na interface.

## Evidência

42 verificações específicas de exclusão e compatibilidade no emulador, mais 139
de autorização dos alunos e 80 de compartilhamento, usando o conjunto completo.
O conteúdo fora do bloco das mensagens foi comparado à base anterior.
Testes com dados fictícios; nenhum serviço real foi alterado nesta tarefa.
