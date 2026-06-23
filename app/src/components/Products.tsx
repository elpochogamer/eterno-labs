import { FilePlus2 } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';
import { computeTotals, fmtUsd } from '@/lib/calc';
import type { EternoDb, Product } from '@/lib/types';

interface ProductsProps {
  db: EternoDb;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  onAddQuote: (productId: string) => void;
}

const CAT_LABEL: Record<string, string> = {
  carrier: 'Carrier',
  active: 'Activo',
  eo: 'AE',
  ao: 'Antioxidante',
};

export function Products({ db, updateProduct, onAddQuote }: ProductsProps) {
  const product = db.products.find((p) => p.active) ?? db.products[0];
  const totals = computeTotals(db, db.settings.importMarkupPct);
  const density = product?.density ?? db.settings.density;
  const cogs100ml = (totals.hybrid * density) / 10;

  if (!product) {
    return (
      <div className="p-6 text-muted-foreground">No hay producto configurado.</div>
    );
  }

  const ingredients = db.formula.filter((i) => product.formulaIngredientIds.includes(i.id));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Producto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            SKU {product.sku} · fórmula vinculada al comparador
          </p>
        </div>
        <Button onClick={() => onAddQuote(product.id)}>
          <FilePlus2 className="size-4" />
          Nueva cotización
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>COGS MP (híbrido FOB)</CardDescription>
            <CardTitle>{fmtUsd(cogs100ml)} / 100 ml</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PVP referencia</CardDescription>
            <CardTitle>{fmtUsd(product.retailPriceUsd)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Densidad</CardDescription>
            <CardTitle>{product.density} g/ml</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros comerciales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>PVP USD / 100 ml</Label>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={product.retailPriceUsd}
              onChange={(e) =>
                updateProduct(product.id, { retailPriceUsd: Number(e.target.value) })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Densidad (g/ml)</Label>
            <Input
              type="number"
              min={0.8}
              max={1}
              step={0.01}
              value={product.density}
              onChange={(e) =>
                updateProduct(product.id, { density: Number(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composición INCI</CardTitle>
          <CardDescription>{ingredients.length} ingredientes · {db.meta.formulaName}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>INCI</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Categoría</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ing.inci}</TableCell>
                  <TableCell className="text-right">{ing.pct}%</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CAT_LABEL[ing.cat] ?? ing.cat}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
