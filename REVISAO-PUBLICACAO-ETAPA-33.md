# Revisão para publicação — 5 de novembro de 2026

17 suítes locais passaram, com dados fictícios e serviços reais bloqueados nos testes de navegador. As regras dos dois projetos e a URL de presença não mudaram desde a etapa 26. Nenhuma implantação remota foi feita.

Inclui estatísticas/pizzas, arquivamento reversível, Meu dia, próximo passo, exportação por aluno/documento/formato com downloads individuais por padrão e associação automática de documento legado único pelo nome.

O pacote de publicação contém somente HTML/JS/CSS, vendor e modelos necessários. Ferramentas de backup, configuração de teste, regras e testes de desenvolvimento não integram o site a publicar. PUBLICACAO.json registra o commit de fonte e hashes; o ZIP é verificado após ser escrito.

A transferência administrativa continua bloqueada. A associação automática grava somente alunoId no primeiro acesso a um documento legado único. Os testes não substituem a conferência em duas contas após publicar nem verificam configuração remota/credenciais/IA reais. O pacote não é backup do banco de dados.

## Testes executados

- verificar-firebase-producao.cjs — passou.
- verificar-vinculo-aluno.cjs — passou.
- verificar-associacao-automatica.cjs — passou.
- verificar-navegador.cjs — passou.
- verificar-exportacao-lote-modelo.cjs — passou.
- verificar-exportacao-lote-renderizadores.cjs — passou.
- verificar-exportacao-lote-navegador.cjs — passou.
- verificar-downloads-individuais.cjs — passou.
- verificar-estatisticas-modelo.cjs — passou.
- verificar-estatisticas-navegador.cjs — passou.
- verificar-agenda-dia.cjs — passou.
- verificar-arquivamento-navegador.cjs — passou.
- verificar-meu-dia-modelo.cjs — passou.
- verificar-meu-dia-navegador.cjs — passou.
- verificar-proximo-passo-modelo.cjs — passou.
- verificar-proximo-passo-navegador.cjs — passou.
- verificar-registro-tradicional-navegador.cjs — passou.
