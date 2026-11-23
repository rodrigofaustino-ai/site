# Etapa 83 — Trechos frequentes

Botão pequeno junto à IA e nos campos de texto compatíveis, incluindo dados de identificação. Cadastro privado por professor, com título/conteúdo, busca, edição, exclusão confirmada e inserção na seleção/cursor. Não aciona gravação do documento. Os textos inseridos são cópias independentes.

A janela de mesma origem autentica no projeto salamulti, conferindo e-mail com a página de origem. Assim, os formulários do projeto paee-3fea6 usam a biblioteca do Diário sem misturar UIDs entre projetos. Mensagens conferem origem, janela e token. Troca de conta, aluno, documento, turno ou mudança do campo bloqueia a inserção. Não envia o texto do campo à janela.

Firestore: bibliotecaTrechos/{uid}/itens/{id}, somente dono, campos e tamanhos validados, timestamps de servidor e versão crescente. Transações detectam conflitos e reenvio após confirmação perdida. Regras anteriores preservadas integralmente. Regras publicadas manualmente pelo usuário antes do pacote.

Validação:
- verificar-trechos-integracao.cjs: Chromium, interface real, CRUD, falha com preenchimento preservado, busca, cursor/seleção, limites, celular, conta diferente e mudança de contexto; Diário e quatro formulários, inclusive UIDs diferentes entre projetos.
- verificar-trechos-servico.cjs: falhas antes/depois da gravação, reenvio sem duplicação, conflito de edição/exclusão e sessão.
- verificar-trechos-regras.cjs: emulador Firestore com regras completas; leitura/escrita privadas, validação e versões (10 verificações).
- verificar-ia-campos.cjs: 63 verificações existentes; seletores da IA explicitados para não selecionar também o novo botão.
- verificar-cgm-alunos.cjs: salvamento geral, CGM manual e layout responsivo.
- verificar-firebase-producao.cjs: configuração, referências e sintaxe do pacote.

Sem mudança nos renderizadores de exportação, permissões de outras coleções, Storage ou notificações do chat.
