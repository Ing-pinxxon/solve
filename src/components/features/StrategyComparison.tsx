// @ts-nocheck
import React, { useState } from 'react';
import { PayoffStrategy, OneTimePayment } from '../../types/debt';

interface StrategyComparisonProps {
  monthlyAccelerator: number;
  onChangeAccelerator: (value: number) => void;
  activeStrategy: PayoffStrategy;
  onChangeStrategy: (strategy: PayoffStrategy) => void;
  oneTimePayments: OneTimePayment[];
  onAddOneTimePayment: (month: number, amount: number) => void;
  onDeleteOneTimePayment: (id: number) => void;
  currency: string;
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  monthlyAccelerator,
  onChangeAccelerator,
  activeStrategy,
  onChangeStrategy,
  oneTimePayments,
  onAddOneTimePayment,
  onDeleteOneTimePayment,
  currency,
}) => {
  const [extraMonth, setExtraMonth] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  const handleAddOneTime = (e: React.FormEvent) => {
    e.preventDefault();
    const month = parseInt(extraMonth);
    const amount = parseFloat(extraAmount);

    if (isNaN(month) || month <= 0 || isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un mes y un monto válidos mayores a cero.');
      return;
    }

    onAddOneTimePayment(month, amount);
    setExtraMonth('');
    setExtraAmount('');
  };

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="strategy-panel-wrapper animate-fade-in">
      <div className="glass-panel main-strategy-panel">
        <h2 className="panel-title">⚡ CONFIGURAR PLAN DE ATAQUE</h2>
        <p className="panel-desc">
          Define tu acelerador de capital y selecciona cómo deseas liquidar tus créditos.
        </p>

        {/* 1. SECCIÓN DE ACELERADOR RECURRENTE */}
        <div className="accelerator-section glass-card">
          <div className="accelerator-header-box">
            <div>
              <h3 className="section-title">Tu Acelerador Mensual Recurrente</h3>
              <p className="section-desc">
                Dinero extra que inyectarás mensualmente al capital sobre la suma de tus pagos mínimos obligatorios.
              </p>
            </div>
            <div className="accelerator-input-wrapper">
              <span className="acc-currency mono-numbers">{currency}</span>
              <input
                type="number"
                className="accelerator-input-field mono-numbers"
                value={monthlyAccelerator || ''}
                onChange={(e) => onChangeAccelerator(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="presets-row">
            <span>Accesos rápidos:</span>
            {[50, 100, 200, 500].map((val) => (
              <button
                key={val}
                type="button"
                className={`preset-btn ${monthlyAccelerator === val ? 'active' : ''}`}
                onClick={() => onChangeAccelerator(val)}
              >
                +{currency}{val}
              </button>
            ))}
            {monthlyAccelerator > 0 && (
              <button
                type="button"
                className="preset-btn btn-clear-preset"
                onClick={() => onChangeAccelerator(0)}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* 2. SECCIÓN DE ESTRATEGIAS (AGRESIVA VS PROGRESIVA) */}
        <div className="strategies-comparison-box">
          <h3 className="section-title text-center">Selecciona tu Estilo de Amortización</h3>
          <div className="strategies-grid">
            {/* Estrategia Agresiva (Avalancha) */}
            <div
              className={`strategy-card-select ${activeStrategy === 'agresiva' ? 'active-agresiva' : ''}`}
              onClick={() => onChangeStrategy('agresiva')}
            >
              <div className="strategy-card-header">
                <span className="strategy-tag badge-primary">🎯 RECOMENDADO MATEMÁTICO</span>
                <h4>AMORTIZACIÓN AGRESIVA</h4>
                <p className="strategy-codename">// Método Avalancha (Avalanche)</p>
              </div>
              <ul className="strategy-features">
                <li>🔥 Ordena tus deudas de **mayor a menor tasa de interés**.</li>
                <li>🛡️ Enfoca cada centavo extra en destruir la tasa más costosa.</li>
                <li>💎 **Ahorro Máximo:** Es el método que más dinero e intereses te ahorra.</li>
              </ul>
              <div className="strategy-select-indicator">
                {activeStrategy === 'agresiva' ? '✅ ESTILO SELECCIONADO' : 'Elegir este estilo'}
              </div>
            </div>

            {/* Estrategia Progresiva (Bola de Nieve) */}
            <div
              className={`strategy-card-select ${activeStrategy === 'progresiva' ? 'active-progresiva' : ''}`}
              onClick={() => onChangeStrategy('progresiva')}
            >
              <div className="strategy-card-header">
                <span className="strategy-tag badge-violet">🧠 RECOMENDADO PSICOLÓGICO</span>
                <h4>AMORTIZACIÓN PROGRESIVA</h4>
                <p className="strategy-codename">// Método Bola de Nieve (Snowball)</p>
              </div>
              <ul className="strategy-features">
                <li>🔥 Ordena tus deudas de **menor a mayor saldo total**.</li>
                <li>🛡️ Inyecta el acelerador en liquidar la deuda más pequeña primero.</li>
                <li>💎 **Victorias Rápidas:** Elimina cuentas enteras velozmente, motivándote a continuar.</li>
              </ul>
              <div className="strategy-select-indicator">
                {activeStrategy === 'progresiva' ? '✅ ESTILO SELECCIONADO' : 'Elegir este estilo'}
              </div>
            </div>
          </div>

          {/* Opción de Pago Mínimo Únicamente */}
          <div className="text-center-wrapper">
            <button
              type="button"
              className={`btn-secondary btn-xs minimas-toggle ${activeStrategy === 'minima' ? 'active-min' : ''}`}
              onClick={() => onChangeStrategy('minima')}
            >
              📊 Simular únicamente pago mínimo (Sin Acelerador)
            </button>
          </div>
        </div>

        {/* 3. ABONOS EXTRAORDINARIOS ÚNICOS */}
        <div className="one-time-section glass-card">
          <h3 className="section-title">Abonos Extraordinarios Programados (Únicos)</h3>
          <p className="section-desc">
            Simula ingresos extraordinarios únicos en meses específicos (ej. primas de servicios, bonos de fin de año, devoluciones tributarias).
          </p>

          <form onSubmit={handleAddOneTime} className="one-time-form">
            <div className="form-group flex-1">
              <label className="form-label">Número de Mes</label>
              <input
                type="number"
                className="form-input mono-numbers"
                placeholder="Ej: 6"
                min="1"
                value={extraMonth}
                onChange={(e) => setExtraMonth(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-2">
              <label className="form-label">Monto del Abono ({currency})</label>
              <input
                type="number"
                className="form-input mono-numbers"
                placeholder="0.00"
                min="1"
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary form-submit-btn">
              ➕ Programar
            </button>
          </form>

          {/* Listado de abonos únicos programados */}
          {oneTimePayments.length > 0 && (
            <div className="one-time-list-box animate-fade-in">
              <h4 className="one-time-list-title">Abonos Únicos Activos:</h4>
              <div className="one-time-tags-container">
                {oneTimePayments.map((pay) => (
                  <div key={pay.id} className="one-time-badge-item">
                    <span className="badge-text">
                      Mes {pay.monthNumber}: <strong className="mono-numbers">{formatCurrency(pay.amount)}</strong>
                    </span>
                    <button
                      type="button"
                      className="delete-badge-btn"
                      onClick={() => onDeleteOneTimePayment(pay.id!)}
                      title="Eliminar abono"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .main-strategy-panel {
          padding: 30px;
          margin-bottom: 30px;
        }

        .panel-title {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .panel-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .accelerator-section {
          background: rgba(16, 185, 129, 0.03);
          border-color: rgba(16, 185, 129, 0.15);
          margin-bottom: 24px;
        }

        .accelerator-header-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .section-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .text-center {
          text-align: center;
          margin-bottom: 20px;
        }

        .section-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          max-width: 500px;
          line-height: 1.4;
        }

        .accelerator-input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--surface-border);
          border-radius: 8px;
          padding: 4px 12px;
          height: 48px;
          width: 160px;
        }

        [data-theme="light"] .accelerator-input-wrapper {
          background: rgba(255, 255, 255, 0.9);
        }

        .acc-currency {
          font-size: 1rem;
          font-weight: bold;
          color: var(--text-secondary);
          margin-right: 6px;
        }

        .accelerator-input-field {
          background: transparent;
          border: none;
          color: var(--text-primary);
          width: 100%;
          font-size: 1.1rem;
          font-weight: bold;
          outline: none;
        }

        .presets-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
          font-size: 0.75rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        .preset-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--surface-border);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          transition: all var(--transition-fast);
        }

        [data-theme="light"] .preset-btn {
          background: rgba(0, 0, 0, 0.03);
        }

        .preset-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .preset-btn.active {
          background: var(--accent-emerald);
          border-color: var(--accent-emerald);
          color: #FFFFFF;
        }

        .btn-clear-preset {
          background: transparent !important;
          border-color: transparent !important;
          text-decoration: underline;
        }

        /* Comparador de Estrategias */
        .strategies-comparison-box {
          margin-bottom: 24px;
        }

        .strategies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 16px;
        }


        .strategy-card-select {
          background: var(--surface);
          border: 1px solid var(--surface-border);
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
        }

        .strategy-card-select:hover {
          transform: translateY(-2px);
          border-color: var(--text-secondary);
        }

        .active-agresiva {
          border-color: var(--accent-primary) !important;
          background: rgba(99, 102, 241, 0.04) !important;
          box-shadow: var(--shadow-glow-indigo);
        }

        .active-progresiva {
          border-color: var(--accent-violet) !important;
          background: rgba(139, 92, 246, 0.04) !important;
          box-shadow: var(--shadow-glow-violet);
        }

        .strategy-card-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 15px;
        }

        .strategy-card-header h4 {
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .strategy-codename {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .strategy-features {
          list-style: none;
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .strategy-select-indicator {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          text-align: center;
          padding-top: 12px;
          border-top: 1px solid var(--surface-border);
          color: var(--text-muted);
        }

        .active-agresiva .strategy-select-indicator {
          color: var(--accent-primary);
        }

        .active-progresiva .strategy-select-indicator {
          color: var(--accent-violet);
        }

        .text-center-wrapper {
          text-align: center;
        }

        .minimas-toggle {
          padding: 8px 16px;
          font-size: 0.8rem;
        }

        .active-min {
          background: var(--surface-active) !important;
          border-color: var(--text-secondary) !important;
        }

        /* Sección Abonos Únicos */
        .one-time-section {
          background: rgba(0, 0, 0, 0.1);
          border-color: var(--surface-border);
        }

        [data-theme="light"] .one-time-section {
          background: rgba(0, 0, 0, 0.01);
        }

        .one-time-form {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .flex-2 {
          flex: 2;
        }

        .form-submit-btn {
          height: 48px;
          margin-bottom: 20px;
        }

        .one-time-list-box {
          margin-top: 20px;
          border-top: 1px solid var(--surface-border);
          padding-top: 15px;
        }

        .one-time-list-title {
          font-size: 0.8rem;
          font-weight: bold;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }

        .one-time-tags-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .one-time-badge-item {
          display: inline-flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--surface-border);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .badge-text {
          font-family: var(--font-sans);
          color: var(--text-secondary);
        }

        .delete-badge-btn {
          background: transparent;
          border: none;
          color: var(--danger);
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          padding-left: 8px;
          line-height: 1;
        }

        @media (max-width: 768px) {
          .strategies-grid {
            grid-template-columns: 1fr;
          }
          
          .one-time-form {
            flex-direction: column;
            align-items: stretch;
          }

          .form-submit-btn {
            margin-bottom: 0;
          }
        }
      `}</style>
    </div>
  );
};