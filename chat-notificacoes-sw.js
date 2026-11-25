/* Somente avisos locais do chat: sem cache, push ou interceptação de rede. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.canal==='srm-chat-identificar'&&event.ports?.[0]&&event.source?.id)event.ports[0].postMessage({clienteId:event.source.id});});
self.addEventListener('notificationclick',event=>{
 const data=event.notification.data||{};event.notification.close();if(data.canal!=='srm-chat-navegador')return;
 event.waitUntil((async()=>{const client=data.clienteId?await self.clients.get(data.clienteId):null;if(client&&new URL(client.url).origin===self.location.origin){await client.focus();client.postMessage({canal:'srm-chat-navegador',acao:'abrir',sessao:data.sessao});}else await self.clients.openWindow(new URL('index.html',self.registration.scope).href);})());
});
