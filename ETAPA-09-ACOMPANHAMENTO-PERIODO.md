# Acompanhamento de metas por período

Na ficha do aluno, em “Metas e acompanhamento”, abrir “Acompanhamento por
período”. A consulta começa no mês atual, até o dia de hoje, conforme a data
local do navegador. É possível escolher outro intervalo ou “Todo o histórico”.
O filtro inclui as datas inicial e final e só muda após clicar em Aplicar período.

O painel mostra atendimentos no intervalo, quantos têm alguma meta vinculada,
quantos não têm vínculo e quantas metas atuais têm relatos no período.
Um atendimento relacionado a várias metas conta apenas uma vez no total de
atendimentos com vínculo, embora apareça nos relatos de cada meta relacionada.

O quadro contém todas as metas cadastradas, inclusive concluídas e arquivadas,
com situação definida pelo professor, quantidade e última data dos relatos do
período, data de revisão e consulta dos textos. Quando existe um objetivo
histórico diferente no vínculo do atendimento, ele também é apresentado.

As revisões pendentes são indicadas apenas para metas ativas ou em revisão com
data anterior a hoje. Esse lembrete é independente do intervalo de atendimentos.
Não representa atraso de aprendizagem. O painel não calcula porcentagem de
progresso, não conclui metas e não avalia o desenvolvimento do aluno.

## Dados incompletos

- Registros sem data válida não entram no filtro por datas; o painel informa
  quantos foram excluídos e permite consultá-los em Todo o histórico.
- Relatos vinculados a metas não encontradas continuam no total com vínculo,
  com aviso. Não se tenta associar registros por semelhança de nomes ou objetivos.
- Falha ou carregamento de metas/atendimentos produz aviso, não contagens zeradas.
- Os filtros e dados do painel são limpos ao trocar de aluno ou sair da conta.
- Atendimentos sem vínculo continuam disponíveis para consulta; nada é migrado.

## Publicação e persistência

Esta versão usa somente os dados já carregados pelo Diário. Não faz consultas
extras nem gravações, não modifica formulários, metas, atendimentos ou PEI e não
amplia o conteúdo compartilhado com outros profissionais. O painel é do responsável
na ficha privada; o acesso dos colaboradores permanece restrito às cópias autorizadas.

Não é necessário alterar regras Firebase. Não houve implantação no Netlify.
A branch `melhorias/etapa-09-acompanhamento-periodo` contém as etapas anteriores
e permanece conectada ao Firebase de teste `ambienteteste-e368e`. A publicação
pode ser acumulada com as próximas melhorias para economizar a cota do Netlify.

Quando decidir publicar, baixar essa branch em Code → Download ZIP, extrair
e enviar a pasta completa ao Netlify de teste, incluindo os arquivos
`acompanhamento-periodo.js` e `acompanhamento-periodo.css`. Atualizar o navegador
com Ctrl+Shift+R e abrir a ficha do aluno fictício. Não implantar no site oficial.

## Validação

Passaram 47 verificações de metas/atendimentos no Chromium, incluindo limites
das datas, ano bissexto, múltiplos vínculos, metas concluídas, vínculos desconhecidos,
datas inválidas, fonte imutável, ausência de gravação, falhas de consulta, datas
ainda não aplicadas e troca de aluno. A largura foi conferida em 390 e 320 pixels.
Também passaram 86 verificações de isolamento/carregamento, 33 da central e 37
do compartilhamento. Os testes bloquearam pedidos externos e usaram Firebase
simulado; a conferência manual no site publicado permanece para o próximo pacote.
