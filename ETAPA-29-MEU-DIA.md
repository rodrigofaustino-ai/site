# Etapa 29 — Meu dia

Preparada sobre a etapa 28, acumulando estatísticas, gráficos de pizza com efeito 3D e arquivamento reversível. Etapas 27, 28 e 29 ainda não publicadas; etapa 26 é a versão oficial confirmada. Esta branch continua conectada aos projetos oficiais, não é uma cópia isolada de teste.

## Painel

Na aba Alunos, Meu dia reúne a agenda existente e revisões de metas. A agenda mantém a Data do encontro e os horários previstos do cadastro semanal. Não confirma presença, atendimento realizado, feriados ou cancelamentos.

Revisões têm três grupos: datas anteriores a hoje; data igual a hoje; de amanhã até hoje + 7 dias, inclusive. Usam a data local atual no momento da consulta, independentemente da data escolhida na agenda. A última leitura e a data de referência ficam visíveis. Um painel deixado aberto precisa ser atualizado ao mudar o dia ou os dados.

Somente metas ativas ou em revisão dos alunos em atendimento, no turno selecionado (incluindo alunos sem turno definido). Concluídas e arquivadas ficam fora. Datas inválidas/ausentes e situações desconhecidas recebem avisos de qualidade de dados e não viram alertas vencidos. Os números contam metas/revisões, não alunos distintos. O botão Abrir metas do aluno abre a ficha e leva o foco à seção Metas, respeitando os avisos existentes de alterações pendentes.

Não há alertas inventados de ausência, aprendizagem, encaminhamentos ou documentos incompletos. Encaminhamentos e rascunhos persistentes dependem de funcionalidades futuras.

## Leitura e sessão

Agenda reutiliza os alunos da lista, sem consultas adicionais. Revisões são consultadas somente no botão Carregar/Atualizar revisões: uma consulta de metas por aluno ativo do turno, no máximo quatro alunos simultâneos, fonte servidor, sem collectionGroup, registros, documentos do outro projeto ou escritas. Essa leitura usa as cotas habituais do Firestore.

Atualizar a lista de alunos reinicia o painel de revisões; carregue novamente quando necessário. Alterar somente a data da agenda não consulta metas nem altera sua referência. Salvar metas na ficha invalida resultados em memória. Mudança de conta, turno, arquivamento/reativação ou nova carga da lista invalida a consulta antiga. Logout esconde o painel e remove seu conteúdo. Falha de qualquer consulta elimina resultados parciais. Dados de outro professor ou de alunos arquivados não são consultados pelo painel.

Sem novas regras, índices, persistência local, notificações externas ou alterações nos documentos exportados. Nenhum dado real foi consultado ou alterado na preparação.

## Validação local

- 12 verificações do modelo: vencida/hoje/7 dias, limite inclusivo, datas inválidas, situações, ordenação, ano novo e ano bissexto.
- 26 verificações da página real no Chromium, Firebase simulado e pedidos externos bloqueados: carga explícita, fonte servidor, isolamento de professor/turno/arquivado, ausência de leituras ao mudar data da agenda, referência do dia, falha sem totais parciais, textos seguros, atalho de teclado, 390/320 px e logout durante consulta, sem gravações.
- Agenda existente: 29 verificações. Arquivamento: 23 verificações. Configuração e sintaxe: 74 verificações.
- As prévias usam somente nomes e metas fictícios.

Publicação no Netlify somente depois, conforme solicitado pelo usuário.
