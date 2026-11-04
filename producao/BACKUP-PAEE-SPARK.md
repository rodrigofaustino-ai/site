# Backup dos formulários no plano Spark

Abra backup-documentos.html no navegador, mantendo na mesma pasta firebase-producao.js, backup-documentos-modelo.js, backup-documentos.js e vendor. A pasta inteira extraída do ZIP contém esses arquivos. Não é necessário publicar a atualização no Netlify para usar esta página. A conexão real depende de acesso à internet, configuração existente da API e credenciais válidas; o teste automatizado usa Firebase simulado e não valida a conta real.

1. Combine um intervalo sem edição dos formulários.
2. Entre somente nesta página com a conta administrativa do projeto paee-3fea6 (UID A1Zn1xCUUvVM1YkqCtnULzPblI43). Não envie senhas ao assistente.
3. Clique em Ler os três tipos de documentos e baixar backup. Aguarde a leitura terminar e salve o arquivo JSON em pasta protegida.
4. Em Conferir o arquivo baixado, selecione o JSON para verificar hash e quantidades. Essa conferência é local, sem upload.
5. Confira as quantidades exibidas e guarde outra cópia protegida. Para orientar o próximo passo, informe ao assistente apenas sucesso e quantidades; não envie o arquivo contendo dados dos alunos.
6. Clique em Sair e feche a página. Se falhar, informe apenas a mensagem de erro.

## Escopo e limites

Copia somente os documentos das coleções raiz paee_alunos, diagnostica_srm e relatorios_srm do Firestore (default) de paee-3fea6, as três coleções permitidas nas regras recebidas. Não é uma exportação gerenciada do Google e não pode ser importado pelo botão Importar do console. É uma cópia própria, com IDs e campos tipados; eventual restauração requer ferramenta específica com simulação e controle de conflitos, ainda não incluída. Não há botão de restauração ou nenhuma gravação nesta página.

Não inclui Storage, subcoleções não identificadas, Authentication, regras ou índices. Não garante fotografia atômica de edições simultâneas. A cópia SHA-256 verifica integridade do arquivo exportado, não a ausência de mudanças no banco ou que todas as fontes tenham sido identificadas. Confirme separadamente se existem arquivos e outras coleções/subcoleções relevantes antes de considerar concluída a cobertura dos dados.

As leituras contam para as cotas do Firestore Spark. A página usa memória para a sessão administrativa, não grava senhas ou documentos no localStorage/IndexedDB do aplicativo e não usa serviço externo para processar o backup. O download fica no computador e contém informações dos alunos.

## Teste

NODE_PATH=/tmp/site-validation/node_modules node validacao/verificar-backup-documentos.cjs

Chromium com Firebase simulado, todos os pedidos externos bloqueados: 201 PAEE + 1 diagnóstica + 0 relatórios (fictícios), paginação de 200, origem servidor, carimbos de tempo com nanossegundos, arrays e números especiais, integridade do JSON salvo/alterado, rejeição de não administrador antes de ler, ausência de download parcial após falha e ausência de download após sair durante leitura.
