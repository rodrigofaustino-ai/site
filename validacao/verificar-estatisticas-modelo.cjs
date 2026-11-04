'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={};ctx.window=ctx;vm.createContext(ctx);for(const f of ['frequencia-interface.js','estatisticas-modelo.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
const dados={alunos:[{id:'a',turno:'Matutino',atendimentos:[{dia:'Segunda'},{dia:'Segunda'},{dia:'Terça'}]},{id:'b',turno:'Vespertino'},{id:'c'}],registros:{a:[{date:'2026-01-01'},{date:'2026-01-31'},{date:'2026-02-01'},{date:'2026-02-30'}],b:[{date:'2026-01-15'}]},metas:{a:[{status:'ativa',revisao:'2026-01-15'},{status:'desconhecida'}],c:[{status:'concluida'}]},semanas:[{id:'m',turno:'Matutino',dataInicio:'2026-01-01',status:{a__Segunda:'presente',a__Terça:null,a:'falta'}},{id:'v',turno:'Vespertino',dataInicio:'2026-01-05',status:{a__Segunda:'falta',b__Segunda:'justificado'}},{id:'semdata',turno:'Matutino',status:{a__Segunda:'falta'}}]};
let n=0;const eq=(a,b)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),b);n++;};const modelo=ctx.EstatisticasModelo;
const r=modelo.consolidar(dados,{de:'2026-01-01',ate:'2026-01-31',turno:'Matutino'},'2026-02-01');
eq(r.alunos,2);eq(r.semTurno,1);eq(r.atendimentos,2);eq(r.alunosComRegistro,1);eq(r.semRegistro,1);eq(r.registrosSemData,1);eq(r.meses,{'2026-01':2});eq(r.diarios.presente,1);eq(r.diarios.vazio,1);eq(r.diarios.falta,0);eq(r.antigos.falta,1);eq(r.semanasSemData,1);eq(r.revisoes,1);eq(r.metas.desconhecida,1);eq(r.metas.concluida,1);
const todos=modelo.consolidar(dados,{de:'2026-01-01',ate:'2026-02-28',turno:''},'2026-02-01');eq(todos.atendimentos,4);eq(todos.diarios.presente,1);eq(todos.diarios.falta,0);eq(todos.diarios.justificado,1);eq(todos.meses,{'2026-01':3,'2026-02':1});
const vazio=modelo.consolidar(dados,{de:'2025-12-01',ate:'2025-12-31',turno:'Matutino'},'2026-02-01');eq(vazio.atendimentos,0);eq(vazio.meses,{'2025-12':0});eq(vazio.metas.ativa,1);eq(vazio.semanas,0);
for(const f of [{de:'2026-02-30',ate:'2026-03-01'},{de:'2026-02-01',ate:'2026-01-01'},{de:'2000-01-01',ate:'2026-01-01'}]){assert.throws(()=>modelo.consolidar(dados,f,'2026-02-01'));n++;}
const comArquivo=structuredClone(dados);comArquivo.alunos[0].arquivado=true;
const filtroBase={de:'2026-01-01',ate:'2026-01-31',turno:'Matutino'};
eq(modelo.consolidar(comArquivo,{...filtroBase,situacao:'ativos'},'2026-02-01').alunos,1);
eq(modelo.consolidar(comArquivo,{...filtroBase,situacao:'ativos'},'2026-02-01').atendimentos,0);
eq(modelo.consolidar(comArquivo,{...filtroBase,situacao:'arquivados'},'2026-02-01').atendimentos,2);
eq(modelo.consolidar(comArquivo,{...filtroBase,situacao:'todos'},'2026-02-01').alunos,2);
console.log(n+' verificações de consolidação, período, turno, duplicidade diária, legado e metas atuais passaram.');
