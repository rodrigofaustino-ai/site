# Atualização de https://saladerecursos.netlify.app/

Pacote de produção, separado da branch de teste. Não publique em srmteste: esta branch usa dados oficiais.

## O que este pacote faz

Mantém salamulti para Diário, alunos, PEI, metas, frequência, planner, notas, chat e colaboração. Mantém paee-3fea6 para PAEE, Diagnóstica e Relatório, com os mesmos IDs e sessões de autenticação originais. Não importa nem move dados e não reutiliza UIDs entre projetos. Remove avisos de teste. Inclui todas as melhorias até a etapa 25.

A Diagnóstica tem uma conexão opcional e explícita ao Diário para preencher campos vazios da identificação. É preciso usar o mesmo e-mail nos dois projetos; cada consulta usa o UID do respectivo projeto. Falha de acesso não impede preenchimento manual. Esse controle não integra a impressão nem exportação.

A antiga transferência administrativa reutilizava UIDs entre projetos e procurava formulários por nome. Sua rotina de gravação está removida nesta versão: a consulta permanece, a transferência está bloqueada até uma revisão própria. As contas administrativas e permissões do banco continuam preservadas.

## Ordem de publicação manual

1. Guardar o ZIP oficial recebido (19-10-2026.zip), os textos completos das regras atuais dos dois projetos e o identificador da última publicação oficial no Netlify. Guardar backup dos registros dos dois bancos e dos arquivos relevantes do Storage por ferramenta autorizada do projeto. ZIP do site não contém os dados do banco. A preparação local não realizou esse backup dos dados.
2. Em Authentication → Settings → Authorized domains dos DOIS projetos, conferir saladerecursos.netlify.app. Manter os domínios já autorizados. Não mudar contas, senhas nem UIDs.
3. Combinar publicação em horário sem edições dos professores. Revalidar se as regras publicadas não mudaram desde as cópias recebidas.
4. No Firestore de salamulti, publicar o texto COMPLETO de producao/salamulti.rules. Não usar arquivos de teste nem o arquivo de outro projeto.
5. No Firestore de paee-3fea6, publicar o texto COMPLETO de producao/paee.rules. Não mudar Realtime Database ou Storage. A URL pública de presença foi preservada do oficial; a disponibilidade real depende das regras/configuração já existentes, não verificadas remotamente.
6. Publicar esta branch no Netlify do site saladerecursos, arrastando a pasta que contém index.html e vendor. Não arrastar a pasta pai nem o ZIP. Aguardar Published, atualizar com Ctrl+Shift+R.
7. Conferir com dois professores: respectivos alunos, histórico PEI e registros, frequência já existente, planner, documentos antigos em cada formulário (com login próprio), salvar/reabrir um registro de teste autorizado e chat. Verificar exclusividade de acesso; não criar alunos reais para testar. Dados antigos sem alunoId pedem confirmação de vínculo ao salvar; homônimos não devem ser vinculados automaticamente.
8. Só depois comunicar liberação aos professores.

## Retorno à versão anterior

Se houver problema, interromper edições, republicar o deploy anterior no Netlify e analisar a causa. Retornar código não desfaz gravações feitas no banco. Não restaurar regras antigas automaticamente: elas tinham acesso amplo às subcoleções e permitem alteração de proprietário pelo próprio professor em algumas coleções. Uma reversão de permissões exige avaliação específica.

## Validações locais

Todos os testes usam dados fictícios. Emulador não consultou bancos reais. Testes de navegador bloqueiam pedidos externos. Eles não confirmam configuração atual de Authentication, índices, Realtime Database, Storage ou integridade dos dados reais.

Com NODE_PATH apontando para as dependências de validação:
- verificar-firebase-producao.cjs: 66 verificações de configuração, sintaxe e carregamento das 7 páginas, inclusive falha de configuração sem fallback.
- verificar-diagnostica-dois-projetos.cjs: 9 verificações de UIDs distintos, usuário incompatível, campos preenchidos e troca de conta.
- verificar-regras-acesso-alunos.cjs (SRM_PRODUCAO=1): 106 verificações incluindo família e transferência administrativa de propriedade no banco.
- verificar-compartilhamento-regras.cjs (SRM_PRODUCAO=1): 80 verificações.
- verificar-chat-exclusao-regras.cjs (SRM_PRODUCAO=1): 41 verificações.
- verificar-paee-producao-regras.cjs: 51 verificações dos 3 formulários, proprietário, visitante e administrador específico.
- verificar-chat-navegador.cjs e verificar-chat-emojis-exclusao-navegador.cjs: chat compacto e fluxos de envio, leitura, busca, emojis e exclusão simulados.
- verificar-navegador.cjs: 10 downloads DOCX/ODT e formulários em 390/320 px.

Nenhuma publicação remota ou atualização de regra foi realizada pelo assistente.
