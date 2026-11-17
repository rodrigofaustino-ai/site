# Totais na identificação e atalhos de falta

Ao lado do turno, a ficha mostra Atendimentos previstos/ofertados (quantidade de relatos salvos, incluindo faltas e justificadas), Faltas (F) e Justificadas (J). Todos os turnos entram na consulta. A seleção de duas datas aplica intervalo inclusivo aos relatos e às datas dos dias da Frequência, mesmo em semanas parcialmente abrangidas.

F/J são contados por data, sem duplicar o mesmo dia em semanas/turnos repetidos. Marcações semanais antigas ou sem data identificável ficam informadas separadamente; não inventamos o dia da falta. Relatos sem data válida entram apenas em Todo o histórico. A frequência não cria relatos retroativamente; sem relato salvo não aumenta o total ofertado.

Botões Falta e Falta justificada preenchem o relato e selecionam o tipo. Texto já escrito exige confirmação antes de substituir. O professor confere data e salva; ao salvar, uma transação grava relato e F/J na mesma semana do turno da sessão. Marcações diferentes exigem confirmação. Semana inexistente, sobreposta, removida, alterada ou conflito de marcação bloqueia a gravação; o texto permanece. Uma falha de rede não pode deixar somente metade da transação gravada. Repetir a mesma tentativa usa o mesmo identificador de relato.

Atendimento desmarca o tipo de falta sem apagar o texto. Trocar aluno/conta limpa o tipo. As exportações e os registros antigos são preservados. Não exige alteração de regras Firebase: mantém os caminhos e permissões existentes.

Validação local no Chromium com Firebase simulado: total inclui F/J, período por dia, substituição de texto, gravação conjunta, falha antes de gravar, repetição, semana ausente, troca de aluno e celular. A apresentação real e as permissões remotas serão conferidas pelo usuário após publicar. O pacote inclui as notificações da etapa 59.
