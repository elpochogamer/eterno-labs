import { useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@ui/alert';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Slider } from '@ui/slider';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';
import { computeRows, computeTotals, fmtUsd } from '@/lib/calc';
import { saveDb } from '@/lib/db';
import type { EternoDb, HybridPick } from '@/lib/types';

interface ComparatorProps {
  db: EternoDb;
  setHybrid: (ingId: string, pick: HybridPick) => void;
  reload: () => void;
}

const BATCH_SIZES = [100, 250, 500, 1000, 5000];

const ALERTS = [
  { type: 'err' as const, title: 'Ginseng P1 — alcohol-soluble', text: 'No usar en base anhidra.' },
  { type: 'warn' as const, title: 'Saw Palmetto P2 — spec distinta', text: '40:1 ≠ CO₂ oil-soluble.' },
  { type: 'warn' as const, title: 'Romero P2 — rosmarínico vs carnósico', text: 'Priorizar CO₂ carnósico P1.' },
  { type: 'warn' as const, title: 'Squalane P2 — premium de marketing', text: '7× precio vs P1 sin beneficio documentado.' },
  { type: 'info' as const, title: 'Datos incompletos P2', text: 'Isochrysis y ácido oleico: solo P1 cotizado.' },
  { type: 'ok' as const, title: 'Regla recomendada', text: 'Activos críticos P1 · carriers P2 cuando spec OK.' },
];

export function Comparator({ db, setHybrid, reload }: ComparatorProps) {
  const [batchMl, setBatchMl] = useState(100);
  const [importPct, setImportPct] = useState(db.settings.importMarkupPct);
  const [retail, setRetail] = useState(
    () => db.products.find((p) => p.active)?.retailPriceUsd ?? 28,
  );
  const [density, setDensity] = useState(
    () => db.products.find((p) => p.active)?.density ?? db.settings.density,
  );
  const [packCost, setPackCost] = useState(db.settings.packCostUsd);
  const [varCost, setVarCost] = useState(db.settings.varCostUsd);
  const [useLanded, setUseLanded] = useState(false);
  const [tab, setTab] = useState('matrix');

  const rows = useMemo(() => computeRows(db), [db]);
  const totals = useMemo(() => computeTotals(db, importPct), [db, importPct]);
  const p1n = db.settings.supplierP1;
  const p2n = db.settings.supplierP2;
  const maxContrib = Math.max(...rows.map((r) => r.ch), 0.01);

  const batchKg = (batchMl * density) / 1000;
  const batchData = [
    { name: p1n, value: totals.p1 * batchKg },
    { name: p2n, value: totals.p2 * batchKg },
    { name: 'Híbrido', value: totals.hybrid * batchKg },
  ];

  const drivers = [...rows]
    .sort((a, b) => b.ch - a.ch)
    .slice(0, 5)
    .map((r) => ({ name: r.name.split(' ').slice(0, 2).join(' '), value: r.ch * batchKg }));

  const cogs100ml = useLanded
    ? (totals.hybridL * density) / 10
    : (totals.hybrid * density) / 10;
  const margin = retail - cogs100ml - packCost - varCost;
  const marginPct = retail > 0 ? (margin / retail) * 100 : 0;

  const saveStrategy = () => {
    saveDb({
      ...db,
      settings: {
        ...db.settings,
        importMarkupPct: importPct,
        density,
        packCostUsd: packCost,
        varCostUsd: varCost,
      },
    });
    reload();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Comparador · Unit economics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Matriz FOB · landed en pestaña Importación
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reload}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button onClick={saveStrategy}>
            <Save className="size-4" />
            Guardar estrategia
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="border-[#2d8a4e]/30 bg-gradient-to-br from-[#e8f5ec] to-white lg:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>COGS híbrido · FOB</CardDescription>
            <CardTitle className="text-4xl text-[#1a5c30]">
              {fmtUsd(totals.hybrid)} <span className="text-lg font-normal">/ kg</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#2d8a4e]">
              Ahorro {fmtUsd(totals.saveVsP2)}/kg vs {p2n} (−{totals.savePctP2.toFixed(0)}%)
            </p>
            <button
              type="button"
              className="mt-2 text-sm text-muted-foreground underline"
              onClick={() => setTab('import')}
            >
              Ver costo con importación →
            </button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{p1n}</CardDescription>
            <CardTitle>{fmtUsd(totals.p1)} / kg</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">FOB fórmula</CardContent>
        </Card>
        <Card className="border-[#2d8a4e]/20">
          <CardHeader className="pb-2">
            <Badge className="mb-2 w-fit">Óptimo</Badge>
            <CardDescription>{p2n}</CardDescription>
            <CardTitle>{fmtUsd(totals.p2)} / kg</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Referencia vs híbrido</CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-6 rounded-lg border bg-white p-4">
        <div className="grid gap-2">
          <Label className="text-xs">PVP referencia (USD / 100 ml)</Label>
          <Input
            type="number"
            className="w-24"
            min={1}
            step={0.5}
            value={retail}
            onChange={(e) => setRetail(Number(e.target.value))}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Densidad (g/ml)</Label>
          <Input
            type="number"
            className="w-20"
            min={0.8}
            max={1}
            step={0.01}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="matrix">Matriz</TabsTrigger>
          <TabsTrigger value="batch">Lotes</TabsTrigger>
          <TabsTrigger value="mix">Mix compra</TabsTrigger>
          <TabsTrigger value="margin">Margen</TabsTrigger>
          <TabsTrigger value="import">Importación</TabsTrigger>
          <TabsTrigger value="risks">Riesgos</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">{p1n} $/kg</TableHead>
                    <TableHead className="text-right">{p2n} $/kg</TableHead>
                    <TableHead className="text-right">Contrib. P1</TableHead>
                    <TableHead className="text-right">Contrib. P2</TableHead>
                    <TableHead className="text-right">Δ vs P2</TableHead>
                    <TableHead className="text-right">Híbrido</TableHead>
                    <TableHead className="text-center">Pick</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.ingId}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="mt-1 h-1.5 w-full max-w-[140px] rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#2d8a4e]"
                            style={{ width: `${Math.round((r.ch / maxContrib) * 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{(r.pct * 100).toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-mono">
                        {r.price1 != null ? r.price1.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.price2 != null ? r.price2.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">{r.c1.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{r.c2.toFixed(2)}</TableCell>
                      <TableCell
                        className={`text-right font-mono ${r.saveVsP2 > 0 ? 'text-[#2d8a4e]' : ''}`}
                      >
                        {r.saveVsP2 > 0 ? '+' : ''}
                        {r.saveVsP2.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-[#1a5c30]">
                        {r.ch.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.pick === 'p1' ? 'default' : 'secondary'}>
                          {r.pick.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={4}>TOTAL COGS (USD/kg)</TableCell>
                    <TableCell className="text-right">{totals.p1.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{totals.p2.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-[#2d8a4e]">
                      +{totals.saveVsP2.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-[#1a5c30]">
                      {totals.hybrid.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Última sync: {(db.meta.updatedAt ?? '').replace('T', ' ').slice(0, 16)}
          </p>
        </TabsContent>

        <TabsContent value="batch" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {BATCH_SIZES.map((ml) => (
              <Button
                key={ml}
                size="sm"
                variant={batchMl === ml ? 'default' : 'outline'}
                onClick={() => setBatchMl(ml)}
              >
                {ml} ml
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Lote {batchMl} ml</p>
                <p className="text-xl font-semibold">{batchKg.toFixed(3)} kg</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">COGS híbrido lote</p>
                <p className="text-xl font-semibold">{fmtUsd(totals.hybrid * batchKg)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Ahorro vs P2</p>
                <p className="text-xl font-semibold text-[#2d8a4e]">
                  {fmtUsd((totals.p2 - totals.hybrid) * batchKg)}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">COGS por escenario (USD)</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmtUsd(v)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {batchData.map((_, i) => (
                        <Cell key={i} fill={i === 2 ? '#2d8a4e' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 5 drivers (híbrido)</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={drivers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => fmtUsd(v)} />
                    <Bar dataKey="value" fill="#2d8a4e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mix" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lista de compra — híbrido</CardTitle>
                <CardDescription>Lote referencia 100 kg bulk</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {rows.map((r) => {
                    const kg = r.pct * 100;
                    const price = r.pick === 'p1' ? r.price1 : r.price2;
                    return (
                      <li key={r.ingId} className="flex justify-between border-b pb-2">
                        <span>
                          <Badge variant="outline" className="mr-2">
                            {r.pick.toUpperCase()}
                          </Badge>
                          {r.name}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {kg.toFixed(2)} kg · {price != null ? fmtUsd(price) : '—'}/kg
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-sm font-medium">
                  Total MP ~ {fmtUsd(totals.hybrid * 100)} (100 kg fórmula)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurar mix</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead className="text-right">P1</TableHead>
                      <TableHead className="text-right">P2</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Ahorro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.ingId}>
                        <TableCell className="text-sm">{r.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {r.price1?.toFixed(2) ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {r.price2?.toFixed(2) ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={r.pick}
                            onValueChange={(v) => setHybrid(r.ingId, v as HybridPick)}
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="p1">P1</SelectItem>
                              <SelectItem value="p2">P2</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-[#2d8a4e]">
                          {r.saveVsP2 > 0 ? `+${r.saveVsP2.toFixed(2)}` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="margin" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulador margen bruto (MP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Precio venta USD / 100 ml</Label>
                  <Input
                    type="number"
                    value={retail}
                    onChange={(e) => setRetail(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Empaque + etiqueta USD</Label>
                  <Input
                    type="number"
                    value={packCost}
                    onChange={(e) => setPackCost(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Otros variables USD</Label>
                  <Input
                    type="number"
                    value={varCost}
                    onChange={(e) => setVarCost(Number(e.target.value))}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useLanded}
                  onChange={(e) => setUseLanded(e.target.checked)}
                />
                Usar costo landed (importación {importPct}%)
              </label>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">COGS MP / 100 ml</p>
                  <p className="text-xl font-semibold">{fmtUsd(cogs100ml)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Costos totales</p>
                  <p className="text-xl font-semibold">
                    {fmtUsd(cogs100ml + packCost + varCost)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Margen bruto</p>
                  <p className="text-xl font-semibold text-[#1a5c30]">{fmtUsd(margin)}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Margen %</p>
                  <p className="text-xl font-semibold">{marginPct.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Costo puesto en destino (landed)</CardTitle>
              <CardDescription>
                Cotizaciones FOB + recargo único por logística, seguro y arancel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Label className="min-w-36 shrink-0 text-sm">Recargo importación</Label>
                <Slider
                  className="flex-1"
                  min={0}
                  max={60}
                  step={5}
                  value={[importPct]}
                  onValueChange={([v]) => setImportPct(v)}
                />
                <span className="w-12 text-right text-lg font-semibold">{importPct}%</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">P1 landed</p>
                  <p className="text-xl font-semibold">{fmtUsd(totals.p1L)}/kg</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">P2 landed</p>
                  <p className="text-xl font-semibold">{fmtUsd(totals.p2L)}/kg</p>
                </div>
                <div className="rounded-lg bg-[#e8f5ec] p-4">
                  <p className="text-xs text-muted-foreground">Híbrido landed</p>
                  <p className="text-xl font-semibold text-[#1a5c30]">
                    {fmtUsd(totals.hybridL)}/kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FOB vs Landed</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escenario</TableHead>
                    <TableHead className="text-right">FOB / kg</TableHead>
                    <TableHead className="text-right">Landed / kg</TableHead>
                    <TableHead className="text-right">Extra import</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: p1n, fob: totals.p1, landed: totals.p1L },
                    { label: p2n, fob: totals.p2, landed: totals.p2L },
                    { label: 'Híbrido', fob: totals.hybrid, landed: totals.hybridL },
                  ].map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right font-mono">{row.fob.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{row.landed.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        +{(row.landed - row.fob).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {ALERTS.map((a) => (
              <Alert
                key={a.title}
                variant={a.type === 'err' ? 'destructive' : 'default'}
                className={
                  a.type === 'warn'
                    ? 'border-amber-200 bg-amber-50'
                    : a.type === 'ok'
                      ? 'border-[#2d8a4e]/30 bg-[#e8f5ec]'
                      : ''
                }
              >
                <AlertTitle>{a.title}</AlertTitle>
                <AlertDescription>{a.text}</AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
