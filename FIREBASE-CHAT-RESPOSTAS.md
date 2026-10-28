# Preparação do Firebase de teste para respostas do chat

Status: o usuário confirmou a publicação e o funcionamento desta etapa 23.
Para a nova exclusão da etapa 24, usar `FIREBASE-CHAT-EXCLUSAO.md`.
Este documento registra a atualização anterior. Ela é necessária somente para ativar
as respostas vinculadas da etapa 23; a mensagem comum continua funcionando.
A proposta preserva as outras regras da base conhecida da etapa 8.

## Arquivo pronto para revisão

`firebase/chat-respostas-teste.rules` contém o conjunto completo proposto.
A diferença frente a `firebase/compartilhamento-teste.rules` está somente em
`match /chatEquipe/{mensagemId}`: aceita `respostaId` opcional e confere se aponta
para uma mensagem existente, com ID válido, diferente do documento criado.
Campos de citação com texto/autor inventados não são aceitos. Atualização e
exclusão de mensagens continuam proibidas.

## Quando decidir publicar

1. Abrir o Firebase Console e selecionar **Ambiente Teste**, identificador
   **ambienteteste-e368e**. Conferir esse identificador antes de editar.
2. Entrar em **Firestore Database → Regras**. É o Firestore, não o Realtime Database.
3. Salvar uma cópia do texto publicado para referência. Se as regras atuais
   tiverem recebido alterações fora das etapas deste projeto, revisar essas
   diferenças antes de substituir pelo arquivo completo proposto.
4. Abrir `firebase/chat-respostas-teste.rules` da branch atual no GitHub e copiar
   o conteúdo completo. No editor de regras do projeto de teste, substituir o
   texto pelo conjunto revisado e publicar.
5. Publicar o ZIP completo da mesma branch no **Netlify de teste**. Atualizar as
   abas abertas com Ctrl+Shift+R. Não publicar esta configuração no site oficial.
6. Testar primeiro uma mensagem comum e depois uma resposta com duas contas
   fictícias: referência correta, cancelamento sem perda do texto e abertura do
   original pela outra conta.

Não mudar Realtime Database, Storage, autenticação ou índices. Não é necessária
migração de mensagens. As regras novas aceitam o formato antigo, permitindo
aplicá-las antes do pacote do Netlify.

Sem esta atualização, um envio com referência será recusado pelas regras antigas;
o texto e a referência permanecem no rascunho. Cancelar a referência permite
continuar com uma mensagem comum, sem alteração do formato anterior.

## Evidência local

- 37 verificações específicas de regras de respostas.
- 139 verificações de autorização dos alunos e 80 de compartilhamento,
  executadas com o arquivo completo proposto.
- Comparação do conteúdo fora do bloco de criação do chat: preservado.

Todos executados no emulador, sem credenciais ou gravações reais. O arquivo
`firebase-respostas-emuladores.json` serve somente à validação local.
