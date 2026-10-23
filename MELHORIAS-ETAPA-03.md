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
