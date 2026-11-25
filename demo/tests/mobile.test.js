'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const demoDir = path.resolve(__dirname, '..');
const root = path.resolve(demoDir, '..');
const excelPath = path.join(demoDir, 'datos', 'asistentes-demo.xlsx');
const shotsDir = path.join(demoDir, 'capturas');
const chromePath = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].filter(Boolean).find(filename => fs.existsSync(filename));

const ALL_WIDTHS = [360, 375, 390, 412, 430, 800, 1280];
const SHOT_WIDTHS = new Set([360, 390, 430, 800, 1280]);

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

async function until(test, message, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await test();
    if (result) return result;
    await wait(100);
  }
  throw new Error(`Timeout: ${message}`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let output = '';
  child.stdout.on('data', data => { output += data.toString(); });
  child.stderr.on('data', data => { output += data.toString(); });
  return { child, get output() { return output; } };
}

function connectCDP(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    let serial = 0;
    const timer = setTimeout(() => reject(new Error('Timeout conectando WebSocket CDP')), 10000);
    socket.addEventListener('open', () => {
      clearTimeout(timer);
      resolve({
        socket,
        command(method, params = {}) {
          const id = ++serial;
          const promise = new Promise((done, fail) => {
            const timeout = setTimeout(() => {
              pending.delete(id);
              fail(new Error(`Timeout CDP en ${method}`));
            }, 20000);
            pending.set(id, {
              done(value) { clearTimeout(timeout); done(value); },
              fail(error) { clearTimeout(timeout); fail(error); }
            });
          });
          socket.send(JSON.stringify({ id, method, params }));
          return promise;
        },
        onMessage(handler) {
          socket.addEventListener('message', async event => {
            const message = JSON.parse(typeof event.data === 'string' ? event.data : await event.data.text());
            if (message.id && pending.has(message.id)) {
              const item = pending.get(message.id);
              pending.delete(message.id);
              if (message.error) item.fail(new Error(message.error.message));
              else item.done(message.result);
            } else handler(message);
          });
        }
      });
    });
    socket.addEventListener('error', event => reject(new Error(`Error WebSocket CDP: ${event.message || 'conexión rechazada'}`)));
  });
}

const AUDIT_SCRIPT = `(() => {
  const de = document.documentElement;
  const out = {
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    innerWidth: window.innerWidth,
    overflowEls: [],
    smallTargets: [],
    contrastIssues: [],
    radii: {},
    gradients: [],
    shadows: [],
    bannerOverlap: [],
    toastOverlap: []
  };
  const vis = (e) => {
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    const r = e.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    return e.offsetParent !== null || cs.position === 'fixed' || cs.position === 'sticky' || !!e.closest('dialog[open]');
  };
  const sel = (e) => e.tagName.toLowerCase()
    + (e.id ? '#' + e.id : '')
    + (e.className && typeof e.className === 'string'
      ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.')
      : '');
  const rgb = (s) => {
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const bgOf = (e) => {
    let bg = { r: 255, g: 255, b: 255 };
    const chain = [];
    for (let x = e; x; x = x.parentElement) {
      const c = rgb(getComputedStyle(x).backgroundColor);
      if (c && c.a > 0) { chain.push(c); if (c.a >= 1) break; }
    }
    for (const c of chain.reverse()) {
      bg = { r: c.r * c.a + bg.r * (1 - c.a), g: c.g * c.a + bg.g * (1 - c.a), b: c.b * c.a + bg.b * (1 - c.a) };
    }
    return bg;
  };
  const banner = document.getElementById('demo-banner');
  const bannerRect = banner ? banner.getBoundingClientRect() : null;
  const toastEl = document.getElementById('toast');
  const toastVisible = !!(toastEl && toastEl.classList.contains('on') && vis(toastEl));
  const toastRect = toastVisible ? toastEl.getBoundingClientRect() : null;
  const nav = document.getElementById('navPasos');
  if (bannerRect && nav) {
    const nr = nav.getBoundingClientRect();
    if (nr.top < bannerRect.bottom - 1) {
      out.bannerOverlap.push('nav.top=' + Math.round(nr.top) + ' < banner.bottom=' + Math.round(bannerRect.bottom));
    }
  }
  const dlg = document.querySelector('dialog[open]');
  if (bannerRect && dlg) {
    const dr = dlg.getBoundingClientRect();
    if (dr.top < bannerRect.bottom - 1) {
      out.bannerOverlap.push('dialog.top=' + Math.round(dr.top) + ' < banner.bottom=' + Math.round(bannerRect.bottom));
    }
  }
  const checkContrast = (fg, opacity, bg, big, label) => {
    if (!fg) return;
    const alpha = Math.max(0, Math.min(1, fg.a * (Number.isFinite(opacity) ? opacity : 1)));
    const a = lum({
      r: fg.r * alpha + bg.r * (1 - alpha),
      g: fg.g * alpha + bg.g * (1 - alpha),
      b: fg.b * alpha + bg.b * (1 - alpha)
    });
    const b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < (big ? 3 : 4.5)) {
      out.contrastIssues.push(label + ' ' + ratio.toFixed(2));
    }
  };
  const rectsOverlap = (a, b) => !(a.right <= b.left + 1 || a.left >= b.right - 1 || a.bottom <= b.top + 1 || a.top >= b.bottom - 1);

  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e)) continue;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    if (r.right > out.clientWidth + 1 && cs.position !== 'fixed') {
      out.overflowEls.push(sel(e) + ' right=' + Math.round(r.right));
    }
    const br = cs.borderTopLeftRadius;
    if (br && br !== '0px') out.radii[br] = (out.radii[br] || 0) + 1;
    if (cs.backgroundImage && /gradient/.test(cs.backgroundImage)) out.gradients.push(sel(e));
    if (cs.boxShadow && cs.boxShadow !== 'none' && !e.closest('dialog,.toast') &&
        !e.matches('.t6-fila-bad td:first-child,.t6-fila-warn td:first-child')) {
      out.shadows.push(sel(e) + ' ' + cs.boxShadow.slice(0, 40));
    }
    const isInputCtrl = e.matches('button,a[href],input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,[role=button],summary,[tabindex]:not([tabindex="-1"])');
    if (isInputCtrl && !e.closest('.hide')) {
      if (r.height < 44 || r.width < 44) {
        out.smallTargets.push(sel(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
      if (bannerRect && !e.closest('#demo-banner') && !e.closest('dialog') && r.top < bannerRect.bottom - 1 && r.bottom > bannerRect.bottom - 1) {
        out.bannerOverlap.push(sel(e) + ' top=' + Math.round(r.top) + ' < banner.bottom=' + Math.round(bannerRect.bottom));
      }
    }
    if (e.matches('input[type=checkbox],input[type=radio]') && !e.closest('.hide')) {
      const lbl = e.closest('label');
      const lr = (lbl || e).getBoundingClientRect();
      if (lr.height < 44 || lr.width < 44) {
        out.smallTargets.push('chk ' + sel(e) + ' label ' + Math.round(lr.width) + 'x' + Math.round(lr.height));
      }
    }
    const disabled = !!(e.disabled || e.closest('[disabled]'));
    const px = parseFloat(cs.fontSize);
    const big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    const ownText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (toastRect && !e.closest('#toast') && !e.contains(toastEl) && (isInputCtrl || ownText || e.matches('label,p,h1,h2,h3,li,dt,dd,.pill,.note,.stat')) && rectsOverlap(r, toastRect)) {
      out.toastOverlap.push(sel(e));
    }
    if (!disabled && cs.visibility === 'visible') {
      const bg = bgOf(e);
      if (ownText) {
        checkContrast(rgb(cs.color), parseFloat(cs.opacity || '1'), bg, big, sel(e) + ' "' + e.textContent.trim().slice(0, 24) + '"');
      }
      if (e.matches('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=color]):not([type=range]),select,textarea') && !e.closest('.hide')) {
        const valText = e.tagName === 'SELECT'
          ? (e.options[e.selectedIndex] ? e.options[e.selectedIndex].textContent.trim() : '')
          : String(e.value || '').trim();
        if (valText) {
          checkContrast(rgb(cs.color), parseFloat(cs.opacity || '1'), bg, big, sel(e) + ' val="' + valText.slice(0, 20) + '"');
        }
      }
      if (e.matches('input[placeholder],textarea[placeholder]') && !e.closest('.hide')) {
        const pcs = getComputedStyle(e, '::placeholder');
        const ppx = parseFloat(pcs.fontSize || cs.fontSize);
        const pbig = ppx >= 24 || (ppx >= 18.66 && +pcs.fontWeight >= 700);
        checkContrast(rgb(pcs.color), pcs.opacity === '' ? 1 : parseFloat(pcs.opacity), bg, pbig, sel(e) + '::placeholder');
      }
      for (const pseudo of ['::before', '::after']) {
        const pcs = getComputedStyle(e, pseudo);
        const content = pcs.content;
        if (content && content !== 'none' && content !== 'normal' && content !== '""' && content !== "''" && pcs.display !== 'none' && pcs.visibility !== 'hidden') {
          let pbg = bg;
          const pbgc = rgb(pcs.backgroundColor);
          if (pbgc && pbgc.a > 0) {
            pbg = { r: pbgc.r * pbgc.a + bg.r * (1 - pbgc.a), g: pbgc.g * pbgc.a + bg.g * (1 - pbgc.a), b: pbgc.b * pbgc.a + bg.b * (1 - pbgc.a) };
          }
          const ppx = parseFloat(pcs.fontSize || cs.fontSize);
          const pbig = ppx >= 24 || (ppx >= 18.66 && +pcs.fontWeight >= 700);
          checkContrast(rgb(pcs.color), pcs.opacity === '' ? 1 : parseFloat(pcs.opacity), pbg, pbig, sel(e) + pseudo);
        }
      }
    }
  }
  for (const k of ['overflowEls', 'smallTargets', 'contrastIssues', 'gradients', 'shadows', 'bannerOverlap', 'toastOverlap']) {
    out[k] = [...new Set(out[k])];
  }
  return out;
})()`;

async function main() {
  if (!chromePath) throw new Error('Chrome no encontrado; establece CHROME_PATH.');
  fs.mkdirSync(shotsDir, { recursive: true });
  for (const entry of fs.readdirSync(shotsDir)) {
    if (/\.png$/i.test(entry)) fs.unlinkSync(path.join(shotsDir, entry));
  }

  const server = startProcess(process.execPath, [path.join(demoDir, 'serve.js')]);
  const serverMatch = await until(() => /Servidor local: (http:\/\/127\.0\.0\.1:\d+)/.exec(server.output), 'servidor estático');
  const origin = serverMatch[1];
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-mobile-'));
  const zipFixturePath = path.join(profile, 'certificados-demo.zip');
  fs.writeFileSync(zipFixturePath, 'PK\x05\x06' + '\0'.repeat(18));

  let chrome;
  let cdp;
  const report = [];
  const failures = [];

  try {
    chrome = startProcess(chromePath, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--remote-debugging-port=0',
      `--user-data-dir=${profile}`,
      'about:blank'
    ]);
    const activePortFile = path.join(profile, 'DevToolsActivePort');
    const portText = await until(() => fs.existsSync(activePortFile) && fs.readFileSync(activePortFile, 'utf8'), 'puerto CDP');
    const debugPort = portText.split(/\r?\n/)[0];
    const targets = await until(async () => {
      try { return await getJson(`http://127.0.0.1:${debugPort}/json/list`); } catch { return null; }
    }, 'target Chrome');
    const page = targets.find(target => target.type === 'page');
    assert.ok(page, 'Chrome debe abrir una página');
    cdp = await connectCDP(page.webSocketDebuggerUrl);

    const errors = [];
    const requests = [];
    cdp.onMessage(message => {
      if (message.method === 'Runtime.exceptionThrown') {
        const d = message.params.exceptionDetails;
        errors.push(d.text + (d.exception ? ' ' + d.exception.description : ''));
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push(message.params.args.map(a => a.value || a.description || '').join(' '));
      }
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        errors.push(message.params.entry.text);
      }
      if (message.method === 'Network.requestWillBeSent') {
        requests.push(message.params.request.url);
      }
      if (message.method === 'Page.javascriptDialogOpening') {
        if (message.params.type === 'beforeunload') {
          cdp.command('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
        } else {
          errors.push(`Diálogo JS inesperado (${message.params.type}): ${message.params.message}`);
          cdp.command('Page.handleJavaScriptDialog', { accept: false }).catch(() => {});
        }
      }
    });

    await cdp.command('Runtime.enable');
    await cdp.command('Log.enable');
    await cdp.command('Network.enable');
    await cdp.command('Page.enable');
    await cdp.command('DOM.enable');

    const evaluate = async expression => {
      const result = await cdp.command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception ? result.exceptionDetails.exception.description : result.exceptionDetails.text);
      }
      return result.result.value;
    };

    const upload = async (selector, files) => {
      const { root: docRoot } = await cdp.command('DOM.getDocument', { depth: 0 });
      const { nodeId } = await cdp.command('DOM.querySelector', { nodeId: docRoot.nodeId, selector });
      assert.ok(nodeId, `No se encuentra ${selector}`);
      await cdp.command('DOM.setFileInputFiles', { files, nodeId });
    };

    const waitToastClear = async () => {
      await until(async () => evaluate('!document.getElementById("toast").classList.contains("on")'), 'toast desaparece', 8000);
      await wait(120);
    };

    const shot = async (width, name, fullPage = true, allowToast = false) => {
      if (!SHOT_WIDTHS.has(width)) return;
      if (!allowToast) await waitToastClear();
      if (fullPage) await evaluate('(() => { window.scrollTo(0, 0); const mainEl = document.querySelector("main"); if (mainEl) mainEl.scrollTop = 0; })()');
      await wait(120);
      const res = await cdp.command('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: width <= 760 ? fullPage : false
      });
      fs.writeFileSync(path.join(shotsDir, `${width}-${name}.png`), Buffer.from(res.data, 'base64'));
    };

    const auditScreen = async (width, label) => {
      await wait(150);
      const res = await evaluate(AUDIT_SCRIPT);
      const swOk = res.scrollWidth <= res.clientWidth && res.bodyScrollWidth <= res.clientWidth;
      const requireTouch = width <= 760;
      const smallCount = requireTouch ? res.smallTargets.length : 0;
      const line = `${width}px | ${label} | scrollWidth=${res.scrollWidth} <= clientWidth=${res.clientWidth} (${swOk ? 'OK' : 'FAIL'}) | <44px=${requireTouch ? smallCount : 'n/a'} | contrast=${res.contrastIssues.length} | overlap=${res.bannerOverlap.length} | toastOverlap=${res.toastOverlap.length} | grad=${res.gradients.length} | shadow=${res.shadows.length}`;
      report.push(line);
      if (!swOk) failures.push(`${width}px ${label}: scrollWidth=${res.scrollWidth} > clientWidth=${res.clientWidth} (${res.overflowEls.join(', ')})`);
      if (requireTouch && smallCount) failures.push(`${width}px ${label}: controles <44px: ${res.smallTargets.join(', ')}`);
      if (res.contrastIssues.length) failures.push(`${width}px ${label}: contraste AA: ${res.contrastIssues.join(', ')}`);
      if (res.bannerOverlap.length) failures.push(`${width}px ${label}: solapamiento aviso: ${res.bannerOverlap.join(', ')}`);
      if (res.toastOverlap.length) failures.push(`${width}px ${label}: solapamiento toast: ${res.toastOverlap.join(', ')}`);
      if (res.gradients.length) failures.push(`${width}px ${label}: degradados: ${res.gradients.join(', ')}`);
      if (res.shadows.length) failures.push(`${width}px ${label}: sombras no permitidas: ${res.shadows.join(', ')}`);
      for (const radius of Object.keys(res.radii)) {
        if (radius !== '4px' && radius !== '8px') {
          failures.push(`${width}px ${label}: radio no permitido: ${radius}`);
        }
      }
      return res;
    };

    for (const width of ALL_WIDTHS) {
      const isMobile = width <= 760;
      await cdp.command('Emulation.setDeviceMetricsOverride', {
        width,
        height: 800,
        deviceScaleFactor: isMobile ? 2 : 1,
        mobile: isMobile,
        hasTouch: isMobile
      });
      await cdp.command('Page.navigate', { url: origin + '/' });
      await until(async () => evaluate('document.title === "Demostración" && window.DemoMock && DemoMock.ready && !!document.getElementById("demo-scenarios")'), 'UI lista');
      await wait(200);

      // Pantalla 0: Inicio
      await auditScreen(width, 'p0-inicio');
      await shot(width, 'p0-inicio', true);

      // Focus check at 360px
      if (width === 360) {
        await evaluate('document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0);');
        const focusResults = [];
        for (let i = 0; i < 6; i++) {
          await cdp.command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
          await cdp.command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
          focusResults.push(await evaluate(`(() => {
            const e = document.activeElement;
            if (!e || e === document.body) return null;
            const cs = getComputedStyle(e);
            return { tag: e.tagName + (e.id ? '#' + e.id : ''), vis: e.matches(':focus-visible'), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 };
          })()`));
        }
        const badFocus = focusResults.filter(f => f && (!f.vis || !f.outline));
        if (badFocus.length) failures.push(`360px foco visible: ${JSON.stringify(badFocus)}`);
      }

      // Elegir modo certificados -> Pantalla 1 vacía
      await evaluate('document.querySelector(\'button[data-modo="certificados"]\').click()');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="1"]\').classList.contains("on")'), 'pantalla 1 activa');
      await auditScreen(width, 'p1-lista-vacia');
      await shot(width, 'p1-lista-vacia', true);

      // Cargar Excel de demo -> comprobar estado con toast visible (H3) y luego captura limpia
      await upload('#fLista', [excelPath]);
      await until(async () => evaluate('document.querySelectorAll("#tabla input[data-edit=email]").length === 6'), 'Excel cargado (6 personas)');
      await until(async () => evaluate('document.getElementById("toast").classList.contains("on")'), 'toast visible tras carga');
      await auditScreen(width, 'toast-visible');
      await shot(width, 'toast', false, true);
      await waitToastClear();
      await auditScreen(width, 'p1-lista-excel');
      await shot(width, 'p1-lista-excel', true);

      if (width === 360) {
        await evaluate('document.getElementById("navToggle").click()');
        await wait(200);
        await auditScreen(width, 'nav-abierto');
        await shot(width, 'nav-abierto', false);
        await evaluate('document.getElementById("navToggle").click()');
        await wait(150);
      }

      // Pantalla 2: Datos del evento (incluye comprobación de foco durante scroll en 360px)
      await evaluate('ir(2)');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="2"]\').classList.contains("on")'), 'pantalla 2');
      await auditScreen(width, 'p2-evento');
      await shot(width, 'p2-evento', true);
      if (width === 360) {
        await evaluate('window.scrollTo(0, 360); document.querySelector(\'[data-bind="evento.lugar"]\').focus();');
        await wait(150);
        const scrollFocus = await evaluate(`(() => {
          const e = document.activeElement;
          const banner = document.getElementById('demo-banner');
          const nav = document.getElementById('navPasos');
          const r = e.getBoundingClientRect();
          const topBound = Math.max(banner ? banner.getBoundingClientRect().bottom : 0, nav ? nav.getBoundingClientRect().bottom : 0);
          return {
            tag: e.tagName,
            hiddenByHeader: r.top < topBound - 1,
            top: Math.round(r.top),
            topBound: Math.round(topBound)
          };
        })()`);
        if (scrollFocus.hiddenByHeader) {
          failures.push(`360px foco durante scroll tapado por cabecera: ${JSON.stringify(scrollFocus)}`);
        }
        await evaluate('window.scrollTo(0, 0); document.activeElement && document.activeElement.blur();');
      }

      // Pantalla 3: Certificado
      await evaluate('ir(3)');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="3"]\').classList.contains("on") && document.querySelector(\'.page[data-page="3"] [data-pvest]\').classList.contains("hide")'), 'pantalla 3 vista previa');
      await auditScreen(width, 'p3-certificado');
      await shot(width, 'p3-certificado', true);

      // Pantalla 6: Correo
      await evaluate('ir(6)');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="6"]\').classList.contains("on")'), 'pantalla 6');
      await auditScreen(width, 'p6-correo');
      await shot(width, 'p6-correo', true);

      // Pantalla 7: Revisar y enviar (antes del envío)
      await evaluate('ir(7)');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="7"]\').classList.contains("on")'), 'pantalla 7');
      await auditScreen(width, 'p7-enviar');
      await shot(width, 'p7-enviar', true);

      // Simular envío -> Diálogo confirmación -> Ejecución -> Estado final con Enviado/Error/Rebotado/Saltado
      await evaluate('document.querySelector("#bEnviar").click()');
      await until(async () => evaluate('document.querySelector("#dlg").open'), 'diálogo confirmación');
      if (width === 360) {
        await auditScreen(width, 'dialogo-enviar');
        await shot(width, 'dialogo-enviar', false);
      }
      await evaluate('document.querySelector("#dlgSi").click()');
      await until(async () => evaluate('DemoMock.getState().corriendo === true'), 'envío iniciado');
      await until(async () => evaluate('DemoMock.getState().corriendo === false && DemoMock.getState().hechos === 4'), 'envío terminado', 15000);
      await wait(1600);
      await until(async () => evaluate('document.querySelector("#tablaLog").textContent.includes("Rebotado")'), 'rebote simulado reflejado');
      await waitToastClear();
      await auditScreen(width, 'p7-envio-simulado');
      await shot(width, 'p7-envio-simulado', true);

      // Pantalla 4: Justificante (cambiando a modo justificantes)
      await evaluate('elegirModo("justificantes"); ir(4);');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="4"]\').classList.contains("on") && document.querySelector(\'.page[data-page="4"] [data-pvest]\').classList.contains("hide")'), 'pantalla 4 vista previa');
      await auditScreen(width, 'p4-justificante');
      await shot(width, 'p4-justificante', true);

      // Pantalla 5: Certificados recibidos (cambiando a modo recibidos y cargando ZIP ficticio)
      await evaluate('elegirModo("recibidos"); ir(5);');
      await until(async () => evaluate('document.querySelector(\'.page[data-page="5"]\').classList.contains("on")'), 'pantalla 5');
      await upload('#fRec', [zipFixturePath]);
      await until(async () => evaluate('!document.getElementById("recInfo").classList.contains("hide") && document.querySelectorAll("#tablaRec tr").length >= 4'), 'certificados recibidos cargados');
      await waitToastClear();
      await auditScreen(width, 'p5-recibidos');
      await shot(width, 'p5-recibidos', true);

      // Cerrar la sesion simulada al terminar cada ancho para evitar beforeunload en la recarga siguiente
      await evaluate('fetch("/api/salir", { method: "POST", body: "{}" })');
    }

    const networkRequests = requests.filter(url => /^(?:https?|wss?):\/\//i.test(url));
    const unexpectedNet = networkRequests.filter(url => url !== origin + '/');
    assert.deepEqual(unexpectedNet, [], `Peticiones de red inesperadas: ${unexpectedNet.join(', ')}`);
    assert.deepEqual(errors, [], `Errores de consola: ${errors.join(' | ')}`);

    console.log('=== RESUMEN AUDITORIA MOVIL (360, 375, 390, 412, 430 px) ===');
    for (const line of report) console.log(line);
    const pngCount = fs.readdirSync(shotsDir).filter(f => /\.png$/i.test(f)).length;
    console.log(`Capturas PNG generadas en demo/capturas/: ${pngCount}`);

    if (failures.length) {
      console.error('FALLOS DETECTADOS:');
      for (const f of failures) console.error(' - ' + f);
      process.exitCode = 1;
    } else {
      console.log('PASS: Todas las pantallas en 360-430 px sin desbordamiento horizontal, controles >=44 px, contraste AA, foco visible y aviso sin tapar controles.');
    }
  } finally {
    if (cdp) cdp.socket.close();
    const stopped = [];
    if (chrome && !chrome.child.killed) { chrome.child.kill(); stopped.push(chrome.child); }
    if (!server.child.killed) { server.child.kill(); stopped.push(server.child); }
    await Promise.all(stopped.map(child => Promise.race([new Promise(r => child.once('close', r)), wait(3000)])));
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
