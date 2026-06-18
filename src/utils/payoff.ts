// ==========================================
// TIPOS EXPORTADOS
// ==========================================

export interface PayoffDebt {
  id: string;
  name: string;
  balance: number;
  annualRate: number;
  installments?: number;
  createdAt: number;
}

export interface PaymentRow {
  month: number;
  debtId: string;
  debtName: string;
  minPayment: number;
  extraPayment: number;
  payment: number;
  interest: number;
  balance: number;
}

// ==========================================
// FUNCIONES PURAS DE CÁLCULO FINANCIERO
// ==========================================

/**
 * Convierte una Tasa Efectiva Anual (TEA) a tasa mensual equivalente.
 * Fórmula: (1 + annualRate/100)^(1/12) - 1
 */
export function teaToMonthlyRate(annualRate: number): number {
  if (annualRate <= 0) return 0;
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
}

/**
 * Calcula la cuota mínima mensual usando la fórmula de amortización con TEA.
 */
export function calcMinPayment(balance: number, annualRate: number, installments?: number): number {
  const inst = installments || 0;
  if (inst <= 0) return balance;
  if (annualRate <= 0) return balance / inst;
  const i = teaToMonthlyRate(annualRate);
  const power = Math.pow(1 + i, inst);
  return (balance * i * power) / (power - 1);
}

/**
 * Simula el payoff mes a mes con acelerador aplicando la estrategia indicada.
 * Usa TEA para el cálculo de intereses mensuales.
 */
export function simulatePayoff(
  debts: PayoffDebt[],
  accelerator: number,
  strategy: 'avalanche' | 'snowball'
): PaymentRow[] {
  if (debts.length === 0) return [];

  // Clonar las deudas para no mutar el estado externo
  let activeDebts = debts.map(d => ({
    ...d,
    currentBalance: d.balance,
    calculatedMinPayment: calcMinPayment(d.balance, d.annualRate, d.installments)
  }));

  const initialMinSum = debts.reduce(
    (sum, d) => sum + calcMinPayment(d.balance, d.annualRate, d.installments),
    0
  );
  const totalMonthlyBudget = initialMinSum + accelerator;
  const schedule: PaymentRow[] = [];
  const maxMonths = 600; // Cap de seguridad para evitar bucles infinitos

  for (let month = 1; month <= maxMonths; month++) {
    // 1. Filtrar deudas activas con saldo real
    const remainingDebts = activeDebts.filter(d => d.currentBalance > 0.01);
    if (remainingDebts.length === 0) break;

    // Crear un mapa temporal para registrar los detalles de este mes
    const monthDetailsMap: { [id: string]: { minPaid: number; interestAccrued: number; extraPaid: number } } = {};
    remainingDebts.forEach(d => {
      monthDetailsMap[d.id] = { minPaid: 0, interestAccrued: 0, extraPaid: 0 };
    });

    // A. Aplicar interés mensual (TEA convertida a mensual) a cada saldo
    remainingDebts.forEach(d => {
      const monthlyRate = teaToMonthlyRate(d.annualRate);
      const interestPart = d.currentBalance * monthlyRate;
      d.currentBalance += interestPart;
      monthDetailsMap[d.id].interestAccrued = interestPart;
    });

    // B. Pagar la cuota mínima de todas las deudas activas
    let totalMinsPaidThisMonth = 0;
    remainingDebts.forEach(d => {
      const minPayment = Math.min(d.calculatedMinPayment, d.currentBalance);
      d.currentBalance -= minPayment;
      monthDetailsMap[d.id].minPaid = minPayment;
      totalMinsPaidThisMonth += minPayment;
    });

    // C. Ordenar deudas según estrategia para aplicar abono extra
    // avalanche: mayor tasa anual primero
    // snowball:  menor saldo primero (después del pago mínimo)
    let debtsToAccelerate = remainingDebts.filter(d => d.currentBalance > 0.01);
    if (strategy === 'avalanche') {
      debtsToAccelerate.sort((a, b) => b.annualRate - a.annualRate);
    } else {
      debtsToAccelerate.sort((a, b) => a.currentBalance - b.currentBalance);
    }

    // D. Aplicar el acelerador completo a la deuda objetivo (primera de la lista)
    let acceleratorPool = Math.max(0, totalMonthlyBudget - totalMinsPaidThisMonth);
    if (debtsToAccelerate.length > 0 && acceleratorPool > 0) {
      const targetDebt = debtsToAccelerate[0];
      const extraPayment = Math.min(acceleratorPool, targetDebt.currentBalance);
      targetDebt.currentBalance -= extraPayment;
      monthDetailsMap[targetDebt.id].extraPaid = extraPayment;
    }

    // Guardar los detalles en el cronograma ordenados por el orden original
    const sortedActiveDebts = [...remainingDebts].sort((a, b) => {
      const indexA = debts.findIndex(d => d.id === a.id);
      const indexB = debts.findIndex(d => d.id === b.id);
      return indexA - indexB;
    });

    sortedActiveDebts.forEach(d => {
      const details = monthDetailsMap[d.id];
      schedule.push({
        month,
        debtId: d.id,
        debtName: d.name,
        minPayment: details.minPaid,
        extraPayment: details.extraPaid,
        payment: details.minPaid + details.extraPaid,
        interest: details.interestAccrued,
        balance: Math.max(0, d.currentBalance)
      });
    });

    // Seguridad: si el saldo total crece (amortización negativa), detener bucle
    const totalRemaining = activeDebts.reduce((sum, d) => sum + d.currentBalance, 0);
    if (
      totalRemaining >= debts.reduce((sum, d) => sum + d.balance, 0) &&
      accelerator === 0 &&
      month > 12
    ) {
      break;
    }
  }

  return schedule;
}
