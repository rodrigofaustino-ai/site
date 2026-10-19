# Planos de aula — base de 16/10/2026

Esta versão parte do commit `32d8610`, último de 16/10: chat com pessoas online e leituras, sem metas ou registro rápido. Não inclui os Questionários da Família desenvolvidos em 19/10.

O cadastro e a edição passam a ter apenas:

- **Título:** até 20 palavras.
- **Conteúdo/tema e breve descrição:** até 40 palavras.
- **Arquivo DOCX:** mesmo funcionamento anterior, até 10 MB.

Os contadores avisam quantas palavras foram digitadas. Espaços, tabulações e quebras de linha separam palavras; hífens dentro de uma palavra não a dividem. Ultrapassar o limite bloqueia o salvamento, sem apagar o texto digitado. Colar texto também atualiza a contagem.

## Publicar

1. Guarde uma cópia das regras atuais em **Firebase → salamulti → Firestore Database → Regras**.
2. Se está usando as regras da versão de 16/10, substitua pelo conteúdo completo de `firebase/firestore-com-chat.rules` deste ZIP e clique em **Publicar**. Se fez outras alterações nas regras, substitua apenas o bloco `match /planosAula/{planoId} { ... }` pelo mesmo bloco de `firebase/planos-firestore.rules`. Não publique o arquivo de planos sozinho, pois ele não contém as regras das demais funções.
3. Extraia o ZIP e publique a pasta completa que contém `index.html` no Netlify.
4. Aguarde a publicação e atualize o site com **Ctrl + Shift + R**.

Atualizar as regras é necessário: o campo único usa `descricao` e deixa `tema` vazio. As regras anteriores exigiam tema preenchido. As novas regras validam os limites por palavras no servidor e mantêm a proteção de autor. Não altere Storage, Realtime Database nem CORS.

## Planos já cadastrados

A publicação não altera nem exclui os registros existentes ou seus DOCX. Os dois textos antigos aparecem juntos na listagem e no campo único de edição. Não há migração automática. Se um plano antigo ultrapassar os limites, seu autor deve resumir o texto antes de salvar uma edição; consultar, visualizar e baixar continuam disponíveis. Autor, data original do upload e arquivo são preservados na edição sem substituição do DOCX.
