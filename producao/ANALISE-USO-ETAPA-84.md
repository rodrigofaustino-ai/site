# Análise de uso do Diário e formulários — etapa 84

Base: funcionalidades acumuladas até a etapa 83. Revisão em 24/11/2026 para elaborar ajuda voltada a professores que estão iniciando no uso digital. Resultado: 39 capítulos, 137 perguntas, 11 capturas com dados fictícios e um diagrama de dependências. Conteúdo disponível na mesma aba, com busca, índice, categorias, ampliação de imagens e impressão integral.

## Método e alcance

Leitura dos caminhos de entrada, campos e botões da interface, handlers de gravação, módulos de associação entre Diário e formulários, cálculos de frequência e fluxos de exportação. A matriz abaixo liga conclusões às implementações. Capturas e navegação foram executadas em Chromium local com Firebase simulado e solicitações externas bloqueadas. Não houve consulta a cadastros reais nem modificação de regras ou dados de produção. Esta revisão funcional/editorial não representa uma auditoria de segurança de toda a infraestrutura.

## Constatações que orientam o manual

1. **Salvar tem escopo por tarefa.** Salvar Alterações Geral delega ao cadastro; relato, meta, formulário e termo têm gravações próprias. Planner/notas têm gravação por edição. O guia não promete salvamento automático de tudo.
2. **Há sessões distintas.** Diário/PEI e PAEE/Diagnóstica/Relatório usam projetos diferentes. Consultas e bibliotecas conferem o e-mail entre contextos; UIDs não são intercambiáveis. O guia explica a situação sem exigir que professores configurem infraestrutura.
3. **Autopreenchimento não é sincronização permanente.** CadastroDiarioModelo aplica equivalências a campos vazios, mantendo conteúdo existente. A consulta não salva o formulário e não cria avaliações, pareceres ou assinaturas automaticamente.
4. **Programação não é ocorrência.** Grade e Agenda dependem de turno, cadastro ativo e dias/horários; não comprovam atendimento ou presença. Relato comum não implica P automático.
5. **Ausências têm integração específica.** F/FJ no fluxo integrado alcançam frequência e registro automático por data. Correções removem/ajustam o automático, preservando relatos manuais.
6. **As contagens têm bases diferentes.** Resumo da ficha conta relatos; Relatório anual consulta P+F+FJ+SAP / P; termos usam F e P+F+FJ até hoje; histórico exportado usa registros anuais e faltas manuais. O manual traz tabela e exemplo numérico em vez de tratar totais diferentes como equivalentes.
7. **FJ não interrompe a sequência de F.** FJ/SAP são ignoradas; P interrompe; encontro previsto sem lançamento impede confirmar continuidade. Alerta pendente permanece até providência registrada, não apenas impresso/exportado.
8. **Arquivar preserva, mas não revoga.** A programação ativa muda; histórico/documentos e acessos já concedidos permanecem. Não se aconselha criar outro aluno para corrigir dados ou contornar filtros.
9. **Formulários não são todos iguais.** PAEE trata barreiras, TA/CAA, apoios, formação/rede e avaliação; PEI trata contexto escolar, estratégias, família e versões; Relatório reúne áreas, recursos e parecer; Diagnóstica tem S/N/P por semestre. P de Parcial não é P de Presente.
10. **Imagens/arquivos são conteúdos próprios.** Anexos da ficha são enviados em fluxo separado; miniatura não confirma upload. PDF anexado permanece PDF, não se promete divisão automática em páginas/imagens ou extração do diagnóstico.
11. **Bibliotecas têm públicos distintos.** Trechos/assinaturas são privados; modelos/planos/recursos são para a equipe. Documentos preenchidos do aluno não devem ser tratados como modelo compartilhável sem conferência.
12. **Inserções são cópias.** Excluir assinatura/trecho do banco não reescreve documentos salvos ou arquivos baixados. Imagem de assinatura não é certificação digital.
13. **Preenchimento online reconhece modelos específicos.** Sete formulários preparados; subir arquivo arbitrário não cria automaticamente campos online. Salvar versão e exportar são ações distintas.
14. **Exportação geral consulta documentos salvos.** DOCX/ODT, downloads individuais ou ZIP; PDF é oferecido em ferramentas próprias. Vínculos/homônimos/legados exigem conferência. O relatório do ZIP informa omissões.
15. **Arquivo local não volta ao banco.** Edição no Word/LibreOffice não altera o site. Reexportar depois de salvar correções é diferente de reabrir arquivo antigo em Downloads.
16. **Família é fonte, não avaliação automática.** Convite exclusivo de 30 dias, um envio e novo link desativa anterior sem apagar respostas. Resposta familiar não preenche S/N/P como observação do professor.
17. **Colaboração publica uma cópia.** Alterar o original não atualiza a cópia automaticamente; revogação não recolhe arquivos já baixados. Contatos/laudos não entram automaticamente, mas textos selecionados exigem revisão.
18. **Chat e comunicados são diferentes.** Aviso interno de cerca de 3 segundos, notificação opcional dependente de navegador/sistema e Diário aberto; avisos administrativos pedem Entendi e mensagens Fechar. Publicação administrativa não é botão disponível a todo professor.
19. **Filtros são de consulta.** Semanas ocultas, histórico filtrado, arquivados e turno podem explicar itens “sumidos”; exportações têm recortes próprios. Estatísticas são da conta, não um painel global nem medida automática de aprendizagem.

## Matriz de evidências e cobertura

| Área / fluxo | Fontes conferidas | Tratamento no manual |
|---|---|---|
| Login, turno, cadastro, navegação | index.html; alunos-navegacao.js; perfil-navegacao.js | Primeiros passos, conta, turno e nomes completos |
| CGM e salvamento geral | index.html; cadastro-diario-modelo.js; integração cadastral | Digitação manual, botão geral cadastral e compatibilidade do Relatório |
| Dias/horários, grade e agenda | index.html; agenda-dia.js; agenda-frequencia.js; meu-dia.js | Pré-requisitos, programação e marcação diária |
| Registro completo/rápido | registro-assistido.js; registro-agenda.js; registro-ausencia.js | Roteiro, próximo passo, humor, tentativa pendente e histórico |
| Frequência e apuração | frequencia-interface.js; frequencia-anual.js; aluno-totais.js; resumo-frequencia.js | Situações, datas, filtros e bases distintas |
| Alertas e encaminhamento | alertas-frequencia.js; alertas-frequencia-modelo.js; alertas-frequencia-dados.js; alertas-frequencia-servico.js | Critérios, sequência, persistência e registro de providência |
| Cadastro para documentos | cadastro-diario.js; cadastro-diario-modelo.js; cadastro-diario-janela.js | Campos vazios, vínculo, mesma conta e salvamento próprio |
| PAEE | paee_formulario_02.html | Seções reais, tabelas, responsáveis/prazos e Não se aplica |
| PEI | pei_formulario.html; pei-formulario.js; pei-modelo.js | Seções, metas, versões e legado importado |
| Relatório | relatorio_formulario.html; relatorio-frequencia.js | Áreas, totais anuais e parecer baseado em evidências |
| Diagnóstica | diagnostica_formulario.html | Áreas, semestres, S/N/P e observações |
| Metas | metas-aluno.js; acompanhamento de registros | Objetivo/critério, revisão e vínculo com atendimento |
| Anexos/laudos/CID | index.html | Upload separado, PDF original, legibilidade e busca sem diagnóstico |
| Assinaturas | biblioteca-assinaturas.js; assinaturas-conexao.js; assinaturas-adicionais.js; assinaturas-documentos.js | Biblioteca privada, cópias independentes e espaço manual |
| Trechos | trechos-campos.js; trechos-modelo.js; trechos-servico.js; trechos-janela.js | Cursor/seleção, limites, cadastro/edição/exclusão e salvamento do destino |
| IA | ia-campos.js; ia-campos-modelo.js; IA do relato/PEI | Envio por campo, revisão explícita e limites factuais |
| Modelos/termos | documentos-modelos.js; termos-online.js; termos-online-dados.js; termos-online-modelo.js | Sete tipos, contagens, versões, PDF/DOCX e cópias das páginas |
| Planos/recursos | planos-aula.js; recursos-didaticos.js | Limites, formatos, busca e autoria |
| Exportações | exportar-documentos.js; exportacao-lote-modelo.js; historico-atendimentos-frequencia.js | Salvos, formatos, seleção, legado/homônimos, omissões e downloads |
| Família | questionario-familia-professor.js; questionario-familia-modelo.js; questionario-familia-publico.js | Link, validade, envio e separação de fontes |
| Colaboração | colaboracao-aluno.js; colaboracao-modelo.js; colaboracao-recebida.js; colaboracao-servico.js | Cópia conferida, destinatário e revogação |
| Planner/notas | index.html; planner-dia.js | Edição, gravação por edição e quadro de leitura |
| Estatísticas | estatisticas.js; estatisticas-modelo.js | Filtros, consulta e interpretação sem inferir aprendizagem |
| Chat e notificações | chat-equipe.js; chat-notificacoes-navegador.js; chat-notificacoes-sw.js; chat-anexos.js | Avisos distintos, permissão, limite e permanência do Diário aberto |
| Comunicados | comunicados-equipe.js; comunicados-imagens.js | Entendi/Fechar e controles administrativos |
| Arquivamento | index.html; arquivamento-alunos.js | Preservação, reativação e acessos separados |

## Verificação e limites práticos

- Navegação completa por todos os capítulos e vínculos internos, busca com palavras, categorias de FAQ, foco por teclado, janela ampliada e telas de 1440/390 px.
- Todas as imagens do manual são locais; exemplos fictícios. Há um diagrama de dependências com descrição alternativa em texto.
- Impressão integral inclui capítulos e perguntas, testada em PDF A4 e leitura do texto extraído. Revisão de espaçamento: fluxo contínuo, sem quebra obrigatória a cada capítulo; 59 páginas em vez de 99, preservando os 39 capítulos e as 137 perguntas.
- Aba real no Diário alterna com Alunos e não altera o banco simulado; ajuda dos quatro formulários abre em outra aba.
- Sintaxe/carregamento dos documentos conferidos com o verificador existente de configuração oficial; nenhum renderizador de exportação de documentos pedagógicos foi alterado.
- Regras Firebase, autenticação e dados de produção não foram alterados. O guia não ensina professores a mexer em infraestrutura para contornar erros.
- A data editorial identifica a revisão. Mudanças futuras de botões, formatos, períodos ou regras funcionais devem atualizar conteúdo, exemplos e capturas, além de repetir a conferência de navegação.

## Manutenção

Texto em manual-conteudo.js; renderização em manual-uso.js; estilo em manual-uso.css; imagens em manual/. Para gerar novas capturas fictícias: ferramentas/capturar-imagens-manual.cjs. Para validar e gerar o PDF de revisão: validacao/verificar-manual-uso.cjs. O PDF de prévia fica fora do pacote de execução (previas/etapa-84); a função Imprimir manual completo permite produzir uma cópia atualizada no navegador.
