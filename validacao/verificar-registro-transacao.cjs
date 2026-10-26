'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const {setLogLevel}=require('firebase/firestore');setLogLevel('silent');
// Carrega o mesmo serviço usado no navegador, sem inicializar sua interface.
global.window={};global.document={readyState:'loading',addEventListener(){}};
require('../registro-assistido.js');const service=window.RegistroAssistido;delete global.window;delete global.document;
let checks=0;const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
async function main(){
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8087');
  const env=await initializeTestEnvironment({projectId:'demo-colaboracao',firestore:{host:'127.0.0.1',port:8087,rules:fs.readFileSync(path.join(__dirname,'../firebase/compartilhamento-teste.rules'),'utf8')}});
  try{
    await env.clearFirestore();await env.withSecurityRulesDisabled(async context=>{await context.firestore().collection('alunos').doc('aluno-a').set({professorUid:'a',nome:'Aluno fictício',ultimoRegistro:'2026-10-20'});});
    const owner=env.authenticatedContext('a',{email:'a@example.test'}).firestore(),other=env.authenticatedContext('b',{email:'b@example.test'}).firestore();
    const ticket={id:randomUUID(),payload:{date:'2026-10-10',text:'Relato fictício',humor:'Bem',por:'Professor fictício',createdAt:'2026-10-26T12:00:00.000Z',metaIds:['m1'],metaVinculos:[{id:'m1',objetivo:'Objetivo fictício',revision:2}]}};
    const save=(db,t=ticket,vigente=()=>true)=>service.salvarBanco({db,alunoId:'aluno-a',uid:'a',ticket:t,vigente});
    await save(owner);check((await owner.collection('alunos').doc('aluno-a').get()).data().ultimoRegistro,'2026-10-20');
    check((await owner.collection('alunos/aluno-a/registros').get()).size,1);
    await save(owner);check((await owner.collection('alunos/aluno-a/registros').get()).size,1);
    check((await owner.collection('alunos/aluno-a/registros').doc(ticket.id).get()).data().metaVinculos,ticket.payload.metaVinculos);
    const next={id:randomUUID(),payload:{...ticket.payload,date:'2026-10-27'}};
    await save(owner,next);check((await owner.collection('alunos').doc('aluno-a').get()).data().ultimoRegistro,'2026-10-27');
    check((await owner.collection('alunos/aluno-a/registros').get()).size,2);
    await assert.rejects(save(owner,{...ticket,payload:{...ticket.payload,text:'Texto diferente'}}),/mudou/);checks++;
    check((await owner.collection('alunos/aluno-a/registros').doc(ticket.id).get()).data().text,'Relato fictício');
    await assert.rejects(save(other,{id:randomUUID(),payload:ticket.payload}));checks++;
    await assert.rejects(save(owner,{id:randomUUID(),payload:ticket.payload},()=>false),/conta mudou/);checks++;
    check((await owner.collection('alunos/aluno-a/registros').get()).size,2);
    await env.withSecurityRulesDisabled(async context=>{await context.firestore().collection('alunos').doc('aluno-a').update({professorUid:'b'});});
    await assert.rejects(save(owner,{id:randomUUID(),payload:ticket.payload}));checks++;
    check((await other.collection('alunos/aluno-a/registros').get()).size,2);
    console.log(checks+' verificações do salvamento real em transação passaram no emulador.');
  }finally{await env.cleanup();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
