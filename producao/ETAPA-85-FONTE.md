# Etapa 85 — tamanho de fonte na tela (prévia)

Controles A−, percentual, A+ e Padrão no canto superior direito, ao lado de Conteúdos compartilhados comigo no Diário. Também disponíveis nas páginas principais dos quatro formulários, colaboração e manual. Variação de 85% a 130%, em passos de 5%; padrão 100%. Preferência somente neste navegador (localStorage), compartilhada entre abas da mesma origem. Falha de armazenamento permite continuar usando o ajuste na sessão.

Textos e controles usam tamanhos relativos à preferência visual. Menus flexíveis mudam de linha; a largura do menu de alunos e o mínimo dos cartões acompanham o ajuste no computador. Não recria telas nem grava dados de alunos.

## Preservação dos documentos

- Nenhum renderizador de exportação foi alterado.
- A janela de geração em lote (`SRMExportacaoWorker`) não executa o ajuste.
- Impressão usa fator 1 e oculta a barra; transições são desativadas na impressão para não capturar tamanho intermediário.
- Conteúdos de documentos e prévias têm fator 1; estilos inline de PEI legado, prévias dos termos/encaminhamentos e impressão integral do manual não são modificados.
- Verificação real do Relatório DOCX em 100% e 130%: todas as partes Word, fontes, estilos, dimensões e imagens são idênticas, normalizando apenas os nomes aleatórios de mídia gerados pela biblioteca. Metadados de criação do arquivo não fazem parte dessa comparação.
- Páginas JPEG usadas nos PDF/imagens dos sete modelos online são idênticas em 100% e 130%.

## Verificação

`validacao/verificar-visual-fonte.cjs`: Chromium com dados fictícios e Firebase simulado, sem requisições externas. Confere limites, cálculo das fontes, campos dinâmicos sem multiplicação acumulada, reorganização de cartões, persistência após recarregar, impressão padrão, PEI legado sem alteração do HTML, saídas de documentos iguais, celular sem rolagem horizontal e nenhum salvamento cadastral. Capturas em previas/etapa-85.

Configuração/carregamento/sintaxe conferidos pelo verificador existente. Não exige regra Firebase nova. Prévia de interface; pacote Netlify será preparado quando solicitado.
