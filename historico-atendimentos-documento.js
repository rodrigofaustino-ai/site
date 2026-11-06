/* Histórico completo salvo: geração isolada, sem consultas, gravações ou filtros da ficha. */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texto=v=>esc(v).replace(/\r?\n/g,'<br>');
function data(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return '';const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v?v:'';}
function html(d){const a=d?.aluno,registros=d?.registros;if(!a?.id||!Array.isArray(registros)||!registros.length)throw Error('Histórico sem registros.');
 const p=(r,v)=>'<p><strong>'+esc(r)+':</strong> '+texto(v||'Não informado')+'</p>',fmt=v=>data(v)?v.split('-').reverse().join('/'):'Data não informada ou inválida';
 let out='<h1>DIÁRIO DE BORDO — SALA DE RECURSOS MULTIFUNCIONAIS</h1><h2>Histórico de atendimentos</h2><h2>Identificação do aluno</h2>';
 out+='<table><tr><td>'+p('Nome',a.nome)+'</td><td>'+p('Data de nascimento',a.dataNasc?fmt(a.dataNasc):'Não informada')+'</td></tr><tr><td>'+p('Turma',a.turma)+'</td><td>'+p('Período',a.periodo)+'</td></tr><tr><td>'+p('Escola',a.escola)+'</td><td>'+p('Município',a.municipio)+'</td></tr><tr><td>'+p('Laudo / Diagnóstico',a.laudo)+'</td><td>'+p('CID',a.cid)+'</td></tr></table>';
 if(a.obsClinicas)out+=p('Observações clínicas',a.obsClinicas);
 if(Array.isArray(a.contacts)&&a.contacts.length){out+='<h2>Responsáveis e contatos</h2>';for(const c of a.contacts)out+=p(c.nome||'Responsável',[c.relacao,c.tel].filter(Boolean).join(' · '));}
 out+='<h2>Histórico de atendimentos ('+registros.length+' '+(registros.length===1?'registro':'registros')+')</h2><p>Todos os registros salvos, do mais recente para o mais antigo. Registros sem data válida são apresentados ao final.</p>';
 const itens=[...registros].sort((a,b)=>data(b.date).localeCompare(data(a.date))||String(a.id||'').localeCompare(String(b.id||'')));
 for(const e of itens){out+='<h3>'+esc(fmt(e.date))+'</h3>';if(!data(e.date)&&e.date)out+=p('Data registrada',e.date);if(e.por)out+=p('Registrado por',e.por);if(e.humor)out+=p('Humor / disposição',e.humor);
 out+='<p>'+texto(e.text||'(sem conteúdo registrado)')+'</p>';
 if(e.proximoPasso&&!String(e.text||'').includes('Próximo passo:\n'+e.proximoPasso))out+=p('Próximo passo',e.proximoPasso);
 if(Array.isArray(e.metaIds)&&e.metaIds.length){out+='<p><strong>Metas vinculadas no registro:</strong></p>';for(const id of e.metaIds){const meta=Array.isArray(e.metaVinculos)?e.metaVinculos.find(m=>m?.id===id):null;out+='<p>'+texto(meta?.objetivo||'Meta vinculada sem descrição salva no registro')+'</p>';}}
 }
 out+='<p style="text-align:center">'+texto(a.pdfLocal||a.municipio||'_____________________________')+', '+texto(d.dataExportacao||'_____________________')+'.</p><p><br><br><br><br></p><p style="text-align:center">________________________________________</p><p style="text-align:center">'+texto(a.pdfProfessor||'________________________________________')+'</p><p style="text-align:center">'+texto(a.pdfCargo||'Professor(a) da Sala de Recursos Multifuncionais')+'</p>';
 return out;
}
window.HistoricoAtendimentosDocumento=Object.freeze({html});
})();
