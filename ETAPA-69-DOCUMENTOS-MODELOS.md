# Biblioteca de modelos compartilhados

A aba Doc. Modelos fica antes de Exportar Documentos. Todos os professores autenticados podem enviar DOCX ou PDF de até 10 MB, pesquisar e baixar arquivos. O autor exclui os próprios modelos; a conta administrativa identificada por UID e e-mail pode excluir qualquer um. Arquivos de alunos, formulários e exportações ficam preservados. A biblioteca entrega os bytes originais, sem adicionar logo ou modificar conteúdo.

Metadados ficam na coleção documentosModelos, e o arquivo em documentosModelos/{autorUid}/{id}/arquivo no Storage. Publicação consulta o servidor e usa ID estável na repetição de uma tentativa. Envios pendentes podem ser repetidos ou descartados. A exclusão primeiro desativa o modelo, remove o arquivo e apaga o metadado; caso interrompida, o autor/administrador pode concluir depois. Conta/saída invalidam operações e limpam a interface. A descrição recebe a revisão de IA já usada pelos professores, somente por clique.

As regras são novas e precisam ser adicionadas ao Firestore e ao Storage de salamulti. Leia producao/GUIA-DOCUMENTOS-MODELOS-FIREBASE.txt. Não aplicadas pelo assistente. As regras anteriores foram preservadas; nenhum projeto remoto foi alterado.

Testes no Chromium usam Firebase simulado e cobrem navegação, envio, bytes do download, pesquisa, autor/colega/administrador, falha e retomada, exclusão, celular e saída. Os emuladores reais de Firestore e Storage conferem autenticação, autoria, tipos/limites, acesso por publicação, administração e preservação de planos de aula. Não usam dados de alunos reais.
