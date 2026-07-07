/**
 * Eterno — navegación común inyectada en las 5 páginas.
 * Requiere que eterno-store.js se cargue antes que este script.
 */
(function (global) {
  'use strict';

  const PAGES = [
    { href: 'index.html', label: 'Inicio', sub: 'Panel general' },
    { href: 'quotation_tracker.html', label: 'Cotizaciones', sub: 'Tracker de cotizaciones' },
    { href: 'supplier_cost_comparison_dashboard.html', label: 'Comparador', sub: 'Costos y proveedores' },
    { href: 'formula_final.html', label: 'Fórmula', sub: 'Fórmula final' },
    { href: 'purchase-order.html', label: 'Compra', sub: 'Orden de compra' },
  ];

  function currentFile() {
    const p = location.pathname.split('/').pop().toLowerCase();
    return p || 'index.html';
  }

  const esc = global.EternoStore.esc;

  function buildNav() {
    const file = currentFile();
    const active = PAGES.find(p => p.href.toLowerCase() === file) || PAGES[0];
    const links = PAGES.map(p =>
      `<a href="${p.href}"${p.href.toLowerCase() === file ? ' class="active"' : ''}>${p.label}</a>`
    ).join('');

    return `
      <nav class="app-nav">
        <div class="brand">Eterno Labs <span>${esc(active.sub)}</span></div>
        <div class="nav-links">${links}</div>
        <div class="nav-actions">
          <span id="ternoStatusPill"></span>
          <button type="button" class="btn btn-sm" id="ternoBtnExport">Exportar respaldo</button>
          <button type="button" class="btn btn-sm" id="ternoBtnImport">Importar respaldo</button>
          <input type="file" id="ternoFileImport" accept=".json,application/json">
        </div>
      </nav>
      <div id="ternoBackupReminder"></div>
      <div id="ternoUnitWarningBanner"></div>
    `;
  }

  function renderStatusPill() {
    const el = document.getElementById('ternoStatusPill');
    if (!el || !global.EternoStore) return;
    const db = EternoStore.loadDb();
    const missing = EternoStore.getMissingIngredients(db);
    el.innerHTML = missing.length
      ? `<a class="status-pill warn" href="index.html">${missing.length} ingrediente${missing.length === 1 ? '' : 's'} sin cotización</a>`
      : `<a class="status-pill ok" href="index.html">PO listo</a>`;
  }

  function renderBackupReminder() {
    const el = document.getElementById('ternoBackupReminder');
    if (!el || !global.EternoStore) return;
    const db = EternoStore.loadDb();
    if (!EternoStore.shouldShowBackupReminder(db)) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="banner banner-warn" style="margin:0 0 16px">
        <span>⏱ No exportas un respaldo hace más de ${EternoStore.BACKUP_REMINDER_DAYS} días. Tus datos solo viven en este navegador.</span>
        <button type="button" class="btn btn-sm" id="ternoBtnBackupNow">Exportar ahora</button>
      </div>`;
    const btn = document.getElementById('ternoBtnBackupNow');
    if (btn) btn.onclick = doExport;
  }

  function renderUnitWarningBanner() {
    const el = document.getElementById('ternoUnitWarningBanner');
    if (!el || !global.EternoStore) return;
    const db = EternoStore.loadDb();
    const warned = EternoStore.getUnitWarningQuotations(db);
    if (!warned.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="banner banner-warn" style="margin:0 0 16px">
        <span>⚠ ${warned.length} cotización${warned.length === 1 ? '' : 'es'} excluida${warned.length === 1 ? '' : 's'} por unidad ≠ kg.</span>
        <a class="btn btn-sm" href="quotation_tracker.html">Ver cotizaciones</a>
      </div>`;
  }

  function doExport() {
    const db = EternoStore.loadDb();
    EternoStore.exportBackup(db);
    EternoStore.toast('Respaldo exportado');
    renderBackupReminder();
  }

  async function doImport(file) {
    if (!file) return;
    const text = await EternoStore.readFileText(file);
    const summary = EternoStore.summarizeBackup(text);
    if (!summary) {
      EternoStore.toast('El archivo no es un respaldo válido de Eterno');
      return;
    }
    const message =
      `Este respaldo contiene ${summary.quotations} cotización(es), ${summary.picks} selección(es) y ${summary.suppliers} proveedor(es).\n` +
      `Versión: ${summary.version} · Fecha: ${summary.date ? new Date(summary.date).toLocaleString('es-CO') : 'desconocida'}.\n\n` +
      `Se fusionará con tus datos actuales (nada se reemplaza).`;
    const ok = await EternoStore.confirmDialog({
      title: 'Importar respaldo',
      message,
      okLabel: 'Fusionar datos',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    try {
      await EternoStore.importJsonFile(file, true);
      EternoStore.toast('Respaldo importado y fusionado');
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      EternoStore.toast('Error al importar: ' + e.message);
    }
  }

  function bindActions() {
    const btnExport = document.getElementById('ternoBtnExport');
    const btnImport = document.getElementById('ternoBtnImport');
    const fileInput = document.getElementById('ternoFileImport');
    if (btnExport) btnExport.onclick = doExport;
    if (btnImport) btnImport.onclick = () => fileInput.click();
    if (fileInput) fileInput.onchange = (e) => {
      const f = e.target.files[0];
      doImport(f);
      e.target.value = '';
    };
  }

  function init() {
    const mount = document.getElementById('nav-mount');
    if (!mount || !global.EternoStore) return;
    mount.innerHTML = buildNav();
    renderStatusPill();
    renderBackupReminder();
    renderUnitWarningBanner();
    bindActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
