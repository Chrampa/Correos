// Reempaqueta EnviaCertificados con la UI de ui/index.html.
// Uso: node tools/build.js [salida.exe] [ui.html]   (por defecto build/EnviaCertificados.exe y ui/index.html)
// 1) toma extracted/app.js (bundle original extraido del .exe, NO se edita)
// 2) sustituye el literal del modulo HTML (vfe.exports=`...`) por el contenido de ui/index.html
// 3) genera build/app.js + build/sea-config.json y ejecuta `node --build-sea`
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const out = path.resolve(root, process.argv[2] || 'build/EnviaCertificados.exe');
const base = fs.readFileSync(path.join(root, 'extracted/app.js'), 'utf8');
const html = fs.readFileSync(path.resolve(root, process.argv[3] || 'ui/index.html'), 'utf8');

const START = 'vfe.exports=`<!doctype html>', END = '</html>\n`}';
const a = base.indexOf(START), e = base.indexOf(END, a);
if (a < 0 || e < 0 || base.indexOf(START, a + 1) >= 0) throw new Error('No se encuentra el modulo HTML en app.js');
const litStart = a + 'vfe.exports='.length;   // ` inicial
const litEnd = e + END.length - 2;             // ` final (inclusive)
const origHtml = new Function('return ' + base.slice(litStart, litEnd + 1))();

// Si la UI no cambia se conserva el literal original byte a byte; si cambia, se usa una cadena JSON (equivalente).
const newLit = html === origHtml ? base.slice(litStart, litEnd + 1) : JSON.stringify(html);
const app = base.slice(0, litStart) + newLit + base.slice(litEnd + 1);
new Function(app); // comprobacion de sintaxis (no se ejecuta)

const bdir = path.join(root, 'build');
fs.mkdirSync(bdir, { recursive: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.mkdirSync(path.join(bdir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(bdir, 'dist', 'app.js'), app);
const cfg = { main: 'dist/app.js', output: out, disableExperimentalSEAWarning: true, useSnapshot: false, useCodeCache: false };
fs.writeFileSync(path.join(bdir, 'sea-config.json'), JSON.stringify(cfg, null, 2));
console.log(`UI ${html === origHtml ? 'SIN cambios' : 'MODIFICADA'} (${html.length} chars). Node ${process.version}`);
// cwd = build/ para que la ruta embebida sea relativa ('dist/app.js'), igual que el original
execFileSync(process.execPath, ['--build-sea', 'sea-config.json'], { stdio: 'inherit', cwd: bdir });
console.log('OK ->', out, fs.statSync(out).size, 'bytes');
