# Etapa 30 — Próximo passo do encontro

Pacote acumulado com as etapas 27–29: estatísticas/pizzas, arquivamento e Meu dia. Nenhuma dessas etapas foi publicada ainda; etapa 26 é o oficial conferido. Esta branch usa os dois projetos oficiais.

## Preenchimento e continuidade

Novo campo opcional Próximo passo, após o relato, até 2.000 caracteres. O relato continua obrigatório. O campo não é inferido de texto antigo nem produzido automaticamente por IA.

Salvar inclui o campo proximoPasso no próprio registro quando preenchido e acrescenta ao final do texto do relato o bloco Próximo passo. Assim o conteúdo entra na busca, no compartilhamento explícito do relato e nas exportações existentes sem alterar a estrutura dos modelos. Repetir a composição do mesmo bloco exato ao final não o duplica. Campo vazio mantém a estrutura anterior, sem gravar campo vazio.

Acima do registro, Continuidade para o próximo encontro mostra o campo dos registros da data mais recente válida até hoje. Se houver vários naquela data, todos aparecem, identificados como registros do mesmo dia. Não escolhe um registro arbitrário como único mais recente. Não retrocede silenciosamente a uma orientação de um dia anterior se o último dia não tiver o campo. Relatos antigos permanecem sem alteração e o professor pode consultá-los no histórico. Registros com data futura ou inválida não entram nesse quadro.

A orientação é referência para avaliação do profissional. Não é copiada automaticamente para o novo preenchimento, não constitui pendência ou meta concluída, e não gera alertas de aprendizagem.

## Salvamento e isolamento

O campo participa do aviso de rascunho, bloqueia durante o salvamento e integra a assinatura da tentativa, preservando a proteção contra duplicação após perda de confirmação. Troca de aluno, descarte confirmado e logout limpam o campo; salvar o cadastro novo preserva o rascunho como já ocorria com o relato. Falha mantém o preenchimento.

O quadro usa os registros já carregados e as mesmas proteções de contexto da ficha. Nenhuma consulta adicional, regra, índice, agendamento ou alteração dos registros antigos. Nenhuma publicação nem acesso a dados reais na preparação.

## Verificações locais

- 9 verificações do modelo: composição sem duplicar bloco, campo vazio/legado, limite, datas futuras/inválidas, múltiplos registros do mesmo dia e assinatura.
- 27 verificações em Chromium com Firebase simulado e pedidos externos bloqueados: salvar/reabrir, preservação de legado, emissão do próximo passo no texto e no DOCX real gerado (XML conferido), aviso de rascunho, troca de aluno, perda de confirmação/repetição sem duplicar, bloqueio durante salvamento, múltiplos registros por dia, texto seguro, celular e logout.
- 66 verificações de registro assistido/tradicional e 75 verificações de configuração/sintaxe.

Prévia gerada somente com dados fictícios. Publicação no Netlify permanece pendente, conforme combinado.
