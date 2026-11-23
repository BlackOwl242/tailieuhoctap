export type DssRecommendationSeverity = 'HIGH' | 'MEDIUM' | 'INFO';

export interface DssRecommendation {
  severity: DssRecommendationSeverity;
  category: 'WORKFORCE' | 'PAYROLL' | 'COMPLIANCE' | 'PERFORMANCE' | 'RECRUITMENT';
  title: string;
  detail: string;
  actionHref: string;
  actionLabel: string;
}

export interface ExpiringContractAlert {
  userId: string;
  fullName: string;
  employeeCode: string | null;
  contractNo: string;
  endDate: string;
  daysLeft: number;
}

export interface ProbationDueAlert {
  userId: string;
  fullName: string;
  employeeCode: string | null;
  hireDate: string;
  daysInProbation: number;
}

export interface HighOvertimeAlert {
  userId: string;
  fullName: string;
  employeeCode: string | null;
  monthHours: number;
  yearHours: number;
}

export interface OutOfBandSalaryAlert {
  userId: string;
  fullName: string;
  employeeCode: string | null;
  salary: number;
  bandCode: string;
  minSalary: number;
  maxSalary: number;
  status: 'BELOW_RANGE' | 'ABOVE_RANGE';
}

export interface LowKpiAlert {
  userId: string;
  fullName: string;
  employeeCode: string | null;
  score: number;
  orgUnitName: string | null;
}

export function computeTurnoverRate(exits: number, startActive: number, endActive: number): number {
  const avgHeadcount = (startActive + endActive) / 2;
  if (avgHeadcount <= 0 || exits <= 0) return 0;
  return Math.round((exits / avgHeadcount) * 1000) / 10;
}

export function evaluateSalaryBandStatus(
  salary: number,
  band: { minSalary: number; maxSalary: number },
): 'IN_RANGE' | 'BELOW_RANGE' | 'ABOVE_RANGE' {
  if (salary < band.minSalary) return 'BELOW_RANGE';
  if (salary > band.maxSalary) return 'ABOVE_RANGE';
  return 'IN_RANGE';
}

export function collectUnitSubtreeIds(
  units: Array<{ id: string; parentId: string | null }>,
  rootId: string,
): Set<string> {
  const ids = new Set<string>([rootId]);
  let frontier = [rootId];
  while (frontier.length > 0) {
    const children = units.filter((u) => u.parentId && frontier.includes(u.parentId) && !ids.has(u.id));
    frontier = children.map((c) => c.id);
    for (const c of children) ids.add(c.id);
  }
  return ids;
}

export interface RecommendationInput {
  turnoverRatePct: number;
  exitsInWindow: number;
  expiringContracts: ExpiringContractAlert[];
  probationDue: ProbationDueAlert[];
  highOvertime: HighOvertimeAlert[];
  outOfBandSalaries: OutOfBandSalaryAlert[];
  lowKpiPerformers: LowKpiAlert[];
  offerAcceptanceRatePct: number | null;
  openingsCount: number;
}

/** Sinh khuyến nghị điều hành hoàn toàn từ ngưỡng nghiệp vụ & số liệu thực tế trong CSDL. */
export function buildDssRecommendations(input: RecommendationInput): DssRecommendation[] {
  const recs: DssRecommendation[] = [];

  if (input.highOvertime.length > 0) {
    recs.push({
      severity: 'HIGH',
      category: 'COMPLIANCE',
      title: `${input.highOvertime.length} nhân sự làm thêm giờ tiệm cận trần luật định`,
      detail: 'Tổng giờ OT đã duyệt đạt từ 32h/tháng (trần 40h) hoặc 160h/năm (trần 200h theo Điều 107 BLLĐ 2019). Cần điều phối nhân lực hoặc chia ca tránh vi phạm hạn mức.',
      actionHref: '/overtime',
      actionLabel: 'Kiểm tra làm thêm giờ',
    });
  }

  if (input.expiringContracts.length > 0) {
    recs.push({
      severity: input.expiringContracts.some((c) => c.daysLeft <= 15) ? 'HIGH' : 'MEDIUM',
      category: 'COMPLIANCE',
      title: `${input.expiringContracts.length} hợp đồng lao động sắp hết hạn trong 60 ngày`,
      detail: 'Cần đánh giá tái ký hoặc thông báo chấm dứt hợp đồng đúng thời hạn luật định để tránh phát sinh hợp đồng vô thời hạn ngoài ý muốn.',
      actionHref: '/employees',
      actionLabel: 'Rà soát hợp đồng',
    });
  }

  if (input.probationDue.length > 0) {
    recs.push({
      severity: 'MEDIUM',
      category: 'WORKFORCE',
      title: `${input.probationDue.length} nhân sự thử việc đã quá 45 ngày chưa có kết luận duyệt`,
      detail: 'Cần lập hoặc hoàn tất quy trình đánh giá thử việc trước mốc kết thúc tối đa 60 ngày (Điều 25 BLLĐ 2019).',
      actionHref: '/hr-workflows?tab=probation',
      actionLabel: 'Đánh giá thử việc',
    });
  }

  if (input.outOfBandSalaries.length > 0) {
    const below = input.outOfBandSalaries.filter((s) => s.status === 'BELOW_RANGE').length;
    const above = input.outOfBandSalaries.filter((s) => s.status === 'ABOVE_RANGE').length;
    recs.push({
      severity: below > 0 ? 'MEDIUM' : 'INFO',
      category: 'PAYROLL',
      title: `${input.outOfBandSalaries.length} nhân sự có mức lương nằm ngoài khung lương vị trí`,
      detail: `Gồm ${below} nhân sự dưới mức tối thiểu khung (nguy cơ mất nhân tài) và ${above} nhân sự vượt trần khung (áp lực quỹ lương).`,
      actionHref: '/salary-bands',
      actionLabel: 'Đối chiếu khung lương',
    });
  }

  if (input.lowKpiPerformers.length > 0) {
    recs.push({
      severity: 'MEDIUM',
      category: 'PERFORMANCE',
      title: `${input.lowKpiPerformers.length} nhân sự có điểm KPI kỳ gần nhất dưới 50/100`,
      detail: 'Nên thiết lập Kế hoạch cải thiện hiệu suất (PIP) và phân công khóa đào tạo hỗ trợ trực tiếp trong chu kỳ hiện tại.',
      actionHref: '/performance?tab=reviews-pip',
      actionLabel: 'Mở PIP & Đánh giá',
    });
  }

  if (input.turnoverRatePct >= 10) {
    recs.push({
      severity: 'HIGH',
      category: 'WORKFORCE',
      title: `Tỷ lệ nghỉ việc ở mức cao (${input.turnoverRatePct}% · ${input.exitsInWindow} ca nghỉ)`,
      detail: 'Cần rà soát phỏng vấn nghỉ việc, mặt bằng thu nhập và áp lực OT tại các đơn vị có biến động lớn.',
      actionHref: '/personnel',
      actionLabel: 'Xem biến động nhân sự',
    });
  }

  if (input.offerAcceptanceRatePct !== null && input.offerAcceptanceRatePct < 70 && input.openingsCount > 0) {
    recs.push({
      severity: 'INFO',
      category: 'RECRUITMENT',
      title: `Tỷ lệ chấp nhận Offer hiện đạt ${input.offerAcceptanceRatePct}%`,
      detail: 'Tỷ lệ ứng viên nhận việc dưới 70%. Nên rà soát độ cạnh tranh của khung lương chào tuyển và thời gian phản hồi vòng phỏng vấn.',
      actionHref: '/recruitment-ats',
      actionLabel: 'Xem phễu tuyển dụng',
    });
  }

  return recs;
}
