# Atualização: online e confirmações de leitura

## 1. Realtime Database — lista online

O banco já criado pelo usuário tem a URL `https://salamulti-default-rtdb.firebaseio.com`. Ela já foi incluída no arquivo `firebase-realtime-config.js` desta versão. A URL é uma configuração pública, não uma senha.

1. No Firebase, abra **salamulti → Realtime Database → Regras**. Esta tela é diferente da tela de regras do Firestore.
2. Como esse banco foi criado vazio e em modo bloqueado, substitua as regras pelo conteúdo completo de **`firebase/presenca-realtime.rules.json`**.
3. Clique em **Publicar**.

Não substitua as regras do Storage por esse JSON. Se o Realtime Database passar a ser usado por outros sistemas antes desta configuração, preserve os respectivos blocos e acrescente somente `presencaEquipe`.

A presença usa uma conexão por aba e uma remoção programada no servidor quando a conexão termina. Duas abas do mesmo professor aparecem como uma pessoa só. No logout, a conexão daquela aba é removida. O navegador também confirma sua conexão a cada 30 segundos; conexões sem atualização há dois minutos deixam de aparecer. Fechar o navegador ou perder a rede pode levar algum tempo para refletir na lista. O estado online indica uma conexão ativa com o Diário, inclusive com a aba em segundo plano; não comprova que a pessoa está olhando a tela.

A coluna **Online agora** mostra somente o trecho do e-mail antes de `@`. No celular, a lista fica acima da conversa e pode ser recolhida pelo título. Professores com o mesmo trecho antes do `@`, mas domínios diferentes, podem ter rótulos iguais.

## 2. Firestore — leituras

1. Abra **salamulti → Firestore Database → Regras** e guarde uma cópia do texto atual.
2. Se as regras continuam iguais às últimas que você enviou nesta conversa, substitua pelo conteúdo completo de **`firebase/firestore-com-chat.rules`**. Esse arquivo mantém aqueles blocos e acrescenta as confirmações de leitura.
3. Clique em **Publicar**.

Se houve mudanças posteriores, não as sobrescreva: acrescente `firebase/leituras-firestore.rules` **dentro** do bloco `/chatEquipe/{mensagemId}`.

As leituras ficam em `chatEquipe/{mensagemId}/leituras/{uid}`. Cada usuário só registra sua própria leitura, com horário do servidor, preservando a primeira confirmação. Clique no texto de uma mensagem ou no botão **Quem já leu** para consultar a lista. Ela mostra somente o trecho anterior ao `@` e o horário.

A confirmação é solicitada quando a mensagem permanece exibida por aproximadamente 700 ms na área visível da conversa, com chat aberto e página visível. Chat fechado, aba oculta ou mensagens fora da área de leitura não geram confirmação. O autor não recebe uma confirmação de si próprio. A lista mostra até 200 leitores por mensagem. Isso indica exposição na tela, não comprova leitura ou compreensão; não há confirmação retroativa de visualizações anteriores à atualização.

## 3. Publicar o site

Extraia o ZIP desta versão e publique **a pasta completa** no Netlify oficial. Inclua os HTMLs, os arquivos anteriores e os novos `chat-presenca.js`, `firebase-realtime-config.js`, o SDK Database em `vendor`. Aguarde Published e atualize com **Ctrl + Shift + R**. Não há alteração no Storage ou no CORS dos arquivos DOCX.

## Formulário de atendimento

Esta versão mantém o registro tradicional de atendimento e remove da interface as metas e a ficha rápida. Nenhum documento do Firebase é excluído. Relatos e observações já salvos continuam disponíveis no histórico, inclusive textos que tenham sido produzidos pela ficha anterior.

Se já publicou as permissões de presença e leitura, não precisa alterar as regras novamente para usar esta versão. As permissões de metas já publicadas podem permanecer, sem uso pelo site.

## Conferir depois de publicar

- Entre com dois professores e confira os nomes em Online agora. Teste também duas abas do mesmo professor: ele deve aparecer apenas uma vez.
- Envie uma mensagem fictícia. Com o chat fechado na outra sessão, não deve surgir confirmação. Abra a conversa, deixe a mensagem visível e consulte Quem já leu na primeira sessão.
- Abra a ficha de um aluno: o formulário deve mostrar somente o registro habitual de atendimento. Confira que os relatos antigos continuam no histórico.

Presença utiliza Realtime Database; mensagens e leituras usam Firestore. Essas operações consomem as cotas dos respectivos serviços. Os testes de desenvolvimento usam emuladores e dados fictícios, sem mensagens ou alterações no banco real.

## Testes de desenvolvimento

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-chat-navegador.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-registro-tradicional-navegador.cjs
XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore,database --project demo-planos-aula --config firebase-emuladores.json 'node validacao/verificar-presenca-leituras.cjs && node validacao/verificar-presenca-navegador.cjs'
```
