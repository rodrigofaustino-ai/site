# Etapa 34 — Assinaturas do PEI e do Relatório

Correção sobre o pacote da etapa 33, mantendo todas as melhorias anteriores. Nenhuma publicação remota ou alteração de dados foi realizada nesta preparação.

## PEI

O gerador estruturado passa a usar bloco de assinaturas sem bordas: professor(a) regente e apoio lado a lado; coordenação centralizada abaixo. Cada assinatura recebe quatro parágrafos vazios com altura de uma linha simples antes da linha manuscrita, seguidos do nome e cargo centralizados. Nomes longos podem quebrar linha centralizados. Linhas/cargos/nomes não usam justificação do corpo.

PEIs importados com os três cargos e campos Nome reconhecíveis no final recebem a mesma organização somente na preparação da exportação. O corpo anterior é preservado. A identificação exige os três papéis e nomes claramente delimitados; formatos legados diferentes não são reescritos por aproximação. Nada é gravado no banco por exportar. Novas gravações de PEI usam o novo HTML de assinatura; o histórico existente permanece preservado.

## Relatório

Linha de assinatura existe sempre para professor SRM e coordenação, mesmo quando os nomes estão preenchidos. Nome, cargo e linha centralizados; quatro linhas simples de espaço em cada bloco. Removidos quadro de tabela, bordas de células e divisor antes da localidade/data. A borda geral da página permanece.

O campo único Nome da coordenação pedagógica — assinatura fica na seção Identificação e usa a mesma propriedade assinaturas.nomeCoordenador já existente, preservando valores anteriores. A seção de assinaturas informa onde preencher esse nome. Cargo da coordenação continua editável nas assinaturas. Se faltar o nome específico da assinatura do professor, usa o professor SRM informado na identificação.

Para a exportação em lote usar o nome novo da coordenação, preencher e salvar o Relatório antes. A exportação individual continua permitindo gerar com o conteúdo atual do formulário.

## Formatos e paginação

DOCX: tabelas de assinaturas com todas as bordas explicitamente none; quatro parágrafos espaçadores de 12 pt; linha, nome e cargo centralizados. Linhas de tabela sem divisão entre páginas e parágrafos com keep-next/keep-lines. Texto usa espaçamento simples automático para não cortar acentos ou nomes longos; os espaços reservados têm altura fixa.

ODT: estilos exclusivos de assinatura, sem borda, centralizados, com quatro espaços de linha por assinatura e colunas equivalentes. No Relatório, o bloco convertido via DOCX é substituído pelo HTML especializado somente para assinaturas, para não perder espaços/alinhamentos na conversão. Os demais exportadores não recebem essa opção.

Os mesmos geradores são usados na exportação individual e em lote. Sem novas regras, campos de banco incompatíveis, serviços externos ou migração.

## Verificação local

- 55 verificações de PEI estruturado/importado e Relatório, DOCX e ODT reais: nomes e corpo preservados, três/duas assinaturas, quatro espaços antes de cada linha, centralização, bordas none e não divisão de linhas; nome da coordenação no campo de identificação e no DOCX exportado pelo botão do formulário.
- 10 arquivos reais gerados pelos renderizadores em lote, incluindo PEI importado/comprimido, sem Firebase inicializado na moldura.
- 10 downloads individuais existentes e formulários em 390/320 px.
- Configuração oficial e sintaxe verificadas.

Testes usam dados fictícios e bloqueiam serviços externos. A estrutura interna dos arquivos foi conferida; a renderização final também depende da versão do Word/LibreOffice e deve ser conferida após a publicação com os documentos reais.
