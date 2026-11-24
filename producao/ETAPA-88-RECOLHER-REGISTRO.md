# Etapa 88 — recolher após salvar no histórico

O bloco Registrar atendimento se recolhe somente após a transação confirmar o salvamento. O estado recolhido é mantido nas remontagens e nos demais horários abertos do mesmo aluno/data/turno. A referência anterior é limpa e será consultada novamente ao reabrir. O foco retorna ao título, e o aviso padrão confirma o salvamento.

Erro ou confirmação perdida mantém o bloco aberto e o texto/tentativa pendentes preservados. Não muda a transação, a frequência, documentos ou regras Firebase.

Validação: 27 verificações do fluxo existente no Chromium, incluindo fechamento dos dois horários do mesmo aluno, erro sem recolher, confirmação perdida e repetição sem duplicar. Prévia: previas/etapa-88/apos-salvar-recolhido.png.
