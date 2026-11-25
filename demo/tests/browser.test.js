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
const chromePath = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].filter(Boolean).find(filename => fs.existsSync(filename));

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

async function until(test, message, timeout = 12000) {
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
    const timer = setTimeout(() => reject(new Error('Timeout conectando el WebSocket de Chrome DevTools')), 10000);
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
            }, 15000);
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

async function main() {
  if (!chromePath) throw new Error('Chrome no encontrado; establece CHROME_PATH para usar el navegador instalado.');

  const server = startProcess(process.execPath, [path.join(demoDir, 'serve.js')]);
  const serverMatch = await until(() => /Servidor local: (http:\/\/127\.0\.0\.1:\d+)/.exec(server.output), 'servidor estático');
  const origin = serverMatch[1];
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-chrome-'));
  let chrome;
  let cdp;
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
    let targets;
    try {
      targets = await until(async () => {
        try { return await getJson(`http://127.0.0.1:${debugPort}/json/list`); } catch { return null; }
      }, 'target Chrome');
    } catch (error) {
      throw new Error(`${error.message}; puerto ${debugPort}\n${chrome.output}`);
    }
    const page = targets.find(target => target.type === 'page');
    assert.ok(page, 'Chrome debe abrir una página');
    try {
      cdp = await connectCDP(page.webSocketDebuggerUrl);
    } catch (error) {
      throw new Error(`${error.message}\n${chrome.output}`);
    }

    const errors = [];
    const requests = [];
    cdp.onMessage(message => {
      if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params.exceptionDetails;
        errors.push(JSON.stringify({
          text: details.text,
          exception: details.exception && details.exception.description,
          stack: details.stackTrace && details.stackTrace.callFrames.map(frame => `${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1}`)
        }));
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
      }
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
      if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
    });
    await cdp.command('Runtime.enable');
    await cdp.command('Log.enable');
    await cdp.command('Network.enable');
    await cdp.command('Page.enable');
    await cdp.command('Page.navigate', { url: origin + '/' });

    const evaluate = async expression => {
      const result = await cdp.command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    await until(async () => evaluate('document.title === "Demostración" && window.DemoMock && DemoMock.ready'), 'mock y UI listos');

    await evaluate(`document.querySelector('button[data-modo="correo"]').click()`);
    const { root: documentRoot } = await cdp.command('DOM.getDocument');
    const { nodeId } = await cdp.command('DOM.querySelector', { nodeId: documentRoot.nodeId, selector: '#fLista' });
    assert.ok(nodeId, 'selector de archivo Excel disponible');
    await cdp.command('DOM.setFileInputFiles', { files: [excelPath], nodeId });
    await until(async () => evaluate('document.querySelectorAll("#tabla input[data-edit=email]").length === 6'), 'Excel ficticio reemplazado por seis personas');
    assert.ok(await evaluate('document.querySelector("#tabla").textContent.includes("Persona Demo Uno")'), 'la UI presenta los fixtures del mock');

    await evaluate('ir(7)');
    assert.ok(await evaluate('document.querySelector("#paraPrueba").value === "prueba@example.invalid"'), 'destinatario de prueba limitado a dominio .invalid');
    await evaluate('document.querySelector("#bEnviar").click()');
    await until(async () => evaluate('document.querySelector("#dlg").open'), 'diálogo de confirmación');
    await evaluate('document.querySelector("#dlgSi").click()');
    await until(async () => evaluate('DemoMock.getState().corriendo === true'), 'inicio del envío simulado');
    await until(async () => {
      const result = await evaluate('DemoMock.getState().corriendo === false && DemoMock.getState().hechos === 4');
      return result;
    }, 'final del envío simulado', 15000);
    await wait(1800);
    const state = await evaluate('JSON.stringify(DemoMock.getState())');
    const finalState = JSON.parse(state);
    assert.equal(finalState.modo, 'enviar');
    assert.equal(finalState.total, 4);
    assert.match(finalState.aviso, /no se envía ningún correo/i);
    assert.ok(await evaluate('document.querySelector("#tablaLog").textContent.includes("Enviado")'), 'el estado de envío se muestra en la UI');
    assert.ok(await evaluate('document.querySelector("#demo-banner") && document.querySelector("#demo-scenarios")'), 'aviso y selector de escenarios visibles');

    await wait(250);
    const external = requests.filter(url => /^https?:\/\//i.test(url) && !url.startsWith(origin + '/'));
    assert.deepEqual(external, [], `peticiones de red externas: ${external.join(', ')}`);
    const networkRequests = requests.filter(url => /^(?:https?|wss?):\/\//i.test(url));
    assert.deepEqual(networkRequests, [origin + '/'], `se esperaban solo la carga inicial, sin peticiones posteriores: ${networkRequests.join(', ')}`);
    assert.deepEqual(errors, [], `errores de consola: ${errors.join(' | ')}`);
    const dataImages = requests.filter(url => url.startsWith('data:')).length;
    console.log(`PASS: Chrome headless sin errores; una única petición HTTP inicial, cero peticiones externas y ${dataImages} imágenes SVG data:; Excel sustituido por fixtures y envío simulado (${finalState.hechos} filas).`);
  } finally {
    if (cdp) cdp.socket.close();
    const stopped = [];
    if (chrome && !chrome.child.killed) {
      chrome.child.kill();
      stopped.push(chrome.child);
    }
    if (!server.child.killed) {
      server.child.kill();
      stopped.push(server.child);
    }
    await Promise.all(stopped.map(child => Promise.race([
      new Promise(resolve => child.once('close', resolve)),
      wait(3000)
    ])));
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
