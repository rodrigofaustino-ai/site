/* Compatibilidade: coordenação antiga passa à lista de pessoas, sem gravação automática. */
(()=>{'use strict';
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR');
 function adicionais(s){const list=AssinaturasAdicionais.normalizar(s.assinaturasAdicionais),old=s.assinaturas||{};if(old.coordenacaoNaLista===true)return list;const nome=String(old.nomeCoordenador||'').trim();if(!nome)return list;const assinatura=AssinaturasDocumentos.paraNome(s.assinaturasImagens?.coordenador,nome),existing=list.find(a=>norm(a.nome)===norm(nome));
  if(existing){if(!existing.assinatura&&assinatura)existing.assinatura={...JSON.parse(JSON.stringify(assinatura)),nome:existing.nome.trim()};if(!existing.cargo.trim())existing.cargo=old.cargoCoordenador||'Coordenação pedagógica';}
  else{let id='coordenacao-legada';while(list.some(a=>a.id===id))id+='-x';list.unshift({id,nome,cargo:old.cargoCoordenador||'Coordenação pedagógica',assinatura});}
  return AssinaturasAdicionais.normalizar(list);
 }
 function preparar(s){if(s.assinaturas?.coordenacaoNaLista===true)return;s.assinaturasAdicionais=adicionais(s);s.assinaturas||={};s.assinaturas.coordenacaoNaLista=true;s.assinaturas.nomeCoordenador='';s.assinaturas.cargoCoordenador='';if(s.assinaturasImagens?.coordenador)s.assinaturasImagens.coordenador=null;}
 function grupos(s){const a=s.assinaturas||{},nome=a.nomeProfessor||s.identificacao?.professorSRM||'',people=[{nome,cargo:a.cargoProfessor||'Professor(a) SRM',assinatura:AssinaturasDocumentos.paraNome(s.assinaturasImagens?.professor,nome)},...AssinaturasAdicionais.grupos(adicionais(s)).flat()],out=[];for(let i=0;i<people.length;i+=2)out.push(people.slice(i,i+2));return out;}
 window.RelatorioAssinaturas=Object.freeze({adicionais,preparar,grupos});
})();
