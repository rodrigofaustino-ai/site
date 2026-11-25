(() => {
  'use strict';
  let ctx=null,key='',epoch=0,stop=()=>{},stopNotes=()=>{};
  const {n,botao,stamp,erro,mostrarPublicacao,observacoes}=ColaboracaoServico;
  function ativar(options){
    ctx=options;
    const next=options?.alunoId&&options.uid?options.uid+'/'+options.alunoId:'';
    if(next===key)return;
    key=next;epoch++;stop();stopNotes();stop=stopNotes=()=>{};
    const root=document.getElementById('compartilharAluno');if(!root)return;root.replaceChildren();root.hidden=!next;if(!next)return;
    const current=epoch,valid=()=>current===epoch&&ctx?.vigente()&&firebase.auth().currentUser?.uid===options.uid;
    const details=n('details'),title=n('summary','Compartilhar conteúdo pedagógico');details.append(title);root.append(details);
    details.append(n('p','Escolha o que outro profissional poderá consultar. O cadastro privado, os contatos e os laudos não são incluídos automaticamente. O PEI pode conter dados familiares ou de saúde: confira seu conteúdo antes de selecioná-lo.'));
    const status=n('p'),editor=n('div'),lista=n('div'),notes=n('div');status.setAttribute('role','status');details.append(status,editor,lista,notes);
    let busy=false,noteEpoch=0,noteGrant=null,noteSignature=null;
    const preparar=botao('Preparar compartilhamento',async()=>{
      if(busy||!valid())return;busy=true;preparar.disabled=true;status.textContent='Consultando conteúdo salvo…';editor.replaceChildren();
      try{
        const db=options.db,parent=db.collection('alunos').doc(options.alunoId);
        const [perfil,pei,metas,registros]=await Promise.all([parent.get({source:'server'}),parent.collection('pei').doc('atual').get({source:'server'}),parent.collection('metas').get({source:'server'}),parent.collection('registros').orderBy('date','desc').limit(30).get({source:'server'})]);
        if(!valid())return;if(!perfil.exists||perfil.data().professorUid!==options.uid)throw new Error('O cadastro não pertence à conta atual.');
        montarEditor({perfil:perfil.data(),pei:pei.data(),metas:metas.docs.map(d=>({...d.data(),id:d.id})).filter(m=>['ativa','em_revisao'].includes(m.status)),registros:registros.docs.map(d=>({...d.data(),id:d.id}))});status.textContent='Selecione e confira a cópia antes de autorizar o acesso.';
      }catch(e){if(valid())status.textContent=erro(e);}finally{busy=false;if(valid())preparar.disabled=false;}
    });details.insertBefore(preparar,status);
    let listening=false;
    details.addEventListener('toggle',()=>{
      if(!details.open||listening||!valid())return;listening=true;
      stop=options.db.collection('colaboracoes').where('professorUid','==',options.uid).where('alunoId','==',options.alunoId).onSnapshot(snap=>{
        if(!valid())return;
        if(noteGrant){const current=snap.docs.find(d=>d.id===noteGrant);if(!current||JSON.stringify(current.data())!==noteSignature){noteEpoch++;stopNotes();notes.replaceChildren();noteGrant=null;}}
        lista.replaceChildren();lista.append(n('h3','Acessos deste aluno'));
        for(const doc of snap.docs){const d=doc.data(),row=n('article');row.className='colaboracao-item';row.append(n('p',d.destinatarioEmail+' · '+ColaboracaoModelo.papeis[d.papel]+' · '+(d.ativo?'Ativo':'Revogado')));
          row.append(botao('Consultar cópia e observações',async()=>{
            const serial=++noteEpoch;noteGrant=doc.id;noteSignature=JSON.stringify(d);stopNotes();notes.replaceChildren();status.textContent='Consultando…';
            try{const snap=await doc.ref.collection('conteudo').doc('atual').get({source:'server'});if(!valid()||serial!==noteEpoch)return;if(!snap.exists)throw new Error('Cópia não encontrada.');const p=snap.data(),view=n('div'),msgs=n('div');notes.append(view,msgs);mostrarPublicacao(view,p);stopNotes=observacoes({root:msgs,db:options.db,grantId:doc.id,publicacao:p,user:firebase.auth().currentUser,papel:'responsavel',vigente:()=>valid()&&serial===noteEpoch,ativo:d.ativo});status.textContent='';}catch(e){if(valid()&&serial===noteEpoch)status.textContent=erro(e);}
          }));
          if(d.ativo)row.append(botao('Revogar acesso',async()=>{
            if(!valid()||!confirm('Revogar o acesso de '+d.destinatarioEmail+'? Cópias já lidas ou salvas pelo destinatário não podem ser apagadas à distância.'))return;
            try{await doc.ref.update({ativo:false,atualizadoEm:stamp()});if(valid()){noteEpoch++;stopNotes();notes.replaceChildren();status.textContent='Acesso revogado.';}}catch(e){if(valid())status.textContent=erro(e);}
          }));lista.append(row);
        }
        if(!snap.size)lista.append(n('p','Nenhum acesso cadastrado.'));
      },e=>{if(valid()){listening=false;lista.replaceChildren();status.textContent=erro(e);}});
    });
    function montarEditor(fonte){
      editor.replaceChildren();const form=n('form');form.className='colaboracao-form';editor.append(form);
      const field=(label,input)=>{const l=n('label',label);l.className='colaboracao-field';l.append(input);form.append(l);return input;};
      const email=field('E-mail da conta do profissional',n('input'));email.type='email';email.required=true;email.maxLength=254;
      const papel=field('Atuação neste aluno',n('select'));for(const [value,text]of Object.entries(ColaboracaoModelo.papeis)){const op=n('option',text);op.value=value;papel.append(op);}
      const escolhas=n('div');escolhas.className='colaboracao-full';form.append(escolhas);
      const check=(text,checked=false)=>{const l=n('label');l.className='colaboracao-check';const input=n('input');input.type='checkbox';input.checked=checked;l.append(input,n('span',text));escolhas.append(l);return input;};
      escolhas.append(n('p','O resumo inclui nome, escola, turma e turno do cadastro salvo.'));
      const incluirPei=check('Incluir a cópia integral do PEI salvo (confira os dados familiares e de saúde antes de compartilhar).');
      escolhas.append(n('h3','Metas: escolha até 5'));
      const metaInputs=fonte.metas.map(m=>({m,input:check(m.objetivo)}));
      escolhas.append(n('h3','Relatos: escolha até 5 entre os 30 mais recentes'));
      const recordInputs=fonte.registros.map(r=>({r,input:check(r.date+' · '+r.text)}));
      const preview=n('div');preview.className='colaboracao-full';
      const publicar=n('button','Autorizar acesso à cópia conferida');publicar.type='submit';publicar.disabled=true;publicar.className='central-btn';
      let pending=null;
      const invalidate=()=>{pending=null;publicar.disabled=true;preview.replaceChildren();};form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
      const conferir=botao('Conferir conteúdo selecionado',()=>{
        try{const destino=ColaboracaoModelo.email(email.value);if(destino===ColaboracaoModelo.email(firebase.auth().currentUser.email))throw new Error('Informe o e-mail de outro profissional.');
          const publication=ColaboracaoModelo.publicacao({...fonte,metas:metaInputs.filter(m=>m.input.checked).map(m=>m.m),idsRegistros:recordInputs.filter(r=>r.input.checked).map(r=>r.r.id),incluirPei:incluirPei.checked});
          pending={destino,papel:papel.value,publication};mostrarPublicacao(preview,publication,true);preview.prepend(n('h3','Conferência: '+destino+' · '+ColaboracaoModelo.papeis[papel.value]));publicar.disabled=false;status.textContent='Confira a cópia abaixo. Autorizar também atualiza e reativa um acesso anterior para esse e-mail.';
        }catch(e){invalidate();status.textContent=erro(e);}
      });form.append(conferir,publicar,preview);
      form.addEventListener('submit',async e=>{e.preventDefault();if(!pending||busy||!valid())return;
        const draft=pending;busy=true;publicar.disabled=true;status.textContent='Publicando cópia…';
        try{const id=await ColaboracaoModelo.identificador(options.uid,options.alunoId,draft.destino);if(!valid())return;
          const ref=options.db.collection('colaboracoes').doc(id);
          await options.db.runTransaction(async tx=>{const parent=await tx.get(options.db.collection('alunos').doc(options.alunoId)),old=await tx.get(ref);if(!valid()||!parent.exists||parent.data().professorUid!==options.uid)throw new Error('O cadastro ou a conta foi alterado. Reabra o aluno.');
            tx.set(ref,{professorUid:options.uid,alunoId:options.alunoId,destinatarioEmail:draft.destino,papel:draft.papel,ativo:true,criadoEm:old.exists?old.data().criadoEm:stamp(),atualizadoEm:stamp()});
            tx.set(ref.collection('versoes').doc(draft.publication.publicacaoId),{publicadoEm:stamp()});
            tx.set(ref.collection('conteudo').doc('atual'),{...draft.publication,professorUid:options.uid,alunoId:options.alunoId,publicadoEm:stamp()});
          });if(valid()){invalidate();status.textContent='Acesso autorizado. O profissional entra pela opção “Conteúdos compartilhados comigo”, com esse e-mail verificado. Nenhum e-mail foi enviado automaticamente.';}
        }catch(e){if(valid())status.textContent=erro(e);}finally{busy=false;if(valid())publicar.disabled=!pending;}
      });
    }
  }
  window.ColaboracaoAluno={ativar};
})();
