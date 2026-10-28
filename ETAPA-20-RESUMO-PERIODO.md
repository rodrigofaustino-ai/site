# Resumo por período com frequência

Branch cumulativa: `melhorias/etapa-20-resumo-periodo`.
Inclui a agenda da etapa 19 e as melhorias anteriores. Etapas 19 e 20 preparadas
sem publicação automática; etapa 18 já publicada pelo usuário no site de teste.

## Onde consultar

Na ficha do aluno, Metas e acompanhamento → Acompanhamento por período.
O quadro existente continua mostrando atendimentos, vínculos com metas,
relatos e situação atual das metas, definida manualmente pelo profissional.
A nova seção Frequência no resumo complementa essa consulta.

Carregar frequência do resumo faz uma consulta às semanas cadastradas pelo
profissional. O turno é o da sessão atual e fica indicado na tela; semanas sem
turno específico são incluídas. Atualizar frequência do resumo repete a leitura.
Não existem gravações, autosalvamento, envio a IA ou nova sincronização.
Mudar o período após carregar usa os dados em memória, sem novas consultas.
O horário da última leitura é exibido; dados não são atualizados em tempo real.

## Critérios

- Relatos: intervalo inclusivo pela data do atendimento, conforme o painel existente.
- Frequência: intervalo inclusivo pela data de início da semana. As marcações
  dessa semana inteira são consideradas, mesmo que seu dia fique fora do
  intervalo. Não se inferem datas individuais de presença. A tela explica o
  critério e permite consultar a lista de semanas consideradas.
- Semanas sem data válida ficam fora do intervalo delimitado; Todo o histórico
  inclui essas semanas com aviso, sem inventar data.
- Uma marcação por aluno/dia/semana; dois horários no mesmo dia não duplicam
  a contagem. Utiliza o mesmo apurador da frequência existente.
- Sem marcação usa a grade atual como referência; não é falta e não comprova
  que o aluno estava matriculado naquela semana. Não existe histórico de
  mudanças da grade nesta versão.
- Marcações semanais antigas e sem dia reconhecido ficam em quadros separados,
  sem divisão artificial por dias. Situações desconhecidas não viram presença.
- Quantidade de atendimentos e frequência não representam percentual de aprendizagem.
- Situação das metas é a atual, registrada pelo profissional; o período não
  reconstrói uma situação histórica que não tenha sido salva como tal.

## Proteções

Consulta filtrada por professorUid, usando as regras já existentes. Carregamento,
falha e intervalo vazio têm estados distintos. Atualizar remove os totais
anteriores enquanto consulta. Consulta atrasada após troca de aluno/conta é
ignorada; saída da ficha limpa o contexto. Não há alteração de permissões.

Nenhuma mudança nos documentos, modelos ou botões de exportação existentes.
O novo resumo é para consulta na tela; não cria outro DOCX/ODT nesta etapa.

## Validação

26 verificações do resumo no Chromium, incluindo consulta explícita, período
inclusivo, dados editados mas não aplicados, intervalo inválido, histórico completo,
semana sem data, dados de outro turno/profissional, legado, marcações sem dia,
duplicidade de horários, nenhuma gravação, erro, atualização e consulta atrasada
após mudança de aluno. Larguras de 390/320 px sem transbordamento da página.

Regressões: metas 47, agenda 29, registro/consulta 66, isolamento/sintaxe 91.
Firebase simulado, dados fictícios, pedidos externos bloqueados. Capturas de
computador e celular inspecionadas. Conferência manual ainda pendente no Netlify.

Para publicação futura, usar a branch completa com `resumo-frequencia.js` e
`resumo-periodo.css`. Sem alteração de regras ou índices Firebase.
