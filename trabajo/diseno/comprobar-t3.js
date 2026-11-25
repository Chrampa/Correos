// Comprobación T3: consola limpia, sin desbordamiento horizontal y capturas (Chrome headless + CDP). Uso: node tools/check-ui-t3.js <url> <carpeta-capturas> [prefijo]
const { spawn } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const url = process.argv[2], out = process.argv[3], pref = process.argv[4] || 't3';
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
const port = 9333, udd = fs.mkdtempSync(path.join(os.tmpdir(), 'chr-'));
const T = String.fromCharCode(9);
const PEGADO = [['Nombre','Apellidos','Correo','DNI'],['Ana','García López','ana@ejemplo.com','12345678Z'],['Luis','Pérez Gil','luis-sin-arroba',''],['Marta','Soler Vidal','marta@ejemplo.com','87654321X']].map((r) => r.join(T)).join(String.fromCharCode(10));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const cp = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=${udd}`, 'about:blank'], { stdio: 'ignore' });
  let tgt; for (let i = 0; i < 50 && !tgt; i++) { await sleep(300); try { tgt = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => ws.onopen = r);
  let id = 0; const pend = new Map(); const errs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') errs.push('EXC ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errs.push('LOG ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('CONSOLE ' + d.params.args.map((a) => a.value || a.description).join(' ')); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
  console.error("conectado"); await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); console.error("habilitado");
  const shot = async (name) => { console.error('shot',name); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, `${pref}-${name}.png`), Buffer.from(r.result.data, 'base64')); };
  const res = [];
  for (const w of [360, 768, 1280]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 500 ? 740 : 800, deviceScaleFactor: 1, mobile: w < 500 });
    console.error('nav'); await send('Page.navigate', { url }); console.error('navegado'); await sleep(1500);
    console.error('m'); const m = async (etq) => { console.error('ev'); const o = await ev(`({sw:document.documentElement.scrollWidth,iw:innerWidth,bw:document.body.scrollWidth})`); res.push(`${w}px ${etq}: scrollWidth=${o.sw} innerWidth=${o.iw} ${o.sw > o.iw ? 'DESBORDA' : 'ok'}`); };
    await m('pantalla 0'); await shot(`${w}-p0-inicio`);
    await ev(`document.querySelector('.modo[data-modo=certificados]').click()`); await sleep(500);
    await ev(`document.querySelector('.step[data-go="1"]').click()`); await sleep(300);
    await m('pantalla 1 vacia'); await shot(`${w}-p1-lista-vacia`);
    await ev('(()=>{const t=document.getElementById("pegado");t.value='+JSON.stringify(PEGADO)+';document.getElementById("bPegar").click()})()'); await sleep(1500);
    await m('pantalla 1 con tabla'); await shot(`${w}-p1-lista`);
    await ev(`document.querySelector('.step[data-go="7"]').click()`); await sleep(500);
    await m('pantalla 7'); await shot(`${w}-p7-enviar`);
    if (w === 360) { await ev(`document.getElementById('navToggle').click()`); await sleep(300); await m('panel pasos abierto'); await shot(`${w}-nav-abierto`); await ev(`document.getElementById('navToggle').click()`);
      await ev(`document.querySelector('.step[data-go="3"]').click()`); await sleep(1500); await m('pantalla 3'); await shot(`${w}-p3-certificado`); }
    // dialogo y toast
    await ev(`toast('Aviso de ejemplo: cargado ana.xlsx'); 1`); await sleep(400); if (w !== 768) await shot(`${w}-toast`);
    await ev(`confirmar('Enviar a 3 personas', '<p>Se enviarán 3 correos.</p>', 'Sí, enviar'); 1`); await sleep(400); if (w !== 768) await shot(`${w}-dialogo`);
    await ev(`document.getElementById('dlgNo').click()`);
  }
  console.log(res.join('\n')); console.log('ERRORES DE CONSOLA:', errs.length ? '\n' + errs.join('\n') : 'ninguno');
  ws.close(); cp.kill(); process.exit(errs.length ? 1 : 0);
})();
