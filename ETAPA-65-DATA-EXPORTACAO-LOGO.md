# Data de emissão e logo no Relatório

Relatório e Histórico usam a data do dia em America/Sao_Paulo na linha de local e data. O PEI recebe essa data na linha de assinatura marcada pelo gerador, apenas na cópia exportada; a visualização e o formulário mantêm o conteúdo salvo. As datas das assinaturas semestrais da Diagnóstica são preservadas como preenchidas. Datas de nascimento, envio do questionário, avaliação, instrumentos e registros de atendimentos permanecem intactas. Modelos sem linha de local/data não recebem campos novos.

O Relatório exportado incorpora a logo municipal de `modelos/pei-cabecalho.png`, já usada no PEI. A imagem aparece uma única vez, em parágrafo centralizado no corpo inicial, sem cabeçalho repetido. Não aparece no formulário nem é gravada no banco. DOCX e ODT incorporam o PNG; a conversão ODT mantém o alinhamento central. As imagens e espaços das assinaturas permanecem preservados.

Testes locais verificam emissão no fuso brasileiro perto da meia-noite, estado do formulário preservado, imagem idêntica ao recurso municipal, uma única imagem de logo, posição anterior ao título, ausência de cabeçalhos repetidos e conversão nos dois formatos. Não exige novas regras Firebase. Pacote cumulativo.
