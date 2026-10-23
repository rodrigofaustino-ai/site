# Etapa 1 — vínculo dos documentos ao cadastro do aluno

Esta pasta é uma cópia de desenvolvimento do ZIP original. O site publicado,
os projetos Firebase e os arquivos originais não foram alterados.

## O que mudou

- O Diário passa `alunoId` e nome nos links de PAEE, relatório e diagnóstica.
- Os formulários procuram primeiro o identificador, mesmo se o nome mudou.
- Um documento já vinculado a outro aluno nunca é escolhido apenas pelo nome.
- Um documento antigo sem identificador exige confirmação explícita. O novo
  campo `alunoId` só é persistido pelo botão Salvar; abrir não migra o banco.
- Mais de um candidato interrompe a seleção automática. É necessário revisar
  os documentos; esta etapa não inclui uma ferramenta para resolver duplicados.
- Links antigos contendo somente nome orientam a abrir novamente pelo Diário.
  Os documentos continuam disponíveis na lista dos formulários.
- Falhas de consulta não abrem um novo documento automaticamente.
- O preenchimento da diagnóstica respeita o identificador e descarta resultados
  atrasados quando o usuário já abriu outro documento.

Formulários criados diretamente pela lista continuam permitidos. Sem abertura
pelo cadastro do Diário, não recebem automaticamente um vínculo com aluno.

## Como conferir em ambiente de teste

1. Sirva esta pasta: `python3 -m http.server 8000 --bind 127.0.0.1`.
2. Use os testes automatizados abaixo. Eles bloqueiam requisições externas,
   simulam Firebase e usam apenas dados fictícios.
3. Para uma futura conferência manual com login, use uma cópia de teste do
   Firebase: esta pasta ainda contém as configurações originais dos projetos.
   Não clique em Salvar com uma conta real apenas para experimentar.
4. No Diário de teste, abra os três tipos de formulário pelo aluno.
5. Confira alunos homônimos, mudança de nome e confirmação/cancelamento de um
   documento antigo. Confira também as exportações.

## Testes reproduzíveis

Dependências de teste fora da pasta do site:

```sh
npm install --prefix /tmp/site-validation --cache /tmp/npm-cache --no-audit --no-fund playwright-core@1.56.1 acorn@8.15.0
```

Na pasta desta versão:

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-vinculo-aluno.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-navegador.cjs
```

Requer Chromium; `CHROMIUM_BIN` permite indicar o executável. O primeiro teste
confere sintaxe, links, seleção por ID, homônimos, cancelamento, persistência
simulada, duplicados, links antigos, consulta com falha e importação da diagnóstica.
O segundo é o teste existente dos dez downloads DOCX/ODT.

## Limites desta entrega

O campo novo precisa ser aceito pelas regras reais do Firestore. Essas regras
não foram consultadas nem alteradas. Identificador não substitui autorização.
A separação entre os dois projetos Firebase e seus identificadores de usuários
permanece como estava; sua revisão será uma etapa própria.

Não houve publicação, migração em lote ou teste com dados reais. Para uma futura
publicação, envie a pasta inteira, incluindo `vinculo-aluno.js`, após validação
das regras e dos fluxos no ambiente de teste. Preserve um backup da versão atual.

## Resultado nesta cópia

- 43 verificações no Chromium aprovadas, com Firebase simulado.
- 10 downloads DOCX/ODT aprovados pelo teste existente.
- Scripts próprios e scripts embutidos nos HTMLs passaram pela análise de sintaxe.
- Arquivos originais conferidos byte a byte com o ZIP recebido, sem alterações.
