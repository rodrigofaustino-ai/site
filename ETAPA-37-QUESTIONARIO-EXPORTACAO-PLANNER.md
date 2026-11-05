# Etapa 37 — Ajustes do questionário, exportação e planner em Meu dia

Cumulativa da etapa 36. Mantém o visual aprovado para a família e a seleção dos 54 itens do modelo, organizada em 27 grupos com os complementos de alimentação, sono e rotina.

## Preenchimento sem obrigar todas as questões

O rótulo “Quero contar como acontece” passou a “Vou descrever abaixo como observei este item na criança”. As demais alternativas permanecem.

Primeiro clique em Continuar com pendências: mostra a quantidade e os itens sem resposta. Segundo clique: pergunta se deseja avançar mesmo assim, explicando que essas informações ajudam a conhecer a criança e planejar as estratégias. Cancelar mantém a etapa e o texto. Perguntas já respondidas com “não sei” ou “prefiro não informar” não geram esse aviso. Uma opção descritiva marcada sem texto é considerada pendente.

A revisão final identifica os campos em branco e usa o mesmo aviso/confirmação antes de Enviar. Identificação do respondente e ciência continuam necessárias. Os campos pulados são gravados explicitamente como null, sem inventar uma alternativa; aparecem como “Sem resposta” na consulta e na exportação. As nove áreas continuam sendo salvas atomicamente, com todas as chaves previstas e os limites de conteúdo anteriores.

É necessário atualizar as regras do Cloud Firestore do projeto salamulti usando o arquivo completo producao/salamulti.rules desta etapa: a única alteração nas permissões desde a etapa 36 é aceitar null como ausência de resposta nos itens v2. Sem isso, o envio parcial será negado. O modelo v1 e as demais funções mantêm suas regras anteriores.

## Exportar o questionário da família

No botão Exportar Documentos, passa a existir “Questionário da família”, na mesma sequência documento → formato DOCX/ODT → aluno(s) → conferência → geração.

Usa respostas já enviadas, no projeto salamulti e com o UID do Diário. Exportar somente Questionário da família e/ou PEI não abre login no outro projeto; PAEE, Diagnóstica e Relatório mantêm sua autenticação separada. Há download individual por padrão, inclusive para vários alunos, e ZIP opcional, como antes.

Quando há mais de uma resposta do aluno, a conferência exige escolher a desejada, com data, responsável e identificador. Não associa por nome. Consulta novamente o aluno e a resposta no servidor antes de gerar, valida proprietário e vínculo, e lê as nove áreas de v2. Campos ausentes por corrupção de estrutura não são tratados como campos pulados: o envio parcial válido usa null explícito. Sem resposta recebida, informa a ausência e não gera um formulário vazio.

O documento contém identificação do aluno, escola/turma, período, nome/vínculo do respondente, data, perguntas, respostas e observações. O texto é escapado, preservando quebras de linha sem interpretar HTML digitado pela família. Modelos antigos v1 saem com seu conteúdo original; não são convertidos nas novas perguntas. É documento de consulta, sem transformar nome do respondente em assinatura ou alterar a Diagnóstica.

Usa o gerador existente SRMExport para A4, Arial 12, margens e borda de página compartilhadas. O novo gerador questionario-familia-exportar.html não inicializa Firebase nem faz leituras, gravações ou chamadas de IA. Recebe somente o conteúdo validado pelo coordenador, sem objetos Timestamp/métodos, através do canal de geração já existente.

## Planner do dia

Adiciona um quadro de leitura em Meu dia, abaixo da agenda. Usa a Data do encontro selecionada e o turno da sessão, incluindo dias sem alunos na agenda. Consulta o mesmo documento mensal e a mesma chave de dia utilizados pelo Planner atual: plannerMensal/{uid}_{YYYY-MM}_{turno}, dias.{dia}. Não mistura turnos nem inclui notas de outro professor.

Mostra o texto salvo com quebras de linha preservadas, mensagem específica quando não há anotação e botão Atualizar planner do dia. Não copia rascunhos nem altera o Planner; a edição permanece na aba Planner. As revisões de metas continuam com a data de hoje.

Cache somente em memória, de até 12 meses por contexto, para evitar uma nova leitura ao mudar entre dias do mesmo mês. Releitura após atualização manual ou confirmação de salvamento no Planner. Resultados atrasados após troca de data, conta ou turno são ignorados; a saída da sessão limpa a área. Falha não mantém texto de outra data nem se apresenta como ausência de anotação. Não há novas regras ou índices específicos para esse quadro.

## Verificação

- Modelo do questionário: rótulo, correspondência dos 54 itens, pendências e normalização sem substituir “não sei”.
- Chromium com dados fictícios e rede externa bloqueada: aviso/confirmar/cancelar, preservar o texto, envio parcial, confirmação perdida, consulta de versões antigas, permissões de contexto, login separado e navegação móvel.
- DOCX/ODT reais do questionário, versões v1/v2, escolha de resposta, texto escapado, questão em branco, turno e zero gravações na exportação.
- Emulador Firestore: envios com todas as respostas null, campos obrigatórios da estrutura, limites, proprietário, revogação, imutabilidade e bloqueio de reenvio.
- Planner: data, mês, turno/conta, falha, cache, atualização após salvar com a aba Planner aberta, texto seguro, celular e logout durante leitura pendente.
- Regressões: exportação anterior individual/ZIP, renderizadores de PEI/PAEE/Diagnóstica/Relatório, frequência e Meu dia. O teste antigo de Meu dia agora confere especificamente as leituras de metas; leituras de frequência e planner na troca da data são esperadas.

Nenhuma regra foi publicada no Firebase, nenhum dado real foi consultado e o site oficial não foi alterado automaticamente. Publicar manualmente as regras de salamulti e depois o pacote Netlify desta etapa; não alterar paee-3fea6, Storage ou Realtime Database.
