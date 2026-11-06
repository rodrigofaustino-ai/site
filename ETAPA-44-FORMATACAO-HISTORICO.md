# Etapa 44 — Formatação do histórico igual ao perfil

O histórico da exportação central usava um modelo HTML simplificado. Agora o perfil e a exportação central usam o mesmo gerador DOCX, extraído do exportador original sem recriar sua formatação. Preserva Arial 11, título, tabelas de identificação e registros, cores verdes, larguras, margens, borda da página e bloco de assinatura. O botão da ficha mantém nome de arquivo, mensagens e uso dos campos de assinatura preenchidos na tela; a exportação central usa os dados salvos, como antes.

Os complementos que já eram incluídos na exportação central (descrições das metas guardadas no registro e próximo passo sem duplicar o relato) permanecem no corpo do atendimento, usando o estilo da tabela original. A exportação central mantém histórico completo e ordenação por data decrescente, com registros sem data válida no fim. Não muda filtros, login, permissões, downloads individuais ou ZIP opcional.

Para ODT, converte o documento DOCX compartilhado diretamente: parágrafos e estilos dos textos, alinhamento, cores, espaçamentos, tabelas com larguras e células mescladas, bordas, preenchimentos, alturas das linhas e layout de página. Não passa pela conversão HTML que descartava os detalhes. O afastamento da borda de página do Word é traduzido para margem e padding ODF, preservando a posição do texto. Não depende de serviços externos. A aparência final pode variar entre editores conforme fontes e suporte ao formato.

## Verificação

`verificar-formatacao-historico.cjs` compara o conteúdo XML e os estilos DOCX do modelo original congelado em `validacao/fixtures/historico-docx-perfil-etapa-43.js` com o gerador compartilhado e também com o botão refatorado da ficha: iguais para o mesmo conteúdo. Verifica as propriedades de layout e valida XML/estilos do ODT, inclusive corpo não itálico, borda e espaço de assinatura. Arquivos usam dados fictícios.

`verificar-exportacao-historico.cjs` confere o fluxo completo e DOCX/ODT reais, dados salvos, ordenação, metas, não duplicação do próximo passo, segurança por conta e zero gravações. Regressões de exportação e configuração oficial também são executadas.

## Publicação manual

Esta etapa não muda regras de Firebase, dados ou serviços remotos. Extraia o pacote completo, publique no Netlify a pasta com index.html, aguarde Published e atualize com Ctrl + Shift + R. Compare o DOCX da ficha com o DOCX de Exportar Documentos usando o mesmo aluno, registros e assinatura já salvos.
