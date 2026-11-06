# Publicar anexos do chat — etapa 40

1. Guarde cópias das regras publicadas atuais, de Firestore e Storage.
2. No projeto **salamulti → Firestore Database → Regras**, publique o conteúdo completo de `producao/salamulti.rules` desta etapa.
3. No mesmo projeto, em **Storage → bucket salamulti.firebasestorage.app → Regras**, publique o conteúdo completo de `producao/salamulti-storage.rules`. Esse arquivo preserva as regras de planos de aula fornecidas na conversa.
4. Se o Console pedir habilitar acesso das regras do Storage ao Cloud Firestore, siga a autorização apresentada: o novo bloco usa `firestore.get/exists` para conferir se a mensagem permite acesso ao anexo. Não é necessário criar outro banco, bucket ou projeto.
5. Publique o ZIP completo da etapa 40 no Netlify, extraindo e arrastando a pasta que contém `index.html`, `vendor` e `modelos`. Aguarde Published e atualize com Ctrl + Shift + R.
6. Teste com um arquivo fictício: seleção não publica sozinha; Enviar publica; outra conta pode abrir/baixar; Responder mantém a referência; Apagar retira o conteúdo para ambas as contas. Confira também um plano de aula já salvo.

Não altere o Realtime Database nem as regras de paee-3fea6. As alterações de regras mantêm mensagens antigas de texto válidas, então podem ser publicadas antes do novo código do site. Esta versão usa um arquivo por mensagem, até 10 MB.
