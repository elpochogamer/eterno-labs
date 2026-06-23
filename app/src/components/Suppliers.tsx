import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
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
import type { EternoDb, Supplier, SupplierCode } from '@/lib/types';

interface SuppliersProps {
  db: EternoDb;
  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
}

const emptyForm = (): Omit<Supplier, 'id'> => ({
  name: '',
  code: 'p1',
  country: '',
  notes: '',
});

export function Suppliers({ db, addSupplier, updateSupplier, deleteSupplier }: SuppliersProps) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({ name: s.name, code: s.code, country: s.country ?? '', notes: s.notes ?? '' });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editId) updateSupplier(editId, form);
    else addSupplier(form);
    setOpen(false);
  };

  const quoteCount = (name: string) =>
    db.quotations.filter((q) => q.provider.toLowerCase().includes(name.toLowerCase().slice(0, 3))).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            P1 y P2 alimentan el comparador de costos
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Agregar
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>País</TableHead>
                <TableHead className="text-right">Cotizaciones</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.code === 'p1' ? 'default' : 'secondary'}>
                      {s.code.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.country || '—'}</TableCell>
                  <TableCell className="text-right">{quoteCount(s.name)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteSupplier(s.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="P1 China"
              />
            </div>
            <div className="grid gap-2">
              <Label>Código comparador</Label>
              <Select
                value={form.code}
                onValueChange={(v) => setForm({ ...form, code: v as SupplierCode })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p1">P1 — proveedor principal import</SelectItem>
                  <SelectItem value="p2">P2 — proveedor alternativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>País</Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
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
