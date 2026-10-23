# Ativar o Banco de Planos de Aula

A nova aba usa o login existente do **Diário**, no projeto Firebase **salamulti**. Todos os usuários desse projeto consultam a biblioteca, sem filtro de turno; os logins do outro projeto dos formulários não dão acesso. O título, tema, descrição, autor e datas ficam na coleção nova `planosAula`. O DOCX original fica no Firebase Storage. Os registros dos alunos não são migrados nem alterados por esta configuração.

## 1. Abrir o projeto correto

1. Entre em [console.firebase.google.com](https://console.firebase.google.com/) com a conta que administra o Firebase.
2. Abra **salamulti**, o projeto do Diário.
3. No menu **Criação / Build**, abra **Storage**.
4. Se aparecer **Começar / Get started**, siga a criação do armazenamento. Se o console solicitar o plano **Blaze**, será necessária uma conta de faturamento. Confira os custos exibidos antes de contratar. Esta biblioteca usa Storage para manter os DOCX originais; publicar no Netlify sozinho não ativa o armazenamento.
5. Confira o nome do bucket mostrado no console. O site está configurado para `salamulti.firebasestorage.app`. Se o seu bucket tiver outro nome, altere somente o campo `storageBucket` em `index.html` para o nome real, sem `gs://`. Não altere as outras configurações Firebase.

## 2. Adicionar as regras do Firestore

1. Abra **Firestore Database → Regras / Rules**.
2. Copie as regras atuais para um arquivo no computador, como cópia de segurança.
3. Abra `firebase/planos-firestore.rules` desta pasta.
4. Copie o bloco inteiro que começa em `match /planosAula/{planoId} {` e termina na chave correspondente. Inclua as funções e permissões dentro desse bloco.
5. Cole esse bloco **dentro** de `match /databases/{database}/documents { ... }` nas regras atuais. Preserve os blocos dos alunos, frequência, notas e demais recursos. O arquivo fornecido contém um invólucro completo para os testes; **não substitua todas as regras existentes por ele**.
6. Confira se há regras genéricas, como `match /{document=**}` com `allow write: if request.auth != null` ou `allow read, write: if true`. No Firebase, qualquer regra que autorize o acesso prevalece: adicionar o bloco restritivo não cancela uma autorização genérica. Essas regras precisam excluir `planosAula`, mantendo as permissões necessárias às outras coleções. Se você encontrar um bloco assim, encaminhe o **texto das regras atuais** para adaptação antes de publicar; não é necessário enviar senha.
7. Clique em **Publicar / Publish** quando as regras estiverem ajustadas.

## 3. Adicionar as regras do Storage

1. Abra **Storage → Regras / Rules** e guarde uma cópia das regras atuais.
2. Abra `firebase/planos-storage.rules`.
3. Copie o bloco `match /planosAula/{autorUid}/{planoId}/{arquivo} { ... }` para dentro de `match /b/{bucket}/o { ... }` nas regras atuais.
4. Preserve regras de outros arquivos, se houver. Se houver uma autorização genérica para todos os caminhos, ajuste-a para não incluir `planosAula`. Uma regra pública genérica também permitiria acesso sem login. Se esse Storage ainda não guarda nenhum outro arquivo, pode usar o arquivo fornecido inteiro.
5. Clique em **Publicar / Publish**.

As regras permitem leitura a quem estiver autenticado e cadastro/exclusão somente no caminho do próprio autor. Cada substituição cria um novo DOCX; o arquivo anterior é removido depois que a alteração é salva. As regras validam tipo e tamanho, enquanto o navegador também verifica a estrutura DOCX. Um usuário autenticado pode guardar e compartilhar a sua própria cópia baixada, como qualquer documento da equipe.

## 4. Publicar os arquivos no Netlify

1. No GitHub, abra a branch **feat/exportacoes-pdf-docx-odt** deste repositório.
2. Clique em **Code → Download ZIP** e extraia o ZIP no computador.
3. Abra seu site existente no Netlify e entre em **Deploys**.
4. Arraste a pasta completa extraída, a que contém `index.html`, `planos-aula.js`, `planos-aula.css`, `exportacao.js`, os formulários e a pasta `vendor`.
5. Aguarde **Published** e atualize a página do site.

Não há servidor próprio nem serviço de conversão a instalar. As exportações DOCX/ODT continuam como antes.

## 5. Conferir com dois professores

1. Entre no Diário com o primeiro professor, escolha qualquer turno e abra **Planos de Aula**.
2. Preencha título, conteúdo/tema, breve descrição, selecione um DOCX de até 10 MB e clique em **Cadastrar plano**.
3. Confira autor e data de upload. Experimente **Visualizar**, **Baixar DOCX**, **Editar** e a substituição do arquivo. A data original de upload é preservada; a data da última alteração também aparece.
4. Em uma janela anônima, entre com outro professor. O plano deve aparecer, inclusive em outro turno, com os botões de visualização e download. Os botões de edição e exclusão não aparecem. As regras do Firebase devem negar alterações feitas por esse segundo usuário, mesmo fora da interface.
5. Sem login, os arquivos e metadados devem ser inacessíveis. Ao sair do Diário, a lista e a prévia são limpas.

O botão de download obtém o arquivo por uma requisição autenticada. O site não guarda nem divulga links permanentes de download com token. O DOCX baixado é o original; a prévia usa Mammoth e pode apresentar diferenças de formatação.

## Se o upload funcionar, mas a prévia ou o download falhar por CORS

Esse ajuste só é necessário se o navegador mostrar um erro **CORS**. A configuração depende do endereço exato do site, por exemplo `https://meusite.netlify.app`, sem barra no final.

1. No [Console do Google Cloud](https://console.cloud.google.com/), selecione **salamulti** e abra **Cloud Shell** (ícone de terminal no topo).
2. Use o menu de envio de arquivos do Cloud Shell para enviar `firebase/cors-planos.json`.
3. Abra o editor, substitua `SUBSTITUA_PELA_URL_DO_SEU_SITE` pelo endereço real e salve.
4. Primeiro confira a configuração atual:

```sh
gcloud storage buckets describe gs://salamulti.firebasestorage.app --format="json(cors_config)"
```

5. Se houver entradas existentes, acrescente-as ao JSON para preservá-las. Depois aplique:

```sh
gcloud storage buckets update gs://salamulti.firebasestorage.app --cors-file=cors-planos.json
```

Use o nome real do bucket se for diferente. Se houver domínio próprio além do endereço Netlify, inclua os dois na lista `origin`. CORS permite que o navegador faça a requisição; as regras de autenticação continuam necessárias. Não torne o bucket público para corrigir o download.

## Verificação técnica

O teste de navegador simula Firebase e verifica cadastro, busca, visualização isolada, download com os mesmos bytes do original, dois professores, edição, substituição, exclusão, arquivo inválido, logout e layout móvel. Os testes de exportação anteriores continuam disponíveis.

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-planos-navegador.cjs
```

As regras têm um teste separado, com usuários fictícios e projeto `demo-planos-aula`, usando emuladores. Ele não acessa os dados reais:

```sh
npm install --prefix /tmp/site-validation --cache /tmp/npm-cache --no-audit --no-fund @firebase/rules-unit-testing@3.0.4 firebase-tools@13.35.1
XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore,storage --project demo-planos-aula --config firebase-emuladores.json 'node validacao/verificar-regras-planos.cjs'
```

Requer Java e acesso a `storage.googleapis.com` para baixar os emuladores. Nesta implementação, o teste de regras não pôde ser executado porque a rede bloqueou o download com HTTP 403. As regras fornecidas precisam ser validadas e combinadas com as regras reais antes de disponibilizar a biblioteca. O Storage e as regras de produção não foram ativados nem publicados por este trabalho.
