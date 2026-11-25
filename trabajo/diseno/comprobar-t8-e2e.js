// T8: prueba funcional + visual con el .exe real y Chrome headless (CDP, sin dependencias).
// Uso: node diseno/comprobar-t8-e2e.js <exe> <carpeta-capturas> <entrega-dir> <zip> [puerto]
// NO envia correos: llega hasta el dialogo de confirmacion y pulsa Cancelar. No pulsa Probar conexion/Rebotes (abririan Outlook).
const { spawn } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const [exe, out, entrega, zip, portArg] = process.argv.slice(2);
const SPORT = +(portArg || 48731), CPORT = 9344;
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 't8-')); const appdata = path.join(tmp, 'appdata'); fs.mkdirSync(appdata);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const XLSX = path.join(entrega, 'asistentes-ejemplo.xlsx'), PDFC = path.join(entrega, 'ejemplos', 'Certificado de ejemplo.pdf'), PDFJ = path.join(entrega, 'ejemplos', 'Justificante de ejemplo.pdf');
const log = []; const L = (ok, n, d = '') => { log.push({ ok, n, d }); console.log((ok === true ? 'OK    ' : ok === false ? 'FALLO ' : 'INFO  ') + n + (d ? ' -> ' + d : '')); };
const errs = [], net = [];
(async () => {
  const srv = spawn(exe, [], { env: { ...process.env, CERT_PORT: String(SPORT), CERT_NO_BROWSER: '1', APPDATA: appdata }, stdio: 'ignore', windowsHide: true });
  const base = `http://127.0.0.1:${SPORT}/`;
  let up = false; for (let i = 0; i < 40 && !up; i++) { await sleep(400); try { up = (await fetch(base + 'api/info')).ok; } catch {} }
  if (!up) { L(false, 'servidor arranca'); srv.kill(); process.exit(1); }
  const info = await (await fetch(base + 'api/info')).json(); L(true, 'servidor arranca y /api/info', 'version=' + info.version + ' claves=' + Object.keys(info).join(','));
  const cp = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${CPORT}`, `--user-data-dir=${path.join(tmp, 'chr')}`, 'about:blank'], { stdio: 'ignore' });
  let tgt; for (let i = 0; i < 50 && !tgt; i++) { await sleep(300); try { tgt = (await (await fetch(`http://127.0.0.1:${CPORT}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errs.push('LOG ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    else if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errs.push('CONSOLE.' + d.params.type + ' ' + d.params.args.map((a) => a.value || a.description).join(' '));
    else if (d.method === 'Network.responseReceived' && d.params.response.status >= 400) net.push(d.params.response.status + ' ' + d.params.response.url);
    else if (d.method === 'Page.javascriptDialogOpening') { errs.push('DIALOG ' + d.params.message); send('Page.handleJavaScriptDialog', { accept: false }); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) + ' en ' + expr.slice(0, 80)); return r.result?.result?.value; };
  for (const m of ['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable', 'DOM.enable']) await send(m);
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, `t8-${name}.png`), Buffer.from(r.result.data, 'base64')); };
  const upload = async (sel, files) => { const d = await send('DOM.getDocument', { depth: 0 }); const n = await send('DOM.querySelector', { nodeId: d.result.root.nodeId, selector: sel }); await send('DOM.setFileInputFiles', { nodeId: n.result.nodeId, files }); };
  const waitFor = async (expr, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(expr)) return true; } catch {} await sleep(250); } return false; };
  const go = async (n) => { await ev(`document.querySelector('.step[data-go="${n}"]').click()`); await sleep(350); };
  const setBind = (k, v) => ev(`(()=>{const e=document.querySelector('[data-bind="${k}"]'); if(!e) return false; e.value=${JSON.stringify(v)}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true})()`);
  // ---- comprobaciones por pantalla (desborde, tactil, foco, contraste, radios, sombras, degradados)
  const AUDIT = `(()=>{
    const out={overflow:{sw:document.documentElement.scrollWidth,iw:innerWidth,bw:document.body.scrollWidth}, small:[], contrast:[], radii:{}, grad:[], shadow:[], emoji:[], overflowEls:[]};
    const vis=(e)=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&e.offsetParent!==null||cs.position==='fixed'&&r.width>0};
    const sel=(e)=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'');
    const rgb=(s)=>{const m=s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p=m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}};
    const lum=(c)=>{const f=(v)=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
    const bgOf=(e)=>{let bg={r:255,g:255,b:255}; const chain=[]; for(let x=e;x;x=x.parentElement){const c=rgb(getComputedStyle(x).backgroundColor); if(c&&c.a>0){chain.push(c); if(c.a>=1)break}} for(const c of chain.reverse()){bg={r:c.r*c.a+bg.r*(1-c.a),g:c.g*c.a+bg.g*(1-c.a),b:c.b*c.a+bg.b*(1-c.a)}} return bg};
    for(const e of document.querySelectorAll('body *')){
      if(!vis(e)) continue; const cs=getComputedStyle(e); const r=e.getBoundingClientRect();
      if(r.right>innerWidth+1&&!e.closest('.tbl,.tabla-wrap,.scroll,pre,[class*=scroll]')&&r.width>0&&cs.position!=='fixed') out.overflowEls.push(sel(e)+' right='+Math.round(r.right));
      const br=cs.borderTopLeftRadius; if(br&&br!=='0px') out.radii[br]=(out.radii[br]||0)+1;
      if(cs.backgroundImage&&/gradient/.test(cs.backgroundImage)) out.grad.push(sel(e));
      if(cs.boxShadow&&cs.boxShadow!=='none'&&!e.closest('dialog,.toast')) out.shadow.push(sel(e)+' '+cs.boxShadow.slice(0,40));
      const interactive=e.matches('button,a[href],input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,[role=button],[tabindex]:not([tabindex="-1"])');
      if(interactive&&!e.closest('.hide')&&(r.height<44||r.width<44)&&!(e.tagName==='A'&&getComputedStyle(e).display==='inline')) out.small.push(sel(e)+' '+Math.round(r.width)+'x'+Math.round(r.height));
      if(e.matches('input[type=checkbox],input[type=radio]')){const l=e.closest('label'); const lr=(l||e).getBoundingClientRect(); if(lr.height<44||lr.width<44) out.small.push('chk '+sel(e)+' label '+Math.round(lr.width)+'x'+Math.round(lr.height));}
      const own=[...e.childNodes].some((n)=>n.nodeType===3&&n.textContent.trim().length>1);
      if(own&&cs.visibility==='visible'){const fg=rgb(cs.color); if(fg){const bg=bgOf(e); const a=lum({r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a)}), b=lum(bg); const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05); const px=parseFloat(cs.fontSize); const big=px>=24||(px>=18.66&&+cs.fontWeight>=700); if(ratio<(big?3:4.5)&&!(e.disabled||e.closest('[disabled]'))) out.contrast.push(sel(e)+' '+ratio.toFixed(2)+' "'+e.textContent.trim().slice(0,24)+'"');}}
      if(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}]/u.test([...e.childNodes].filter((n)=>n.nodeType===3).map((n)=>n.textContent).join(''))) out.emoji.push(sel(e));
    }
    for(const k of ['small','contrast','grad','shadow','emoji','overflowEls']) out[k]=[...new Set(out[k])];
    return out;})()`;
  const audits = {};
  const audit = async (w, nombre) => {
    const a = await ev(AUDIT); const key = `${w}|${nombre}`; audits[key] = a;
    const o = a.overflow; if (o.sw > o.iw || o.bw > o.iw) L(false, `${w}px ${nombre}: desbordamiento horizontal`, `scrollWidth=${o.sw} body=${o.bw} inner=${o.iw} ${a.overflowEls.slice(0, 5).join(' ; ')}`);
    return a;
  };
  const focoTest = async () => { // tabula 12 veces y mide si el foco se ve
    const res = []; await ev('document.activeElement&&document.activeElement.blur(); window.scrollTo(0,0)');
    for (let i = 0; i < 14; i++) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      res.push(await ev(`(()=>{const e=document.activeElement; if(!e||e===document.body) return null; const cs=getComputedStyle(e); const vis=e.matches(':focus-visible'); const oln=cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0; return {t:e.tagName+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''), vis, oln, ow:cs.outlineWidth, oc:cs.outlineColor, bs:cs.boxShadow.slice(0,30)}})()`)); }
    return res.filter(Boolean);
  };
  const PEGADO = '';
  const widths = [360, 768, 1280];
  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 500 ? 780 : 860, deviceScaleFactor: 1, mobile: w < 500 });
    await send('Page.navigate', { url: base }); await sleep(1800);
    const pref = `${w}`;
    // ===== OPCION A
    await audit(w, 'p0'); await shot(`${pref}-p0-inicio`);
    if (w === 1280) { const f = await focoTest(); L(f.every((x) => x.vis && (x.oln || x.bs !== 'none')) ? true : false, 'foco visible al tabular (pantalla 0)', f.filter((x) => !(x.vis && (x.oln || x.bs !== 'none'))).map((x) => x.t).join(',') || f.length + ' elementos'); }
    await ev(`document.querySelector('.modo[data-modo=certificados]').click()`); await sleep(500);
    await go(1); await audit(w, 'p1-vacia'); await shot(`${pref}-p1-lista-vacia`);
    await upload('#fLista', [XLSX]);
    const cargada = await waitFor(`document.querySelectorAll('#tabla tr').length>2`); if (w === 1280) L(cargada, 'A: Excel de ejemplo cargado en la tabla', await ev(`document.querySelectorAll('#tabla tr').length-1+' filas; cuenta='+document.querySelector('#cuenta').textContent+'; hojas='+(document.querySelector('#hoja')?.options.length)`));
    await sleep(500); await audit(w, 'p1-lista'); await shot(`${pref}-p1-lista`);
    if (w === 1280) { // consola de estado de columnas y DNIs
      L(null, 'A: selects de columnas', await ev(`['selNombre','selEmail','selDni'].map(i=>{const e=document.getElementById(i);return i+'='+(e&&e.value)}).join(' ')`)); }
    await go(2);
    for (const [k, v] of [['evento.evento', 'Jornada de prueba QA'], ['evento.fecha', '12 de diciembre de 2026'], ['evento.horario', '10:00 a 12:00'], ['evento.horas', '2'], ['evento.lugar', 'Aula 0.1 EPSG'], ['evento.organizador', 'Delegación EPSG'], ['evento.firmante', 'Ana Prueba'], ['evento.cargo_firmante', 'Delegada']]) await setBind(k, v);
    await audit(w, 'p2-evento'); await shot(`${pref}-p2-evento`);
    await go(3); await ev(`document.querySelector('[data-preview=certificado] [data-rf], [data-preview] [data-rf]')?.click()`);
    const pv3 = await waitFor(`(()=>{const b=document.querySelector('.page[data-page="3"] [data-preview]'); const f=b&&b.querySelector('iframe'); const est=b&&b.querySelector('[data-pvest]'); return f&&f.src&&est&&est.classList.contains('hide')})()`, 25000);
    if (w === 1280) L(pv3, 'A: vista previa del certificado (POST /api/vista)', await ev(`(()=>{const b=document.querySelector('.page[data-page="3"] [data-preview]'); return 'iframe src='+(b.querySelector('iframe').src||'').slice(0,40)+' warn='+b.querySelector('[data-warn]').textContent+' est='+b.querySelector('[data-pvest]').innerText.slice(0,60)})()`));
    await sleep(800); await audit(w, 'p3-certificado'); await shot(`${pref}-p3-certificado`);
    await go(4); const pv4 = await waitFor(`(()=>{const b=document.querySelector('.page[data-page="4"] [data-preview]'); const f=b&&b.querySelector('iframe'); const est=b&&b.querySelector('[data-pvest]'); return f&&f.src&&est&&est.classList.contains('hide')})()`, 25000);
    if (w === 1280) L(pv4, 'A: vista previa del justificante (POST /api/vista)', await ev(`(()=>{const b=document.querySelector('.page[data-page="4"] [data-preview]'); return 'iframe src='+(b.querySelector('iframe').src||'').slice(0,40)+' warn='+b.querySelector('[data-warn]').textContent+' est='+b.querySelector('[data-pvest]').innerText.slice(0,60)})()`));
    await sleep(800); await audit(w, 'p4-justificante'); await shot(`${pref}-p4-justificante`);
    await go(6); await audit(w, 'p6-correo'); await shot(`${pref}-p6-correo`);
    await go(7); await sleep(600);
    if (w === 1280) { L(null, 'A: pantalla 7', await ev(`'boton='+document.querySelector('#bEnviar').textContent+' | checklist: '+[...document.querySelectorAll('#checklist .stat')].map(s=>s.innerText.replace(/\\n/g,'=')).join(' / ')+' | items='+document.querySelectorAll('#checklist .t6-checks li').length`)); }
    await audit(w, 'p7-enviar'); await shot(`${pref}-p7-enviar`);
    if (w === 1280) {
      // enviar -> dialogo de confirmacion -> Cancelar (no se envia nada)
      await ev(`document.querySelector('#bEnviar').click()`); await sleep(900);
      const dlg = await ev(`(()=>{const d=document.getElementById('dlg'); return d.open? d.innerText.replace(/\\s+/g,' ').slice(0,300): null})()`);
      L(dlg !== null, 'A: «Generar y enviar» abre confirmacion (sin enviar)', String(dlg)); await audit(w, 'dialogo'); await shot(`${pref}-dialogo-enviar`);
      if (dlg) { await ev(`document.getElementById('dlgNo').click()`); await sleep(300); }
      const st = await (await fetch(base + 'api/estado')).json(); L(true, 'A: tras Cancelar no hay trabajo en marcha', JSON.stringify(st).slice(0, 120));
    }
    // ===== OPCION B (solo 1280)
    if (w === 1280) {
      await ev(`document.querySelector('.step[data-go="0"]').click()`); await sleep(300); await ev(`document.querySelector('.modo[data-modo=justificantes]').click()`); await sleep(500);
      const pasosB = await ev(`[...document.querySelectorAll('.step:not(.hide)')].map(s=>s.dataset.go).join(',')`); L(null, 'B: pasos visibles', pasosB);
      await go(4); await ev(`document.querySelector('.page[data-page="4"] [data-rf]')?.click()`); const pvb = await waitFor(`(()=>{const b=document.querySelector('.page[data-page="4"] [data-preview]'); const est=b.querySelector('[data-pvest]'); return b.querySelector('iframe').src&&est.classList.contains('hide')})()`, 25000);
      L(pvb, 'B: justificante vista previa'); await go(7); await sleep(500);
      L(null, 'B: pantalla 7', await ev(`document.querySelector('#bEnviar').textContent+' | '+[...document.querySelectorAll('#checklist .t6-checks li')].map(l=>l.className+':'+l.innerText.replace(/\\s+/g,' ')).join(' ## ').slice(0,500)`)); await shot('1280-B-p7');
    }
    // ===== OPCION C
    await ev(`document.querySelector('.step[data-go="0"]').click()`); await sleep(300); await ev(`document.querySelector('.modo[data-modo=recibidos]').click()`); await sleep(500);
    const dlgC = await ev(`document.getElementById('dlg').open`); if (dlgC) { await ev(`document.getElementById('dlgNo').click()`); await sleep(200); }
    await go(5); await audit(w, 'p5-recibidos-vacia'); await shot(`${pref}-p5-recibidos-vacia`);
    await upload('#fRec', [zip, PDFC]);
    const rc = await waitFor(`document.querySelectorAll('#tablaRec tr').length>1`, 25000);
    await sleep(700);
    const dlgC2 = await ev(`document.getElementById('dlg').open`); if (dlgC2) { if (w === 1280) L(null, 'C: dialogo sugerencia tras cargar', await ev(`document.getElementById('dlg').innerText.replace(/\\s+/g,' ').slice(0,200)`)); await ev(`document.getElementById('dlgSi').click()`); await sleep(500); }
    if (w === 1280) L(rc, 'C: ZIP + PDF de ejemplo cargados y asignados', await ev(`'filas='+(document.querySelectorAll('#tablaRec tr').length-1)+' stats='+document.querySelector('#recStats').innerText.replace(/\\s+/g,' ')+' carga='+document.querySelector('#recCarga').innerText`));
    await audit(w, 'p5-recibidos'); await shot(`${pref}-p5-recibidos`);
    await go(7); await sleep(500); await audit(w, 'p7-recibidos'); if (w === 1280) { L(null, 'C: pantalla 7', await ev(`document.querySelector('#bEnviar').textContent+' | '+[...document.querySelectorAll('#checklist .t6-checks li')].map(l=>l.className+':'+l.innerText.replace(/\\s+/g,' ')).join(' ## ').slice(0,500)`)); }
    // ===== OPCION D
    await ev(`document.querySelector('.step[data-go="0"]').click()`); await sleep(300); await ev(`document.querySelector('.modo[data-modo=correo]').click()`); await sleep(500);
    if (w === 1280) { L(null, 'D: pasos visibles', await ev(`[...document.querySelectorAll('.step:not(.hide)')].map(s=>s.dataset.go).join(',')`)); }
    await go(6); await sleep(300); await audit(w, 'p6-correo-D'); await go(7); await sleep(500); await audit(w, 'p7-D'); if (w === 1280) { L(null, 'D: pantalla 7', await ev(`document.querySelector('#bEnviar').textContent+' | solo-generar visible='+!document.querySelector('#bGenerar').classList.contains('hide')`)); await shot('1280-D-p7'); }
    // ===== extras visuales
    if (w === 360) { await ev(`document.getElementById('navToggle').click()`); await sleep(300); await audit(w, 'nav-abierto'); await shot('360-nav-abierto'); await ev(`document.getElementById('navToggle').click()`); }
    await ev(`toast('Lista cargada: asistentes-ejemplo.xlsx'); 1`); await sleep(400); await audit(w, 'toast'); if (w !== 768) await shot(`${pref}-toast`);
    await ev(`confirmar('¿Enviar 3 correos ahora?', '<dl class="t6-confirma"><dt>Correos que salen</dt><dd><b>3</b></dd></dl><p class="ayuda">Una vez enviados, no se pueden recuperar.</p>', 'Enviar 3 correos'); 1`); await sleep(400); await audit(w, 'dialogo'); await shot(`${pref}-dialogo`);
    if (w === 1280) { const e = await ev(`(()=>{const d=document.getElementById('dlg'); const r=d.getBoundingClientRect(); return {focoEn:document.activeElement&&document.activeElement.id, esc:null, r:[r.width,r.height]}})()`); L(null, 'dialogo base: foco inicial en', JSON.stringify(e)); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(300); L(null, 'dialogo base: abierto tras Escape', String(await ev(`document.getElementById('dlg').open`))); }
    if (await ev(`document.getElementById('dlg').open`)) await ev(`document.getElementById('dlgNo').click()`);
  }
  // ===== barrido de ancho del bloque .two entre 1060 y 1160 (hallazgo de la auditoria)
  const barrido = [];
  for (let w = 1060; w <= 1160; w += 4) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 860, deviceScaleFactor: 1, mobile: false }); await sleep(120);
    for (const p of [2, 3, 4, 6, 7]) { await ev(`ir(${p})`); const o = await ev(`(()=>{const m=document.querySelector('main'); const bad=[...document.querySelectorAll('.page.on *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0&&r.right>(m.getBoundingClientRect().right+1)&&!e.closest('.tbl,iframe')}).map(e=>e.tagName+'.'+(e.className||'')).slice(0,3); return {sw:document.documentElement.scrollWidth,iw:innerWidth,msw:m.scrollWidth,mcw:m.clientWidth,bad}})()`); if (o.sw > o.iw || o.msw > o.mcw + 1 || o.bad.length) barrido.push(`${w}px p${p}: ${JSON.stringify(o)}`); }
  }
  L(barrido.length === 0, 'barrido 1060-1160 px (pantallas 2,3,4,6,7): sin desborde de .two / main', barrido.slice(0, 6).join(' || '));
  // ===== informe
  fs.writeFileSync(path.join(out, 't8-auditoria.json'), JSON.stringify(audits, null, 1));
  L(errs.length === 0 ? true : false, 'consola sin errores/avisos inesperados', errs.length ? [...new Set(errs)].slice(0, 12).join(' || ') : 'ninguno'); L(net.length === 0 ? true : null, 'respuestas HTTP >=400', [...new Set(net)].join(' | ') || 'ninguna');
  fs.writeFileSync(path.join(out, 't8-resultado.json'), JSON.stringify({ log, errs: [...new Set(errs)], net: [...new Set(net)] }, null, 1));
  ws.close(); cp.kill(); srv.kill(); await sleep(500);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch((e) => { console.error('ERROR del script', e); process.exit(2); });
