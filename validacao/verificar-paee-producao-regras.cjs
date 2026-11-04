'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,query,where,updateDoc,deleteDoc,setLogLevel}=require('firebase/firestore');
setLogLevel('silent');
(async()=>{
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8087');
 const env=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules:fs.readFileSync(path.join(__dirname,'../producao/paee.rules'),'utf8')}});
 let n=0;const yes=async p=>{await assertSucceeds(p);n++;},no=async p=>{await assertFails(p);n++;};
 try {
 await env.clearFirestore();
 const a=env.authenticatedContext('a').firestore(),b=env.authenticatedContext('b').firestore(),admin=env.authenticatedContext('A1Zn1xCUUvVM1YkqCtnULzPblI43').firestore(),wrongAdmin=env.authenticatedContext('vYUoFHRjbmVaj6Do58NjKQsFuql2').firestore(),anon=env.unauthenticatedContext().firestore();
 for(const name of ['paee_alunos','diagnostica_srm','relatorios_srm']) {
 const ref=db=>doc(db,name,'legado');
 await env.withSecurityRulesDisabled(c=>setDoc(ref(c.firestore()),{professorUid:'a',identificacao:{nome:'Fictício'},conteudo:'Documento antigo'}));
 await yes(getDoc(ref(a)));await yes(getDocs(query(collection(a,name),where('professorUid','==','a'))));
 await no(getDoc(ref(b)));await no(getDoc(ref(anon)));await no(getDoc(ref(wrongAdmin)));
 await no(updateDoc(ref(b),{professorUid:'b'}));await no(updateDoc(ref(a),{professorUid:'b'}));
 await yes(updateDoc(ref(a),{conteudo:'Revisão'}));await no(setDoc(doc(b,name,'forjado'),{professorUid:'a'}));
 await yes(getDoc(ref(admin)));await yes(updateDoc(ref(admin),{professorUid:'b'}));await no(getDoc(ref(a)));await yes(getDoc(ref(b)));
 await no(deleteDoc(ref(a)));await yes(deleteDoc(ref(admin)));
 await yes(setDoc(doc(a,name,'novo'),{professorUid:'a',alunoId:'id-do-diario'}));await no(getDocs(collection(b,name)));
 }
 console.log(n+' verificações das regras de documentos oficiais passaram, somente com dados fictícios.');
 } finally {await env.cleanup();}
})().catch(e=>{console.error(e);process.exitCode=1;});
