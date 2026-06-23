import { ArrowRight, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { Badge } from '@ui/badge';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { computeTotals, fmtUsd } from '@/lib/calc';
import type { EternoDb, View } from '@/lib/types';
import { sumPct } from '@/lib/db';

interface OverviewProps {
  db: EternoDb;
  onNavigate: (v: View) => void;
}

export function Overview({ db, onNavigate }: OverviewProps) {
  const totals = computeTotals(db, db.settings.importMarkupPct);
  const pctSum = sumPct(db);
  const quoted = db.formula.filter((ing) =>
    db.quotations.some((q) => q.ingId === ing.id && q.compat !== 'no'),
  ).length;
  const incompatible = db.quotations.filter((q) => q.compat === 'no').length;
  const pending = db.quotations.filter((q) => q.spec === 'pending').length;
  const product = db.products.find((p) => p.active) ?? db.products[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{db.meta.formulaName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Panel de control · cotizaciones, comparador y unit economics en USD
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#2d8a4e]/20 bg-gradient-to-br from-[#e8f5ec] to-white">
          <CardHeader className="pb-2">
            <CardDescription>COGS híbrido (FOB)</CardDescription>
            <CardTitle className="text-3xl text-[#1a5c30]">{fmtUsd(totals.hybrid)} / kg</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-[#2d8a4e]">
              <TrendingDown className="size-4" />
              {fmtUsd(totals.saveVsP2)}/kg vs {db.settings.supplierP2}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{db.settings.supplierP1}</CardDescription>
            <CardTitle className="text-2xl">{fmtUsd(totals.p1)} / kg</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Escenario 100% P1 · FOB</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{db.settings.supplierP2}</CardDescription>
            <CardTitle className="text-2xl">{fmtUsd(totals.p2)} / kg</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Escenario 100% P2 · FOB</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>PVP referencia</CardDescription>
            <CardTitle className="text-2xl">{fmtUsd(product?.retailPriceUsd ?? 28)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">USD / 100 ml</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Estado de la fórmula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={Math.abs(pctSum - 100) < 0.01 ? 'default' : 'destructive'}>
                Suma %: {pctSum.toFixed(1)}%
              </Badge>
              <Badge variant="secondary">{quoted}/{db.formula.length} con cotización usable</Badge>
              {incompatible > 0 && (
                <Badge variant="outline" className="border-amber-300 text-amber-800">
                  {incompatible} incompatibles anhidros
                </Badge>
              )}
              {pending > 0 && (
                <Badge variant="outline">{pending} spec pendiente</Badge>
              )}
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Estrategia híbrida recomendada</p>
              <p className="mt-1 text-muted-foreground">
                Activos críticos y specs únicas en {db.settings.supplierP1} · carriers y AE commodity en{' '}
                {db.settings.supplierP2} cuando spec = OK.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => onNavigate('comparator')} className="justify-between">
              Abrir comparador
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => onNavigate('quotations')}>
              Ver cotizaciones
            </Button>
            <Button variant="outline" onClick={() => onNavigate('settings')}>
              Exportar / respaldar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertas técnicas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            { ok: false, title: 'Ginseng P1', text: 'Alcohol-soluble — no usar en base anhidra.' },
            { ok: false, title: 'Saw Palmetto P2', text: '40:1 ≠ CO₂ oil-soluble para claim DHT.' },
            { ok: false, title: 'Romero P2', text: 'Rosmarínico ≠ carnósico CO₂ en oleoso.' },
            { ok: true, title: 'Mix óptimo', text: `Ahorro estimado ${fmtUsd(totals.saveVsP2)}/kg FOB vs solo P2.` },
          ].map((a) => (
            <div key={a.title} className="flex gap-3 rounded-lg border p-3 text-sm">
              {a.ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2d8a4e]" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              )}
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-muted-foreground">{a.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
