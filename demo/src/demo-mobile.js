(function (g) {
  'use strict';

  function labelTables(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const tables = scope.querySelectorAll('.tbl table');
    for (const table of tables) {
      const rows = table.rows;
      if (!rows || !rows.length) continue;
      const ths = rows[0].querySelectorAll('th');
      if (!ths.length) continue;
      const headers = Array.from(ths, th => th.textContent.trim());
      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r].cells;
        if (cells.length === 1 && cells[0].hasAttribute('colspan')) continue;
        for (let c = 0; c < cells.length; c++) {
          const cell = cells[c];
          const label = headers[c] || '';
          if (label && cell.dataset.label !== label) cell.dataset.label = label;
          const hasControlOrBadge = !!cell.querySelector('input,select,a,button,.pill,svg');
          if (!hasControlOrBadge && !cell.textContent.trim()) {
            cell.dataset.empty = '1';
          } else if (cell.dataset.empty) {
            delete cell.dataset.empty;
          }
        }
      }
    }
  }

  function hookNavigation() {
    if (typeof g.ir === 'function' && !g.ir._demoMobileWrapped) {
      const originalIr = g.ir;
      g.ir = function () {
        const result = originalIr.apply(this, arguments);
        if (g.matchMedia && g.matchMedia('(max-width: 760px)').matches) {
          g.scrollTo(0, 0);
        }
        return result;
      };
      g.ir._demoMobileWrapped = true;
    }
  }

  function placeToast() {
    const toast = document.getElementById('toast');
    const main = document.querySelector('main');
    if (!toast || !main) return;
    if (toast.parentElement !== main || main.firstElementChild !== toast) {
      main.prepend(toast);
    }
  }

  function start() {
    hookNavigation();
    placeToast();
    const main = document.querySelector('main') || document.body;
    if (!main) return;
    labelTables(main);
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        labelTables(main);
      });
    });
    observer.observe(main, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
