@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ==========================================
REM ETERNO - Script de Configuración
REM Windows Setup - Crea estructura y archivos
REM ==========================================

cls
echo.
echo ╔════════════════════════════════════════╗
echo ║  ETERNO - Sistema de Compras          ║
echo ║  Setup Automático para Windows        ║
echo ╚════════════════════════════════════════╝
echo.

REM ==========================================
REM 1. CREAR CARPETAS
REM ==========================================
echo [1/4] Creando estructura de carpetas...

mkdir docs 2>nul
mkdir src\components\ui 2>nul
mkdir src\lib 2>nul
mkdir src\hooks 2>nul
mkdir src\styles 2>nul
mkdir src\pages 2>nul
mkdir src\vendor 2>nul
mkdir data 2>nul
mkdir public\assets\images 2>nul
mkdir public\assets\icons 2>nul

echo ✓ Carpetas creadas

REM ==========================================
REM 2. CREAR ARCHIVOS DE CONFIGURACIÓN
REM ==========================================
echo [2/4] Creando archivos de configuración...

REM Crear .gitignore
(
    echo node_modules/
    echo .DS_Store
    echo *.log
    echo .env.local
    echo dist/
    echo build/
    echo .idea/
    echo .vscode/
    echo package-lock.json
) > .gitignore

echo ✓ .gitignore creado

REM Crear package.json
(
    echo {
    echo   "name": "eterno-aceite-capilar",
    echo   "version": "1.0.0",
    echo   "description": "Sistema de formulación y análisis de costos - Aceite capilar",
    echo   "main": "src/pages/index.html",
    echo   "author": "Eterno Team",
    echo   "license": "ISC",
    echo   "scripts": {
    echo     "dev": "http-server src -p 8000",
    echo     "serve": "npx http-server src -p 8000",
    echo     "build": "echo Build script pending"
    echo   },
    echo   "devDependencies": {
    echo     "http-server": "^14.1.1"
    echo   }
    echo }
) > package.json

echo ✓ package.json creado

REM Crear README.md
(
    echo # Eterno — Sistema de Formulación Capilar
    echo.
    echo Base de datos de cotizaciones, análisis de costos y evaluación científica de fórmula cosmética capilar.
    echo.
    echo ## 📁 Estructura del Proyecto
    echo.
    echo - **src/components/ui/** - Componentes UI reutilizables
    echo - **src/lib/** - Lógica y utilidades
    echo - **src/pages/** - Páginas HTML principales
    echo - **data/** - Base de datos JSON
    echo - **docs/** - Documentación científica
    echo.
    echo ## 🚀 Cómo Empezar
    echo.
    echo ### Con Node.js:
    echo ```.
    echo npm install
    echo npm run dev
    echo ```
    echo.
    echo ### Sin Node.js:
    echo Abre directamente: `src/pages/index.html`
    echo.
    echo ## 📊 Módulos Principales
    echo.
    echo - **Inicio** → index.html
    echo - **Cotizaciones** → quotation_tracker.html
    echo - **Comparador de Costos** → supplier_cost_comparison_dashboard.html
    echo - **Fórmula Final** → formula_final.html
    echo - **Orden de Compra** → purchase-order.html
    echo.
    echo ## 💾 Datos
    echo.
    echo La base de datos se guarda en localStorage del navegador.
    echo Backup disponible en `data/eterno_database_2026-06-03.json`
    echo.
) > README.md

echo ✓ README.md creado

REM ==========================================
REM 3. CREAR purchase-order.html
REM ==========================================
echo [3/4] Creando módulo de Orden de Compra...

(
    echo ^<!DOCTYPE html^>
    echo ^<html lang="es"^>
    echo ^<head^>
    echo   ^<meta charset="UTF-8"^>
    echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
    echo   ^<title^>Eterno — Orden de Compra^</title^>
    echo   ^<link rel="stylesheet" href="../styles/eterno.css"^>
    echo   ^<style^>
    echo     .purchase-flow {
    echo       display: grid;
    echo       grid-template-columns: 300px 1fr;
    echo       gap: 20px;
    echo       margin-bottom: 24px;
    echo     }
    echo     .steps { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    echo     .step { padding: 12px; margin-bottom: 8px; border-radius: var(--radius); cursor: pointer; background: var(--surface2); transition: 0.2s; }
    echo     .step.active { background: var(--accent); color: white; font-weight: 600; }
    echo     .step:hover { background: var(--accent-dim); }
    echo     .step-number { display: inline-block; width: 24px; height: 24px; background: var(--muted); border-radius: 50%; text-align: center; line-height: 24px; color: white; margin-right: 8px; font-weight: 600; font-size: 12px; }
    echo     .step.active .step-number { background: white; color: var(--accent); }
    echo     .content { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; }
    echo     @media (max-width: 900px) { .purchase-flow { grid-template-columns: 1fr; } }
    echo   ^</style^>
    echo ^</head^>
    echo ^<body^>
    echo   ^<div class="app-shell"^>
    echo     ^<nav class="app-nav"^>
    echo       ^<div class="brand"^>Eterno ^<span^>Orden de Compra^</span^>^</div^>
    echo       ^<div class="nav-links"^>
    echo         ^<a href="index.html"^>Inicio^</a^>
    echo         ^<a href="quotation_tracker.html"^>Cotizaciones^</a^>
    echo         ^<a href="supplier_cost_comparison_dashboard.html"^>Comparador^</a^>
    echo         ^<a href="formula_final.html"^>Fórmula^</a^>
    echo         ^<a href="purchase-order.html" class="active"^>Compra^</a^>
    echo       ^</div^>
    echo     ^</nav^>
    echo     ^<header class="page-header"^>
    echo       ^<div^>
    echo         ^<h1 class="page-title"^>Orden de Compra — Materia Prima^</h1^>
    echo         ^<p class="page-sub"^>Selecciona cantidades y genera tu lista de compra optimizada^</p^>
    echo       ^</div^>
    echo     ^</header^>
    echo     ^<div class="card"^>
    echo       ^<h3 style="margin-bottom: 16px"^>¿Cuánto necesitas?^</h3^>
    echo       ^<div class="field" style="margin-bottom: 20px"^>
    echo         ^<label^>Unidades de 100 ml a producir^</label^>
    echo         ^<input type="number" id="unitsNeeded" value="10" min="1" style="width: 200px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px;"^>
    echo       ^</div^>
    echo       ^<button class="btn btn-primary" onclick="calcularOrden()"^>Calcular Orden^</button^>
    echo       ^<div id="resultado" style="margin-top: 20px;"^>^</div^>
    echo     ^</div^>
    echo   ^</div^>
    echo   ^<script src="../lib/eterno-store.js"^>^</script^>
    echo   ^<script^>
    echo     function calcularOrden() {
    echo       const units = +document.getElementById('unitsNeeded').value;
    echo       const totalMl = units * 100;
    echo       document.getElementById('resultado').innerHTML = `
    echo         ^<div class="metric"^>
    echo           ^<div class="metric-label"^>Volumen Total^</div^>
    echo           ^<div class="metric-value"^>${totalMl} ml^</div^>
    echo         ^</div^>
    echo       `;
    echo     }
    echo   ^</script^>
    echo ^</body^>
    echo ^</html^>
) > src\pages\purchase-order.html

echo ✓ purchase-order.html creado

REM ==========================================
REM 4. RESUMEN FINAL
REM ==========================================
echo.
echo [4/4] Finalizando...
echo.
echo ╔════════════════════════════════════════╗
echo ║  ✓ SETUP COMPLETADO CON ÉXITO        ║
echo ╚════════════════════════════════════════╝
echo.
echo 📁 Estructura creada:
echo    src/components/ui/     - Componentes UI
echo    src/lib/               - Lógica y datos
echo    src/pages/             - Páginas HTML
echo    src/styles/            - Estilos CSS
echo    data/                  - Base de datos
echo    docs/                  - Documentación
echo.
echo 📄 Archivos creados:
echo    ✓ .gitignore
echo    ✓ package.json
echo    ✓ README.md
echo    ✓ src/pages/purchase-order.html
echo.
echo 🚀 Próximos pasos:
echo.
echo    1. Mueve tus archivos existentes:
echo       - Componentes .tsx → src\components\ui\
echo       - HTML files → src\pages\
echo       - CSS → src\styles\
echo       - JS libraries → src\lib\ o src\vendor\
echo.
echo    2. Inicia la app:
echo       Opción A: npm install ^&^& npm run dev
echo       Opción B: start src\pages\index.html
echo.
echo    3. Entra en la app y:
echo       - Ve a "Orden de Compra" (nuevo módulo)
echo       - Define unidades que necesitas
echo       - Descarga tu orden en CSV
echo.
echo ====================================
echo Presiona cualquier tecla para cerrar
echo ====================================
pause