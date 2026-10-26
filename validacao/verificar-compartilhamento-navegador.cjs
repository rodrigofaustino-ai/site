'use strict';
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');let count=0;const check=(a,b)=>{assert.deepEqual(a,b);count++;};
const mock=`
window.mockStore={
 'alunos/a':{professorUid:'owner',nome:'Aluno fictício',escola:'Escola teste',turma:'3 A',turno:'Matutino',laudo:'LAUDO PRIVADO',contatos:'CONTATO PRIVADO'},
 'alunos/a/pei/atual':{peiHtml:'<h1>PEI de teste</h1><p>Texto do PEI preservado.</p><script>parent.executou=true<\\/script><img src="https://example.test/segredo" onerror="parent.executou=true">',peiData:'2026-10-26'},
 'alunos/a/metas/m1':{objetivo:'Meta fictícia ativa',criterio:'Critério da meta',status:'ativa',situacaoInicial:'DADO NÃO SELECIONADO'},
 'alunos/a/metas/m2':{objetivo:'Meta arquivada',status:'arquivada'},
 'alunos/a/registros/r1':{date:'2026-10-26',text:'Relato fictício selecionável',por:'Professor teste'},
 'alunos/a/registros/r2':{date:'2026-10-25',text:'RELATO NÃO SELECIONADO',por:'Professor teste'}
};
window.writes=[];window.reads=[];window.listeners=new Set();window.failPublication=false;
const clone=d=>d==null?d:JSON.parse(JSON.stringify(d));
function snapshot(ref){
 if(ref.parts.length%2===0){const value=mockStore[ref.path];return {id:ref.parts.at(-1),ref,exists:!!value,data:()=>clone(value)};}
 let docs=Object.entries(mockStore).filter(([p,d])=>p.startsWith(ref.path+'/')&&p.split('/').length===ref.parts.length+1&&ref.filters.every(([k,v])=>d[k]===v)).map(([p,d])=>({id:p.split('/').at(-1),ref:reference(p.split('/')),exists:true,data:()=>clone(d)}));
 if(ref.sort)docs.sort((a,b)=>String(b.data()[ref.sort]||'').localeCompare(String(a.data()[ref.sort]||'')));
 if(ref.limitCount)docs=docs.slice(0,ref.limitCount);return {docs,size:docs.length};
}
function fingerprint(ref){return JSON.stringify(ref.parts.length%2===0?mockStore[ref.path]:snapshot(ref).docs.map(d=>({id:d.id,data:d.data()})));}
window.emit=()=>{for(const sub of [...listeners])queueMicrotask(()=>{const next=fingerprint(sub.ref);if(listeners.has(sub)&&sub.last!==next){sub.last=next;sub.fn(snapshot(sub.ref));}});};
function reference(parts,filters=[]){return {parts,filters,path:parts.join('/'),
 collection:name=>reference([...parts,name]),doc:id=>reference([...parts,id]),
 where(k,op,v){return reference(parts,[...filters,[k,v]]);},orderBy(k){return {...this,sort:k};},limit(v){return {...this,limitCount:v};},
 async get(){reads.push(this.path);if(window.pauseRead&&this.path==='alunos/a')await window.pauseRead;return snapshot(this);},
 onSnapshot(fn,error){const sub={ref:this,fn,error,last:fingerprint(this)};listeners.add(sub);queueMicrotask(()=>{if(listeners.has(sub))fn(snapshot(this));});return ()=>listeners.delete(sub);},
 async set(d){mockStore[this.path]=clone(d);writes.push({path:this.path,data:clone(d)});emit();},
 async update(d){mockStore[this.path]={...mockStore[this.path],...clone(d)};writes.push({path:this.path,data:clone(d)});emit();}
};}
window.mockDb={collection:name=>reference([name]),async runTransaction(fn){const pending=[];await fn({get:r=>r.get(),set:(r,d)=>pending.push({path:r.path,data:clone(d)})});if(failPublication)throw new Error('Falha simulada na publicação');for(const item of pending){mockStore[item.path]=item.data;writes.push(item);}emit();}};
window.authCallbacks=[];window.mockAuth={currentUser:{uid:'owner',email:'owner@example.test',emailVerified:true},onAuthStateChanged(fn){authCallbacks.push(fn);queueMicrotask(()=>fn(this.currentUser));},async signOut(){this.currentUser=null;authCallbacks.forEach(fn=>fn(null));},async signInWithEmailAndPassword(){}};
const firestore=()=>mockDb;firestore.FieldValue={serverTimestamp:()=>({stamp:'teste'})};
window.firebase={initializeApp:()=>({}),auth:()=>mockAuth,firestore};
window.confirm=()=>true;
`;
async function main(){
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://local');
    if(url.pathname==='/__owner'){
      res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="UTF-8"><link rel="stylesheet" href="colaboracao.css"><section id="compartilharAluno"></section><script src="pei-visualizacao.js"></script><script src="colaboracao-modelo.js"></script><script src="colaboracao-servico.js"></script><script src="colaboracao-aluno.js"></script>');return;
    }
    const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;let browser;
  try{
    browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
    const context=await browser.newContext();await context.addInitScript(mock);
    await context.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(origin+'/'))return route.abort();if(url.includes('/vendor/firebase-'))return route.fulfill({body:'',contentType:'application/javascript'});return route.continue();});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/__owner');
    await page.evaluate(()=>ColaboracaoAluno.ativar({alunoId:'a',uid:'owner',db:mockDb,vigente:()=>true}));
    await page.locator('summary').click();check(await page.evaluate(()=>writes.length),0);
    await page.getByRole('button',{name:'Preparar compartilhamento'}).click();
    await page.getByLabel('E-mail da conta do profissional').fill('equipe@example.test');
    await page.getByLabel('Atuação neste aluno').selectOption('coordenacao');
    check(await page.locator('input[type=checkbox]:checked').count(),0);
    check(await page.getByText('Meta arquivada',{exact:true}).count(),0);
    await page.getByLabel('Incluir a cópia integral').check();
    await page.getByLabel('Meta fictícia ativa',{exact:true}).check();
    await page.getByLabel('2026-10-26 · Relato fictício selecionável',{exact:true}).check();
    await page.getByRole('button',{name:'Conferir conteúdo selecionado'}).click();
    check(await page.evaluate(()=>writes.length),0);
    check(await page.getByText('LAUDO PRIVADO',{exact:true}).count(),0);
    check(await page.getByText('CONTATO PRIVADO',{exact:true}).count(),0);
    const preview=page.locator('.colaboracao-preview');await preview.locator('..').locator('summary').click();
    check(await preview.getAttribute('sandbox'),'');
    await page.frameLocator('.colaboracao-preview').getByText('Texto do PEI preservado.').waitFor();
    check(await page.evaluate(()=>!!window.executou),false);
    check((await preview.getAttribute('srcdoc')).includes('onerror='),false);
    await page.evaluate(()=>{failPublication=true;});
    await page.getByRole('button',{name:'Autorizar acesso à cópia conferida'}).click();
    await page.getByText('Falha simulada na publicação',{exact:true}).waitFor();
    check(await page.evaluate(()=>writes.length),0);
    await page.evaluate(()=>{failPublication=false;});
    await page.getByRole('button',{name:'Autorizar acesso à cópia conferida'}).click();
    await page.getByText(/Acesso autorizado\./).waitFor();
    const created=await page.evaluate(()=>writes);check(created.length,3);
    const grantId=created[0].path.split('/')[1];const shared=created.find(d=>d.path.endsWith('/conteudo/atual')).data;
    check(created[0].data.destinatarioEmail,'equipe@example.test');check(created[0].data.papel,'coordenacao');
    check(Object.keys(shared.resumo).sort(),['escola','nome','turma','turno']);
    check(shared.metas.length,1);check(shared.registros.length,1);
    check(JSON.stringify(shared).includes('DADO NÃO SELECIONADO'),false);
    check(JSON.stringify(shared).includes('RELATO NÃO SELECIONADO'),false);
    check(await page.evaluate(()=>mockStore['alunos/a'].laudo),'LAUDO PRIVADO');
    // Qualquer alteração exige nova conferência, sem reutilizar a aprovação antiga.
    await page.getByLabel('E-mail da conta do profissional').fill('outro@example.test');
    check(await page.getByRole('button',{name:'Autorizar acesso à cópia conferida'}).isDisabled(),true);
    await page.getByRole('button',{name:'Revogar acesso'}).click();
    await page.getByText('Acesso revogado.',{exact:true}).waitFor();check(await page.evaluate(id=>mockStore['colaboracoes/'+id].ativo,grantId),false);
    check(await page.evaluate(()=>mockStore['alunos/a/pei/atual'].peiHtml.includes('Texto do PEI preservado.')),true);
    await page.evaluate(()=>ColaboracaoAluno.ativar(null));check(await page.locator('#compartilharAluno').isHidden(),true);
    // A consulta pendente de um aluno não pode remontar sua tela após sair.
    await page.evaluate(()=>{ColaboracaoAluno.ativar({alunoId:'a',uid:'owner',db:mockDb,vigente:()=>true});window.pauseRead=new Promise(resolve=>window.resumeRead=resolve);});
    await page.locator('summary').click();
    await page.getByRole('button',{name:'Preparar compartilhamento'}).click();
    await page.evaluate(()=>{ColaboracaoAluno.ativar(null);window.resumeRead();window.pauseRead=null;});
    check(await page.locator('#compartilharAluno').isHidden(),true);
    check(await page.locator('#compartilharAluno form').count(),0);
    check(errors,[]);
    // Tela do destinatário: só conhece a projeção, nunca consulta alunos privados.
    const recipient=await context.newPage(),recipientErrors=[];recipient.on('pageerror',e=>recipientErrors.push(e.message));
    await recipient.addInitScript(({shared})=>{
      mockAuth.currentUser={uid:'recipient',email:'equipe@example.test',emailVerified:true};
      mockStore['colaboracoes/recebido']={professorUid:'owner',alunoId:'a',destinatarioEmail:'equipe@example.test',papel:'coordenacao',ativo:true};
      mockStore['colaboracoes/recebido/conteudo/atual']=shared;
    },{shared});
    await recipient.goto(origin+'/colaboracao.html');
    await recipient.getByRole('button',{name:'Aluno fictício · Coordenação pedagógica',exact:true}).click();
    await recipient.locator('#col-content h2').waitFor();
    check(await recipient.evaluate(()=>reads.some(p=>p.startsWith('alunos'))),false);
    check(await recipient.locator('#col-content').textContent().then(s=>s.includes('LAUDO PRIVADO')),false);
    await recipient.getByLabel('Sua observação').fill('Observação da equipe de teste.');
    await recipient.getByLabel('Tipo de registro').selectOption('revisao');
    await recipient.getByRole('button',{name:'Registrar observação',exact:true}).click();
    await recipient.getByText('Observação registrada.',{exact:true}).waitFor();
    check(await recipient.evaluate(()=>writes[0].data.autorUid),'recipient');
    check(await recipient.evaluate(()=>writes[0].data.tipo),'revisao');
    check(await recipient.evaluate(()=>writes[0].data.publicacaoId),shared.publicacaoId);
    fs.mkdirSync('/tmp/site-results',{recursive:true});
    await recipient.screenshot({path:'/tmp/site-results/compartilhamento-recebido.png',fullPage:true});
    await recipient.evaluate(()=>{mockStore['colaboracoes/recebido/conteudo/atual'].publicacaoId=crypto.randomUUID();emit();});
    await recipient.getByText(/cópia anterior/).waitFor();
    check(await recipient.getByText(/cópia anterior/).count(),1);
    // Rebaixamento de papel remove a opção de revisão sem recarregar a página.
    await recipient.evaluate(()=>{mockStore['colaboracoes/recebido'].papel='apoio';emit();});
    await recipient.getByRole('button',{name:'Aluno fictício · Professor de apoio',exact:true}).waitFor();
    await recipient.waitForFunction(()=>!document.querySelector('option[value=revisao]'));
    check(await recipient.locator('option[value=revisao]').count(),0);
    // Revogação limpa o conteúdo já exibido e encerra os listeners da cópia.
    await recipient.evaluate(()=>{mockStore['colaboracoes/recebido'].ativo=false;emit();});
    await recipient.getByText('Nenhum conteúdo compartilhado com este e-mail.').waitFor();
    check(await recipient.locator('#col-content').textContent(),'');check(await recipient.locator('#col-notes').textContent(),'');
    // Conta sem verificação não inicia leitura de vínculos ou conteúdo.
    await recipient.evaluate(()=>{mockAuth.currentUser.emailVerified=false;authCallbacks.forEach(fn=>fn(mockAuth.currentUser));reads.length=0;});
    await recipient.getByRole('button',{name:'Enviar verificação para meu e-mail'}).waitFor();check(await recipient.evaluate(()=>reads.length),0);
    check(recipientErrors,[]);await context.close();console.log(count+' verificações de compartilhamento no Chromium aprovadas; Firebase simulado e pedidos externos bloqueados.');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
