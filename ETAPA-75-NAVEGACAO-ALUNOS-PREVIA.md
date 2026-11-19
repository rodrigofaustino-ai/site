# Prévia — navegação lateral por alunos

Menu na tela inicial, apenas enquanto a aba Alunos está ativa e há alunos na lista. Deriva exclusivamente dos cartões atuais de studentsList, respeitando conta, turno e filtro Em atendimento/Arquivados/Todos. Ao trocar de aba, recolhe a lateral e devolve a largura integral ao conteúdo. Não interfere no menu da ficha.

Nomes com uma ou duas partes ficam inteiros. Com três ou mais, mantém primeiro e último nome e usa inicial maiúscula seguida de ponto para cada palavra intermediária, inclusive partículas, conforme pedido. Exemplo: Ana Clara de Oliveira -> Ana C. D. Oliveira. Normaliza espaços e acentos compostos. Nome completo fica no título e no rótulo acessível do link. A busca do menu usa o nome completo, sem exigir acentos, e filtra apenas os atalhos.

Clicar localiza o cartão do aluno na própria lista, rola a página, coloca foco/destaque nele e mantém o botão existente de abrir ficha. Não abre outro aluno nem salva dados automaticamente. Desktop: menu fixo na lateral com rolagem interna. Celular: menu recolhível, atalhos em duas colunas, fecha ao selecionar, campos de toque maiores. Navegação respeita preferência por movimento reduzido. O menu também recebe a indicação visual de alerta da Frequência, reutilizando o atributo de nome existente.

Implementação: alunos-navegacao.js/css e inclusão no index.html. Novos elementos só envolvem o conteúdo da tela inicial, preservando nós, IDs e eventos existentes. Nenhuma alteração de regras, exportações ou dados do Firebase. A saída da conta limpa a lista do menu.

Validação: verificar-alunos-navegacao.cjs em Chromium, com 12 nomes fictícios, conta/turno/filtro, nomes de uma/duas/várias partes e acentos, pesquisa, rolagem/foco sem abrir/salvar ficha (zero transações), troca de aba, celular e logout. Verificação geral de configuração/sintaxe: 131 verificações, pedidos externos bloqueados. Prévias em previas/etapa-75/.

Estado: implementado para revisão visual, sem gerar novo pacote. O pacote 74 entregue anteriormente não contém este menu.
