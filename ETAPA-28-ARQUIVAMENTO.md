# Etapa 28 — Arquivamento reversível de alunos

Pacote acumulado sobre a etapa 27 (estatísticas, pizzas com efeito 3D e Data do encontro). Etapas 27 e 28 ainda não publicadas; etapa 26 continua sendo a versão oficial confirmada pelo usuário. Esta branch usa os projetos oficiais; não publicar automaticamente no site de teste como se fosse um banco isolado.

## Comportamento

- Substitui o botão Excluir cadastro por Arquivar. A antiga função de exclusão de cadastro e registros foi removida deste pacote.
- Lista principal inicia em Em atendimento. Arquivados permite consultar fichas e reativar. Todos permite comparar sem duplicar cadastros. Cadastros antigos sem o campo arquivado continuam em atendimento.
- Arquivar atualiza somente arquivado, arquivadoEm e arquivadoPor no documento principal; reativar atualiza somente arquivado, reativadoEm e reativadoPor. Datas usam o relógio do servidor. Esses campos indicam os últimos eventos, não um histórico imutável completo de auditoria.
- A transação confirma professor responsável e contexto de conta/turno. Repetir a mesma operação após perda da confirmação não duplica nem recria documentos.
- Arquivados saem da agenda do dia e da grade atuais. A frequência e as listas documentais continuam incluindo os cadastros, para consulta e exportação histórica. O arquivamento não altera nem recalcula marcações passadas e não representa uma data retroativa de encerramento de matrícula.
- Ficha arquivada tem identificação visível. Arquivamento é organização da lista, não bloqueio de edição ou mudança de permissões. Compartilhamentos e acessos concedidos permanecem como estavam.
- Mantém documentos nos dois projetos, relatos, metas, PEI, imagens, laudos e marcações de frequência. Não migra nem exclui arquivos. Não altera os geradores de exportação.
- Estatísticas ganham filtro de situação do cadastro: Em atendimento (padrão), Arquivados e Todos. Os resultados usam a situação atual do cadastro; escolher um período antigo não reconstrói a situação histórica. Uma operação de arquivamento/reativação nesta página invalida os totais em memória; outra aba exige Atualizar estatísticas.
- Filtros e mensagens da lista são limpos ao trocar conta/turno. Operação pendente não redesenha dados de sessão anterior. Uma transação já enviada ao servidor não pode ser considerada cancelada por fechar a página; conferir a situação ao reabrir.

## Banco de dados e publicação

Não requer novas regras nem índices: as regras atuais já permitem ao responsável atualizar seu cadastro preservando professorUid. A remoção da ação na interface não revoga a permissão de exclusão existente no backend ou em versões antigas; não foi feita alteração de regras nesta etapa.

Nenhum dado real foi lido ou alterado na preparação. Os testes abaixo usam dados fictícios. Publicação no Netlify fica para depois, conforme solicitado.

## Verificações

- 23 verificações de arquivamento em Chromium: cancelamento da confirmação, preservação exata dos demais documentos/campos, reativação, falha sem gravação, perda de confirmação e repetição, rejeição de outro proprietário, ficha com aviso, retirada da agenda/grade, 390/320 px e troca de conta durante leitura sem alteração do cadastro.
- 31 verificações do modelo de estatísticas: inclui separação de ativos/arquivados/todos e preservação das contagens históricas.
- 26 verificações da aba Estatísticas: filtros locais, arquivo incluído/excluído explicitamente, isolamento, gráficos, falha e logout.
- 29 verificações da agenda existente e 66 do registro assistido/tradicional.
- Configuração oficial/sintaxe e 10 downloads DOCX/ODT, com formulários em 390/320 px.

Próxima melhoria planejada: painel Meu dia, ainda não implementado nesta etapa.
