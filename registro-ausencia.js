/* Um registro de ausência por aluno/data, compartilhado entre agenda e ficha. */
(()=>{'use strict';
const tipo=t=>['falta','justificado'].includes(t),id=data=>'ausencia-'+data,texto=t=>t==='justificado'?'Aluno faltou — falta justificada':'Aluno faltou';
function automatico(r){return r?.origem==='registro_ausencia'&&tipo(r.tipoRegistro)&&r.text===texto(r.tipoRegistro)&&!(r.proximoPasso||'').trim()&&!(r.metaIds||[]).length&&!(r.humor||'').trim();}
window.RegistroAusencia=Object.freeze({tipo,id,texto,automatico});
})();
