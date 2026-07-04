/**
 * Eterno — capa de persistencia local (localStorage) v2
 * Fórmula 13 ingredientes · FX 3650 COP/USD · moneda normalizada
 */
(function (global) {
  'use strict';
  const DB_KEY         = 'eterno_database_v1';
  const SCHEMA         = 2;
  const DEFAULT_BATCH_G = 445;
  const DEFAULT_FX_RATE = 3650;

  // ── Fórmula definitiva 13 ingredientes — lote base 445 g ────────────────
  const FORMULA_INGREDIENTS = [
    { id:'cct',      phase:'A', name:'CCT (Triglicérido Caprílico/Cáprico)', inci:'Caprylic/Capric Triglyceride',        pct:37.15, cat:'carrier' },
    { id:'hemisq',   phase:'A', name:'Hemisqualane',                          inci:'Hemisqualane',                         pct:24.00, cat:'carrier' },
    { id:'squalane', phase:'A', name:'Squalane (Oliva)',                      inci:'Squalane',                             pct: 8.00, cat:'carrier' },
    { id:'grapeseed',phase:'A', name:'Vitis Vinifera (Semilla de Uva)',       inci:'Vitis Vinifera Seed Oil',              pct:13.00, cat:'carrier' },
    { id:'rice',     phase:'B', name:'Oryza Sativa (Salvado de Arroz)',       inci:'Oryza Sativa Bran Oil',               pct:10.00, cat:'carrier' },
    { id:'saw',      phase:'C', name:'Serenoa CO₂ (Saw Palmetto)',       inci:'Serenoa Serrulata Fruit Extract',     pct: 2.00, cat:'active'  },
    { id:'iso',      phase:'C', name:'Isochrysis CO₂',                   inci:'Isochrysis Galbana Extract',          pct: 2.00, cat:'active'  },
    { id:'ginseng',  phase:'D', name:'Panax Ginseng CO₂',               inci:'Panax Ginseng Root Extract',          pct: 2.00, cat:'active'  },
    { id:'rosemary', phase:'D', name:'Rosmarinus CO₂',                   inci:'Rosmarinus Officinalis Leaf Extract', pct: 0.75, cat:'active'  },
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

  // ── defaultDb ────────────────────────────────────────────────────────────
  function defaultDb() {
    const now = new Date().toISOString();
    const fxRate = DEFAULT_FX_RATE;
    return {
      version: SCHEMA,
      meta: { formulaName: 'Aceite Capilar — Definitiva v2', updatedAt: now, createdAt: now },
      formula: FORMULA_INGREDIENTS.map(i => ({ ...i })),
      quotations: DEFAULT_QUOTATIONS.map((q, idx) => {
        const nq = { id: q.id || 'seed-' + (idx + 1), ...q,
          date: new Date().toLocaleDateString('es-CO') };
        return normalizeQuotation(nq, fxRate);
      }),
      settings: {
        fxRate,
        copRate: fxRate,
        batchSizeG: DEFAULT_BATCH_G,
        density: 0.92,
        mlPerUnit: 30,
        safetyMarginPct: 10,
        importMarkupChina: 30,
        importMarkupLocal: 0,
        importMarkupPct: 30,
        supplierP1: 'P1 China',
        supplierP2: 'P2 Imagen',
      },
      picks: { ...DEFAULT_PICKS },
      purchaseOrders: [],
      poDraft: { batchSizeG: DEFAULT_BATCH_G, lines: {} },
    };
  }

  // ── migrate ──────────────────────────────────────────────────────────────
  function migrate(db) {
    const base = defaultDb();
    if (!db || typeof db !== 'object') return base;

    const fromV1 = !db.version || db.version < 2;

    db.meta     = db.meta || base.meta;
    db.settings = { ...base.settings, ...db.settings };
    // Sync fxRate / copRate
    if (fromV1 && (!db.settings.fxRate || db.settings.fxRate === 4200)) {
      db.settings.fxRate  = DEFAULT_FX_RATE;
      db.settings.copRate = DEFAULT_FX_RATE;
    }
    db.settings.copRate = db.settings.fxRate;

    db.manualPrices   = db.manualPrices || {};
    db.purchaseOrders = Array.isArray(db.purchaseOrders) ? db.purchaseOrders : [];
    db.poDraft        = db.poDraft || { batchSizeG: DEFAULT_BATCH_G, lines: {} };
    if (!db.poDraft.batchSizeG) db.poDraft.batchSizeG = db.poDraft.batchKg ? db.poDraft.batchKg * 1000 : DEFAULT_BATCH_G;

    // Formula: replace on v1→v2 migration or if new ingredients missing
    const hasNewFormula = Array.isArray(db.formula) && db.formula.find(i => i.id === 'hemisq');
    if (fromV1 || !hasNewFormula) {
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
          ...q,
          ingId: q.ingId || nameToId(q.ingName) || q.ingName,
        };
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

  // Precios por proveedor (solo compatibles, excluye obsoletos, solo ing de fórmula activa)
  function getPricesFromQuotations(db) {
    const formulaIds = new Set(db.formula.map(i => i.id));
    const result = {};
    db.quotations
      .filter(q => q.compat !== 'no' &&
                   q.status !== 'obsoleto — fuera de fórmula' &&
                   q.status !== 'descartado' &&
                   q.ingId && formulaIds.has(q.ingId))
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

  function savePick(db, ingId, providerName) {
    if (!db.picks) db.picks = {};
    db.picks[ingId] = providerName;
    saveDb(db);
  }

  // ── Exportar / importar ──────────────────────────────────────────────────
  function exportJson(db, filename) {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'eterno_database_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
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
            db.settings     = { ...db.settings, ...incoming.settings };
            db.picks        = { ...db.picks, ...incoming.picks };
            db.manualPrices = { ...db.manualPrices, ...incoming.manualPrices };
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

  // ── API pública ──────────────────────────────────────────────────────────
  global.EternoStore = {
    DB_KEY, SCHEMA, FORMULA_INGREDIENTS, OBSOLETE_IDS, DEFAULT_PICKS,
    DEFAULT_FX_RATE, DEFAULT_BATCH_G,
    loadDb, saveDb, defaultDb, migrate,
    sumPct, pctFactor, nameToId, getIngredient,
    getPricesFromQuotations, getMissingIngredients,
    savePick,
    isChineseSupplier, importMarkupFactor, landedPrice, gramsForBatch,
    normalizeQuotation, detectCurrency,
    exportJson, importJsonFile,
    toast,
    // Compat aliases
    providerBucket: () => 'local',
    detectBucket:   () => 'local',
  };
})(typeof window !== 'undefined' ? window : globalThis);
