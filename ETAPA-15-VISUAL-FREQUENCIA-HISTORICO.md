# Visual da frequência e do histórico

Branch cumulativa: `melhorias/etapa-15-visual-frequencia-historico`.
Inclui a ficha visual aprovada e todas as etapas anteriores.

## Frequência

- Verde profundo para a ação principal; exportação e filtros com bordas discretas.
- Fundo neutro, cartões brancos, filtros agrupados e sombras suaves.
- Cabeçalhos claros, dias sem degradês multicoloridos e linhas alternadas.
- Cores mais escuras nas siglas P/F/J/SAP, preservando texto e legendas.
- Nome do aluno fixo ao rolar horizontalmente. No celular, dia e horário rolam
  com a tabela, deixando espaço para o nome e uma semana; no computador,
  as três colunas iniciais mantêm a fixação existente.
- Indicadores em duas colunas no celular para reduzir a extensão da página.
- Botões do menu de marcação com altura mínima de 44 px e foco visível.

## Histórico na ficha

Cartões com borda discreta, data com fundo verde claro, nome do profissional
secundário, relato alinhado à esquerda, metas em etiquetas e filtros padronizados.
Excluir conserva a confirmação existente e recebe nome acessível explícito.

## Limites e validação

Estilos em `frequencia-visual.css`, após `ficha-visual.css`. Não alteram registros,
regras, filtros, cálculos, exportações ou a formatação dos documentos. Aparência
das outras abas permanece para etapa futura; o cabeçalho geral da página inicial
ainda conserva o estilo anterior.

70 verificações da frequência no Chromium, incluindo marcações, concorrência,
falhas, filtros de semanas, DOCX/ODT e confirmação de nome visível durante
rolagem horizontal nas larguras de 390 e 320 px. Mais 58 verificações do registro
assistido e consulta do histórico. Firebase/IA simulados, dados fictícios,
requisições externas bloqueadas. Capturas do computador e celular inspecionadas.

Prévia em `previas/frequencia-novo-visual.png`,
`previas/frequencia-celular.png` e `previas/historico-novo-visual.png`.
Preparado para avaliação do usuário; não publicado no Netlify.
Baixar o pacote completo desta branch ao publicar no site de teste e incluir
`frequencia-visual.css`. Nenhuma alteração no Firebase necessária.
