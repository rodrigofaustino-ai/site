const fs=require('fs'),path=require('path'),assert=require('assert'),acorn=require('acorn');
const {JSDOM}=require('jsdom');const docx=require('docx'),JSZip=require('jszip');
const pdfMake=require('pdfmake/build/pdfmake');pdfMake.addVirtualFileSystem(require('pdfmake/build/vfs_fonts'));
const base=path.resolve(__dirname,'..');let total=0;
function context(file){
 const html=fs.readFileSync(path.join(base,file),'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost/'+file});const w=dom.window;
 w.docx=docx;w.JSZip=JSZip;w.mammoth={convertToHtml:args=>require('mammoth').convertToHtml({buffer:Buffer.from(args.arrayBuffer)})};w.pdfMake=pdfMake;w.pdfMake.vfs={};w.htmlToPdfmake=require('html-to-pdfmake');w.Blob=Blob;
 const saved=[];w.URL.createObjectURL=blob=>{saved.push({blob});return 'blob:test'};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){saved.at(-1).name=this.download};
 w.showToast=message=>{if(message.startsWith('Erro'))throw new Error(message)};w.hideLoad=()=>{};w.showLoad=()=>{};w.hideModal=()=>{};
 w.eval(fs.readFileSync(path.join(base,'exportacao.js'),'utf8'));
 const scripts=Array.from(w.document.querySelectorAll('script:not([src])')).map(s=>s.textContent).join('\n');
 const ast=acorn.parse(scripts,{ecmaVersion:'latest'});
 const code=ast.body.filter(n=>n.type==='FunctionDeclaration'||(n.type==='VariableDeclaration'&&n.declarations.every(d=>/^[A-Z_]+$/.test(d.id.name)&&['ArrayExpression','ObjectExpression','Literal'].includes(d.init?.type)))).map(n=>scripts.slice(n.start,n.end)).join('\n');
 w.eval(code);w.showToast=message=>{if(message.startsWith('Erro'))throw Error(message)};w.hideLoad=()=>{};w.showLoad=()=>{};w.hideModal=()=>{};return {w,saved,dom};
}
async function waitFile(saved,count){const end=Date.now()+25000;while(saved.length<count){if(Date.now()>end)throw new Error('Exportação não concluiu');await new Promise(r=>setTimeout(r,30));}return saved[count-1];}
async function validate(entry,format){
 const bytes=Buffer.from(await entry.blob.arrayBuffer());assert(bytes.length>100);assert(entry.name.endsWith('.'+format));
 if(format==='pdf'){assert(bytes.subarray(0,5).toString()==='%PDF-');assert(bytes.includes(Buffer.from('/Type /Page')));}
 else {const zip=await JSZip.loadAsync(bytes);if(format==='odt'){
  assert.equal(await zip.file('mimetype').async('string'),'application/vnd.oasis.opendocument.text');
  const xml=await zip.file('content.xml').async('string');assert(xml.includes('Ana'));assert(xml.includes('table:table'));assert(zip.file('META-INF/manifest.xml'));
  assert.equal(bytes.readUInt16LE(8),0);assert.equal(bytes.subarray(30,38).toString(),'mimetype');
 } else {assert((await zip.file('word/document.xml').async('string')).includes('Ana'));}}
 fs.mkdirSync('/tmp/site-results',{recursive:true});fs.writeFileSync('/tmp/site-results/'+entry.name,bytes);total++;
}
(async()=>{
 for(const file of ['diagnostica_formulario.html','paee_formulario_02.html','relatorio_formulario.html']){
  const {w,saved,dom}=context(file);const state=w.novoEstado();state.identificacao.nome='Ana São & Teste';
  for(const fmt of ['docx','pdf','odt']){w.exportDOCX(state,fmt);const result=await waitFile(saved,saved.length+1);await validate(result,fmt);console.log(file,fmt,'OK',result.blob.size);}
  dom.window.close();
 }
 const {w,saved,dom}=context('index.html');
 w.document.getElementById('peiConteudo').innerHTML='<h1>PEI — Ana São</h1><p>Comunicação <strong>e participação</strong>.</p><table><tr><th>Meta</th><th>Ação</th></tr><tr><td>Autonomia</td><td>Apoio visual</td></tr></table>';
 w.document.getElementById('peiNomeAluno').textContent='PEI Ana São';
 for(const fmt of ['docx','pdf','odt']){await w.exportarPei(fmt);await validate(saved.at(-1),fmt);console.log('PEI',fmt,'OK');}
 // Frequency exporter with local fixtures; no remote writes or authentication.
 const alunos=[{id:'aluno1',nome:'Ana São',turma:'3º ano'}];const semanas=[{id:'s1',dataInicio:'2026-10-01',label:'Semana 1',registros:{}}];
 const snapshot=items=>({forEach:fn=>items.forEach(d=>fn({id:d.id,data:()=>d}))});
 w.alunosRef=()=>({get:async()=>snapshot(alunos)});w.semanasRef=()=>({get:async()=>snapshot(semanas)});
 w.filtrarAlunosPorTurno=items=>items;w.filtrarSemanasPorTurno=items=>items;w.showToast=message=>{if(message.startsWith('Erro'))throw Error(message)};
 w.val=id=>id==='freqRelDe'?'2026-10-01':'2026-10-08';
 for(const fmt of ['docx','pdf','odt']){const count=saved.length+1;await w.gerarRelatorioFrequenciaPDF(fmt);await validate(await waitFile(saved,count),fmt);console.log('Frequência',fmt,'OK');}
 await assert.rejects(w.SRMExport.fromHtml('<p></p>','pdf','vazio'),/vazio/);
 dom.window.close();console.log('TOTAL:',total,'arquivos validados');
})().catch(e=>{console.error(e);process.exit(1)});
