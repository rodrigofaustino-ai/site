# Primeira etapa visual: ficha do aluno

Branch cumulativa: `melhorias/etapa-14-visual-ficha`.

Estilo em `ficha-visual.css`, carregado após os componentes existentes. Regras
limitadas a `#screen-profile`; o fundo neutro só aparece quando essa tela está
ativa, por seletor CSS `:has()`, disponível nos navegadores atuais.

- Fundo cinza claro, cartões brancos, verde profundo e textos em grafite.
- Cabeçalho com nome do aluno em destaque, sem degradê ou formas decorativas.
- Redução das sombras e retirada das faixas multicoloridas da ficha.
- Campos com bordas visíveis, fonte de 16 px e foco de teclado destacado.
- Botões principais verdes e secundários com borda, áreas de toque de 44 px.
- Textos de edição e relatos alinhados à esquerda.
- Espaçamento e títulos adaptados a telas pequenas.
- Preservadas as cores de identificação dos documentos e os emojis existentes;
  a substituição geral por ícones fica para uma etapa própria.

Não altera dados, funções, regras Firebase, conteúdo ou formatação dos documentos
PEI/PAEE/Diagnóstica/Relatório. Estilos não entram nos documentos exportados nem
na visualização isolada do PEI. Tela inicial e frequência mantêm a aparência
anterior nesta primeira etapa.

Validação: 58 verificações existentes do registro tradicional/assistido e da
consulta do histórico no Chromium, com Firebase/IA simulados, dados fictícios e
pedidos externos bloqueados; inclui larguras de 390 e 320 px. Captura da ficha
no computador inspecionada visualmente. Conferência pelo usuário pendente da
publicação futura no Netlify de teste. Não publicado automaticamente.

O pacote inclui todas as melhorias acumuladas até a etapa 13. Ao publicar,
incluir o novo `ficha-visual.css`. Nenhuma mudança Firebase necessária.
