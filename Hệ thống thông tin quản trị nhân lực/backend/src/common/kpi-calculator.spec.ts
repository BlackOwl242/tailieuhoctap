import { calculateKpiScore } from './kpi-calculator';
describe('Quantitative KPI scorecard', () => {
  it('normalizes increasing and decreasing measures and caps overachievement', () => {
    expect(calculateKpiScore('HIGHER_BETTER', 100, 80)).toBe(80);
    expect(calculateKpiScore('HIGHER_BETTER', 100, 150)).toBe(100);
    expect(calculateKpiScore('LOWER_BETTER', 20, 25)).toBe(80);
    expect(calculateKpiScore('LOWER_BETTER', 20, 0)).toBe(100);
  });
  it('handles zero defect goals and binary acceptance without dividing by zero', () => {
    expect(calculateKpiScore('LOWER_BETTER', 0, 0)).toBe(100);
    expect(calculateKpiScore('LOWER_BETTER', 0, 1)).toBe(0);
    expect(calculateKpiScore('BINARY', 1, 1)).toBe(100);
    expect(calculateKpiScore('BINARY', 1, 0)).toBe(0);
    expect(() => calculateKpiScore('HIGHER_BETTER', 0, 0)).toThrow();
    expect(() => calculateKpiScore('BINARY', 1, .5)).toThrow();
    expect(() => calculateKpiScore('HIGHER_BETTER', 10, NaN)).toThrow();
  });
});
