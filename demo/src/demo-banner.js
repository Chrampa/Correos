(function (g) {
  'use strict';
  let finished = false, returnFocus = null;
  function mount() {
    if (!document.body) return;
    let banner = document.getElementById('demo-banner');
    if (!banner) { banner = document.createElement('div'); banner.id = 'demo-banner'; banner.setAttribute('role','note'); banner.textContent = 'Demostración: no se envía ningún correo. Datos inventados.'; document.body.prepend(banner); if (g.ResizeObserver) new ResizeObserver(measure).observe(banner); }
    measure();
    if (finished && !document.getElementById('demo-ended')) { const p = document.createElement('p'); p.id = 'demo-ended'; p.setAttribute('role', 'status'); p.setAttribute('aria-live', 'polite'); document.body.append(p); g.setTimeout(() => { p.textContent = 'Demostración finalizada. Recarga para empezar'; }, 0); }
    if (!g.DemoMock || !g.DemoMock.ready) { document.body.querySelectorAll('button,input,select,textarea').forEach(e => { e.disabled = true; }); banner.textContent = 'Error: demostración bloqueada porque no se ha iniciado el simulador.'; }
  }
  function measure() { const b = document.getElementById('demo-banner'); if (b) document.documentElement.style.setProperty('--demo-banner-height', b.getBoundingClientRect().height + 'px'); }
  function downloads() {
    const m = g.DemoMock; let panel = document.getElementById('demo-downloads');
    if (!panel) {
      panel = document.createElement('dialog'); panel.id = 'demo-downloads'; panel.setAttribute('aria-labelledby', 'demo-downloads-title');
      const title = document.createElement('h2'); title.id = 'demo-downloads-title'; title.textContent = 'Archivos de demostración'; panel.append(title);
      const note = document.createElement('p'); note.textContent = 'Muestras ficticias sin validez. El ZIP contiene PDFs de ejemplo y un registro simulado.'; panel.append(note);
      const close = document.createElement('button'); close.textContent = 'Cerrar'; close.onclick = () => panel.close(); panel.append(close); document.body.append(panel);
      panel.addEventListener('close', () => { const target = returnFocus && returnFocus.isConnected ? returnFocus : document.getElementById('bCarpeta'); if (target) target.focus(); returnFocus = null; });
    }
    panel.querySelectorAll('a').forEach(a => { URL.revokeObjectURL(a.href); a.remove(); });
    const sheet = m.fixtures.hojas.find(h => h.filas.length);
    const log = 'nombre,estado\n' + (m.getState().log || []).map(l => '"' + l.nombre.replace(/"/g,'""') + '","' + l.estado + '"').join('\n');
    const files = [['asistentes-demo.xlsx', m.createXlsx(sheet), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], ['certificado-demo.pdf', m.createPdf(), 'application/pdf'], ['justificante-demo.pdf', m.createPdf(), 'application/pdf'], ['certificados-demo.zip', m.createZip([['certificado-demo.pdf',m.createPdf()],['registro-demo.csv',log || 'Sin lote']]), 'application/zip']];
    files.forEach(f => { const a = document.createElement('a'); a.textContent = 'Descargar ' + f[0]; a.download = f[0]; a.href = m.blobURL(new Blob([f[1]], {type:f[2]})); panel.append(a); });
    if (!panel.open) { returnFocus = document.activeElement; panel.showModal(); panel.querySelector('button').focus(); }
  }
  g.addEventListener('demo:downloads', downloads);
  g.addEventListener('demo:closed', () => { finished = true; });
  g.addEventListener('resize', measure);
  function start() { mount(); new MutationObserver(mount).observe(document.body, { childList:true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window);
