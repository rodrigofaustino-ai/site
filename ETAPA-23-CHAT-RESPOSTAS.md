# Respostas vinculadas no chat

Branch cumulativa: `melhorias/etapa-23-chat-respostas`.
Inclui as etapas anteriores. Preparada sem publicação no Netlify ou no Firebase;
a última versão publicada pelo usuário foi a etapa 18.

## Uso

Cada mensagem confirmada tem Responder. O rascunho exibe autor e trecho da
mensagem original em um quadro separado; escolher a referência não altera o
texto já digitado. Cancelar resposta remove somente o vínculo. Fechar/reabrir
preserva texto e referência na mesma sessão; logout ou troca de conta limpa ambos.

Enviar continua sendo explícito. Durante a gravação, texto e referência ficam
bloqueados. Em erro, ambos permanecem. Repetir a mesma tentativa com texto e
referência iguais reutiliza o identificador, inclusive após confirmação perdida.
Mudar o texto ou a referência inicia outra tentativa; não é busca geral por
mensagens parecidas. Após confirmar uma resposta, a conversa vai ao fim para
mostrar o envio. Mensagens comuns mantêm o formato anterior.

Uma resposta exibida mostra o original quando ele já está carregado. Caso
contrário, oferece Consultar original, que faz uma leitura explícita desse
único documento. Não carrega automaticamente uma mensagem por cada referência.
O original localizado é adicionado à conversa e recebe destaque. Ausência ou
falha de consulta não apaga o rascunho. Consultas atrasadas são ignoradas após
fechar o chat ou mudar de conta. A busca local passa a incluir o original quando
ele é carregado, mas continua buscando texto/autor de cada mensagem, não cópias
inventadas de uma citação. Respostas encadeadas apontam ao original imediato.

## Dados e regras — atualização necessária antes de ativar

A única propriedade nova é `respostaId`, opcional, com o identificador de uma
mensagem existente da mesma coleção `chatEquipe`. Não se armazena uma cópia
editável de texto ou autor do original. A interface obtém esses dados da própria
mensagem, cujo conteúdo permanece imutável pelas regras existentes.

Proposta completa em `firebase/chat-respostas-teste.rules`, derivada de
`firebase/compartilhamento-teste.rules`. A mudança fica exclusivamente na criação
de mensagens do chat: campo opcional, identificador válido, original existente e
proibição de referência ao próprio documento. Alterar/excluir mensagens segue
proibido. As regras de alunos, documentos, metas, registros, compartilhamento,
leituras e demais coleções foram preservadas, com comparação automática do texto
fora desse bloco e regressões no emulador.

As regras atualmente publicadas recusam esse campo novo. Portanto, publicar
somente os arquivos no Netlify não ativa respostas vinculadas. Aplicar primeiro
a proposta ao Firestore do projeto `ambienteteste-e368e`, conforme
`FIREBASE-CHAT-RESPOSTAS.md`; depois publicar o pacote no site de teste. Mensagens
comuns continuam aceitas antes e depois da atualização. Não se migram nem
reescrevem mensagens antigas. Clientes antigos podem exibir somente o texto da
resposta; atualizar a página para ver as referências.

Não alterar o projeto oficial. Presença online/Realtime Database, Storage e
modelos de exportação permanecem como estavam. Nenhuma regra foi aplicada por
esta tarefa.

## Validação

45 verificações de interface no Chromium: prévia, cancelamento, referência sem
alterar o corpo, segurança do texto, consulta explícita/cached do original,
original ausente, duas contas, falha/reenvio e confirmação perdida sem duplicar,
mudança de referência, mensagem comum, rascunho ao fechar, consultas/envios
atrasados após mudança de sessão, bloqueio durante gravação e 390/320 px.

37 verificações das regras de respostas no emulador: mensagem comum, referência
válida/encadeada, autoria, tipos/IDs inválidos, inexistência, auto-referência,
citações forjadas, limites, imutabilidade, leitura, paginação e confirmações.
Também verifica que as regras anteriores aceitam mensagem comum e recusam o
campo novo. Regressões na proposta completa: 139 de autorização de alunos e
80 de compartilhamento. Mais 91 de isolamento/carregamento/sintaxe e os testes
existentes do chat, incluindo busca, datas, ampliação e novidades.

Dados fictícios, pedidos externos bloqueados, Firebase simulado no navegador e
emulador Firestore oficial nas regras. Nenhuma escrita em serviços reais.
Capturas do computador/celular revisadas; conferência manual ainda pendente.
