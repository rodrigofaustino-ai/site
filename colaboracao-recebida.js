(() => {
  'use strict';
  const auth=firebase.auth(),db=firebase.firestore(),$=id=>document.getElementById(id);
  const {n,botao,erro,mostrarPublicacao,observacoes}=ColaboracaoServico;
  let epoch=0,stopList=()=>{},stopContent=()=>{},stopNotes=()=>{},selected=null,selectedRole=null,selection=0;
  function limpar(){selection++;stopContent();stopNotes();stopContent=stopNotes=()=>{};selected=null;selectedRole=null;$('col-content').replaceChildren();$('col-notes').replaceChildren();}
  $('col-login').addEventListener('submit',async e=>{e.preventDefault();$('col-status').textContent='Entrando…';try{await auth.signInWithEmailAndPassword($('col-email').value.trim(),$('col-password').value);$('col-password').value='';}catch(e){$('col-status').textContent='Não foi possível entrar. Confira a conta do Firebase de teste e sua senha.';}});
  function iniciar(user){
    const version=++epoch;stopList();limpar();$('col-list').replaceChildren();$('col-account').replaceChildren();$('col-status').textContent='';$('col-login').hidden=!!user;if(!user)return;
    const valid=()=>version===epoch&&auth.currentUser?.uid===user.uid;
    $('col-account').append(n('p',user.email),botao('Sair',()=>auth.signOut()),botao('Atualizar acessos',()=>iniciar(auth.currentUser)));
    if(!user.emailVerified){
      $('col-status').textContent='Verifique seu e-mail antes de consultar conteúdos compartilhados. O acesso é destinado à conta verificada desse endereço.';
      $('col-account').append(botao('Enviar verificação para meu e-mail',async()=>{try{await user.sendEmailVerification();if(valid())$('col-status').textContent='Verificação enviada. Confira sua caixa de entrada.';}catch(e){if(valid())$('col-status').textContent=erro(e);}}),botao('Já confirmei: verificar novamente',async()=>{try{await user.reload();await user.getIdToken(true);if(valid())iniciar(auth.currentUser);}catch(e){if(valid())$('col-status').textContent=erro(e);}}));return;
    }
    const email=ColaboracaoModelo.email(user.email);
    stopList=db.collection('colaboracoes').where('destinatarioEmail','==',email).where('ativo','==',true).onSnapshot(snap=>{
      if(!valid())return;const docs=snap.docs;
      if(selected&&!docs.some(d=>d.id===selected))limpar();$('col-list').replaceChildren();
      if(!docs.length)$('col-status').textContent='Nenhum conteúdo compartilhado com este e-mail.';else $('col-status').textContent='Escolha um acesso. Somente o conteúdo selecionado pelo responsável será exibido.';
      for(const doc of docs){const grant=doc.data(),button=botao('Consultar conteúdo · '+ColaboracaoModelo.papeis[grant.papel],()=>abrir(doc.id,grant));$('col-list').append(button);
        doc.ref.collection('conteudo').doc('atual').get({source:'server'}).then(snap=>{if(valid()&&button.isConnected){if(!snap.exists)throw new Error('Cópia ausente.');button.textContent=snap.data().resumo.nome+' · '+ColaboracaoModelo.papeis[grant.papel];}}).catch(()=>{if(valid()&&button.isConnected){button.textContent='Conteúdo indisponível · '+ColaboracaoModelo.papeis[grant.papel];button.disabled=true;}});
        if(selected===doc.id&&selectedRole!==grant.papel)abrir(doc.id,grant);
      }
    },e=>{if(valid()){limpar();$('col-list').replaceChildren();$('col-status').textContent=erro(e);}});
    function abrir(id,grant){
      limpar();selected=id;selectedRole=grant.papel;const serial=selection,current=()=>valid()&&selected===id&&serial===selection;
      $('col-status').textContent='Consultando cópia compartilhada…';
      stopContent=db.collection('colaboracoes').doc(id).collection('conteudo').doc('atual').onSnapshot(snap=>{
        if(!current())return;stopNotes();$('col-content').replaceChildren();$('col-notes').replaceChildren();
        if(!snap.exists){$('col-status').textContent='Cópia indisponível.';return;}
        const p=snap.data();mostrarPublicacao($('col-content'),p);$('col-status').textContent='Cópia compartilhada · '+ColaboracaoModelo.papeis[grant.papel];
        stopNotes=observacoes({root:$('col-notes'),db,grantId:id,publicacao:p,user,papel:grant.papel,vigente:current});
      },e=>{if(current()){limpar();$('col-status').textContent=erro(e);}});
    }
  }
  auth.onAuthStateChanged(iniciar);
})();
