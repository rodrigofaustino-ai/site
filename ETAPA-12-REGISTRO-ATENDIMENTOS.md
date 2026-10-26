# Facilitar o registro dos atendimentos

O usuário priorizou o lançamento dos atendimentos. Esta versão está na branch
`melhorias/etapa-12-registro-atendimentos` e inclui as melhorias anteriores,
inclusive a seleção de colunas de semana da etapa 11. Não foi publicada no Netlify.

## Roteiro opcional

Na ficha do aluno, abrir “Roteiro opcional para organizar o relato”. Há quatro
campos: atividades realizadas, estratégias e apoios utilizados, respostas
observadas e próximos encaminhamentos. Preencher somente o que foi observado.

“Conferir prévia do roteiro” reúne apenas os campos preenchidos, com seus títulos.
Não cria frases, avaliações ou conclusões e não usa IA. “Acrescentar ao relato”
adiciona o conteúdo ao fim do texto existente, sem substituí-lo. Os campos do
roteiro são então limpos e é necessário salvar o relato para registrar no banco.

“Limpar roteiro” não apaga o relato principal. Caso ainda haja texto no roteiro
sem ter sido acrescentado, salvar é interrompido com orientação para conferir e
acrescentar ou limpar o roteiro. Isso evita ignorar parte do preenchimento.

O relato tradicional permanece disponível sem usar o roteiro. A orientação do
relato fica fora do campo digitável, numa opção de abrir e fechar.

## Digitação e rascunho

- O último nome informado em Registrado por é mantido na memória da sessão da
  mesma conta e reaparece ao abrir outro aluno. Ele continua editável; não é
  verificação institucional de autoria e não é persistido no navegador.
- A data inicial do registro e o botão Hoje usam a data local do navegador.
- Antes de sair da ficha, trocar de aluno ou usar o botão de logout, há aviso
  se existe relato, roteiro, humor ou seleção de metas ainda não salvo.
- Enquanto salva, os campos do atendimento ficam bloqueados e o sistema impede
  as ações de voltar, trocar aluno e logout até receber uma confirmação.
- Trocar de aluno, após concordar com o descarte, não transporta texto ou prévia
  para a outra ficha. Salvar um cadastro novo preserva o relato digitado antes
  de existir um identificador do aluno.
- Sair da conta ou mudar de conta limpa os dados locais desse atendimento.

Não existe autosalvamento de rascunho em disco ou no Firebase. A proteção ocorre
enquanto a página permanece aberta e pelo aviso do navegador ao tentar fechá-la
ou recarregá-la; fechamento forçado do navegador não oferece recuperação garantida.

## Salvamento

O atendimento e a atualização da data do último registro são feitos em uma única
transação Firestore. Uma falha não deixa metade da operação aplicada. A transação
confere o proprietário do aluno e o contexto de conta/ficha antes de gravar.

A mesma tentativa, sem alterar os campos e sem sair da ficha, mantém o mesmo
identificador. Se o banco já gravou mas a confirmação se perdeu, tentar novamente
reconhece esse registro e não cria outro. Se o registro existente com esse
identificador foi alterado, a tentativa é recusada para não sobrescrevê-lo.

Em caso de erro, o relato, data, profissional, humor e metas escolhidas são
mantidos. A mensagem orienta conferir o histórico antes de mudar o conteúdo.
Esse mecanismo não é uma busca geral por registros parecidos: editar os campos,
reabrir a ficha ou recarregar inicia outra tentativa. Não se apagam registros
anteriores nem se fazem associações por texto parecido.

Um lançamento retroativo não substitui uma data mais recente em ultimoRegistro.
A estrutura continua com date, text, humor, por, createdAt e vínculos de metas
opcionais; o roteiro não cria outro formato de atendimento ou migração.

## Sugestões de IA

A função já existente permanece opcional. Resposta atrasada não é exibida se
o relato mudou, o aluno/conta mudou ou o atendimento entrou em salvamento. A opção
de aceitar confere novamente o contexto e o texto de origem. O roteiro novo
não envia dados a esse serviço; só o botão explícito de IA aciona a função antiga.

## Validação e publicação futura

- 41 verificações no Chromium: relato tradicional, prévia sem gravação, acréscimo
  sem substituir texto, bloqueio de roteiro pendente, descarte cancelado, bloqueio
  durante gravação, clique repetido, falha, confirmação perdida sem duplicação,
  resposta atrasada de IA, troca de aluno, novo cadastro, histórico antigo,
  memória do profissional, logout e larguras de 390/320 pixels.
- 13 verificações do mesmo serviço de salvamento no emulador Firestore: repetição
  sem duplicar, metadados/vínculos, datas anteriores e posteriores, alteração do
  registro entre tentativas, outra conta, contexto encerrado e transferência do aluno.
- Regressões aprovadas: metas/atendimentos 47, frequência 66, compartilhamento 37
  e isolamento/carregamento 88 verificações.

Todos os testes usam dados fictícios. As interfaces tiveram pedidos externos
bloqueados e Firebase/IA simulados; o teste de transação usou o emulador oficial.
Nenhum registro real foi gravado. A conferência manual permanece para a próxima
publicação no site de teste.

Para publicar depois, baixar o ZIP completo desta branch e enviar a pasta ao
Netlify de teste, incluindo `registro-assistido.js` e `registro-assistido.css`.
Não é necessário alterar regras Firebase. A cópia permanece no projeto
`ambienteteste-e368e`; não implantar este pacote no site oficial.
