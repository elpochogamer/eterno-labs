import { useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Card, CardContent } from '@ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';
import { pctFactor } from '@/lib/db';
import type {
  CompatStatus,
  EternoDb,
  Quotation,
  QuoteStatus,
  SpecStatus,
} from '@/lib/types';

interface QuotationsProps {
  db: EternoDb;
  addQuotation: (q: Omit<Quotation, 'id' | 'date'>) => void;
  updateQuotation: (id: string, patch: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  initialProductId?: string;
}

type SortKey = 'budget' | 'pct' | 'cat' | 'name' | 'status';

const SPEC_BADGE: Record<SpecStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ok: { label: 'OK', variant: 'default' },
  warn: { label: 'Revisar', variant: 'outline' },
  fail: { label: 'Fail', variant: 'destructive' },
  pending: { label: 'Pend.', variant: 'secondary' },
};

const COMPAT_BADGE: Record<CompatStatus, string> = {
  yes: 'Sí',
  no: 'No',
  pending: '?',
};

const emptyForm = (productId?: string): Omit<Quotation, 'id' | 'date'> => ({
  ingId: 'cct',
  productId,
  provider: '',
  price: 0,
  moq: 1,
  spec: 'pending',
  status: 'cotizado',
  compat: 'pending',
  notes: '',
});

export function Quotations({
  db,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  initialProductId,
}: QuotationsProps) {
  const [sort, setSort] = useState<SortKey>('budget');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(initialProductId));
  const factor = pctFactor(db);

  useEffect(() => {
    if (initialProductId) {
      setForm(emptyForm(initialProductId));
      setEditId(null);
      setOpen(true);
    }
  }, [initialProductId]);

  const ingMap = useMemo(
    () => Object.fromEntries(db.formula.map((i) => [i.id, i])),
    [db.formula],
  );

  const sorted = useMemo(() => {
    const rows = [...db.quotations];
    const byIng = (q: Quotation) => ingMap[q.ingId];
    switch (sort) {
      case 'pct':
        return rows.sort((a, b) => (byIng(b)?.pct ?? 0) - (byIng(a)?.pct ?? 0));
      case 'cat':
        return rows.sort((a, b) => (byIng(a)?.cat ?? '').localeCompare(byIng(b)?.cat ?? ''));
      case 'name':
        return rows.sort((a, b) =>
          (byIng(a)?.name ?? '').localeCompare(byIng(b)?.name ?? ''),
        );
      case 'status':
        return rows.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return rows.sort((a, b) => a.price - b.price);
    }
  }, [db.quotations, sort, ingMap]);

  const minBudget = useMemo(() => {
    const map: Record<string, number> = {};
    db.formula.forEach((ing) => {
      const qs = db.quotations.filter((q) => q.ingId === ing.id && q.compat !== 'no');
      if (qs.length) map[ing.id] = Math.min(...qs.map((q) => q.price));
    });
    return map;
  }, [db]);

  const totalFormula = useMemo(() => {
    return db.formula.reduce((s, ing) => {
      const p = minBudget[ing.id];
      return p != null ? s + (ing.pct / 100) * factor * p : s;
    }, 0);
  }, [db.formula, minBudget, factor]);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm(initialProductId));
    setOpen(true);
  };

  const openEdit = (q: Quotation) => {
    setEditId(q.id);
    setForm({
      ingId: q.ingId,
      productId: q.productId,
      provider: q.provider,
      price: q.price,
      moq: q.moq,
      spec: q.spec,
      status: q.status,
      compat: q.compat,
      notes: q.notes,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.provider.trim() || form.price <= 0) return;
    if (editId) updateQuotation(editId, form);
    else addQuotation(form);
    setOpen(false);
  };

  const exportCsv = () => {
    const header = ['ingrediente', 'pct', 'proveedor', 'usd_kg', 'moq', 'spec', 'compat', 'estado', 'notas'];
    const lines = sorted.map((q) => {
      const ing = ingMap[q.ingId];
      return [
        ing?.name ?? q.ingId,
        ing?.pct ?? '',
        q.provider,
        q.price,
        q.moq,
        q.spec,
        q.compat,
        q.status,
        `"${q.notes.replace(/"/g, '""')}"`,
      ].join(',');
    });
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'eterno_cotizaciones.csv';
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cotizaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guardado automático · solo cotizaciones compatibles entran al COGS
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget">Precio ↑</SelectItem>
              <SelectItem value="pct">% fórmula ↓</SelectItem>
              <SelectItem value="cat">Categoría</SelectItem>
              <SelectItem value="name">Nombre A→Z</SelectItem>
              <SelectItem value="status">Estado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Cotización
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-2xl font-semibold">{db.quotations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Incompatibles</p>
            <p className="text-2xl font-semibold">
              {db.quotations.filter((q) => q.compat === 'no').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Presupuesto mín. teórico</p>
            <p className="text-2xl font-semibold">${totalFormula.toFixed(2)}/kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Última sync</p>
            <p className="text-sm font-medium">
              {(db.meta.updatedAt ?? '').replace('T', ' ').slice(0, 16)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">USD/kg</TableHead>
                <TableHead className="text-right">MOQ</TableHead>
                <TableHead className="text-right">$/kg fórmula</TableHead>
                <TableHead className="text-center">Spec</TableHead>
                <TableHead className="text-center">Anhidra</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((q) => {
                const ing = ingMap[q.ingId];
                const contrib =
                  ing && q.compat !== 'no'
                    ? ((ing.pct / 100) * factor * q.price).toFixed(2)
                    : '—';
                const spec = SPEC_BADGE[q.spec];
                return (
                  <TableRow key={q.id} className={q.compat === 'no' ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="font-medium">{ing?.name ?? q.ingId}</div>
                      {q.notes && (
                        <div className="text-xs text-muted-foreground">{q.notes}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{ing?.pct ?? '—'}%</TableCell>
                    <TableCell>{q.provider}</TableCell>
                    <TableCell className="text-right font-mono">${q.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{q.moq} kg</TableCell>
                    <TableCell className="text-right font-mono">{contrib}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={spec.variant}>{spec.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          q.compat === 'yes'
                            ? 'default'
                            : q.compat === 'no'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {COMPAT_BADGE[q.compat]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center capitalize">{q.status}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(q)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteQuotation(q.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar cotización' : 'Nueva cotización'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Ingrediente</Label>
              <Select value={form.ingId} onValueChange={(v) => setForm({ ...form, ingId: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {db.formula.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({i.pct}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Proveedor</Label>
              <Input
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="P1 China"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>USD/kg</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>MOQ (kg)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.moq}
                  onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Spec</Label>
                <Select
                  value={form.spec}
                  onValueChange={(v) => setForm({ ...form, spec: v as SpecStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="ok">Confirmada</SelectItem>
                    <SelectItem value="warn">Revisar</SelectItem>
                    <SelectItem value="fail">No cumple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as QuoteStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cotizado">Cotizado</SelectItem>
                    <SelectItem value="negociando">Negociando</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Compatibilidad anhidra</Label>
              <Select
                value={form.compat}
                onValueChange={(v) => setForm({ ...form, compat: v as CompatStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Compatible</SelectItem>
                  <SelectItem value="no">Incompatible</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notas</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
