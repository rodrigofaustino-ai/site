'use strict';
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,deleteDoc,collection,query,where,getDocs,serverTimestamp}=require('firebase/firestore');
const fs=require('node:fs'),path=require('node:path');
const {createMockUserToken}=require('@firebase/util');
function realtime(uid){
 const token=uid?createMockUserToken({sub:uid,email:uid+'@example.test'},'demo-planos-aula'):null;
 return {ref(path){const request=async(method,value)=>{const url='http://127.0.0.1:9005/'+path+'.json?ns=demo-planos-aula'+(token?'&auth='+encodeURIComponent(token):'');const response=await fetch(url,{method,headers:{'Content-Type':'application/json'},...(value===undefined?{}:{body:JSON.stringify(value)}),signal:AbortSignal.timeout(5000)});if(!response.ok){const error=Error('PERMISSION_DENIED');error.code='PERMISSION_DENIED';throw error;}return response.json();};return {set:value=>request('PUT',value),update:value=>request('PATCH',value),remove:()=>request('DELETE'),async once(){const data=await request('GET');return {val:()=>data,child:key=>({exists:()=>!!(data&&data[key])})};}};}};
}
(async()=>{
 const root=path.resolve(__dirname,'..');
 const env=await initializeTestEnvironment({projectId:'demo-planos-aula',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.join(root,'firebase/firestore-com-chat.rules'),'utf8')},database:{host:'127.0.0.1',port:9005,rules:fs.readFileSync(path.join(root,'firebase/presenca-realtime.rules.json'),'utf8')}});
 let count=0;const pass=async promise=>{await assertSucceeds(promise);count++;},fail=async promise=>{await assertFails(promise);count++;};
 try{
  await env.clearFirestore();await fetch('http://127.0.0.1:9005/.json?ns=demo-planos-aula&auth=owner',{method:'DELETE',signal:AbortSignal.timeout(5000)});
  console.log('Emuladores preparados; iniciando verificações de presença.');
  const a=env.authenticatedContext('a',{email:'a@example.test'}),b=env.authenticatedContext('b',{email:'b@example.test'}),anonymous=env.unauthenticatedContext();
  const fa=a.firestore(),fb=b.firestore(),fn=anonymous.firestore(),da=realtime('a'),db=realtime('b'),dn=realtime(null);
  const connection={apelido:'a',email:'a@example.test',desde:{'.sv':'timestamp'},atualizadoEm:{'.sv':'timestamp'}};
  await fail(dn.ref('presencaEquipe').once('value'));await fail(db.ref('presencaEquipe/a/conexoes/aba1').set(connection));
  await pass(da.ref('presencaEquipe/a/conexoes/aba1').set(connection));await pass(da.ref('presencaEquipe/a/conexoes/aba2').set(connection));
  await pass(db.ref('presencaEquipe').once('value'));await fail(db.ref('presencaEquipe/a/conexoes/aba1').remove());
  await fail(da.ref('presencaEquipe/a/conexoes/falsa').set({...connection,email:'b@example.test'}));await fail(da.ref('presencaEquipe/a/conexoes/falsa').set({...connection,extra:true}));
  await pass(da.ref('presencaEquipe/a/conexoes/aba1').update({atualizadoEm:{'.sv':'timestamp'}}));await pass(da.ref('presencaEquipe/a/conexoes/aba1').remove());
  const retained=await db.ref('presencaEquipe/a/conexoes').once('value');if(!retained.child('aba2').exists())throw Error('Fechar uma aba removeu outra conexão.');count++;
  await pass(da.ref('presencaEquipe/a/conexoes/aba2').remove());
  await env.withSecurityRulesDisabled(async context=>{const admin=context.firestore();await setDoc(doc(admin,'chatEquipe/mensagem'),{texto:'Teste',autorUid:'a',autorEmail:'a@example.test',autorNome:'a',createdAt:new Date()});await setDoc(doc(admin,'alunos/aluno-a'),{professorUid:'a'});await setDoc(doc(admin,'alunos/aluno-b'),{professorUid:'b'});});
  const readRef=database=>doc(database,'chatEquipe/mensagem/leituras/b'),receipt={uid:'b',email:'b@example.test',lidoEm:serverTimestamp()};
  await fail(setDoc(readRef(fn),receipt));await fail(setDoc(readRef(fa),receipt));await pass(setDoc(readRef(fb),receipt));await pass(getDoc(readRef(fa)));
  await fail(updateDoc(readRef(fb),{lidoEm:serverTimestamp()}));await fail(deleteDoc(readRef(fb)));await fail(setDoc(doc(fb,'chatEquipe/inexistente/leituras/b'),receipt));
  console.log(count+' verificações de presença e leituras passaram nos emuladores.');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
