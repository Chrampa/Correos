// Comprobación T3: IDs, data-*, clases y marcadores de plantilla del index.html original siguen presentes.
// Uso: node diseno/comprobar-ids-t3.js <original.html> <nuevo.html>
const fs = require('fs');
const [a, b] = process.argv.slice(2).map((f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'));
const body = (h) => h.slice(h.indexOf('<body>'));
const set = (re, s, g = 1) => new Set([...s.matchAll(re)].map((m) => m[g]));
let fail = 0;
const chk = (n, ok, det = '') => { console.log((ok ? 'OK    ' : 'FALLA ') + n + (det ? ' ' + det : '')); if (!ok) fail++; };
const falta = (A, B) => [...A].filter((x) => !B.has(x));

const ids = (s) => set(/\bid="([^"]+)"/g, body(s));
chk('IDs (' + ids(a).size + ')', !falta(ids(a), ids(b)).length, falta(ids(a), ids(b)).join(','));
const data = (s) => set(/\b(data-[a-z]+)/g, s);
chk('atributos data-* (' + data(a).size + ')', !falta(data(a), data(b)).length, falta(data(a), data(b)).join(','));
const dvals = (s) => set(/\b(data-(?:bind|go|page|modo|v|asset|var|preview|accept)="[^"]*")/g, body(s));
chk('valores data-bind/go/page/modo/v/asset/var/preview (' + dvals(a).size + ')', !falta(dvals(a), dvals(b)).length, falta(dvals(a), dvals(b)).join(','));
const cls = (s) => { const o = new Set(); for (const m of body(s).matchAll(/class="([^"$]+)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => o.add(c)); return o; };
const ca = cls(a), cb = cls(b);
chk('clases en marcado (' + ca.size + ')', !falta(ca, cb).length, falta(ca, cb).join(','));

const js = (h) => h.slice(h.indexOf('<script>') + 8, h.indexOf('</script>'));
const NL = String.fromCharCode(10);
const la = js(a).split(NL), lb = js(b).split(NL);
const dl = la.map((l, k) => (l !== lb[k] ? k + 1 : 0)).filter(Boolean);
chk('JS: solo cambian 3 lineas de marcado de iconos en pills (de ' + la.length + ' lineas)', la.length === lb.length && dl.length === 3, 'lineas ' + dl.join(','));

for (const t of ['{nombre_pila}', '{evento}', '{fecha}', '{horario}', '{lugar}', '{cargos}']) {
  const n = (s) => s.split(t).length - 1; chk('marcador ' + t, n(a) === n(b), n(a) + ' -> ' + n(b));
}

const txt = (s) => body(s)
  .replace(/<!--[^]*?-->/g, '').replace(/<script[^]*?<\/script>/g, '')
  .replace(/<span class="nav-actual"[^>]*>[^<]*<\/span>/, '')
  .replace(/<svg[^]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const sa = txt(a), sb = txt(b); let p = 0; while (p < sa.length && sa[p] === sb[p]) p++;
chk('textos visibles del HTML sin cambios (' + sa.length + ' caracteres, sin emojis ni iconos)', sa === sb || sa.replace(/ (⌂|🏅|📄|📦|✉️) /g, ' ') === sb, sa === sb ? '' : JSON.stringify(sa.slice(p - 20, p + 30)) + ' vs ' + JSON.stringify(sb.slice(p - 20, p + 30)));
process.exit(fail ? 1 : 0);
