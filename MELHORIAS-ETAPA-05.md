# Etapa 5 — acrescentar metas do acompanhamento ao PEI

Esta versão inclui todas as etapas anteriores e conecta a consulta de metas ao
campo Objetivos e metas educacionais do formulário de PEI.

## Uso no site de teste

1. Abra a branch `melhorias/etapa-05-metas-no-pei` no GitHub.
2. Baixe em Code → Download ZIP, extraia e publique a pasta completa no Netlify de teste.
3. Atualize com Ctrl+Shift+R e abra o PEI do Aluno teste.
4. Vá a III. Estratégias de ensino → Objetivos e metas educacionais.
5. Clique em Consultar metas do acompanhamento.
6. Marque as metas desejadas e confira a prévia.
7. Clique em Acrescentar metas selecionadas, revise o campo e salve o PEI.
8. Reabra o PEI e confira o conteúdo e as exportações DOCX/ODT.

A consulta mostra somente metas ativas ou em revisão do aluno identificado.
Metas concluídas, arquivadas e de outros alunos não entram na seleção.
São apresentados objetivo, ponto de partida, critério, estratégias, apoios,
responsável e data de revisão, quando preenchidos no acompanhamento.

## Preservação do texto

- Consultar e marcar metas não altera o campo nem grava dados.
- Acrescentar mantém o texto já digitado e adiciona os blocos selecionados ao final.
- Blocos idênticos já presentes no texto não são inseridos novamente.
- O professor pode ajustar o texto depois da inclusão; a gravação depende de Salvar.
- A inclusão é uma cópia textual para aquela versão do PEI, sem sincronização
  automática posterior. Se uma meta mudou, confira a versão anterior no texto
  antes de acrescentar outra formulação.
- Alterar o PEI não edita as metas da seção de acompanhamento.
- O histórico do PEI, as instruções e a revisão por IA continuam disponíveis.
- Falhas de consulta mantêm o preenchimento. Uma resposta atrasada é descartada
  se o aluno, o formulário ou a sessão já mudou.

Não houve alteração de regras, migração ou publicação no site oficial. A main
continua preservada. Se teste e oficial usam o mesmo Firebase, use apenas dados
fictícios para conferir o salvamento.

## Validação

Com as dependências e Chromium descritos nas etapas anteriores:

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-pei-formulario.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-metas-aluno.cjs
```

O teste do PEI cobre consulta, filtro por aluno e situação, seleção, prévia,
preservação do texto digitado, inclusão de mais de uma meta, repetição da mesma
inclusão, gravação, reabertura, exportações reais, ausência de escritas nas metas,
falha de leitura, ausência de metas e logout durante uma consulta. Requisições
externas são bloqueadas; Firebase e IA são simulados.

### Resultados desta versão

- 104 verificações do formulário PEI aprovadas no Chromium, com Firebase e IA simulados.
- 31 verificações de metas e vínculo dos atendimentos aprovadas.
- DOCX e ODT com metas inspecionados internamente: texto anterior preservado,
  metas escolhidas presentes e metas arquivadas/de outros alunos ausentes.
- Sintaxe do JavaScript e revisão de espaços em branco aprovadas.
