// @ts-nocheck
import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PayoffReport } from '../../types/debt';

interface PayoffChartProps {
  reports: {
    agresiva: PayoffReport;
    progresiva: PayoffReport;
    minima: PayoffReport;
  };
  currency: string;
}

export const PayoffChart: React.FC<PayoffChartProps> = ({ reports, currency }) => {
  const [activeTab, setActiveTab] = useState<'balance' | 'interest'>('balance');

  const { agresiva, progresiva, minima } = reports;

  // 1. Preparar datos para el gráfico de balance de deudas a lo largo del tiempo
  const maxMonths = Math.max(agresiva.months, progresiva.months, minima.months);
  
  // Limitar el número de puntos de datos para evitar degradación de rendimiento en proyecciones largas
  // Si dura más de 60 meses, muestreamos cada N meses.
  const sampleInterval = Math.max(1, Math.ceil(maxMonths / 80));
  
  const balanceChartData: any[] = [];
  
  // Añadir punto inicial (Mes 0) con el saldo total inicial
  const initialBalance = agresiva.payoffHistory.length > 0 ? agresiva.payoffHistory[0].totalStartingBalance : 0;
  balanceChartData.push({
    name: 'Mes 0',
    'Amort. Agresiva': initialBalance,
    'Amort. Progresiva': initialBalance,
    'Mínimo Únicamente': initialBalance,
  });

  for (let m = 1; m <= maxMonths; m++) {
    if (m % sampleInterval === 0 || m === maxMonths) {
      // Buscar saldos en cada historial
      const agrMonth = agresiva.payoffHistory.find((ph) => ph.monthIndex === m);
      const progMonth = progresiva.payoffHistory.find((ph) => ph.monthIndex === m);
      const minMonth = minima.payoffHistory.find((ph) => ph.monthIndex === m);

      // Si una estrategia ya terminó, su saldo es 0
      const agrBal = agrMonth ? agrMonth.totalEndingBalance : 0;
      const progBal = progMonth ? progMonth.totalEndingBalance : 0;
      const minBal = minMonth ? minMonth.totalEndingBalance : (minima.payoffHistory.length > 0 ? 0 : initialBalance);

      balanceChartData.push({
        name: `Mes ${m}`,
        'Amort. Agresiva': Math.round(agrBal),
        'Amort. Progresiva': Math.round(progBal),
        'Mínimo Únicamente': Math.round(minBal),
      });
    }
  }

  // 2. Preparar datos para el gráfico de barras de comparación de interés total pagado
  const interestChartData = [
    {
      name: 'Amort. Agresiva',
      value: Math.round(agresiva.totalInterest),
      color: 'hsl(217, 91%, 60%)', // Indigo
    },
    {
      name: 'Amort. Progresiva',
      value: Math.round(progresiva.totalInterest),
      color: 'hsl(263, 84%, 60%)', // Violet
    },
    {
      name: 'Mínimo Únicamente',
      value: Math.round(minima.totalInterest),
      color: 'hsl(346, 84%, 55%)', // Red/Danger
    },
  ];

  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="glass-panel chart-panel animate-fade-in">
      <div className="chart-panel-header">
        <h2 className="panel-title">📈 VISUALIZACIÓN PROYECTADA</h2>
        
        {/* Selector de gráfico */}
        <div className="chart-tabs">
          <button
            type="button"
            className={`chart-tab-btn ${activeTab === 'balance' ? 'active' : ''}`}
            onClick={() => setActiveTab('balance')}
          >
            📉 Curva de Deuda
          </button>
          <button
            type="button"
            className={`chart-tab-btn ${activeTab === 'interest' ? 'active' : ''}`}
            onClick={() => setActiveTab('interest')}
          >
            💸 Intereses Pagados
          </button>
        </div>
      </div>

      <p className="panel-desc">
        {activeTab === 'balance'
          ? 'Muestra cómo decae el saldo total adeudado mes a mes bajo cada estrategia de amortización.'
          : 'Compara la suma total de intereses que habrás transferido a los bancos al finalizar el plan.'}
      </p>

      {/* Visor del Gráfico */}
      <div className="chart-viewport">
        {activeTab === 'balance' ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={balanceChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAgr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(263, 84%, 60%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(263, 84%, 60%)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(346, 84%, 55%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(346, 84%, 55%)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) => `${currency}${Math.round(value/1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                itemStyle={{ color: 'var(--text-secondary)' }}
                formatter={(value: any) => [formatCurrency(Number(value)), '']}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {/* Mínimos Únicamente */}
              <Area
                type="monotone"
                dataKey="Mínimo Únicamente"
                stroke="hsl(346, 84%, 55%)"
                fillOpacity={1}
                fill="url(#colorMin)"
                strokeWidth={2}
                dot={false}
              />
              
              {/* Amortización Progresiva */}
              <Area
                type="monotone"
                dataKey="Amort. Progresiva"
                stroke="hsl(263, 84%, 60%)"
                fillOpacity={1}
                fill="url(#colorProg)"
                strokeWidth={2}
                dot={false}
              />

              {/* Amortización Agresiva */}
              <Area
                type="monotone"
                dataKey="Amort. Agresiva"
                stroke="hsl(217, 91%, 60%)"
                fillOpacity={1}
                fill="url(#colorAgr)"
                strokeWidth={3}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={interestChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) => `${currency}${Math.round(value/1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '8px',
                }}
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Interés Total']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {interestChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Nota educativa de ahorro */}
      {agresiva.interestSaved > 0 && activeTab === 'interest' && (
        <div className="chart-savings-alert animate-fade-in">
          💡 La estrategia **Agresiva (Avalancha)** te ahorra un total de{' '}
          <strong className="text-gradient-emerald mono-numbers">
            {formatCurrency(agresiva.interestSaved)}
          </strong>{' '}
          en intereses no pagados en comparación con abonar solo los mínimos requeridos.
        </div>
      )}

      <style>{`
        .chart-panel {
          padding: 30px;
          margin-bottom: 30px;
        }

        .chart-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          gap: 15px;
          flex-wrap: wrap;
        }

        .chart-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.15);
          padding: 4px;
          border-radius: 8px;
          border: 1px solid var(--surface-border);
        }

        [data-theme="light"] .chart-tabs {
          background: rgba(0, 0, 0, 0.03);
        }

        .chart-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 14px;
          font-size: 0.8rem;
          font-family: var(--font-sans);
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all var(--transition-fast);
        }

        .chart-tab-btn.active {
          background: var(--accent-primary);
          color: #FFFFFF;
          box-shadow: var(--shadow-sm);
        }

        .chart-viewport {
          margin-top: 25px;
          width: 100%;
        }

        .chart-savings-alert {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 20px;
          line-height: 1.4;
          text-align: center;
        }

        @media (max-width: 600px) {
          .chart-panel-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .chart-tabs {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};