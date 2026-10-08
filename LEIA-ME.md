# Site SRM — exportações PDF, DOCX e ODT

## Publicação

O site continua no Netlify. Para PDF com a formatação do DOCX, esta versão usa um conversor próprio de LibreOffice e uma Netlify Function. **É necessário hospedar o conversor e configurar o Netlify antes de usar o botão PDF.** Publique pela integração GitHub do Netlify, selecionando a branch `feat/exportacoes-pdf-docx-odt` para testar; arrastar apenas uma pasta de HTMLs não instala a Function.

O passo a passo está em [conversor/README.md](conversor/README.md). O arquivo `netlify.toml` define a pasta do site e das Functions. As credenciais devem ficar nas variáveis privadas da hospedagem, nunca no código ou nos chats.

## Como usar

- Diagnóstica, PAEE e Relatório: abra o formulário e escolha Exportar DOCX, PDF ou ODT.
- Frequência: clique em Exportar frequência, informe o intervalo e escolha o formato.
- PEI: abra Ver PEI e escolha um dos três botões.

As exportações usam o conteúdo atual do formulário, sem exigir salvamento prévio. Os botões DOCX dos cartões de registros salvos continuam funcionando.

## Como o PDF é produzido

O mesmo DOCX que o usuário baixa é enviado à Function `convert-docx`. Ela valida o login Firebase e o encaminha ao seu servidor privado de LibreOffice. O PDF usa o arquivo original, sem passar pela conversão DOCX → HTML e sem reconstruir margens, cores, tabelas ou páginas no navegador. O documento trafega por HTTPS entre o navegador, o Netlify e seu conversor, e os arquivos temporários são removidos no servidor após a conversão.

As grades das tabelas foram corrigidas para registrar as mesmas larguras já previstas pelo modelo: especialmente a coluna de 9 cm da Diagnóstica e as colunas de nomes/semanas da Frequência. Isso evita interpretações diferentes entre Word e LibreOffice.

**LibreOffice e Word podem apresentar diferenças de fontes e paginação.** A imagem Docker usa fontes substitutas; para maior fidelidade, instale as mesmas fontes autorizadas usadas nos documentos, em especial Arial. Igualdade visual absoluta com o PDF exportado pelo Word exige o próprio Word como renderizador. Compare um documento preenchido antes de entregar documentos oficiais.

No PEI, o PDF usa o DOCX gerado pelo botão Exportar DOCX. O site armazena o PEI importado como HTML, portanto detalhes perdidos na importação original não são recuperáveis.

DOCX e ODT continuam sendo gerados localmente no navegador. A exportação ODT mantém o caminho anterior baseado no conteúdo HTML e pode ter diferenças visuais em relação ao DOCX.

## Arquitetura

Cada página contém seu formulário, estilos e lógica. Firebase Authentication e Firestore fornecem autenticação e armazenamento. O diário usa o projeto `salamulti`; os formulários usam `paee-3fea6`. Essas configurações foram preservadas. IA Puter continua sendo um recurso externo opcional.

- `exportacao.js`: downloads DOCX/ODT e envio do DOCX para converter em PDF.
- `netlify/functions/convert-docx.js`: validação criptográfica dos tokens Firebase, conexão com o conversor privado e resposta PDF.
- `conversor/server.py`: serviço Python/LibreOffice, sem dependências Python externas.
- `conversor/Dockerfile`: servidor empacotado para hospedagem Docker.
- `vendor/`: bibliotecas JavaScript locais e suas licenças.

O servidor admite documentos/PDFs de até 4 MB e uma conversão por vez. A conversão tem limite de 45 segundos. Não há fallback para o antigo PDF reconstruído quando o servidor está indisponível; o site informa o erro.

## Desenvolvimento e testes

Para abrir os HTMLs, DOCX e ODT localmente:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Esse servidor estático não executa a Function de PDF. Para validar o PDF, use os testes abaixo com Python 3, LibreOffice e Poppler (`pdfinfo`/`pdftotext`) instalados; ou use uma instalação de teste do Netlify com o conversor configurado.

```sh
npm install --prefix /tmp/site-validation --cache /tmp/npm-cache --no-audit --no-fund jsdom acorn jszip docx@8.5.0 mammoth@1.6.0
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-exportacoes.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-api-pdf.cjs
```

Os testes de exportação e API iniciam um conversor local temporário e passam pelas mesmas funções JavaScript e pela Function, com chaves RSA e tokens exclusivamente de teste. Nenhum documento real é enviado à nuvem. O transporte do DOCX é verificado byte a byte; os PDFs são abertos pelo Poppler, e seu texto e autoria LibreOffice são conferidos. São gerados 15 arquivos com dados fictícios em `/tmp/site-results`.

Para testar a imagem Docker:

```sh
docker build -t srm-docx-converter:validation conversor
SRM_TEST_DOCKER=1 NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-exportacoes.cjs
SRM_TEST_DOCKER=1 NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-api-pdf.cjs
```

Login com uma conta real do Firebase, publicação do conversor, variáveis no Netlify, comparação com Microsoft Word e disponibilidade em produção dependem da configuração da hospedagem. Não foram feitas alterações nos dados do Firebase nem uma publicação do site nesta tarefa.

Para conferir os botões e downloads reais no Chromium, instale `playwright-core` no mesmo diretório de dependências e execute:

```sh
npm install --prefix /tmp/site-validation --cache /tmp/npm-cache --no-audit --no-fund playwright-core
SRM_TEST_DOCKER=1 NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-navegador.cjs
```

Use `CHROMIUM_BIN` se o executável não estiver em `/usr/bin/chromium`. O teste usa as cinco páginas e dados fictícios, bloqueia os serviços externos e passa pela Function real com autenticação RSA de teste e pelo servidor de LibreOffice real.

Um par DOCX/PDF com dados fictícios, produzido pela imagem Docker validada, está em `validacao/exemplos/`. Ele serve para revisar o layout pelo GitHub; essa pasta é bloqueada pelas regras de publicação do site.
