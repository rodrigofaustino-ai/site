# Etapa 31 — Exportar Documentos

Acumulada sobre a etapa 30. Etapas 27–31 ainda não publicadas. A etapa 26 continua sendo o oficial confirmado. Esta branch usa os dois projetos oficiais; não publicar como teste isolado sem adaptar configuração.

## Fluxo

Botão Exportar Documentos após a última aba da página principal, abrindo caixa modal:
1. Marcar PEI, PAEE, Diagnóstica e/ou Relatório.
2. Escolher DOCX ou ODT.
3. Selecionar alunos, com busca, turno, inclusão explícita de arquivados, seleção dos exibidos e limpeza. Filtros não desmarcam seleções anteriores; a contagem permanece visível.
4. Conferir os documentos encontrados e confirmar qualquer documento antigo sem alunoId. Havendo mais de um vinculado, escolher o documento. Os rótulos incluem nome/escola, data quando disponível e ID. Homônimos têm escola/ID do cadastro como referência.

Um arquivo isolado sem omissões é baixado diretamente. Vários arquivos, falhas ou omissões geram ZIP com pastas por aluno e relatório de itens não incluídos. Arquivos de alunos diferentes têm prefixos exclusivos para evitar colisão mesmo com nomes/IDs sanitizados semelhantes. Baixar novamente reaproveita o arquivo em memória sem consultar o banco outra vez. A caixa deve permanecer aberta para isso.

Até 100 combinações aluno/documento e 150 MiB de arquivos acumulados por pacote. Geradores executados sequencialmente, com limite de tempo por arquivo e cancelamento ao fechar/sair/trocar turno. Nenhum formulário vazio é criado para substituir documento ausente.

## Dados, associação e contas

Somente documentos salvos, lidos novamente ao gerar. Rascunhos não são incluídos. PEI exporta o documento atual, estruturado ou importado/comprimido; versões históricas do PEI não são selecionadas nesta etapa.

Alunos são consultados por professorUid da conta do Diário. PAEE/Diagnóstica/Relatório usam uma sessão separada no projeto paee-3fea6, com o mesmo e-mail e o UID próprio desse projeto. Sessão em memória (Persistence.NONE), senha limpa após login/falha e sessão encerrada ao fechar; não muda a sessão existente dos formulários. Administrador também consulta apenas seus próprios documentos por esse fluxo.

A associação prioriza alunoId. Apenas documentos sem alunoId e com nome normalizado coincidente aparecem como candidatos legados, sempre com confirmação explícita. Documento vinculado a outro aluno não vira candidato por nome. O mesmo documento não pode ser escolhido para dois alunos em um pacote. Nenhum vínculo é salvo. Ao gerar, responsável e vínculo são conferidos novamente; para legado também é usado o nome atual do cadastro.

Fonte servidor e validação de proprietário. Cancelamento, logout e troca de conta invalidam respostas pendentes, retiram as molduras de geração e impedem download tardio. Um download já solicitado não pode ser apagado do computador pelo sistema.

Os arquivos contêm dados dos alunos e devem ser guardados em local protegido. Conteúdo fica em memória até o fechamento; não é enviado para conversores, IA, e-mail ou serviços externos. Leituras e autenticação utilizam os serviços Firebase existentes e suas cotas.

## Preservação dos modelos

As molduras de geração carregam os mesmos exportadores dos formulários. Nesse modo especial não inicializam Firebase nem executam autenticação ou salvamento; recebem apenas o conteúdo já autorizado do coordenador. CSP bloqueia scripts/IA e imagens externas. Mensagens validam origem, janela e token aleatório. Os downloads internos são capturados como Blob e reunidos no pacote.

Em uso normal, formulários e exportações individuais mantêm seu comportamento. Retorno assíncrono dos exportadores permite confirmar conclusão/falha no lote. PEI estruturado usa o mesmo cabeçalho e gerador; PEI importado usa a mesma preparação já utilizada pela exportação existente.

Não há novas regras nem índices. Não há migração, alteração, exclusão, criação ou vinculação de documentos. Frequência e registros de atendimentos continuam em seus exportadores individuais; esta etapa centraliza os quatro formulários listados.

## Verificações locais

- 8 verificações do modelo de associação, legado, homônimos e nomes de arquivo.
- 10 arquivos DOCX/ODT reais gerados pelos quatro renderizadores, incluindo PEI importado/comprimido, com conteúdo salvo conferido; Firebase não inicializado e pedidos externos bloqueados.
- 26 verificações do fluxo na página real com Firebase simulado: ordem, filtros, UID separado, confirmação de legado, ZIP real com 3 ODT e relatório, rejeição de documento repetido para homônimos, sessão em memória, zero gravações, celular, fechar durante consulta e logout durante geração sem download tardio.
- 10 downloads dos exportadores individuais existentes (DOCX/ODT), formulários em 390/320 px.
- 78 verificações de configuração e sintaxe; 26 verificações da aba Estatísticas, inclusive largura da página no celular.

Nenhuma credencial nem dado real foi utilizado nos testes. Publicação no Netlify permanece pendente, conforme combinado.
