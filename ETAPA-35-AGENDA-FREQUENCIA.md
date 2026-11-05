# Etapa 35 — Frequência pela agenda e colunas compactas

Acrescenta P/F/J antes de Abrir ficha e Sem atendimento pedagógico no cabeçalho de cada horário. A tabela permanece exclusivamente na aba Frequência. Os atalhos usam a Data do encontro e a mesma chave alunoId__dia dos registros existentes. O registro continua diário: aluno em mais de um horário compartilha a mesma marcação.

Ao consultar um dia com alunos, lê as semanas do professor do servidor. Exige uma única semana compatível com dataInicio/dataFim e turno (sem turno mantém compatibilidade anterior). Sem data de início, semana ausente ou sobreposição bloqueiam os atalhos, com orientação para conferir na aba Frequência. Não cria semanas automaticamente nem usa o texto do rótulo para adivinhar datas.

Salvamento em transação única, inclusive SAP em bloco. Revalida autenticação/turno, semana, propriedade dos alunos, arquivamento e horário cadastrado. Compara as marcações consultadas com as atuais; mudança concorrente diferente exige conferir e clicar novamente. Preserva outras marcações no mapa e não altera relatos/documentos/metas. Falha não mostra sucesso e permite tentar novamente. Não cria atendimento pedagógico nem relato a partir da presença.

Cabeçalhos com rótulos dd/mm a dd/mm ficam em três linhas, com largura mínima de 78px; rótulos personalizados continuam editáveis. Quebras de apresentação não são persistidas. Exportações continuam usando os rótulos originais.

Validação: Chromium com Firebase simulado e tráfego externo bloqueado; testes de P/F/J, SAP em bloco, espelhamento em dois horários, preservação de outro dia, falha de gravação, concorrência, cadastro alterado sem gravação parcial, semanas ausentes/sobrepostas e telas 1440/390/320. Regressões da agenda, frequência (incluindo exportações) e configuração oficial. O mock antigo de frequência passou a entregar onAuthStateChanged em microtarefa, conforme o SDK real, evitando erro de inicialização síncrona no teste.

Sem mudanças em regras Firebase e sem publicação automática no Netlify. Continua cumulativa da etapa 34.
