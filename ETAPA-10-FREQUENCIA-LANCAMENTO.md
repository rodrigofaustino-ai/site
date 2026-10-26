# Frequência — etapa 1: lançamento e conferência

O usuário escolheu melhorar lançamento/conferência e relatórios em etapas.
Esta primeira entrega mantém o armazenamento por professor, semana, aluno e dia
e acrescenta recursos para lançar e conferir as marcações existentes.

## Novidades

- Busca por nome do aluno, incluindo pesquisa sem acentos.
- Filtros por dia e por uma semana; é possível continuar vendo todas as semanas.
- Horários sem alunos ficam ocultos inicialmente e podem ser exibidos.
- Filtros são locais: pesquisar e mudar a seleção não consultam o Firebase.
- Células com botões acessíveis por teclado, identificação de aluno/dia/semana
  e indicação da marcação atual. Enter abre, setas percorrem as opções e Escape
  fecha e devolve o foco à célula.
- Mensagem de salvamento pendente e confirmação com aluno, dia, semana e situação.
  Novos lançamentos ficam bloqueados enquanto a gravação aguarda confirmação.
- Gravação em transação: se o mesmo dia mudou em outra aba, a alteração pendente
  é recusada e o usuário recebe orientação para reabrir a frequência.
- Respostas atrasadas são descartadas ao sair da conta ou trocar de turno.

## Conferência e registros antigos

O quadro de conferência considera as linhas e semanas selecionadas. Marcações
diárias são contadas por aluno/dia/semana; dois horários no mesmo dia não viram
duas presenças. Essa é a estrutura já existente do sistema, agora explicitada.
“Não lançado” nunca é contado automaticamente como falta.

Registros antigos guardados somente por aluno, sem dia, recebem a indicação
“semanal antigo”. Como não é possível deduzir em quais dias houve atendimento,
eles são informados separadamente e não são convertidos em marcações diárias.
Selecionar uma situação numa célula registra apenas aquele aluno/dia.

Limpar uma célula grava `null` na chave diária, preservando outras marcações e
o valor semanal antigo. Isso evita tanto restaurar o valor antigo por fallback
quanto apagar a marcação que outros dias ainda consultam. Não há migração em lote.

## Segunda etapa: resumo e relatórios (concluída no mesmo pacote)

A revisão foi concluída em um segundo commit do mesmo pacote. Consulte
`ETAPA-10-FREQUENCIA-RELATORIOS.md`: a grade e o resumo agora consideram os dias
separadamente, preservam registros semanais antigos em bloco próprio e permitem
selecionar um aluno. O percentual mantém a fórmula anterior, explicitada no arquivo.

A descrição e os testes desta seção de lançamento correspondem à primeira fase;
o guia dos relatórios registra o resultado completo e a validação dos valores
nos arquivos DOCX/ODT da segunda fase.

## Publicação futura

A branch `melhorias/etapa-10-frequencia` inclui as etapas anteriores, inclusive o
painel de metas por período da etapa 9. Não houve publicação no Netlify ou mudança
de regras no Firebase. A cópia continua em `ambienteteste-e368e`.

Não é necessário atualizar regras Firebase para este lançamento. Quando for
publicar o pacote, baixar a branch em Code → Download ZIP e enviar ao Netlify
de teste a pasta completa, incluindo `frequencia-interface.js` e
`frequencia-interface.css`. Não enviar esta cópia ao site oficial.

## Validação

Passaram 35 verificações de frequência no Chromium: filtros sem leituras extras,
contagem sem duplicar horários, indicação de legado, limpeza de um só dia,
gravação, rejeição, conflito entre abas, bloqueio durante salvamento, teclado,
larguras de 390/320 pixels e descarte de consulta após sair da conta.
Também passaram as 47 verificações de metas/atendimentos e os 10 downloads de
exportação anteriores; estes últimos verificam geração, não a correção do problema
de totais com vários dias identificado acima. Todas as requisições externas foram
bloqueadas nos testes e o Firebase foi simulado. A conferência manual da nova
interface permanece para a publicação futura.
