'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const demoDir = path.join(root, 'demo');
const distDir = path.join(demoDir, 'dist');
const sourcePath = path.join(root, 'trabajo', 'ui', 'index.html');

function hashFile(filename) {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
}

function cspHash(content) {
  return `'sha256-${crypto.createHash('sha256').update(content, 'utf8').digest('base64')}'`;
}

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function fileHashes() {
  const hashes = {};
  for (const filename of walk(distDir)) hashes[path.relative(distDir, filename)] = hashFile(filename);
  return hashes;
}

execFileSync(process.execPath, [path.join(demoDir, 'build-demo.js')], { cwd: root, stdio: 'pipe' });
const firstBuild = fileHashes();
execFileSync(process.execPath, [path.join(demoDir, 'build-demo.js')], { cwd: root, stdio: 'pipe' });
assert.deepEqual(fileHashes(), firstBuild, 'el build debe ser reproducible byte a byte');

const source = fs.readFileSync(sourcePath, 'utf8');
const output = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const headers = fs.readFileSync(path.join(distDir, '_headers'), 'utf8');

assert.match(output, /<div class="drop" id="drop">[\s\S]*?<b>Carga el Excel ficticio de demostración<\/b>/, 'la zona de carga debe mostrar el texto adaptado de demostración');
assert.ok(!output.includes('Arrastra aquí el Excel o CSV'), 'no debe quedar el texto genérico sin sustituir en la zona de carga');
assert.ok(output.includes('<button class="btn" id="bPrueba">Simular envío de prueba</button>'), 'el botón de prueba debe indicar simulación');
assert.ok(!output.includes('Enviarme una prueba'), 'no debe quedar el texto real de prueba');
assert.ok(output.includes('Simulará el correo con los adjuntos y los datos de la persona que elijas. No se envía ningún correo real.'), 'la ayuda de prueba debe indicar simulación');
assert.ok(!output.includes('Recibirás el mismo correo'), 'no debe quedar el texto heredado Recibirás el mismo correo');
assert.ok(output.includes('<button class="btn pri big" id="bEnviar">Simular el envío a todos</button>'), 'el botón principal inicial debe indicar simulación');
assert.ok(!output.includes('Generar y enviar a todos'), 'no debe quedar el texto real Generar y enviar a todos');
assert.ok(output.includes('`Simular el envío a ${nEnv} persona${nEnv === 1 ? \'\' : \'s\'}`'), 'el botón principal dinámico debe decir Simular el envío a N personas');
assert.ok(output.includes('Es una simulación: puedes seguir usando la demostración mientras avanza y detenerla en cualquier momento.'), 'el diálogo debe usar instrucción coherente con demo web');
assert.ok(!output.includes('ventana negra'), 'no debe quedar la instrucción de ventana negra');
assert.ok(!output.includes('reales.No cierres'), 'no debe haber unión defectuosa reales.No cierres');
assert.ok(output.includes('</svg>Conexión simulada correcta</span>'), 'el resultado SMTP debe indicar conexión simulada');
assert.ok(!output.includes('</svg>Conexión correcta</span>'), 'no debe quedar el texto real de conexión');
assert.ok(output.includes('Prueba simulada para ${esc($(\'#paraPrueba\').value)}'), 'el resultado de prueba debe indicar prueba simulada');
assert.ok(!output.includes('Prueba enviada a '), 'no debe quedar el texto real de prueba enviada');
assert.ok(output.includes('No se ha enviado ningún correo: esto es solo una demostración.'), 'debe conservarse el aviso de que no sale correo');
assert.ok(output.includes('`Simular ${indices.length} intento${indices.length === 1 ? \'\' : \'s\'}`'), 'el botón de confirmación debe decir Simular N intentos');
assert.ok(!output.includes('`Enviar ${indices.length} correo${indices.length === 1 ? \'\' : \'s\'}`'), 'no debe quedar el botón real Enviar N correos');
assert.ok(output.includes("nombre_ejemplo: 'Persona Demo'"), 'el ejemplo sin lista debe usar Persona Demo');
assert.ok(output.includes("__d: 'DEMO-001'"), 'el ejemplo sin lista debe usar DEMO-001');
assert.ok(output.includes('placeholder="Carpeta de certificados"'), 'el placeholder de carpeta debe ser ficticio');
assert.ok(!output.includes('García López'), 'no debe permanecer García López en dist/index.html');
assert.ok(!output.includes('12345678Z'), 'no debe permanecer 12345678Z en dist/index.html');
assert.ok(!output.includes('ana@ejemplo.com'), 'no debe permanecer ana@ejemplo.com en dist/index.html');
assert.ok(!output.includes('maria@ejemplo.com'), 'no debe permanecer maria@ejemplo.com en dist/index.html');
assert.ok(!output.includes('C:\\Users\\...\\Certificados'), 'no debe permanecer la ruta de ejemplo C:\\Users\\...\\Certificados');

const ids = new Set(Array.from(source.matchAll(/\bid=["']([^"']+)["']/gi), match => match[1]));
for (const id of ids) assert.match(output, new RegExp(`\\bid=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`), `id original perdido: ${id}`);
const dataAttributes = new Set(Array.from(source.matchAll(/\b(data-[A-Za-z0-9_-]+)/gi), match => match[1]));
for (const attribute of dataAttributes) assert.ok(output.includes(attribute), `atributo original perdido: ${attribute}`);

const dataIndex = output.indexOf('window.__DEMO_DATA__');
const mockIndex = output.indexOf('/* Demo transport.');
const uiIndex = output.indexOf('const $ = (s, r = document)');
const adapterIndex = output.indexOf('const originalPaintReceived = window.pintarRecibidos');
const bannerIndex = output.indexOf('let finished = false');
assert.ok(dataIndex >= 0 && dataIndex < mockIndex, '__DEMO_DATA__ debe preceder al mock');
assert.ok(mockIndex < uiIndex, 'mock-api.js debe preceder a la UI');
assert.ok(uiIndex < adapterIndex && adapterIndex < bannerIndex, 'adaptador y banner deben seguir a la UI en ese orden');

for (const filename of walk(distDir)) {
  const relative = path.relative(distDir, filename);
  assert.ok(!/\.exe$/i.test(relative), `ejecutable en dist: ${relative}`);
  assert.ok(!/(^|[\\/])\.env(?:\.|$)/i.test(relative), `archivo .env en dist: ${relative}`);
  const text = fs.readFileSync(filename).toString('utf8');
  assert.ok(!/https?:\/\/[^\s"'<>]+/i.test(text), `URL externa literal en dist: ${relative}`);
  assert.ok(!/[^\s"'<>]+\.exe\b/i.test(text), `referencia a .exe en dist: ${relative}`);
  for (const match of text.matchAll(/([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi)) {
    assert.ok(/^(?:invalid|example\.[a-z]{2,})$/i.test(match[2]), `correo no permitido: ${match[0]}`);
  }
}

const scripts = Array.from(output.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi), match => match[1]);
const styles = Array.from(output.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi), match => match[1]);
assert.ok(scripts.length >= 5, 'se esperan scripts inline del mock, la UI, adaptador y banner');
for (const script of scripts) assert.ok(headers.includes(cspHash(script)), 'falta hash CSP de un bloque script inline');
for (const style of styles) assert.ok(headers.includes(cspHash(style)), 'falta hash CSP de un bloque style inline');
assert.match(headers, /connect-src 'none'/);
assert.match(headers, /X-Robots-Tag: noindex, nofollow/i);
assert.match(headers, /X-Content-Type-Options: nosniff/i);
assert.match(headers, /Referrer-Policy: no-referrer/i);
assert.ok(!/script-src[^;\r\n]*'unsafe-inline'/.test(headers), 'script-src debe usar hashes, no unsafe-inline');
assert.ok(/style-src-elem[^;\r\n]*sha256-/i.test(headers), 'style-src-elem debe validar los bloques CSS por hash');
assert.match(headers, /style-src-attr 'unsafe-inline'/i, 'style-src-attr permite las mutaciones de estilo inline usadas por la UI');

console.log(`PASS: build reproducible; ${ids.size} ids y ${dataAttributes.size} data-*; orden de scripts correcto; ${scripts.length} hashes CSP.`);
