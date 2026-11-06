# Etapa 42 — Imagens nos avisos e mensagens

Imagem opcional nos dois formulários administrativos. Título obrigatório; conteúdo pode ser texto, imagem ou ambos. Um arquivo JPG, PNG, GIF ou WEBP de até 10 MB, com prévia local e Remover imagem antes da publicação. A validação confere extensão, assinatura e decodificação; outros anexos e SVG não são aceitos. Mensagens já publicadas sem imagem continuam válidas.

O popup carrega a imagem automaticamente por requisição autenticada ao Firebase Storage. Não grava URLs públicas nem usa getDownloadURL. A imagem se adapta ao celular, mantém proporção e recebe descrição baseada no título. Se houver falha, oferece Tentar carregar imagem novamente; isso não confirma a leitura. Entendi e Fechar continuam com a semântica da etapa 41. O fechamento libera a imagem em memória; logout também cancela leituras, uploads e resultados antigos.

A publicação aguarda o upload. Falhas preservam o formulário e a seleção. Uma tentativa repetida reutiliza o ID e reconhece upload já confirmado, inclusive por consulta a metadados. O formulário bloqueia alterações durante o envio. Arquivos privados de tentativas abandonadas podem permanecer no Storage; não há exclusão automática de uploads incertos, pois uma confirmação pode ter sido perdida após o documento ter sido gravado.

Firestore aceita apenas os metadados nome, tipo, tamanho e caminho do objeto, além dos campos existentes. Apenas a conta `rodrigofaustino@gmail.com`, UID `xF20nknLCsZxk0giHFso8NqV8KH3`, pode publicar ou enviar essas imagens. O caminho é `comunicadosImagens/{uid}/{comunicadoId}/imagem`. O Storage permite consulta privada antes de publicar somente à conta administradora; os demais usuários autenticados acessam apenas imagens com comunicado ativo e metadados correspondentes. Uploads não substituem a imagem de um comunicado já publicado. Desativar bloqueia novas leituras pelo servidor; não apaga o arquivo armazenado nem desfaz algo já visualizado. Armazenamento e tráfego usam o bucket existente.

## Publicação manual

1. Guarde as regras atuais de salamulti (Firestore e Storage).
2. Publique o conteúdo completo de `producao/salamulti.rules` em salamulti → Firestore Database → Regras.
3. Publique `producao/salamulti-storage.rules` em salamulti → Storage → bucket salamulti.firebasestorage.app → Regras. O arquivo mantém as regras dos planos de aula e do chat. Se houver solicitação nativa de acesso ao Firestore pelas regras do Storage, conclua essa autorização.
4. Extraia o ZIP completo da etapa 42 e envie ao Netlify a pasta que contém index.html. Aguarde Published; atualize com Ctrl + Shift + R.
5. Com a conta administradora, publique uma mensagem com imagem fictícia e um aviso com texto e imagem. Em outra conta, selecione o turno e confira imagem, ordem dos popups, Entendi/Fechar e não repetição após concluir. Confira também o chat e um plano de aula.

Não altera Realtime Database ou paee-3fea6. Não requer outro bucket. Nenhuma regra ou deploy de produção foi aplicado pelo assistente.

## Verificação local

- `verificar-comunicados-navegador.cjs`: publicação e recibos da etapa 41, PNG de 640×360 e GIF, prévia, remoção, recusa de SVG, envio sem texto, falhas de upload/publicação/leitura, repetição sem novo upload, imagem no celular e descarte ao fechar/sair. Firebase simulado e dados fictícios.
- `verificar-comunicados-imagens-regras.cjs`: Firestore e Storage nos emuladores; exclusividade da conta, uploads privados, formatos/tamanho, metadados, publicação, não substituição e desativação.
- Regressões: regras da etapa 41, anexos do chat/planos de aula e configuração oficial/carregamento/sintaxe.
