# Cópia conectada ao Firebase de teste

Esta branch é exclusiva para `srmteste.netlify.app`. Não implantar no domínio
oficial. O projeto configurado é `ambienteteste-e368e`, informado pelo usuário.
Nenhuma alteração foi publicada no Netlify ou Firebase por este trabalho.

## Preparar as regras antes de subir o site

No Firebase, confirmar o ID `ambienteteste-e368e`, abrir Firestore Database →
Regras e substituir o texto completo por `firebase/ambiente-teste.rules`.
Esse arquivo inclui as regras privadas já validadas e acrescenta permissões
por responsável para `paee_alunos`, `diagnostica_srm` e `relatorios_srm`, pois
esses três módulos também passam a usar o banco de teste.

Não basta acrescentar blocos ao texto aberto com `allow read: if true`: as regras
são cumulativas e a autorização pública continuaria válida. A substituição deve
ser completa. Não copiar para `salamulti` nem `paee-3fea6`.

## Subir no Netlify de teste

1. No GitHub, selecionar a branch `melhorias/etapa-06-firebase-teste` e usar
   Code → Download ZIP.
2. Extrair o ZIP. Localizar a pasta que contém diretamente `index.html`,
   `firebase-ambiente-teste.js` e `vendor/`.
3. No painel do site `srmteste.netlify.app`, abrir Deploys e enviar essa pasta
   pelo fluxo de implantação manual usado nas etapas anteriores.
4. Após a implantação terminar, abrir o site e atualizar com Ctrl+Shift+R.
5. Conferir o aviso amarelo “AMBIENTE DE TESTE” e o prefixo `[TESTE]` na aba.
6. Entrar com o e-mail e a senha cadastrados em Authentication do projeto
   `ambienteteste-e368e`. As contas do oficial não foram copiadas.

## Conferência inicial

- A ausência dos alunos do oficial é esperada. Não houve migração de dados.
- Criar um aluno fictício, como “Aluno teste isolado”.
- Cadastrar uma meta, salvar um atendimento vinculado e recarregar a página.
- Abrir o PEI, preencher um campo, salvar, sair e reabrir para conferir.
- Conferir no Firestore de `ambienteteste-e368e` o cadastro fictício criado.
- Conferir PAEE, Diagnóstica e Relatório com esse aluno após publicar as novas
  regras; a integração da Diagnóstica usa a mesma sessão e banco do Diário.
- Não usar os links antigos com IDs de alunos do projeto oficial. Abrir os
  documentos pela ficha do novo aluno de teste.

## O que foi isolado

Diário, PEI, metas, registros, PAEE, Diagnóstica e Relatório usam uma configuração
pública central em `firebase-ambiente-teste.js`. O bucket apontado também é o do
projeto de teste. A integração secundária da Diagnóstica não inicializa mais o
projeto oficial. A marca de leitura do chat no navegador tem chave própria.
Se o arquivo de configuração não carregar, nenhuma inicialização Firebase é
tentada: não existe retorno automático aos projetos oficiais.

A presença online está suspensa até obter a URL e configurar as regras do
Realtime Database de teste. A transferência administrativa foi substituída por
uma tela de indisponibilidade e as regras de teste não mantêm privilégios do
administrador do projeto oficial.

Uploads de planos dependem de Storage habilitado e regras próprias no projeto
de teste; não foram validados contra o serviço real. Nenhuma operação real de
login, gravação ou upload foi feita com a conta do usuário. Não há convite ou
compartilhamento entre profissionais ativo nesta entrega.

## Validação local

- 72 verificações de isolamento, carregamento e sintaxe no Chromium, incluindo
  todas as páginas e falha no carregamento da configuração. Requisições externas
  bloqueadas pelo teste; nenhuma conexão aos bancos oficiais.
- 139 verificações reais de autorização no emulador Firestore, incluindo as três
  coleções dos formulários, ausência de acesso administrativo herdado e fluxo
  familiar preservado.
- Regressões com Firebase simulado: PEI 104, vínculos dos formulários 43,
  metas/atendimentos 31 e central do aluno 33 verificações.

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-firebase-teste.cjs
SRM_REGRAS_TESTE=1 XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore --project demo-colaboracao --config firebase-ambiente-teste-emuladores.json 'node validacao/verificar-regras-acesso-alunos.cjs'
```

Não houve alteração da branch `main`. A versão anterior permanece disponível
na branch `melhorias/etapa-05-metas-no-pei`; a separação é específica desta cópia.
