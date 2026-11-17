# Logo municipal nos documentos

A exportação de PAEE, Diagnóstica, Histórico de atendimentos, Questionário da família e relatório de Frequência recebe a imagem municipal já usada no PEI e Relatório. A logo fica em um parágrafo centralizado no começo do corpo: aparece uma vez, não é cabeçalho repetido e permanece incorporada ao arquivo. Os dois geradores existentes continuam sem duplicação. A imagem do PEI fica centralizada também na conversão HTML.

Os métodos compartilhados `SRMExport.cabecalhoDocx` e `cabecalhoHtml` reutilizam o recurso local. O carregamento falho bloqueia a geração e pode ser repetido. DOCX e ODT incorporam o PNG. O conversor do Histórico preserva o alinhamento do parágrafo e a imagem; o conversor geral possui estilo próprio para o cabeçalho, independente das assinaturas.

A alteração vale na exportação individual, pela lista e por Exportar Documentos, que compartilham os geradores. Não grava dados, modifica formulários nem repete a logo nas páginas seguintes. A regra de data final de emissão da etapa 65 e todas as demais datas são preservadas.

Testes locais conferem cinco documentos nos dois formatos, bytes da imagem, uma logo, posição inicial, ausência de cabeçalho repetido e alinhamento. A validação da Frequência cobre suas exportações DOCX/ODT. Nenhuma regra Firebase nova é necessária.
