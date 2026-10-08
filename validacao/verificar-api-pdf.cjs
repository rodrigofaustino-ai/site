'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const JSZip = require('jszip');
const {startConverter} = require('./apoio-conversor.cjs');
const {createHandler} = require('../netlify/functions/convert-docx.js');

(async()=>{
  const converter=await startConverter();
  try {
    const body=fs.readFileSync('/tmp/site-results/PAEE_Ana_Sao_Teste.docx');
    const event={httpMethod:'POST',headers:{authorization:'Bearer '+converter.idToken},body:body.toString('base64'),isBase64Encoded:true};
    const expected = async (change,code) => {const result=await converter.handler({...event,...change});assert.equal(result.statusCode,code,result.body);};
    await expected({httpMethod:'GET'},405);
    await expected({headers:{}},401);
    await expected({headers:{authorization:'Bearer '+converter.token({exp:0})}},401);
    await expected({headers:{authorization:'Bearer '+converter.token({aud:'outro-projeto'})}},401);
    await expected({headers:{authorization:'Bearer '+converter.token({iss:'https://securetoken.google.com/outro-projeto'})}},401);
    const parts=converter.idToken.split('.');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);
    await expected({headers:{authorization:'Bearer '+parts.join('.')}},401);
    await expected({body:Buffer.alloc(4*1024*1024+1).toString('base64')},413);
    await expected({body:Buffer.from('não é DOCX').toString('base64')},400);
    await expected({body:Buffer.from('PKarquivo inválido').toString('base64')},400);
    const missingConfig=createHandler({env:{},fetchImpl:converter.fetchImpl});
    assert.equal((await missingConfig(event)).statusCode,503);
    const insecureConfig=createHandler({env:{...converter.env,DOCX_CONVERTER_URL:'http://converter.test'},fetchImpl:converter.fetchImpl});
    assert.equal((await insecureConfig(event)).statusCode,503);
    let received;
    const transparent=createHandler({env:converter.env,fetchImpl:async(url,options)=>{
      if(String(url)==='https://converter.test/convert')received=Buffer.from(options.body);
      return converter.fetchImpl(url,options);
    }});
    const converted=await transparent(event);
    assert.equal(converted.statusCode,200);
    assert.deepEqual(received,body,'O conversor deve receber o DOCX byte a byte, sem reconstrução.');
    assert.equal(Buffer.from(converted.body,'base64').subarray(0,5).toString(),'%PDF-');
    const falsePdf=createHandler({env:converter.env,fetchImpl:async(url,options)=>String(url)==='https://converter.test/convert'?new Response('erro',{headers:{'content-type':'application/pdf'}}):converter.fetchImpl(url,options)});
    assert.equal((await falsePdf(event)).statusCode,502);
    const unavailable=createHandler({env:converter.env,fetchImpl:async(url,options)=>String(url)==='https://converter.test/convert'?new Response('ocupado',{status:503}):converter.fetchImpl(url,options)});
    assert.equal((await unavailable(event)).statusCode,503);
    const denied=await fetch(converter.address+'/convert',{method:'POST',body});
    assert.equal(denied.status,401);
    const malformed=await fetch(converter.address+'/convert',{method:'POST',headers:{Authorization:'Bearer '+converter.serviceToken},body:Buffer.from('PKnão é zip')});
    assert.equal(malformed.status,400);
    const packageWithExternal=await JSZip.loadAsync(body);
    packageWithExternal.file('word/_rels/external.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdUnsafe" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="http://example.invalid/imagem.png" TargetMode="External"/></Relationships>');
    const externalBytes=await packageWithExternal.generateAsync({type:'nodebuffer'});
    await expected({body:externalBytes.toString('base64')},400);
    const malformedPaths=await JSZip.loadAsync(body);malformedPaths.file('../arquivo.txt','arquivo de teste');
    const pathBytes=await malformedPaths.generateAsync({type:'nodebuffer'});
    await expected({body:pathBytes.toString('base64')},400);
    console.log('API PDF: autenticação, assinatura JWT, limites, erros e transporte DOCX intacto confirmados.');
  } finally {converter.stop();}
})().catch(error=>{console.error(error);process.exit(1)});
