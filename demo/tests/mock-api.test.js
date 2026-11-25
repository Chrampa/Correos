'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname,'../datos/mock-fixtures.json'),'utf8'));
let now = 0, id = 0, nativeCalls = 0, blocked = 0;
const tasks = new Map();
class LocalURL extends URL {}
LocalURL.createObjectURL = () => 'blob:demo/' + (++id);
LocalURL.revokeObjectURL = () => {};
const context = { __DEMO_DATA__: fixtures, URL:LocalURL, Request, Response, Blob, FormData, TextEncoder, DOMException, console:{error:() => blocked++}, location:{href:'https://demo.invalid/sub/index.html',origin:'https://demo.invalid'}, navigator:{serviceWorker:{}}, fetch:() => { nativeCalls++; }, setTimeout:(fn, ms) => { const n = ++id; tasks.set(n,{fn,at:now+ms}); return n; }, clearTimeout:n=>tasks.delete(n) };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/mock-api.js'),'utf8'),context);
vm.runInContext('let tRebote = 0;', context);
async function tick(ms) { const end = now + ms; for (;;) { const entry = [...tasks.entries()].filter(x=>x[1].at<=end).sort((a,b)=>a[1].at-b[1].at)[0]; if (!entry) break; now=entry[1].at; tasks.delete(entry[0]); entry[1].fn(); await Promise.resolve(); } now=end; await Promise.resolve(); }
async function call(route, body, raw) { const p = context.fetch(route,body === undefined ? {} : {method:'POST',body:raw ? body : JSON.stringify(body)}); await Promise.resolve(); await tick(750); return p; }
async function data(route,body) { return (await call(route,body)).json(); }
const rows = fixtures.hojas[1].filas, config = Object.assign({},fixtures.config,{modo:'correo'});
async function main() {
  assert.equal(context.DemoMock.ready,true);
  assert.equal(Object.keys(context.DemoMock.routes).length,15);
  assert.deepEqual(await data('/api/estado'),{});
  const info = await data('/api/info'); assert.equal(info.version,'1.4.0-demo'); assert.equal(info.so,'web-demo');
  assert.equal((await data('/api/config',{config:{smtp:{pass:'secret',preset:'outlook'}}})).ok,true);
  assert.equal((await data('/api/info')).config.smtp.pass,undefined);
  await data('/api/config',{config});
  const list = await data('/api/lista',{nombre:'private.xlsx',datos:'ignored'}); assert.equal(list.hojas[1].filas.length,6); assert.equal(list.hojas[0].filas.length,0);
  context.DemoMock.setScenario('error-carga'); assert.equal((await call('/api/lista',{})).status,400);
  context.DemoMock.setScenario('lista-vacia'); assert.equal((await data('/api/lista',{})).hojas.length,1);
  context.DemoMock.setScenario('normal');
  const preview = await call('/api/vista',{config:{evento:{evento:'<script>bad</script>'},certificado:{color:'url(https://bad.invalid)'}},fila:rows[0],tipo:'certificado'});
  assert.equal(preview.headers.get('content-type'),'image/svg+xml'); assert.equal(preview.headers.get('x-faltan'),'%5B%5D'); assert.ok((await preview.text()).includes('&lt;script&gt;'));
  context.DemoMock.setScenario('vista-fallida'); assert.equal((await call('/api/vista',{})).status,400);
  context.DemoMock.setScenario('conexion-fallida'); assert.equal((await data('/api/smtp',{})).ok,false);
  context.DemoMock.setScenario('normal'); assert.equal((await data('/api/smtp',{})).info.usuario,'cuenta@example.invalid');
  assert.equal((await data('/api/prueba',{para:'prueba@example.invalid',fila:rows[0]})).ok,true);
  assert.equal((await data('/api/prueba',{para:'no-valido@dominio-no-permitido.invalid'})).ok,false);
  assert.equal((await data('/api/rebotes',{config})).conJob,false);
  assert.equal((await data('/api/rebotes',{config:{smtp:{preset:'gmail'}}})).ok,false);
  assert.equal((await data('/api/rebotes',{config,dias:0})).rebotes.length,0);
  const docs = (await data('/api/recibidos?nombre=demo.zip',new Blob(['ignored']),true)).docs;
  assert.equal(docs.length,4); assert.ok(docs[3].error);
  const single = await (await call('/api/recibidos?nombre=demo.pdf',new Blob(['ignored']),true)).json(); assert.equal(single.docs.length,1); assert.notEqual(single.docs[0].id,docs[0].id);
  const pdf = await call('/api/recibido?id='+docs[0].id); assert.equal(pdf.headers.get('content-type'),'application/pdf'); assert.ok((await pdf.text()).startsWith('%PDF-1.4'));
  assert.ok(context.DemoMock.documentURL(docs[0].id).startsWith('blob:'));
  assert.equal((await call('/api/recibido?id=missing')).status,404);
  context.DemoMock.setScenario('zip-vacio'); assert.equal((await call('/api/recibidos?nombre=x.zip',new Blob(),true)).status,400); context.DemoMock.setScenario('normal');
  const excel = await call('/api/excel',{columnas:['Nombre'],filas:[{Nombre:'=1+1'}],extra:[{'Estado entrega':'Enviado'}]});
  assert.ok(excel.headers.get('content-type').includes('spreadsheetml')); const bytes = Buffer.from(await excel.arrayBuffer()); assert.equal(bytes.readUInt32LE(),0x04034b50); assert.ok(bytes.includes(Buffer.from('inlineStr'))); assert.ok(bytes.includes(Buffer.from('=1+1'))); assert.ok(bytes.includes(Buffer.from('Estado entrega')));
  assert.equal((await data('/api/abrir',{})).ok,true);
  assert.equal((await call('/api/ejecutar',{filas:rows,indices:[],config})).status,400);
  // Direct calls permit inspecting the pending state before the first 1000 ms tick.
  let p = context.fetch('/api/ejecutar',{method:'POST',body:JSON.stringify({filas:rows,indices:[0,1,2,3,4,5],config,modo:'enviar'})}); await tick(80); assert.equal((await (await p).json()).ok,true);
  assert.equal(context.DemoMock.getState().hechos,0); assert.equal(context.DemoMock.getState().total,4);
  assert.equal((await call('/api/ejecutar',{filas:rows,indices:[0],config})).status,409);
  await tick(250); assert.equal(context.DemoMock.getState().log[0].estado,'Enviado');
  await tick(3000); let job=context.DemoMock.getState(); assert.equal(job.corriendo,false); assert.equal(job.hechos,4); assert.equal(job.ok,3); assert.equal(job.fallos,1); assert.equal(job.log[2].estado,'Error'); assert.equal(job.log[0].adjuntos,0);
  await data('/api/estado'); assert.equal(vm.runInContext('tRebote',context),job.id);
  let lateCalls = 0;
  if (vm.runInContext('tRebote',context) !== job.id) context.setTimeout(() => lateCalls++,150000);
  await tick(1200); job=context.DemoMock.getState(); assert.equal(job.log[1].estado,'Rebotado'); assert.equal(job.ok,2); assert.equal(job.fallos,2); assert.equal(job.rebotados,1);
  assert.equal((await data('/api/rebotes',{config})).marcados,0);
  const firstID=job.id;
  await data('/api/ejecutar',{filas:[rows[2],rows[1]],indices:[0,1],modo:'enviar',reutilizar:true,config}); await tick(3400); job=context.DemoMock.getState(); assert.ok(job.id>firstID); assert.equal(job.ok,2); assert.equal(job.fallos,0); assert.equal(job.rebotados,0);
  await data('/api/estado'); assert.equal(vm.runInContext('tRebote',context),job.id); await tick(150000); assert.equal(lateCalls,0);
  await data('/api/ejecutar',{filas:rows,indices:[4,5],modo:'generar',config}); await tick(2000); job=context.DemoMock.getState(); assert.equal(job.total,2); assert.ok(job.log.every(l=>l.estado==='Generado'));
  await data('/api/ejecutar',{filas:rows,indices:[0,1,2,3],modo:'enviar',config}); await data('/api/parar',{}); const stopped=context.DemoMock.getState(); await tick(6000); assert.equal(context.DemoMock.getState().hechos,stopped.hechos); assert.equal(stopped.parar,true);
  for (const url of ['https://evil.invalid/api/info','http://127.0.0.1/api/info','/api/unknown','/relative.js','/api/info?bad=1','https://u:p@demo.invalid/api/info']) await assert.rejects(context.fetch(url),/bloqueada/);
  await assert.rejects(context.fetch('/api/info',{method:'POST'}),/bloqueada/);
  await assert.rejects(context.fetch('/api/config',{method:'POST',body:new FormData()}),/bloqueada/);
  for (const k of ['XMLHttpRequest','EventSource','WebSocket','Worker','SharedWorker']) assert.throws(()=>new context[k]('https://bad.invalid'),/bloqueada/);
  assert.throws(()=>context.navigator.sendBeacon('/x'),/bloqueada/); await assert.rejects(context.navigator.serviceWorker.register('/sw.js'),/bloqueada/); assert.throws(()=>context.open('https://bad.invalid'),/bloqueada/);
  const req=context.fetch(new Request('https://demo.invalid/api/info')); await tick(80); assert.equal((await req).status,200);
  for (const route of ['api/info','./api/info','/sub/api/info']) assert.equal((await call(route)).status,200);
  context.location = {href:'file:///C:/demo/dist/index.html',origin:'null'};
  for (const route of ['/api/lista','api/lista','file:///C:/api/lista','file:///C:/demo/dist/api/lista']) assert.equal((await data(route,{nombre:'demo.xlsx',datos:'ignored'})).hojas[1].filas.length,6);
  for (const route of ['file:///D:/api/info','file://other/C:/api/info','https://demo.invalid/api/info','file:///C:/other/api/info']) await assert.rejects(context.fetch(route),/bloqueada/);
  context.location = {href:'https://demo.invalid/sub/index.html',origin:'https://demo.invalid'};
  const ac=new AbortController(); ac.abort(); await assert.rejects(context.fetch('/api/info',{signal:ac.signal}),{name:'AbortError'});
  assert.equal(await context.DemoMock.networkCheck(),true); assert.equal(nativeCalls,0); assert.ok(blocked>=17);
  assert.equal((await data('/api/salir',{})).ok,true); assert.equal((await call('/api/info')).status,410);
  context.DemoMock.dispose();
  console.log('PASS: 15 rutas; MIME y payloads; fixtures; SVG escapado; PDF/XLSX reales; estados pendiente/enviado/error/rebotado/reintento/generado/parado; AbortSignal; bloqueo de red (0 llamadas nativas); regresión file Windows/subcarpetas; temporizador heredado de 150 s suprimido por ID.');
}
async function browserRegression() {
  // Reuse only the existing CDP harness, not its main test or build. Serve the
  // current artifact with our two scripts replaced in memory; no shared output
  // is written while another worker owns build-demo.js/dist.
  const harness = fs.readFileSync(path.join(__dirname,'browser.test.js'),'utf8').split('async function main()')[0];
  const h = new Function('require','__dirname',harness + '\nreturn {chromePath,startProcess,until,getJson,connectCDP,wait};')(require,__dirname);
  const http = require('node:http'), os = require('node:os'), crypto = require('node:crypto');
  const {pathToFileURL} = require('node:url');
  let html = fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
  let replacements = 0;
  html = html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g,(whole,attrs,script) => {
    const file = script.includes('Demo transport. ES2019') ? 'mock-api.js' : script.includes("banner.id = 'demo-banner'") ? 'demo-banner.js' : null;
    if (!file) return whole;
    replacements++;
    const replacement = fs.readFileSync(path.join(__dirname,'../src',file),'utf8');
    const hash = x => crypto.createHash('sha256').update(x).digest('base64');
    // CSP appears before scripts: update it separately after replacement.
    hashes.push([hash(script),hash(replacement)]);
    return '<script'+attrs+'>'+replacement+'</script>';
  });
  assert.equal(replacements,2);
  for (const pair of hashes) html=html.split(pair[0]).join(pair[1]);
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'demo-regression-'));
  let chrome,cdp;
  try {
    chrome=h.startProcess(h.chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking','--no-first-run','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank']);
    const port=await h.until(()=>fs.existsSync(path.join(profile,'DevToolsActivePort')) && fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/)[0],'Chrome');
    const targets=await h.getJson('http://127.0.0.1:'+port+'/json/list');
    cdp=await h.connectCDP(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
    const requests=[];
    cdp.onMessage(m=>{
      if(m.method==='Network.requestWillBeSent') requests.push(m.params.request.url);
      if(m.method==='Fetch.requestPaused') cdp.command('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from(html).toString('base64')}).catch(console.error);
    });
    await cdp.command('Runtime.enable'); await cdp.command('Network.enable'); await cdp.command('Page.enable');
    const evaluate=async expression=>{const r=await cdp.command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value;};
    await cdp.command('Page.navigate',{url:origin+'/sub/index.html'});
    await h.until(()=>evaluate('!!window.DemoMock && DemoMock.ready'),'mock ready');
    for (const expression of ["location.assign('http://127.0.0.1:1/x')","location.href='http://127.0.0.1:1/x'","location.replace('http://127.0.0.1:1/x')"]) {
      await evaluate(expression); await h.wait(150); assert.equal(await evaluate('location.href'),origin+'/sub/index.html');
    }
    assert.equal(requests.filter(u=>u.startsWith('http://127.0.0.1:1/')).length,0);
    console.log('PASS Chrome: assign/href/replace externos cancelados; 0 solicitudes al destino.');
    await evaluate("const trigger = document.createElement('button'); trigger.id='test-download-trigger'; trigger.textContent='Descargas'; document.body.append(trigger); trigger.focus(); window.dispatchEvent(new Event('demo:downloads'))");
    assert.equal(await evaluate("document.getElementById('demo-downloads').getAttribute('aria-labelledby')"),'demo-downloads-title');
    await evaluate("document.getElementById('demo-downloads').close()"); await h.wait(100);
    assert.equal(await evaluate('document.activeElement.id'),'test-download-trigger');
    // New page bypasses the deliberately protected navigation of the first.
    const target=await cdp.command('Target.createTarget',{url:'about:blank'});
    const all=await h.getJson('http://127.0.0.1:'+port+'/json/list'); cdp.socket.close();
    cdp=await h.connectCDP(all.find(t=>t.id===target.targetId).webSocketDebuggerUrl);
    cdp.onMessage(m=>{if(m.method==='Fetch.requestPaused') cdp.command('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from(html).toString('base64')}).catch(console.error);});
    await cdp.command('Runtime.enable'); await cdp.command('Page.enable');
    await cdp.command('Fetch.enable',{patterns:[{urlPattern:'file://*',resourceType:'Document',requestStage:'Request'}]});
    const fileURL=pathToFileURL(path.join(__dirname,'../dist/index.html')).href;
    await cdp.command('Page.navigate',{url:fileURL});
    await h.until(()=>evaluate('!!window.DemoMock && DemoMock.ready'),'file mock ready');
    await evaluate("elegirModo('correo')");
    const doc=await cdp.command('DOM.getDocument'); const input=await cdp.command('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#fLista'});
    await cdp.command('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[path.resolve(__dirname,'../datos/asistentes-demo.xlsx')]});
    await h.until(()=>evaluate("typeof filas !== 'undefined' && filas.length === 6 && document.getElementById('tabla').textContent.includes('Persona Demo Uno')"),'Excel file paints six people');
    console.log('PASS Chrome file:///C:/: carga real del input Excel, seis personas pintadas.');
    await evaluate("window.dispatchEvent(new Event('demo:closed')); document.body.innerHTML = ''");
    await h.until(()=>evaluate("!!document.getElementById('demo-ended') && document.getElementById('demo-ended').textContent.length > 0"),'status final');
    assert.equal(await evaluate("document.getElementById('demo-ended').getAttribute('role')"),'status');
    assert.equal(await evaluate("document.getElementById('demo-ended').getAttribute('aria-live')"),'polite');
    console.log('PASS Chrome: nombre accesible de diálogo, restitución de foco y estado final aria-live.');
  } finally { if(cdp) cdp.socket.close(); if(chrome) chrome.child.kill(); await new Promise(resolve=>server.close(resolve)); }
}
const hashes=[];
(process.argv.includes('--browser') ? browserRegression() : main()).catch(e=>{console.error(e);process.exitCode=1;});
