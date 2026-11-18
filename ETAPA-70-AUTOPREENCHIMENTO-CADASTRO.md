# Dados do Diário nos quatro formulários

PAEE, Relatório e Diagnóstica consultam automaticamente o cadastro do aluno ao abrir um formulário vinculado por alunoId. Uma janela interna da mesma origem reutiliza a sessão padrão do Diário, mantendo o Firebase de documentos separado. Confere mesmo e-mail, proprietário do cadastro e identificador exato; não escolhe aluno pelo nome nem confia no cache de outro aluno/conta. Se a sessão do Diário não estiver disponível, oferece Conectar ao Diário, sem abrir pedido de senha automaticamente.

O PEI usa diretamente o cadastro autorizado do mesmo projeto Firebase, inclusive para completar campos vazios de um PEI salvo. Nos quatro formulários, apenas campos vazios são preenchidos. Não há salvamento automático, atualização de textos pedagógicos ou aplicação de assinaturas por imagem. O professor confere e salva normalmente.

Dados compatíveis: nome, nascimento, escola regular, turma/série, período, laudo/NEE, CIDs, município, dias/horários, nome do professor SRM quando explicitamente cadastrado, mãe/pai pela relação informada e contatos dos responsáveis. Escola SRM e regência/apoio só entram se existirem como dados explícitos; não são inferidos da escola regular. O período SRM do Relatório é traduzido do turno Matutino/Vespertino. Modalidade individual/grupo, censo, avaliações, metas e pareceres continuam manuais.

PAEE, Relatório e Diagnóstica oferecem Responsáveis, contatos e outros dados cadastrais em uma seção de identificação. O PEI incorpora os mesmos campos na identificação. Valores preenchidos nesses campos são salvos e exportados em DOCX/ODT. A tabela de responsáveis por disponibilização de recursos do PAEE não é preenchida com pais/familiares. Campos pessoais não recebem revisão de IA.

A conexão opcional já existente na Diagnóstica permanece, mas agora também preserva qualquer campo preenchido, inclusive ao criar documento. Todas as consultas assíncronas verificam conta, aluno e estado atual antes de aplicar o resultado.

Testes: equivalências e preservação dos quatro formulários, consulta pelo iframe com UIDs distintos e mesmo e-mail, conta incorreta, mensagem forjada, falta de vínculo, contatos, exportação, PEI e ausência de gravação automática. Regressões de vínculo, PEI, IA e consulta anual de frequência foram verificadas com dados fictícios e serviços simulados. Não há novas regras Firebase.
