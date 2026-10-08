# Site SRM — exportações PDF, DOCX e ODT

## Como usar

Publique os cinco HTMLs junto com `exportacao.js` e toda a pasta `vendor`, mantendo os nomes e as pastas. Abra `index.html` no site publicado. Não basta substituir apenas os HTMLs: as bibliotecas locais são necessárias.

- Diagnóstica, PAEE e Relatório: abra o formulário do aluno e escolha Exportar DOCX, PDF ou ODT.
- Frequência: clique em Exportar frequência, informe o intervalo e escolha Gerar DOCX, PDF ou ODT.
- PEI: abra Ver PEI e escolha um dos três botões no visualizador.

As exportações usam o conteúdo atual do formulário; não é preciso salvar previamente para exportar. Os botões DOCX dos cartões de registros salvos continuam funcionando.

Para desenvolver localmente, execute em `/workspace/site`:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

## Arquitetura

Cada página contém seu formulário, estilos e lógica. Firebase Authentication e Firestore fornecem autenticação e armazenamento. O diário usa o projeto `salamulti`, e os formulários usam `paee-3fea6`. As configurações existentes foram preservadas. O arquivo administrativo teve somente os endereços das bibliotecas substituídos pelas cópias locais.

`exportacao.js` reúne as novas exportações. Para os formulários e a frequência, o DOCX existente é gerado normalmente; Mammoth extrai o conteúdo para produzir PDF com pdfmake e ODT com JSZip. O DOCX original continua sendo baixado sem essa conversão. No PEI, os três formatos são reconstruídos a partir do HTML armazenado.

As conversões são locais: o conteúdo dos documentos não é enviado a um serviço de conversão. A aplicação continua acessando Firebase para sua operação normal; IA Puter é um recurso externo opcional, preservado.

PDF possui texto selecionável; ODT é um pacote OpenDocument editável. Tabelas, acentos, texto e imagens incorporadas PNG/JPEG/GIF são tratados. Imagens externas não incorporadas são substituídas por texto alternativo. A conversão não preserva todos os detalhes de margens, bordas, cabeçalhos, rodapés, listas, fontes e paginação do DOCX. O PDF de frequência usa A4 paisagem. O PEI já era armazenado como HTML; detalhes perdidos na importação original não podem ser recuperados. Confira a apresentação antes de entregar documentos oficiais.

## Validação realizada

- Sintaxe dos scripts dos cinco HTMLs e do exportador.
- Geração de 15 arquivos: DOCX/PDF/ODT para Diagnóstica, PAEE, Relatório, Frequência e PEI, com dados fictícios.
- Verificação das assinaturas dos PDFs, estrutura interna DOCX/ODT, tabelas e conteúdo textual nos documentos editáveis.
- Downloads dos três formatos dos formulários e do PEI no Chromium, usando bibliotecas reais.
- Abertura das cinco páginas no Chromium, sem erros de execução JavaScript.
- Abertura e conversão de ODT da Diagnóstica, PAEE e Relatório no LibreOffice.
- Entrega HTTP dos arquivos pelo servidor local.

Login, permissões e dados reais do Firebase, IA Puter e restauração em uma nova tarefa não foram validados. Não foram feitas alterações nos dados da nuvem nem uma publicação do site.

O teste reutilizável está em `validacao/verificar-exportacoes.cjs`. Suas dependências são somente para teste, fora do site:

```sh
npm install --prefix /tmp/site-validation --cache /tmp/npm-cache --no-audit --no-fund jsdom acorn jszip docx@8.5.0 mammoth@1.6.0 pdfmake@0.2.20 html-to-pdfmake@2.5.31
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-exportacoes.cjs
```

Os arquivos de teste gerados são salvos em `/tmp/site-results` e contêm somente dados fictícios.

As bibliotecas em `vendor` foram obtidas por npm com verificação de integridade. As versões Firebase 9.23.0 e 10.12.2 foram mantidas por página. Outras versões: docx 8.5.0, Mammoth 1.6.0, JSZip 3.10.1, pdfmake 0.2.20, html-to-pdfmake 2.5.31, jsPDF 2.5.1, AutoTable 3.8.2 e LZ-String 1.4.4. Licenças disponíveis estão na pasta `vendor` e nos cabeçalhos das bibliotecas.
