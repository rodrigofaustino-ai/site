# Roteiro de conferência do pacote acumulado

Pacote atual: branch `melhorias/etapa-22-chat-busca`.
O pacote contém todas as melhorias anteriores. A etapa 18 já foi publicada pelo
usuário; a agenda (19), o resumo (20) e as melhorias do chat (21 e 22) ainda aguardam publicação. Nada é publicado automaticamente.

## Quando decidir publicar

No GitHub, abrir a branch atual e usar Code → Download ZIP. Extrair o ZIP e
localizar a pasta que contém `index.html`, `vendor` e os arquivos JS/CSS.
Publicar essa pasta no Netlify de teste (`srmteste.netlify.app`). Não enviar o
pacote para o site oficial: esta cópia usa o Firebase `ambienteteste-e368e`.
Não há alteração de regras ou índices necessária para as etapas acumuladas
após a configuração de compartilhamento já conferida.

Após a publicação, recarregar com Ctrl+Shift+R e usar um aluno fictício.

## Nova conferência da agenda

Na aba Alunos, conferir a agenda do dia e escolher uma data em que o aluno
fictício tenha horário cadastrado. Conferir horário e turno, usar Abrir ficha,
voltar e consultar outra data. Usar Hoje para retornar à data atual. Não deve
haver criação automática de atendimento ou frequência. No celular, conferir
leitura, botões e abertura da ficha. A consulta segue o cadastro semanal e não
aplica calendário de feriados.

## Nova conferência do resumo por período

Na ficha fictícia, abrir Metas e acompanhamento → Acompanhamento por período.
Selecionar datas e conferir os atendimentos e metas. Clicar em Carregar frequência
do resumo, conferir o turno, as semanas consideradas e os totais diários; os
registros semanais antigos devem aparecer separados. O filtro da frequência usa
a data de início da semana inteira, enquanto os relatos usam a data do atendimento.
Trocar o período e confirmar que os totais mudam; abrir outra ficha e conferir
que a frequência do aluno anterior não foi transportada. Documentos exportados
continuam com os modelos já conferidos; o novo resumo é consulta na tela.

## Nova conferência do chat

Abrir o chat, ampliar/reduzir e conferir que o texto digitado permanece. Verificar
separadores de data no histórico. Com duas contas fictícias, manter uma lendo
mensagens anteriores e enviar uma mensagem pela outra: o trecho em leitura deve
permanecer e o botão de novidade deve permitir ir ao fim. Se o chat já estiver
no fim, a novidade deve aparecer diretamente. Escape fecha o painel. No celular,
conferir tamanho e botões. Sem presença configurada, deve aparecer Presença
indisponível, sem um zero interpretado como consulta confirmada.

## Nova conferência da busca do chat

Abrir Buscar mensagens e procurar uma palavra ou autor de uma mensagem fictícia.
Conferir a quantidade de mensagens carregadas, usar setas e Enter para localizar,
limpar e conferir o rascunho preservado. Se houver mensagens anteriores ainda
não carregadas, carregar um lote e conferir a atualização dos resultados.
Fechar/reabrir o chat deve limpar a consulta; ela também não deve passar para
outra conta. A busca é limitada ao conteúdo carregado e não pesquisa documentos.

## Conferir em ordem

1. **Visual e navegação:** entrada, turno e lista. Abrir uma ficha, voltar,
   consultar a grade e abrir o mesmo aluno. Conferir nomes, campos e botões.
   Com Tab e Enter, conferir troca de turno e abertura de ficha pela lista;
   na grade, Enter ou Espaço abrem a ficha pelo botão do aluno.
2. **Semanas da frequência:** selecionar duas semanas não consecutivas,
   ocultar/exibir e usar 4 mais recentes. Conferir que as marcações persistem.
   Ocultar coluna não apaga dados e não muda os filtros próprios da exportação.
3. **Registro assistido:** digitar um relato, preencher parte do roteiro,
   conferir a prévia e acrescentar. O texto anterior deve permanecer. Salvar,
   fechar e reabrir; conferir texto, data, profissional e metas selecionadas.
4. **Histórico:** buscar por relato/profissional/meta e combinar período e
   vínculo com metas. Limpar filtros; conferir que a lista completa retorna.
   Trocar de aluno e conferir que a consulta anterior foi limpa.
5. **Documentos:** abrir PEI, PAEE, Diagnóstica e Relatório; conferir orientações
   fora dos campos, salvar e reabrir um preenchimento fictício. No PEI,
   conferir o documento atual e a versão anterior, com formatação preservada.
6. **Exportações:** gerar documentos fictícios nos formatos usados no trabalho,
   abrir no editor habitual (Word/LibreOffice) e conferir títulos, alinhamento,
   tabelas e assinatura. Os modelos de exportação não foram redesenhados.
7. **Equipe:** conferir uma cópia compartilhada com a conta de teste já usada,
   registrar observação e conferir a revogação, sem dados reais de alunos.
   No chat, conferir painel, digitação e envio de uma mensagem fictícia.
8. **Celular:** conferir os mesmos fluxos essenciais, rolagem das semanas,
   nome do aluno visível na frequência, botões e leitura dos formulários.

Anotar a tela e o que ocorreu caso encontre diferença. A conferência manual
no navegador e no editor de documentos complementa os testes automatizados.
