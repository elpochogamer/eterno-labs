/**
 * Eterno — capa de persistencia local (localStorage) v3
 * Fórmula 13 ingredientes · FX 3650 COP/USD · moneda normalizada
 * Directorio de proveedores, vencimientos, lead time, COA, respaldo.
 */
(function (global) {
  'use strict';
  const DB_KEY         = 'eterno_database_v1';
  const SCHEMA         = 6;
  const DEFAULT_BATCH_G = 445;
  const DEFAULT_FX_RATE = 3650;
  const CURRENCIES      = ['COP', 'USD'];
  const UNITS           = ['g', 'kg', 'ml', 'l', 'unidad'];
  const BACKUP_REMINDER_DAYS = 7;

  // ── Fórmula definitiva 13 ingredientes — lote base 445 g ────────────────
  const FORMULA_INGREDIENTS = [
    { id:'cct',      phase:'A', name:'CCT (Triglicérido Caprílico/Cáprico)', inci:'Caprylic/Capric Triglyceride',        pct:36.20, cat:'carrier' },
    { id:'hemisq',   phase:'A', name:'Hemisqualane',                          inci:'Hemisqualane',                         pct:24.90, cat:'carrier' },
    { id:'squalane', phase:'A', name:'Squalane (Oliva)',                      inci:'Squalane',                             pct: 8.00, cat:'carrier' },
    { id:'grapeseed',phase:'A', name:'Vitis Vinifera (Semilla de Uva)',       inci:'Vitis Vinifera Seed Oil',              pct:13.00, cat:'carrier' },
    { id:'rice',     phase:'B', name:'Oryza Sativa (Salvado de Arroz)',       inci:'Oryza Sativa Bran Oil',               pct:10.00, cat:'carrier' },
    { id:'saw',      phase:'C', name:'Serenoa CO₂ (Saw Palmetto)',       inci:'Serenoa Serrulata Fruit Extract',     pct: 2.00, cat:'active'  },
    { id:'iso',      phase:'C', name:'Isochrysis CO₂',                   inci:'Isochrysis Galbana Extract',          pct: 2.00, cat:'active'  },
    { id:'ginseng',  phase:'D', name:'Panax Ginseng CO₂',               inci:'Panax Ginseng Root Extract',          pct: 2.00, cat:'active'  },
    { id:'rosemary', phase:'D', name:'Rosmarinus CO₂',                   inci:'Rosmarinus Officinalis Leaf Extract', pct: 0.80, cat:'active'  },
    { id:'melatonin',phase:'E', name:'Melatonin',                             inci:'Melatonin',                            pct: 0.10, cat:'active'  },
    { id:'toco',     phase:'F', name:'Tocopherol d-α',                   inci:'Tocopherol',                           pct: 0.64, cat:'ao'      },
    { id:'ascpal',   phase:'F', name:'Ascorbyl Palmitate',                    inci:'Ascorbyl Palmitate',                   pct: 0.16, cat:'ao'      },
    { id:'mentha',   phase:'G', name:'Mentha Piperita AE',                    inci:'Mentha Piperita Oil',                  pct: 0.20, cat:'eo'      },
  ];
  // Total = 100.00 %

  const OBSOLETE_IDS = new Set(['oleic', 'baku']);

  // Picks por defecto para la nueva fórmula
  const DEFAULT_PICKS = {
    cct:'P1 China', hemisq:null, squalane:'P1 China', grapeseed:'P2 Imagen',
    rice:'P2 Imagen', saw:'P1 China', iso:'P1 China', ginseng:'Laboratorios Phitother S.A.S',
    rosemary:'P1 China', melatonin:null, toco:'P2 Imagen', ascpal:null, mentha:'P2 Imagen',
  };

  // ── Cotizaciones seed — precio siempre en USD; COP normalizado en migrate() ─
  const DEFAULT_QUOTATIONS = [
    // P1 China
    { id:'seed-2',  ingId:'saw',      provider:'P1 China', price:137,   currency:'USD', moq:1,   spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'Oil-soluble CO₂.' },
    { id:'seed-3',  ingId:'iso',      provider:'P1 China', price:80,    currency:'USD', moq:1,   spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'Confirmar % fucoxantina.' },
    { id:'seed-4',  ingId:'rosemary', provider:'P1 China', price:90.9,  currency:'USD', moq:1,   spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'Carnósico 20%.' },
    { id:'seed-5',  ingId:'squalane', provider:'P1 China', price:9,     currency:'USD', moq:1,   spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'' },
    { id:'seed-6',  ingId:'cct',      provider:'P1 China', price:10,    currency:'USD', moq:1,   spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'' },
    { id:'seed-8',  ingId:'grapeseed',provider:'P1 China', price:9.09,  currency:'USD', moq:1,   spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'' },
    { id:'seed-9',  ingId:'rice',     provider:'P1 China', price:9.09,  currency:'USD', moq:1,   spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'' },
    { id:'seed-10', ingId:'mentha',   provider:'P1 China', price:37,    currency:'USD', moq:1,   spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'FOB', notes:'' },
    { id:'seed-11', ingId:'ginseng',  provider:'P1 China', price:155,   currency:'USD', moq:1,   spec:'fail',    status:'descartado',compat:'no',      incoterm:'FOB', notes:'Alcohol-soluble — incompatible anhidro.' },
    { id:'seed-1',  ingId:'baku',     provider:'P1 China', price:650,   currency:'USD', moq:1,   spec:'ok',      status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'FOB', notes:'Pureza >95%. [ELIMINADO]' },
    { id:'seed-7',  ingId:'oleic',    provider:'P1 China', price:14,    currency:'USD', moq:1,   spec:'ok',      status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'FOB', notes:'[ELIMINADO]' },
    // P2 Imagen
    { id:'seed-12', ingId:'cct',      provider:'P2 Imagen', price:6.3,   currency:'USD', moq:1,  spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'seed-13', ingId:'squalane', provider:'P2 Imagen', price:63.6,  currency:'USD', moq:1,  spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'Precio alto vs P1.' },
    { id:'seed-14', ingId:'grapeseed',provider:'P2 Imagen', price:6.3,   currency:'USD', moq:1,  spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'seed-15', ingId:'rice',     provider:'P2 Imagen', price:6.3,   currency:'USD', moq:1,  spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'seed-16', ingId:'saw',      provider:'P2 Imagen', price:10.7,  currency:'USD', moq:1,  spec:'warn',    status:'negociando',compat:'no',      incoterm:'EXW', notes:'40:1 DER ≠ CO₂ oil-soluble.' },
    { id:'seed-18', ingId:'rosemary', provider:'P2 Imagen', price:26.8,  currency:'USD', moq:1,  spec:'warn',    status:'negociando',compat:'no',      incoterm:'EXW', notes:'Rosmarínico 10% ≠ carnósico CO₂.' },
    { id:'seed-19', ingId:'ginseng',  provider:'P2 Imagen', price:85.7,  currency:'USD', moq:1,  spec:'pending', status:'negociando',compat:'pending', incoterm:'EXW', notes:'Ginsenosides 10%; validar solubilidad.' },
    { id:'seed-20', ingId:'toco',     provider:'P2 Imagen', price:28.6,  currency:'USD', moq:1,  spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'seed-21', ingId:'mentha',   provider:'P2 Imagen', price:17.9,  currency:'USD', moq:1,  spec:'ok',      status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'seed-17', ingId:'baku',     provider:'P2 Imagen', price:801.8, currency:'USD', moq:1,  spec:'ok',      status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'EXW', notes:'99% HPLC. [ELIMINADO]' },
    // Be Organic
    { id:'seed-bo1', ingId:'grapeseed',provider:'Be Organic', price:158000, currency:'COP', moq:1,  spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Aceite Uva. Con IVA. 1 L.' },
    { id:'seed-bo2', ingId:'rice',     provider:'Be Organic', price:176600, currency:'COP', moq:1,  spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Aceite Arroz. Con IVA. 1 L.' },
    { id:'seed-bo3', ingId:'iso',      provider:'Be Organic', price:158000, currency:'COP', moq:1,  spec:'fail', status:'cotizado', compat:'no',  incoterm:'EXW', notes:'HIDROSOLUBLE — NO compatible base anhidra.' },
    { id:'seed-bo4', ingId:'mentha',   provider:'Be Organic', price:14400,  currency:'COP', moq:15, spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'AE Menta. Con IVA. 15 ml=$14.400.' },
    // Sumiquim S.A.S
    { id:'seed-sq1', ingId:'cct',      provider:'Sumiquim S.A.S', price:13.50, currency:'USD', moq:25, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'WITARIX MCT 60/40. Sin IVA. Kamel Hernández.' },
    { id:'seed-sq2', ingId:'squalane', provider:'Sumiquim S.A.S', price:52.50, currency:'USD', moq:5,  spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Escualano Vegetal. Sin IVA.' },
    { id:'seed-sq3', ingId:'grapeseed',provider:'Sumiquim S.A.S', price:11.50, currency:'USD', moq:25, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Aceite Uva Refinado. Sin IVA.' },
    { id:'seed-sq4', ingId:'toco',     provider:'Sumiquim S.A.S', price:195,   currency:'USD', moq:5,  spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'SKIN FEEL TOCO ×5 kg. Sin IVA.' },
    { id:'seed-sq5', ingId:'toco',     provider:'Sumiquim S.A.S', price:191,   currency:'USD', moq:25, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'SKIN FEEL TOCO ×25 kg. Sin IVA.' },
    { id:'seed-sq6', ingId:'baku',     provider:'Sumiquim S.A.S', price:320,   currency:'USD', moq:1,  spec:'warn',status:'obsoleto — fuera de fórmula', compat:'no', incoterm:'EXW', notes:'STEVISSE ×1 kg. [ELIMINADO]' },
    { id:'seed-sq7', ingId:'baku',     provider:'Sumiquim S.A.S', price:300,   currency:'USD', moq:25, spec:'warn',status:'obsoleto — fuera de fórmula', compat:'no', incoterm:'EXW', notes:'STEVISSE ×25 kg. [ELIMINADO]' },
    // SUMILAB
    { id:'seed-sl1', ingId:'grapeseed',provider:'SUMILAB', price:65000,   currency:'COP', moq:1, spec:'ok',   status:'cotizado',  compat:'yes', incoterm:'EXW', notes:'Aceite Semilla Uva. +IVA. Andrea Morales.' },
    { id:'seed-sl2', ingId:'baku',     provider:'SUMILAB', price:4500000, currency:'COP', moq:1, spec:'warn', status:'obsoleto — fuera de fórmula', compat:'no', incoterm:'EXW', notes:'Bakuchiol 60%. +IVA. [ELIMINADO]' },
    // Pochteca Colombia
    { id:'seed-po1', ingId:'cct',   provider:'Pochteca Colombia', price:38000, currency:'COP', moq:190, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'CCT. +IVA. Mínimo tambor 190 kg.' },
    { id:'seed-po2', ingId:'oleic', provider:'Pochteca Colombia', price:14000, currency:'COP', moq:180, spec:'ok', status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'EXW', notes:'Ácido Oleico. [ELIMINADO]' },
    // G&M Química
    { id:'seed-gm1', ingId:'cct',      provider:'G&M Química', price:88100,  currency:'COP', moq:1,    spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'CAPRIXSOL TCC. Sin IVA. Angela Pantoja.' },
    { id:'seed-gm2', ingId:'grapeseed',provider:'G&M Química', price:92700,  currency:'COP', moq:1,    spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Aceite Semillas Uva FITO-47A. Sin IVA.' },
    { id:'seed-gm3', ingId:'saw',      provider:'G&M Química', price:88000,  currency:'COP', moq:5,    spec:'fail', status:'cotizado', compat:'no',  incoterm:'EXW', notes:'⚠️ HG = hidroglicólico — NO compatible base anhidra.' },
    { id:'seed-gm4', ingId:'rosemary', provider:'G&M Química', price:148200, currency:'COP', moq:0.25, spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'A.E. Romero FITO-85H. Sin IVA. MOQ 250 g.' },
    { id:'seed-gm5', ingId:'ginseng',  provider:'G&M Química', price:73400,  currency:'COP', moq:1,    spec:'fail', status:'cotizado', compat:'no',  incoterm:'EXW', notes:'⚠️ HG = hidroglicólico — NO compatible base anhidra.' },
    { id:'seed-gm6', ingId:'mentha',   provider:'G&M Química', price:384800, currency:'COP', moq:1,    spec:'ok',   status:'cotizado', compat:'yes', incoterm:'EXW', notes:'A.E. Menta Piperita FITO28A. Sin IVA.' },
    // Laboratorios Phitother S.A.S
    { id:'seed-ph1', ingId:'rosemary', provider:'Laboratorios Phitother S.A.S', price:110200, currency:'COP', moq:1,  spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Romero (HO) PHITOEX-O. Sin IVA. Fany +57 313 4668206.' },
    { id:'seed-ph2', ingId:'mentha',   provider:'Laboratorios Phitother S.A.S', price:112700, currency:'COP', moq:1,  spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Menta (HO) PHITOEX-O. Sin IVA.' },
    { id:'seed-ph3', ingId:'toco',     provider:'Laboratorios Phitother S.A.S', price:131500, currency:'COP', moq:1,  spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Vitamina E PHITOEX-O. IVA 0%.' },
    { id:'seed-ph4', ingId:'ginseng',  provider:'Laboratorios Phitother S.A.S', price:169000, currency:'COP', moq:10, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Ginseng (RA) PHITOEX-O — extracto aceite. Sin IVA. MOQ 10 kg ~2 meses.' },
    { id:'seed-ph5', ingId:'grapeseed',provider:'Laboratorios Phitother S.A.S', price:105500, currency:'COP', moq:10, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Uva (FR) PHITOEX-O. Sin IVA. MOQ 10 kg ~2 meses.' },
    // Aromatheka
    { id:'seed-at1', ingId:'saw',      provider:'Aromatheka', price:295,    currency:'USD', moq:1, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Serenoa Serrulata (Saw Palmetto). Cotiz. ATK 2431-26.' },
    { id:'seed-at2', ingId:'grapeseed',provider:'Aromatheka', price:89400,  currency:'COP', moq:4, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'Aceite Semilla Uva. Sin IVA. MOQ 4 kg.' },
    { id:'seed-at3', ingId:'mentha',   provider:'Aromatheka', price:187000, currency:'COP', moq:4, spec:'ok', status:'cotizado', compat:'yes', incoterm:'EXW', notes:'AE Menta Piperita. Sin IVA. MOQ 4 kg.' },
    { id:'seed-at4', ingId:'baku',     provider:'Aromatheka', price:780,    currency:'USD', moq:1, spec:'ok', status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'EXW', notes:'ACTIGOLD Bakuchiol ≥98%. [ELIMINADO]' },
    // Shaanxi Dennis Biotechnology (China)
    { id:'seed-sd1', ingId:'iso', provider:'Shaanxi Dennis Biotechnology', price:90,    currency:'USD', moq:1, spec:'ok', status:'cotizado', compat:'yes', incoterm:'FOB', notes:'Fucoxantina 50% liposoluble. Daisy Wang. HALAL.' },
    { id:'seed-sd2', ingId:'iso', provider:'Shaanxi Dennis Biotechnology', price:239.5, currency:'USD', moq:1, spec:'ok', status:'cotizado', compat:'yes', incoterm:'FOB', notes:'Fucoxantina 98% liposoluble. Daisy Wang. HALAL.' },
    // Wellnature Biotech Co., Ltd. (China)
    { id:'seed-wb1', ingId:'ginseng', provider:'Wellnature Biotech Co., Ltd.', price:760, currency:'USD', moq:10, spec:'ok', status:'cotizado', compat:'yes', incoterm:'DAP', notes:'Ginsenosides ≥10%. Candice Wang. DAP Colombia ~6 días.' },
    // Ji'an Zhongxiang Natural Plants Co., Ltd. (China)
    { id:'seed-jz1', ingId:'ginseng',  provider:"Ji'an Zhongxiang Natural Plants Co., Ltd.", price:160, currency:'USD', moq:0, spec:'warn', status:'negociando', compat:'no', incoterm:'FOB', notes:'Aceite ginseng (NO CO₂). Solo express.' },
    { id:'seed-jz2', ingId:'rosemary', provider:"Ji'an Zhongxiang Natural Plants Co., Ltd.", price:185, currency:'USD', moq:0, spec:'warn', status:'negociando', compat:'no', incoterm:'FOB', notes:'Aceite romero (NO CO₂). Solo express.' },
    // Shaanxi Runcuize Biotechnology (China)
    { id:'seed-rc1', ingId:'baku', provider:'Shaanxi Runcuize Biotechnology', price:860, currency:'USD', moq:0, spec:'ok', status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'FOB', notes:'Bakuchiol 98% HPLC. Rose Chen. [ELIMINADO]' },
    // Cotizaciones backup 2026-06-03 (q-* = ingresadas manualmente por usuario)
    { id:'q-1780521599415', ingId:'cct',      provider:'Quimica Express', price:22.6,   currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780521679360', ingId:'grapeseed',provider:'Quimica Express', price:18,     currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'pending', incoterm:'EXW', notes:'' },
    { id:'q-1780521745348', ingId:'baku',     provider:'Sumilab',         price:1495.99,currency:'USD', moq:1,    spec:'ok',      status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'EXW', notes:'Lead time 30d, 60% conc. [ELIMINADO]' },
    { id:'q-1780521801713', ingId:'grapeseed',provider:'Sumilab',         price:21.48,  currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780521918490', ingId:'baku',     provider:'Aromatheka',      price:780.02, currency:'USD', moq:0.8,  spec:'pending', status:'obsoleto — fuera de fórmula', compat:'pending', incoterm:'EXW', notes:'Lead time 90d. [ELIMINADO]' },
    { id:'q-1780521964520', ingId:'saw',      provider:'Aromatheka',      price:295,    currency:'USD', moq:4,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522035357', ingId:'grapeseed',provider:'Aromatheka',      price:29.55,  currency:'USD', moq:4,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522111327', ingId:'mentha',   provider:'Aromatheka',      price:61.81,  currency:'USD', moq:4,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522255804', ingId:'cct',      provider:'pochteca',        price:12.6,   currency:'USD', moq:190,  spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522297840', ingId:'oleic',    provider:'pochteca',        price:4.6,    currency:'USD', moq:180,  spec:'pending', status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'EXW', notes:'[ELIMINADO]' },
    { id:'q-1780522349632', ingId:'cct',      provider:'sumiquim',        price:1.5,    currency:'USD', moq:25,   spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'WITARIX MCT 60/40.' },
    { id:'q-1780522373932', ingId:'squalane', provider:'sumiquim',        price:52.5,   currency:'USD', moq:5,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522398240', ingId:'cct',      provider:'sumiquim',        price:11.5,   currency:'USD', moq:25,   spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522469757', ingId:'baku',     provider:'sumiquim',        price:300,    currency:'USD', moq:25,   spec:'ok',      status:'obsoleto — fuera de fórmula', compat:'yes', incoterm:'EXW', notes:'STevisse. [ELIMINADO]' },
    { id:'q-1780522525925', ingId:'toco',     provider:'sumiquim',        price:195,    currency:'USD', moq:5,    spec:'pending', status:'cotizado',  compat:'pending', incoterm:'EXW', notes:'más IVA, skin feel toco' },
    { id:'q-1780522650553', ingId:'cct',      provider:'G&M',             price:29.1,   currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522697280', ingId:'grapeseed',provider:'G&M',             price:30.6,   currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522757409', ingId:'saw',      provider:'G&M',             price:29.08,  currency:'USD', moq:5,    spec:'pending', status:'cotizado',  compat:'no',      incoterm:'EXW', notes:'HIDROGLICOLICO' },
    { id:'q-1780522809628', ingId:'cct',      provider:'G&M',             price:48.98,  currency:'USD', moq:0.25, spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780522857962', ingId:'ginseng',  provider:'G&M',             price:24.25,  currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'no',      incoterm:'EXW', notes:'H.g' },
    { id:'q-1780522892817', ingId:'mentha',   provider:'G&M',             price:127,    currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'pending', incoterm:'EXW', notes:'' },
    { id:'q-1780522987523', ingId:'rosemary', provider:'phitother',       price:30.6,   currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780523027565', ingId:'mentha',   provider:'phitother',       price:31.3,   currency:'USD', moq:0.9,  spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780523064179', ingId:'toco',     provider:'phitother',       price:36.52,  currency:'USD', moq:1,    spec:'pending', status:'cotizado',  compat:'pending', incoterm:'EXW', notes:'vitamina e' },
    { id:'q-1780523105511', ingId:'cct',      provider:'phitither',       price:471,    currency:'USD', moq:10,   spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780523141599', ingId:'grapeseed',provider:'phitother',       price:293,    currency:'USD', moq:10,   spec:'pending', status:'cotizado',  compat:'yes',     incoterm:'EXW', notes:'' },
    { id:'q-1780523357416', ingId:'grapeseed',provider:'marath',          price:26.54,  currency:'USD', moq:0.03, spec:'pending', status:'cotizado',  compat:'pending', incoterm:'EXW', notes:'' },
    { id:'q-1780523429007', ingId:'rice',     provider:'marath',          price:26.548, currency:'USD', moq:0.03, spec:'pending', status:'cotizado',  compat:'pending', incoterm:'EXW', notes:'' },
  ];

  // ── Alias de proveedores duplicados por typo/mayúsculas ─────────────────
  // Case-insensitive. Usado por migrate() y por buildQuotationRecord() para
  // que entradas manuales / importaciones futuras normalicen automáticamente.
  const SUPPLIER_ALIASES = {
    'g&m': 'G&M Química',
    'phitother': 'Laboratorios Phitother S.A.S',
    'phitither': 'Laboratorios Phitother S.A.S',
    'pochteca': 'Pochteca Colombia',
    'sumiquim': 'Sumiquim S.A.S',
    'sumilab': 'SUMILAB',
  };

  function resolveSupplierAlias(name) {
    const key = String(name || '').trim().toLowerCase();
    return SUPPLIER_ALIASES[key] || String(name || '').trim();
  }

  // ── Helpers de moneda ────────────────────────────────────────────────────
  function detectCurrency(q) {
    if (q.currency) return q.currency;
    if (q.currencyOriginal) return q.currencyOriginal;
    const p = q.priceOriginal != null ? q.priceOriginal : q.price;
    return (p >= 5000) ? 'COP' : 'USD';
  }

  function normalizeQuotation(q, fxRate) {
    if (q._normalized) return q;
    const origPrice = q.priceOriginal != null ? q.priceOriginal : q.price;
    const origCur   = detectCurrency(q);
    const usedFx    = q.fxRateUsed || fxRate || DEFAULT_FX_RATE;
    q.priceOriginal  = origPrice;
    q.currencyOriginal = origCur;
    q.fxRateUsed     = usedFx;
    q.price = (origCur === 'COP') ? Math.round(origPrice / usedFx * 10000) / 10000 : origPrice;
    q._normalized = true;
    return q;
  }

  function isChineseSupplier(providerName) {
    const p = (providerName || '').toLowerCase();
    return p.includes('china') || p.includes('p1') || p.includes('shaanxi') ||
           p.includes('wellnature') || p.includes("ji'an") || p.includes('biotechnology') ||
           p.includes('biotech') || p.includes('runcuize') || p.includes('dennis');
  }

  function importMarkupFactor(providerName, settings) {
    const pct = isChineseSupplier(providerName)
      ? (settings.importMarkupChina != null ? settings.importMarkupChina : 30)
      : (settings.importMarkupLocal != null ? settings.importMarkupLocal : 0);
    return 1 + pct / 100;
  }

  function landedPrice(price, providerName, settings) {
    return price * importMarkupFactor(providerName, settings);
  }

  function gramsForBatch(pct, batchSizeG) {
    return Math.round(pct / 100 * (batchSizeG || DEFAULT_BATCH_G) * 1000) / 1000;
  }

  // ── Directorio de proveedores ────────────────────────────────────────────
  function slugify(name) {
    return String(name || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'proveedor';
  }

  function createSupplier(name, db) {
    const base = slugify(name);
    const existingIds = new Set((db && db.suppliers || []).map(s => s.id));
    let id = 'sup-' + base;
    let n = 2;
    while (existingIds.has(id)) { id = 'sup-' + base + '-' + n; n++; }
    return {
      id,
      name: (name || '').trim() || 'Proveedor sin nombre',
      country: isChineseSupplier(name) ? 'China' : null,
      type: isChineseSupplier(name) ? 'importado' : 'nacional',
      contact: { nombre: null, email: null, telefono: null },
      notes: '',
    };
  }

  function findSupplierByName(db, name) {
    const n = (name || '').trim().toLowerCase();
    if (!n) return null;
    return (db.suppliers || []).find(s => (s.name || '').trim().toLowerCase() === n) || null;
  }

  function matchOrCreateSupplier(db, name) {
    if (!db.suppliers) db.suppliers = [];
    let s = findSupplierByName(db, name);
    if (!s) {
      s = createSupplier(name, db);
      db.suppliers.push(s);
    }
    return s;
  }

  function getSuppliers(db) {
    return (db.suppliers || []).filter(s => !s.mergedInto);
  }

  function addSupplier(db, data) {
    if (!data || !String(data.name || '').trim()) {
      return { ok: false, error: 'El nombre del proveedor es obligatorio.' };
    }
    if (findSupplierByName(db, data.name)) {
      return { ok: false, error: 'Ya existe un proveedor con ese nombre.' };
    }
    const s = createSupplier(data.name, db);
    s.country = data.country || s.country;
    s.type = data.type === 'nacional' || data.type === 'importado' ? data.type : s.type;
    s.contact = { nombre: data.contact?.nombre || null, email: data.contact?.email || null, telefono: data.contact?.telefono || null };
    s.notes = data.notes || '';
    if (!db.suppliers) db.suppliers = [];
    db.suppliers.push(s);
    saveDb(db);
    return { ok: true, supplier: s };
  }

  function updateSupplier(db, id, patch) {
    const s = (db.suppliers || []).find(x => x.id === id);
    if (!s) return { ok: false, error: 'Proveedor no encontrado.' };
    Object.assign(s, patch, { contact: { ...s.contact, ...(patch.contact || {}) } });
    saveDb(db);
    return { ok: true, supplier: s };
  }

  // ── Vencimiento ──────────────────────────────────────────────────────────
  function isExpired(q) {
    if (!q || !q.validUntil) return false;
    const d = new Date(q.validUntil);
    if (isNaN(d.getTime())) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  }

  // ── Unidad de presentación ───────────────────────────────────────────────
  // El motor de costos solo interpreta price como USD/kg. Cualquier cotización
  // con unit != 'kg' se marca con unitWarning y queda excluida de auto-pick,
  // comparación de "más barato" y generación de PO hasta normalizarse a kg.
  function computeUnitWarning(q) {
    return !!(q.unit && q.unit !== 'kg');
  }

  function isUsable(q) {
    return q.compat !== 'no' &&
           q.status !== 'obsoleto — fuera de fórmula' &&
           q.status !== 'descartado' &&
           !q.unitWarning &&
           !isExpired(q);
  }

  function getUnitWarningQuotations(db) {
    return db.quotations.filter(q => q.unitWarning);
  }

  function quotationStateBadge(q) {
    if (q.status === 'obsoleto — fuera de fórmula') return { cls: 'b-obsoleto', label: 'Obsoleto' };
    if (isExpired(q)) return { cls: 'b-vencido', label: 'Vencido' };
    if (q.unitWarning) return { cls: 'b-warn', label: 'Unidad≠kg' };
    if (q.compat === 'no') return { cls: 'b-incompatible', label: 'Incompatible' };
    if (q.compat === 'yes') return { cls: 'b-compatible', label: 'Compatible' };
    return { cls: 'b-pend', label: 'Pendiente' };
  }

  // ── defaultDb ────────────────────────────────────────────────────────────
  function defaultDb() {
    const now = new Date().toISOString();
    const fxRate = DEFAULT_FX_RATE;
    const db = {
      version: SCHEMA,
      meta: { formulaName: 'Aceite Capilar — Definitiva v3', updatedAt: now, createdAt: now },
      formula: FORMULA_INGREDIENTS.map(i => ({ ...i })),
      quotations: DEFAULT_QUOTATIONS.map((q, idx) => {
        const nq = { id: q.id || 'seed-' + (idx + 1), ...q,
          unit: 'kg', leadTimeDays: null, validUntil: null, coaUrl: null, coaNota: null,
          date: new Date().toLocaleDateString('es-CO') };
        return normalizeQuotation(nq, fxRate);
      }),
      suppliers: [],
      settings: {
        fxRate,
        copRate: fxRate,
        batchSizeG: DEFAULT_BATCH_G,
        density: 0.92,
        mlPerUnit: 30,
        safetyMarginPct: 10,
        importMarkupChina: 30,
        importMarkupLocal: 0,
        importMarkupPct: 30, // deprecated — el comparador ya usa importMarkupChina/importMarkupLocal; se mantiene por compat con JSON viejos
        supplierP1: 'P1 China',
        supplierP2: 'P2 Imagen',
        lastBackupAt: null,
      },
      picks: { ...DEFAULT_PICKS },
      purchaseOrders: [],
      poDraft: { batchSizeG: DEFAULT_BATCH_G, lines: {} },
    };
    db.quotations.forEach(q => { q.supplierId = matchOrCreateSupplier(db, q.provider).id; });
    return db;
  }

  // ── migrate ──────────────────────────────────────────────────────────────
  function migrate(db) {
    const base = defaultDb();
    if (!db || typeof db !== 'object') return base;

    const fromV1 = !db.version || db.version < 2;
    const fromV3 = !db.version || db.version < 4;
    const fromV4 = !db.version || db.version < 5;
    const fromV5 = !db.version || db.version < 6;

    db.meta     = db.meta || base.meta;
    db.settings = { ...base.settings, ...db.settings };
    // Sync fxRate / copRate
    if (fromV1 && (!db.settings.fxRate || db.settings.fxRate === 4200)) {
      db.settings.fxRate  = DEFAULT_FX_RATE;
      db.settings.copRate = DEFAULT_FX_RATE;
    }
    db.settings.copRate = db.settings.fxRate;
    if (db.settings.lastBackupAt === undefined) db.settings.lastBackupAt = null;

    db.purchaseOrders = Array.isArray(db.purchaseOrders) ? db.purchaseOrders : [];
    db.poDraft        = db.poDraft || { batchSizeG: DEFAULT_BATCH_G, lines: {} };
    if (!db.poDraft.batchSizeG) db.poDraft.batchSizeG = db.poDraft.batchKg ? db.poDraft.batchKg * 1000 : DEFAULT_BATCH_G;

    // Formula: replace on v1→v2 migration, if new ingredients missing, or if
    // upgrading from a schema below v6 (fuerza resync de valores canónicos v3,
    // ya que hasNewFormula solo detecta ids nuevos, no cambios de pct en ids existentes).
    const hasNewFormula = Array.isArray(db.formula) && db.formula.find(i => i.id === 'hemisq');
    if (fromV1 || !hasNewFormula || fromV5) {
      db.formula = base.formula;
    } else {
      db.formula = db.formula.length ? db.formula : base.formula;
    }

    const fxRate   = db.settings.fxRate || DEFAULT_FX_RATE;
    const validIds = new Set(FORMULA_INGREDIENTS.map(i => i.id));

    // Quotations
    if (!Array.isArray(db.quotations) || db.quotations.length === 0) {
      db.quotations = base.quotations;
    } else {
      db.quotations = db.quotations.map(q => {
        const nq = {
          compat:'pending', spec:'pending', status:'cotizado', moq:1, incoterm:'EXW',
          unit: 'kg', leadTimeDays: null, validUntil: null, coaUrl: null, coaNota: null,
          ...q,
          ingId: q.ingId || nameToId(q.ingName) || q.ingName,
        };
        // Preserve explicit nulls/values already present (spread above keeps them if defined)
        if (nq.unit === undefined) nq.unit = 'kg';
        if (nq.leadTimeDays === undefined) nq.leadTimeDays = null;
        if (nq.validUntil === undefined) nq.validUntil = null;
        if (nq.coaUrl === undefined) nq.coaUrl = null;
        if (nq.coaNota === undefined) nq.coaNota = null;
        normalizeQuotation(nq, fxRate);
        // Mark obsolete ingredients
        if (OBSOLETE_IDS.has(nq.ingId) &&
            nq.status !== 'obsoleto — fuera de fórmula' &&
            nq.status !== 'descartado') {
          nq.status = 'obsoleto — fuera de fórmula';
        }
        return nq;
      });

      // Add missing seed quotations (idempotent by ID)
      if (fromV1) {
        const existingIds = new Set(db.quotations.map(q => q.id));
        base.quotations.forEach(sq => {
          if (!existingIds.has(sq.id)) {
            db.quotations.push({ ...sq });
          }
        });
      }
    }

    // unitWarning es puro función de q.unit — recomputar incondicionalmente
    // en cada migrate() (idempotente, cubre ambas ramas de arriba).
    db.quotations.forEach(q => { q.unitWarning = computeUnitWarning(q); });
    if (fromV3) {
      const warnedCount = db.quotations.filter(q => q.unitWarning).length;
      console.warn(`Eterno: ${warnedCount} cotización(es) marcada(s) con unitWarning (unidad ≠ kg) al migrar a schema v${SCHEMA}.`);
    }
    if (fromV5) {
      console.warn('Eterno: fórmula actualizada a valores canónicos v3 (CCT 36.20% / Hemisqualane 24.90% / Rosmarinus 0.80%) al migrar a schema v6.');
    }

    // Suppliers directory: build/merge from provider names (idempotent, matching por nombre exacto)
    db.suppliers = Array.isArray(db.suppliers) ? db.suppliers : [];

    // Fusionar proveedores duplicados por typo/mayúsculas (idempotente): reescribe
    // q.provider al nombre canónico, preserva el original en providerOriginal, y
    // repunta q.supplierId para que el sync de abajo no lo vuelva a pisar con el
    // supplier viejo asociado al supplierId desactualizado.
    const mergedByGroup = {};
    db.quotations.forEach(q => {
      const canonical = resolveSupplierAlias(q.provider);
      if (canonical !== q.provider) {
        if (q.providerOriginal === undefined) q.providerOriginal = q.provider;
        mergedByGroup[canonical] = (mergedByGroup[canonical] || 0) + 1;
        q.provider = canonical;
        q.supplierId = matchOrCreateSupplier(db, canonical).id;
      }
    });
    if (fromV4 && Object.keys(mergedByGroup).length) {
      console.warn('Eterno: proveedores fusionados por alias →', mergedByGroup);
    }

    db.quotations.forEach(q => {
      let s = q.supplierId ? db.suppliers.find(x => x.id === q.supplierId) : null;
      if (!s) s = findSupplierByName(db, q.provider);
      if (!s) s = matchOrCreateSupplier(db, q.provider);
      q.supplierId = s.id;
      // keep provider name in sync with directory display name
      q.provider = s.name;
    });

    // Fichas de proveedor huérfanas (alias conocido, ya sin cotizaciones propias
    // tras el remapeo de arriba): fusionar contacto/notas hacia la ficha canónica
    // (solo rellenar huecos, nunca pisar datos ya presentes) y marcarlas con
    // mergedInto — nunca se borran, solo quedan ocultas del directorio.
    const activeSupplierIds = new Set(db.quotations.map(q => q.supplierId));
    Object.keys(SUPPLIER_ALIASES).forEach(aliasKey => {
      const canonical = findSupplierByName(db, SUPPLIER_ALIASES[aliasKey]);
      if (!canonical) return;
      db.suppliers.forEach(s => {
        if (s.id === canonical.id || s.mergedInto) return;
        if ((s.name || '').trim().toLowerCase() !== aliasKey) return;
        if (activeSupplierIds.has(s.id)) return;
        if (s.contact) {
          canonical.contact = canonical.contact || { nombre: null, email: null, telefono: null };
          Object.keys(s.contact).forEach(k => {
            if (!canonical.contact[k] && s.contact[k]) canonical.contact[k] = s.contact[k];
          });
        }
        if (s.notes && !canonical.notes) canonical.notes = s.notes;
        s.mergedInto = canonical.id;
      });
    });

    // Picks: migrate hybrid → picks, remove obsolete, add new ingredients
    const oldHybrid = db.hybrid || {};
    const p1Name    = db.settings.supplierP1 || 'P1 China';
    const p2Name    = db.settings.supplierP2 || 'P2 Imagen';

    if (!db.picks) {
      db.picks = {};
      Object.keys(oldHybrid).forEach(ingId => {
        if (validIds.has(ingId)) {
          const b = oldHybrid[ingId];
          db.picks[ingId] = b === 'p1' ? p1Name : b === 'p2' ? p2Name : null;
        }
      });
    }
    // Remove picks for eliminated/unknown ingredients
    Object.keys(db.picks).forEach(k => { if (!validIds.has(k)) delete db.picks[k]; });
    // Ensure all formula ingredients have a picks entry
    FORMULA_INGREDIENTS.forEach(ing => {
      if (!(ing.id in db.picks)) db.picks[ing.id] = DEFAULT_PICKS[ing.id] || null;
    });

    db.version = SCHEMA;
    return db;
  }

  // ── loadDb / saveDb ──────────────────────────────────────────────────────
  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) {
        const db = defaultDb();
        saveDb(db);
        return db;
      }
      const db = JSON.parse(raw);
      const migrated = migrate(db);
      if (!db.version || db.version < SCHEMA) saveDb(migrated);
      return migrated;
    } catch (e) {
      console.warn('Eterno DB load error', e);
      return defaultDb();
    }
  }

  function saveDb(db) {
    db.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  // ── Helpers de fórmula ───────────────────────────────────────────────────
  function sumPct(db) {
    return db.formula.reduce((s, i) => s + (Number(i.pct) || 0), 0);
  }

  function pctFactor(db) {
    const t = sumPct(db);
    return t > 0 ? 100 / t : 1;
  }

  function nameToId(name) {
    const f = FORMULA_INGREDIENTS.find(i => i.name === name);
    return f ? f.id : null;
  }

  function getIngredient(idOrName, db) {
    const d = db || loadDb();
    return d.formula.find(i => i.id === idOrName) ||
           FORMULA_INGREDIENTS.find(i => i.name === idOrName);
  }

  function getFormula(db) {
    return db.formula;
  }

  // Precios por proveedor (solo compatibles, no vencidos, excluye obsoletos, solo ing de fórmula activa)
  function getPricesFromQuotations(db) {
    const formulaIds = new Set(db.formula.map(i => i.id));
    const result = {};
    db.quotations
      .filter(q => isUsable(q) && q.ingId && formulaIds.has(q.ingId))
      .forEach(q => {
        if (!result[q.provider]) result[q.provider] = {};
        if (result[q.provider][q.ingId] == null || q.price < result[q.provider][q.ingId]) {
          result[q.provider][q.ingId] = q.price;
        }
      });
    return result;
  }

  // Ingredientes sin cotización compatible en la fórmula activa
  function getMissingIngredients(db) {
    const ap = getPricesFromQuotations(db);
    const covered = new Set();
    Object.values(ap).forEach(provMap => Object.keys(provMap).forEach(id => covered.add(id)));
    return db.formula.filter(ing => !covered.has(ing.id));
  }

  function getQuotations(db, opts) {
    opts = opts || {};
    let list = db.quotations.slice();
    if (opts.soloCompatibles) list = list.filter(isUsable);
    if (opts.ingId) list = list.filter(q => q.ingId === opts.ingId);
    return list;
  }

  function getPicks(db) {
    return db.picks || {};
  }

  function savePick(db, ingId, providerName) {
    if (!db.picks) db.picks = {};
    db.picks[ingId] = providerName;
    saveDb(db);
  }

  function getSettings(db) {
    return db.settings;
  }

  function updateSettings(db, patch) {
    db.settings = { ...db.settings, ...patch };
    saveDb(db);
    return db.settings;
  }

  // ── Validación de cotizaciones ───────────────────────────────────────────
  function validateQuotationInput(data, db) {
    if (!data) return 'Datos de cotización faltantes.';
    if (!data.ingId || !db.formula.find(i => i.id === data.ingId)) {
      return 'Selecciona un ingrediente válido de la fórmula.';
    }
    if (!(Number(data.price) > 0)) {
      return 'El precio debe ser mayor que 0.';
    }
    if (!CURRENCIES.includes(data.currency)) {
      return 'La moneda debe ser COP o USD.';
    }
    if (data.unit && !UNITS.includes(data.unit)) {
      return 'La unidad de presentación debe ser g, kg, ml, l o unidad.';
    }
    if (!data.provider || !String(data.provider).trim()) {
      return 'El proveedor es obligatorio.';
    }
    return null;
  }

  function buildQuotationRecord(data, db, existing) {
    const enteredProvider = String(data.provider).trim();
    const canonicalProvider = resolveSupplierAlias(enteredProvider);
    const supplier = matchOrCreateSupplier(db, canonicalProvider);
    const providerOriginal = existing && existing.providerOriginal !== undefined
      ? existing.providerOriginal
      : (canonicalProvider !== enteredProvider ? enteredProvider : undefined);
    const q = {
      id: existing?.id || data.id || 'q-' + Date.now(),
      ingId: data.ingId,
      provider: supplier.name,
      providerOriginal,
      supplierId: supplier.id,
      price: Number(data.price),
      currency: data.currency,
      unit: data.unit || 'kg',
      moq: data.moq != null && data.moq !== '' ? Number(data.moq) : 1,
      incoterm: data.incoterm || 'EXW',
      spec: data.spec || 'pending',
      status: data.status || 'cotizado',
      compat: data.compat || 'pending',
      notes: data.notes || '',
      leadTimeDays: data.leadTimeDays != null && data.leadTimeDays !== '' ? Number(data.leadTimeDays) : null,
      validUntil: data.validUntil || null,
      coaUrl: data.coaUrl || null,
      coaNota: data.coaNota || null,
      date: existing?.date || data.date || new Date().toLocaleDateString('es-CO'),
    };
    normalizeQuotation(q, db.settings.fxRate);
    q.unitWarning = computeUnitWarning(q);
    return q;
  }

  function addQuotation(db, data) {
    const err = validateQuotationInput(data, db);
    if (err) return { ok: false, error: err };
    const q = buildQuotationRecord(data, db, null);
    db.quotations.push(q);
    saveDb(db);
    return { ok: true, quotation: q };
  }

  function updateQuotation(db, id, patch) {
    const idx = db.quotations.findIndex(q => q.id === id);
    if (idx < 0) return { ok: false, error: 'Cotización no encontrada.' };
    const existing = db.quotations[idx];
    const merged = { ...existing, priceOriginal: undefined, currencyOriginal: undefined, fxRateUsed: undefined, _normalized: undefined, ...patch };
    const err = validateQuotationInput(merged, db);
    if (err) return { ok: false, error: err };
    const q = buildQuotationRecord(merged, db, existing);
    db.quotations[idx] = q;
    saveDb(db);
    return { ok: true, quotation: q };
  }

  function deleteQuotation(db, id) {
    db.quotations = db.quotations.filter(q => q.id !== id);
    saveDb(db);
  }

  // ── Exportar / importar / respaldo ──────────────────────────────────────
  function exportJson(db, filename) {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'eterno_database_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportBackup(db) {
    const dateStr = new Date().toISOString().slice(0, 10);
    db.settings.lastBackupAt = new Date().toISOString();
    saveDb(db);
    exportJson(db, 'eterno_backup_' + dateStr + '.json');
  }

  function shouldShowBackupReminder(db) {
    const last = db.settings && db.settings.lastBackupAt;
    if (!last) return true;
    const days = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    return days > BACKUP_REMINDER_DAYS;
  }

  function summarizeBackup(raw) {
    let obj;
    try { obj = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return null; }
    if (!obj || typeof obj !== 'object') return null;
    return {
      quotations: Array.isArray(obj.quotations) ? obj.quotations.length : 0,
      picks: obj.picks ? Object.keys(obj.picks).length : 0,
      suppliers: Array.isArray(obj.suppliers) ? obj.suppliers.length : 0,
      date: obj.meta?.updatedAt || null,
      version: obj.version || 1,
    };
  }

  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function importJsonFile(file, merge) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const incoming = migrate(JSON.parse(reader.result));
          let db = loadDb();
          if (merge) {
            const ids = new Set(db.quotations.map(q => q.id));
            incoming.quotations.forEach(q => { if (!ids.has(q.id)) db.quotations.push(q); });
            const supIds = new Set(db.suppliers.map(s => s.id));
            (incoming.suppliers || []).forEach(s => { if (!supIds.has(s.id)) db.suppliers.push(s); });
            db.settings     = { ...db.settings, ...incoming.settings };
            db.picks        = { ...db.picks, ...incoming.picks };
          } else {
            db = incoming;
          }
          saveDb(db);
          resolve(db);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // ── Formato compartido (HTML escape / número) ───────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  function fmt(n, d = 2) {
    return Number(n || 0).toFixed(d);
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function toast(msg, ms) {
    let el = document.getElementById('eterno-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'eterno-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms || 2500);
  }

  // ── Confirmación (reemplaza confirm() nativo) ───────────────────────────
  function confirmDialog(opts) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay open';
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <h3>${opts.title || 'Confirmar'}</h3>
          <p style="font-size:13px;color:var(--muted);line-height:1.6;white-space:pre-line">${opts.message || ''}</p>
          <div class="modal-actions">
            <button type="button" class="btn" data-act="cancel">${opts.cancelLabel || 'Cancelar'}</button>
            <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${opts.okLabel || 'Confirmar'}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => {
        if (e.target === overlay) { overlay.remove(); resolve(false); }
      });
      overlay.querySelector('[data-act="cancel"]').onclick = () => { overlay.remove(); resolve(false); };
      overlay.querySelector('[data-act="ok"]').onclick = () => { overlay.remove(); resolve(true); };
    });
  }

  // ── API pública ──────────────────────────────────────────────────────────
  global.EternoStore = {
    DB_KEY, SCHEMA, FORMULA_INGREDIENTS, OBSOLETE_IDS, DEFAULT_PICKS,
    DEFAULT_FX_RATE, DEFAULT_BATCH_G, CURRENCIES, UNITS, BACKUP_REMINDER_DAYS,
    SUPPLIER_ALIASES, resolveSupplierAlias,
    loadDb, saveDb, defaultDb, migrate,
    sumPct, pctFactor, nameToId, getIngredient, getFormula,
    getPricesFromQuotations, getMissingIngredients, getQuotations,
    getPicks, savePick, setPick: savePick,
    getSettings, updateSettings,
    addQuotation, updateQuotation, deleteQuotation, validateQuotationInput,
    getSuppliers, addSupplier, updateSupplier, matchOrCreateSupplier, findSupplierByName,
    isExpired, isUsable, quotationStateBadge, getUnitWarningQuotations,
    isChineseSupplier, importMarkupFactor, landedPrice, gramsForBatch,
    normalizeQuotation, detectCurrency,
    exportJson, exportBackup, shouldShowBackupReminder, summarizeBackup, readFileText, importJsonFile,
    toast, confirmDialog, esc, fmt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
