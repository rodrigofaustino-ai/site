# Etapa 81 — CGM manual ao lado do nome

Atende à correção de escopo do usuário: bastava um campo para preenchimento manual, no espaço marcado à direita do nome. A identificação passa a ter Nome completo e Número CGM na mesma linha no computador; nascimento e turma voltam à linha de duas colunas original. No celular, CGM fica abaixo do nome. Mesma propriedade cgm e salvamento já implementados, sem migrar ou preencher números. O botão de importação foi retirado da tela e seu script não é carregado no Diário. A lista pessoal não é utilizada nem incluída no pacote.

Confirmada a compatibilidade cadastral existente: Relatório solicita identificacao.cgm, recebe o CGM salvo no Diário pela ponte autorizada e inclui o número na exportação. A consulta completa somente campos vazios; CGM já preenchido ou editado no formulário é preservado. Os modelos atuais PAEE, PEI e Diagnóstica não exibem campo específico de CGM; não foram acrescentados campos não solicitados nesses modelos.

Validação manual: campo à direita do nome, gravação/mascaramento, reabertura, limpeza entre alunos, celular e ausência da importação na tela. Validação da ponte cadastral ampliada para CGM no Relatório: preenchimento do campo vazio, preservação após alteração manual e número editado no XML do DOCX exportado, além dos testes existentes de vínculo, conta, identificação e família. Total da ponte: 49 verificações. Nenhum dado real foi gravado. Prévias fictícias em previas/etapa-81.

Pacote cumulativo 81 para publicação manual; não há permissões novas no Firebase.
