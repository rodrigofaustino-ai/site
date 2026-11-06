# Etapa 38 — Planner no topo e conferência oculta

Remove o título visível “Meu dia” e o parágrafo introdutório indicado pelo usuário. Move o quadro existente Planner do dia para a primeira posição do painel, seguido da agenda e das revisões de metas. Mantém data/turno, mensagem para dia vazio, texto salvo, atualização e orientação de editar na aba Planner. Remove a borda superior do quadro para compor o topo do cartão.

Oculta a seção inteira freqConferencia (texto introdutório, indicadores e notas da conferência), com hidden e regra CSS explícita. Não remove a lógica de apuração nem altera as marcações, filtros, semanas, estatísticas ou exportações da frequência.

Sem alterações de dados ou regras do Firebase em relação à etapa 37. Publicação apenas do pacote Netlify, para quem já publicou e conferiu a etapa 37.

Verificações locais: integração existente do planner em Meu dia, incluindo datas, conta/turno, cache, confirmação de salvamento, falhas e telas pequenas; frequência com registros e exportações; integridade e referências do pacote oficial. Dados fictícios e rede externa bloqueada nos testes de navegador. Nenhuma publicação automática no Netlify.
