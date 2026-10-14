# Ativar Recursos Didáticos

Esta aba usa o login do Diário, no Firebase **salamulti**, e uma coleção nova, `recursosDidaticos`. Os professores preenchem descrição e link; o site registra autor e data automaticamente. Todos os usuários autenticados consultam a listagem, inclusive entre turnos. Somente o autor edita ou exclui. A data de inserção não muda nas edições.

## 1. Acrescentar a permissão no Firestore

1. Abra **Firebase → salamulti → Firestore Database → Regras**.
2. Guarde uma cópia das regras atuais.
3. Abra o arquivo `firebase/recursos-firestore.rules` deste pacote e copie o conteúdo.
4. Cole o bloco dentro de `match /databases/{database}/documents { ... }`, depois dos blocos existentes e antes das duas últimas chaves que encerram o arquivo.
5. Preserve as regras de alunos, frequência, planner, notas e planos de aula. Não substitua o arquivo inteiro por esse bloco. Se existir alguma regra genérica que libere todas as coleções, ela também precisa excluir `recursosDidaticos`; permissões genéricas prevalecem sobre restrições específicas.
6. Clique em **Publicar**.

O arquivo `compartilhados-teste.rules` serve somente aos emuladores e não contém todas as regras do seu site. Não o publique no Firebase real.

## 2. Publicar no site oficial

1. Baixe o ZIP atualizado do repositório, branch `feat/exportacoes-pdf-docx-odt`.
2. Extraia e publique a pasta completa no Netlify oficial, incluindo `recursos-didaticos.js`, `planos-aula.js`, `planos-aula.css`, os HTMLs, `exportacao.js` e `vendor`.
3. Aguarde Published e atualize com **Ctrl + Shift + R**.

Esta aba guarda somente texto e links. Não exige mudanças no Storage nem no CORS. Não modifica os registros existentes.

## 3. Conferir

Cadastre uma descrição e um link completo, começando com `https://` ou `http://`. Confira a data e abra o link, que aparece em uma nova aba. Entre com outro professor: o recurso deve aparecer para consulta, sem os botões Editar e Excluir. A listagem tem busca por descrição, endereço ou autor. Ao sair, os dados exibidos são limpos.

Os endereços devem ser sites com materiais didáticos. A ferramenta valida o formato do endereço; a escolha do conteúdo e as permissões exigidas pelo site de destino continuam a cargo da equipe.

## Teste local

```sh
NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-recursos-navegador.cjs
```

Esse teste usa usuários e Firebase simulados, sem alterar o banco real. As permissões de backend são verificadas separadamente pelos emuladores, em `validacao/verificar-regras-recursos.cjs`.
