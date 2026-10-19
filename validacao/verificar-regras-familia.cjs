'use strict';
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,query,where,collection,updateDoc,deleteDoc,writeBatch,serverTimestamp,Timestamp}=require('firebase/firestore');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-planos-aula',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync(path.resolve(__dirname,'../firebase/firestore-com-chat.rules'),'utf8')}});
 let count=0;const pass=async promise=>{await assertSucceeds(promise);count++;},fail=async promise=>{await assertFails(promise);count++;};
 try{
  await env.clearFirestore();const a=env.authenticatedContext('a').firestore(),b=env.authenticatedContext('b').firestore(),family=env.unauthenticatedContext().firestore();
  await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,'alunos/aluno-a'),{nome:'Aluno Fictício A',professorUid:'a'});await setDoc(doc(db,'alunos/aluno-b'),{nome:'Aluno Fictício B',professorUid:'b'});});
  const token='a'.repeat(43),now=serverTimestamp(),expires=Timestamp.fromMillis(Date.now()+86400000);
  const invitation={professorUid:'a',alunoId:'aluno-a',apelido:'Aluno',versao:1,ativa:true,criadoEm:now,expiraEm:expires};
  const invitationRef=db=>doc(db,'convitesFamilia/'+token);
  await fail(setDoc(invitationRef(family),invitation));await fail(setDoc(invitationRef(b),invitation));await pass(setDoc(invitationRef(a),invitation));
  await pass(getDoc(invitationRef(family)));await fail(getDocs(collection(family,'convitesFamilia')));await fail(getDoc(doc(family,'alunos/aluno-a')));
  await fail(setDoc(doc(a,'questionariosFamilia/aluno-b'),{professorUid:'a',alunoId:'aluno-b',token,ativa:true,criadoEm:now,expiraEm:expires}));
  await pass(setDoc(doc(a,'questionariosFamilia/aluno-a'),{professorUid:'a',alunoId:'aluno-a',token,ativa:true,criadoEm:now,expiraEm:expires}));
  await fail(getDoc(doc(family,'questionariosFamilia/aluno-a')));await fail(getDoc(doc(b,'questionariosFamilia/aluno-a')));
  const sandbox={window:{}};require('node:vm').runInNewContext(fs.readFileSync(path.resolve(__dirname,'../familia-modelo.js'),'utf8'),sandbox);const answers=Object.fromEntries(sandbox.window.QuestionarioFamiliaModelo.grupos.flatMap(group=>group.perguntas.map(([id])=>[id,'nao_sabe'])));
  const response={professorUid:'a',alunoId:'aluno-a',versao:1,responsavel:'Responsável fictício',vinculo:'Responsável',respostas:answers,observacoes:'Observação fictícia',ciencia:true,enviadoEm:serverTimestamp()};
  const submit=(data,secret=token)=>{const batch=writeBatch(family);batch.set(doc(family,'respostasFamilia/'+secret),data);batch.set(doc(family,'enviosFamilia/'+secret),{enviadoEm:serverTimestamp()});return batch.commit();};
  await fail(setDoc(doc(family,'respostasFamilia/'+token),response));await fail(setDoc(doc(family,'enviosFamilia/'+token),{enviadoEm:serverTimestamp()}));
  await fail(submit({...response,professorUid:'b'}));await fail(submit({...response,respostas:{...answers,comunica_escolha:'invalido'}}));await fail(submit({...response,observacoes:'x'.repeat(2001)}));await fail(submit({...response,respostas:{}}));
  await fail(submit({...response,observacoesPerguntas:{desconhecida:'Texto'}}));
  await fail(submit({...response,observacoesPerguntas:{comunica_escolha:123}}));
  await fail(submit({...response,observacoesPerguntas:{comunica_escolha:'x'.repeat(1001)}}));
  await fail(submit({...response,observacoesPerguntas:'Texto'}));
  const notedToken='n'.repeat(43);await pass(setDoc(doc(a,'convitesFamilia/'+notedToken),invitation));
  await pass(submit({...response,observacoesPerguntas:Object.fromEntries(Object.keys(answers).map(id=>[id,'x'.repeat(1000)]))},notedToken));
  await pass(submit(response));await pass(getDoc(doc(family,'enviosFamilia/'+token)));await fail(getDoc(doc(family,'respostasFamilia/'+token)));
  await pass(getDoc(doc(a,'respostasFamilia/'+token)));await fail(getDoc(doc(b,'respostasFamilia/'+token)));await fail(getDocs(collection(family,'respostasFamilia')));
  await pass(getDocs(query(collection(a,'respostasFamilia'),where('professorUid','==','a'))));await fail(submit(response));await fail(deleteDoc(doc(a,'respostasFamilia/'+token)));
  await pass(updateDoc(invitationRef(a),{ativa:false}));await fail(getDoc(invitationRef(family)));await fail(getDoc(doc(family,'enviosFamilia/'+token)));await pass(getDoc(doc(a,'respostasFamilia/'+token)));
  await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,'convitesFamilia/'+'e'.repeat(43)),{...invitation,criadoEm:new Date(0),expiraEm:new Date(1)});});
  await fail(getDoc(doc(family,'convitesFamilia/'+'e'.repeat(43))));await fail(submit(response,'e'.repeat(43)));
  console.log(count+' verificações de questionários familiares passaram: acesso individual, expiração, revogação, envio único e respostas privadas.');
 }finally{await env.cleanup();}
})().catch(error=>{console.error(error);process.exitCode=1;});
