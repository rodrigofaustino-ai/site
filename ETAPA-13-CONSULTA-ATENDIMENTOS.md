# Consulta do histórico de atendimentos

Branch cumulativa: `melhorias/etapa-13-consulta-atendimentos`.
Inclui etapas anteriores, inclusive seleção de semanas e roteiro de atendimento.
Preparada para publicação futura no Netlify de teste; não publicada automaticamente.

## Alterações

- Busca local por palavras no relato, nome informado do profissional e objetivo
  histórico das metas vinculadas. Ignora maiúsculas e acentos; todas as palavras
  devem estar presentes, sem exigir a mesma ordem.
- Período por data do atendimento, incluindo os dois extremos. Não confunde essa
  data com a data de criação do documento. Datas invertidas exibem orientação.
- Seleção de registros com metas ou sem metas, combinada com os demais filtros.
  Usa vínculos explícitos `metaIds`, sem inferir metas pelo texto.
- Contagem de resultados e botão Limpar filtros.
- Datas ausentes ou inválidas continuam consultáveis sem período; recebem indicação
  na tela e não entram num período delimitado. A interface explica essa exclusão.
- Os filtros permanecem em memória enquanto se consulta a mesma ficha; mudar
  aluno ou sair da conta limpa os campos. Não são persistidos no navegador.
- Carregamento e falha de atualização têm mensagens próprias; falha não aparece
  como confirmação de que o aluno não possui atendimentos.

A consulta usa a lista já carregada e não modifica `currentEntries`. Não cria
leituras adicionais nem gravações no Firebase. As exportações existentes mantêm
seu conteúdo e seus próprios critérios; o aviso fica junto aos filtros.
Não há mudanças de regras, índices, estrutura de dados ou projeto Firebase.

## Validação

58 verificações do registro tradicional/assistido no Chromium, incluindo novas
conferências de busca, acentos, combinação de critérios, datas inclusivas,
datas inválidas, erro de carregamento, troca de aluno, ausência de gravações e
larguras de 390/320 pixels. Regressão das metas: 47 verificações aprovadas.
Firebase e IA simulados, pedidos externos bloqueados e dados fictícios.

## Conferência após publicação futura

1. Na ficha fictícia, conferir todos os atendimentos sem filtros.
2. Buscar trecho do relato ou profissional, selecionar período e vínculo com metas.
3. Limpar filtros e conferir que a lista completa reaparece.
4. Trocar de aluno e conferir que a busca não foi transportada.
5. Conferir em conjunto as etapas 11 e 12 ainda pendentes de teste manual.

Baixar o ZIP completo desta branch quando for publicar; incluir os novos arquivos
`historico-atendimentos.js` e `historico-atendimentos.css`. Usar somente o site
de teste conectado ao projeto `ambienteteste-e368e`.
