# Etapa 41 — Avisos e mensagens aos professores

Dois botões após Exportar Documentos, exclusivos de `rodrigofaustino@gmail.com`, UID `xF20nknLCsZxk0giHFso8NqV8KH3` no projeto salamulti. A autorização exige ambos no cliente e nas regras; a administração geral antiga continua com suas permissões anteriores.

O administrador escreve título (até 120 caracteres) e texto (até 4.000), publica e pode desativar. O painel mostra até 100 publicações recentes, filtradas pelo tipo. Textos publicados são imutáveis: para corrigir, desative e publique outro. Não há envio automático de conteúdo, imagens, agendamento ou notificações por e-mail.

Ao selecionar o turno, o site consulta publicações ativas no servidor: avisos primeiro e mensagens depois, do mais antigo para o mais recente. Avisos exigem Entendi; Escape não os confirma. Mensagens têm somente Fechar; Escape equivale a Fechar. Se o professor sair sem concluir, o conteúdo reaparece na próxima seleção de turno. A seleção de outro turno não repete um conteúdo já concluído.

A conclusão é gravada em `comunicadosRecebidos/{uid}/itens/{id}` e vale em outros computadores. Cada conta consulta apenas seus próprios recibos. Não há painel público de leitura, e fechar uma mensagem não é apresentado como confirmação de leitura. A publicação fica em `comunicadosEquipe/{id}`. Transações evitam duplicar a mesma tentativa de publicação e não sobrescrevem recibos. Falhas mantêm o popup disponível para nova tentativa; sem conexão, não se presume conclusão. Logout descarta diálogos e resultados de consultas antigas.

O conteúdo é texto simples, com quebras de linha e emojis. O diálogo tem título acessível, foco e contenção pelo dialog nativo, largura adaptada ao celular e rolagem para textos longos. O formulário bloqueia alterações enquanto publica.

## Publicação manual

1. Guarde uma cópia das regras atuais de salamulti → Firestore Database → Regras.
2. Substitua pelo conteúdo completo de `producao/salamulti.rules` desta etapa e publique.
3. Publique o pacote completo da etapa 41 no Netlify, após extrair o ZIP. Arraste a pasta que contém index.html. Aguarde Published e atualize com Ctrl + Shift + R.
4. Na conta administradora, publique um aviso fictício e uma mensagem. Em uma conta de professor, selecione o turno, confirme o aviso e feche a mensagem. Troque de turno e confira que não repetem. Publique outro e confira que aparece na próxima seleção. Teste também desativar antes de outra conta abrir.

Storage permanece com as regras de anexos da etapa 40 já publicadas e confirmadas pelo usuário; Realtime Database e paee-3fea6 não mudam. Nenhuma regra, dado ou deploy de produção foi alterado pelo assistente.

## Validação

`verificar-comunicados-regras.cjs`: emulador Firestore, criação exclusiva pela conta, limites, autoria, relógio do servidor, conteúdo imutável, desativação, recibos privados e imutáveis.

`verificar-comunicados-navegador.cjs`: Chromium com Firebase simulado e dados fictícios, dois computadores da mesma conta, ordem, Escape, falha de gravação, reenvio, logout, desativação, texto seguro e largura de 320 px.

`verificar-firebase-producao.cjs`: sintaxe e configuração oficial, recursos locais e carregamento sem pedidos externos.
