// T8: progreso/resultado con «Solo generar los PDF» (NO envia correo, no toca Outlook) en carpeta temporal + estados de error.
// Uso: node diseno/comprobar-t8-generar.js <exe> <carpeta-capturas> <entrega-dir> [puerto]
const { spawn } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const [exe, out, entrega, portArg] = process.argv.slice(2);
const SPORT = +(portArg || 48751), CPORT = 9355;
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 't8g-')); const appdata = path.join(tmp, 'appdata'); fs.mkdirSync(appdata); const salida = path.join(tmp, 'salida'); fs.mkdirSync(salida);
const malo = path.join(tmp, 'roto.xlsx'); fs.writeFileSync(malo, Buffer.alloc(0));
const malo2 = path.join(tmp, 'texto.xlsx'); fs.writeFileSync(malo2, 'esto no es un excel');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = []; const L = (ok, n, d = '') => console.log((ok === true ? 'OK    ' : ok === false ? 'FALLO ' : 'INFO  ') + n + (d ? ' -> ' + d : ''));
(async () => {
  const srv = spawn(exe, [], { env: { ...process.env, CERT_PORT: String(SPORT), CERT_NO_BROWSER: '1', APPDATA: appdata }, stdio: 'ignore', windowsHide: true });
  const base = `http://127.0.0.1:${SPORT}/`; for (let i = 0; i < 40; i++) { await sleep(400); try { if ((await fetch(base + 'api/info')).ok) break; } catch {} }
  const cp = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${CPORT}`, `--user-data-dir=${path.join(tmp, 'chr')}`, 'about:blank'], { stdio: 'ignore' });
  let tgt; for (let i = 0; i < 50 && !tgt; i++) { await sleep(300); try { tgt = (await (await fetch(`http://127.0.0.1:${CPORT}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errs.push('LOG ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('CONSOLE ' + d.params.args.map((a) => a.value || a.description).join(' ')); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error('eval ' + expr.slice(0, 60)); return r.result?.result?.value; };
  for (const m of ['Page.enable', 'Runtime.enable', 'Log.enable', 'DOM.enable']) await send(m);
  const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, `t8-${n}.png`), Buffer.from(r.result.data, 'base64')); };
  const upload = async (sel, files) => { const d = await send('DOM.getDocument', { depth: 0 }); const n = await send('DOM.querySelector', { nodeId: d.result.root.nodeId, selector: sel }); await send('DOM.setFileInputFiles', { nodeId: n.result.nodeId, files }); };
  const waitFor = async (expr, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(250); } return false; };
  const go = async (n) => { await ev(`document.querySelector('.step[data-go="${n}"]').click()`); await sleep(350); };
  for (const w of [360, 768, 1280]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 500 ? 780 : 860, deviceScaleFactor: 1, mobile: w < 500 });
    await send('Page.navigate', { url: base }); await sleep(1800);
    // sin lista cargada: pantallas 6 y 7 en estado vacio (opcion D y C)
    await ev(`document.querySelector('.modo[data-modo=correo]').click()`); await sleep(400); await go(6); await sleep(300);
    if (w === 1280) L(null, 'D sin lista: vista previa del correo', await ev(`document.getElementById('mailPrev').innerText.replace(/[ \\t\\n]+/g,'_').slice(0,120)`));
    await shot(`${w}-p6-sin-lista`); await go(7); await sleep(400);
    if (w === 1280) L(null, 'D sin lista: pantalla 7', await ev(`document.getElementById('checklist').innerText.replace(/[ \\t\\n]+/g,'_').slice(0,200)+' | btn='+document.getElementById('bEnviar').textContent`));
    await shot(`${w}-p7-sin-lista`);
    await ev(`document.querySelector('.step[data-go="0"]').click()`); await sleep(300);
    await ev(`document.querySelector('.modo[data-modo=certificados]').click()`); await sleep(400); await go(1);
    // error de archivo ilegible
    await upload('#fLista', [malo2]); await sleep(2500); if (w === 1280) L(null, 'p1: .xlsx que en realidad es texto', await ev(`'listaEstado=['+document.querySelector('#listaEstado').innerText.replace(/\s+/g,' ')+'] tabla=['+document.querySelector('#tabla').innerText.replace(/\s+/g,' ').slice(0,160)+'] toast='+document.getElementById('toast').innerText`));
    await ev(`window.__f=window.fetch; window.fetch=(u,o)=>String(u).includes("api/lista")?Promise.resolve(new Response(JSON.stringify({error:'Formato no reconocido (simulado)'}),{status:500,headers:{'content-type':'application/json'}})):window.__f(u,o)`); await upload('#fLista', [malo]); const er = await waitFor(`!!document.querySelector('#listaEstado .estado-error')`, 8000); if (w === 1280) L(null, 'p1: binario .xlsx', await ev(`'listaEstado=['+document.querySelector('#listaEstado').innerText+'] drop.hide='+document.getElementById('drop').classList.contains('hide')+' tabla='+document.querySelector('#tabla').innerText.slice(0,100)+' toast='+document.getElementById('toast').innerText`));
    if (w === 1280) L(er, 'p1: fallo del servidor al leer (simulado en el navegador) muestra estado de error', await ev(`document.querySelector('#listaEstado').innerText.replace(/\\s+/g,' ').slice(0,200)+' | drop oculto='+document.getElementById('drop').classList.contains('hide')`));
    await shot(`${w}-p1-error-archivo`); await ev(`window.fetch=window.__f`);
    await upload('#fLista', [path.join(entrega, 'asistentes-ejemplo.xlsx')]); await waitFor(`document.querySelectorAll('#tabla tr').length>2 && !document.querySelector('#listaEstado').innerHTML`);
    if (w === 1280) L(await ev(`document.getElementById('drop').classList.contains('hide')===false && !document.querySelector('#listaEstado .estado-error')`), 'p1: tras error, un archivo valido restablece la pantalla', await ev(`'filas='+document.querySelectorAll('#tabla tr').length+' est=['+document.querySelector('#listaEstado').innerText+'] drophide='+document.getElementById('drop').classList.contains('hide')`));
    // filtro sin resultados
    await ev(`(()=>{const f=document.getElementById('filtro'); f.value='zzzzzz'; f.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(300);
    const vacio = await ev(`!!document.querySelector('#tabla .estado-vacio')`); if (w === 1280) L(vacio, 'p1: busqueda sin resultados muestra estado vacio');
    await shot(`${w}-p1-filtro-vacio`); await ev(`document.getElementById('bBorrarFiltro')?.click()`); await sleep(300);
    // evento + carpeta de salida temporal
    await go(2); for (const [k, v] of [['evento.evento', 'Jornada QA'], ['evento.fecha', '12 de diciembre de 2026'], ['evento.horas', '2']]) await ev(`(()=>{const e=document.querySelector('[data-bind="${k}"]'); e.value=${JSON.stringify(v)}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    await go(7); await sleep(400);
    await ev(`(()=>{const e=document.getElementById('carpetaSalida'); e.value=${JSON.stringify(salida)}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
    const prevId = (await (await fetch(base + 'api/estado')).json()).id; await ev(`document.getElementById('bGenerar').click()`);
    const fin = await waitFor(`window._job&&window._job.id!==${JSON.stringify(prevId ?? null)}&&window._job.corriendo===false&&/Generados/.test(document.getElementById('progTitulo').textContent)`, 60000);
    await sleep(800);
    L(fin, `${w}px: «Solo generar» termina`, await ev(`document.getElementById('progTitulo').textContent+' | filas log='+(document.querySelectorAll('#tablaLog tr').length-1)+' | estados='+[...new Set([...document.querySelectorAll('#tablaLog .pill')].map(p=>p.innerText.trim()))].join(',')`));
    if (w === 1280) { L(null, 'tabla de estado', await ev(`[...document.querySelectorAll('#tablaLog tr')].slice(0,5).map(r=>r.innerText.replace(/\\s+/g,' ')).join(' ## ')`)); }
    const ov = await ev(`({sw:document.documentElement.scrollWidth,iw:innerWidth})`); if (ov.sw > ov.iw) L(false, `${w}px p7 con progreso: desborde`, JSON.stringify(ov));
    await ev(`document.getElementById('progreso').scrollIntoView()`); await sleep(300); await shot(`${w}-p7-progreso`);
    const archivos = fs.readdirSync(salida, { recursive: true }).length; if (w === 1280) L(archivos > 0, 'se escribieron PDFs/registro en la carpeta temporal', archivos + ' elementos');
  }
  L(errs.length ? false : true, 'consola sin errores', [...new Set(errs)].slice(0, 8).join(' || ') || 'ninguno');
  ws.close(); cp.kill(); srv.kill(); await sleep(500); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} process.exit(0);
})().catch((e) => { console.error('ERROR', e); process.exit(2); });
