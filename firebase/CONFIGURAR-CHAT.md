# Ativar o chat coletivo

O chat fica no canto inferior direito do Diário. Todos os professores autenticados no projeto **salamulti** participam da mesma conversa, independentemente do turno. Não há conversas privadas ou indicador de presença nesta versão. O histórico permanece no Firestore; as mensagens não podem ser editadas ou apagadas pelos usuários.

## Configuração inicial

1. Abra **Firebase → salamulti → Firestore Database → Regras** e guarde uma cópia das regras atuais.
2. Se suas regras continuam iguais às que você enviou nesta conversa, o arquivo `firebase/firestore-com-chat.rules` já reúne todas elas com o chat: copie o conteúdo completo e substitua o texto na aba Regras. Se houve alterações posteriores, preserve-as e acrescente apenas o bloco a seguir.
3. Se suas regras foram alteradas depois desta conversa, não use o arquivo completo: acrescente somente o conteúdo de `firebase/chat-firestore.rules` dentro de `match /databases/{database}/documents { ... }`, antes das duas últimas chaves. Preserve os blocos de alunos, frequência, planner, notas, planos e recursos didáticos. O arquivo fornecido é apenas o bloco adicional, não substitui as regras completas.
4. Se houver autorização genérica para todas as coleções, ajuste-a para não autorizar indevidamente o chat. Na configuração fornecida anteriormente pelo usuário não havia esse bloco genérico.
5. Clique em **Publicar**.
6. Baixe o ZIP atualizado e publique a pasta completa no Netlify oficial, incluindo `chat-equipe.js`, `chat-equipe.css` e os arquivos anteriores. Atualize com **Ctrl + Shift + R**.

Não há alteração no Storage ou no CORS. Publicar os arquivos não altera os registros já existentes.

## Uso

- Entre no Diário e clique em **Chat da equipe**. Digite e clique em **Enviar**. Enter insere uma nova linha.
- Mensagens mostram o autor, data e horário. O texto é exibido como texto simples. Limite: 2.000 caracteres por mensagem, sem anexos.
- A conversa mais recente aparece em tempo real, com até 100 mensagens na consulta inicial. **Carregar mensagens anteriores** traz o histórico em grupos de 50.
- Com a caixa fechada, o indicador considera mensagens recentes de outros professores posteriores à última leitura neste navegador. Ele mostra `99+` ao atingir 100; não é uma contagem integral de todo o histórico. O histórico inicial também pode aparecer como não lido no primeiro acesso.
- O ponto de leitura é guardado por usuário neste navegador, sem armazenar o texto das mensagens no localStorage. Não sincroniza a leitura entre computadores. Ao sair ou trocar de conta, a caixa, o rascunho e os dados exibidos são limpos.
- Se houver falha no envio, o rascunho é mantido. A repetição do mesmo envio reutiliza o identificador para evitar duplicação. O site nunca envia mensagens sozinho.

O histórico e as atualizações em tempo real usam as cotas de leitura, gravação e armazenamento do Firestore do Diário. O chat não informa se um professor está online.

## Conferência após publicar

Abra duas sessões com professores diferentes. Envie uma mensagem em uma sessão e confira sua chegada na outra. Feche a caixa em uma sessão, envie outra mensagem na outra e confira o indicador. Abra novamente para limpar o indicador. Saia do Diário e confira que o chat desapareceu.

Os testes locais usam contas e mensagens fictícias, sem acessar o banco de produção:

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-chat-navegador.cjs
XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore --project demo-planos-aula --config firebase-emuladores.json 'node validacao/verificar-regras-chat.cjs'
```

Não publique `compartilhados-teste.rules` em produção: ele é exclusivo dos emuladores e não contém as regras de todas as coleções do Diário.
