# Etapa 33 — Documento antigo sem pop-up

Ajuste solicitado depois de o usuário confirmar que os alunos têm nomes distintos e documentação própria. Acumulado sobre a etapa 32, ainda sem publicação no oficial.

## Comportamento

PAEE, Diagnóstica e Relatório abertos pelo link do Diário procuram primeiro um documento já associado ao alunoId. Se não houver e existir um único documento antigo da conta com nome correspondente, o vínculo é gravado automaticamente e o documento abre sem confirmação bloqueante e sem exigir Salvar o formulário.

Comparação exata após normalizar espaços, maiúsculas/minúsculas e acentos. Não usa aproximação, abreviações ou IA. Não cria documentos nem associa somente por nome quando há candidatos duplicados ou conflito com outro cadastro vinculado. Nomes vazios não são candidatos legados.

A operação atualiza somente alunoId, em transação. Confere candidatos novamente, responsável autenticado do projeto dos formulários, nome e vínculo atual. Usa a versão do documento lida na transação ao abrir, preservando texto e demais campos salvos. Não altera professorUid, datas, modelos, arquivos ou formatação. A abertura seguinte usa o vínculo, sem nova gravação.

Mudança de acesso, documento ou ambiguidade impede a associação automática. Falha transitória pode abrir o conteúdo já consultado e mostrar um aviso discreto com Tentar associar novamente, sem salvar o formulário inteiro. Fechar/trocar documento/conta invalida respostas antigas; o botão não aplica vínculo a outro estado do formulário. A confirmação de transação já enviada não é cancelada por fechar a página; a próxima abertura confere o banco.

Ao salvar manualmente um documento que continua sem associação, um alunoId vazio é omitido do merge, preservando um vínculo eventualmente gravado por outra sessão. A proteção não substitui um controle geral de concorrência do conteúdo dos formulários.

PEI e Diário já usam o identificador do aluno, sem este pop-up, e não mudaram. A exportação em lote continua sendo leitura: não associa documentos durante downloads; sua conferência de candidatos legados permanece como na etapa 31/32.

## Publicação e dados

Não requer novas regras nem índices. A associação de legado é uma gravação pontual no projeto paee-3fea6 feita na abertura do documento após a publicação. Não é uma migração em massa nem se aplica a documentos que não foram abertos. Leituras e gravação consomem as cotas habituais do Firebase.

Nenhuma credencial nem dado real foi utilizado na preparação; os testes são locais. Esta branch continua ligada aos projetos oficiais. Todas as melhorias anteriores estão acumuladas e a publicação no Netlify permanece pendente.

## Verificações

- 63 verificações de associação automática nos três formulários: sem confirm, atualização exclusiva de alunoId e preservação integral dos demais dados, nova abertura sem gravação, duplicidades, conflito com outro vínculo, nome divergente, outro proprietário, falha/repetição e mudança de sessão durante leitura.
- 58 verificações de vínculo, salvamento, orientações e integração atualizadas para o novo comportamento.
- 10 downloads DOCX/ODT e formulários em 390/320 px confirmados com os exportadores existentes.
- Configuração e sintaxe verificadas. Requisições externas bloqueadas nos testes.
