'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');let checks=0;const check=(a,b)=>{assert.deepEqual(a,b);checks++;};const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../questionario-familia-modelo.js'),'utf8'),ctx);const M=ctx.window.QuestionarioFamiliaModelo;
check(M.grupos.length,27);check(M.areas.length,9);check(M.itens.length,58);check(new Set(M.itens.map(q=>q.id)).size,58);check(new Set(M.itens.filter(q=>q.origem).map(q=>q.origem)).size,54);
check(JSON.stringify(M.grupos.flatMap(g=>g.itens).map(q=>q.id).sort()),JSON.stringify(M.itens.map(q=>q.id).sort()));
const expected={oralidade:[1,3,4,5,6,10,12,14,15,17,19,20],leitura:[2,3,7,8,9,10,11],escrita:[1,2,4,5,6,7],percepcao:[4,5,6,7,8],avd:[0,1,2,3,4,5,6,7,8,9,11,12,13,14],social:[0,1,2,3,4,5],numeros:[4,5],medidas:[8,9]};
check(JSON.stringify([...new Set(M.itens.filter(q=>q.origem).map(q=>q.origem))].sort()),JSON.stringify(Object.entries(expected).flatMap(([area,ids])=>ids.map(i=>area+'_'+i)).sort()));
for(const id of ['avd_alimentacao_contexto','rotina_sono','rotina_dia']){check(M.itens.some(q=>q.id===id&&q.tipo==='descricao'),true);}
const dados=()=>({responsavel:'Família fictícia',vinculo:'Responsável',ciencia:true,contexto:'',observacoes:'',respostas:Object.fromEntries(M.itens.map(q=>[q.id,'nao_sabe'])),observacoesPerguntas:{}});
check(M.validar(dados()),'');const d=dados();d.respostas.oralidade_1='relato';check(M.validar(d),'');check(M.pendentes(M.itens,d).length,1);check(M.prepararRespostas(d).oralidade_1,null);d.observacoesPerguntas.oralidade_1='Usa imagens.';check(M.validar(d),'');d.observacoesPerguntas.oralidade_1='x'.repeat(1001);check(M.validar(d).includes('1.000'),true);
const e=dados();e.respostas.avd_1='sem_modelo';check(M.validar(e).includes('Responda'),true);
const vazio=dados();vazio.respostas={};check(M.validar(vazio),'');check(M.pendentes(M.itens,vazio).length,58);check(Object.values(M.prepararRespostas(vazio)).every(v=>v===null),true);check(M.rotulo(M.itens[0],null),'Sem resposta');check(M.prepararRespostas(dados()).oralidade_1,'nao_sabe');check(M.tipos.descricao.relato,'Vou descrever abaixo como observei este item na criança');
const f=dados();f.ciencia=false;check(M.validar(f).includes('quem responde'),true);
check(M.rotulo(M.itens.find(q=>q.id==='oralidade_5'),'frequente'),'Percebo frequentemente');check(M.rotulo(M.itens.find(q=>q.id==='avd_1'),'autonomo'),'Realiza sem ajuda de outra pessoa, com seus recursos habituais');
const source=fs.readFileSync(path.join(__dirname,'../diagnostica_formulario.html'),'utf8');check(source.includes('QuestionarioFamilia.abrir'),true);
const rules=fs.readFileSync(path.join(__dirname,'../producao/salamulti.rules'),'utf8');for(const q of M.itens)assert(rules.includes('d.respostas.'+q.id+','),q.id);checks++;
console.log(checks+' verificações do conteúdo e da correspondência dos 54 itens selecionados aprovadas.');
