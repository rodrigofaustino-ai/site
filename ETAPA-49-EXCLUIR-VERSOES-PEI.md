# Etapa 49 — Excluir versões anteriores do PEI

Adiciona Excluir ao lado de Visualizar nas versões anteriores do PEI, em Documentos anteriores e versões salvas. Abrange versões do formulário e importadas que estejam em documentos `versao-*`. O documento `atual` não recebe esse botão, mesmo quando aparece na lista como PEI importado.

A confirmação informa aluno, tipo/data da versão e que a exclusão é definitiva pelo site. Cancelar não envia nenhuma escrita. O texto de apresentação da seção foi atualizado para distinguir consulta e exclusão.

A operação confirma no servidor, em transação, que a conta ainda é a mesma, que o aluno ainda pertence ao usuário e que a versão não mudou desde a consulta. Apaga apenas o documento selecionado na subcoleção `alunos/{alunoId}/pei`; não altera o cadastro, o documento atual, outros históricos, publicações de colaboração ou arquivos já baixados. Não limpa nem salva o formulário em edição, preservando o rascunho e a comparação utilizada pelo salvamento do PEI.

A interface bloqueia ações conflitantes enquanto confirma a exclusão. Depois de confirmada, remove a linha e limpa a prévia somente se aquela versão estava em exibição. Se outra versão estiver aberta, sua prévia permanece. O foco volta para um controle próximo. Quando não restam versões anteriores, mostra a mensagem correspondente.

Permissão negada, mudança de versão ou falha de rede mostram uma mensagem junto da versão e no status do histórico. Se a confirmação de escrita se perder, não presume que a exclusão foi desfeita: orienta atualizar o histórico. Uma tentativa repetida reconhece que o documento já não existe e remove apenas a linha antiga, sem escrever novamente nem restaurar conteúdo. Logout ou troca de contexto durante a leitura impedem usar a resposta antiga na interface.

## Regras e validação

Não muda regras do Firebase. As regras existentes já autorizam a conta responsável pelo aluno e a administração já prevista a gerenciar sua subcoleção de PEI. Os testes com outro professor sem essa permissão e com anônimo foram bloqueados. A restrição deste botão a `versao-*`, protegendo `atual`, está na ação da interface — não constitui uma nova restrição global de regras sobre todas as APIs administrativas.

- `verificar-pei-exclusao-historico.cjs`: cancelamento, confirmação, versão escolhida, atual/rascunho preservados, prévias, falha de permissão/rede, conflito, confirmação perdida, repetição idempotente, logout e celular. Dados e Firebase simulados.
- `verificar-pei-historico-regras.cjs`: emulador com as regras de produção existentes; permite ao dono excluir a versão de teste, bloqueia outra conta/anônimo e confere que atual/cadastro permaneceram iguais. Não acessa dados reais.
- `verificar-pei-formulario.cjs`: regressões de consulta/formatação, histórico, salvamento, IA e DOCX/ODT.
- Verificações de carregamento/configuração e sintaxe do pacote completo.

## Publicação manual

Extraia o pacote completo da etapa 49 e publique no Netlify a pasta que contém index.html. Aguarde Published e atualize com Ctrl + Shift + R. Não há atualização de regras. Não foi realizado deploy nem exclusão de dados reais pelo assistente.

Para usar: abra o PEI do aluno → Consultar histórico → confira a versão com Visualizar → Excluir na linha desejada → confirme. O PEI atual permanece salvo. Para testar, use uma versão fictícia que realmente deseja remover: não existe recuperação dessa versão pela interface do site.
