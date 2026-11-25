// T8: comprobaciones estaticas de ui/index.html frente a la UI original.
// Uso: node diseno/comprobar-t8-estatico.js <original.html> <nuevo.html>
const fs = require('fs');
const [A, B] = process.argv.slice(2).map((f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'));
let fail = 0;
const chk = (n, ok, det = '') => { console.log((ok ? 'OK    ' : 'FALLA ') + n + (det ? ' -> ' + det : '')); if (!ok) fail++; };
const info = (n, det) => console.log('INFO  ' + n + ' -> ' + det);
const parts = (h) => {
  const style = [...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const scripts = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const body = h.slice(h.indexOf('<body')).replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
  return { style, scripts, js: scripts.join('\n'), body };
};
const a = parts(A), b = parts(B);
const set = (re, s, g = 1) => new Set([...s.matchAll(re)].map((m) => m[g]));
const falta = (X, Y) => [...X].filter((x) => !Y.has(x));

// --- 1. Integridad frente al original
const idsA = set(/\bid="([^"]+)"/g, a.body), idsB = set(/\bid="([^"]+)"/g, b.body);
chk(`IDs originales presentes (${idsA.size})`, !falta(idsA, idsB).length, falta(idsA, idsB).join(','));
info('IDs nuevos', falta(idsB, idsA).join(','));
// IDs duplicados en el HTML estatico
const cnt = {}; for (const m of b.body.matchAll(/\bid="([^"]+)"/g)) cnt[m[1]] = (cnt[m[1]] || 0) + 1;
chk('sin IDs duplicados en el HTML estatico', !Object.values(cnt).some((n) => n > 1), Object.entries(cnt).filter(([, n]) => n > 1).map(([k, n]) => k + 'x' + n).join(','));
const attrs = (s) => set(/\b(data-[a-z-]+(?:="[^"]*")?)/g, s);
chk('atributos data-* y valores (marcado) presentes', !falta(attrs(a.body), attrs(b.body)).length, falta(attrs(a.body), attrs(b.body)).join(' | '));
// clases usadas por el JS original: todo `.clase` en selectores $()/querySelector/closest/classList
const clsJs = (js) => set(/(?:\$\$?|querySelector(?:All)?|closest|matches)\(\s*['"`]([^'"`]+)['"`]/g, js);
const sels = [...clsJs(a.js)];
const clases = new Set(); sels.forEach((s) => { for (const m of s.matchAll(/\.([a-zA-Z][\w-]*)/g) || []) clases.add(m[1]); });
const classList = set(/classList\.(?:add|remove|toggle|contains)\(\s*'([^']+)'/g, a.js);
const claseUsada = (c) => new RegExp('class="[^"]*\\b' + c + '\\b|\\b' + c + '\\b').test(b.body + b.js);
const clasesPerdidas = [...new Set([...clases, ...classList])].filter((c) => !claseUsada(c));
chk(`clases usadas por el JS original siguen en HTML/JS (${new Set([...clases, ...classList]).size})`, !clasesPerdidas.length, clasesPerdidas.join(','));
// cfg / data-bind
const bindA = set(/data-bind="([^"]+)"/g, a.body), bindB = set(/data-bind="([^"]+)"/g, b.body);
chk(`data-bind (${bindA.size}) intactos`, !falta(bindA, bindB).length && !falta(bindB, bindA).length, 'faltan:' + falta(bindA, bindB) + ' nuevos:' + falta(bindB, bindA));
const defA = a.js.match(/const DEF = \{[\s\S]*?\n\};?/), defB = b.js.match(/const DEF = \{[\s\S]*?\n\};?/);
chk('const DEF (claves cfg) identico', defA && defB && defA[0] === defB[0]);
// fetch/api: ruta, metodo, payload
const apiCalls = (js) => [...js.matchAll(/(?:api|fetch)\(\s*([`'"][^`'"]*(?:\$\{[^}]*\}[^`'"]*)*[`'"])(?:\s*,\s*(\{[^;\n]*?\}|[a-zA-Z_.]+))?/g)].map((m) => m[1] + (m[2] ? ' ' + m[2].replace(/\s+/g, ' ') : '')).filter((x) => /\/api\//.test(x));
const callsA = apiCalls(a.js), callsB = apiCalls(b.js);
chk(`llamadas /api/* identicas (${callsA.length})`, JSON.stringify(callsA) === JSON.stringify(callsB), callsA.length + ' vs ' + callsB.length);
if (JSON.stringify(callsA) !== JSON.stringify(callsB)) { console.log(callsA.filter((x) => !callsB.includes(x)), callsB.filter((x) => !callsA.includes(x))); }
for (const t of ['{nombre_pila}', '{evento}', '{fecha}', '{horario}', '{lugar}', '{cargos}', '{nombre}', '{dni}']) {
  const n = (s) => s.split(t).length - 1; chk('marcador ' + t, n(A) === n(B), n(A) + ' -> ' + n(B));
}
// funciones JS: ninguna perdida
const fnA = set(/\bfunction\s+([A-Za-z_$][\w$]*)/g, a.js), fnB = set(/\bfunction\s+([A-Za-z_$][\w$]*)/g, b.js);
chk(`funciones declaradas (${fnA.size})`, !falta(fnA, fnB).length, falta(fnA, fnB).join(',') + ' | nuevas: ' + falta(fnB, fnA).join(','));
const cnA = set(/\bconst\s+([A-Za-z_$][\w$]*)\s*=/g, a.js), cnB = set(/\bconst\s+([A-Za-z_$][\w$]*)\s*=/g, b.js);
chk(`const de nivel (${cnA.size})`, !falta(cnA, cnB).length, falta(cnA, cnB).join(','));
// handlers asignados con $('#x').onclick/onchange/oninput/... presentes
const hdl = (js) => set(/(\$\('#[A-Za-z0-9_]+'\)\.on[a-z]+)\s*=/g, js);
chk(`handlers $('#id').onX (${hdl(a.js).size})`, !falta(hdl(a.js), hdl(b.js)).length, falta(hdl(a.js), hdl(b.js)).join(','));

// --- 2. Sintaxis / referencias
// $('#x') del JS nuevo existen en HTML estatico o se crean en plantillas JS
const refIds = set(/(?:\$|getElementById)\(\s*['"]#?([A-Za-z][\w-]*)['"]\s*\)/g, b.js);
const refIds2 = set(/\$\('#([A-Za-z][\w-]*)'\)/g, b.js);
const todos = new Set([...refIds2]);
const dyn = set(/\bid="([^"$]+)"/g, b.js);
const sinId = [...todos].filter((i) => !idsB.has(i) && !dyn.has(i));
chk(`todo $('#id') del JS tiene elemento (${todos.size})`, !sinId.length, sinId.join(','));
// iconos
const symbols = set(/<symbol[^>]*\bid="([^"]+)"/g, B);
info('simbolos en sprite', symbols.size);
const usos = set(/<use[^>]*href="#([^"$]+)"/g, B);
const lit = set(/['"`]#?(i-[a-z0-9-]+)['"`]/g, b.js); // p.ej. pl('ok','circle-check') se compone aparte
const comp = [...b.js.matchAll(/pl\('[a-z]+',\s*'([a-z0-9-]+)'/g)].map((m) => 'i-' + m[1]);
const estIc = [...b.js.matchAll(/'(i-[a-z0-9-]+)'/g)].map((m) => m[1]);
const todosIc = new Set([...usos, ...comp, ...estIc]);
const rotos = [...todosIc].filter((i) => !symbols.has(i));
chk(`referencias <use href="#i-..."> con simbolo (${todosIc.size} usadas)`, !rotos.length, rotos.join(','));
const huerf = [...symbols].filter((s) => !todosIc.has(s));
info('simbolos sin usar', huerf.join(','));
// CSS mask-icon url(...) etc ignorado
// balance HTML (body)
const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const stack = []; const errs = [];
const bd = b.body.replace(/<!--[\s\S]*?-->/g, '');
for (const m of bd.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
  const [, close, tag0, , self] = m; const tag = tag0.toLowerCase();
  if (VOID.has(tag) || self) continue;
  if (!close) stack.push(tag);
  else { const top = stack.pop(); if (top !== tag) { errs.push(`</${tag}> cierra <${top}>`); if (errs.length > 5) break; } }
}
chk('etiquetas HTML balanceadas', !errs.length && stack.filter((t) => !['body', 'html'].includes(t)).length === 0, errs.join('; ') + ' pila=' + stack.join(','));
// balance CSS
const css = b.style.replace(/\/\*[\s\S]*?\*\//g, '');
let d = 0, minD = 0; for (const ch of css) { if (ch === '{') d++; if (ch === '}') d--; minD = Math.min(minD, d); }
chk('llaves CSS balanceadas', d === 0 && minD === 0, 'profundidad final=' + d + ' min=' + minD);
for (const t of ['T4', 'T5', 'T6']) chk(`bloque ${t}-inicio/fin`, B.includes(`=== ${t}-inicio ===`) && B.includes(`=== ${t}-fin ===`));
// --- 3. Reglas de diseno
const ems = [...(B.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2700}-\u{27BF}\u{FE0F}]/gu) || [])];
chk('sin emojis/simbolos-icono (flechas, pictogramas)', !ems.length, [...new Set(ems)].join(' '));
const checks = B.match(/[✓✔✗✘×▶►●○★☆➕📎⌂]/g) || [];
info('caracteres tipograficos de icono residuales', [...new Set(checks)].join(' ') || 'ninguno');
const stIn = [...b.body.matchAll(/\sstyle="([^"]*)"/g)].map((m) => m[1]);
const stJs = [...b.js.matchAll(/\sstyle="([^"]*)"/g)].map((m) => m[1]);
info('style= inline en HTML estatico', stIn.length + ' ' + JSON.stringify([...new Set(stIn)].slice(0, 12)));
info('style= inline en plantillas JS', stJs.length + ' ' + JSON.stringify([...new Set(stJs)].slice(0, 12)));
const rad = [...css.matchAll(/border-radius\s*:\s*([^;}]+)/g)].map((m) => m[1].trim());
const radOk = (v) => /^(0|var\(--r-?[a-z0-9]*\)|4px|8px|50%|999px|inherit|0 0 [^ ]+ [^ ]+)$/.test(v) || /^(var\(--[a-z0-9-]+\)\s*){1,4}$/.test(v);
info('border-radius distintos', JSON.stringify([...new Set(rad)]));
const grad = css.match(/(linear|radial|conic)-gradient/g) || [];
chk('sin degradados', !grad.length, grad.length);
const sh = [...css.matchAll(/(?:^|[;{\s])((?:box|text|drop)-shadow|filter\s*:\s*drop-shadow)[^;}]*/g)].map((m) => m[0].trim());
info('sombras en CSS', sh.length + ' ' + JSON.stringify(sh.slice(0, 20)));
process.exitCode = fail ? 1 : 0; console.log(fail ? `\n${fail} FALLO(S)` : '\nTodo OK');
