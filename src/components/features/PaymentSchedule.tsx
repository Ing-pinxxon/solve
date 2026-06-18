// @ts-nocheck
import React, { useState } from 'react';
import { AmortizationMonth, PayoffStrategy } from '../../types/debt';

interface PaymentScheduleProps {
  schedule: AmortizationMonth[];
  currency: string;
  activeStrategy: PayoffStrategy;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  schedule,
  currency,
  activeStrategy,
}) => {
  const [expandedMonths, setExpandedMonths] = useState<{ [key: number]: boolean }>({
    1: true, // El primer mes viene expandido por defecto para llamar la atención del usuario
  });
  const [visibleLimit, setVisibleLimit] = useState(12); // Mostrar solo el primer año por defecto

  const toggleMonth = (idx: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShowMore = () => {
    setVisibleLimit((prev) => prev + 12);
  };

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getStrategyLabel = (strat: PayoffStrategy) => {
    if (strat === 'agresiva') return 'Amortización Agresiva (Avalancha)';
    if (strat === 'progresiva') return 'Amortización Progresiva (Bola de Nieve)';
    return 'Pago Mínimo Únicamente';
  };

  return (
    <div className="glass-panel schedule-panel animate-fade-in">
      <div className="schedule-header">
        <div>
          <h2 className="panel-title">🗓️ CALENDARIO MÁXIMO DE PAGOS</h2>
          <p className="panel-desc">
            Sigue este plan cronológico detallado. Muestra exactamente cuánto pagar a cada crédito mes a mes.
          </p>
        </div>
        <div className="strategy-active-badge">
          {getStrategyLabel(activeStrategy)}
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="empty-schedule text-center-wrapper">
          <p className="text-muted">No hay proyección activa. Registra deudas para generar el plan.</p>
        </div>
      ) : (
        <div className="schedule-list">
          {schedule.slice(0, visibleLimit).map((month) => {
            const isExpanded = expandedMonths[month.monthIndex];
            const hasPaidOff = month.newlyPaidDebts.length > 0;

            return (
              <div
                key={month.monthIndex}
                className={`schedule-month-card ${isExpanded ? 'active-month' : ''} ${
                  hasPaidOff ? 'month-with-milestone' : ''
                }`}
              >
                {/* Cabecera del Mes (Siempre Visible) */}
                <div className="month-header" onClick={() => toggleMonth(month.monthIndex)}>
                  <div className="month-header-left">
                    <span className="month-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span className="month-name-tag">MES {month.monthIndex.toString().padStart(2, '0')}</span>
                    
                    {hasPaidOff && (
                      <span className="badge badge-success milestone-badge glow-success animate-fade-in">
                        🎉 ¡DEUDA SALDADA: {month.newlyPaidDebts.join(', ')}!
                      </span>
                    )}
                  </div>

                  <div className="month-header-right">
                    <div className="header-meta-item">
                      <span className="meta-lbl">Abonado:</span>
                      <span className="meta-val mono-numbers font-medium text-emerald">
                        {formatCurrency(month.totalPrincipalPaid + month.totalInterestPaid)}
                      </span>
                    </div>
                    
                    <div className="header-meta-item">
                      <span className="meta-lbl">Saldo Restante:</span>
                      <span className="meta-val mono-numbers font-medium">
                        {formatCurrency(month.totalEndingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalle del Mes (Desplegable) */}
                {isExpanded && (
                  <div className="month-detail-viewport animate-fade-in">
                    <div className="table-wrapper">
                      <table className="detail-table">
                        <thead>
                          <tr>
                            <th>CRÉDITO</th>
                            <th className="text-right">CUOTA TOTAL</th>
                            <th className="text-right text-muted-header">INTERÉS</th>
                            <th className="text-right text-emerald-header">CAPITAL</th>
                            <th className="text-right">NUEVO SALDO</th>
                            <th className="text-center">ESTADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {month.payments.map((pay) => {
                            // Identificar si a este pago se le inyectó el abono extra
                            // Un pago tiene abono extra si supera su mínimo configurado + un margen por decimales
                            const isPrioritized = pay.paymentAmount > pay.interestPaid + pay.principalPaid && pay.paymentAmount > 0.01;
                            
                            return (
                              <tr key={pay.debtId} className={pay.isPaidOff ? 'row-liquidated' : ''}>
                                <td className="font-semibold">
                                  {pay.debtName}
                                  {isPrioritized && (
                                    <span className="table-priority-badge">⚡ ACELERADO</span>
                                  )}
                                </td>
                                <td className="text-right mono-numbers font-medium">
                                  {formatCurrency(pay.paymentAmount)}
                                </td>
                                <td className="text-right mono-numbers text-muted-cell">
                                  {formatCurrency(pay.interestPaid)}
                                </td>
                                <td className="text-right mono-numbers text-emerald-cell">
                                  {formatCurrency(pay.principalPaid)}
                                </td>
                                <td className="text-right mono-numbers font-medium">
                                  {formatCurrency(pay.remainingBalance)}
                                </td>
                                <td className="text-center">
                                  {pay.isPaidOff ? (
                                    <span className="badge badge-success text-center">SALDADA 🎉</span>
                                  ) : (
                                    <span className="status-dot-active" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="month-summary-caption">
                      Este mes redujiste <strong className="mono-numbers text-gradient-emerald">{formatCurrency(month.totalPrincipalPaid)}</strong> de deuda neta directa al capital, y pagaste <span className="mono-numbers text-danger">{formatCurrency(month.totalInterestPaid)}</span> en costos financieros de intereses bancarios.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Botón de Cargar Más */}
      {schedule.length > visibleLimit && (
        <div className="load-more-container text-center-wrapper">
          <button type="button" className="btn-secondary" onClick={handleShowMore}>
            ⏳ Ver siguientes 12 meses (Año {Math.floor(visibleLimit / 12) + 1})
          </button>
        </div>
      )}

      <style>{`
        .schedule-panel {
          padding: 30px;
          margin-bottom: 30px;
        }

        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .strategy-active-badge {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: var(--accent-primary);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        [data-theme="light"] .strategy-active-badge {
          background: rgba(0, 0, 0, 0.03);
          border-color: var(--surface-border);
          color: var(--text-secondary);
        }

        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .schedule-month-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--surface-border);
          border-radius: 10px;
          overflow: hidden;
          transition: all var(--transition-normal);
        }

        [data-theme="light"] .schedule-month-card {
          background: rgba(255, 255, 255, 0.5);
        }

        .schedule-month-card:hover {
          border-color: var(--text-secondary);
        }

        .active-month {
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: var(--shadow-sm);
        }

        .month-with-milestone {
          border-color: rgba(16, 185, 129, 0.25);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.03);
        }

        .month-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          flex-wrap: wrap;
          gap: 10px;
        }

        .month-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .month-toggle-icon {
          font-size: 0.75rem;
          color: var(--text-muted);
          width: 15px;
        }

        .month-name-tag {
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.95rem;
        }

        .milestone-badge {
          font-size: 0.7rem;
        }

        .month-header-right {
          display: flex;
          gap: 20px;
        }

        .header-meta-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .meta-lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .meta-val {
          font-size: 0.85rem;
        }

        /* Detalle del Mes */
        .month-detail-viewport {
          padding: 0 20px 20px 20px;
          border-top: 1px solid var(--surface-border);
          background: rgba(0, 0, 0, 0.1);
        }

        [data-theme="light"] .month-detail-viewport {
          background: rgba(0, 0, 0, 0.005);
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 15px;
        }

        .detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .detail-table th {
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 12px;
          border-bottom: 1px solid var(--surface-border);
          text-align: left;
        }

        .detail-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        [data-theme="light"] .detail-table td {
          border-bottom-color: rgba(0, 0, 0, 0.03);
        }

        .text-right {
          text-align: right !important;
        }

        .text-center {
          text-align: center !important;
        }

        .text-muted-header {
          color: var(--text-muted) !important;
        }

        .text-emerald-header {
          color: var(--accent-emerald) !important;
        }

        .text-muted-cell {
          color: var(--text-muted);
        }

        .text-emerald-cell {
          color: var(--accent-emerald);
          font-weight: 600;
        }

        .font-semibold {
          font-weight: 600;
        }

        .row-liquidated {
          background: rgba(16, 185, 129, 0.03);
          opacity: 0.8;
        }

        .status-dot-active {
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: 50%;
          display: inline-block;
        }

        .table-priority-badge {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          font-weight: bold;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 8px;
        }

        .month-summary-caption {
          font-size: 0.8rem;
          line-height: 1.45;
          color: var(--text-secondary);
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
        }

        .load-more-container {
          margin-top: 25px;
        }

        .empty-schedule {
          padding: 30px 0;
        }
      `}</style>
    </div>
  );
};