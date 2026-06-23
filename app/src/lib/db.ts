import type {
  EternoDb,
  HybridPick,
  Ingredient,
  Product,
  Quotation,
  Settings,
  Supplier,
  SupplierCode,
} from './types';

export const DB_KEY = 'eterno_database_v1';

export const FORMULA_INGREDIENTS: Ingredient[] = [
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

const DEFAULT_QUOTATIONS: Omit<Quotation, 'id' | 'date'>[] = [
  { ingId: 'baku', provider: 'P1 China', price: 650, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'Pureza >95%.' },
  { ingId: 'saw', provider: 'P1 China', price: 137, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'CO2 oil-soluble.' },
  { ingId: 'iso', provider: 'P1 China', price: 80, moq: 1, spec: 'pending', status: 'cotizado', compat: 'yes', notes: 'Confirmar fucoxantina.' },
  { ingId: 'rosemary', provider: 'P1 China', price: 90.9, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: 'Carnósico 20%.' },
  { ingId: 'squalane', provider: 'P1 China', price: 9, moq: 1, spec: 'pending', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'cct', provider: 'P1 China', price: 10, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'oleic', provider: 'P1 China', price: 14, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'grapeseed', provider: 'P1 China', price: 9.09, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'rice', provider: 'P1 China', price: 9.09, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'mentha', provider: 'P1 China', price: 37, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'ginseng', provider: 'P1 China', price: 155, moq: 1, spec: 'fail', status: 'descartado', compat: 'no', notes: 'Alcohol-soluble.' },
  { ingId: 'cct', provider: 'P2 Imagen', price: 6.3, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'squalane', provider: 'P2 Imagen', price: 63.6, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'grapeseed', provider: 'P2 Imagen', price: 6.3, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'rice', provider: 'P2 Imagen', price: 6.3, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'saw', provider: 'P2 Imagen', price: 10.7, moq: 1, spec: 'warn', status: 'negociando', compat: 'no', notes: '40:1 ≠ CO2.' },
  { ingId: 'baku', provider: 'P2 Imagen', price: 801.8, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'rosemary', provider: 'P2 Imagen', price: 26.8, moq: 1, spec: 'warn', status: 'negociando', compat: 'no', notes: '' },
  { ingId: 'ginseng', provider: 'P2 Imagen', price: 85.7, moq: 1, spec: 'pending', status: 'negociando', compat: 'pending', notes: '' },
  { ingId: 'toco', provider: 'P2 Imagen', price: 28.6, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
  { ingId: 'mentha', provider: 'P2 Imagen', price: 17.9, moq: 1, spec: 'ok', status: 'cotizado', compat: 'yes', notes: '' },
];

export const DEFAULT_HYBRID: Record<string, HybridPick> = {
  cct: 'p2', squalane: 'p1', grapeseed: 'p2', rice: 'p2', oleic: 'p1',
  saw: 'p1', iso: 'p1', baku: 'p1', rosemary: 'p1', ginseng: 'p2',
  toco: 'p2', mentha: 'p2',
};

export const ING_FLAGS: Record<string, { flag: string; spec1?: string; spec2?: string }> = {
  saw: { flag: 'spec', spec2: '40:1 DER' },
  rosemary: { flag: 'spec', spec2: 'Rosmarinic 10%' },
  ginseng: { flag: 'err-p1', spec1: 'Alcohol-soluble' },
  oleic: { flag: 'miss-p2' },
  iso: { flag: 'miss-p2' },
};

export function defaultDb(): EternoDb {
  const now = new Date().toISOString();
  const productId = 'prod-aceite-capilar';
  return {
    version: 1,
    meta: {
      formulaName: 'Aceite Capilar — Definitiva',
      updatedAt: now,
      createdAt: now,
    },
    formula: FORMULA_INGREDIENTS.map((i) => ({ ...i })),
    quotations: DEFAULT_QUOTATIONS.map((q, idx) => ({
      id: `seed-${idx + 1}`,
      ...q,
      productId,
      date: new Date().toLocaleDateString('es-CO'),
    })),
    suppliers: [
      { id: 'sup-p1', name: 'P1 China', code: 'p1', country: 'CN' },
      { id: 'sup-p2', name: 'P2 Imagen', code: 'p2', country: 'CO' },
    ],
    products: [
      {
        id: productId,
        name: 'Aceite Capilar Definitiva',
        sku: 'ETERNO-AC-100',
        retailPriceUsd: 28,
        density: 0.9,
        formulaIngredientIds: FORMULA_INGREDIENTS.map((i) => i.id),
        active: true,
      },
    ],
    settings: {
      density: 0.9,
      importMarkupPct: 25,
      supplierP1: 'P1 China',
      supplierP2: 'P2 Imagen',
      packCostUsd: 2.5,
      varCostUsd: 1,
    },
    hybrid: { ...DEFAULT_HYBRID },
    manualPrices: {},
  };
}

function migrate(raw: unknown): EternoDb {
  const base = defaultDb();
  if (!raw || typeof raw !== 'object') return base;
  const db = raw as Partial<EternoDb>;
  const merged: EternoDb = {
    ...base,
    ...db,
    meta: { ...base.meta, ...db.meta },
    settings: { ...base.settings, ...db.settings },
    hybrid: { ...base.hybrid, ...db.hybrid },
    formula: db.formula?.length ? db.formula : base.formula,
    suppliers: db.suppliers?.length ? db.suppliers : base.suppliers,
    products: db.products?.length ? db.products : base.products,
    manualPrices: db.manualPrices ?? {},
    quotations: (db.quotations ?? base.quotations).map((q) => ({
      ...q,
      compat: q.compat ?? 'pending',
      spec: q.spec ?? 'pending',
      status: q.status ?? 'cotizado',
      moq: q.moq ?? 1,
      notes: q.notes ?? '',
      ingId: q.ingId,
    })),
    version: db.version ?? 1,
  };
  return merged;
}

export function loadDb(): EternoDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const db = defaultDb();
      saveDb(db);
      return db;
    }
    return migrate(JSON.parse(raw));
  } catch {
    return defaultDb();
  }
}

export function saveDb(db: EternoDb): EternoDb {
  const next = { ...db, meta: { ...db.meta, updatedAt: new Date().toISOString() } };
  localStorage.setItem(DB_KEY, JSON.stringify(next));
  return next;
}

export function providerBucket(provider: string): SupplierCode | null {
  const p = provider.toLowerCase();
  if (p.includes('p2') || p.includes('imagen')) return 'p2';
  if (p.includes('p1') || p.includes('china')) return 'p1';
  return null;
}

export function sumPct(db: EternoDb): number {
  return db.formula.reduce((s, i) => s + (Number(i.pct) || 0), 0);
}

export function pctFactor(db: EternoDb): number {
  const t = sumPct(db);
  return t > 0 ? 100 / t : 1;
}

export function getPricesFromQuotations(db: EternoDb) {
  const p1: Record<string, number> = {};
  const p2: Record<string, number> = {};
  db.formula.forEach((ing) => {
    const qs = db.quotations.filter((q) => q.ingId === ing.id && q.compat !== 'no');
    const byP1 = qs.filter((q) => providerBucket(q.provider) === 'p1').sort((a, b) => a.price - b.price);
    const byP2 = qs.filter((q) => providerBucket(q.provider) === 'p2').sort((a, b) => a.price - b.price);
    if (byP1[0]) p1[ing.id] = byP1[0].price;
    if (byP2[0]) p2[ing.id] = byP2[0].price;
  });
  Object.entries(db.manualPrices).forEach(([id, m]) => {
    if (m.p1 != null) p1[id] = m.p1;
    if (m.p2 != null) p2[id] = m.p2;
  });
  return { p1, p2 };
}

export function exportJsonFile(db: EternoDb) {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `eterno_database_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importJsonFile(file: File, merge: boolean): Promise<EternoDb> {
  const text = await file.text();
  const incoming = migrate(JSON.parse(text));
  let db = loadDb();
  if (merge) {
    const ids = new Set(db.quotations.map((q) => q.id));
    incoming.quotations.forEach((q) => {
      if (!ids.has(q.id)) db.quotations.push(q);
    });
    db = {
      ...db,
      settings: { ...db.settings, ...incoming.settings },
      hybrid: { ...db.hybrid, ...incoming.hybrid },
      manualPrices: { ...db.manualPrices, ...incoming.manualPrices },
      suppliers: incoming.suppliers?.length ? incoming.suppliers : db.suppliers,
      products: incoming.products?.length ? incoming.products : db.products,
    };
  } else {
    db = incoming;
  }
  return saveDb(db);
}

export type { EternoDb, Quotation, Supplier, Product, Settings };
