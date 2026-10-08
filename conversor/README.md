# Publicar o conversor próprio de PDF

O Netlify continua servindo o site. Uma Function valida o login Firebase e encaminha o DOCX ao seu servidor de LibreOffice. A URL e o token desse servidor são variáveis privadas da Function, sem aparecer no navegador. O servidor converte o DOCX original, sem reconstruir seu conteúdo em HTML.

## 1. Hospedar o servidor

Use uma hospedagem que execute Docker, como um servidor Linux próprio ou um Web Service Docker no Render. Configure o serviço para usar este repositório e a branch `feat/exportacoes-pdf-docx-odt`, com o diretório raiz `conversor` e o Dockerfile `Dockerfile`. Use pelo menos 1 GB de RAM; a imagem processa uma conversão por vez. A porta padrão é 8080, ou o valor de `PORT` fornecido pela hospedagem. O health check é `/health`.

Crie um token aleatório com pelo menos 32 caracteres pelo gerenciador de segredos da hospedagem e salve como `DOCX_CONVERTER_TOKEN`. Não envie o token em chats nem o coloque no GitHub. Ele será usado apenas para autenticação entre o Netlify e o conversor.

O serviço deve fornecer um endereço HTTPS. O servidor Python recebe HTTP somente por trás do terminador TLS da hospedagem/reverse proxy. Em servidor próprio, configure HTTPS no proxy e mantenha a porta do Python restrita à rede interna.

Para construir a imagem em um servidor com Docker:

```sh
docker build -t srm-docx-converter conversor
```

Inicie pela interface da hospedagem, injetando o token como variável de ambiente. O processo não inicia se o token estiver ausente/curto ou se o LibreOffice estiver indisponível.

## 2. Configurar o Netlify

Esta versão precisa ser publicada pela integração GitHub do Netlify ou pela CLI que empacote Functions. Arrastar a pasta de HTMLs na publicação manual não instala a Function necessária.

No Netlify, conecte o repositório `rodrigofaustino-ai/site` e selecione a branch `feat/exportacoes-pdf-docx-odt` para um teste/preview. O arquivo `netlify.toml` define a pasta publicada e a pasta das Functions; não há comando de compilação da aplicação. Não é necessário mudar a `main` para testar.

Nas configurações de variáveis de ambiente do Netlify, adicione para execução das Functions:

| Nome | Valor |
| --- | --- |
| `DOCX_CONVERTER_URL` | URL HTTPS da raiz do seu conversor, sem `/convert` no final |
| `DOCX_CONVERTER_TOKEN` | O mesmo token privado configurado no servidor |
| `FIREBASE_PROJECT_IDS` | Opcional: `salamulti,paee-3fea6`, já usado como padrão |

Marque o token como secreto quando a interface permitir. Não crie um arquivo `.env` com esses valores dentro da pasta publicada. Faça um novo deploy após configurar as variáveis.

Confirme que a Function `convert-docx` aparece na seção Functions. Faça login no site e exporte um PDF. As Functions usam certificados públicos do Google para verificar criptograficamente o token Firebase, incluindo assinatura, projeto e expiração; o usuário deve pertencer a um dos dois projetos da aplicação.

## 3. Fontes e comparação com o Word

Os modelos usam **Arial**. A imagem fornece Liberation Sans, Carlito e Caladea como substitutas compatíveis em métricas; elas não são as fontes da Microsoft. Para máxima fidelidade, instale no servidor exatamente as fontes usadas pelos seus documentos, com licença adequada. Num servidor próprio, monte as fontes autorizadas em `/usr/local/share/fonts/custom` antes de iniciar o contêiner e atualize o cache com `fc-cache`. Confira com `fc-match Arial`.

LibreOffice e Microsoft Word são renderizadores diferentes. A conversão direta preserva as definições do DOCX, mas não garante uma cópia pixel a pixel do PDF exportado pelo Word. Compare um documento preenchido nos dois aplicativos antes de declarar igualdade visual. Se a exigência for igualdade absoluta com o Word, a conversão deve ser feita pelo próprio Word, em vez do LibreOffice.

Para PEIs já importados, o site conserva HTML, não o DOCX enviado originalmente. O novo PDF usa o DOCX gerado pelo botão Exportar DOCX do PEI. Formatação perdida na importação antiga não pode ser recuperada a partir do HTML.

## Operação

- DOCX e PDF têm limite de 4 MB por arquivo, para respeitar a resposta binária das Functions.
- A conversão tem limite de 45 segundos. Hospedagens que suspendem serviços ociosos podem precisar de aquecimento antes do primeiro pedido.
- O servidor usa uma pasta temporária e um perfil de LibreOffice exclusivos por pedido e os remove após a conversão, inclusive em falhas. Os documentos não são registrados nos logs.
- O endpoint `/convert` exige o token privado; a Function exige login Firebase. Não exponha um conversor público sem autenticação.
- Recursos externos incorporados por referência são recusados, exceto hyperlinks; imagens devem estar dentro do DOCX.
- Para trocar o servidor, atualize a URL/token no Netlify e faça um novo deploy.

A preparação do código não cria uma conta de hospedagem, não publica o servidor e não configura automaticamente as variáveis no Netlify. Esses passos são necessários para habilitar o botão PDF na sua instalação.
