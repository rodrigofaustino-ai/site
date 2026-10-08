'use strict';
const {spawn,spawnSync} = require('node:child_process');
const crypto = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const {createHandler} = require('../netlify/functions/convert-docx.js');

async function startConverter() {
  const port = await new Promise(resolve => {
    const reservation = net.createServer();
    reservation.listen(0,'127.0.0.1',()=>{const port=reservation.address().port;reservation.close(()=>resolve(port));});
  });
  const serviceToken = crypto.randomBytes(32).toString('hex'); // Credencial efêmera somente do teste local.
  const useDocker=process.env.SRM_TEST_DOCKER === '1';
  const name='srm-converter-test-'+crypto.randomBytes(5).toString('hex');
  const processHandle = spawn(useDocker?'docker':'python3',useDocker?['--config','/tmp/srm-docker-config','run','--rm','--name',name,'-p','127.0.0.1:'+port+':8080','-e','DOCX_CONVERTER_TOKEN','srm-docx-converter:validation']:[path.resolve(__dirname,'../conversor/server.py')],{
    env:{...process.env,...(useDocker?{}:{PORT:String(port)}),DOCX_CONVERTER_TOKEN:serviceToken},stdio:['ignore','pipe','pipe'],
  });
  const stop=()=>{if(useDocker)spawnSync('docker',['--config','/tmp/srm-docker-config','rm','-f',name],{stdio:'ignore',timeout:10000});processHandle.kill();};
  let startupError='';
  processHandle.stderr.on('data',chunk=>{startupError+=chunk.toString().replaceAll(serviceToken,'[token de teste]');});
  let startupOutput='';
  processHandle.stdout.on('data',chunk=>{startupOutput+=chunk.toString().replaceAll(serviceToken,'[token de teste]');});
  const address = 'http://127.0.0.1:'+port;
  for (let attempt=0;attempt<100;attempt++) {
    try {const response=await fetch(address+'/health');if(response.ok) break;} catch (_) {}
    if (processHandle.exitCode !== null) {stop();throw new Error('Conversor de teste não iniciou. '+startupError);}
    if(attempt===99){stop();throw new Error('Conversor de teste não iniciou. '+startupError+startupOutput);}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  const {privateKey,publicKey} = crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  const keyPem = publicKey.export({type:'spki',format:'pem'});
  const certificateUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
  function token(overrides={}) {
    const now=Math.floor(Date.now()/1000);
    const header=Buffer.from(JSON.stringify({alg:'RS256',kid:'local-test'})).toString('base64url');
    const payload=Buffer.from(JSON.stringify({aud:'salamulti',iss:'https://securetoken.google.com/salamulti',sub:'usuario-ficticio',iat:now,exp:now+3600,...overrides})).toString('base64url');
    const signature=crypto.sign('RSA-SHA256',Buffer.from(header+'.'+payload),privateKey).toString('base64url');
    return header+'.'+payload+'.'+signature;
  }
  const env={DOCX_CONVERTER_URL:'https://converter.test',DOCX_CONVERTER_TOKEN:serviceToken};
  const fetchImpl = async (url,options) => {
    if(String(url)===certificateUrl) return new Response(JSON.stringify({'local-test':keyPem}),{headers:{'cache-control':'max-age=3600','content-type':'application/json'}});
    if(String(url)==='https://converter.test/convert') return fetch(address+'/convert',options);
    throw new Error('Destino inesperado no teste.');
  };
  const handler=createHandler({env,fetchImpl});
  const idToken=token();
  async function browserFetch(url,options) {
    if(url!=='/.netlify/functions/convert-docx') throw new Error('Endpoint inesperado.');
    const body=Buffer.from(await options.body.arrayBuffer());
    const result=await handler({httpMethod:options.method,headers:options.headers,body:body.toString('base64'),isBase64Encoded:true});
    return new Response(result.isBase64Encoded ? Buffer.from(result.body,'base64') : result.body,{status:result.statusCode,headers:result.headers});
  }
  return {address,serviceToken,handler,token,idToken,browserFetch,fetchImpl,env,stop};
}

module.exports={startConverter};
