# Etapa 47 — Quantidades de frequência no histórico de atendimentos

O usuário escolheu todo o histórico de frequência e cálculo pelas marcações, sem preenchimento manual.

O histórico agora apresenta uma linha logo abaixo de Laudo / Diagnóstico e CID, na tabela de identificação: Atendimentos previstos e Faltas. Usa o mesmo gerador e a mesma formatação no DOCX da ficha e no DOCX/ODT de Exportar Documentos. O pacote inclui a correção da IA em notas/planner da etapa 46.

## Como calcula

A consulta lê as semanas de `frequenciaSemanas` vinculadas à conta atual e considera apenas as chaves do aluno selecionado. Inclui todos os anos, todas as semanas (inclusive sem data) e todos os turnos. Não usa os filtros visuais da aba Frequência, nem uma projeção a partir da grade atual.

- Previstos: quantidade de marcações Presente, Falta e Justificado (P + F + J).
- Faltas: somente Falta (F); Justificado entra em previstos e não em faltas.
- Sem atendimento pedagógico, campos vazios e situações desconhecidas não aumentam esses totais.
- Uma marcação diária salva é contada uma vez, independentemente de quantos horários a grade atual tem naquele dia. Não deduplica colunas de semanas distintas: cada semana salva é uma fonte de marcações.
- Uma marcação semanal antiga na chave do aluno é contada uma vez quando não existem chaves diárias dele naquela semana; não estima quantos dias ela representa.
- Quando há chaves diárias, a marcação semanal antiga não é somada novamente, inclusive se uma chave diária foi limpa. O documento informa quantas semanas antigas foram desconsideradas por esse motivo.
- Marcações antigas e sem dia definido que entraram no total são informadas em uma observação abaixo da identificação. Situações desconhecidas ignoradas também são informadas.

A observação esclarece a unidade da contagem. Esses números representam as marcações salvas; não comprovam atendimentos realizados ou dias ainda sem frequência preenchida. Não usa quantidade de relatos do Diário como presença.

## Acesso e geração

A ficha consulta o cadastro e a frequência no servidor, confirma que o aluno pertence à conta e cancela o download se a ficha/conta/turno mudar durante a geração. Preserva os campos de assinatura preenchidos na tela.

Na exportação central, o cadastro continua sendo relido por aluno; a frequência da conta é consultada uma vez por geração de lote e depois apurada por aluno. Isso evita reler todas as semanas para cada documento. Também foi corrigida a identificação da escolha Histórico, que agora é própria de cada aluno, permitindo gerar os históricos de vários alunos no mesmo lote.

Falha de consulta, falta de acesso ou resposta apenas do cache não vira quantidade zero. O documento não é gerado e aparece uma mensagem para tentar novamente. Zero só é exibido quando a consulta foi confirmada e não encontrou marcações contabilizáveis. Nenhum dado de cadastro, frequência ou histórico é gravado.

## Testes locais

- `verificar-historico-frequencia.cjs`: P/F/J, SAP/vazio, vários anos/turnos, semana sem data, registros antigos, ausência de dupla contagem, prefixos de IDs, acesso, cache e falha de rede.
- `verificar-exportacao-historico.cjs`: documentos DOCX e ODT reais, linha na posição solicitada, totais iguais na ficha e na exportação central, dois alunos no lote, uma consulta de semanas por lote, cache, troca de ficha e zero gravações.
- `verificar-formatacao-historico.cjs`: mantém o conteúdo/estilos do modelo original fora da nova linha; confirma margens, cores, tabelas, bordas e assinatura.
- Regressões de exportação, configuração/carregamento e validações de IA da etapa 46 usam dados fictícios e serviços simulados.

## Publicação manual

Não muda regras do Firebase. Extraia o pacote completo da etapa 47 e publique no Netlify a pasta que contém index.html. Aguarde Published e atualize com Ctrl + Shift + R. Não foi realizado deploy pelo assistente.

Confira a linha em um histórico exportado pela ficha e pelo botão Exportar Documentos, usando o mesmo aluno. Os valores seguem P/F/J de todas as semanas salvas. Teste também uma revisão de texto em Notas e no Planner para validar a resposta real do serviço de IA, que não foi acessado com uma conta real nos testes locais.
