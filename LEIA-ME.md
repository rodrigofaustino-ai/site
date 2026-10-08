# Site SRM — exportações DOCX e ODT

## Publicar no Netlify

1. Abra o repositório no GitHub e selecione a branch `feat/exportacoes-pdf-docx-odt`.
2. Clique em **Code → Download ZIP** e extraia o arquivo.
3. No Netlify, selecione seu site existente e abra **Deploys**.
4. Arraste a pasta que contém `index.html`, os outros HTMLs, `exportacao.js` e a pasta `vendor` para a área de publicação manual.
5. Aguarde **Published**, abra o site e atualize a página.

Envie a pasta inteira; as bibliotecas locais são necessárias. O nome `index.html` já está correto para a página inicial. Se preferir publicar pela integração GitHub, use esta branch e a raiz do repositório como pasta publicada, sem comando de build. Não há Functions, servidor de conversão, Docker nem variáveis de conversão a configurar.

## Como usar

- Diagnóstica, PAEE e Relatório: abra o formulário e escolha **Exportar DOCX** ou **Exportar ODT**.
- Frequência: clique em **Exportar frequência**, informe o intervalo e escolha **Gerar DOCX** ou **Gerar ODT**.
- PEI: abra **Ver PEI** e escolha **Exportar DOCX** ou **Exportar ODT**.

As exportações usam o conteúdo atual do formulário, sem exigir salvamento prévio. Os botões DOCX dos cartões de registros salvos continuam funcionando. Ambos os formatos são gerados no navegador, sem enviar documentos a um serviço de conversão.

Para criar o PDF depois, abra o documento no Word ou no LibreOffice e use **Arquivo → Exportar/Salvar como → PDF**. Os nomes dos menus podem variar conforme o aplicativo.

O DOCX do PEI usa A4, Arial 12, todos os textos justificados, margens de 1,5 cm e borda preta de página, seguindo o padrão do PAEE/Relatório (a Diagnóstica usa Arial 11). O DOCX dos demais módulos preserva o modelo de exportação existente, com larguras de tabela explícitas para maior compatibilidade. O ODT é editável e preserva texto, tabelas e imagens incorporadas, mas pode apresentar diferenças de formatação em relação ao DOCX. Confira o resultado antes de entregar documentos oficiais.

No PEI, DOCX e ODT são exportados como texto em parágrafos, sem tabelas, lendo o conteúdo das células na ordem das linhas. O negrito original é removido e reaplicado somente aos títulos, objetivos, rótulos e campos de assinatura indicados pelo usuário; valores preenchidos permanecem em texto normal. Os arquivos são reconstruídos a partir do HTML armazenado. Formatação perdida na importação original do PEI não pode ser recuperada a partir desse HTML.

## Arquitetura

Cada página contém seus estilos, formulário e lógica. Firebase Authentication e Firestore mantêm autenticação e dados: o diário usa `salamulti`, e os formulários usam `paee-3fea6`. Essas configurações foram preservadas. IA Puter continua sendo um recurso externo opcional. O arquivo `exportacao.js` centraliza DOCX/ODT; a pasta `vendor` fornece as bibliotecas locais e suas licenças.

## Desenvolvimento e validação

Para servir o site localmente:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Os testes usam somente dados fictícios; não fazem login real nem alteram o Firebase. Eles verificam dez documentos (dois formatos para cada módulo), estrutura DOCX/ODT, conteúdo e downloads reais no Chromium. As dependências de teste são instaladas fora do site:

```sh
npm install --prefix /tmp/site-validation --cache /tmp/npm-cache --no-audit --no-fund jsdom@30.1.2 acorn@8.19.0 jszip@3.10.2 docx@8.5.0 mammoth@1.6.0 playwright-core@1.64.0
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-exportacoes.cjs
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-navegador.cjs
```

O teste de navegador requer Chromium; use `CHROMIUM_BIN` se ele não estiver em `/usr/bin/chromium`. Os arquivos fictícios gerados ficam em `/tmp/site-results`. Essas dependências são somente para validação e não são necessárias para publicar a pasta no Netlify.
