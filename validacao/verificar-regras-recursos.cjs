'use strict';
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,updateDoc,getDoc,getDocs,collection,deleteDoc,serverTimestamp}=require('firebase/firestore');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
  const rules=fs.readFileSync(path.resolve(__dirname,'../firebase/compartilhados-teste.rules'),'utf8');
  const env=await initializeTestEnvironment({projectId:'demo-planos-aula',firestore:{host:'127.0.0.1',port:8085,rules}});
  let count=0; const pass=async promise=>{await assertSucceeds(promise);count++;},fail=async promise=>{await assertFails(promise);count++;};
  try{
    await env.clearFirestore();const a=env.authenticatedContext('professor-a'),b=env.authenticatedContext('professor-b'),anon=env.unauthenticatedContext();
    const databases=new Map([[a,a.firestore()],[b,b.firestore()],[anon,anon.firestore()]]);
    const ref=context=>doc(databases.get(context),'recursosDidaticos/recurso-1');
    const data={descricao:'Materiais de alfabetização',link:'https://example.org/materiais',autorUid:'professor-a',autorNome:'Professora A',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    await fail(setDoc(ref(anon),data));await fail(setDoc(ref(b),data));await pass(setDoc(ref(a),data));
    await fail(getDoc(ref(anon)));await pass(getDoc(ref(b)));await pass(getDocs(collection(databases.get(b),'recursosDidaticos')));
    await fail(updateDoc(ref(b),{descricao:'Alteração indevida',updatedAt:serverTimestamp()}));await fail(deleteDoc(ref(b)));
    await fail(updateDoc(ref(a),{autorUid:'professor-b',updatedAt:serverTimestamp()}));await fail(updateDoc(ref(a),{autorNome:'Outra pessoa',updatedAt:serverTimestamp()}));
    await fail(updateDoc(ref(a),{createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
    await fail(updateDoc(ref(a),{descricao:'x'.repeat(1001),updatedAt:serverTimestamp()}));await fail(updateDoc(ref(a),{campoExtra:true,updatedAt:serverTimestamp()}));
    for(const link of ['javascript:alert(1)','data:text/html,teste','ftp://example.org/','https://usuario:senha@example.org/','https://example.org/com espaço'])await fail(updateDoc(ref(a),{link,updatedAt:serverTimestamp()}));
    await pass(updateDoc(ref(a),{link:'https://sites.google.com/recursos',descricao:'Descrição atualizada',updatedAt:serverTimestamp()}));
    await pass(deleteDoc(ref(a)));console.log(count+' verificações de segurança de Recursos Didáticos passaram.');
  }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
