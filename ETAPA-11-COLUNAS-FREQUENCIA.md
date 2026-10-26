# Selecionar várias colunas de semana

Na aba Frequência, abrir “Semanas visíveis”. Cada semana possui uma caixa de
seleção; marcar mostra a coluna e desmarcar a oculta. É possível escolher semanas
não consecutivas, sem alterar a ordem cronológica da grade.

Atalhos disponíveis:

- Mostrar todas: exibe todas as semanas, inclusive as que forem adicionadas depois.
- 4 mais recentes: escolhe as quatro maiores datas de início válidas. A seleção
  acompanha novas semanas adicionadas; semanas sem data continuam disponíveis
  para escolha manual. O atalho fica indisponível se nenhuma semana tiver data válida.
- Ocultar todas: limpa a seleção de colunas para começar outra escolha.

O título informa quantas semanas estão visíveis. Sem nenhuma coluna selecionada,
a tela mostra orientação para escolher semanas, não uma grade vazia que sugira
perda dos registros. A conferência de marcações considera somente as colunas e
linhas exibidas.

## Preferência e dados

A escolha é mantida ao lançar frequência ou atualizar a grade e fica lembrada
no mesmo navegador por conta e turno. O navegador armazena somente o modo de
visualização e os identificadores das semanas, não nomes, presenças ou faltas.
Se o armazenamento local estiver bloqueado, a escolha continua funcionando
durante a sessão. Limpar filtros volta a mostrar todas as semanas.

No modo de seleção manual, semanas novas não são incluídas automaticamente;
podem ser marcadas na lista. Se uma semana selecionada for removida, sua coluna
sai da seleção. Nenhuma semana é removida por usar os controles de visualização.

Busca por aluno, filtro por dia e opção de ocultar horários vazios continuam
funcionando em conjunto. Ocultar uma coluna não altera nem apaga frequência.
Os relatórios mantêm seus próprios filtros de aluno e datas; não são restringidos
automaticamente pelas colunas ocultadas na tela.

## Validação e publicação

Passaram 66 verificações de frequência no Chromium, com requisições externas
bloqueadas e Firebase simulado. Incluem seleção múltipla não consecutiva, zero
colunas, quatro recentes, nova semana, manutenção após salvar, restauração da
preferência, separação por conta, ausência de leituras extras/gravações pelos
filtros, marcação e conteúdo dos relatórios DOCX/ODT. Também passaram 87
verificações de isolamento e carregamento.

Esta versão está na branch `melhorias/etapa-11-colunas-frequencia`, acumulando as
etapas anteriores, conectada somente a `ambienteteste-e368e`. Não foi publicada
no Netlify e não exige alteração de regras Firebase. Para disponibilizar depois,
baixar o ZIP dessa branch e enviar a pasta completa ao Netlify de teste, conforme
o procedimento já utilizado. Não implantar esta cópia no site oficial.
