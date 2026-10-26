(() => {
  'use strict';
  const papeis=Object.freeze({regente:'Professor regente',apoio:'Professor de apoio',coordenacao:'Coordenação pedagógica'});
  const texto=(value,max=4000)=>{
    const text=typeof value==='string'?value:'';
    if(text.length>max)throw new Error('Um conteúdo selecionado excede o tamanho permitido. Escolha menos conteúdo para compartilhar.');
    return text;
  };
  function email(value){
    const result=String(value||'').trim().toLowerCase();
    if(result.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(result))throw new Error('Informe o e-mail da conta do profissional no Diário.');
    return result;
  }
  async function identificador(uid,alunoId,destino){
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([uid,alunoId,email(destino)])));
    return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  function publicacao({perfil,pei,metas=[],registros=[],idsRegistros=[],incluirPei=false,incluirMetas=true}){
    let html='';
    if(incluirPei){
      html=pei?.peiHtml||'';
      if(pei?.peiComprimido)html=window.LZString.decompressFromUTF16(html)||'';
      if(!html.trim())throw new Error('Não há um PEI legível para compartilhar. Desmarque o PEI ou salve o formulário primeiro.');
    }
    const selectedMetas=incluirMetas?metas.filter(m=>['ativa','em_revisao'].includes(m.status)):[];
    const selectedRegistros=registros.filter(r=>idsRegistros.includes(r.id||r._id));
    if(selectedMetas.length>5||selectedRegistros.length>5)throw new Error('Compartilhe até cinco metas e cinco relatos por publicação.');
    const data={publicacaoId:crypto.randomUUID(),resumo:{nome:texto(perfil.nome,200),escola:texto(perfil.escola,200),turma:texto(perfil.turma,100),turno:texto(perfil.turno,100)},
      peiHtml:texto(html,200000),peiData:incluirPei?texto(pei.peiData,100):'',
      metas:selectedMetas.map(m=>({id:texto(m.id,1500),objetivo:texto(m.objetivo,600),detalhes:[
        ['Critério',texto(m.criterio)],['Estratégias',texto(m.estrategias)],['Apoios',texto(m.apoios)],
        ['Responsável',texto(m.responsavel,200)],['Revisão prevista',texto(m.revisao,20)],
        ['Situação',m.status==='ativa'?'Ativa':'Em revisão']
      ].filter(([,v])=>v).map(([label,v])=>label+': '+v).join('\n')})),
      registros:selectedRegistros.map(r=>({id:texto(r.id||r._id,1500),date:texto(r.date,20),text:texto(r.text,8000),por:texto(r.por,200)}))};
    if(new TextEncoder().encode(JSON.stringify(data)).length>850000)throw new Error('A publicação ficou muito grande. Selecione menos relatos ou desmarque o PEI.');
    return data;
  }
  function srcdoc(html){
    const parsed=new DOMParser().parseFromString(html,'text/html');
    parsed.querySelectorAll('script,iframe,object,embed,link,meta,base,form').forEach(n=>n.remove());
    parsed.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes]){
      const image=a.name==='src'&&n.tagName==='IMG'&&/^data:image\/(png|jpeg|gif|webp);base64,/i.test(a.value);
      if(/^on/i.test(a.name)||(['href','src','srcset','action'].includes(a.name)&&!image))n.removeAttribute(a.name);
    }});
    return '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data:;"><style>'+PEIVisualizacao.css+'</style><article id="peiConteudo">'+parsed.body.innerHTML+'</article>';
  }
  window.ColaboracaoModelo={papeis,email,identificador,publicacao,srcdoc};
})();
