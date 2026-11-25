/* Presença por conexão: fechar uma aba não desconecta as demais abas do professor. */
(() => {
  'use strict';
  const auth = firebase.auth();
  let generation=0, own=null, connectedRef=null, root=null, connected=false, currentUser=null;
  let connectedHandler=null, rootHandler=null, list=[], heartbeat=null, refresh=null, offset=0, offsetRef=null, offsetHandler=null,lastSnapshot=null;
  function notify(status='') {
    document.dispatchEvent(new CustomEvent('diario:online',{detail:{users:connected&&lastSnapshot&&!status?list:[],status,available:!!(connected&&lastSnapshot&&!status)}}));
  }
  function release() {
    generation++; connected=false; list=[];lastSnapshot=null;
    clearInterval(heartbeat);clearInterval(refresh);heartbeat=null;refresh=null;
    if(offsetRef && offsetHandler)offsetRef.off('value',offsetHandler);
    if(connectedRef && connectedHandler) connectedRef.off('value',connectedHandler);
    if(root && rootHandler) root.off('value',rootHandler);
    if(own){own.remove().catch(()=>{});own=null;}
    connectedRef=null;root=null;notify();
  }
  async function publish(user, version) {
    if(!connected || version!==generation || own)return;
    const connection=root.child(user.uid).child('conexoes').push(); own=connection;
    try{
      // Registra a remoção no servidor ANTES de anunciar que a conexão está online.
      await connection.onDisconnect().remove();
      if(version!==generation || !connected || !auth.currentUser || auth.currentUser.uid!==user.uid){await connection.remove();return;}
      await connection.set({apelido:user.email.split('@')[0].slice(0,200),email:user.email,desde:firebase.database.ServerValue.TIMESTAMP,atualizadoEm:firebase.database.ServerValue.TIMESTAMP});
      if(version!==generation){await connection.remove();return;}
      clearInterval(heartbeat);heartbeat=setInterval(()=>{if(connected && own===connection)connection.update({atualizadoEm:firebase.database.ServerValue.TIMESTAMP}).catch(()=>{});},30000);
    }catch(_){if(version===generation){if(own===connection)own=null;notify('Não foi possível registrar presença. Confira as regras do Realtime Database.');}}
  }
  function start(user){
    release();currentUser=user;if(!user)return;
    const url=window.DIARIO_REALTIME_DATABASE_URL || (firebase.app && firebase.app().options.databaseURL);
    if(!url || !/^https:\/\/[a-z0-9-]+\.(firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)\/?$/i.test(url)){notify('A lista online precisa da configuração do Realtime Database.');return;}
    if(!firebase.database){notify('Biblioteca de presença indisponível.');return;}
    const version=generation;
    try{
      const realtime=firebase.app().database(url);root=realtime.ref('presencaEquipe');connectedRef=realtime.ref('.info/connected');
      offsetRef=realtime.ref('.info/serverTimeOffset');offsetHandler=snapshot=>{offset=Number(snapshot.val())||0;};offsetRef.on('value',offsetHandler);
      rootHandler=snapshot=>{
        if(version!==generation)return;
        lastSnapshot=snapshot;const users=[];snapshot.forEach(person=>{
          const connections=person.child('conexoes');let first=null;
          connections.forEach(connection=>{const value=connection.val();if(typeof value.atualizadoEm==='number' && Date.now()+offset-value.atualizadoEm<120000)first=value;});
          if(first && typeof first.email==='string')users.push({uid:person.key,apelido:first.email.split('@')[0]});
        });
        list=users.sort((a,b)=>a.apelido.localeCompare(b.apelido,'pt-BR'));notify();
      };
      root.on('value',rootHandler,()=>{if(version===generation){lastSnapshot=null;list=[];notify('Não foi possível consultar quem está online. Confira as regras de presença.');}});
      refresh=setInterval(()=>{if(connected && lastSnapshot)rootHandler(lastSnapshot);},30000);
      connectedHandler=snapshot=>{
        if(version!==generation)return;
        connected=snapshot.val()===true;
        if(connected){own=null;publish(user,version);notify();}else{own=null;notify('Conectando à lista online…');}
      };
      connectedRef.on('value',connectedHandler);
    }catch(_){notify('Não foi possível iniciar a lista online. Confira a URL do Realtime Database.');}
  }
  auth.onAuthStateChanged(start);
  window.DiarioPresenca={async sair(){const previous=own;own=null;if(previous)await Promise.race([previous.remove().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,750))]);release();}};
  window.addEventListener('pagehide',()=>{if(own){own.remove().catch(()=>{});own=null;}});
  window.addEventListener('pageshow',()=>{if(currentUser && connected)publish(currentUser,generation);});
})();
