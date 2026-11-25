// T8: riesgo Node. Arranca el .exe original y el nuevo (APPDATA temporal, sin navegador) y compara arranque y /api/info.
// Uso: node diseno/comprobar-t8-node.js <original.exe> <nuevo.exe>
const { spawn, execFileSync } = require('child_process'); const fs = require('fs'); const os = require('os'); const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = async (exe, port) => {
  const ad = fs.mkdtempSync(path.join(os.tmpdir(), 't8n-')); const t0 = Date.now();
  const p = spawn(exe, [], { env: { ...process.env, CERT_PORT: String(port), CERT_NO_BROWSER: '1', APPDATA: ad }, stdio: 'ignore', windowsHide: true });
  let info = null; for (let i = 0; i < 60 && !info; i++) { await sleep(250); try { const r = await fetch(`http://127.0.0.1:${port}/api/info`); info = await r.text(); } catch {} }
  const ms = Date.now() - t0;
  const root = await fetch(`http://127.0.0.1:${port}/`).then(async (r) => ({ s: r.status, t: r.headers.get('content-type'), n: (await r.text()).length }));
  const nf = await fetch(`http://127.0.0.1:${port}/nada`).then((r) => r.status);
  const bad = await fetch(`http://127.0.0.1:${port}/api/config`, { method: 'POST', headers: { Origin: 'http://evil.example', 'content-type': 'application/json' }, body: '{}' }).then((r) => r.status);
  const est = await fetch(`http://127.0.0.1:${port}/api/estado`).then((r) => r.text());
  const pid = p.pid; p.kill(); await sleep(400);
  try { fs.rmSync(ad, { recursive: true, force: true }); } catch {}
  return { ms, info, root, nf, bad, est };
};
(async () => {
  const [orig, nuevo] = process.argv.slice(2);
  const A = await run(orig, 48741), B = await run(nuevo, 48742);
  const ia = JSON.parse(A.info), ib = JSON.parse(B.info);
  console.log('original: arranque', A.ms, 'ms | GET /', JSON.stringify(A.root), '| 404:', A.nf, '| POST Origin ajeno:', A.bad, '| estado:', A.est.slice(0, 60));
  console.log('nuevo   : arranque', B.ms, 'ms | GET /', JSON.stringify(B.root), '| 404:', B.nf, '| POST Origin ajeno:', B.bad, '| estado:', B.est.slice(0, 60));
  console.log('/api/info identico (texto):', A.info === B.info, '| version', ia.version, ib.version, '| so', JSON.stringify(ia.so), JSON.stringify(ib.so));
  const ver = (exe) => { try { return execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Item '${exe}').VersionInfo | Select-Object FileVersion,ProductVersion,FileDescription | ConvertTo-Json -Compress`]).toString().trim(); } catch (e) { return String(e); } };
  console.log('VersionInfo original:', ver(orig)); console.log('VersionInfo nuevo   :', ver(nuevo));
  console.log('node del sistema:', process.version);
})();
