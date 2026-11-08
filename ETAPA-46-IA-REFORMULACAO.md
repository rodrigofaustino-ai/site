# Etapa 46 — IA repetindo o texto em notas e planner

O usuário informou que isso acontece nas notas e no planner, que usam o controle compartilhado de IA. Não forneceu uma frase de exemplo; não foi acessada a sessão real de IA do usuário.

A inspeção identificou dois pontos verificáveis do cliente: a comparação anterior aceitava mudanças somente de pontuação/maiúsculas como texto novo; e a janela mostrava o original imediatamente, antes de a resposta chegar, o que podia ser confundido com sugestão. Esses pontos não demonstram por si só por que o serviço externo repetiu o conteúdo na sessão do usuário.

## Correções

- Instrução explícita para oferecer outra redação: reorganizar frases, conectar ideias, reduzir repetições e desenvolver apenas o que já foi relatado, sem acrescentar fatos. Preserva a intenção e o tom do texto.
- Envia mensagens separadas de sistema e usuário. Na segunda tentativa, inclui como mensagem do assistente a resposta que acabou de repetir o texto, seguida do pedido de outra construção. Não é apenas o mesmo prompt acrescido de um lembrete sem a resposta anterior.
- Mantém o modelo padrão e o serviço Puter existentes, sem nova chave ou seleção de modelo. No máximo duas solicitações, como antes. O formato `chat(ChatMessage[])` foi conferido na distribuição oficial `@heyputer/puter.js` 2.6.5, nos tipos e na implementação de `src/modules/ai/chat.js`. Não foi ativado testMode no produto.
- Remove rótulos de resposta, aspas externas e cercas de formatação antes de comparar/exibir. Cópias que só alteram caixa, espaços ou pontuação não são aceitas como reformulação. Se repetir nas duas rodadas, a área de sugestão fica vazia, Aplicar permanece bloqueado e há uma mensagem clara de que não houve nova redação. Não cria um texto local fingindo ser resposta da IA.
- O original fica recolhido em Ver texto original para comparar, com descrição acessível. A área Nova redação sugerida pela IA fica separada e recebe foco quando uma resposta nova chega.

Aplica-se ao controle compartilhado, incluindo notas e planner e os demais campos que usam esse controle. Preserva limites de caracteres/palavras, revisão antes de aplicar, contexto/conta, descarte de respostas antigas e eventos normais de salvamento. O relato principal e o PEI conservam seus controles específicos, pois não foram os campos informados nesta ocorrência.

## Validação

Testes do modelo e navegador usam respostas simuladas de IA, não respostas reais de uma conta Puter. Incluem cópia na primeira rodada seguida de redação alternativa, cópia nas duas, falso texto novo com título/pontuação, contrato de mensagens da segunda rodada, manutenção do original, aplicação explícita, limites, contexto, logout, planner/notas e celular. A distribuição pública do SDK confirma o contrato da chamada; não confirma a qualidade/disponibilidade do serviço na conta do usuário.

Após a publicação, é necessário testar um texto em uma nota e em um dia do planner para conferir o comportamento real. A melhoria da solicitação aumenta a orientação para reformulação, mas não garante que um serviço externo sempre proponha uma nova redação.

## Publicação

Pacote completo da etapa 46 no Netlify. Extraia e envie a pasta que contém index.html. Aguarde Published, atualize com Ctrl + Shift + R e solicite uma nova revisão. Não muda regras de Firebase ou dados salvos; não foi executado deploy de produção pelo assistente. Melhorias anteriores permanecem incluídas.
