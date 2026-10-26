# Frequência — etapa 2: relatório por aluno e período

Esta entrega completa as duas etapas de frequência solicitadas. Está na mesma
branch `melhorias/etapa-10-frequencia`, junto com as melhorias do lançamento e
o acompanhamento de metas por período da etapa 9. Não houve publicação no Netlify
nem alteração no Firebase.

## Relatório revisado

Em Exportar frequência, escolher todos os alunos ou um aluno, as datas inicial
e final e o formato DOCX/ODT. A seleção continua baseada na data de início de
cada semana, incluindo os dois limites. Semanas sem data válida ficam fora do
intervalo. Não são inventadas datas individuais para os dias de atendimento.

A grade mostra cada dia separadamente, por exemplo “Segunda: P” e “Quinta: F”,
em vez de selecionar apenas a primeira marcação da semana. Horários repetidos
no mesmo dia não duplicam as contagens. Marcações por dia que permanecem no banco
também são consideradas quando esse dia já não consta na grade atual do aluno.

O resumo diário contém presenças, faltas, justificadas, sem atendimento pedagógico,
campos sem lançamento e percentual diário. A fórmula anterior foi preservada:
`P / (P + F + J) × 100`. SAP, campos sem lançamento, registros sem dia identificado
e valores não reconhecidos ficam fora do denominador. Sem denominador, aparece
“—”, sem criar um percentual de 0%.

Essa fórmula é explicitada no arquivo e não é apresentada como uma nova norma
institucional. O sistema não altera a política de contabilização de justificadas.

## Registros antigos e dias não identificados

Registros antigos que guardam apenas aluno/semana, sem dia, aparecem na grade
como “Semanal antigo”. Seus totais por situação aparecem em um bloco separado
por aluno. Eles não são distribuídos pelos dias nem somados aos totais diários.
Quando existem marcações diárias e semanais antigas na mesma semana, ambas as
informações são preservadas, com suas origens identificadas.

Marcações salvas como “Sem dia” ou com dia não reconhecido também ficam separadas
dos totais diários. Valores desconhecidos recebem “?” e aviso para conferência;
não são interpretados como presença ou falta. Uma célula diária limpa (`null`)
permanece sem lançamento, sem restaurar por engano o registro semanal antigo.

## Persistência e limites

O relatório é somente de leitura: não migra dados e não grava, altera ou apaga
marcações. Uma troca de conta/turno durante a geração impede a entrega de um
arquivo iniciado no contexto anterior. Os filtros do relatório são próprios;
não dependem do dia ou busca aplicados à grade da tela.

As contagens dependem dos registros disponíveis e da grade cadastrada. Semanas
sem data válida e alunos fora da consulta do responsável não são recuperados
automaticamente. A disponibilidade de todos os dias na grade e o tratamento
institucional de calendários/feriados permanecem como antes.

## Validação e publicação futura

Passaram 53 verificações de frequência no Chromium com Firebase simulado e
requisições externas bloqueadas. Os testes abriram DOCX/ODT gerados e conferiram
conteúdo, seleção individual de aluno, dois dias na semana, ausência de duplicação
de horários, data inválida, separação do legado e os valores das células do resumo.
Exemplo testado: 1 presença, 1 justificada e 1 dia sem lançamento → 50% diário,
com a presença semanal antiga informada separadamente.

Também passaram 87 verificações de isolamento/carregamento e os 10 downloads de
exportação dos módulos anteriores. A primeira etapa havia passado 47 verificações
de regressão de metas/atendimentos. Não houve teste com dados reais do usuário.

Para publicar depois, basta o ZIP completo da branch no Netlify de teste,
incluindo `frequencia-interface.js` e `frequencia-interface.css`. Não é necessário
alterar regras Firebase. O pacote permanece em `ambienteteste-e368e`; não enviar
essa cópia ao site oficial.
