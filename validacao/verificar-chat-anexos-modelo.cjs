'use strict';const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../chat-anexos-modelo.js'),'utf8'),c);const M=c.window.ChatAnexosModelo;let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};const fail=async p=>{await assert.rejects(p);n++;};
(async()=>{
 const pdf=new File(['%PDF-1.4\nFICTICIO'],'exemplo.pdf',{type:'application/octet-stream'});const info=await M.validar(pdf);eq(info.tipo,'application/pdf');eq(info.nome,'exemplo.pdf');eq(info.tamanho,pdf.size);
 const longo=await M.validar(new File(['%PDF-1.4'],'a'.repeat(220)+'.pdf'));eq(longo.nome.length,180);eq(longo.nome.endsWith('.pdf'),true);
 await fail(M.validar(new File([],'vazio.pdf')));await fail(M.validar(new File(['<svg/>'],'imagem.svg')));await fail(M.validar(new File(['<html/>'],'imagem.png')));await fail(M.validar(new File(['incorreto'],'invalido.pdf')));await fail(M.validar(new File([new Uint8Array(10485761)],'grande.txt')));
 const max=await M.validar(new File([new Uint8Array(10485760)],'limite.txt'));eq(max.tamanho,10485760);
 const m={id:'mensagem-1',autorUid:'a'},a={...info,caminho:M.caminho('a','mensagem-1')};eq(M.metaValida(a,m),true);eq(M.metaValida({...a,caminho:M.caminho('b','mensagem-1')},m),false);eq(M.metaValida({...a,tipo:'text/html'},m),false);eq(M.metaValida({...a,tamanho:1.5},m),false);eq(M.metaValida({...a,tamanho:10485761},m),false);
 eq(M.imagem('image/gif'),true);eq(M.imagem('application/pdf'),false);
 for(const file of ['../producao/salamulti.rules','../producao/salamulti-storage.rules']){const rules=fs.readFileSync(path.join(__dirname,file),'utf8');for(const mime of new Set(Object.values(M.tipos)))assert(rules.includes(mime),mime);n++;}
 console.log(n+' verificações do modelo de anexos aprovadas: tamanho, MIME, assinatura de imagem/PDF, nome e contrato das regras.');
})().catch(e=>{console.error(e);process.exitCode=1;});
