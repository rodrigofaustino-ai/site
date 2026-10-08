'use strict';
const crypto = require('node:crypto');
const MAX_BYTES = 4 * 1024 * 1024;
const CERTIFICATES = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

function createHandler({fetchImpl = globalThis.fetch, env = process.env} = {}) {
  let certificates = null;
  let certificatesExpire = 0;
  const reply = (statusCode, error) => ({statusCode, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}, body: JSON.stringify({error})});

  async function certificate(kid) {
    if (!certificates || Date.now() >= certificatesExpire || !certificates[kid]) {
      const response = await fetchImpl(CERTIFICATES, {signal: AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('certificates-unavailable');
      certificates = await response.json();
      const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') || '')?.[1] || 300);
      certificatesExpire = Date.now() + Math.min(maxAge, 86400) * 1000;
    }
    return certificates[kid];
  }

  async function authenticate(authorization) {
    if (!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization || '')) return false;
    const parts = authorization.slice(7).split('.');
    if (parts.length !== 3) return false;
    let header, payload;
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url'));
      payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
    } catch (_) {return false;}
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length > 256) return false;
    const projects = (env.FIREBASE_PROJECT_IDS || 'salamulti,paee-3fea6').split(',').map(value => value.trim()).filter(Boolean);
    const now = Math.floor(Date.now() / 1000);
    if (!projects.includes(payload.aud) || payload.iss !== 'https://securetoken.google.com/' + payload.aud ||
        typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128 ||
        !Number.isFinite(payload.exp) || payload.exp <= now || !Number.isFinite(payload.iat) || payload.iat > now + 60) return false;
    const publicKey = await certificate(header.kid);
    if (!publicKey) return false;
    try {return crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), publicKey, Buffer.from(parts[2], 'base64url'));}
    catch (_) {return false;}
  }

  return async function handler(event) {
    if (event.httpMethod !== 'POST') return reply(405, 'Use POST para converter um DOCX.');
    const authorization = event.headers?.authorization || event.headers?.Authorization;
    try {
      if (!await authenticate(authorization)) return reply(401, 'Faça login novamente para gerar o PDF.');
    } catch (_) {return reply(503, 'Não foi possível verificar o login. Tente novamente.');}
    let endpoint;
    try {
      endpoint = new URL(env.DOCX_CONVERTER_URL);
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw Error();
    } catch (_) {return reply(503, 'O administrador precisa configurar o servidor de conversão PDF no Netlify.');}
    if (!env.DOCX_CONVERTER_TOKEN || env.DOCX_CONVERTER_TOKEN.length < 32) return reply(503, 'O administrador precisa configurar o acesso ao servidor de conversão PDF.');
    const body = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
    if (!body.length || body.length > MAX_BYTES) return reply(413, 'O documento excede o limite de 4 MB.');
    if (body[0] !== 0x50 || body[1] !== 0x4b) return reply(400, 'Envie um arquivo DOCX válido.');
    endpoint.pathname = endpoint.pathname.replace(/\/$/, '') + '/convert';
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST', redirect: 'error',
        headers: {'Authorization': 'Bearer ' + env.DOCX_CONVERTER_TOKEN, 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'},
        body, signal: AbortSignal.timeout(50000),
      });
      if (!response.ok) {
        if (response.status === 503) return reply(503, 'Conversor ocupado. Tente novamente em instantes.');
        if (response.status === 504) return reply(504, 'O documento levou muito tempo para converter.');
        if (response.status === 400 || response.status === 413) return reply(response.status, 'O conversor recusou o DOCX. Verifique o tamanho e as imagens incorporadas.');
        return reply(502, 'Não foi possível converter o DOCX. Verifique o servidor de conversão.');
      }
      if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/pdf')) return reply(502, 'O servidor de conversão não retornou um PDF.');
      const declaredSize = Number(response.headers.get('content-length'));
      if (declaredSize > MAX_BYTES) return reply(413, 'O PDF excede o limite de 4 MB.');
      const bytes = [];
      let length = 0;
      for await (const chunk of response.body) {
        length += chunk.length;
        if (length > MAX_BYTES) return reply(413, 'O PDF excede o limite de 4 MB.');
        bytes.push(Buffer.from(chunk));
      }
      const pdf = Buffer.concat(bytes);
      if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) return reply(502, 'O servidor retornou um PDF inválido.');
      return {statusCode: 200, isBase64Encoded: true, headers: {'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="documento.pdf"', 'Cache-Control': 'no-store'}, body: pdf.toString('base64')};
    } catch (_) {return reply(502, 'O servidor de conversão não respondeu. Tente novamente.');}
  };
}

exports.createHandler = createHandler;
exports.handler = createHandler();
