# Etapa 45 — Revisão dos campos de redação com IA

Revisão nas áreas dos professores. O usuário confirmou que o questionário preenchido pelas famílias deve permanecer sem IA.

## Cobertura

| Área | Campos revisados |
| --- | --- |
| Diário | Relato (controle existente), observações clínicas, próximo passo e campos do roteiro opcional |
| Metas | Objetivo, ponto de partida, como acompanhar, estratégias/recursos e apoios previstos |
| Planner | Texto de cada dia, inclusive após trocar mês ou turno |
| Notas | Texto de cada nota, inclusive notas criadas depois de abrir a página |
| PEI | Dez campos pedagógicos com os controles próprios existentes, sem duplicar botões |
| PAEE | Descrições, barreiras, recursos, justificativas, necessidades de formação, finalidade, utilização, implementação, motivo/retorno dos encaminhamentos, avaliação e demais textos pedagógicos |
| Diagnóstica | Observação de cada item e observações gerais de cada área |
| Relatório | Áreas trabalhadas, recursos, adaptações, parecer e demais textos narrativos |
| Planos e recursos didáticos | Descrições, respeitando o limite de 40 palavras dos planos e o limite de caracteres dos recursos |
| Comunicação | Texto do chat, título/texto dos avisos e mensagens administrativas, observações de colaboração |

Exceções: nomes de alunos, responsáveis, profissionais e instituições; nascimento, datas, prazos, telefones, endereços, município, turma/turno, assinaturas/cargos, códigos/identificadores, contagens, buscas, senhas e demais controles estruturados. Os campos de identificação de condição/diagnóstico que são nomes/códigos também não recebem um novo botão. Observações clínicas já tinham IA e continuam disponíveis como texto narrativo.

A revisão identificou botões antigos de IA nos campos de responsáveis/profissionais e prazos das tabelas do PAEE. Agora esses controles ficam ocultos e não acionam IA pelo clique. As áreas de redação continuam disponíveis mesmo quando novas linhas são criadas; campos desabilitados ou somente para consulta não oferecem revisão ativa.

## Funcionamento

O novo controle usa o Puter, já integrado ao site. Não usa nova chave, serviço de backend ou configuração de Firebase. Só é chamado depois de uma ação explícita no botão do campo; envia esse texto e o rótulo do campo, sem carregar o restante do cadastro como contexto. Não remove dados pessoais que o próprio professor incluiu dentro da narrativa.

Mostra o original e a sugestão em uma caixa de revisão, com Aplicar sugestão ou Manter meu texto. Nunca substitui automaticamente. Os botões antigos de PAEE/Relatório, observações gerais da Diagnóstica e observações clínicas passam por esse fluxo. O relato principal e o PEI conservam seus fluxos de prévia já existentes.

A instrução da IA pede clareza, gramática e organização, mantendo o sentido, sem criar fatos, diagnósticos, medicamentos, resultados ou características presumidas. Se repetir exatamente a redação, há no máximo uma segunda tentativa. Se continuar igual, o original é mantido. Alterações legítimas de pontuação ou capitalização podem ser revisadas e aplicadas. Limites reais de caracteres/palavras são conferidos antes de permitir aplicar; não há truncamento automático.

Falhas, indisponibilidade e respostas vazias/inválidas preservam o campo. Mudanças de texto, aluno, documento, mês/turno, conta, recriação do campo ou logout impedem aplicar respostas antigas. A aplicação dispara os eventos normais dos formulários: campos com Salvar continuam exigindo Salvar; planner e notas seguem o salvamento automático já existente. Não salva documentos silenciosamente nem envia mensagens do chat/avisos automaticamente.

O chat mantém o compositor compacto: o botão de IA aparece como um pequeno ✨ junto ao texto, sem adicionar uma linha ao campo. A janela de revisão suporta celular, teclado/Escape e abertura dentro de outros diálogos.

## Validação local

Cenário de cobertura com dados fictícios: 237 campos de redação encontrados (48 no Diário com os 30 dias de novembro, 27 no PAEE com tabelas iniciais, 131 na Diagnóstica, 20 no Relatório, dez no PEI e um de colaboração). Todos tinham controle existente ou novo; 62 campos de identificação/controle e 11 campos de consulta ficaram excluídos. Quantidades variam com o mês e o número de linhas/notas.

- `verificar-ia-campos.cjs`: campos dinâmicos e exclusões, confirmação/descarte, integração dos estados, salvamento de planner/notas, limite de palavras, respostas repetidas, erro/serviço indisponível, texto editado durante consulta, campo recriado, readonly, logout, diálogo aninhado e celular. Usa IA e Firebase simulados, sem chamadas externas reais.
- `verificar-ia-campos-modelo.cjs`: leitura dos formatos de resposta, resposta inválida, repetição, pontuação e limites.
- Regressões: PEI, registro assistido/tradicional, chat compacto, geradores de documentos e formatação original do histórico, carregamento/configuração oficial.

Os testes validam o fluxo, não a qualidade de respostas reais do serviço externo. O serviço pode pedir autenticação própria ou estar indisponível conforme sua configuração/disponibilidade.

## Publicação manual

Não precisa atualizar regras do Firebase. Extraia o pacote completo da etapa 45 e publique no Netlify a pasta que contém index.html. Aguarde Published e atualize com Ctrl + Shift + R.

Teste um campo no planner, uma nota, uma meta e uma observação individual da Diagnóstica. Peça uma sugestão, confira que o original não mudou antes de aplicar, teste Manter meu texto e depois Aplicar sugestão. Nos formulários, salve e reabra. Confirme que nomes e assinaturas não apresentam IA. As melhorias anteriores e a formatação do histórico estão preservadas; não foi realizado deploy de produção pelo assistente.
