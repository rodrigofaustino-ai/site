# Etapa 87 — último registro na agenda

Ao abrir Registrar atendimento, carrega uma referência compacta com a data e o texto do último registro até a data selecionada, inclusive registros do próprio dia. Não consulta registros futuros em relação à data do encontro. Usa a data do registro; em empate, o horário de criação disponível, com desempate estável por ID.

Texto longo começa resumido na tela, com Ver relato completo/Recolher relato. Tipo F/FJ/SAP identificado quando presente. Apenas leitura: não insere o texto no novo campo, não altera o histórico, não marca presença e não altera exportações.

Consulta somente ao expandir (ou remontar um bloco previamente aberto). Confere o dono do aluno no servidor antes de consultar a subcoleção; usa o índice simples do campo date. Reconsulta o dia mais recente apenas quando há empate. Respostas de contexto antigo são descartadas; troca de conta limpa a referência. Diferencia ausência de registros de falha de consulta e oferece Tentar novamente, sem bloquear a redação.

Salvamento mantém a transação original, com atualização da referência nos blocos abertos do aluno. Nenhuma nova coleção ou regra Firebase.

Validação em Chromium com dados fictícios e Firebase simulado: leitura só ao abrir, escolha por data/criação, exclusão de futuro, histórico vazio, erro/repetição, rascunho preservado, texto exibido com segurança, expansão/recolhimento, celular, troca de data/conta, ausência de gravação pela consulta e regressão do salvamento rápido. Capturas em previas/etapa-87.
