import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  defaultDb,
  exportJsonFile,
  importJsonFile,
  loadDb,
  saveDb,
  type EternoDb,
  type Product,
  type Quotation,
  type Settings,
  type Supplier,
} from '@/lib/db';

export function useStore() {
  const [db, setDb] = useState<EternoDb>(() => loadDb());

  const persist = useCallback((updater: (prev: EternoDb) => EternoDb) => {
    setDb((prev) => {
      const next = saveDb(updater(prev));
      return next;
    });
  }, []);

  const addQuotation = useCallback(
    (q: Omit<Quotation, 'id' | 'date'>) => {
      persist((prev) => ({
        ...prev,
        quotations: [
          ...prev.quotations,
          {
            ...q,
            id: `q-${Date.now()}`,
            date: new Date().toLocaleDateString('es-CO'),
          },
        ],
      }));
      toast.success('Cotización guardada');
    },
    [persist],
  );

  const updateQuotation = useCallback(
    (id: string, patch: Partial<Quotation>) => {
      persist((prev) => ({
        ...prev,
        quotations: prev.quotations.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      }));
    },
    [persist],
  );

  const deleteQuotation = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        quotations: prev.quotations.filter((q) => q.id !== id),
      }));
      toast.success('Cotización eliminada');
    },
    [persist],
  );

  const addSupplier = useCallback(
    (s: Omit<Supplier, 'id'>) => {
      persist((prev) => ({
        ...prev,
        suppliers: [...prev.suppliers, { ...s, id: `sup-${Date.now()}` }],
      }));
    },
    [persist],
  );

  const updateSupplier = useCallback(
    (id: string, patch: Partial<Supplier>) => {
      persist((prev) => ({
        ...prev,
        suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        settings:
          patch.name && prev.suppliers.find((s) => s.id === id)?.code === 'p1'
            ? { ...prev.settings, supplierP1: patch.name }
            : patch.name && prev.suppliers.find((s) => s.id === id)?.code === 'p2'
              ? { ...prev.settings, supplierP2: patch.name }
              : prev.settings,
      }));
    },
    [persist],
  );

  const deleteSupplier = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        suppliers: prev.suppliers.filter((s) => s.id !== id),
      }));
    },
    [persist],
  );

  const addProduct = useCallback(
    (p: Omit<Product, 'id'>) => {
      persist((prev) => ({
        ...prev,
        products: [...prev.products, { ...p, id: `prod-${Date.now()}` }],
      }));
    },
    [persist],
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      persist((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [persist],
  );

  const deleteProduct = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
    },
    [persist],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      persist((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
      toast.success('Ajustes guardados');
    },
    [persist],
  );

  const setHybrid = useCallback(
    (ingId: string, pick: 'p1' | 'p2') => {
      persist((prev) => ({
        ...prev,
        hybrid: { ...prev.hybrid, [ingId]: pick },
      }));
    },
    [persist],
  );

  const exportJson = useCallback(() => {
    exportJsonFile(loadDb());
    toast.success('Base exportada');
  }, []);

  const importJson = useCallback(async (file: File, merge: boolean) => {
    const next = await importJsonFile(file, merge);
    setDb(next);
    toast.success(merge ? 'Datos fusionados' : 'Base restaurada');
  }, []);

  const resetToSeed = useCallback(() => {
    const next = saveDb(defaultDb());
    setDb(next);
    toast.success('Datos iniciales restaurados');
  }, []);

  const reload = useCallback(() => setDb(loadDb()), []);

  return {
    db,
    addQuotation,
    updateQuotation,
    deleteQuotation,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSettings,
    setHybrid,
    exportJson,
    importJson,
    resetToSeed,
    reload,
  };
}
