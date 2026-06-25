# Eterno — Sistema de Formulación Capilar

Base de datos de cotizaciones, análisis de costos y evaluación científica de fórmula cosmética capilar.

## 📁 Estructura del Proyecto

- **src/components/ui/** - Componentes UI reutilizables
- **src/lib/** - Lógica y utilidades
- **src/pages/** - Páginas HTML principales
- **data/** - Base de datos JSON
- **docs/** - Documentación científica

## 🚀 Cómo Empezar

### Con Node.js:
```.
npm install
npm run dev
```

### Sin Node.js:
Abre directamente: `src/pages/index.html`

## 📊 Módulos Principales

- **Inicio** → index.html
- **Cotizaciones** → quotation_tracker.html
- **Comparador de Costos** → supplier_cost_comparison_dashboard.html
- **Fórmula Final** → formula_final.html
- **Orden de Compra** → purchase-order.html

## 💾 Datos

La base de datos se guarda en localStorage del navegador.
Backup disponible en `data/eterno_database_2026-06-03.json`

