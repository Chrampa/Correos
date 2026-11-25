/* Demo transport. ES2019; deliberately never retains the native fetch. */
(function (g) {
  'use strict';
  const blockedMessage = 'Petición bloqueada en demostración';
  const clone = x => JSON.parse(JSON.stringify(x));
  const fixtures = g.__DEMO_DATA__;
  const timers = new Set(), urls = new Set(), documents = new Map(), attempts = new Map();
  const createURL = URL.createObjectURL.bind(URL), revokeURL = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = function (blob) { const url = createURL(blob); urls.add(url); return url; };
  URL.revokeObjectURL = function (url) { urls.delete(url); revokeURL(url); };
  let config, job = null, serial = 0, docSerial = 0, scenario = 'normal', closed = false;
  function blocked() { console.error(blockedMessage); throw new TypeError(blockedMessage); }
  function rejectNetwork() { return Promise.reject(new TypeError(blockedMessage)); }
  g.fetch = function () { console.error(blockedMessage); return rejectNetwork(); };
  ['XMLHttpRequest', 'EventSource', 'WebSocket', 'Worker', 'SharedWorker'].forEach(k => { g[k] = function () { blocked(); }; });
  if (g.navigator) {
    try { Object.defineProperty(g.navigator, 'sendBeacon', { value: blocked, configurable: true }); } catch (_) { g.navigator.sendBeacon = blocked; }
    if (g.navigator.serviceWorker) { try { Object.defineProperty(g.navigator.serviceWorker, 'register', { value: function () { console.error(blockedMessage); return rejectNetwork(); } }); } catch (_) { /* CSP also denies worker-src. */ } }
  }
  const nativeOpen = g.open && g.open.bind(g);
  g.open = function (url, target, features) { if (!urls.has(String(url))) return blocked(); return nativeOpen ? nativeOpen(url, target, features) : null; };
  // Location is unforgeable in browsers: use the cancellable navigation event,
  // never pretend that replacing location.assign would provide protection.
  if (g.navigation && typeof g.navigation.addEventListener === 'function') {
    g.navigation.addEventListener('navigate', function (e) {
      const destination = new URL(e.destination.url, g.location.href);
      const current = new URL(g.location.href);
      const sameDocument = destination.href.split('#')[0] === current.href.split('#')[0];
      if (urls.has(destination.href) || sameDocument) return;
      console.error(blockedMessage);
      if (e.cancelable) e.preventDefault();
    });
  }
  if (g.addEventListener) {
    // Safety net only: beforeunload needs user activation and is not a network
    // firewall; pagehide can clean up but cannot cancel a navigation.
    g.addEventListener('beforeunload', function (e) { if (closed) return; e.preventDefault(); e.returnValue = ''; });
    g.addEventListener('pagehide', function () { cancel(); });
  }
  if (!fixtures || !fixtures.config || !Array.isArray(fixtures.hojas)) { console.error('Demo: faltan fixtures __DEMO_DATA__'); return; }
  config = sanitize(fixtures.config);
  function sanitize(value) {
    return JSON.parse(JSON.stringify(value || {}, (key, val) => /^(pass|password|__proto__|constructor|prototype)$/i.test(key) ? undefined : val));
  }
  function timer(fn, ms) { const id = g.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
  function cancel() { timers.forEach(id => g.clearTimeout(id)); timers.clear(); }
  function delay(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      const id = g.setTimeout(() => { if (signal) signal.removeEventListener('abort', abort); resolve(); }, ms);
      function abort() { g.clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); }
      if (signal) signal.addEventListener('abort', abort, { once: true });
    });
  }
  function json(value, status) { return new Response(JSON.stringify(value), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }
  function error(message, status) { return json({ error: message }, status || 400); }
  function event(name, detail) { if (g.dispatchEvent && g.CustomEvent) g.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  function notice(text) { event('demo:notice', text); }
  function xml(text) { return String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c])); }
  function person(row) {
    const rows = fixtures.hojas.reduce((a, h) => a.concat(h.filas), []);
    return rows.find(r => r.DNI === row.DNI) || rows.find(r => r.Nombre === row.Nombre && r.Apellidos === row.Apellidos);
  }
  function name(row) { return [row.Nombre, row.Apellidos].filter(Boolean).join(' '); }
  function validMail(mail) { return /^[^\s@]+@example\.invalid$/i.test(mail || ''); }
  function suppressLegacyBounceTimer() {
    // The original global lexical binding stores a job ID, not a timer handle.
    // Mark this job BEFORE returning its snapshot, so sondear cannot schedule
    // its untracked 150-second callback. Only our ID-guarded timer is active.
    if (job && typeof tRebote !== 'undefined') tRebote = job.id;
  }
  function safeRow(row) {
    const p = person(row || {}); if (!p) return null;
    const r = clone(p);
    if (row['Correo electrónico'] === '' || validMail(row['Correo electrónico'])) r['Correo electrónico'] = row['Correo electrónico'];
    if (Array.isArray(row.__adjuntos)) r.__adjuntos = row.__adjuntos.filter(id => documents.has(String(id)));
    r.__cargos = String(row.__cargos || ''); return r;
  }
  function pdf() {
    const stream = 'BT /F1 20 Tf 50 750 Td (DEMOSTRACION / SIN VALIDEZ) Tj 0 -40 Td (Documento ficticio de ejemplo) Tj ET';
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'];
    let out = '%PDF-1.4\n', offsets = [0];
    objs.forEach((o, i) => { offsets.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
    const start = out.length; out += 'xref\n0 6\n0000000000 65535 f \n';
    offsets.slice(1).forEach(n => { out += String(n).padStart(10, '0') + ' 00000 n \n'; });
    return new TextEncoder().encode(out + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + start + '\n%%EOF\n');
  }
  // Small deterministic ZIP STORE encoder; all spreadsheet cells are inline strings.
  function zip(files) {
    const parts = [], directory = []; let offset = 0;
    function bytes(n) { return new Uint8Array(n); }
    function put(a, at, n, size) { for (let i = 0; i < size; i++) a[at + i] = (n >>> (8 * i)) & 255; }
    files.forEach(file => {
      const n = new TextEncoder().encode(file[0]), data = typeof file[1] === 'string' ? new TextEncoder().encode(file[1]) : file[1];
      let crc = -1; data.forEach(b => { crc ^= b; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }); crc = (crc ^ -1) >>> 0;
      const h = bytes(30 + n.length); put(h, 0, 0x04034b50, 4); put(h, 4, 20, 2); put(h, 6, 2048, 2); put(h, 14, crc, 4); put(h, 18, data.length, 4); put(h, 22, data.length, 4); put(h, 26, n.length, 2); h.set(n, 30);
      const c = bytes(46 + n.length); put(c, 0, 0x02014b50, 4); put(c, 4, 20, 2); put(c, 6, 20, 2); put(c, 8, 2048, 2); put(c, 16, crc, 4); put(c, 20, data.length, 4); put(c, 24, data.length, 4); put(c, 28, n.length, 2); put(c, 42, offset, 4); c.set(n, 46);
      parts.push(h, data); directory.push(c); offset += h.length + data.length;
    });
    const end = bytes(22), size = directory.reduce((n, a) => n + a.length, 0); put(end, 0, 0x06054b50, 4); put(end, 8, files.length, 2); put(end, 10, files.length, 2); put(end, 12, size, 4); put(end, 16, offset, 4);
    const result = bytes(offset + size + 22); let at = 0; parts.concat(directory, [end]).forEach(a => { result.set(a, at); at += a.length; }); return result;
  }
  function xlsx(body) {
    const rows = body.filas || [], extra = body.extra || [];
    const columns = Array.from(new Set((body.columnas || []).concat(extra.reduce((a, e) => a.concat(Object.keys(e || {})), []))));
    const table = [columns].concat(rows.map((r, i) => columns.map(c => Object.prototype.hasOwnProperty.call(extra[i] || {}, c) ? extra[i][c] : r[c])));
    const sheet = '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + table.map(row => '<row>' + row.map(v => '<c t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>').join('') + '</row>').join('') + '</sheetData></worksheet>';
    return zip([
      ['[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
      ['_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Personas demo" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'], ['xl/worksheets/sheet1.xml', sheet]
    ]);
  }
  function blobURL(blob) { const url = URL.createObjectURL(blob); urls.add(url); return url; }
  function documentURL(id) { const doc = documents.get(String(id)); if (!doc) return null; if (!doc.url) doc.url = blobURL(new Blob([pdf()], { type: 'application/pdf' })); return doc.url; }
  function rebotes(body) {
    if ((body.config || config).smtp && (body.config || config).smtp.preset !== 'outlook') return { ok: false, error: 'La búsqueda simulada de rebotes requiere el preset Outlook' };
    const conJob = !!(job && !job.corriendo && job.modo === 'enviar'); let marcados = 0;
    const match = conJob && job.log.find(l => l.demoKey === 'DEMO-002' && l.estado === 'Enviado' && attempts.get(l.demoKey) === 1);
    const inPeriod = body.dias === undefined || Number(body.dias) > 0;
    if (match && inPeriod && !job.rebotesComprobados) { match.estado = 'Rebotado'; match.error = 'Destinatario inexistente (simulado)'; job.ok--; job.fallos++; job.rebotados++; marcados = 1; }
    if (conJob && inPeriod) job.rebotesComprobados = true;
    const p = fixtures.hojas.reduce((a, h) => a.concat(h.filas), []).find(r => r.DNI === 'DEMO-002');
    return { ok: true, rebotes: inPeriod && p && (!conJob || job.rebotados) ? [{ nombre: name(p), email: p['Correo electrónico'], motivo: 'Destinatario inexistente (simulado)', codigo: '550 5.1.1', fecha: new Date().toISOString() }] : [], marcados: marcados, conJob: conJob };
  }
  function start(body) {
    if (job && job.corriendo) return error('Ya hay una simulación en marcha', 409);
    const rows = (body.filas || []).map(safeRow);
    const indices = Array.from(new Set(body.indices || [])).filter(i => Number.isInteger(i) && i >= 0 && rows[i] && (body.modo === 'generar' || validMail(rows[i]['Correo electrónico'])));
    if (!indices.length) return error('No hay personas seleccionadas válidas');
    cancel(); const cfg = sanitize(body.config || config);
    job = { id: ++serial, modo: body.modo === 'generar' ? 'generar' : 'enviar', total: indices.length, hechos: 0, ok: 0, fallos: 0, actual: 'Preparando simulación…', log: [], carpeta: 'Descargas de demostración', registro: 'registro-demo.csv', corriendo: true, parar: false, error: '', inicio: Date.now(), fin: null, aviso: 'Demostración: no se envía ningún correo. Datos inventados.', rebotados: 0, rebotesComprobados: false };
    const current = job;
    function step() {
      if (job !== current || !current.corriendo) return;
      const i = indices[current.hechos], row = rows[i], key = row.DNI, attempt = (attempts.get(key) || 0) + 1;
      if (current.modo === 'enviar') attempts.set(key, attempt);
      const fail = current.modo === 'enviar' && key === 'DEMO-003' && attempt === 1;
      const adjuntos = cfg.modo === 'correo' ? 0 : cfg.recibidos && cfg.recibidos.activo ? (row.__adjuntos || []).length : Number(!!(cfg.certificado && cfg.certificado.activo)) + Number(!!(cfg.justificante && cfg.justificante.activo));
      current.actual = name(row); current.log.push({ i: i, nombre: name(row), email: row['Correo electrónico'], estado: current.modo === 'generar' ? 'Generado' : fail ? 'Error' : 'Enviado', error: fail ? 'Fallo temporal simulado' : '', adjuntos: adjuntos, hora: new Date().toTimeString().slice(0, 8), demoKey: key });
      current.hechos++; if (fail) current.fallos++; else current.ok++;
      if (current.hechos < current.total) timer(step, 1000);
      else { current.corriendo = false; current.fin = Date.now(); if (current.modo === 'enviar') timer(() => { if (job !== current) return; if (typeof g.comprobarRebotes === 'function') g.comprobarRebotes(); else { rebotes({ config: cfg }); event('demo:job', clone(job)); } }, 1200); }
    }
    timer(step, 1000); return json({ ok: true });
  }
  const routes = { '/api/info':'GET', '/api/config':'POST', '/api/lista':'POST', '/api/vista':'POST', '/api/smtp':'POST', '/api/prueba':'POST', '/api/ejecutar':'POST', '/api/estado':'GET', '/api/parar':'POST', '/api/abrir':'POST', '/api/rebotes':'POST', '/api/recibidos':'POST', '/api/recibido':'GET', '/api/excel':'POST', '/api/salir':'POST' };
  function routePath(url) {
    const base = new URL(g.location.href);
    if (url.protocol !== base.protocol || url.origin !== base.origin || url.host !== base.host || url.username || url.password) return null;
    if (!/^https?:$/.test(url.protocol) && url.protocol !== 'file:') return null;
    let pathname = url.pathname, basePath = base.pathname;
    if (url.protocol === 'file:') {
      const drive = /^\/[a-z]:/i.exec(basePath);
      if (drive) {
        if (pathname.slice(0, 3).toLowerCase() !== drive[0].toLowerCase()) return null;
        pathname = pathname.slice(3); basePath = basePath.slice(3);
      }
    }
    const directory = basePath.slice(0, basePath.lastIndexOf('/') + 1);
    if (pathname.startsWith(directory + 'api/')) pathname = '/' + pathname.slice(directory.length);
    return Object.prototype.hasOwnProperty.call(routes, pathname) ? pathname : null;
  }
  g.fetch = async function (input, init) {
    init = init || {}; const isRequest = typeof Request !== 'undefined' && input instanceof Request;
    let url; try { url = new URL(isRequest ? input.url : String(input), g.location.href); } catch (_) { return blocked(); }
    const method = String(init.method || (isRequest ? input.method : 'GET')).toUpperCase();
    const pathname = routePath(url);
    if (!pathname || routes[pathname] !== method) return blocked();
    const allowed = pathname === '/api/recibidos' ? 'nombre' : pathname === '/api/recibido' ? 'id' : '';
    for (const key of url.searchParams.keys()) if (key !== allowed || url.searchParams.getAll(key).length !== 1) return blocked();
    const signal = init.signal || (isRequest ? input.signal : undefined);
    let raw = Object.prototype.hasOwnProperty.call(init, 'body') ? init.body : isRequest && method !== 'GET' && pathname !== '/api/recibidos' ? await input.clone().text() : undefined;
    if (typeof FormData !== 'undefined' && raw instanceof FormData) return blocked();
    let body = {}; if (raw !== undefined && raw !== null && pathname !== '/api/recibidos') { try { body = JSON.parse(raw); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); } catch (_) { return error('JSON no válido'); } }
    const latency = { '/api/lista':350, '/api/smtp':600, '/api/prueba':700, '/api/recibidos':450 }[pathname] || 80;
    await delay(latency, signal);
    if (closed && pathname !== '/api/salir') return error('Demostración finalizada. Recarga para empezar', 410);
    switch (pathname) {
      case '/api/info': return json({ version:'1.4.0-demo', config:clone(config), salida:'Descargas de demostración', so:'web-demo' });
      case '/api/config': if (!body.config) return error('Falta config'); config = sanitize(body.config); return json({ ok:true });
      case '/api/lista': notice('Carga simulada: se usan personas ficticias'); return scenario === 'error-carga' ? error('Error de carga simulado') : json({ hojas: scenario === 'lista-vacia' ? [clone(fixtures.hojas[0])] : clone(fixtures.hojas) });
      case '/api/vista': {
        if (scenario === 'vista-fallida') return error('Vista fallida (simulada)');
        const row = safeRow(body.fila || {}) || fixtures.hojas[1].filas[0], c = body.config || config, style = c[body.tipo === 'justificante' ? 'justificante' : 'certificado'] || {};
        const color = /^#[0-9a-f]{6}$/i.test(style.color || '') ? style.color : '#1f4e79';
        const texts = ['DEMOSTRACIÓN / SIN VALIDEZ', style.titulo || (body.tipo === 'justificante' ? 'Justificante' : 'Certificado'), name(row), (c.evento || {}).evento || '', (c.evento || {}).fecha || '', 'Vista orientativa; no reproduce el generador PDF'];
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 640"><rect width="900" height="640" fill="white"/><rect x="20" y="20" width="860" height="600" fill="none" stroke="' + color + '"/>' + texts.map((t, i) => '<text x="450" y="' + (100 + i * 80) + '" text-anchor="middle" font-size="' + (i === 1 ? 32 : 20) + '" fill="' + color + '">' + xml(t) + '</text>').join('') + '</svg>';
        return new Response(svg, { headers: { 'Content-Type':'image/svg+xml', 'X-Faltan':encodeURIComponent(JSON.stringify([])) } });
      }
      case '/api/smtp': return json(scenario === 'conexion-fallida' ? { ok:false, error:'Conexión fallida (simulada)' } : { ok:true, info:{ usuario:'cuenta@example.invalid', nombre:'Cuenta de demostración' } });
      case '/api/prueba': return json(validMail(body.para) ? { ok:true, nombre:'Prueba simulada: ' + name(safeRow(body.fila || {}) || fixtures.hojas[1].filas[0]) } : { ok:false, error:'Utiliza una dirección ficticia del dominio .invalid' });
      case '/api/ejecutar': return start(body);
      case '/api/estado': suppressLegacyBounceTimer(); return json(job ? clone(job) : {});
      case '/api/parar': cancel(); if (job) { job.parar = true; job.corriendo = false; job.fin = Date.now(); job.aviso = 'Simulación detenida'; } return json({ ok:true });
      case '/api/abrir': event('demo:downloads'); return json({ ok:true });
      case '/api/rebotes': return json(rebotes(body));
      case '/api/recibidos': {
        if (scenario === 'zip-vacio') return error('El ZIP de demostración no contiene PDF');
        const isPDF = /\.pdf$/i.test(url.searchParams.get('nombre') || '');
        const docs = clone(isPDF ? fixtures.recibidos.slice(0, 1) : fixtures.recibidos).map(d => { d.id = 'demo-' + (++docSerial); documents.set(d.id, { data:d }); return d; }); notice('Carga simulada: se usan documentos ficticios'); return json({ docs:docs });
      }
      case '/api/recibido': return documents.has(url.searchParams.get('id')) ? new Response(pdf(), { headers:{ 'Content-Type':'application/pdf' } }) : error('Documento no encontrado', 404);
      case '/api/excel': return new Response(xlsx(body), { headers:{ 'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } });
      case '/api/salir': cancel(); closed = true; if (job) job.corriendo = false; event('demo:closed'); return json({ ok:true });
    }
  };
  function rewriteLinks(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('a[href*="/api/recibido?"]').forEach(a => { const id = new URL(a.getAttribute('href'), g.location.href).searchParams.get('id'), url = documentURL(id); a.dataset.demoId = id; if (url) a.href = url; else a.removeAttribute('href'); });
  }
  if (g.document) {
    ['click', 'auxclick', 'contextmenu'].forEach(type => g.document.addEventListener(type, e => { const a = e.target.closest && e.target.closest('a[href]'); if (a && !a.getAttribute('href').startsWith('#') && !urls.has(a.href)) { e.preventDefault(); console.error(blockedMessage); } }, true));
    g.document.addEventListener('submit', e => { e.preventDefault(); console.error(blockedMessage); }, true);
  }
  g.DemoMock = Object.freeze({ ready:true, routes:Object.freeze(routes), setScenario:function (s) { if (!['normal','lista-vacia','error-carga','conexion-fallida','vista-fallida','zip-vacio'].includes(s)) throw new Error('Escenario desconocido'); scenario = s; }, documentURL:documentURL, rewriteLinks:rewriteLinks, blobURL:blobURL, createXlsx:xlsx, createPdf:pdf, createZip:zip, fixtures:clone(fixtures), getState:() => job ? clone(job) : {}, dispose:() => { cancel(); urls.forEach(u => URL.revokeObjectURL(u)); urls.clear(); }, networkCheck:async () => { try { await g.fetch('https://blocked.example.invalid/'); return false; } catch (e) { return e.message === blockedMessage; } } });
})(typeof window !== 'undefined' ? window : globalThis);
