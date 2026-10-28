'use strict';
// Testa o produtor real de eventos com o SDK simulado, sem acesso à rede.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const events=[],subscriptions=new Map(),intervals=[];let count=0;
const check=(a,b)=>{assert.deepEqual(a,b);count++;};
const user={uid:'a',email:'a@example.test'},auth={currentUser:user,onAuthStateChanged:fn=>fn(user)};
const snapshot={forEach:fn=>fn({key:'a',child:()=>({forEach:cb=>cb({val:()=>({email:user.email,atualizadoEm:Date.now()})})})})};
function reference(name){return {on(type,fn,error){subscriptions.set(name,{fn,error});if(name==='presencaEquipe')fn(snapshot);if(name==='.info/connected')fn({val:()=>true});if(name==='.info/serverTimeOffset')fn({val:()=>0});},off(){},child:value=>reference(name+'/'+value),push:()=>reference(name+'/conexao'),onDisconnect:()=>({remove:async()=>{}}),set:async()=>{},remove:async()=>{},update:async()=>{}};}
const context={Date,Promise,CustomEvent:function(type,options){this.type=type;this.detail=options.detail;},document:{dispatchEvent:event=>events.push(event.detail)},window:{DIARIO_REALTIME_DATABASE_URL:'https://demo.firebaseio.com',addEventListener(){}},firebase:{auth:()=>auth,database:{ServerValue:{TIMESTAMP:0}},app:()=>({database:()=>({ref:reference})})},setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},setTimeout,clearTimeout};
(async()=>{vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','chat-presenca.js'),'utf8'),context);await Promise.resolve();await Promise.resolve();
 check(events.at(-1).available,true);check(events.at(-1).users.length,1);
 subscriptions.get('presencaEquipe').error();check(events.at(-1).available,false);check(events.at(-1).users.length,0);
 intervals.forEach(fn=>fn());check(events.at(-1).available,false);
 subscriptions.get('presencaEquipe').fn(snapshot);check(events.at(-1).available,true);
 subscriptions.get('.info/connected').fn({val:()=>false});check(events.at(-1).available,false);check(events.at(-1).users.length,0);
 await context.window.DiarioPresenca.sair();check(events.at(-1).available,false);check(events.at(-1).users.length,0);
 console.log(count+' verificações dos estados de presença passaram; SDK simulado, sem rede.');
})().catch(e=>{console.error(e);process.exitCode=1;});
