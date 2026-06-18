// @ts-nocheck
import React from 'react';
import { Debt } from '../../types/debt';
import { FinanceCalculations } from '../../utils/calculations';

interface DebtListProps {
  debts: Debt[];
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (id: number) => void;
  currency: string;
}

export const DebtList: React.FC<DebtListProps> = ({
  debts,
  onEditDebt,
  onDeleteDebt,
  currency,
}) => {
  const totalDebtBalance = debts.reduce((sum, d) => sum + d.balance, 0);

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="debt-list-container animate-fade-in">
      <div className="list-header">
        <h3 className="list-title">📋 TUS CRÉDITOS REGISTRADOS ({debts.length})</h3>
        {debts.length > 0 && (
          <span className="mono-numbers list-total-badge">
            Total: {formatCurrency(totalDebtBalance)}
          </span>
        )}
      </div>

      {debts.length === 0 ? (
        <div className="glass-panel empty-state animate-fade-in">
          <div className="empty-icon">💸</div>
          <h4>No hay deudas cargadas</h4>
          <p>
            Tu simulador local está listo. Utiliza el formulario para registrar tus tarjetas o préstamos y verás cómo el algoritmo diseña tu plan de escape.
          </p>
        </div>
      ) : (
        <div className="debt-grid">
          {debts.map((debt) => {
            // Calcular auditoría local por deuda
            const monthlyRate = FinanceCalculations.getMonthlyRate(debt.annualRate);
            const firstMonthInterest = debt.balance * monthlyRate;
            const isNegativeAmort = debt.minimumPayment <= firstMonthInterest;
            const isUsury = debt.annualRate >= 26;
            
            // Proporción de la deuda total
            const balancePercentage = totalDebtBalance > 0 ? (debt.balance / totalDebtBalance) * 100 : 0;

            return (
              <div
                key={debt.id}
                className={`glass-card debt-card-item ${isNegativeAmort ? 'border-danger-card' : ''}`}
              >
                {/* Cabecera del crédito */}
                <div className="debt-card-header">
                  <h4 className="debt-name">{debt.name}</h4>
                  <div className="debt-badges">
                    {isNegativeAmort && (
                      <span className="badge badge-success text-red-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        ⚠️ RIESGO
                      </span>
                    )}
                    {isUsury && (
                      <span className="badge badge-success text-yellow-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        📈 TASA ALTA
                      </span>
                    )}
                  </div>
                </div>

                {/* Valores Financieros */}
                <div className="debt-values">
                  <div className="value-row">
                    <span className="val-lbl">Saldo deudor:</span>
                    <span className="val-num mono-numbers text-gradient font-bold">
                      {formatCurrency(debt.balance)}
                    </span>
                  </div>

                  <div className="value-row">
                    <span className="val-lbl">Interés (TEA):</span>
                    <span className="val-num mono-numbers font-medium">
                      {debt.annualRate}%
                    </span>
                  </div>

                  <div className="value-row">
                    <span className="val-lbl">Pago Mínimo:</span>
                    <span className="val-num mono-numbers font-medium">
                      {formatCurrency(debt.minimumPayment)}
                    </span>
                  </div>
                </div>

                {/* Barra de Proporción */}
                <div className="proportion-bar-container">
                  <div className="proportion-label">
                    <span>Peso de esta deuda:</span>
                    <span className="mono-numbers">{balancePercentage.toFixed(0)}%</span>
                  </div>
                  <div className="proportion-bar">
                    <div
                      className="proportion-bar-fill"
                      style={{
                        width: `${balancePercentage}%`,
                        background: isUsury ? 'var(--warning)' : 'var(--accent-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Controles */}
                <div className="debt-card-actions">
                  <button
                    type="button"
                    className="btn-secondary btn-xs"
                    onClick={() => onEditDebt(debt)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-xs btn-danger-action"
                    onClick={() => onDeleteDebt(debt.id!)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .debt-list-container {
          margin-top: 5px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .list-title {
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .list-total-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--surface-border);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        [data-theme="light"] .list-total-badge {
          background: rgba(0, 0, 0, 0.03);
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          border-style: dashed !important;
          border-width: 2px !important;
          border-color: var(--text-muted) !important;
          opacity: 0.85;
        }

        .empty-icon {
          font-size: 2.5rem;
        }

        .empty-state h4 {
          font-size: 1.1rem;
          font-weight: 700;
        }

        .empty-state p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 450px;
          line-height: 1.5;
        }

        .debt-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .debt-card-item {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-color: var(--surface-border);
          min-height: 220px;
        }

        .border-danger-card {
          border-color: rgba(239, 68, 68, 0.3) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.05);
        }

        .debt-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          gap: 8px;
        }

        .debt-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .debt-badges {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
        }

        .debt-values {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .value-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .val-lbl {
          color: var(--text-secondary);
        }

        .val-num {
          font-family: var(--font-mono);
        }

        .font-medium {
          font-weight: 600;
        }

        .proportion-bar-container {
          margin-bottom: 16px;
        }

        .proportion-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .proportion-bar {
          height: 6px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 3px;
          overflow: hidden;
        }

        [data-theme="light"] .proportion-bar {
          background: rgba(0, 0, 0, 0.05);
        }

        .proportion-bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        .debt-card-actions {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid var(--surface-border);
          padding-top: 12px;
          margin-top: auto;
        }

        .btn-xs {
          padding: 4px 10px;
          font-size: 0.75rem;
          border-radius: 4px;
        }

        .btn-danger-action:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: var(--danger) !important;
          color: var(--danger) !important;
        }
      `}</style>
    </div>
  );
};