/* Comunicados administrativos: conteúdo em texto simples e recibos privados por conta. */
(function(){
'use strict';
const ADMIN='xF20nknLCsZxk0giHFso8NqV8KH3', EMAIL='rodrigofaustino@gmail.com';
const auth=firebase.auth(),db=firebase.firestore(),stamp=()=>firebase.firestore.FieldValue.serverTimestamp();
const $=id=>document.getElementById(id), el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
let generation=0,queue=[],current=null,owner=null,kind='aviso',publishing=false,pending=null;
const admin=u=>!!u&&u.uid===ADMIN&&u.email===EMAIL;
const valid=(u,g)=>g===generation&&auth.currentUser?.uid===u.uid;
const receipt=(u,id)=>db.collection('comunicadosRecebidos').doc(u.uid).collection('itens').doc(id);
function lock(value){images.lock(value);for(const id of ['comunicadosPublicar','comunicadosTitulo','comunicadosTexto','comunicadosAdminFechar'])$(id).disabled=value;}
const names={aviso:'Avisos aos professores',mensagem:'Mensagens'};
const panel=el('dialog');panel.id='comunicadosAdmin';panel.setAttribute('aria-labelledby','comunicadosAdminTitulo');
panel.innerHTML='<h2 id="comunicadosAdminTitulo"></h2><p id="comunicadosAjuda"></p><form id="comunicadosForm"><label>Título<input id="comunicadosTitulo" maxlength="120" required></label><label>Mensagem<textarea id="comunicadosTexto" rows="6" maxlength="4000"></textarea></label><label>Imagem (opcional)<input id="comunicadosArquivo" type="file" accept=".jpg,.jpeg,.png,.gif,.webp"></label><p>Uma imagem JPG, PNG, GIF ou WEBP de até 10 MB.</p><div id="comunicadosImagemPrevia"></div><button id="comunicadosImagemRemover" type="button" hidden>Remover imagem</button><button id="comunicadosPublicar" type="submit">Publicar</button></form><p id="comunicadosAdminStatus" role="status"></p><h3>Publicações recentes</h3><div id="comunicadosLista"></div><button id="comunicadosAdminFechar" type="button">Fechar</button>';
const popup=el('dialog');popup.id='comunicadosPopup';popup.setAttribute('aria-labelledby','comunicadosPopupTitulo');
popup.innerHTML='<p id="comunicadosCategoria"></p><h2 id="comunicadosPopupTitulo"></h2><div id="comunicadosConteudo"></div><div id="comunicadosImagem" hidden></div><p id="comunicadosPopupStatus" role="status"></p><button id="comunicadosConcluir" type="button"></button>';
document.body.append(panel,popup);
const images=ComunicadosImagens.criar({auth,status:text=>{$('comunicadosAdminStatus').textContent=text;}});
const nav=document.querySelector('.tabs-bar');
for(const tipo of ['aviso','mensagem']){const b=el('button',names[tipo]);b.type='button';b.className='tab-btn';b.id='btnComunicados'+tipo;b.hidden=true;b.setAttribute('aria-haspopup','dialog');b.onclick=()=>openAdmin(tipo);nav.append(b);}
function reset(){images.reset();generation++;queue=[];current=null;owner=null;pending=null;publishing=false;if(popup.open)popup.close();if(panel.open)panel.close();$('comunicadosForm').reset();$('comunicadosLista').replaceChildren();lock(false);}
auth.onAuthStateChanged(u=>{reset();for(const t of ['aviso','mensagem'])$('btnComunicados'+t).hidden=!admin(u);});
async function loadAdmin(u,g){
 try{const s=await db.collection('comunicadosEquipe').orderBy('criadoEm','desc').limit(100).get({source:'server'});if(!valid(u,g)||!panel.open)return;
 const box=$('comunicadosLista');box.replaceChildren();const docs=s.docs.filter(d=>d.data().tipo===kind);if(!docs.length)box.append(el('p','Nenhuma publicação nesta lista.'));
 for(const d of docs){const a=d.data(),row=el('article');row.append(el('strong',a.titulo),el('p',a.texto),el('small',a.ativo?'Ativo':'Desativado'));if(a.imagem)row.append(el('p','Imagem: '+a.imagem.nome));
 if(a.ativo){const b=el('button','Desativar');b.type='button';b.onclick=async()=>{if(!valid(u,g)||!admin(auth.currentUser))return;b.disabled=true;try{await d.ref.update({ativo:false,desativadoEm:stamp()});if(valid(u,g))await loadAdmin(u,g);}catch(e){if(valid(u,g)){$('comunicadosAdminStatus').textContent='Não foi possível desativar. Tente novamente.';b.disabled=false;}}};row.append(b);}box.append(row);}
 }catch(e){if(valid(u,g))$('comunicadosAdminStatus').textContent='Não foi possível carregar as publicações. Confira a conexão e as regras do Firestore.';}
}
function openAdmin(tipo){const u=auth.currentUser;if(!admin(u)||popup.open)return;generation++;queue=[];kind=tipo;$('comunicadosAdminTitulo').textContent=names[tipo];$('comunicadosAjuda').textContent=tipo==='aviso'?'O professor confirma em “Entendi”. O aviso reaparece até essa confirmação.':'A mensagem tem somente “Fechar”. Depois de fechada, não aparece novamente para essa conta.';$('comunicadosAdminStatus').textContent='';panel.showModal();loadAdmin(u,generation);}
$('comunicadosAdminFechar').onclick=()=>{if(!publishing)panel.close();};
panel.addEventListener('cancel',e=>{if(publishing)e.preventDefault();});
$('comunicadosForm').onsubmit=async e=>{e.preventDefault();const u=auth.currentUser,g=generation;if(!admin(u)||publishing)return;if(images.checking){$('comunicadosAdminStatus').textContent='Aguarde a conferência da imagem.';return;}
 const titulo=$('comunicadosTitulo').value.trim(),texto=$('comunicadosTexto').value.trim();if(!titulo||(!texto&&!images.file)){$('comunicadosAdminStatus').textContent='Preencha o título e escreva a mensagem ou selecione uma imagem.';return;}
 const key=JSON.stringify([kind,titulo,texto]);if(!pending||pending.key!==key||pending.file!==images.file)pending={key,file:images.file,info:images.info,ref:db.collection('comunicadosEquipe').doc()};const attempt=pending,tipo=kind;
 publishing=true;lock(true);$('comunicadosAdminStatus').textContent='Publicando…';
 try{const imagem=await images.send(attempt,u,()=>valid(u,g));if(!valid(u,g))return;$('comunicadosAdminStatus').textContent='Publicando…';await db.runTransaction(async tx=>{const s=await tx.get(attempt.ref);if(!valid(u,g))throw Error('sessao');if(!s.exists)tx.set(attempt.ref,{tipo,titulo,texto,ativo:true,autorUid:u.uid,criadoEm:stamp(),...(imagem?{imagem}:{})});});if(!valid(u,g))return;pending=null;images.clear();$('comunicadosForm').reset();$('comunicadosAdminStatus').textContent='Publicado. Será exibido na próxima seleção de turno dos professores.';await loadAdmin(u,g);
 }catch(e){if(valid(u,g))$('comunicadosAdminStatus').textContent='Não foi possível confirmar a publicação. Tente novamente; a mesma tentativa não cria uma cópia.';}
 finally{if(valid(u,g)){publishing=false;lock(false);}}
};
async function next(u,g){
 if(!valid(u,g))return;
 while(queue.length){const d=queue.shift();try{const [s,r]=await Promise.all([d.ref.get({source:'server'}),receipt(u,d.id).get({source:'server'})]);if(!valid(u,g))return;if(!s.exists||!s.data().ativo||r.exists)continue;current={id:d.id,ref:d.ref,...s.data()};owner=u;
 $('comunicadosCategoria').textContent=current.tipo==='aviso'?'Aviso aos professores':'Uma mensagem para você';$('comunicadosPopupTitulo').textContent=current.titulo;$('comunicadosConteudo').textContent=current.texto;$('comunicadosPopupStatus').textContent='';$('comunicadosConcluir').textContent=current.tipo==='aviso'?'Entendi':'Fechar';$('comunicadosConcluir').disabled=false;popup.showModal();images.show(current);return;
 }catch(e){if(valid(u,g))window.showToast?.('Não foi possível consultar os comunicados. Eles serão conferidos na próxima seleção de turno.');return;}}
}
async function selectShift(){const u=auth.currentUser;if(!u||panel.open)return;generation++;const g=generation;queue=[];current=null;images.clearDisplay();if(popup.open)popup.close();try{const s=await db.collection('comunicadosEquipe').where('ativo','==',true).get({source:'server'});if(!valid(u,g))return;queue=s.docs.sort((a,b)=>(a.data().tipo==='aviso'?0:1)-(b.data().tipo==='aviso'?0:1)||(a.data().criadoEm?.toMillis()||0)-(b.data().criadoEm?.toMillis()||0)||a.id.localeCompare(b.id));await next(u,g);}catch(e){if(valid(u,g))window.showToast?.('Não foi possível consultar os comunicados. Confira a conexão e tente trocar o turno novamente.');}}
async function finish(){const u=owner,g=generation,m=current,b=$('comunicadosConcluir');if(!u||!m||b.disabled||!valid(u,g))return;b.disabled=true;$('comunicadosPopupStatus').textContent='';
 try{const r=receipt(u,m.id);await db.runTransaction(async tx=>{const [s,done]=await Promise.all([tx.get(m.ref),tx.get(r)]);if(!valid(u,g))throw Error('sessao');if(s.exists&&s.data().ativo&&!done.exists)tx.set(r,{tipo:m.tipo,registradoEm:stamp()});});if(!valid(u,g))return;popup.close();images.clearDisplay();current=null;await next(u,g);
 }catch(e){if(valid(u,g)){$('comunicadosPopupStatus').textContent='Não foi possível salvar. Confira a conexão e tente novamente.';b.disabled=false;}}
}
$('comunicadosConcluir').onclick=finish;
popup.addEventListener('cancel',e=>{e.preventDefault();if(current?.tipo==='mensagem')finish();});
window.ComunicadosEquipe={selecionarTurno:selectShift};
})();
