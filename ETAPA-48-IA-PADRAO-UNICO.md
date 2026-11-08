# Etapa 48 — Padrão único para melhorar textos com IA

A etapa 46 corrigiu o mecanismo compartilhado de notas, planner e demais campos, mas o relato principal do Diário e o PEI ainda usavam solicitações e laços de repetição próprios. O usuário solicitou que o padrão fosse aplicado a todas as áreas.

Agora `IACamposModelo.revisar` centraliza a execução de toda melhoria de redação:

- Mesma instrução de reformular a escrita, preservando fatos, significado, intenção e tom, sem inventar informações.
- Mesmo contrato de mensagens de sistema/usuário e mesmo serviço/modelo padrão já utilizado no site.
- Mesma extração e limpeza da resposta e detecção de cópias, inclusive rótulos, aspas, caixa e pontuação.
- No máximo duas solicitações. A segunda inclui a resposta anterior do assistente e o pedido de outra construção.
- Resposta vazia/inválida e repetição não viram sugestão aplicável nem texto gerado localmente.
- O contexto é conferido antes e depois das chamadas; não há segunda solicitação se o campo/sessão já mudou.

O controle compartilhado, o relato e o PEI chamam essa mesma função. As rotinas antigas dos botões de PAEE, Relatório, observações gerais da Diagnóstica e observações clínicas do Diário agora delegam explicitamente ao controle compartilhado; não têm um prompt ou substituição automática alternativos. A revisão pode ser aplicada somente pela ação do professor, com os limites do campo verificados.

Preserva as telas e controles já existentes do relato e do PEI, incluindo a prévia e o salvamento pelo professor. Os demais campos continuam com a janela comum de revisão. A identidade das seis páginas dos professores é declarada no HTML, para que a cobertura não dependa de a URL estar com ou sem `.html` no Netlify.

Nomes, dados pessoais, assinaturas, códigos e demais controles excluídos na etapa 45 continuam excluídos. O questionário das famílias continua sem IA, conforme a escolha do usuário. Consultas específicas de classificação CID não são ferramentas de reescrita e não foram convertidas em revisão textual.

## Validação local

- `verificar-ia-mecanismo.cjs`: função única, formato das mensagens, contexto da segunda rodada, repetição, parsing, indisponibilidade, vazio e cancelamento por contexto.
- `verificar-ia-campos.cjs`: cobertura dos campos e exclusões, formulários em URLs sem `.html`, planner/notas, confirmação, limites, preservação do original, logout e celular.
- `verificar-pei-formulario.cjs`: resposta/repetição no mecanismo comum sem alterar a experiência de prévia/salvamento do PEI, troca de sessão e DOCX/ODT.
- `verificar-registro-tradicional-navegador.cjs`: relato usando mensagens estruturadas, cópia seguida de nova redação, duas cópias rejeitadas, aplicação explícita e descarte de resposta antiga.
- Regressões de configuração, renderizadores e formatação do histórico preservam as melhorias e quantidades da etapa 47.

Usa IA e Firebase simulados, sem acessar a conta real do serviço. A unificação padroniza o comportamento do aplicativo e as solicitações; não garante uma resposta específica do modelo externo.

## Publicação manual

Não muda regras de Firebase. Extraia o pacote completo da etapa 48 e publique no Netlify a pasta que contém index.html. Aguarde Published e atualize com Ctrl + Shift + R. Confira uma revisão no relato, no PEI e no planner/notas com o serviço real.

O padrão é compartilhado por todas as áreas desse pacote. Outros sites/deploys independentes só recebem a versão ao serem atualizados, com a configuração de dados apropriada a cada ambiente. O assistente não alterou um deploy em produção.
