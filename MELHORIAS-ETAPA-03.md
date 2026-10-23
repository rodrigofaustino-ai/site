# Etapa 3 — formulário próprio de PEI

Base: documento em branco “PLANO EDUCACIONAL INDIVIDUALIZADO - PEI.docx”
enviado pelo usuário. As orientações e o cabeçalho foram extraídos desse modelo.
As referências legais na introdução reproduzem o material recebido e não
constituem uma certificação jurídica.

## Campos

O formulário tem 23 campos, incluindo 10 campos descritivos:

1. Identificação: nome, nascimento, escola, ano escolar, turno, professor regente,
   professor de apoio e necessidade educacional especial.
2. Contexto escolar: aspectos socioafetivos, acadêmicos, linguagem verbal oral,
   linguagem verbal escrita, cognitivos e psicomotores.
3. Estratégias: objetivos e metas educacionais, modificações e adaptações/
   adequações curriculares, processo avaliativo.
4. Contexto familiar e contribuição da família.
5. Assinaturas: local, data e nomes de regente, apoio e coordenação.

As instruções originais de preenchimento ficam em blocos expansíveis. Não são
inseridas como respostas do professor. Os dados compatíveis do cadastro são
preenchidos inicialmente; textos pedagógicos não são inventados. O turno
preenchido vem do período escolar, sem confundi-lo com o turno da SRM.

## Acesso e salvamento

- `pei_formulario.html` abre com o identificador do aluno.
- O botão Abrir PEI da central e Abrir formulário PEI da aba PEI levam à página.
- Usa o Firebase e a conta do Diário (`salamulti`), sem criar conta em outro projeto.
- O cadastro do aluno continua sendo a referência. Alterar a identificação no
  documento não altera automaticamente o perfil do aluno no Diário.
- Os campos são salvos em `alunos/{alunoId}/pei/atual`, em `peiFormulario`.
- Uma representação HTML também é salva para manter a consulta na biblioteca.
- Salvar usa uma transação: versão anterior e documento atual são gravados
  juntos. Se houver falha de permissão, não fica um salvamento parcial.
- Cada atualização preserva o documento anterior em `pei/versao-...`. A consulta
  ao histórico é somente leitura; esta etapa não implementa restauração automática.
- A tentativa de salvar sobre um PEI alterado em outra sessão é interrompida,
  mantendo o texto digitado na tela para conferência e cópia.
- Não há migração ao abrir. Um PEI importado pode ser consultado no histórico e
  preenchido no formulário pelo professor; não há extração automática dos campos.
- A preservação é do conteúdo que já estava no Firebase, incluindo HTML
  comprimido e metadados. O sistema anterior não guardava o binário original do
  DOCX do PEI; não é possível recuperar formatação que já se perdeu na importação.
- O upload antigo não substitui um PEI já estruturado. Substituir um documento
  importado também preserva a versão anterior em uma transação.

## Exportação

DOCX e ODT usam o conteúdo atual dos campos, mesmo antes de salvar. Incluem o
cabeçalho de Cambé, introdução do modelo, seções preenchidas e assinaturas.
O resultado é um documento reconstruído a partir dos campos: não é reprodução
exata da paginação ou das tabelas do arquivo original.

## Conferência no Netlify de teste

1. Abra a branch `melhorias/etapa-03-formulario-pei` no GitHub.
2. Use Code → Download ZIP e extraia.
3. Publique a pasta completa no Netlify de teste, incluindo `modelos` e `vendor`.
4. Abra um aluno fictício e clique em Abrir PEI.
5. Confira os dados iniciais, preencha os campos, salve e reabra pelo Diário.
6. Exporte DOCX e ODT e confira o conteúdo no editor de documentos.
7. Faça uma segunda alteração e confira Consultar histórico.
8. Confira um PEI fictício importado antes desta etapa e veja sua versão anterior.

As configurações Firebase anteriores foram mantidas. Se teste e oficial usam o
mesmo banco, salvamentos afetam o mesmo banco: use apenas dados fictícios para
esta conferência. Não houve publicação no Netlify pelo agente nem alteração da
main. A compatibilidade com as regras reais deve ser conferida no ambiente de
teste; elas precisam permitir leitura e escrita autorizadas em `atual` e nas
versões da subcoleção PEI. Não afrouxe regras para contornar eventual erro.

## Validação automatizada

Com Chromium e as dependências de MELHORIAS-ETAPA-01.md:

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-pei-formulario.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-central-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-vinculo-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-navegador.cjs
```

Os testes bloqueiam requisições externas e usam Firebase simulado. Incluem
campos do modelo, dados iniciais, salvamento e reabertura, preservação do PEI
comprimido anterior, versões, conflito, falha de permissão, conta sem vínculo,
logout, documento novo, exportações reais e telas de 320/390 pixels.

### Resultados desta versão

- 43 verificações do formulário PEI aprovadas no Chromium.
- 33 verificações da central, incluindo proteção da importação, aprovadas.
- 43 verificações de vínculo dos outros formulários aprovadas.
- 10 downloads DOCX/ODT existentes e 2 downloads do novo PEI aprovados.
- Conteúdo e cabeçalho incorporado conferidos dentro dos novos DOCX/ODT.
- Sintaxe dos scripts próprios validada.

### Ajuste da consulta e das instruções de preenchimento

- Consultar histórico abre a versão mais recente automaticamente e leva a tela
  à visualização. Cada botão também indica explicitamente Visualizar.
- Trocar de versão cria uma nova moldura isolada para evitar interferência do
  carregamento anterior. Conteúdo ausente ou ilegível apresenta uma mensagem.
- As dez instruções descritivas do modelo aparecem dentro dos campos vazios.
  Desaparecem ao digitar e voltam se o texto for apagado. A orientação também
  permanece disponível no bloco expansível durante a edição.
- Instruções não são respostas e não são copiadas ao salvar ou exportar.
- 52 verificações do formulário aprovadas; visualização de conteúdo comprimido
  conferida dentro da moldura; DOCX/ODT inspecionados para excluir instruções das
  respostas. Os testes continuam usando somente dados fictícios.

### Revisão de texto com IA

Os dez campos descritivos possuem Melhorar texto com IA, usando Puter, como os
outros módulos. Apenas o texto do campo e sua identificação temática compõem a
solicitação; não há envio automático dos demais campos ou do cadastro. O texto
pode conter informações inseridas pelo professor: o aviso de envio fica junto
ao botão e a revisão só é solicitada após o clique.

A sugestão fica separada do original, com Aplicar sugestão e Manter meu texto
original. Aplicar muda o campo e marca o PEI como não salvo. A gravação depende
do botão Salvar. Campo vazio não gera solicitação e as instruções do modelo não
são enviadas como se fossem observações do professor.

O pedido à IA limita a revisão à redação e proíbe acrescentar fatos, diagnósticos,
resultados ou metas não relatadas. Isso não garante correção das respostas: a
revisão pelo professor continua necessária. Se o campo ou a sessão mudar durante
a solicitação, a resposta não substitui o texto novo.

Para conferir no Netlify de teste, use texto fictício e teste pedir sugestão,
descartar, pedir novamente, aplicar e salvar. A disponibilidade e autenticação
do serviço Puter dependem do serviço externo. Não foram feitos pedidos reais à
IA nos testes automatizados.

Validação atual: 69 verificações do PEI aprovadas no Chromium, com Firebase e IA
simulados, incluindo falha do serviço, resposta atrasada, troca de sessão,
confirmação antes de aplicar e ausência de gravação automática. DOCX e ODT
continuam sendo gerados pelo teste.

### Ajuste de respostas repetidas da IA

O pedido passou a solicitar reescrita da estrutura e desenvolvimento das ideias
já expressas, preservando o significado e o grau de certeza. A resposta é
comparada ao original sem diferenças de espaços, pontuação ou maiúsculas. Se
repetir, é feita uma única nova tentativa pedindo reformulação explícita. Se
continuar igual, não aparece uma sugestão para aplicar: o campo é preservado e
a interface informa que a IA não reformulou. A ação pode realizar até duas
chamadas ao serviço.

76 verificações do PEI aprovadas, incluindo repetição seguida de reformulação,
repetição persistente, preservação do texto e ausência de gravação automática.
A IA foi simulada; a qualidade da resposta do serviço real não foi avaliada
nesta execução e precisa ser conferida com texto fictício no site de teste.

### Formatação do histórico igual ao visualizador anterior

O histórico passou a aplicar, dentro da moldura isolada, os mesmos estilos do
visualizador original do Diário. Isso evita negritos e alinhamentos padrão do
navegador em títulos, rótulos e tabelas. O conteúdo armazenado e a exportação
não foram modificados por este ajuste.

O teste compara os estilos computados de títulos, negritos, parágrafos,
cabeçalhos e células de tabela entre o visualizador original e o histórico.
Foram conferidos peso da fonte, alinhamento, família e tamanho da fonte, altura
de linha e cor. A versão atual passou em 77 verificações do formulário PEI.
Inclua o novo arquivo pei-visualizacao.js ao publicar a pasta no Netlify de teste.
