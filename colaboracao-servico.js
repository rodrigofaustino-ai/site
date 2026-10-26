(() => {
  'use strict';
  const n=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
  const botao=(text,action)=>{const b=n('button',text);b.type='button';b.className='central-btn';b.addEventListener('click',action);return b;};
  const stamp=()=>firebase.firestore.FieldValue.serverTimestamp();
  const data=value=>value?.toDate?value.toDate().toLocaleString('pt-BR'):'Data pendente';
  function erro(e){return /permission-denied/.test(e?.code||'')?'Acesso indisponível. Confira seu vínculo, a verificação do e-mail e as regras do banco.':e?.message||'Não foi possível concluir. Tente novamente.';}
  function mostrarPublicacao(root,p,previa=false){
    root.replaceChildren();
    root.append(n('h2',p.resumo.nome),n('p',[p.resumo.escola,p.resumo.turma,p.resumo.turno].filter(Boolean).join(' · ')),n('p',previa?'Prévia do conteúdo selecionado. O acesso só será autorizado após sua confirmação.':'Cópia compartilhada em '+data(p.publicadoEm)+'. Alterações nos documentos originais só aparecem após nova publicação do responsável.'));
    if(p.peiHtml){const d=n('details'),s=n('summary','Consultar PEI compartilhado'),frame=n('iframe');frame.title='PEI compartilhado';frame.className='colaboracao-preview';frame.setAttribute('sandbox','');frame.srcdoc=ColaboracaoModelo.srcdoc(p.peiHtml);d.append(s,frame);root.append(d);}
    if(p.metas.length){root.append(n('h3','Metas compartilhadas'));for(const m of p.metas){const item=n('article');item.className='colaboracao-item';item.append(n('h4',m.objetivo));item.append(n('p',m.detalhes));root.append(item);}}
    if(p.registros.length){root.append(n('h3','Relatos escolhidos pelo responsável'));for(const r of p.registros){const item=n('article');item.className='colaboracao-item';item.append(n('h4',r.date),n('p',r.text));root.append(item);}}
  }
  function observacoes({root,db,grantId,publicacao,user,papel,vigente,ativo=true}){
    root.replaceChildren();root.append(n('h3','Observações da equipe'),n('p','Até as 100 observações mais recentes deste acesso.'));
    const status=n('p'),list=n('div');root.append(status,list);
    let stop=()=>{},disposed=false,busy=false;
    const current=()=>!disposed&&vigente()&&firebase.auth().currentUser?.uid===user.uid;
    const ref=db.collection('colaboracoes').doc(grantId).collection('observacoes');
    stop=ref.orderBy('criadoEm','desc').limit(100).onSnapshot(snap=>{
      if(!current())return;list.replaceChildren();
      if(!snap.size)list.append(n('p','Ainda não há observações.'));
      for(const doc of snap.docs){const d=doc.data(),item=n('article');item.className='colaboracao-message';
        item.append(n('strong',(d.tipo==='revisao'?'Revisão pedagógica':'Observação')+' · '+d.autorEmail),n('p',data(d.criadoEm)+(d.publicacaoId===publicacao.publicacaoId?' · cópia atual':' · cópia anterior')),n('p',d.texto));list.append(item);}
    },e=>{if(current()){list.replaceChildren();status.textContent=erro(e);}});
    if(ativo){
      const form=n('form'),label=n('label','Sua observação sobre a cópia compartilhada'),input=n('textarea');input.rows=4;input.maxLength=4000;input.required=true;label.append(input);form.append(label);
      const tipo=n('select');const normal=n('option','Observação');normal.value='observacao';tipo.append(normal);
      if(papel==='coordenacao'&&publicacao.peiHtml){const review=n('option','Registrar revisão pedagógica desta cópia do PEI');review.value='revisao';tipo.append(review);}
      const tipoLabel=n('label','Tipo de registro');tipoLabel.append(tipo);form.append(tipoLabel);
      if(papel==='coordenacao')form.append(n('p','A revisão registra uma análise pedagógica desta cópia; não constitui assinatura ou homologação institucional.'));
      const submit=n('button','Registrar observação');submit.type='submit';submit.className='central-btn';form.append(submit);root.append(form);
      form.addEventListener('submit',async e=>{e.preventDefault();const text=input.value.trim();if(!text||busy||!current())return;busy=true;submit.disabled=true;status.textContent='Salvando…';
        try{await ref.doc(crypto.randomUUID()).set({autorUid:user.uid,autorEmail:ColaboracaoModelo.email(user.email),texto:text,tipo:tipo.value,publicacaoId:publicacao.publicacaoId,criadoEm:stamp()});if(current()){input.value='';status.textContent='Observação registrada.';}}
        catch(e){if(current())status.textContent=erro(e);}finally{busy=false;if(current())submit.disabled=false;}
      });
    }
    return ()=>{disposed=true;stop();root.replaceChildren();};
  }
  window.ColaboracaoServico={n,botao,stamp,data,erro,mostrarPublicacao,observacoes};
})();
