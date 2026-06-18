import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSXStyle from 'xlsx-js-style';
import './styles/app.css';
import { teaToMonthlyRate, calcMinPayment, simulatePayoff, PayoffDebt, PaymentRow } from './utils/payoff';

// ==========================================
// 1. ESTRUCTURAS DE DATOS Y TIPOS
// ==========================================
interface Debt {
  id: string;           // Creado vía crypto.randomUUID() o fallback
  name: string;
  balance: number;
  annualRate: number;
  installments?: number;
  createdAt: number;
}

// ==========================================
// 2. LÓGICA DE CÁLCULO FINANCIERO (FUNCIONES PURAS)
// ==========================================
// teaToMonthlyRate, calcMinPayment, simulatePayoff y sus tipos
// están definidos en ./utils/payoff y se importan arriba.

interface CurrencyConfig {
  code: string;
  symbol: string;
  flag: string;
  countryCode: string;
  locale: string;
  presets: number[];
  slider: { min: number; max: number; step: number };
}

function safeReadJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Valor guardado como string plano (sin JSON.stringify) — retornar tal cual
    return raw as unknown as T;
  }
}

export const CURRENCIES: CurrencyConfig[] = [
  {
    code: 'COP',
    symbol: '$',
    flag: '🇨🇴',
    countryCode: 'co',
    locale: 'es-CO',
    presets: [20000, 50000, 100000, 200000],
    slider: { min: 0, max: 2000000, step: 10000 }
  },
  {
    code: 'USD',
    symbol: '$',
    flag: '🇺🇸',
    countryCode: 'us',
    locale: 'en-US',
    presets: [10, 25, 50, 100],
    slider: { min: 0, max: 2000, step: 10 }
  },
  {
    code: 'EUR',
    symbol: '€',
    flag: '🇪🇺',
    countryCode: 'eu',
    locale: 'de-DE',
    presets: [10, 25, 50, 100],
    slider: { min: 0, max: 2000, step: 10 }
  },
  {
    code: 'MXN',
    symbol: '$',
    flag: '🇲🇽',
    countryCode: 'mx',
    locale: 'es-MX',
    presets: [200, 500, 1000, 2000],
    slider: { min: 0, max: 20000, step: 100 }
  },
  {
    code: 'ARS',
    symbol: '$',
    flag: '🇦🇷',
    countryCode: 'ar',
    locale: 'es-AR',
    presets: [1000, 5000, 10000, 20000],
    slider: { min: 0, max: 100000, step: 1000 }
  },
  {
    code: 'BRL',
    symbol: 'R$',
    flag: '🇧🇷',
    countryCode: 'br',
    locale: 'pt-BR',
    presets: [50, 100, 250, 500],
    slider: { min: 0, max: 10000, step: 50 }
  },
  {
    code: 'CLP',
    symbol: '$',
    flag: '🇨🇱',
    countryCode: 'cl',
    locale: 'es-CL',
    presets: [5000, 10000, 25000, 50000],
    slider: { min: 0, max: 1000000, step: 5000 }
  }
];


// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================
function App() {
  // --- Estados Globales (useState + localStorage) ---
  const [debts, setDebts] = useState<Debt[]>(() => {
    const raw = safeReadJSON<any[]>('debts', []);
    return raw.filter(
      (d): d is Debt =>
        d != null &&
        typeof d.id === 'string' &&
        typeof d.name === 'string' &&
        typeof d.balance === 'number' && d.balance > 0 &&
        typeof d.annualRate === 'number'
    );
  });

  const [accelerator, setAccelerator] = useState<number>(() =>
    safeReadJSON<number>('accelerator', 0)
  );

  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>(() =>
    safeReadJSON<'avalanche' | 'snowball'>('strategy', 'avalanche')
  );
  
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);

  // --- Estados de Moneda ---
  const [currency, setCurrency] = useState<string>(() =>
    safeReadJSON<string>('currency', 'COP')
  );
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  const activeCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const currencySymbol = activeCurrency.symbol;

  // Cerrar dropdown al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(activeCurrency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Cap the accelerator if it exceeds the new currency's max
  useEffect(() => {
    if (accelerator > activeCurrency.slider.max) {
      setAccelerator(activeCurrency.slider.max);
    }
  }, [currency, accelerator, activeCurrency]);

  // Estados de Control del Formulario (Registro/Edición)
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formBalance, setFormBalance] = useState<string>('');
  const [formRate, setFormRate] = useState<string>('');
  const [formInstallments, setFormInstallments] = useState<string>('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{ debts: Debt[]; count: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const importDataRef = React.useRef<HTMLInputElement>(null);

  // Estados para la animación de guía post-guardado (Primera deudores)
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [pulseActive, setPulseActive] = useState<boolean>(false);
  const [pulseIndigoColor, setPulseIndigoColor] = useState<boolean>(false);
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [guideSeen, setGuideSeen] = useState<boolean>(() =>
    localStorage.getItem('guideSeen') === 'true'
  );

  // --- Persistencia vía useEffect ---
  useEffect(() => {
    localStorage.setItem('debts', JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem('accelerator', accelerator.toString());
  }, [accelerator]);

  useEffect(() => {
    localStorage.setItem('strategy', strategy);
  }, [strategy]);

  // Cerrar el tooltip automáticamente a los 4s
  useEffect(() => {
    if (tooltipVisible) {
      const timer = setTimeout(() => {
        setTooltipVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [tooltipVisible]);

  // --- Lógica del CRUD ---
  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormName('');
    setFormBalance('');
    setFormRate('');
    setFormInstallments('');
    setShowForm(true);
  };

  const handleEditClick = (debt: Debt) => {
    setEditingId(debt.id);
    setFormName(debt.name);
    setFormBalance(debt.balance.toString());
    setFormRate(debt.annualRate.toString());
    setFormInstallments(debt.installments ? debt.installments.toString() : '');
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(formBalance) || 0;
    const rate = parseFloat(formRate) || 0;

    // Validación de installments (entero positivo mayor a 0)
    const installmentsVal = parseInt(formInstallments, 10);
    const parsedInst = Number(formInstallments);
    if (!formInstallments || isNaN(installmentsVal) || installmentsVal <= 0 || !Number.isInteger(parsedInst)) {
      alert('Por favor ingresa un número de cuotas totales válido (entero positivo mayor a 0).');
      return;
    }

    if (!formName.trim() || balance <= 0 || rate < 0) {
      alert('Por favor ingresa datos válidos mayores a cero.');
      return;
    }

    const isFirstDebt = debts.length === 0;

    if (editingId) {
      // Editar
      setDebts(prev => prev.map(d => d.id === editingId ? {
        ...d,
        name: formName.trim(),
        balance,
        annualRate: rate,
        installments: installmentsVal
      } : d));
      setEditingId(null);
    } else {
      // Crear
      const newDebt: Debt = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        name: formName.trim(),
        balance,
        annualRate: rate,
        installments: installmentsVal,
        createdAt: Date.now()
      };
      setDebts(prev => [...prev, newDebt]);

      // Animación de guía post-guardado (solo primera deudor)
      if (isFirstDebt && !guideSeen) {
        // a) Toast de éxito durante 2.5s
        setToastVisible(true);
        setTimeout(() => {
          setToastVisible(false);
        }, 2500);

        // b) Después de 600ms, pulso visual de pestaña Estrategia (duración 400ms) y color de ícono índigo por 3s
        setTimeout(() => {
          setPulseActive(true);
          setPulseIndigoColor(true);
          
          setTimeout(() => {
            setPulseActive(false);
          }, 400);

          setTimeout(() => {
            setPulseIndigoColor(false);
          }, 3000);
        }, 600);

        // c) Después de 1.2s, mostrar tooltip
        setTimeout(() => {
          setTooltipVisible(true);
        }, 1200);

        // d) Guardar flag guideSeen en localStorage
        setGuideSeen(true);
        localStorage.setItem('guideSeen', 'true');
      }
    }

    // Resetear formulario
    setFormName('');
    setFormBalance('');
    setFormRate('');
    setFormInstallments('');
    setShowForm(false);
  };

  // --- Ejecución de las Proyecciones Financieras ---
  const reportWithStrategy = useMemo(
    () => simulatePayoff(debts, accelerator, strategy),
    [debts, accelerator, strategy]
  );

  // Escenarios globales para proyecciones por deuda (efecto cascada)
  const scenarioBase = useMemo(
    () => simulatePayoff(debts, 0, strategy),
    [debts, strategy]
  );

  // Agrupar filas contiguas por mes para la tabla del plan de pagos
  const groupedMonths = useMemo(() => {
    const groups: { month: number; rows: PaymentRow[] }[] = [];
    reportWithStrategy.forEach(row => {
      let group = groups.find(g => g.month === row.month);
      if (!group) {
        group = { month: row.month, rows: [] };
        groups.push(group);
      }
      group.rows.push(row);
    });
    return groups;
  }, [reportWithStrategy]);

  // Ordenar deudas según estrategia activa para la comparación por deuda
  const sortedDebtsForComparison = useMemo(
    () => [...debts].sort((a, b) =>
      strategy === 'avalanche' ? b.annualRate - a.annualRate : a.balance - b.balance
    ),
    [debts, strategy]
  );

  const scenarioActive = reportWithStrategy;

  // Mapear cada deuda y extraer proyecciones desde la simulación global
  const individualDebtsProjections = useMemo(
    () => sortedDebtsForComparison.map((debt, index) => {
    const isTarget = index === 0;

    // A) scenarioBase: todas las deudas, accelerator = 0
    const rowsBase = scenarioBase.filter(r => r.debtId === debt.id);
    const monthsBefore = rowsBase.length > 0 ? rowsBase[rowsBase.length - 1].month : 0;
    const interestBefore = rowsBase.reduce((sum, r) => sum + r.interest, 0);

    // B) scenarioActive: todas las deudas, accelerator activo
    const rowsActive = scenarioActive.filter(r => r.debtId === debt.id);
    const monthsAfter = rowsActive.length > 0 ? rowsActive[rowsActive.length - 1].month : 0;
    const interestAfter = rowsActive.reduce((sum, r) => sum + r.interest, 0);

    const monthsSavedForDebt = Math.max(0, monthsBefore - monthsAfter);
    const interestSavedForDebt = Math.max(0, interestBefore - interestAfter);

    return {
      debt,
      isTarget,
      debtAccelerator: accelerator, // Habilita la visualización comparativa global
      monthsBefore,
      interestBefore,
      monthsAfter,
      interestAfter,
      monthsSavedForDebt,
      interestSavedForDebt
    };
  }),
    [sortedDebtsForComparison, scenarioBase, reportWithStrategy, accelerator]
  );

  // Descargar plan de pagos en formato XLSX con diseño y estilos avanzados
  const downloadPlan = (planRows: PaymentRow[]) => {
    const rowsAOA: any[][] = [];

    // Fila 1 - Título Principal
    rowsAOA.push(["DEUDAS//ZERO — Plan de Pagos", "", "", "", "", ""]);

    // Fila 2 - Subtítulo
    const fecha = new Date().toISOString().slice(0, 10);
    const strategyName = strategy === 'avalanche' ? 'Amortización Agresiva (Avalancha)' : 'Amortización Progresiva (Bola de Nieve)';
    const subtitulo = `Generado el ${fecha} · Estrategia: ${strategyName} · Acelerador: ${currencySymbol}${formatCurrency(accelerator)}`;
    rowsAOA.push([subtitulo, "", "", "", "", ""]);

    // Fila 3 - Vacía (separador)
    rowsAOA.push(["", "", "", "", "", ""]);

    // Fila 4 - Headers de columnas
    rowsAOA.push(["MES", "DEUDA", "CUOTA MÍN.", "ABONO EXTRA", "INTERÉS", "SALDO"]);

    // Filas de datos
    planRows.forEach(row => {
      rowsAOA.push([
        `#${String(row.month).padStart(2, '0')}`,
        row.debtName,
        Math.round(row.minPayment),
        row.extraPayment > 0 ? Math.round(row.extraPayment) : "—",
        Math.round(row.interest),
        Math.round(row.balance)
      ]);
    });

    // Fila de totales
    const sumMin = planRows.reduce((s, r) => s + r.minPayment, 0);
    const sumExtra = planRows.reduce((s, r) => s + r.extraPayment, 0);
    const sumInt = planRows.reduce((s, r) => s + r.interest, 0);
    rowsAOA.push([
      "TOTAL",
      "",
      Math.round(sumMin),
      Math.round(sumExtra),
      Math.round(sumInt),
      ""
    ]);

    // Crear hoja y libro
    const ws = XLSXStyle.utils.aoa_to_sheet(rowsAOA);
    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Plan de Pagos');

    // Configurar merges de celdas
    const lastRowIndex = rowsAOA.length - 1;
    ws['!merges'] = [
      // Título: A1 hasta F1 (r:0, c:0 a r:0, c:5)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      // Subtítulo: A2 hasta F2 (r:1, c:0 a r:1, c:5)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      // TOTAL: A[last] hasta B[last] (r:last, c:0 a r:last, c:1)
      { s: { r: lastRowIndex, c: 0 }, e: { r: lastRowIndex, c: 1 } }
    ];

    // Configurar alturas de fila
    const wsRows = [
      { hpt: 30 }, // Fila 1: Título
      { hpt: 20 }, // Fila 2: Subtítulo
      { hpt: 10 }, // Fila 3: Separador
      { hpt: 22 }  // Fila 4: Headers
    ];
    for (let i = 0; i < planRows.length; i++) {
      wsRows.push({ hpt: 18 }); // Filas de datos
    }
    wsRows.push({ hpt: 22 }); // Fila de totales
    ws['!rows'] = wsRows;

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 8 },   // A: Mes
      { wch: 22 },  // B: Deuda
      { wch: 16 },  // C: Cuota mín.
      { wch: 16 },  // D: Abono extra
      { wch: 14 },  // E: Interés
      { wch: 18 }   // F: Saldo
    ];

    // --- ESTILOS DE CELDAS — HOJA 1 ---
    const titleStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "820AD1" } },
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const subtitleStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "F4E8FF" } },
      font: { italic: true, sz: 10, color: { rgb: "820AD1" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const headerStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "F4E8FF" } },
      font: { bold: true, sz: 10, color: { rgb: "333333" } },
      border: { bottom: { style: "medium", color: { rgb: "820AD1" } } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const totalStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "820AD1" } },
      font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    // Aplicar estilo de Título (Fila 1)
    for (let col = 0; col < 6; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = titleStyle;
    }

    // Aplicar estilo de Subtítulo (Fila 2)
    for (let col = 0; col < 6; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: 1, c: col });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = subtitleStyle;
    }

    // Aplicar estilo de Headers (Fila 4)
    for (let col = 0; col < 6; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: 3, c: col });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = headerStyle;
    }

    // Aplicar estilo de Filas de Datos
    const seenMonths = new Set<number>();
    planRows.forEach((row, i) => {
      const rowIndex = 4 + i;
      const isTarget = row.extraPayment > 0;
      const bgColor = isTarget ? "F9F0FF" : "FFFFFF";
      const isFirstRow = !seenMonths.has(row.month);
      seenMonths.add(row.month);

      for (let col = 0; col < 6; col++) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: rowIndex, c: col });
        const cell = ws[cellRef];
        if (!cell) continue;

        const s: any = {
          fill: { patternType: "solid", fgColor: { rgb: bgColor } },
          font: { sz: 10, color: { rgb: "333333" } },
          alignment: { vertical: "center" }
        };

        if (isFirstRow) {
          s.border = {
            top: { style: "thin", color: { rgb: "E0E0E0" } }
          };
        }

        if (col === 0) {
          s.alignment.horizontal = "center";
        } else if (col === 1) {
          s.alignment.horizontal = "left";
        } else if (col === 2) {
          s.alignment.horizontal = "right";
          s.numFmt = '#,##0';
          cell.z = '#,##0';
        } else if (col === 3) {
          if (row.extraPayment > 0) {
            s.font.color = { rgb: "820AD1" };
            s.font.bold = true;
            s.alignment.horizontal = "right";
            s.numFmt = '#,##0';
            cell.z = '#,##0';
          } else {
            s.font.color = { rgb: "999999" };
            s.alignment.horizontal = "center";
          }
        } else if (col === 4) {
          s.alignment.horizontal = "right";
          s.numFmt = '#,##0';
          cell.z = '#,##0';
        } else if (col === 5) {
          s.alignment.horizontal = "right";
          s.numFmt = '#,##0';
          cell.z = '#,##0';
        }

        cell.s = s;
      }
    });

    // Aplicar estilo de Totales
    for (let col = 0; col < 6; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: lastRowIndex, c: col });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

      const s: any = JSON.parse(JSON.stringify(totalStyle));

      if (col === 0 || col === 1) {
        s.alignment.horizontal = "center";
      } else if (col === 2 || col === 3 || col === 4) {
        s.alignment.horizontal = "right";
        s.numFmt = '#,##0';
        ws[cellRef].z = '#,##0';
      } else if (col === 5) {
        s.alignment.horizontal = "right";
      }

      ws[cellRef].s = s;
    }

    // --- HOJA ADICIONAL — Resumen ---
    const summaryAOA: any[][] = [];

    // Fila 1: Título
    summaryAOA.push(["Resumen por Deuda", "", "", "", ""]);

    // Fila 2: Headers
    summaryAOA.push(["DEUDA", "MESES SIN PLAN", "MESES CON PLAN", "INTERÉS TOTAL", "AHORRO"]);

    // Preparar datos por deuda
    const debtsToProcess = [...debts].sort((a, b) => {
      if (strategy === 'avalanche') {
        return b.annualRate - a.annualRate;
      } else {
        return a.balance - b.balance;
      }
    });

    let sumInterestAfter = 0;
    let sumAhorro = 0;

    const scenarioBase = simulatePayoff(debts, 0, strategy);

    debtsToProcess.forEach(d => {
      const rowsBase = scenarioBase.filter(r => r.debtId === d.id);
      const monthsBefore = rowsBase.length > 0 ? rowsBase[rowsBase.length - 1].month : 0;
      const interestBefore = rowsBase.reduce((sum, r) => sum + r.interest, 0);

      const rowsActive = planRows.filter(r => r.debtId === d.id);
      const monthsAfter = rowsActive.length > 0 ? rowsActive[rowsActive.length - 1].month : 0;
      const interestAfter = rowsActive.reduce((sum, r) => sum + r.interest, 0);

      const ahorro = Math.max(0, interestBefore - interestAfter);

      summaryAOA.push([
        d.name,
        monthsBefore,
        monthsAfter,
        Math.round(interestAfter),
        Math.round(ahorro)
      ]);

      sumInterestAfter += interestAfter;
      sumAhorro += ahorro;
    });

    // Fila de totales
    summaryAOA.push([
      "TOTAL",
      "—",
      "—",
      Math.round(sumInterestAfter),
      Math.round(sumAhorro)
    ]);

    // Crear hoja de resumen
    const wsSummary = XLSXStyle.utils.aoa_to_sheet(summaryAOA);
    XLSXStyle.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    // Configurar merges de resumen
    const lastSummaryRowIndex = summaryAOA.length - 1;
    wsSummary['!merges'] = [
      // Título: A1 hasta E1
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      // TOTAL: A[last] hasta B[last]
      { s: { r: lastSummaryRowIndex, c: 0 }, e: { r: lastSummaryRowIndex, c: 1 } }
    ];

    // Alturas de fila de resumen
    const wsSummaryRows = [
      { hpt: 30 }, // Título
      { hpt: 22 }  // Headers
    ];
    for (let i = 0; i < debtsToProcess.length; i++) {
      wsSummaryRows.push({ hpt: 18 });
    }
    wsSummaryRows.push({ hpt: 22 }); // Totales
    wsSummary['!rows'] = wsSummaryRows;

    // Anchos de columna de resumen
    wsSummary['!cols'] = [
      { wch: 22 },  // A: Deuda
      { wch: 18 },  // B: Meses sin plan
      { wch: 18 },  // C: Meses con plan
      { wch: 16 },  // D: Interés total
      { wch: 16 }   // E: Ahorro
    ];

    // Aplicar estilos a Hoja 2 — Resumen
    // Título (Fila 1)
    for (let col = 0; col < 5; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: 0, c: col });
      if (!wsSummary[cellRef]) wsSummary[cellRef] = { t: 's', v: '' };
      wsSummary[cellRef].s = titleStyle;
    }

    // Headers (Fila 2)
    for (let col = 0; col < 5; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: 1, c: col });
      if (!wsSummary[cellRef]) wsSummary[cellRef] = { t: 's', v: '' };
      wsSummary[cellRef].s = headerStyle;
    }

    // Filas de datos
    debtsToProcess.forEach((d, i) => {
      const rowIndex = 2 + i;
      for (let col = 0; col < 5; col++) {
        const cellRef = XLSXStyle.utils.encode_cell({ r: rowIndex, c: col });
        const cell = wsSummary[cellRef];
        if (!cell) continue;

        const s: any = {
          fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
          font: { sz: 10, color: { rgb: "333333" } },
          alignment: { vertical: "center" }
        };

        if (col === 0) {
          s.alignment.horizontal = "left";
        } else if (col === 1 || col === 2) {
          s.alignment.horizontal = "center";
        } else if (col === 3) {
          s.alignment.horizontal = "right";
          s.numFmt = '#,##0';
          cell.z = '#,##0';
        } else if (col === 4) {
          s.font.color = { rgb: "820AD1" };
          s.font.bold = true;
          s.alignment.horizontal = "right";
          s.numFmt = '#,##0';
          cell.z = '#,##0';
        }

        cell.s = s;
      }
    });

    // Fila de totales
    for (let col = 0; col < 5; col++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r: lastSummaryRowIndex, c: col });
      if (!wsSummary[cellRef]) wsSummary[cellRef] = { t: 's', v: '' };

      const s: any = {
        fill: { patternType: "solid", fgColor: { rgb: "820AD1" } },
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        alignment: { vertical: "center" }
      };

      if (col === 0 || col === 1) {
        s.alignment.horizontal = "center";
      } else if (col === 2) {
        s.alignment.horizontal = "center";
      } else if (col === 3 || col === 4) {
        s.alignment.horizontal = "right";
        s.numFmt = '#,##0';
        wsSummary[cellRef].z = '#,##0';
      }

      wsSummary[cellRef].s = s;
    }

    // Exportar archivo
    XLSXStyle.writeFile(wb, `deudas-zero-plan-${fecha}.xlsx`);
  };

  const exportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      debts,
      accelerator,
      strategy,
      currency,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deudas-zero-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!data || typeof data.version !== 'number' || !Array.isArray(data.debts)) {
          setImportError('Archivo inválido: formato no reconocido.');
          return;
        }
        const validDebts: Debt[] = data.debts.filter(
          (d: any): d is Debt =>
            d != null &&
            typeof d.id === 'string' &&
            typeof d.name === 'string' &&
            typeof d.balance === 'number' && d.balance > 0 &&
            typeof d.annualRate === 'number'
        );
        setImportPreview({ debts: validDebts, count: validDebts.length });
        setShowImportModal(true);
      } catch {
        setImportError('Error al leer el archivo. Asegúrate de que es un JSON válido.');
      }
      if (importDataRef.current) importDataRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!importPreview) return;
    setDebts(importPreview.debts);
    setShowImportModal(false);
    setImportPreview(null);
    setImportError(null);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setDebts(prev => prev.filter(d => d.id !== deleteConfirmId));
    if (editingId === deleteConfirmId) {
      setShowForm(false);
      setEditingId(null);
    }
    setDeleteConfirmId(null);
  };

  // Auxiliares locales para mutar preferencias de rango
  function handleAcceleratorChange(val: number) {
    setAccelerator(val);
  }

  function handleStrategyChange(strat: 'avalanche' | 'snowball') {
    setStrategy(strat);
  }

  return (
    <div className="phone-frame-wrapper">


      {/* CARCASA FÍSICA DEL SMARTPHONE */}
      <div className="phone-mockup">
        {/* Notch físico */}
        <div className="phone-notch" />

        {/* TOP BAR / LOGO & CURRENCY SELECTOR */}
        <div className="app-global-header">
          <div className="header-brand">DEUDAS//ZERO</div>

          {/* Menú de navegación superior para Escritorio/Tablet */}
          <div className="desktop-nav-tabs desktop-only">
            <button 
              type="button" 
              className={`desktop-nav-item ${activeTab === 1 ? 'active' : ''}`}
              onClick={() => {
                setTooltipVisible(false);
                setActiveTab(1);
              }}
            >
              Mis Deudas
            </button>
            <button 
              type="button" 
              className={`desktop-nav-item ${activeTab === 2 ? 'active' : ''}`}
              disabled={debts.length === 0}
              onClick={() => {
                setTooltipVisible(false);
                setActiveTab(2);
              }}
            >
              Estrategia
            </button>
            <button 
              type="button" 
              className={`desktop-nav-item ${activeTab === 3 ? 'active' : ''}`}
              disabled={debts.length === 0}
              onClick={() => {
                setTooltipVisible(false);
                setActiveTab(3);
              }}
            >
              Plan de Pagos
            </button>
          </div>
          
          <div className="currency-selector-container" ref={currencyRef}>
            <button
              type="button"
              className="currency-selector-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className={`fi fi-${activeCurrency.countryCode}`} style={{ width: '1.2em', display: 'inline-block', borderRadius: '2px', marginRight: '4px' }}></span>
              <span>{activeCurrency.code}</span>
            </button>
            
            <div className={`currency-dropdown ${dropdownOpen ? 'show' : ''}`}>
              {CURRENCIES.map(c => (
                <div
                  key={c.code}
                  className={`currency-dropdown-item ${c.code === currency ? 'active' : ''}`}
                  onClick={() => {
                    setCurrency(c.code);
                    localStorage.setItem('currency', c.code);
                    setDropdownOpen(false);
                  }}
                >
                  <span className="dropdown-flag-code">
                    <span className={`fi fi-${c.countryCode}`} style={{ width: '1.2em', display: 'inline-block', borderRadius: '2px' }}></span>
                    <span>{c.code}</span>
                  </span>
                  {c.code === currency && <span className="dropdown-check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENEDOR INTERNO DE VISTAS (SCROLLABLE VIEWPORT) */}
        <div className="phone-viewport">
          
          {/* ==========================================
              TAB 1: MIS DEUDAS
             ========================================== */}
          {activeTab === 1 && (
            <div className="animate-fade-in">
              {debts.length === 0 ? (
                /* CAMBIO 3: HERO STATE */
                <div className="hero-state-container">
                  <h2 className="hero-title">Registra tu primera deuda</h2>
                  <p className="hero-subtitle">Empieza agregando un crédito para ver tu plan de pago</p>

                  <div className="glass-card hero-form-card">
                    <form onSubmit={handleSubmitForm}>
                      <div className="form-group">
                        <label className="form-label hero-label">Nombre</label>
                        <input
                          type="text"
                          className="form-input hero-input"
                          placeholder="Ej: Tarjeta Visa"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label hero-label">Saldo Pendiente ({currencySymbol})</label>
                        <input
                          type="number"
                          className="form-input hero-input"
                          placeholder="0"
                          min="1"
                          step="any"
                          value={formBalance}
                          onChange={(e) => setFormBalance(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label hero-label">Tasa Anual % (TEA)</label>
                        <input
                          type="number"
                          className="form-input hero-input"
                          placeholder="0.00"
                          min="0"
                          step="any"
                          value={formRate}
                          onChange={(e) => setFormRate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label hero-label">Cuotas totales</label>
                        <input
                          type="number"
                          className="form-input hero-input"
                          placeholder="Ej: 36"
                          min="1"
                          step="1"
                          value={formInstallments}
                          onChange={(e) => setFormInstallments(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '14px 28px', fontSize: '0.9rem' }}>
                          Guardar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* VISTA REGULAR CON LISTA Y FORMULARIO ACORDEÓN */
                <div>
                  <div className="screen-header">
                    <h2 className="screen-title">Mis Deudas</h2>
                    <p className="screen-desc">Registra y edita tus tarjetas o préstamos</p>
                  </div>

                  {/* Botones de respaldo de datos */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={exportData}
                    >
                      ↓ Exportar datos
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-xs"
                      onClick={() => importDataRef.current?.click()}
                    >
                      ↑ Importar datos
                    </button>
                    <input
                      ref={importDataRef}
                      type="file"
                      accept="application/json"
                      style={{ display: 'none' }}
                      onChange={handleImportFile}
                    />
                  </div>
                  {importError && (
                    <div style={{
                      color: '#EF4444', fontSize: '0.78rem', marginBottom: '8px',
                      padding: '8px 12px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>{importError}</span>
                      <button
                        onClick={() => setImportError(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', marginLeft: '8px' }}
                      >✕</button>
                    </div>
                  )}

                  <div className={showForm ? "desktop-grid-2col" : ""}>
                    {/* Panel Izquierdo: Formulario o Botón */}
                    <div style={showForm ? { position: 'sticky', top: '0', zIndex: 10 } : {}}>
                      {showForm ? (
                        <div className="glass-card animate-fade-in" style={{ borderColor: '#820AD1', background: '#FAFAFA' }}>
                          <h3 className="form-label" style={{ marginBottom: '14px', color: '#820AD1' }}>
                            {editingId ? 'Editar Crédito' : 'Registrar Crédito'}
                          </h3>
                          <form onSubmit={handleSubmitForm}>
                            <div className="form-group">
                              <label className="form-label">Nombre</label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: Tarjeta Visa"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">Saldo Pendiente ({currencySymbol})</label>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                min="1"
                                step="any"
                                value={formBalance}
                                onChange={(e) => setFormBalance(e.target.value)}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">Tasa Anual % (TEA)</label>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                min="0"
                                step="any"
                                value={formRate}
                                onChange={(e) => setFormRate(e.target.value)}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Cuotas totales</label>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="Ej: 36"
                                min="1"
                                step="1"
                                value={formInstallments}
                                onChange={(e) => setFormInstallments(e.target.value)}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                              <button type="submit" className="btn-primary flex-1">
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                  setShowForm(false);
                                  setEditingId(null);
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleOpenAddForm}
                          style={{ marginBottom: '16px' }}
                        >
                          <span style={{ fontSize: '1.1rem' }}>+</span> Registrar Nueva Deuda
                        </button>
                      )}
                    </div>

                    {/* Panel Derecho: Listado de deudas */}
                    <div>
                      {debts.map((debt) => (
                        <div key={debt.id} className="glass-card">
                          <div className="debt-card-header">
                            <h4 className="debt-name">{debt.name}</h4>
                            <span className="debt-card-rate-badge">{debt.annualRate}% TEA</span>
                          </div>

                          <div className="debt-card-body">
                            <div>
                              <span className="debt-balance-lbl">Saldo adeudado</span>
                              <div className="debt-balance-val">
                                {currencySymbol} {formatCurrency(debt.balance)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {debt.installments !== undefined && (
                                <div className="debt-installments" style={{ fontSize: '0.75rem', color: '#6E7E8C', marginBottom: '4px' }}>
                                  {debt.installments} cuotas
                                </div>
                              )}
                              <div className="debt-min-payment" style={{ fontSize: '0.75rem', color: '#6E7E8C' }}>
                                Cuota est. {currencySymbol} {formatCurrency(Math.round(calcMinPayment(debt.balance, debt.annualRate, debt.installments)))}
                                <span style={{ display: 'block', fontSize: '0.62rem', color: '#8C96A3', fontStyle: 'italic', marginTop: '2px' }}>
                                  calculada automáticamente
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="debt-card-actions">
                            <button
                              type="button"
                              className="btn-secondary btn-xs"
                              onClick={() => handleEditClick(debt)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn-secondary btn-xs btn-danger-action"
                              onClick={() => handleDeleteClick(debt.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 2: ESTRATEGIA Y ACELERADOR
             ========================================== */}
          {activeTab === 2 && (
            <div className="animate-fade-in">
              <div className="screen-header">
                <h2 className="screen-title">Estrategia</h2>
                <p className="screen-desc">Acelera tus pagos y compara las proyecciones</p>
              </div>

              {debts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', color: '#8C96A3', fontSize: '0.8rem' }}>
                  Ingresa deudas en el Paso 1 para simular tus ahorros.
                </div>
              ) : (
                <div className="desktop-grid-2col">
                  {/* Panel Izquierdo: Configuración de Estrategia */}
                  <div>
                    {/* Control Acelerador Mensual Extra */}
                    <div className="glass-card accelerator-card">
                      <div className="slider-header">
                        <span className="slider-title">Abono Extra Mensual</span>
                        <span className="slider-value">{currencySymbol} {formatCurrency(accelerator)}</span>
                      </div>
                      <input
                        type="range"
                        className="acc-slider"
                        min={activeCurrency.slider.min}
                        max={activeCurrency.slider.max}
                        step={activeCurrency.slider.step}
                        value={accelerator}
                        onChange={(e) => handleAcceleratorChange(Number(e.target.value))}
                      />
                      
                      {/* Presets de Acelerador */}
                      <div className="acc-presets">
                        {activeCurrency.presets.map((val) => (
                          <button
                            key={val}
                            type="button"
                            className="acc-preset-btn"
                            onClick={() => handleAcceleratorChange(val)}
                          >
                            +{currencySymbol}{formatCurrency(val)}
                          </button>
                        ))}
                        {accelerator > 0 && (
                          <button
                            type="button"
                            className="acc-preset-btn"
                            onClick={() => handleAcceleratorChange(0)}
                            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Selector de Filosofía */}
                    <h3 className="strat-selector-title">Filosofía de Amortización</h3>
                    <div className="strategy-grid">
                      <div
                        className={`strat-card-option ${strategy === 'avalanche' ? 'active' : ''}`}
                        onClick={() => handleStrategyChange('avalanche')}
                      >
                        <h4>Amortización Agresiva</h4>
                        <p>Método Avalancha. Prioriza pagar la deuda de tasa más alta primero.</p>
                        <span className="strat-indicator">
                          {strategy === 'avalanche' ? 'Activo' : 'Elegir'}
                        </span>
                      </div>

                      <div
                        className={`strat-card-option ${strategy === 'snowball' ? 'active' : ''}`}
                        onClick={() => handleStrategyChange('snowball')}
                      >
                        <h4>Amortización Progresiva</h4>
                        <p>Método Bola de Nieve. Prioriza pagar el menor saldo primero.</p>
                        <span className="strat-indicator">
                          {strategy === 'snowball' ? 'Activo' : 'Elegir'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel Derecho: Ahorros Proyectados */}
                  <div>
                    <h3 className="comparison-title" style={{ marginTop: 0 }}>Ahorros Proyectados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {individualDebtsProjections.map(({
                        debt,
                        isTarget,
                        debtAccelerator,
                        monthsBefore,
                        interestBefore,
                        monthsAfter,
                        interestAfter,
                        monthsSavedForDebt,
                        interestSavedForDebt
                      }) => {
                        const showComparison = debtAccelerator > 0;

                        return (
                          <div key={debt.id} className="debt-comparison-card">
                            {/* ENCABEZADO */}
                            <div className="debt-comparison-header">
                              {debt.name}
                            </div>

                            {/* FILA 1 — Meses */}
                            <div className="debt-comparison-row">
                              <span className="debt-comparison-label">Tiempo para liquidar</span>
                              {showComparison ? (
                                <div className="debt-comparison-values">
                                  <span className="debt-comparison-val-before">{monthsBefore} meses</span>
                                  <span className="debt-comparison-arrow">→</span>
                                  <span className="debt-comparison-val-after">{monthsAfter} meses</span>
                                  <span className="debt-comparison-pill">−{monthsSavedForDebt} meses</span>
                                </div>
                              ) : (
                                <div className="debt-comparison-values">
                                  <span className="debt-comparison-val-after">{monthsBefore} meses</span>
                                </div>
                              )}
                            </div>

                            {/* FILA 2 — Interés */}
                            <div className="debt-comparison-row">
                              <span className="debt-comparison-label">Interés total</span>
                              {showComparison ? (
                                <div className="debt-comparison-values">
                                  <span className="debt-comparison-val-before">{currencySymbol}{formatCurrency(interestBefore)}</span>
                                  <span className="debt-comparison-arrow">→</span>
                                  <span className="debt-comparison-val-after">{currencySymbol}{formatCurrency(interestAfter)}</span>
                                  <span className="debt-comparison-pill">−{currencySymbol}{formatCurrency(interestSavedForDebt)}</span>
                                </div>
                              ) : (
                                <div className="debt-comparison-values">
                                  <span className="debt-comparison-val-after">{currencySymbol}{formatCurrency(interestBefore)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 3: PLAN DE PAGOS (TABLA CRONOLÓGICA)
             ========================================== */}
          {activeTab === 3 && (
            <div className="animate-fade-in">
              <div className="screen-header">
                <h2 className="screen-title">Plan de Pagos</h2>
                <p className="screen-desc">Tu agenda mes a mes de amortización</p>
              </div>

              {debts.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', color: '#8C96A3', fontSize: '0.8rem' }}>
                  Registra créditos en el Paso 1 para generar tu plan cronológico.
                </div>
              ) : (
                <>
                  <div className="btn-download-container">
                    <button
                      type="button"
                      className="btn-download-plan"
                      onClick={() => downloadPlan(reportWithStrategy)}
                    >
                      ↓ Descargar plan
                    </button>
                  </div>
                  <div className="plan-table-container">
                    {reportWithStrategy.length === 0 ? (
                      <div className="no-data-msg">No se pudo simular. Revisa los saldos y tasas.</div>
                    ) : (
                      <table className="plan-table">
                        <thead>
                          <tr>
                            <th>Mes</th>
                            <th>Deuda</th>
                            <th className="text-right">Cuota Mín.</th>
                            <th className="text-right">Abono Extra</th>
                            <th className="text-right">Interés</th>
                            <th className="text-right">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedMonths.slice(0, 120).map((group) => (
                            <React.Fragment key={group.month}>
                              {group.rows.map((row, idx) => (
                                <tr key={`${group.month}-${row.debtId}`}>
                                  {idx === 0 && (
                                    <td
                                      className="td-month-grouped"
                                      rowSpan={group.rows.length}
                                    >
                                      #{group.month.toString().padStart(2, '0')}
                                    </td>
                                  )}
                                  <td className="td-name">{row.debtName}</td>
                                  <td className="text-right">
                                    {currencySymbol}{formatCurrency(row.minPayment)}
                                  </td>
                                  <td className="text-right">
                                    {row.extraPayment > 0 ? (
                                      <span className="abono-extra-badge">
                                        {currencySymbol}{formatCurrency(row.extraPayment)}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94A3B8' }}>—</span>
                                    )}
                                  </td>
                                  <td className="text-right td-interest">
                                    {currencySymbol}{formatCurrency(row.interest)}
                                  </td>
                                  <td className="text-right td-balance">
                                    {currencySymbol}{formatCurrency(row.balance)}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Toast de Éxito de la Guía */}
        <div className={`success-toast ${toastVisible ? 'show' : ''}`}>
          ¡Deuda registrada! Ahora configura tu estrategia.
        </div>

        {/* Tooltip de la Guía */}
        <div className={`tab-tooltip ${tooltipVisible ? 'show' : ''}`} onClick={() => setTooltipVisible(false)}>
          Configura tu plan aquí 👉
        </div>

        {/* Modal de confirmación de importación */}
        {showImportModal && importPreview && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, borderRadius: 'inherit'
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: '20px', padding: '24px',
              maxWidth: '320px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px', color: '#333' }}>
                ¿Restaurar datos?
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6E7E8C', marginBottom: '16px', lineHeight: 1.4 }}>
                Se reemplazarán tus {debts.length} deuda(s) actuales con {importPreview.count} deuda(s)
                del archivo. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary flex-1" style={{ padding: '10px' }} onClick={confirmImport}>
                  Sí, restaurar
                </button>
                <button className="btn-secondary" onClick={() => { setShowImportModal(false); setImportPreview(null); }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de borrado */}
        {deleteConfirmId && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, borderRadius: 'inherit'
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: '20px', padding: '24px',
              maxWidth: '300px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '8px', color: '#333' }}>
                ¿Eliminar esta deuda?
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6E7E8C', marginBottom: '16px' }}>
                Se borrará de tu perfil. Puedes exportar tus datos antes si lo deseas.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary flex-1"
                  style={{ padding: '10px', background: '#EF4444', boxShadow: 'none' }}
                  onClick={confirmDelete}
                >
                  Eliminar
                </button>
                <button className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🏠 NAVEGACIÓN TÁCTIL MÓVIL (BOTTOM TAB BAR) */}
        <div className="phone-bottom-nav">
          <button
            type="button"
            className={`phone-nav-item ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => {
              setTooltipVisible(false);
              setActiveTab(1);
            }}
          >
            <span className="phone-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            <span className="phone-nav-label">Deudas</span>
          </button>

          <button
            type="button"
            className={`phone-nav-item ${activeTab === 2 ? 'active' : ''} ${pulseActive ? 'pulse-animation' : ''}`}
            onClick={() => {
              setTooltipVisible(false);
              if (debts.length > 0) setActiveTab(2);
            }}
            disabled={debts.length === 0}
            style={{ 
              opacity: debts.length === 0 ? 0.35 : 1,
              transition: 'all 0.2s ease-out'
            }}
          >
            <span className={`phone-nav-icon ${pulseIndigoColor && activeTab !== 2 ? 'indigo-icon' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="20" x2="6" y2="14" />
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
              </svg>
            </span>
            <span className="phone-nav-label" style={{ color: pulseIndigoColor && activeTab !== 2 ? '#4f46e5' : undefined }}>Estrategia</span>
          </button>

          <button
            type="button"
            className={`phone-nav-item ${activeTab === 3 ? 'active' : ''}`}
            onClick={() => {
              setTooltipVisible(false);
              if (debts.length > 0) setActiveTab(3);
            }}
            disabled={debts.length === 0}
            style={{ opacity: debts.length === 0 ? 0.35 : 1 }}
          >
            <span className="phone-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            <span className="phone-nav-label">Plan</span>
          </button>
        </div>

      </div>
    </div>
  );

}

export default App;
