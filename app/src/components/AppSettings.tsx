import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/card';
import { Input } from '@ui/input';
import { Label } from '@ui/label';
import { Separator } from '@ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@ui/alert-dialog';
import type { EternoDb, Settings } from '@/lib/types';
import { DB_KEY } from '@/lib/db';

interface AppSettingsProps {
  db: EternoDb;
  updateSettings: (patch: Partial<Settings>) => void;
  exportJson: () => void;
  importJson: (file: File, merge: boolean) => Promise<void>;
  resetToSeed: () => void;
}

export function AppSettings({
  db,
  updateSettings,
  exportJson,
  importJson,
  resetToSeed,
}: AppSettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [merge, setMerge] = useState(true);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await importJson(file, merge);
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Parámetros globales y respaldo de datos
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proveedores (etiquetas)</CardTitle>
          <CardDescription>Nombres mostrados en comparador y cotizaciones</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Proveedor P1</Label>
            <Input
              value={db.settings.supplierP1}
              onChange={(e) => updateSettings({ supplierP1: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Proveedor P2</Label>
            <Input
              value={db.settings.supplierP2}
              onChange={(e) => updateSettings({ supplierP2: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importación por defecto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Recargo importación (%)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={db.settings.importMarkupPct}
              onChange={(e) => updateSettings({ importMarkupPct: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Densidad default (g/ml)</Label>
            <Input
              type="number"
              step={0.01}
              value={db.settings.density}
              onChange={(e) => updateSettings({ density: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Empaque USD / unidad</Label>
            <Input
              type="number"
              step={0.1}
              value={db.settings.packCostUsd}
              onChange={(e) => updateSettings({ packCostUsd: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Variables USD / unidad</Label>
            <Input
              type="number"
              step={0.1}
              value={db.settings.varCostUsd}
              onChange={(e) => updateSettings({ varCostUsd: Number(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
          <CardDescription>
            Clave localStorage: <code className="text-xs">{DB_KEY}</code> — compatible con HTML legacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}>
              <Download className="size-4" />
              Exportar JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              Importar JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} />
            Fusionar con datos actuales (desmarcar = reemplazar todo)
          </label>
          <Separator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="size-4" />
                Restaurar datos iniciales
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Restaurar seed?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se reemplazarán cotizaciones y ajustes con los valores iniciales P1/P2. Exporta
                  un respaldo antes si necesitas conservar cambios.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={resetToSeed}>Restaurar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-xs text-muted-foreground">
            Actualizado: {(db.meta.updatedAt ?? '').replace('T', ' ').slice(0, 19)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
