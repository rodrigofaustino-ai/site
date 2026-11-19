# Prévia: registro rápido, área útil e formulários compactos

Abaixo de cada aluno em Alunos do Dia, Registrar atendimento abre/recolhe uma área da largura da coluna. Inclui relato, a revisão de IA existente, humor opcional e Salvar no histórico. O salvamento usa a data selecionada na agenda e a subcoleção de registros do mesmo aluno. Não exige abrir a ficha nem copiar o texto. Não grava ao digitar, selecionar humor ou recolher.

Rascunhos ficam somente na memória da sessão, separados por conta, turno, data e aluno; voltar a uma data recupera o preenchimento. Dois horários do mesmo aluno no dia compartilham o rascunho, evitando salvamento duplicado acidental. Sair/trocar conta limpa a memória e o navegador recebe aviso de alterações pendentes antes de recarregar/fechar. Não é rascunho persistente entre sessões.

A tentativa de salvamento tem identificador estável e transação; repetir após perda de confirmação não duplica o registro. Confere proprietário, cadastro ativo, turno, horário e, quando há semana, a marcação atual. Não muda P/F/FJ/SAP. Se a frequência está em ausência/SAP, pede confirmação de que o relato corresponde àquela marcação. F/FJ complementam somente o registro automático canônico da ausência; relatos já personalizados não são substituídos. Campos e textos permanecem disponíveis em falhas. O registro aparece no histórico e nas exportações existentes.

A área útil do Diário e da ficha usa as laterais no computador com margem pequena. Formulários PAEE, PEI, Relatório e Diagnóstica têm espaçamentos menores, entradas legíveis, área maior e instruções preservadas. O PEI dispõe a identificação em duas colunas no computador. No celular, controles mantêm tamanhos de toque maiores. As mudanças visuais são CSS de tela e não alteram a formatação dos documentos exportados.

Prévias em previas/etapa-71 com dados fictícios, incluindo desktop e celular. Testes locais cobrem gravação, IA/aplicação, humor, histórico na ficha, data, rascunhos, falha/retentativa, ausência, duplicação por horários, largura e regressões de frequência, registro tradicional, IA e autopreenchimento. Firestore é simulado; não houve gravação em projetos reais. Não requer novas regras Firebase.

Estado: prévia implementada para revisão do usuário, antes de preparar o próximo ZIP de publicação.
