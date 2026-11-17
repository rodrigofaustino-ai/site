# FJ e histórico automático

Alunos do Dia e Frequência usam P (presente), F (falta), FJ (falta justificada) e a opção existente Sem atendimento pedagógico. O valor interno `justificado` é mantido: o antigo J aparece como FJ sem migrar dados. As legendas e os arquivos exportados da Frequência acompanham a mudança.

Na agenda, F/FJ gravam a marcação e um relato na data selecionada em uma transação. Os textos são “Aluno faltou” e “Aluno faltou — falta justificada”. O identificador por aluno/data é compartilhado com os botões de falta da ficha. Repetir o clique, perder a confirmação da rede ou ter dois horários no mesmo dia não cria duas ausências automáticas.

Corrigir uma marcação de ausência pede confirmação. F para FJ atualiza o relato automático; P/SAP remove somente esse relato automático. Um relato alterado com texto próprio, humor, metas ou próximo passo é protegido: a agenda orienta conferir a ficha. Relatos antigos, de outros identificadores, não são apagados nem migrados. Marcar P/SAP não cria relato de atendimento.

A atualização automática do histórico ocorre pelos botões da agenda e da ficha. A grade da Frequência mantém seu fluxo de edição, exibindo agora FJ. Não gera relatos retroativos para marcações antigas.

O total previsto/ofertado continua sendo o número de relatos salvos, incluindo faltas e justificadas. F/FJ permanecem separados nas contagens e no filtro por período. Não altera as regras de exportação do Histórico nem exige novas regras Firebase.

Testes locais no Chromium usam Firebase simulado: repetição, dois horários, F→FJ, cancelamento, retorno a P, falha antes de gravar, confirmação de rede perdida, proteção de texto próprio, integração agenda/ficha e celular. O pacote é cumulativo e inclui as notificações do navegador.
