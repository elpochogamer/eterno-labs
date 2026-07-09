/**
 * Eterno — glosario de términos con popover accesible.
 * Uso: <span class="term" data-term="fob">FOB</span>
 * Un solo popover en el DOM, reposicionado por clic (no hover).
 * Clic de nuevo / clic fuera / Esc lo cierran.
 */
(function (global) {
  'use strict';

  const TERMS = {
    fob: 'Free On Board. Precio de la mercancía cargada en el puerto de origen. No incluye flete, seguro, arancel ni gastos de nacionalización.',
    landed: 'Costo puesto en bodega: FOB + flete + seguro + arancel + gastos de aduana. Es lo que realmente pagas por tener el material en Medellín.',
    cogs: 'Cost of Goods Sold — costo del producto vendido. Suma materia prima + empaque + etiqueta + maquila. No confundir con el costo de materia prima solo.',
    mp: 'Materia prima. Solo los ingredientes de la fórmula, sin empaque ni maquila.',
    moq: 'Minimum Order Quantity. Cantidad mínima que el proveedor acepta vender.',
    spec: 'Hoja de especificación técnica del proveedor (TDS/COA). Define pureza, método de extracción y solubilidad.',
    der: 'Drug Extract Ratio. 40:1 significa 40 kg de planta por 1 kg de extracto.',
    pvp: 'Precio de venta al público.',
    margen: 'Margen bruto = (PVP − COGS) / PVP, expresado en %.',
    co2: 'Extracto por CO₂ supercrítico. Oil-soluble, apto para base anhidra.',
    anhidro: 'Formulación sin agua. Solo admite ingredientes oil-soluble.',
    inci: 'International Nomenclature of Cosmetic Ingredients. Nomenclatura obligatoria en etiqueta.',
    contrib: 'Contribución = precio USD/kg × % normalizado. Lo que ese ingrediente aporta al costo de un kg de fórmula.',
  };

  const POPOVER_ID = 'eterno-term-popover';
  let popover = null;   // único popover en el DOM, se reposiciona
  let openSpan = null;  // término actualmente abierto

  function ensurePopover() {
    if (popover) return popover;
    popover = document.createElement('div');
    popover.id = POPOVER_ID;
    popover.className = 'term-popover';
    popover.setAttribute('role', 'tooltip');
    popover.hidden = true;
    document.body.appendChild(popover);
    return popover;
  }

  function close() {
    if (!popover || popover.hidden) return;
    popover.hidden = true;
    if (openSpan) {
      openSpan.removeAttribute('aria-describedby');
      openSpan.setAttribute('aria-expanded', 'false');
      openSpan = null;
    }
  }

  function open(span) {
    const text = TERMS[span.dataset.term];
    if (!text) return;
    const p = ensurePopover();
    p.textContent = text;
    p.hidden = false;
    span.setAttribute('aria-describedby', POPOVER_ID);
    span.setAttribute('aria-expanded', 'true');
    openSpan = span;

    const r = span.getBoundingClientRect();
    const maxLeft = window.scrollX + document.documentElement.clientWidth - p.offsetWidth - 12;
    const left = Math.max(window.scrollX + 8, Math.min(r.left + window.scrollX, maxLeft));
    p.style.left = left + 'px';
    p.style.top = (r.bottom + window.scrollY + 6) + 'px';
  }

  // Delegado en fase de captura: sobrevive re-renders vía innerHTML y evita
  // que el clic en un término dispare handlers del ancestro (p.ej. th sortable).
  document.addEventListener('click', (e) => {
    const span = e.target.closest ? e.target.closest('.term[data-term]') : null;
    if (span) {
      e.preventDefault();
      e.stopPropagation();
      if (openSpan === span) { close(); return; }
      close();
      open(span);
      return;
    }
    if (popover && !popover.hidden && !popover.contains(e.target)) close();
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('term')) {
      e.preventDefault();
      e.target.click();
    }
  });

  window.addEventListener('resize', close);
  window.addEventListener('scroll', () => { if (openSpan) close(); }, true);

  // Semántica/teclado para los términos presentes (llamable tras re-renders)
  function enhance(root) {
    (root || document).querySelectorAll('.term[data-term]').forEach(s => {
      if (s.hasAttribute('tabindex')) return;
      s.setAttribute('tabindex', '0');
      s.setAttribute('role', 'button');
      s.setAttribute('aria-expanded', 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhance());
  } else {
    enhance();
  }

  global.EternoTerms = { TERMS, enhance, close };
})(typeof window !== 'undefined' ? window : globalThis);
