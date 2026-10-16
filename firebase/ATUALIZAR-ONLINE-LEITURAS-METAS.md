# Atualização: online, leituras e registro rápido

## 1. Realtime Database — lista online

O banco já criado pelo usuário tem a URL `https://salamulti-default-rtdb.firebaseio.com`. Ela já foi incluída no arquivo `firebase-realtime-config.js` desta versão. A URL é uma configuração pública, não uma senha.

1. No Firebase, abra **salamulti → Realtime Database → Regras**. Esta tela é diferente da tela de regras do Firestore.
2. Como esse banco foi criado vazio e em modo bloqueado, substitua as regras pelo conteúdo completo de **`firebase/presenca-realtime.rules.json`**.
3. Clique em **Publicar**.

Não substitua as regras do Storage por esse JSON. Se o Realtime Database passar a ser usado por outros sistemas antes desta configuração, preserve os respectivos blocos e acrescente somente `presencaEquipe`.

A presença usa uma conexão por aba e uma remoção programada no servidor quando a conexão termina. Duas abas do mesmo professor aparecem como uma pessoa só. No logout, a conexão daquela aba é removida. O navegador também confirma sua conexão a cada 30 segundos; conexões sem atualização há dois minutos deixam de aparecer. Fechar o navegador ou perder a rede pode levar algum tempo para refletir na lista. O estado online indica uma conexão ativa com o Diário, inclusive com a aba em segundo plano; não comprova que a pessoa está olhando a tela.

A coluna **Online agora** mostra somente o trecho do e-mail antes de `@`. No celular, a lista fica acima da conversa e pode ser recolhida pelo título. Professores com o mesmo trecho antes do `@`, mas domínios diferentes, podem ter rótulos iguais.

## 2. Firestore — leituras e metas

1. Abra **salamulti → Firestore Database → Regras** e guarde uma cópia do texto atual.
2. Se as regras continuam iguais às últimas que você enviou nesta conversa, substitua pelo conteúdo completo de **`firebase/firestore-com-chat.rules`**. Esse arquivo mantém aqueles blocos e acrescenta leituras e metas.
3. Clique em **Publicar**.

Se houve mudanças posteriores, não as sobrescreva: acrescente `firebase/leituras-firestore.rules` **dentro** do bloco `/chatEquipe/{mensagemId}` e `firebase/metas-firestore.rules` dentro do bloco principal `/databases/{database}/documents`.

As leituras ficam em `chatEquipe/{mensagemId}/leituras/{uid}`. Cada usuário só registra sua própria leitura, com horário do servidor, preservando a primeira confirmação. Clique no texto de uma mensagem ou no botão **Quem já leu** para consultar a lista. Ela mostra somente o trecho anterior ao `@` e o horário.

A confirmação é solicitada quando a mensagem permanece exibida por aproximadamente 700 ms na área visível da conversa, com chat aberto e página visível. Chat fechado, aba oculta ou mensagens fora da área de leitura não geram confirmação. O autor não recebe uma confirmação de si próprio. A lista mostra até 200 leitores por mensagem. Isso indica exposição na tela, não comprova leitura ou compreensão; não há confirmação retroativa de visualizações anteriores à atualização.

## 3. Publicar o site

Extraia o ZIP desta versão e publique **a pasta completa** no Netlify oficial. Inclua os HTMLs, os arquivos anteriores e os novos `chat-presenca.js`, `firebase-realtime-config.js`, `registro-metas.js`, `registro-metas.css` e o SDK Database em `vendor`. Aguarde Published e atualize com **Ctrl + Shift + R**. Não há alteração no Storage ou no CORS dos arquivos DOCX.

## 4. Registro rápido de atendimento

1. Abra um aluno já salvo e, na área **Registro do Atendimento**, expanda **Metas do PAEE/PEI e registro rápido**.
2. Em **Cadastrar uma meta do aluno**, escolha PAEE ou PEI. Copie o objetivo do documento e informe o critério de acompanhamento e sua referência. A ferramenta não extrai nem interpreta metas automaticamente desses documentos.
3. Marque as metas trabalhadas no atendimento e preencha atividade, recursos/estratégias/mediações, participação/evidências e próximo passo.
4. Se desejar, acrescente o relato habitual. Clique no mesmo botão **Salvar registro do atendimento**.

A ficha é opcional: o relato tradicional continua funcionando. As metas são particulares do professor que as cadastrou para o próprio aluno, não aparecem no chat nem nas bibliotecas compartilhadas. A ficha utiliza os registros do Diário e suas permissões existentes. Cada atendimento guarda uma cópia das metas selecionadas; arquivar uma meta não altera os registros anteriores. Para substituir um objetivo, arquive-o e cadastre a nova versão.

Os campos preenchidos também são organizados no texto do registro, permitindo sua leitura e a exportação pelo histórico já existente. A ficha não gera pareceres nem avaliações automaticamente. **Percurso registrado** mostra em quantos atendimentos uma meta foi trabalhada e a última data, sem transformar quantidade de atendimentos em domínio de uma habilidade.

## Conferir depois de publicar

- Entre com dois professores e confira os nomes em Online agora. Teste também duas abas do mesmo professor: ele deve aparecer apenas uma vez.
- Envie uma mensagem fictícia. Com o chat fechado na outra sessão, não deve surgir confirmação. Abra a conversa, deixe a mensagem visível e consulte Quem já leu na primeira sessão.
- Em um aluno de teste, cadastre uma meta, salve um atendimento rápido, confira o histórico e arquive a meta. O atendimento anterior deve permanecer intacto.

Presença utiliza Realtime Database; mensagens, leituras e metas usam Firestore. Essas operações consomem as cotas dos respectivos serviços. Os testes de desenvolvimento usam emuladores e dados fictícios, sem mensagens ou alterações no banco real.

## Testes de desenvolvimento

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-chat-navegador.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-registro-metas-navegador.cjs
XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore,database --project demo-planos-aula --config firebase-emuladores.json 'node validacao/verificar-presenca-leituras-metas.cjs && node validacao/verificar-presenca-navegador.cjs'
```
