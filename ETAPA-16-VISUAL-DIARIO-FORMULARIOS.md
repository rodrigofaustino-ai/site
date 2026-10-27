# Identidade visual do Diário e dos formulários

Branch cumulativa: `melhorias/etapa-16-visual-diario-formularios`.
Inclui todas as etapas anteriores. Não publicada automaticamente no Netlify.

## Interface

`diario-visual.css` aproxima entrada, seleção de turno, lista de alunos,
navegação, grade, notas, planner e cartões das outras abas do padrão aprovado:
fundo neutro, verde profundo, bordas suaves, botões consistentes e foco visível.
As cores que indicam categorias ou situações são preservadas. Os emojis
existentes permanecem; não houve troca geral por uma biblioteca de ícones.

A navegação quebra em linhas no computador e permite rolagem horizontal no
celular. Nos cartões de alunos do celular, as ações ficam abaixo do nome,
com alvos de toque de 44 px, preservando espaço para identificação.

`formularios-visual.css` padroniza cabeçalhos e controles de edição do PAEE,
Diagnóstica, Relatório e PEI: títulos, botões, campos, foco e fundo. Os estilos
são limitados à tela e não modificam estilos de impressão. No PAEE, elementos
da grade passam a respeitar a largura disponível; tabelas largas rolam dentro
da área de preenchimento. Cabeçalhos podem quebrar linha no celular.

## Preservação

Nenhuma mudança em autenticação, armazenamento, salvamento, regras Firebase,
cálculos ou conteúdo dos documentos. O visualizador PEI do Diário foi excluído
das regras de cartões. A visualização isolada do PEI mantém seu estilo próprio;
exportações continuam usando seus modelos anteriores. A página independente
de colaboração conserva seu tema já existente para uma revisão futura.

## Verificações

- Frequência: 70 verificações no Chromium.
- Formulário PEI: 104 verificações, incluindo histórico e exportações.
- Dez downloads DOCX/ODT: PAEE, Diagnóstica, Relatório, PEI e frequência.
- Formulários PAEE/Diagnóstica/Relatório sem transbordamento horizontal da página
  em 390 e 320 px, com os estilos CSS carregados.
- Capturas de entrada, lista, grade e PAEE; lista e PAEE também conferidos em
  390/320 px. Revisão visual das capturas do computador e celular.

Dados fictícios, requisições externas bloqueadas e Firebase simulado nos testes
autenticados. Conferência do usuário no Netlify de teste ainda pendente.

## Pacote para publicação futura

Incluir `diario-visual.css` e `formularios-visual.css`, além dos arquivos das
etapas anteriores; baixar a branch inteira. Não é preciso alterar o Firebase.
Usar somente o site de teste conectado a `ambienteteste-e368e`.
Prévias com dados fictícios na pasta `previas`.
