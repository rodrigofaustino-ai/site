# Orientações fora dos campos

No PEI, foi mantida a opção “Orientação de preenchimento do modelo” e removido
o texto repetido de dentro das caixas de resposta. As orientações completas
continuam disponíveis mesmo depois de preencher o campo.

PAEE, Diagnóstica e Relatório seguem o mesmo padrão: instruções e exemplos que
estavam nos campos agora aparecem em opções de abrir e fechar junto a eles.
O tratamento também cobre linhas e seções recriadas dinamicamente. Os campos
de busca e a indicação de quantidade “___” permanecem como antes.

As orientações são elementos de consulta; não preenchem campos, não alteram as
respostas e não provocam gravações. Também ficam ocultas na impressão direta.
As exportações continuam baseadas nas respostas e no modelo de cada documento.

Esta versão permanece conectada somente a `ambienteteste-e368e`. Não há mudança
nas regras do Firebase, migração de dados ou nova funcionalidade de colaboração.
Os arquivos de preparação local `colaboracao-modelo.js` e `colaboracao.css` não
fazem parte desta entrega e não são carregados pelo site.

## Como atualizar

Selecionar no GitHub a branch `melhorias/etapa-07-orientacoes`, baixar em
Code → Download ZIP, extrair e enviar ao Netlify de teste a pasta que contém
`index.html`, `orientacoes-preenchimento.js`, `orientacoes-preenchimento.css`
e `vendor/`. Atualizar o navegador com Ctrl+Shift+R após a implantação.
Não implantar esta cópia no site oficial. A publicação pode ser agrupada com
outras melhorias para economizar a cota do Netlify.

## Validação

- PEI: 104 verificações, incluindo orientações sem placeholder, gravação,
  histórico, formatação e exportações DOCX/ODT.
- Formulários: 58 verificações de vínculo, gravação e consulta das orientações
  sem modificar respostas nem salvar automaticamente.
- Isolamento do Firebase de teste e carregamento: 73 verificações.
- Exportações dos formulários e visualização antiga do PEI conferidas no Chromium.

Todos os testes bloquearam requisições externas. O Firebase foi simulado onde
necessário; nenhuma gravação foi feita nos projetos do usuário. Não houve
implantação no Netlify ou alteração em `main` por este trabalho.
