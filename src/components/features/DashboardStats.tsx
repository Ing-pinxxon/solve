// @ts-nocheck
import React from 'react';
import { Debt, PayoffReport } from '../../types/debt';

interface DashboardStatsProps {
  debts: Debt[];
  activeReport: PayoffReport;
  currency: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ debts, activeReport, currency }) => {
  // 1. Deuda Total Inicial vs Deuda Total Actual
  const initialTotalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const currentTotalDebt = debts.reduce((sum, d) => sum + d.balance, 0); // En el estado actual inicial es igual, pero se muestra el total ingresado

  // 2. Tasa Promedio Ponderada (Weighted Average Interest Rate)
  let weightedRateSum = 0;
  let totalBalanceForWeight = 0;
  debts.forEach((d) => {
    weightedRateSum += d.balance * d.annualRate;
    totalBalanceForWeight += d.balance;
  });
  const weightedAverageRate = totalBalanceForWeight > 0 ? weightedRateSum / totalBalanceForWeight : 0;

  // 3. Formatear números en moneda local
  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // 4. Calcular fecha estimada de liberación
  const getReleaseDateLabel = (monthsCount: number) => {
    if (monthsCount <= 0) return '¡Hoy mismo!';
    const date = new Date();
    date.setMonth(date.getMonth() + monthsCount);
    
    const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    const formatted = formatter.format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Determinar color de la tasa promedio para alertas de usura (> 26% es alarmante)
  const getRateColorClass = (rate: number) => {
    if (rate >= 26) return 'text-danger';
    if (rate >= 16) return 'text-warning';
    return 'text-emerald';
  };

  return (
    <div className="stats-grid animate-fade-in">
      {/* Tarjeta 1: Total Deuda */}
      <div className="glass-card stat-card">
        <div className="stat-header">
          <span className="stat-label">DEUDA TOTAL ACUMULADA</span>
          <span className="stat-icon">💳</span>
        </div>
        <div className="stat-value mono-numbers text-gradient">
          {formatCurrency(initialTotalDebt)}
        </div>
        <div className="stat-footer">
          <span>{debts.length} {debts.length === 1 ? 'deuda registrada' : 'deudas registradas'}</span>
        </div>
      </div>

      {/* Tarjeta 2: Tasa Promedio Ponderada */}
      <div className="glass-card stat-card">
        <div className="stat-header">
          <span className="stat-label">TASA INTERÉS PONDERADA (TEA)</span>
          <span className="stat-icon">📈</span>
        </div>
        <div className="stat-value mono-numbers">
          <span className={getRateColorClass(weightedAverageRate)}>
            {weightedAverageRate.toFixed(2)}%
          </span>
        </div>
        <div className="stat-footer">
          {weightedAverageRate >= 26 ? (
            <span className="text-danger font-bold">⚠️ Alerta: Tasas con riesgo de usura</span>
          ) : (
            <span>Tasa de costo real promedio</span>
          )}
        </div>
      </div>

      {/* Tarjeta 3: Mes de Liberación */}
      <div className="glass-card stat-card">
        <div className="stat-header">
          <span className="stat-label">FECHA DE LIBERACIÓN PROYECTADA</span>
          <span className="stat-icon">🗓️</span>
        </div>
        <div className="stat-value date-value text-gradient-emerald">
          {getReleaseDateLabel(activeReport.months)}
        </div>
        <div className="stat-footer">
          <span>En <strong className="mono-numbers">{activeReport.months}</strong> meses de esfuerzo</span>
        </div>
      </div>

      {/* Tarjeta 4: Ahorros Logrados */}
      <div className="glass-card stat-card glow-savings-card">
        <div className="stat-header">
          <span className="stat-label">AHORRO ESTIMADO TOTAL</span>
          <span className="stat-icon">🎁</span>
        </div>
        
        {activeReport.strategy === 'minima' ? (
          <div className="savings-placeholder">
            <span className="info-badge">MODO BASE</span>
            <p className="placeholder-text">Agrega un **Abono Extra** o activa una estrategia para calcular tus ahorros.</p>
          </div>
        ) : (
          <div className="savings-content">
            <div className="savings-row">
              <span className="savings-lbl">Intereses:</span>
              <span className="savings-val text-gradient-emerald font-bold mono-numbers">
                {formatCurrency(activeReport.interestSaved)}
              </span>
            </div>
            <div className="savings-row">
              <span className="savings-lbl">Tiempo:</span>
              <span className="savings-val text-gradient-emerald font-bold">
                {activeReport.monthsSaved} meses
              </span>
            </div>
          </div>
        )}

        <div className="stat-footer">
          <span>Comparado con pagar solo el mínimo</span>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
          padding: 12px !important;
          margin-bottom: 0 !important;
        }

        .glow-savings-card {
          border-color: rgba(16, 185, 129, 0.2) !important;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.05);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          line-height: 1.2;
        }

        .stat-icon {
          font-size: 1rem;
        }

        .stat-value {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 6px;
          line-height: 1.2;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.25;
        }

        .stat-footer {
          font-size: 0.7rem;
          color: var(--text-muted);
          border-top: 1px solid var(--surface-border);
          padding-top: 6px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          line-height: 1.2;
        }

        .font-bold {
          font-weight: 700;
        }

        .text-danger {
          color: var(--danger) !important;
        }

        .text-warning {
          color: var(--warning) !important;
        }

        .text-emerald {
          color: var(--accent-emerald) !important;
        }

        .savings-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 2px 0 6px 0;
        }

        .savings-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .savings-lbl {
          color: var(--text-muted);
        }

        .savings-val {
          font-family: var(--font-mono);
        }

        .savings-placeholder {
          margin: 4px 0 8px 0;
        }

        .info-badge {
          font-size: 0.6rem;
          background: var(--surface-border);
          padding: 1px 4px;
          border-radius: 4px;
          color: var(--text-secondary);
          font-weight: bold;
          margin-bottom: 4px;
          display: inline-block;
        }

        .placeholder-text {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.3;
        }
      `}</style>

    </div>
  );
};