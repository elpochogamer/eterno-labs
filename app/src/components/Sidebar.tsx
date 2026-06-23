import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Scale,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@ui/utils';
import type { View } from '@/lib/types';

export type { View };

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'quotations', label: 'Cotizaciones', icon: FileText },
  { id: 'comparator', label: 'Comparador', icon: Scale },
  { id: 'products', label: 'Producto', icon: Package },
  { id: 'suppliers', label: 'Proveedores', icon: Users },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

interface SidebarProps {
  view: View;
  onView: (v: View) => void;
}

export function Sidebar({ view, onView }: SidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-white">
      <div className="border-b border-border px-5 py-5">
        <div className="text-lg font-semibold tracking-tight text-[#1a5c30]">Eterno</div>
        <div className="text-xs text-muted-foreground">Aceite capilar · USD</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onView(id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              view === id
                ? 'bg-[#e8f5ec] text-[#1a5c30]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BarChart3 className="size-3.5" />
          Fórmula 100% oleosa
        </div>
      </div>
    </aside>
  );
}
