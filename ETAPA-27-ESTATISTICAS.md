# Etapa 27 — Encontros e estatísticas

Preparada sobre a etapa 26 já publicada no oficial. Esta etapa ainda não foi publicada. A configuração desta branch conecta aos dois projetos oficiais: não usar como cópia isolada de teste sem trocar a configuração. Nenhuma regra do Firebase mudou nesta etapa.

## O que muda

- Agenda do dia: Data da consulta passa a Data do encontro. Termos de consulta a históricos/documentos permanecem.
- Nova aba Estatísticas: cada conta consulta somente seus alunos, mesmo quando administradora. Não há panorama coletivo nesta etapa.
- Carregamento por botão; filtro local por datas e turno (inclusive Todos). Recarregar após inserir ou alterar dados. Até 120 meses no gráfico mensal.
- Indicadores: alunos no cadastro atual, quantidade de atendimentos, alunos com/sem registro no intervalo, metas ativas/em revisão com data de revisão vencida hoje.
- Gráficos em barras com efeito 3D (faces superior/lateral, gradientes e sombras), cores por situação e tabelas acessíveis: atendimentos por mês, frequência diária e situação atual das metas. Marcações semanais antigas e dias não reconhecidos ficam em quadros separados.

## Definições

Atendimentos são documentos de registros com date válida dentro dos limites inclusivos. Uma falta não é inferida quando falta registro. Os meses sem atendimento mostram zero.

Frequência considera dataInicio da semana no intervalo e inclui as marcações da semana inteira, como o resumo existente. Um aluno/dia conta uma vez por semana, sem duplicar horários. Não mistura marcações antigas semanais com diárias. Alunos ou semanas sem turno definido são compatíveis com os filtros; em Todos, semanas de turno explícito diferente do aluno são excluídas daquela associação. Alunos sem turno contam uma vez, não duas, no total de Todos.

Sem marcação se baseia na grade atual, não comprova falta nem matrícula histórica. Datas inválidas ficam fora do intervalo, com aviso. Não há percentuais de aprendizagem.

Metas são um retrato atual dos alunos do turno; o período não reconstrói situações anteriores nem limita metas por data de criação. Revisão vencida compara a data atual local com a data de revisão das metas ativas/em revisão. Metas com situação desconhecida e revisão inválida são sinalizadas.

## Leituras e isolamento

Consulta alunos e semanas por professorUid, depois registros e metas de cada aluno da conta, no máximo quatro alunos simultâneos. Fonte servidor. Resultados ficam só em memória, sem nomes, conteúdo de relatos, fotos ou laudos retidos no conjunto de estatísticas; as leituras do Firestore ainda retornam os documentos completos. Não consulta outro projeto nem adiciona índices, gravadores ou listeners. Filtros não fazem novas leituras. Falha de qualquer parte descarta resultados parciais. Logout, troca de conta ou de turno invalidam a consulta e limpam o painel. As leituras manuais consomem as cotas habituais do Firestore.

## Validação

- verificar-estatisticas-modelo.cjs: 27 verificações de período/turno, limites, datas inválidas, marcação antiga separada, dias duplicados, meses vazios e situação atual das metas.
- verificar-estatisticas-navegador.cjs: página real com Firebase simulado, filtros sem releitura, isolamento, limpeza de cache por turno, falha sem totais parciais, logout durante leitura, zero gravações e celular em 390/320 px.
- verificar-agenda-dia.cjs: 29 verificações da agenda existente.
- verificar-firebase-producao.cjs: configuração e sintaxe, requisições externas bloqueadas.

Sem uso de dados reais nos testes. Configuração remota, permissões reais e dados reais não foram consultados. Publicação manual somente quando solicitada pelo usuário.

Ajuste visual 3D: comprimentos permanecem proporcionais aos totais; zero não ganha volume artificial. Valores textuais e tabelas continuam acessíveis. Testes de consolidação (27) e navegador (19) passaram após o ajuste, incluindo celular.

Prévia de pizza solicitada: frequência diária e situação atual das metas agora usam pizza com efeito 3D discreto, tabela de quantidades e percentuais. O denominador é a soma de todas as categorias de cada distribuição, incluindo sem marcação e situação desconhecida, quando existentes. Não representa taxa de aprendizagem nem substitui a definição de percentual de presença usada nos documentos. Categorias zeradas aparecem na legenda, sem fatias falsas; sem dados não há pizza. Atendimentos por mês e marcações antigas continuam em barras. Percentuais arredondados podem não totalizar exatamente 100%. Capturas usam somente dados fictícios. Teste de navegador ampliado para 23 verificações, incluindo total zero e categoria única. Prévia ainda não publicada no Netlify.
