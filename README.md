# Eterno Labs — Sistema de Formulación Capilar

App local vanilla (sin frameworks, sin build) para cotizaciones de proveedores, análisis de costos y orden de compra de una fórmula cosmética capilar de 13 ingredientes.

## 📁 Estructura del proyecto (plana, sin subcarpetas para la app)

- **eterno-store.js** — capa de persistencia (localStorage, clave `eterno_database_v1`, schema v3). Toda lectura/escritura de datos pasa por `window.EternoStore`.
- **eterno-ui.css** — design system compartido (variables, `.btn`, `.badge`, `.table`, `.banner`, `.modal`, `.toast`, tablas responsive).
- **eterno-nav.js** — inyecta el header común (logo, links, exportar/importar respaldo, indicador de estado del pedido) en las 5 páginas.
- **index.html / quotation_tracker.html / supplier_cost_comparison_dashboard.html / formula_final.html / purchase-order.html** — las 5 páginas de la app.
- **data/** — backups JSON de ejemplo.
- **docs/** — documentación científica de la fórmula.

## 🚀 Cómo empezar

No requiere Node ni build. Abre `index.html` directamente en el navegador.

## 📊 Módulos principales

- **Inicio** → index.html — estado del pedido, faltantes, costo del lote, últimas cotizaciones.
- **Cotizaciones** → quotation_tracker.html — filtros, orden por columna, alta/edición con lead time/vencimiento/COA.
- **Comparador de costos** → supplier_cost_comparison_dashboard.html — vista por ingrediente, matriz de proveedores, importación, riesgos.
- **Fórmula final** → formula_final.html — tabla data-driven con lote editable y costo en vivo.
- **Orden de compra** → purchase-order.html — picks → margen/MOQ → PO imprimible por proveedor.

## 💾 Datos y respaldo

Los datos viven solo en el `localStorage` de tu navegador. Usa el botón "Exportar respaldo" del header (presente en las 5 páginas) con frecuencia — la app te avisa si pasan más de 7 días sin exportar. "Importar respaldo" fusiona un JSON exportado (soporta backups de versiones anteriores, se migran automáticamente).

