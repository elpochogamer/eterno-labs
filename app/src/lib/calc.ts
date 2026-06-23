import type { EternoDb, HybridPick } from './types';
import { getPricesFromQuotations, ING_FLAGS, pctFactor } from './db';

export interface CostRow {
  ingId: string;
  name: string;
  pct: number;
  price1: number | null;
  price2: number | null;
  c1: number;
  c2: number;
  ch: number;
  pick: HybridPick;
  saveVsP2: number;
}

export interface CostTotals {
  p1: number;
  p2: number;
  hybrid: number;
  p1L: number;
  p2L: number;
  hybridL: number;
  saveVsP2: number;
  savePctP2: number;
}

export function fmtUsd(n: number, d = 2) {
  return `$${n.toFixed(d)}`;
}

export function computeRows(db: EternoDb): CostRow[] {
  const factor = pctFactor(db);
  const { p1, p2 } = getPricesFromQuotations(db);
  return db.formula.map((ing) => {
    const pct = (ing.pct / 100) * factor;
    const price1 = p1[ing.id] ?? null;
    const price2 = p2[ing.id] ?? null;
    const pick = db.hybrid[ing.id] ?? 'p1';
    const flags = ING_FLAGS[ing.id];
    const specOk = !flags || flags.flag === 'ok' || flags.flag === 'miss-p2';
    let hPrice: number | null = null;
    if (pick === 'p2' && price2 != null && specOk) hPrice = price2;
    else if (price1 != null) hPrice = price1;
    else hPrice = price2;
    const c1 = price1 != null ? pct * price1 : 0;
    const c2 = price2 != null ? pct * price2 : price1 != null ? pct * price1 : 0;
    const ch = hPrice != null ? pct * hPrice : 0;
    return {
      ingId: ing.id,
      name: ing.name,
      pct,
      price1,
      price2,
      c1,
      c2,
      ch,
      pick,
      saveVsP2: c2 - ch,
    };
  });
}

export function computeTotals(db: EternoDb, importPct: number): CostTotals {
  const rows = computeRows(db);
  const fob = {
    p1: rows.reduce((s, r) => s + r.c1, 0),
    p2: rows.reduce((s, r) => s + r.c2, 0),
    hybrid: rows.reduce((s, r) => s + r.ch, 0),
  };
  const lm = 1 + importPct / 100;
  return {
    ...fob,
    p1L: fob.p1 * lm,
    p2L: fob.p2 * lm,
    hybridL: fob.hybrid * lm,
    saveVsP2: fob.p2 - fob.hybrid,
    savePctP2: fob.p2 > 0 ? ((fob.p2 - fob.hybrid) / fob.p2) * 100 : 0,
  };
}

export function getBestQuote(db: EternoDb, ingId: string) {
  const approved = db.quotations.filter(
    (q) => q.ingId === ingId && q.status === 'aprobado' && q.compat !== 'no',
  );
  if (approved.length) return approved.sort((a, b) => a.price - b.price)[0];
  const any = db.quotations.filter((q) => q.ingId === ingId && q.compat !== 'no');
  if (any.length) return any.sort((a, b) => a.price - b.price)[0];
  const all = db.quotations.filter((q) => q.ingId === ingId);
  return all.length ? all.sort((a, b) => a.price - b.price)[0] : undefined;
}
