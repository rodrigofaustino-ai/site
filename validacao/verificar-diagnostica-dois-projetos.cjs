'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../diagnostica_formulario.html'),'utf8');
const start=source.indexOf('let dbDiario = null'),end=source.indexOf('</script>',start);let queries=0,field,expectedUid,delay;
const user={uid:'DIARIO-UID',email:'a@example.test'},authDiary={currentUser:user};
const row={id:'aluno-1',data:()=>({nome:'Fictício',escola:'Escola do Diário',dataNasc:'2020-01-01'})};
const db={collection:()=>({where(f,op,uid){field=f;expectedUid=uid;return {async get(){queries++;if(delay)await delay;return {docs:[row]};}};},doc:()=>({collection:()=>({orderBy:()=>({limit:()=>({get:async()=>({docs:[]})})})})})})};
const context={window:{SRMFirebaseConfig:{projectId:'salamulti'}},document:{addEventListener(){}},firebaseReady:true,firebase:{apps:[],initializeApp:()=>({}),firestore:()=>db,auth:()=>authDiary},auth:{currentUser:{uid:'DOCUMENTO-UID',email:user.email}},professorUid:'DOCUMENTO-UID',state:{alunoId:'aluno-1',identificacao:{nome:'Fictício',escolaRegular:'Texto já preenchido'}},console,renderForm(){},showToast(){}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
(async()=>{
 let n=0;const check=(a,b)=>{assert.deepEqual(a,b);n++;};
 await context.preencherDoPerfilDiario('Fictício',true);check(field,'professorUid');check(expectedUid,'DIARIO-UID');check(context.state.identificacao.escolaRegular,'Texto já preenchido');check(context.state.identificacao.dataNascimento,'2020-01-01');
 authDiary.currentUser=null;let before=queries;check(await context.buscarPerfilDiario('Fictício','aluno-1'),null);check(queries,before);
 authDiary.currentUser={uid:'outro',email:'b@example.test'};check(await context.buscarPerfilDiario('Fictício','aluno-1'),null);check(queries,before);
 authDiary.currentUser=user;let release;delay=new Promise(resolve=>release=resolve);context.state.identificacao.dataNascimento='';const pending=context.preencherDoPerfilDiario('Fictício',true);authDiary.currentUser={uid:'outra-conta',email:user.email};release();await pending;check(context.state.identificacao.dataNascimento,'');
 console.log(n+' verificações de identidade entre projetos, campos existentes e troca de conta passaram.');
})().catch(e=>{console.error(e);process.exitCode=1;});
