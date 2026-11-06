# Etapa 40 — Arquivos, imagens e GIFs no chat

Inclui botão 📎, seleção local com prévia e remoção, texto opcional e um arquivo por mensagem de até 10 MB. Formatos: JPG/JPEG, PNG, GIF, WEBP, PDF, DOC/DOCX, ODT, XLS/XLSX, ODS, PPT/PPTX, ODP, TXT, CSV e ZIP. Memes e figurinhas são enviados como arquivos de imagem; não há catálogo externo ou coleção de favoritos nesta etapa.

A seleção sozinha não envia. O upload começa somente ao clicar em Enviar e mostra progresso. A mensagem só é publicada após confirmar o upload. O texto, arquivo e referência são preservados após falha para repetir a mesma tentativa, com o mesmo ID. Uma confirmação de upload perdida é reconhecida por metadados; uma confirmação de mensagem perdida é reconhecida pelo documento já existente. Não faz reenvio automático.

## Leitura e conversa

Arquivos aparecem com nome e tamanho. Documentos são baixados; imagens/GIFs possuem Ver imagem / GIF e Ocultar imagem, com prévia dentro da conversa. A leitura de mídia é explícita para evitar carregar arquivos de todo o histórico. Mantém a busca local pelo texto, autor e agora nome do arquivo, as respostas por referência, o histórico e as leituras já existentes.

Não usa getDownloadURL ou grava URLs públicas nos documentos. Obtém o arquivo com token Firebase no cabeçalho Authorization, recebe um Blob e cria URL temporária somente no navegador. Confere tamanho e contexto antes de usar a resposta. Prévia e cache são limpos na exclusão, indisponibilidade do histórico e saída/troca de conta. Cache em memória limitado a oito arquivos/40 MB. Documentos não são interpretados nem executados na página; imagens SVG e arquivos HTML/JS não são aceitos. Imagens locais passam por assinatura e decodificação antes do envio; documentos PDF passam pela assinatura inicial, sem prometer análise antimalware.

O compositor continua compacto; o campo de texto mantém 2.000 caracteres. Pode enviar um anexo sem legenda ou junto do texto. Enquanto valida o arquivo, impede envio prematuro; durante o envio impede trocar o arquivo. A troca de conta cancela a tarefa de upload e invalida resultados atrasados.

## Exclusão

A exclusão do próprio autor apaga o texto e remove a metainformação do anexo da mensagem em transação. A regra do Storage passa a negar a leitura do arquivo assim que a mensagem é apagada, mesmo se a tentativa de remoção física falhar. O cliente tenta também excluir o objeto do Storage. As respostas continuam apontando para a mensagem original, mostrando o aviso de exclusão em vez de copiar o nome/texto do anexo.

A exclusão não desfaz downloads já feitos. Se um upload foi concluído mas a publicação falhou e a pessoa abandona a tentativa, pode restar um objeto privado do autor. Não é mostrado nem liberado para a equipe sem a mensagem correspondente. Não se remove automaticamente um upload de resultado incerto, para evitar apagar um arquivo cuja mensagem tenha sido confirmada no servidor. Limpeza administrativa desses uploads e eventuais políticas de retenção/soft delete do bucket são operações separadas; não foi criado um serviço agendado.

## Regras e dados

Firestore: campo opcional anexo em chatEquipe/{id}, com nome, tipo, tamanho e caminho. Somente metadados são guardados no Firestore; os bytes ficam em Storage, em chatAnexos/{autorUid}/{mensagemId}/arquivo. As regras validam tipo, tamanho, chaves e caminho exato vinculado ao autor e à mensagem. Mensagens de texto anteriores permanecem válidas. O anexo não pode ser editado depois da criação; a transição de exclusão exige retirar o anexo.

Storage: cópia das regras atuais fornecidas pelo usuário salva em firebase/storage-publicado-antes-etapa-40.rules. O arquivo completo integrado está em producao/salamulti-storage.rules e preserva o bloco de planosAula e o bloqueio dos demais caminhos. Upload privado é exclusivo do autor antes de publicar a mensagem; leitura pela equipe exige mensagem existente, não apagada, com caminho, nome, tamanho e MIME correspondentes ao objeto. Não permite listar os anexos. Arquivos publicados não podem ser regravados. A regra consulta o Cloud Firestore com firestore.get/exists.

É necessário publicar os dois arquivos completos: producao/salamulti.rules no Firestore de salamulti e producao/salamulti-storage.rules no Storage de salamulti. Não alterar Realtime Database nem o projeto paee-3fea6. A integração de regras do Storage com Firestore pode exigir habilitar a permissão indicada pelo Console Firebase. Nenhuma regra foi publicada automaticamente.

## Verificação

- Modelo de arquivos: tamanho, MIME, assinatura, nome e contrato com as regras.
- Chromium com duas sessões fictícias e tráfego externo bloqueado: GIF, documento, prévia, download autenticado, resposta ao anexo, exclusão nos dois clientes, URL temporária revogada, falhas de upload e publicação, recuperação após confirmação perdida, formatos recusados, telas 390/320 e logout.
- Emuladores locais Firestore/Storage integrados: upload privado, leitura antes/depois da publicação, acesso sem login, arquivo publicado imutável, metadados falsos, limites, exclusão, listagem e permissões dos planos de aula.
- Regressões do chat de texto, emojis, histórico, respostas, busca e leituras; regras anteriores e configuração oficial.

Os testes não acessam mensagens ou arquivos reais e não publicam no Netlify. Anexos usam armazenamento e tráfego do bucket existente do Firebase; não foi criado outro serviço ou projeto.
