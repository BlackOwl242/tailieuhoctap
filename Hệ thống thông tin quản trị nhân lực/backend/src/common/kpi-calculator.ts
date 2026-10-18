export type KpiMeasurementMode = 'MANUAL' | 'HIGHER_BETTER' | 'LOWER_BETTER' | 'BINARY';

/** Company scorecard convention, capped at 100; not an ISO-prescribed formula. */
export function calculateKpiScore(mode: KpiMeasurementMode, target: number, actual: number): number {
  if (![target, actual].every(Number.isFinite) || target < 0 || actual < 0) throw new Error('Mục tiêu và kết quả KPI phải là số không âm');
  let result: number;
  if (mode === 'HIGHER_BETTER') {
    if (target === 0) throw new Error('KPI càng cao càng tốt cần mục tiêu lớn hơn 0');
    result = actual / target * 100;
  } else if (mode === 'LOWER_BETTER') {
    result = target === 0 ? (actual === 0 ? 100 : 0) : actual === 0 ? 100 : target / actual * 100;
  } else if (mode === 'BINARY') {
    if (target !== 1 || ![0, 1].includes(actual)) throw new Error('KPI đạt/không đạt dùng mục tiêu 1 và kết quả 0 hoặc 1');
    result = actual * 100;
  } else throw new Error('KPI chấm theo rubric cần nhập điểm và giải trình');
  return Math.round(Math.min(100, Math.max(0, result)) * 100) / 100;
}
