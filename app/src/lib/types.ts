export type IngCategory = 'carrier' | 'active' | 'eo' | 'ao';
export type SpecStatus = 'ok' | 'warn' | 'fail' | 'pending';
export type QuoteStatus = 'cotizado' | 'negociando' | 'aprobado' | 'descartado';
export type CompatStatus = 'yes' | 'no' | 'pending';
export type SupplierCode = 'p1' | 'p2';
export type HybridPick = SupplierCode;

export interface Ingredient {
  id: string;
  name: string;
  inci: string;
  pct: number;
  cat: IngCategory;
}

export interface Quotation {
  id: string;
  ingId: string;
  productId?: string;
  provider: string;
  price: number;
  moq: number;
  spec: SpecStatus;
  status: QuoteStatus;
  compat: CompatStatus;
  notes: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: SupplierCode;
  country?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  retailPriceUsd: number;
  density: number;
  formulaIngredientIds: string[];
  active: boolean;
}

export interface Settings {
  density: number;
  importMarkupPct: number;
  supplierP1: string;
  supplierP2: string;
  packCostUsd: number;
  varCostUsd: number;
}

export interface DbMeta {
  formulaName: string;
  updatedAt: string;
  createdAt: string;
}

export interface EternoDb {
  version: number;
  meta: DbMeta;
  formula: Ingredient[];
  quotations: Quotation[];
  suppliers: Supplier[];
  products: Product[];
  settings: Settings;
  hybrid: Record<string, HybridPick>;
  manualPrices: Record<string, { p1?: number; p2?: number }>;
}

export type View =
  | 'overview'
  | 'suppliers'
  | 'products'
  | 'quotations'
  | 'comparator'
  | 'settings';
