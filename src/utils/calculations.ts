// @ts-nocheck
import { Debt, PayoffStrategy, OneTimePayment, AmortizationMonth, PayoffReport, DebtPaymentDetail } from '../types/debt';

export class FinanceCalculations {
  /**
   * Convierte la Tasa Efectiva Anual (TEA) en Tasa Efectiva Mensual Vencida (TEM)
   */
  static getMonthlyRate(annualRate: number): number {
    if (annualRate <= 0) return 0;
    return Math.pow(1 + annualRate / 100, 1 / 12) - 1;
  }

  /**
   * Calcula la cuota mensual fija por el Sistema Francés
   */
  static calculateMonthlyPayment(amount: number, annualRate: number, months: number): number {
    if (months <= 0) return 0;
    const i = this.getMonthlyRate(annualRate);
    if (i === 0) return amount / months;
    
    return (amount * i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1);
  }

  /**
   * Ejecuta la simulación mes a mes del pago de deudas en bloque
   */
  static simulatePayoff(
    debts: Debt[],
    monthlyAccelerator: number,
    strategy: PayoffStrategy,
    oneTimePayments: OneTimePayment[] = []
  ): PayoffReport {
    if (debts.length === 0) {
      return {
        strategy,
        months: 0,
        totalInterest: 0,
        totalPaid: 0,
        payoffHistory: [],
        interestSaved: 0,
        monthsSaved: 0,
      };
    }

    // Copia profunda de las deudas para el simulador
    let simulationDebts = debts.map((d) => ({
      ...d,
      currentBalance: d.balance,
      wasPaid: false,
    }));

    const payoffHistory: AmortizationMonth[] = [];
    let totalPaid = 0;
    let totalInterest = 0;
    const maxMonths = 600; // Límite de 50 años para evitar bucles infinitos

    // El presupuesto total mensual comprometido es la suma de los pagos mínimos iniciales más el acelerador
    const initialTotalMinimums = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const totalMonthlyBudget = initialTotalMinimums + monthlyAccelerator;

    for (let month = 1; month <= maxMonths; month++) {
      const activeDebtsBefore = simulationDebts.filter((d) => d.currentBalance > 0);
      if (activeDebtsBefore.length === 0) break;

      const totalStartingBalance = activeDebtsBefore.reduce((sum, d) => sum + d.currentBalance, 0);
      const extraThisMonth = oneTimePayments.find((p) => p.monthNumber === month)?.amount || 0;

      // 1. Calcular intereses para este mes
      const monthlyInterests = activeDebtsBefore.map((d) => {
        const rate = this.getMonthlyRate(d.annualRate);
        return {
          id: d.id!,
          interest: d.currentBalance * rate,
        };
      });

      const monthPayments: DebtPaymentDetail[] = [];
      let totalMinimumsPaidThisMonth = 0;

      // 2. Realizar los pagos mínimos obligatorios en todas las deudas activas
      // (Se cargan los intereses primero, luego se descuenta el pago mínimo)
      activeDebtsBefore.forEach((d) => {
        const interestObj = monthlyInterests.find((mi) => mi.id === d.id);
        const interestAccrued = interestObj ? interestObj.interest : 0;
        
        // Sumar interés al saldo antes del pago
        const balanceWithInterest = d.currentBalance + interestAccrued;
        
        // El pago mínimo no puede ser mayor que el saldo total con intereses
        const minPaymentAmount = Math.min(d.minimumPayment, balanceWithInterest);
        
        const interestPaid = Math.min(interestAccrued, minPaymentAmount);
        const principalPaid = Math.max(0, minPaymentAmount - interestPaid);

        d.currentBalance = balanceWithInterest - minPaymentAmount;
        totalMinimumsPaidThisMonth += minPaymentAmount;
        totalInterest += interestPaid;

        monthPayments.push({
          debtId: d.id!,
          debtName: d.name,
          paymentAmount: minPaymentAmount,
          interestPaid,
          principalPaid,
          remainingBalance: d.currentBalance,
          isPaidOff: d.currentBalance <= 0.01,
        });
      });

      // 3. Reunir el pozo de Aceleración (Efecto Bola de Nieve / Avalancha)
      // El pozo de abonos es el presupuesto comprometido inicial menos los mínimos requeridos realmente este mes,
      // más el abono extraordinario único de este mes.
      // (Al liquidar deudas, el dinero que antes iba a sus mínimos ahora se suma al pozo)
      let acceleratorPool = 0;
      if (strategy !== 'minima') {
        acceleratorPool = Math.max(0, totalMonthlyBudget - totalMinimumsPaidThisMonth) + extraThisMonth;
      } else {
        acceleratorPool = extraThisMonth; // Si es mínima, solo se aplican abonos únicos si los hay
      }

      // 4. Distribuir el Acelerador a la deuda prioritaria según la estrategia
      const newlyPaidDebts: string[] = [];
      
      if (acceleratorPool > 0) {
        // Ordenar deudas según estrategia
        let priorityDebts = [...simulationDebts].filter((d) => d.currentBalance > 0);

        if (strategy === 'agresiva') {
          // Amortización Agresiva (Avalancha): Mayor tasa de interés primero, luego saldo mayor
          priorityDebts.sort((a, b) => {
            if (b.annualRate !== a.annualRate) {
              return b.annualRate - a.annualRate;
            }
            return b.currentBalance - a.currentBalance;
          });
        } else if (strategy === 'progresiva') {
          // Amortización Progresiva (Bola de Nieve): Menor saldo primero, luego tasa mayor
          priorityDebts.sort((a, b) => {
            if (a.currentBalance !== b.currentBalance) {
              return a.currentBalance - b.currentBalance;
            }
            return b.annualRate - a.annualRate;
          });
        }

        // Aplicar abonos del pozo a las deudas prioritarias en cadena
        for (const targetDebt of priorityDebts) {
          if (acceleratorPool <= 0) break;

          const currentDebtBalance = targetDebt.currentBalance;
          const paymentToApply = Math.min(currentDebtBalance, acceleratorPool);

          // Actualizar saldo de la deuda
          targetDebt.currentBalance -= paymentToApply;
          acceleratorPool -= paymentToApply;

          // Buscar el registro de pago para este mes y actualizarlo con el abono extra
          const paymentRecord = monthPayments.find((p) => p.debtId === targetDebt.id);
          if (paymentRecord) {
            paymentRecord.paymentAmount += paymentToApply;
            paymentRecord.principalPaid += paymentToApply;
            paymentRecord.remainingBalance = targetDebt.currentBalance;
            paymentRecord.isPaidOff = targetDebt.currentBalance <= 0.01;
          }
        }
      }

      // 5. Detectar deudas liquidadas este mes
      simulationDebts.forEach((d) => {
        if (!d.wasPaid && d.currentBalance <= 0.01) {
          d.currentBalance = 0;
          d.wasPaid = true;
          newlyPaidDebts.push(d.name);
        }
      });

      // Asegurar que ningún saldo quede por debajo de cero por redondeos decimales
      simulationDebts.forEach(d => {
        if (d.currentBalance < 0) d.currentBalance = 0;
      });

      const totalEndingBalance = simulationDebts.reduce((sum, d) => sum + d.currentBalance, 0);
      const totalMonthPaid = monthPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
      const totalMonthInterest = monthPayments.reduce((sum, p) => sum + p.interestPaid, 0);
      const totalMonthPrincipal = monthPayments.reduce((sum, p) => sum + p.principalPaid, 0);

      totalPaid += totalMonthPaid;

      payoffHistory.push({
        monthIndex: month,
        totalStartingBalance,
        totalEndingBalance,
        totalInterestPaid: totalMonthInterest,
        totalPrincipalPaid: totalMonthPrincipal,
        payments: monthPayments,
        newlyPaidDebts,
      });

      // Detección de bucle infinito en amortización negativa
      if (totalEndingBalance >= totalStartingBalance && monthlyAccelerator === 0 && strategy === 'minima' && month > 12) {
        // Los pagos mínimos no están logrando amortizar la deuda (los intereses superan el pago mínimo global)
        // Agregamos un mes final ficticio con advertencia para frenar el bucle y mostrar al usuario
        break;
      }
    }

    return {
      strategy,
      months: payoffHistory.length,
      totalInterest,
      totalPaid,
      payoffHistory,
      interestSaved: 0, // Se calcula comparando reportes más adelante
      monthsSaved: 0, // Se calcula comparando reportes más adelante
    };
  }

  /**
   * Genera el reporte comparativo cruzando las estrategias
   */
  static generateComparativeReport(
    debts: Debt[],
    monthlyAccelerator: number,
    oneTimePayments: OneTimePayment[] = []
  ): {
    agresiva: PayoffReport;
    progresiva: PayoffReport;
    minima: PayoffReport;
  } {
    // 1. Simular solo pago mínimo (Línea base)
    const reportMinima = this.simulatePayoff(debts, 0, 'minima', []);

    // 2. Simular método agresivo (Avalancha) con abonos
    const reportAgresiva = this.simulatePayoff(debts, monthlyAccelerator, 'agresiva', oneTimePayments);

    // 3. Simular método progresivo (Bola de Nieve) con abonos
    const reportProgresiva = this.simulatePayoff(debts, monthlyAccelerator, 'progresiva', oneTimePayments);

    // Calcular ahorros relativos frente al pago mínimo base
    reportAgresiva.interestSaved = Math.max(0, reportMinima.totalInterest - reportAgresiva.totalInterest);
    reportAgresiva.monthsSaved = Math.max(0, reportMinima.months - reportAgresiva.months);

    reportProgresiva.interestSaved = Math.max(0, reportMinima.totalInterest - reportProgresiva.totalInterest);
    reportProgresiva.monthsSaved = Math.max(0, reportMinima.months - reportProgresiva.months);

    return {
      agresiva: reportAgresiva,
      progresiva: reportProgresiva,
      minima: reportMinima,
    };
  }
}