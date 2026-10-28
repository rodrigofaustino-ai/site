# Emojis e exclusão das próprias mensagens

Branch cumulativa: `melhorias/etapa-24-chat-emojis-exclusao`.
A etapa 23 já foi publicada pelo usuário, com respostas vinculadas conferidas.
Esta nova etapa está preparada; nada foi publicado no Netlify ou Firebase.

## Emojis

O seletor Emojis oferece opções comuns e acessíveis, com nome nos botões.
Insere no cursor ou substitui o trecho selecionado, preservando o restante do
rascunho. Não envia automaticamente, não usa imagens externas e mantém emojis
como texto Unicode. O limite de 2.000 unidades de texto do campo é respeitado,
inclusive nos emojis que ocupam mais de uma unidade. Escape fecha primeiro o
seletor; sair da conta fecha e limpa o estado. Durante envio, o seletor fica
bloqueado. Leituras não são confirmadas enquanto o seletor cobre a conversa.
Emojis como texto já são compatíveis com as regras publicadas.

## Apagar

Somente o autor vê Apagar nas suas mensagens confirmadas. Há confirmação antes
de qualquer gravação. A exclusão é feita por transação, conferindo novamente a
conta e o autor no servidor. Erro não remove o texto local como se houvesse
confirmação; confirmação perdida com tombstone recebido é tratada sem duplicar.
Callbacks de outra sessão não podem limpar o rascunho da conta atual.

O documento permanece para preservar o contexto das respostas, mas o campo
`texto` é efetivamente substituído por string vazia. Recebe `apagada: true` e
`apagadaEm` com horário do servidor. Autoria, criação e respostaId permanecem.
A interface mostra Mensagem apagada pelo autor, sem opção de restaurar o texto.
Não é apenas esconder o conteúdo mantendo a mensagem original no mesmo campo.

Referências usam a mensagem canônica: depois de apagar, não continuam exibindo
o trecho antigo. Não se aceita nova resposta para um original apagado. Uma
referência selecionada que seja apagada por outra sessão não apaga o rascunho;
a interface pede cancelar esse vínculo antes de enviar. A busca não inclui
conteúdo de mensagens apagadas. Apagar mensagem-resposta também remove seu
texto, preservando apenas os metadados e a identificação de exclusão.

## Atualização de mensagens antigas

As 100 mensagens recentes continuam com o listener existente. Mensagens já
carregadas que ficaram fora dessas 100 recebem acompanhamento por consultas de
IDs em grupos de até dez documentos. Assim, nas sessões conectadas e atualizadas, apagar um original antigo atualiza
as outras telas e referências já abertas, sem depender só da chegada de mensagens
novas. Existem leituras Firestore adicionais desse histórico carregado. Os grupos
são reutilizados e todos os listeners são encerrados ao trocar/sair da conta.

Uma falha na confirmação desses grupos oculta o texto antigo da interface e
permite nova tentativa ao reabrir a conversa. Mensagens sem documento retornado
ficam indisponíveis, sem atribuir uma exclusão ao autor sem evidência. A exclusão
confirmada não é revertida por um snapshot antigo sem a marca de exclusão.

## Regras — atualização necessária antes da publicação

Proposta completa: `firebase/chat-emojis-exclusao-teste.rules`, baseada nas regras
de respostas da etapa 23. A mudança fica no bloco chatEquipe: autor pode fazer
apenas a transição para apagada, com texto vazio e horário de servidor. Não
permite editar conteúdo, trocar autor/data/referência, restaurar texto ou excluir
fisicamente o documento. Criar mensagem já apagada é recusado; novas respostas
para original apagado também são recusadas.

As demais coleções e o bloco de confirmações de leitura foram preservados.
Sem atualização, emojis e mensagens comuns funcionam, mas Apagar é recusado.
Seguir `FIREBASE-CHAT-EXCLUSAO.md`, somente no projeto `ambienteteste-e368e`.
Presença, Storage, índices e modelos de documentos exportados não mudaram.

## Validação

47 verificações no Chromium: inserção/seleção/cursor, limite de caracteres,
nenhum envio automático, Escape, preservação do rascunho, autoria dos controles,
cancelamento e falha de exclusão, confirmação perdida, texto removido do documento,
metadados preservados, busca atualizada, exclusão de original fora das 100 recentes
refletida em duas sessões, referência selecionada preservando rascunho, bloqueio
de envio para original apagado, consulta ao marcador, troca de conta com exclusão
pendente, listeners encerrados e 390/320 px. Leituras não são confirmadas com
seletor aberto. Capturas revisadas visualmente.

42 verificações de regras no emulador: autoria, patch exclusivo, remoção do texto,
horário, metadados imutáveis, ausência de restauração/exclusão física, referências,
consultas por IDs e compatibilidade. Mais 139 de autorização de alunos, 80 de
compartilhamento, 45 de respostas no navegador, testes do chat/busca e 91 de
isolamento/sintaxe. Dados fictícios, pedidos externos bloqueados e nenhuma escrita
em serviço real. Conferência manual no site publicado permanece pendente.
