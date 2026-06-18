// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Debt } from '../../types/debt';
import { FinanceCalculations } from '../../utils/calculations';

interface DebtFormProps {
  onAddDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  editingDebt: Debt | null;
  onUpdateDebt: (debt: Debt) => void;
  onCancelEdit: () => void;
  currency: string;
}

export const DebtForm: React.FC<DebtFormProps> = ({
  onAddDebt,
  editingDebt,
  onUpdateDebt,
  onCancelEdit,
  currency,
}) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');

  // Sincronizar formulario si estamos editando una deuda
  useEffect(() => {
    if (editingDebt) {
      setName(editingDebt.name);
      setBalance(editingDebt.balance.toString());
      setAnnualRate(editingDebt.annualRate.toString());
      setMinimumPayment(editingDebt.minimumPayment.toString());
    } else {
      clearForm();
    }
  }, [editingDebt]);

  const clearForm = () => {
    setName('');
    setBalance('');
    setAnnualRate('');
    setMinimumPayment('');
  };

  // Cálculos dinámicos de auditoría
  const numBalance = parseFloat(balance) || 0;
  const numRate = parseFloat(annualRate) || 0;
  const numMinPayment = parseFloat(minimumPayment) || 0;

  const monthlyRate = FinanceCalculations.getMonthlyRate(numRate);
  const estimatedFirstMonthInterest = numBalance * monthlyRate;
  
  // Validaciones inmediatas
  const hasNegativeAmortization = numBalance > 0 && numRate > 0 && numMinPayment > 0 && numMinPayment <= estimatedFirstMonthInterest;
  const hasUsuryRate = numRate >= 26; // Tasa de usura referencial

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || numBalance <= 0 || numRate < 0 || numMinPayment <= 0) {
      alert('Por favor ingresa datos válidos. El saldo y el pago mínimo deben ser mayores a cero.');
      return;
    }

    const debtData = {
      name: name.trim(),
      balance: numBalance,
      annualRate: numRate,
      minimumPayment: numMinPayment,
    };

    if (editingDebt) {
      onUpdateDebt({
        ...editingDebt,
        ...debtData,
      });
    } else {
      onAddDebt(debtData);
      clearForm();
    }
  };

  return (
    <div className="glass-panel form-panel animate-fade-in">
      <h2 className="form-title">
        {editingDebt ? '📝 EDITAR CRÉDITO' : '➕ REGISTRAR NUEVA DEUDA'}
      </h2>
      <p className="form-subtitle">
        Agrega un crédito, préstamo o tarjeta para incorporarlo al simulador cascada.
      </p>

      <form onSubmit={handleSubmit} className="form-container-element">
        {/* Nombre de la Deuda */}
        <div className="form-group">
          <label className="form-label">Nombre del Préstamo o Tarjeta</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: Tarjeta de Crédito Alpha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Dos Columnas: Saldo e Interés */}
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Saldo Pendiente ({currency})</label>
            <input
              type="number"
              className="form-input mono-numbers"
              placeholder="0.00"
              min="1"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Tasa de Interés Anual (TEA %)</label>
            <input
              type="number"
              className="form-input mono-numbers"
              placeholder="0.00"
              min="0"
              step="any"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Pago Mínimo */}
        <div className="form-group">
          <label className="form-label">Pago Mínimo Mensual Obligatorio ({currency})</label>
          <input
            type="number"
            className="form-input mono-numbers"
            placeholder="0.00"
            min="1"
            step="any"
            value={minimumPayment}
            onChange={(e) => setMinimumPayment(e.target.value)}
            required
          />
        </div>

        {/* AUDITORÍA Y ALERTAS FINANCIERAS EN TIEMPO REAL */}
        {(numBalance > 0 && numRate > 0) && (
          <div className="form-audit-box animate-fade-in">
            <div className="audit-row">
              <span>Interés estimado mes 1:</span>
              <span className="mono-numbers text-secondary">
                {currency} {estimatedFirstMonthInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>

            {hasNegativeAmortization && (
              <div className="audit-alert alert-danger animate-fade-in">
                <strong>⚠️ Amortización Negativa:</strong> Tu pago mínimo es menor o igual al interés mensual acumulado. ¡Tu deuda crecerá cada mes en lugar de bajar! Considera aumentar el pago mínimo o inyectar abonos extraordinarios.
              </div>
            )}

            {hasUsuryRate && (
              <div className="audit-alert alert-warning animate-fade-in">
                <strong>📈 Tasa muy alta ({numRate}%):</strong> Esta tasa se encuentra en rangos elevados. El simulador colocará este crédito como prioridad máxima si utilizas la **Amortización Agresiva** para salvar tu capital cuanto antes.
              </div>
            )}

            {!hasNegativeAmortization && !hasUsuryRate && (
              <div className="audit-alert alert-success animate-fade-in">
                <strong>✅ Parámetros Saludables:</strong> El pago mínimo amortiza capital y la tasa está en rangos moderados.
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="form-actions">
          {editingDebt ? (
            <>
              <button type="submit" className="btn-primary flex-1">
                💾 Guardar Cambios
              </button>
              <button type="button" className="btn-secondary" onClick={onCancelEdit}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="submit" className="btn-primary w-full glow-success">
              🚀 Agregar al Simulador
            </button>
          )}
        </div>
      </form>

      <style>{`
        .form-panel {
          padding: 30px;
          height: fit-content;
        }

        .form-title {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .form-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 {
          flex: 1;
        }

        .w-full {
          width: 100%;
        }

        .form-audit-box {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        [data-theme="light"] .form-audit-box {
          background: rgba(0, 0, 0, 0.03);
        }

        .audit-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-family: var(--font-sans);
          color: var(--text-secondary);
        }

        .audit-alert {
          font-size: 0.8rem;
          line-height: 1.4;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid transparent;
        }

        .alert-danger {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--danger);
        }

        .alert-warning {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.3);
          color: var(--warning);
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
};