# Questionários da Família

## Ativação — uma vez

1. No Firebase, selecione **salamulti → Firestore Database → Regras** e guarde uma cópia das regras atuais.
2. Se as regras continuam como as últimas enviadas nesta conversa, substitua o conteúdo completo pelo arquivo **`firebase/firestore-com-chat.rules`** desta versão e clique em **Publicar**. Ele mantém as regras anteriores e acrescenta os questionários. Não o cole no Realtime Database nem no Storage.
3. Se suas regras foram modificadas depois, preserve as modificações e acrescente o conteúdo de `firebase/familia-firestore.rules` dentro de `match /databases/{database}/documents { ... }`. Não acrescente uma autorização genérica para acesso público às demais coleções.
4. Extraia o ZIP atualizado e publique **a pasta completa** no Netlify oficial, incluindo `familia.html`, os arquivos `familia-*.js`, `familia.css`, os HTMLs anteriores, `exportacao.js` e `vendor`.
5. Aguarde Published e atualize com **Ctrl + Shift + R**.

Esta funcionalidade não exige alterações no Realtime Database, Storage ou CORS. Não há servidor próprio, Functions ou credencial de administrador no formulário. Os dados ficam no projeto do Diário (`salamulti`); a Diagnóstica continua utilizando seu projeto existente, com salvamento somente pelo professor.

## Gerar e acompanhar

1. Entre no Diário e abra **Questionários da Família**.
2. Cada professor vê os alunos cadastrados sob seu usuário, dos dois turnos. Há busca por nome ou turma.
3. No aluno, clique em **Gerar link**. Confira o nome mostrado à família — por padrão, somente o primeiro nome — e escolha a validade de 7, 14 ou 30 dias.
4. Clique em **Criar link** e envie o endereço copiado individualmente ao responsável. Também existem **Copiar link**, **Abrir questionário** e **Desativar link**.
5. A situação passa de **Não enviado** para **Aguardando resposta** e muda em tempo real para **Respondido**, com data de recebimento, após o envio da família.

Cada link contém um identificador aleatório de 256 bits, colocado depois de `#` no endereço. Ele funciona como uma chave: qualquer pessoa que receber o link poderá responder. Não é uma comprovação da identidade do responsável. Não publique o endereço em grupos ou páginas abertas. A família não precisa criar conta e não recebe acesso ao Diário, a outras famílias ou às respostas já enviadas.

O link aceita **um envio**. A família pode conferir as escolhas antes de enviar. Após o envio, uma nova abertura do mesmo endereço informa que a resposta foi recebida, sem revelar seu conteúdo. Correções devem ser combinadas com o professor, que pode gerar outro link. **Gerar novo link** desativa o anterior e preserva as respostas já recebidas; a consulta reúne os envios anteriores desse aluno. Expirar ou desativar um link não apaga respostas.

## O que a família responde

São **27 perguntas adaptadas**, distribuídas pelas nove áreas da Diagnóstica: comunicação; leitura/escuta; registros e escrita; percepção; atividades da vida diária; convivência; números; formas/cores; tempo/espaço. Não é uma reprodução integral dos itens escolares nem um teste diagnóstico. A versão prioriza situações observáveis em casa, aceita diferentes meios de comunicação e considera recursos de acessibilidade.

As opções são apenas **Sim**, **Não** e **Às vezes**. Os códigos internos permanecem compatíveis com as regras existentes; esta simplificação não exige republicar as regras se você já publicou a versão com observações por pergunta. Cada pergunta tem um campo opcional de informações adicionais (até 1.000 caracteres), além das observações gerais ao final, nome e vínculo do responsável. Respostas anteriores continuam disponíveis, mesmo sem essas informações por pergunta. A família não informa diagnósticos, notas, documentos ou imagens.

Os dados não enviados não são guardados no dispositivo. A família deve manter a página aberta até confirmar o envio. O envio é validado no servidor e não pode sobrescrever uma resposta anterior.

## Conferir e aproveitar na Diagnóstica

1. No aluno que respondeu, clique em **Ver respostas**. Se houver vários envios, escolha a data desejada.
2. Todas as respostas e as observações adicionais aparecem para consulta. Não há alteração automática da Diagnóstica.
3. As informações adicionais de cada pergunta acompanham a resposta quando selecionada. Marque apenas as perguntas que deseja aproveitar e clique em **Abrir Diagnóstica para conferência**.
4. A Diagnóstica abre em outra aba. Entre no formulário como de costume e abra o diagnóstico desse aluno, ou crie um novo preenchendo a identificação. Mantenha a aba de Questionários da Família aberta durante a transferência inicial.
5. No painel **Conferir relato familiar**, confira novamente as áreas desejadas e clique em **Acrescentar informações selecionadas**.
6. O nome do aluno deve corresponder; datas de nascimento divergentes, quando preenchidas em ambos os lados, também bloqueiam a operação. Confira a identificação em casos de homônimos.
7. As informações são **acrescentadas** nas observações gerais de cada área, com identificação de relato familiar, responsável e data. Textos existentes e marcações Sim/Não/Parcial dos semestres são preservados. O mesmo bloco não é duplicado se aplicado novamente.
8. Revise o formulário e clique em **Salvar** somente quando desejar gravá-lo. As observações gerais livres ao final ficam na consulta; o professor pode escolher e copiar trechos manualmente, sem classificação automática em uma área.

A transferência entre abas usa somente a memória do navegador e um canal temporário do próprio site, válido por até dez minutos. Não copia respostas para o localStorage. Caso o navegador bloqueie a nova aba ou a transferência, reabra a conferência ou consulte e copie as informações manualmente. Os arquivos precisam estar publicados no mesmo domínio.

## Conferência após publicar

Use inicialmente um aluno e respostas fictícios. Confira a abertura em uma janela anônima ou celular sem login, o envio único e a mudança de situação na aba do professor. Depois teste a consulta, a seleção para a Diagnóstica, a preservação do que já estava preenchido e a desativação/renovação do link. Com outro professor, confira que os alunos e as respostas do primeiro usuário não aparecem.

Os documentos usam as coleções `questionariosFamilia` (controle privado), `convitesFamilia` (acesso individual ao questionário), `respostasFamilia` (conteúdo privado) e `enviosFamilia` (confirmação sem conteúdo). A família não pode listar convites ou respostas e não pode consultar o conteúdo de um envio. As respostas são mantidas para consulta do professor; não há exclusão automática após o prazo do link. A função utiliza as cotas de leitura, gravação e armazenamento do Firestore.

## Desenvolvimento

```sh
XDG_CONFIG_HOME=/tmp/firebase-config FIREBASE_EMULATORS_PATH=/tmp/firebase-emulators NODE_PATH=/tmp/site-validation/node_modules /tmp/site-validation/node_modules/.bin/firebase emulators:exec --only firestore --project demo-planos-aula --config firebase-emuladores.json 'node validacao/verificar-regras-familia.cjs && node validacao/verificar-familia-navegador.cjs'
```

Os testes usam SDK real com emulador, usuários fictícios e formulário anônimo. Não alteram dados ou permissões de produção. Não reintroduzem as metas ou o registro rápido de atendimento, retirados a pedido do usuário.
