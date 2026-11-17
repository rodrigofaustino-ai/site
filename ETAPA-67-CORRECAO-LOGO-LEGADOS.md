# Logo em documentos antigos/importados

A revisão encontrou um caminho que dependia da imagem já existente no HTML salvo: o PEI antigo/importado exportado pela visualização ou pelo gerador de lote. O formulário novo já fornecia a logo, mas o conteúdo antigo podia não contê-la ou usar um endereço externo.

O gerador HTML agora normaliza a logo na cópia exportada: busca o recurso municipal local, remove logos conhecidas (marcador de cabeçalho, nome municipal ou mesmos bytes) e insere uma única logo no começo. Conteúdo textual e imagens de assinaturas permanecem. O banco e a visualização salva não são alterados. Os geradores DOCX diretos da etapa 66 continuam usando o cabeçalho compartilhado.

Validação: seis tipos de documento em DOCX/ODT, mais fluxo real de iframe de lote do PEI antigo sem imagem e com endereço externo quebrado. Confere quantidade, bytes incorporados, posição e ausência de cabeçalhos repetidos. Não foi possível conferir o deploy público por leitura automatizada: o servidor respondeu HTTP 403. Os testes usam os arquivos do pacote e Firebase simulado.

Depois de publicar, atualizar com Ctrl+Shift+R e exportar arquivos novos. Arquivos já baixados não são alterados. Nenhuma regra Firebase nova é necessária.
