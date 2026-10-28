# Agenda do dia

Branch cumulativa: `melhorias/etapa-19-agenda-dia`.
A etapa 18 já foi publicada pelo usuário no Netlify de teste. Esta nova etapa
foi preparada e guardada, sem publicação automática.

## Uso

Na aba Alunos, acima da lista, a Agenda do dia mostra os alunos previstos por
horário, conforme a data escolhida e o turno da sessão. A consulta começa na
data local do navegador. Hoje retorna à data atual; escolher outra data consulta
o dia da semana correspondente no cadastro recorrente, sem criar eventos.

A agenda não representa presença confirmada, atendimento realizado ou bloqueio
de feriados. Os horários continuam sendo os rótulos 1º a 5º Horário já usados
na grade; não se inventam horas de relógio. Uma ausência de registros na agenda
não equivale a falta do aluno. A grade semanal permanece como antes.

Abrir ficha usa a função existente e permite consultar documentos ou iniciar o
registro do atendimento. Não preenche relato, não grava atendimento/frequência
e não altera automaticamente a data do registro a partir da data da consulta.

## Implementação

`agenda-dia.js/css`, integrados à lista já carregada por renderStudentList.
Não há consultas extras: mudar a data e usar Hoje filtra somente os dados em
memória. A mesma pessoa no mesmo horário não aparece duplicada; vários horários
do mesmo aluno permanecem visíveis. Contagem distingue alunos únicos e grupos
de horários. Cadastros antigos diaAtendimento/horarioAtendimento são aceitos.

Usa o mesmo filtro de proprietário/turno do Diário, incluindo alunos sem turno
específico em ambos os turnos. Data inválida, carregamento, erro e dia sem
atendimentos têm mensagens próprias. Ao mudar de conta/turno, consultas antigas
não podem repintar a lista ou agenda. Logout limpa ambas. Não há persistência
nova no navegador ou no Firebase. A data escolhida fica apenas em memória e é
mantida ao voltar à lista na mesma conta/turno; outra conta/turno começa em Hoje.

Não há alterações em documentos, exportações, metas, regras ou índices Firebase.

## Validação

29 verificações da agenda no Chromium: agrupamento/ordenação, horários repetidos,
múltiplos horários do mesmo aluno, cadastro antigo, isolamento por turno/conta,
dia vazio/fim de semana/data inválida, Hoje, nenhuma leitura adicional ao trocar
a data, nenhuma gravação, abertura pelo teclado, retorno à lista, falha e consulta
atrasada após logout. Larguras de 390/320 px sem transbordamento da página.
Mais 66 verificações do registro/consulta e 90 de isolamento/carregamento/sintaxe.

Dados fictícios, Firebase simulado e pedidos externos bloqueados. Capturas do
computador e celular inspecionadas e disponíveis em previas. Conferência manual
no Netlify ainda pendente. Para publicar futuramente, usar a branch completa,
incluindo os novos JS/CSS; nenhuma alteração Firebase é necessária.
