/* Consulta da ficha: registros salvos e faltas diárias, sem alterar exportações. */
(()=>{'use strict';
const valido=v=>window.FrequenciaInterface.dataValida(v),dias=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
function apurar(registros,semanas,alunoId,periodo=null){
 const dentro=d=>!periodo||(valido(d)&&d>=periodo.de&&d<=periodo.ate);
 const atendimentos=registros.filter(r=>dentro(r.date)).length,faltas=new Set(),justificadas=new Set();let antigas=0,semData=0;
 for(const s of semanas){const status=s.status||{},prefix=alunoId+'__';if(['falta','justificado'].includes(status[alunoId]))antigas++;
  for(const [key,value]of Object.entries(status)){if(!key.startsWith(prefix)||!['falta','justificado'].includes(value))continue;const dia=key.slice(prefix.length),weekday=dias.indexOf(dia);let data=null;
   if(weekday>=0&&valido(s.dataInicio)){const d=new Date(s.dataInicio+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+(weekday-d.getUTCDay()+7)%7);const date=d.toISOString().slice(0,10);if(!valido(s.dataFim)||date<=s.dataFim)data=date;}
   if(!data){semData++;continue;}if(dentro(data))(value==='falta'?faltas:justificadas).add(data);
  }
 }
 return {atendimentos,faltas:faltas.size,justificadas:justificadas.size,antigas,semData,registrosSemData:registros.filter(r=>!valido(r.date)).length};
}
let ctx=null,key='',rows=null,busy=false,error='',version=0,periodo=null;
const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
function render(c){const next=JSON.stringify([c.uid,c.alunoId]);if(key!==next){key=next;rows=null;busy=false;error='';periodo=null;version++;}ctx=c;desenhar();if(!rows&&!busy&&!error&&c.alunoId)carregar();}
function limpar(){ctx=null;key='';rows=null;version++;document.getElementById('alunoTotais')?.replaceChildren();}
function desenhar(){const root=document.getElementById('alunoTotais');if(!root||!ctx)return;root.replaceChildren();
 const heading=el('strong','Resumo do aluno');root.append(heading);const status=el('p');status.setAttribute('role','status');root.append(status);
 if(!ctx.alunoId){status.textContent='Salve o cadastro para consultar os totais.';return;}
 const grid=el('div');grid.className='aluno-totais-valores';const counts=apurar(ctx.registros,rows||[],ctx.alunoId,periodo);
 for(const [label,value]of [['Atendimentos previstos/ofertados',ctx.status==='pronto'?counts.atendimentos:ctx.status==='erro'?'Indisponível':'…'],['Faltas (F)',rows?counts.faltas:error?'Indisponível':'…'],['Justificadas (FJ)',rows?counts.justificadas:error?'Indisponível':'…']]){const item=el('span');item.append(el('b',String(value)),el('small',label));grid.append(item);}root.append(grid);
 status.textContent=error|| (busy?'Consultando frequência…':periodo?'Período: '+periodo.de.split('-').reverse().join('/')+' a '+periodo.ate.split('-').reverse().join('/'):'Total · Todo o histórico · Todos os turnos');
 const details=el('details'),summary=el('summary','Selecionar período');details.append(summary);const fields=el('div');fields.className='aluno-totais-filtros';const inputs=[];
 for(const [label,value]of [['De',periodo?.de],['Até',periodo?.ate]]){const l=el('label',label),input=el('input');input.type='date';input.value=value||'';l.append(input);fields.append(l);inputs.push(input);}details.append(fields);
 const warning=el('p');warning.setAttribute('role','alert');details.append(warning);
 for(const [text,fn]of [['Aplicar',()=>{const [de,ate]=inputs.map(i=>i.value);if(!valido(de)||!valido(ate)||de>ate){warning.textContent='Informe as duas datas, com início anterior ou igual ao fim.';return;}periodo={de,ate};desenhar();}],['Todo o histórico',()=>{periodo=null;desenhar();}],['Atualizar faltas',carregar]]){const b=el('button',text);b.type='button';b.disabled=busy;b.addEventListener('click',fn);details.append(b);}root.append(details);
 const help=el('small','Previstos/ofertados: todos os relatos salvos, incluindo faltas e justificadas. F e FJ: marcações da Frequência por data, sem duplicar o mesmo dia. P e SAP ficam fora dessas duas contagens.');root.append(help);
 if(counts&&(counts.antigas||counts.semData||counts.registrosSemData)){root.append(el('small',[counts.antigas?counts.antigas+' marcação(ões) F/FJ semanal(is) antiga(s) sem dia: fora dos totais diários.':'',counts.semData?counts.semData+' marcação(ões) F/FJ sem data identificável: fora dos totais.':'',counts.registrosSemData?counts.registrosSemData+' atendimento(s) sem data válida: incluído(s) somente em Todo o histórico.':''].filter(Boolean).join(' ')));}
}
async function carregar(){if(!ctx||busy||!ctx.vigente()||!ctx.alunoId)return;const c=ctx,token=++version;busy=true;error='';rows=null;desenhar();try{const snap=await c.db.collection('frequenciaSemanas').where('professorUid','==',c.uid).get({source:'server'});if(token!==version||!c.vigente())return;if(snap.metadata?.fromCache)throw Error();rows=[];snap.forEach(d=>rows.push({...d.data(),id:d.id}));}catch(_){if(token!==version||!c.vigente())return;error='Não foi possível consultar as faltas. Tente atualizar.';}finally{if(token===version&&c.vigente()){busy=false;desenhar();}}}
window.AlunoTotais=Object.freeze({render,limpar,apurar});
})();
