const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const demoDir = __dirname;
const sourcePath = path.join(root, 'trabajo', 'ui', 'index.html');
const distDir = path.join(demoDir, 'dist');
const dataPath = path.join(demoDir, 'datos', 'mock-fixtures.json');
const sourceDir = path.join(demoDir, 'src');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function cspHash(content) {
  return `'sha256-${crypto.createHash('sha256').update(content, 'utf8').digest('base64')}'`;
}

function inlineScript(code) {
  return `<script>\n${code.replace(/<\/script/gi, '<\\/script')}\n</script>`;
}

function inlineStyle(code) {
  return `<style>\n${code.replace(/<\/style/gi, '<\\/style')}\n</style>`;
}

function replaceEmails(text) {
  return text.replace(/([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi, (whole, local, domain) => {
    if (/^(?:example\.[a-z]{2,}|invalid)$/i.test(domain)) return whole;
    return 'demo@example.invalid';
  });
}

function removeContents(directory) {
  fs.mkdirSync(directory, { recursive: true });
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    fs.rmSync(path.join(directory, entry.name), { recursive: true, force: true });
  }
}

function requireFile(filename) {
  const resolved = path.join(sourceDir, filename);
  if (!fs.existsSync(resolved)) throw new Error(`Falta el recurso requerido: demo/src/${filename}`);
  return fs.readFileSync(resolved, 'utf8').replace(/\r\n/g, '\n');
}

function inlineDataScript(fixtures) {
  const json = JSON.stringify(fixtures).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `window.__DEMO_DATA__ = JSON.parse(${JSON.stringify(json)});`;
}

const adapter = String.raw`(() => {
  'use strict';
  if (!window.DemoMock || !window.DemoMock.ready) {
    document.body.innerHTML = '<p role="alert">Error: demostración bloqueada porque no se ha iniciado el simulador.</p>';
    return;
  }

  const mock = window.DemoMock;
  const originalPaintReceived = window.pintarRecibidos;
  if (typeof originalPaintReceived !== 'function') {
    throw new Error('No se encuentra pintarRecibidos(); build incompatible con la UI.');
  }
  window.pintarRecibidos = function () {
    const result = originalPaintReceived.apply(this, arguments);
    mock.rewriteLinks(document);
    return result;
  };
  if (typeof window.comprobarRebotes === 'function') {
    const originalCheckBounces = window.comprobarRebotes;
    window.comprobarRebotes = function (destination, days) {
      return originalCheckBounces.call(this, destination || '#rebotesRes', days);
    };
  }
  new MutationObserver(() => mock.rewriteLinks(document)).observe(document.body, { childList: true, subtree: true });

  const disable = (selector, message) => {
    document.querySelectorAll(selector).forEach(element => {
      element.disabled = true;
      if (message) element.title = message;
    });
  };
  disable('#bImport, #fImport, #bPegar, #pegado', 'Desactivado en la demostración: utiliza los archivos ficticios.');
  disable('#smtpUser, #smtpPass, [data-asset] input[type="file"]', 'No se admiten credenciales ni recursos propios en la demostración.');

  const importButton = document.getElementById('bImport');
  if (importButton) importButton.hidden = true;
  const importInput = document.getElementById('fImport');
  if (importInput) importInput.hidden = true;
  const paste = document.querySelector('.pegar');
  if (paste) paste.hidden = true;

  const fixtureRows = mock.fixtures.hojas.reduce((all, sheet) => all.concat(sheet.filas), []);
  function rowFor(index) {
    const input = document.querySelector('#tabla input[data-edit][data-i="' + index + '"]');
    const row = input && fixtureRows[index];
    return row || null;
  }
  document.addEventListener('change', event => {
    const target = event.target;
    if (!target.matches('#tabla input[data-edit]')) return;
    const sample = rowFor(target.dataset.i);
    if (!sample) return;
    if (target.dataset.edit === 'dni') {
      target.value = sample.DNI;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof window.pintarTabla === 'function') window.pintarTabla();
      return;
    }
    if (target.dataset.edit === 'email' && target.value.trim() && !/^[^\s@]+@[^\s@]+\.invalid$/i.test(target.value.trim())) {
      target.value = sample['Correo electrónico'];
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof window.pintarTabla === 'function') window.pintarTabla();
      if (typeof window.toast === 'function') window.toast('Solo se admiten correos ficticios @example.invalid o vacío.');
    }
  }, true);
  document.addEventListener('input', event => {
    const target = event.target;
    if (target.matches('#tabla input[data-edit="dni"]')) target.readOnly = true;
  }, true);

  const testAddress = document.getElementById('paraPrueba');
  if (testAddress) testAddress.value = 'prueba@example.invalid';
  const folderButton = document.getElementById('bCarpeta');
  if (folderButton) folderButton.textContent = 'Ver descargas demo';

  const bannerObserver = new MutationObserver(() => {
    const banner = document.getElementById('demo-banner');
    if (!banner || banner.querySelector('#demo-scenarios')) return;
    const controls = document.createElement('label');
    controls.id = 'demo-scenarios';
    controls.append(document.createTextNode('Escenario demo: '));
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Escenario de demostración');
    [
      ['normal', 'Normal'],
      ['lista-vacia', 'Lista vacía'],
      ['error-carga', 'Error de carga'],
      ['conexion-fallida', 'Conexión fallida'],
      ['vista-fallida', 'Vista fallida'],
      ['zip-vacio', 'ZIP vacío']
    ].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.append(option);
    });
    select.addEventListener('change', () => mock.setScenario(select.value));
    controls.append(select);
    banner.append(controls);
  });
  bannerObserver.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('demo:notice', event => {
    if (typeof window.toast === 'function') window.toast(String(event.detail || 'Aviso de demostración'), 4000);
  });
  window.addEventListener('demo:job', () => {
    if (typeof window.sondear === 'function') window.sondear();
  });
})();`;

function replaceRequired(text, target, replacement, label) {
  const matched = target instanceof RegExp ? target.test(text) : text.includes(target);
  if (!matched) {
    throw new Error(`Sustitución obligatoria no encontrada en la UI original: ${label || String(target)}`);
  }
  return text.replace(target, replacement);
}

const sourceHashBefore = sha256(fs.readFileSync(sourcePath));
const originalHtml = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
const fixtures = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const mockApi = requireFile('mock-api.js').replace(/https?:\/\//g, match => match.replace('://', ':\\/\\/'));
const bannerJs = requireFile('demo-banner.js');
const bannerCss = requireFile('demo-banner.css');
const mobileJs = requireFile('demo-mobile.js');
const mobileCss = requireFile('demo-mobile.css');
let html = originalHtml;

html = replaceRequired(html, /<title>[\s\S]*?<\/title>/i, '<title>Demostración</title>', 'etiqueta <title>');
html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, '');
html = replaceRequired(html, /<head([^>]*)>/i, '<head$1>\n<meta name="robots" content="noindex,nofollow">', 'etiqueta <head>');
html = html.replace(/xmlns="https?:\/\/www\.w3\.org\/2000\/svg"/gi, '');
const mandatoryTextReplacements = [
  [/(<div class="drop" id="drop">[\s\S]*?<b>)Arrastra aquí el Excel o (?:el )?CSV(<\/b>)/, '$1Carga el Excel ficticio de demostración$2', 'zona de carga #drop'],
  ['Puedes escribir o corregir el correo y el DNI/NIE directamente en la tabla.', 'Los nombres y documentos proceden del catálogo ficticio; los correos solo admiten dominios de prueba.', 'ayuda tabla personas'],
  // Patrones de coincidencia sobre el TEXTO ORIGINAL de trabajo/ui/index.html para reemplazarlos durante el build; estas cadenas originales NO aparecen en demo/dist/index.html.
  ['placeholder="Nombre&#9;Apellidos&#9;Correo&#10;Ana&#9;García López&#9;ana@ejemplo.com"', 'placeholder="Nombre&#9;Apellidos&#9;Correo&#10;Persona&#9;Demo&#9;demo@example.invalid"', 'placeholder pegado ejemplo'],
  ['placeholder="C:\\Users\\...\\Certificados"', 'placeholder="Carpeta de certificados"', 'placeholder carpeta adicional'],
  ['<button class="btn" id="bPrueba">Enviarme una prueba</button>', '<button class="btn" id="bPrueba">Simular envío de prueba</button>', 'botón envío de prueba'],
  ['Recibirás el mismo correo, con sus adjuntos y los datos de la persona que elijas. No cuenta como envío.', 'Simulará el correo con los adjuntos y los datos de la persona que elijas. No se envía ningún correo real.', 'introducción envío de prueba'],
  ['<button class="btn pri big" id="bEnviar">Generar y enviar a todos</button>', '<button class="btn pri big" id="bEnviar">Simular el envío a todos</button>', 'botón principal envío inicial'],
  ["$('#bEnviar').textContent = `${soloCorreo() ? 'Enviar' : 'Generar y enviar'} a ${nEnv} persona${nEnv === 1 ? '' : 's'}`;", "$('#bEnviar').textContent = `Simular el envío a ${nEnv} persona${nEnv === 1 ? '' : 's'}`;", 'botón principal envío dinámico'],
  // Patrón de coincidencia sobre el TEXTO ORIGINAL de trabajo/ui/index.html para reemplazar el ejemplo de vista previa; estas cadenas originales NO aparecen en demo/dist/index.html.
  ["row = { nombre_ejemplo: 'García López, María José', __e: 'maria@ejemplo.com', __d: '12345678Z' };", "row = { nombre_ejemplo: 'Persona Demo', __e: 'demo@example.invalid', __d: 'DEMO-001' };", 'ejemplo vista previa sin lista'],
  ['Abriendo Outlook y comprobando la cuenta…', 'Comprobando conexión simulada…', 'texto comprobando Outlook'],
  ['Conectando con el servidor de correo…', 'Comprobando conexión simulada…', 'texto comprobando SMTP'],
  ['</svg>Conexión correcta</span>', '</svg>Conexión simulada correcta</span>', 'estado conexión SMTP'],
  ['Comprueba que la aplicación (la ventana negra) sigue abierta y vuelve a pulsar «Probar conexión».', 'Comprueba el escenario seleccionado y vuelve a pulsar «Probar conexión».', 'aviso error conexión SMTP'],
  ["Outlook abierto con ${esc(j.info.usuario || '?')}", "Comprobación simulada para ${esc(j.info.usuario || '?')}", 'resultado conexión Outlook'],
  ["Enviando la prueba a ${esc($('#paraPrueba').value.trim() || '…')}…", "Simulando prueba a ${esc($('#paraPrueba').value.trim() || '…')}…", 'progreso prueba'],
  ["Prueba enviada a ${esc($('#paraPrueba').value)}", "Prueba simulada para ${esc($('#paraPrueba').value)}", 'resultado prueba enviada'],
  ['Revisa tu bandeja de entrada y la carpeta de correo no deseado.', 'No se ha enviado ningún correo: esto es solo una demostración.', 'nota prueba enviada'],
  ["¿Enviar ${indices.length} correo${indices.length === 1 ? '' : 's'} ahora?", "¿Iniciar simulación para ${indices.length} intento${indices.length === 1 ? '' : 's'}?", 'título confirmación envío'],
  ['Correos que salen', 'Intentos simulados', 'etiqueta confirmación envío'],
  ['Una vez enviados, no se pueden recuperar.', 'Esta demostración no envía correos reales. ', 'aviso confirmación envío'],
  ['Deja Outlook abierto hasta que la Bandeja de salida quede vacía. ', '', 'aviso Outlook abierto'],
  ['No cierres la ventana negra de la aplicación hasta que termine; puedes detener el envío en cualquier momento.', 'Es una simulación: puedes seguir usando la demostración mientras avanza y detenerla en cualquier momento.', 'instrucción simulación diálogo'],
  ["`Enviar ${indices.length} correo${indices.length === 1 ? '' : 's'}`", "`Simular ${indices.length} intento${indices.length === 1 ? '' : 's'}`", 'botón confirmación envío'],
  ['Buscando avisos de no entrega en Outlook…', 'Simulando la revisión de rebotes…', 'progreso rebotes'],
  ['Los avisos de no entrega tardan 1–3 minutos en llegar. Se buscarán solos en unos minutos; no hace falta que hagas nada.', 'Los resultados de rebotes son ficticios y se mostrarán al terminar la simulación.', 'aviso espera rebotes']
];
for (const [target, replacement, label] of mandatoryTextReplacements) {
  html = replaceRequired(html, target, replacement, label);
}
html = replaceEmails(html);

const externalReferences = [];
html = html.replace(/\b(href|src|action|formaction|poster|xlink:href)\s*=\s*(["'])(https?:\/\/[^"']*)\2/gi, (whole, attribute, quote, url) => {
  externalReferences.push(url);
  return `${attribute}=${quote}#blocked-external-resource${quote}`;
});
if (externalReferences.length) {
  console.warn(`Aviso: se neutralizaron referencias externas de recursos: ${externalReferences.join(', ')}`);
}

const bannerStyle = `${inlineStyle(bannerCss)}\n${inlineStyle(mobileCss)}`;
html = html.replace('</head>', `${bannerStyle}\n</head>`);

const fixtureAndMock = `${inlineScript(inlineDataScript(fixtures))}\n${inlineScript(mockApi)}`;
const uiScriptStart = html.search(/<script(?:\s[^>]*)?>/i);
if (uiScriptStart < 0) throw new Error('No se encuentra el script original de la UI.');
html = html.slice(0, uiScriptStart) + fixtureAndMock + '\n' + html.slice(uiScriptStart);

const bannerAdapterScript = `${inlineScript(adapter)}\n${inlineScript(bannerJs)}\n${inlineScript(mobileJs)}`;
if (!/<\/body>/i.test(html)) throw new Error('No se encuentra </body> para instalar adaptador y banner.');
html = html.replace(/<\/body>/i, `${bannerAdapterScript}\n</body>`);
html = replaceEmails(html);

const scriptHashes = [];
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) scriptHashes.push(cspHash(match[1]));
const styleHashes = [];
for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) styleHashes.push(cspHash(match[1]));
const handlerHashes = new Set();
for (const match of html.matchAll(/\bon[a-z]+\s*=\s*(["'])(.*?)\1/gi)) handlerHashes.add(cspHash(match[2]));

const scriptPolicy = Array.from(new Set(scriptHashes.concat(Array.from(handlerHashes))));
const csp = [
  "default-src 'none'",
  `script-src ${scriptPolicy.join(' ')} 'unsafe-hashes'`,
  `style-src-elem ${styleHashes.join(' ')}`,
  "style-src-attr 'unsafe-inline'",
  "connect-src 'none'",
  "img-src data: blob:",
  "frame-src blob:",
  "object-src 'none'",
  "font-src 'none'",
  "media-src 'none'",
  "worker-src 'none'",
  "manifest-src 'none'",
  "form-action 'none'",
  "base-uri 'none'"
].join('; ');
html = html.replace(/<head([^>]*)>/i, `<head$1>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);

if (/<(?:script|link|img|iframe|source)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\//i.test(html)) {
  throw new Error('Se detectó una referencia externa de recurso en el documento final.');
}

const sourceHashAfter = sha256(fs.readFileSync(sourcePath));
if (sourceHashBefore !== sourceHashAfter) throw new Error('La fuente trabajo/ui/index.html cambió durante el build.');

removeContents(distDir);
fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(distDir, '_headers'), [
  '/*',
  `  Content-Security-Policy: ${csp}`,
  '  X-Robots-Tag: noindex, nofollow',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: no-referrer',
  ''
].join('\n'), 'utf8');

console.log('Build completado: demo/dist/index.html');
console.log(`Fuente SHA-256: ${sourceHashAfter}`);
console.log(`CSP inline: ${scriptHashes.length} scripts y ${styleHashes.length} estilos con SHA-256; ${handlerHashes.size} handlers.`);
