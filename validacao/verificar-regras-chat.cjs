'use strict';
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,updateDoc,getDoc,getDocs,query,limit,orderBy,collection,deleteDoc,serverTimestamp}=require('firebase/firestore');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-planos-aula',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.resolve(__dirname,'../firebase/firestore-com-chat.rules'),'utf8')}});
 let count=0;const pass=async value=>{await assertSucceeds(value);count++;},fail=async value=>{await assertFails(value);count++;};
 try{
  await env.clearFirestore();const a=env.authenticatedContext('a',{email:'a@example.test'}).firestore(),b=env.authenticatedContext('b',{email:'b@example.test'}).firestore(),anonymous=env.unauthenticatedContext().firestore();
  const ref=db=>doc(db,'chatEquipe/mensagem-1');
  const data={texto:'Mensagem fictícia da equipe',autorUid:'a',autorNome:'Professor A',autorEmail:'a@example.test',createdAt:serverTimestamp()};
  await fail(setDoc(ref(anonymous),data));await fail(setDoc(ref(b),data));await pass(setDoc(ref(a),data));
  await fail(getDoc(ref(anonymous)));await pass(getDoc(ref(b)));
  await pass(getDocs(query(collection(b,'chatEquipe'),orderBy('createdAt','desc'),limit(100))));
  await fail(getDocs(collection(b,'chatEquipe')));await fail(getDocs(query(collection(b,'chatEquipe'),limit(101))));
  await fail(updateDoc(ref(a),{texto:'Alteração'}));await fail(updateDoc(ref(b),{texto:'Alteração indevida'}));await fail(deleteDoc(ref(a)));await fail(deleteDoc(ref(b)));
  const other=doc(a,'chatEquipe/mensagem-2');
  await fail(setDoc(other,{...data,autorEmail:'b@example.test'}));await fail(setDoc(other,{...data,texto:''}));await fail(setDoc(other,{...data,texto:'x'.repeat(2001)}));
  await fail(setDoc(other,{...data,createdAt:new Date(0)}));await fail(setDoc(other,{...data,extra:true}));await pass(setDoc(other,{...data,texto:'Outra mensagem válida'}));
  console.log(count+' verificações das regras do chat passaram.');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
