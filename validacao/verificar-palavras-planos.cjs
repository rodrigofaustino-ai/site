'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,serverTimestamp}=require('firebase/firestore');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-planos-aula',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.resolve(__dirname,'../firebase/firestore-com-chat.rules'),'utf8')}});
 try{
  await env.clearFirestore();const a=env.authenticatedContext('a').firestore(),b=env.authenticatedContext('b').firestore();
  const ref=doc(a,'planosAula/teste');const data={titulo:Array(20).fill('palavra').join(' '),tema:'',descricao:Array(40).fill('conteúdo').join('\n'),autorUid:'a',autorNome:'Professor fictício',uploadedAt:serverTimestamp(),updatedAt:serverTimestamp(),storagePath:'planosAula/a/teste/arquivo.docx',fileName:'plano.docx',fileSize:100};
  await assertSucceeds(setDoc(ref,data));
  await assertFails(updateDoc(ref,{titulo:Array(21).fill('palavra').join(' '),updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(ref,{descricao:Array(41).fill('conteúdo').join(' '),updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(ref,{titulo:' \t\n ',updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(ref,{descricao:' \t\n ',updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(ref,{titulo:'  Título\tcom\nespaços  ',updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(b,'planosAula/teste'),{titulo:'Outro autor',updatedAt:serverTimestamp()}));
  await env.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'planosAula/antigo'),{...data,storagePath:'planosAula/a/antigo/arquivo.docx',titulo:'Plano anterior',tema:'Tema anterior',descricao:'Descrição anterior'}));
  const old=await assertSucceeds(getDoc(doc(a,'planosAula/antigo')));assert.equal(old.data().tema,'Tema anterior');
  await assertSucceeds(updateDoc(doc(a,'planosAula/antigo'),{tema:'',descricao:'Tema anterior\nDescrição anterior',updatedAt:serverTimestamp()}));
  console.log('Limites 20/40 palavras, espaços e quebras de linha, campos vazios, autor e preservação/edição de planos antigos passaram.');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
