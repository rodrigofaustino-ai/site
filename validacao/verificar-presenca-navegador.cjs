'use strict';
// Usa somente o projeto demo e o Realtime Database Emulator em 127.0.0.1.
const {chromium}=require('playwright-core');const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{let server,browser;try{
 server=http.createServer((req,res)=>{
  if(req.url.startsWith('/fixture?')){
   const uid=new URL(req.url,'http://local').searchParams.get('uid');if(!['a','b'].includes(uid)){res.writeHead(400);return res.end();}
   res.setHeader('Content-Type','text/html');return res.end('<!doctype html><script src="/vendor/firebase-9.23.0/firebase-app-compat.js"></script><script src="/vendor/firebase-9.23.0/firebase-database-compat.js"></script><script>firebase.initializeApp({projectId:"demo-planos-aula",databaseURL:"https://demo-planos-aula.firebaseio.com"});firebase.app().database("https://demo-planos-aula.firebaseio.com").useEmulator("127.0.0.1",9005,{mockUserToken:{sub:"'+uid+'",email:"'+uid+'@example.test"}});window.DIARIO_REALTIME_DATABASE_URL="https://demo-planos-aula.firebaseio.com";window.mockUser={uid:"'+uid+'",email:"'+uid+'@example.test"};firebase.auth=()=>({currentUser:window.mockUser,onAuthStateChanged:fn=>fn(window.mockUser)});window.online=[];document.addEventListener("diario:online",event=>{window.online=event.detail.users;window.presenceStatus=event.detail.status;});</script><script src="/chat-presenca.js"></script>');
  }
  const filename=path.resolve(root,'.'+req.url);if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)){res.writeHead(404);return res.end();}res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(filename));
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const a1=await browser.newPage(),a2=await browser.newPage(),b=await browser.newPage();
 await a1.goto(origin+'/fixture?uid=a');await a2.goto(origin+'/fixture?uid=a');await b.goto(origin+'/fixture?uid=b');
 await b.waitForFunction(()=>window.online.length===2,{},{timeout:20000});assert.deepEqual(await b.evaluate(()=>online.map(user=>user.apelido)),['a','b']);
 await a1.close();await b.waitForTimeout(500);assert.equal(await b.evaluate(()=>online.length),2);
 await a2.close();await b.waitForFunction(()=>window.online.length===1,{},{timeout:20000});assert.equal(await b.evaluate(()=>online[0].apelido),'b');
 await b.evaluate(()=>window.DiarioPresenca.sair());assert.equal(await b.evaluate(()=>online.length),0);
 console.log('Presença com SDK real e emulador: dois professores, duas abas do mesmo professor sem duplicação e remoção ao fechar a última aba/sair passaram.');
}finally{if(browser)await browser.close();if(server)server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
