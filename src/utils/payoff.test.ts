import { teaToMonthlyRate, calcMinPayment, simulatePayoff } from './payoff';

test('tasa 0%: cuota = balance/cuotas', () => {
  expect(calcMinPayment(12000, 0, 12)).toBeCloseTo(1000, 0);
});
test('teaToMonthlyRate(30) ~= 0.02210', () => {
  expect(teaToMonthlyRate(30)).toBeCloseTo(0.02210, 4);
});
test('1 deuda sin acelerador liquida en 22-26 meses', () => {
  const debts = [{ id: '1', name: 'T', balance: 5000000, annualRate: 30, installments: 24, createdAt: 0 }];
  const rows = simulatePayoff(debts, 0, 'avalanche');
  const last = rows[rows.length - 1]?.month ?? 0;
  expect(last).toBeGreaterThanOrEqual(22);
  expect(last).toBeLessThanOrEqual(26);
});
test('acelerador reduce meses e interés', () => {
  const debts = [{ id: '1', name: 'T', balance: 5000000, annualRate: 30, installments: 24, createdAt: 0 }];
  const r0 = simulatePayoff(debts, 0, 'avalanche');
  const r1 = simulatePayoff(debts, 200000, 'avalanche');
  expect(r1[r1.length-1].month).toBeLessThan(r0[r0.length-1].month);
  expect(r1.reduce((s,r)=>s+r.interest,0)).toBeLessThan(r0.reduce((s,r)=>s+r.interest,0));
});
test('avalanche: extra va a mayor tasa', () => {
  const debts = [
    { id: 'a', name: 'Alta', balance: 1000000, annualRate: 40, installments: 12, createdAt: 0 },
    { id: 'b', name: 'Baja', balance: 1000000, annualRate: 20, installments: 12, createdAt: 0 },
  ];
  const rows = simulatePayoff(debts, 100000, 'avalanche');
  expect(rows.find(r => r.extraPayment > 0)?.debtName).toBe('Alta');
});
test('snowball: extra va a menor saldo', () => {
  const debts = [
    { id: 'a', name: 'Grande', balance: 2000000, annualRate: 30, installments: 24, createdAt: 0 },
    { id: 'b', name: 'Pequeña', balance: 500000, annualRate: 30, installments: 12, createdAt: 0 },
  ];
  const rows = simulatePayoff(debts, 100000, 'snowball');
  expect(rows.find(r => r.extraPayment > 0)?.debtName).toBe('Pequeña');
});
test('cap de 600 meses con parámetros extremos', () => {
  const debts = [{ id: '1', name: 'T', balance: 999999999, annualRate: 200, installments: 600, createdAt: 0 }];
  const rows = simulatePayoff(debts, 0, 'avalanche');
  expect(Math.max(...rows.map(r => r.month))).toBeLessThanOrEqual(600);
});
