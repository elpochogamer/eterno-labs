import { useState } from 'react';
import { Sidebar, type View } from './components/Sidebar';
import { Overview } from './components/Overview';
import { Suppliers } from './components/Suppliers';
import { Products } from './components/Products';
import { Quotations } from './components/Quotations';
import { Comparator } from './components/Comparator';
import { AppSettings } from './components/AppSettings';
import { useStore } from './components/store';

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [quoteProductId, setQuoteProductId] = useState<string | undefined>();
  const store = useStore();

  const handleAddQuote = (productId: string) => {
    setQuoteProductId(productId);
    setView('quotations');
  };

  const handleView = (v: View) => {
    if (v !== 'quotations') setQuoteProductId(undefined);
    setView(v);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8faf9]">
      <Sidebar view={view} onView={handleView} />
      <main className="flex-1 overflow-y-auto">
        {view === 'overview' && <Overview db={store.db} onNavigate={handleView} />}
        {view === 'suppliers' && (
          <Suppliers
            db={store.db}
            addSupplier={store.addSupplier}
            updateSupplier={store.updateSupplier}
            deleteSupplier={store.deleteSupplier}
          />
        )}
        {view === 'products' && (
          <Products
            db={store.db}
            updateProduct={store.updateProduct}
            onAddQuote={handleAddQuote}
          />
        )}
        {view === 'quotations' && (
          <Quotations
            db={store.db}
            addQuotation={store.addQuotation}
            updateQuotation={store.updateQuotation}
            deleteQuotation={store.deleteQuotation}
            initialProductId={quoteProductId}
          />
        )}
        {view === 'comparator' && (
          <Comparator db={store.db} setHybrid={store.setHybrid} reload={store.reload} />
        )}
        {view === 'settings' && (
          <AppSettings
            db={store.db}
            updateSettings={store.updateSettings}
            exportJson={store.exportJson}
            importJson={store.importJson}
            resetToSeed={store.resetToSeed}
          />
        )}
      </main>
    </div>
  );
}
