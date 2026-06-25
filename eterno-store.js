/**
 * Eterno — capa de persistencia local (localStorage) + export/import JSON
 */
(function (global) {
  const DB_KEY = 'eterno_database_v1';

  const FORMULA_INGREDIENTS = [
    { id: 'cct', name: 'CCT', inci: 'Caprylic/Capric Triglyceride', pct: 42, cat: 'carrier' },
    { id: 'squalane', name: 'Squalane (Oliva)', inci: 'Squalane', pct: 15, cat: 'carrier' },
    { id: 'grapeseed', name: 'Aceite Semilla de Uva (Refinado)', inci: 'Vitis Vinifera Seed Oil', pct: 15, cat: 'carrier' },
    { id: 'rice', name: 'Aceite Salvado de Arroz', inci: 'Oryza Sativa Bran Oil', pct: 10, cat: 'carrier' },
    { id: 'oleic', name: 'Ácido Oleico (Premium)', inci: 'Oleic Acid', pct: 5, cat: 'carrier' },
    { id: 'saw', name: 'Saw Palmetto CO₂ (oil-soluble)', inci: 'Serenoa Serrulata Fruit Extract', pct: 2, cat: 'active' },
    { id: 'iso', name: 'Isochrysis Galbana (Extracto Oleoso)', inci: 'Isochrysis Galbana Extract', pct: 2, cat: 'active' },
    { id: 'baku', name: 'Bakuchiol (>95%)', inci: 'Bakuchiol', pct: 1, cat: 'active' },
    { id: 'rosemary', name: 'Romero CO₂ (Selectivo)', inci: 'Rosmarinus Officinalis Leaf Extract', pct: 1, cat: 'active' },
    { id: 'ginseng', name: 'Ginseng CO₂ (oil-soluble)', inci: 'Panax Ginseng Root Extract', pct: 1, cat: 'active' },
    { id: 'toco', name: 'Tocoferol + Ascorbil Palmitato', inci: 'Tocopherol (and) Ascorbyl Palmitate', pct: 0.8, cat: 'ao' },
    { id: 'mentha', name: 'Mentha Piperita (Aceite Esencial)', inci: 'Mentha Piperita Oil', pct: 0.2, cat: 'eo' },
  ];

  const DEFAULT_QUOTATIONS = [
    { ingId: 'baku', provider: 'P1 China', price: 650, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'Pureza >95% (solicitar COA).' },
    { ingId: 'saw', provider: 'P1 China', price: 137, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'Oil-soluble CO2.' },
    { ingId: 'iso', provider: 'P1 China', price: 80, moq: 1, spec: 'pending', status: 'cotizado', compat: 'yes', notes: 'Confirmar % fucoxantina.' },
    { ingId: 'rosemary', provider: 'P1 China', price: 90.9, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'Carnósico 20%.' },
    { ingId: 'squalane', provider: 'P1 China', price: 9, moq: 1, spec: 'pending', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'cct', provider: 'P1 China', price: 10, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'oleic', provider: 'P1 China', price: 14, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'grapeseed', provider: 'P1 China', price: 9.09, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'rice', provider: 'P1 China', price: 9.09, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'mentha', provider: 'P1 China', price: 37, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'ginseng', provider: 'P1 China', price: 155, moq: 1, spec: 'fail', status: 'descartado', compat: 'no', notes: 'Alcohol-soluble — incompatible anhidro.' },
    { ingId: 'cct', provider: 'P2 Imagen', price: 6.3, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'squalane', provider: 'P2 Imagen', price: 63.6, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'Precio alto vs P1.' },
    { ingId: 'grapeseed', provider: 'P2 Imagen', price: 6.3, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'rice', provider: 'P2 Imagen', price: 6.3, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'saw', provider: 'P2 Imagen', price: 10.7, moq: 1, spec: 'warn', status: 'negociando', compat: 'no', notes: '40:1 DER ≠ CO2 oil-soluble.' },
    { ingId: 'baku', provider: 'P2 Imagen', price: 801.8, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '99% HPLC.' },
    { ingId: 'rosemary', provider: 'P2 Imagen', price: 26.8, moq: 1, spec: 'warn', status: 'negociando', compat: 'no', notes: 'Rosmarínico 10% ≠ carnósico CO2.' },
    { ingId: 'ginseng', provider: 'P2 Imagen', price: 85.7, moq: 1, spec: 'pending', status: 'negociando', compat: 'pending', notes: 'Ginsenosides 10%; validar solubilidad.' },
    { ingId: 'toco', provider: 'P2 Imagen', price: 28.6, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
    { ingId: 'mentha', provider: 'P2 Imagen', price: 17.9, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  ];

  const DEFAULT_HYBRID = {
    cct: 'p2', squalane: 'p1', grapeseed: 'p2', rice: 'p2', oleic: 'p1',
    saw: 'p1', iso: 'p1', baku: 'p1', rosemary: 'p1', ginseng: 'p2',
    toco: 'p2', mentha: 'p2',
  };

  const ING_FLAGS = {
    saw: { flag: 'spec', spec2: '40:1 DER' },
    rosemary: { flag: 'spec', spec2: 'Rosmarinic 10%' },
    ginseng: { flag: 'err-p1', spec1: 'Alcohol-soluble' },
    oleic: { flag: 'miss-p2' },
    iso: { flag: 'miss-p2' },
  };

  function defaultDb() {
    const now = new Date().toISOString();
    return {
      version: 1,
      meta: {
        formulaName: 'Aceite Capilar — Definitiva',
        updatedAt: now,
        createdAt: now,
      },
      formula: FORMULA_INGREDIENTS.map((i) => ({ ...i })),
      quotations: DEFAULT_QUOTATIONS.map((q, idx) => ({
        id: 'seed-' + (idx + 1),
        ...q,
        date: new Date().toLocaleDateString('es-CO'),
      })),
      settings: {
        copRate: 4200,
        density: 0.9,
        importMarkupPct: 40,
        supplierP1: 'P1 China',
        supplierP2: 'P2 Imagen',
      },
      hybrid: { ...DEFAULT_HYBRID },
      manualPrices: {},
    };
  }

  async function loadLegacyStorage() {
    try {
      if (!global.window?.storage?.get) return null;
      const r = await global.window.storage.get('quotation_entries');
      if (!r?.value) return null;
      const legacy = JSON.parse(r.value);
      if (!Array.isArray(legacy) || !legacy.length) return null;
      const db = defaultDb();
      db.quotations = legacy.map((q, idx) => ({
        id: q.id || 'legacy-' + idx,
        ingId: q.ingId || nameToId(q.ingName) || 'cct',
        provider: q.provider,
        price: q.price,
        moq: q.moq ?? 1,
        spec: q.spec || 'pending',
        status: q.status || 'cotizado',
        compat: q.compat || 'pending',
        notes: q.notes || '',
        date: q.date || new Date().toLocaleDateString('es-CO'),
      }));
      return db;
    } catch (_) {
      return null;
    }
  }

  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const db = defaultDb();
        seedIfEmpty(db);
        loadLegacyStorage().then((legacy) => {
          if (legacy) {
            saveDb(legacy);
            global.location?.reload?.();
          }
        });
        return db;
      }
      const db = JSON.parse(raw);
      return migrate(db);
    } catch (e) {
      console.warn('Eterno DB load error', e);
      return defaultDb();
    }
  }

  function seedIfEmpty(db) {
    saveDb(db);
    return db;
  }

  function migrate(db) {
    const base = defaultDb();
    if (!db || typeof db !== 'object') return base;
    db.version = db.version || 1;
    db.meta = db.meta || base.meta;
    db.formula = db.formula?.length ? db.formula : base.formula;
    db.settings = { ...base.settings, ...db.settings };
    db.hybrid = { ...base.hybrid, ...db.hybrid };
    db.manualPrices = db.manualPrices || {};

    if (!Array.isArray(db.quotations) || db.quotations.length === 0) {
      db.quotations = base.quotations;
    } else {
      db.quotations = db.quotations.map((q) => ({
        compat: q.compat || 'pending',
        spec: q.spec || 'pending',
        status: q.status || 'cotizado',
        moq: q.moq ?? 1,
        ...q,
        ingId: q.ingId || nameToId(q.ingName) || q.ingName,
      }));
    }
    db.purchaseOrders = Array.isArray(db.purchaseOrders) ? db.purchaseOrders : [];
    db.poDraft = db.poDraft || { batchKg: 10, lines: {} };

    // Migrate db.hybrid → db.picks if picks is absent or empty
    if (!db.picks || Object.keys(db.picks).length === 0) {
      db.picks = {};
      if (db.hybrid && typeof db.hybrid === 'object') {
        const p1Name = db.settings.supplierP1 || 'P1 China';
        const p2Name = db.settings.supplierP2 || 'P2 Imagen';
        Object.keys(db.hybrid).forEach((ingId) => {
          const bucket = db.hybrid[ingId];
          if (bucket === 'p1') db.picks[ingId] = p1Name;
          else if (bucket === 'p2') db.picks[ingId] = p2Name;
        });
      }
    }
    return db;
  }

  function nameToId(name) {
    const f = FORMULA_INGREDIENTS.find((i) => i.name === name);
    return f ? f.id : null;
  }

  function getIngredient(idOrName) {
    return (
      dbIngredientById(idOrName) ||
      FORMULA_INGREDIENTS.find((i) => i.name === idOrName)
    );
  }

  function dbIngredientById(id, db) {
    const d = db || loadDb();
    return d.formula.find((i) => i.id === id);
  }

  function saveDb(db) {
    db.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    try {
      if (global.window?.storage?.set) {
        global.window.storage.set(DB_KEY, JSON.stringify(db));
      }
    } catch (_) {}
    return db;
  }

  function sumPct(db) {
    return db.formula.reduce((s, i) => s + (Number(i.pct) || 0), 0);
  }

  function pctFactor(db) {
    const t = sumPct(db);
    return t > 0 ? 100 / t : 1;
  }

  function detectBucket(providerOrQuote) {
    if (providerOrQuote && typeof providerOrQuote === 'object') {
      if (providerOrQuote.bucket) return providerOrQuote.bucket;
      return detectBucket(providerOrQuote.provider);
    }
    const p = (providerOrQuote || '').toLowerCase();
    if (p.includes('p2') || p.includes('imagen')) return 'p2';
    if (p.includes('p1') || p.includes('china')) return 'p1';
    return 'local';
  }
  function providerBucket(provider) { return detectBucket(provider); }

  function getPricesFromQuotations(db) {
    const result = {};
    db.quotations
      .filter((q) => q.compat !== 'no')
      .forEach((q) => {
        if (!result[q.provider]) result[q.provider] = {};
        if (result[q.provider][q.ingId] == null || q.price < result[q.provider][q.ingId]) {
          result[q.provider][q.ingId] = q.price;
        }
      });
    return result;
  }

  function savePick(db, ingId, providerName) {
    if (!db.picks) db.picks = {};
    db.picks[ingId] = providerName;
    saveDb(db);
  }

  function exportJson(db, filename) {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || `eterno_database_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJsonFile(file, merge) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const incoming = migrate(JSON.parse(reader.result));
          let db = loadDb();
          if (merge) {
            const ids = new Set(db.quotations.map((q) => q.id));
            incoming.quotations.forEach((q) => {
              if (!ids.has(q.id)) db.quotations.push(q);
            });
            db.settings = { ...db.settings, ...incoming.settings };
            db.hybrid = { ...db.hybrid, ...incoming.hybrid };
            db.manualPrices = { ...db.manualPrices, ...incoming.manualPrices };
          } else {
            db = incoming;
          }
          saveDb(db);
          resolve(db);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function toast(msg, ms) {
    let el = document.getElementById('eterno-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'eterno-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms || 2500);
  }

  global.EternoStore = {
    DB_KEY,
    FORMULA_INGREDIENTS,
    DEFAULT_HYBRID,
    ING_FLAGS,
    loadDb,
    saveDb,
    defaultDb,
    sumPct,
    pctFactor,
    getIngredient,
    getPricesFromQuotations,
    savePick,
    detectBucket,
    providerBucket,
    exportJson,
    importJsonFile,
    toast,
    nameToId,
  };
})(typeof window !== 'undefined' ? window : globalThis);
