'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Award, Plus, CheckCircle2,
  Calendar, Layers, Sparkles, TrendingUp, Trash2, X, RefreshCw,
  Filter, User, Building2, Check, Award as Medal, ShieldAlert,
  ArrowRight, CheckCheck, FileSpreadsheet, BookOpen, FileText,
  Printer, Calculator, BarChart3, HelpCircle, Eye, Sliders,
  ChevronRight, Bookmark, ArrowUpRight, CheckSquare, ShieldCheck,
  Percent, Info, ExternalLink, Scale, Pencil
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, Badge, Input, Select, Textarea } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toaster';
import { printDocumentElement } from '@/components/ui/print';
import { Portal } from '@/components/ui/portal';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

interface AppraisalCycle {
  participantScope?: string;
  participantIds?: string[];
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
  organizationSector?: 'enterprise' | 'state';
  publicPersonnelType?: 'CIVIL_SERVANT' | 'PUBLIC_EMPLOYEE' | null;
  periodType?: 'CUSTOM' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  annualSourceFrequency?: 'MONTHLY' | 'QUARTERLY' | null;
  generalCriteriaWeight?: number;
  taskCriteriaWeight?: number;
  quantityCriteriaWeight?: number;
  qualityCriteriaWeight?: number;
  progressCriteriaWeight?: number;
  _count?: { goals: number };
}

interface AppraisalGoal {
  id: string;
  cycleId: string;
  userId: string;
  employeeName: string;
  kraTitle: string;
  description: string;
  weightage: number;
  criteriaGroup?: 'GENERAL' | 'RESULT';
  targetMetric: string;
  measurementMode?: string;
  targetValue?: number | null;
  actualValue?: number | null;
  measurementUnit?: string | null;
  scoreRationale?: string | null;
  assignmentScope?: 'INDIVIDUAL' | 'ORG_UNIT';
  assignmentOrgUnitId?: string | null;
  assignmentOrgUnitName?: string | null;
  assignmentOrgUnitCode?: string | null;
  assignmentOrgUnit?: { id: string; name: string; code: string } | null;
  managerScore?: number;
  quantityScore?: number | null;
  qualityScore?: number | null;
  progressScore?: number | null;
  finalScore?: number;
  status: string;
  cycle?: AppraisalCycle;
  evidences?: { id: string; description: string; metricValue?: string | null; evidenceUrl?: string | null; createdAt: string; submittedBy?: string }[];
}

type GoalEvaluationStatus = 'WAITING_EVIDENCE' | 'WAITING_SCORE' | 'SCORED';
type GoalEvaluationFilter = GoalEvaluationStatus | 'ALL';

type AppraisalPeriodType = 'CUSTOM' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
interface AppraisalCycleForm {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  description: string;
  periodType: AppraisalPeriodType;
  month: number;
  quarter: number;
  annualSourceFrequency: 'MONTHLY' | 'QUARTERLY';
  quantityCriteriaWeight: number;
  qualityCriteriaWeight: number;
  progressCriteriaWeight: number;
}

function periodBounds(year: number, periodType: AppraisalPeriodType, month: number, quarter: number) {
  if (periodType === 'MONTHLY') {
    const monthIndex = Math.max(0, Math.min(11, month - 1));
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return { startDate: `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`, endDate: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` };
  }
  if (periodType === 'QUARTERLY') {
    const startMonth = (Math.max(1, Math.min(4, quarter)) - 1) * 3;
    const endMonth = startMonth + 2;
    const lastDay = new Date(year, endMonth + 1, 0).getDate();
    return { startDate: `${year}-${String(startMonth + 1).padStart(2, '0')}-01`, endDate: `${year}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` };
  }
  if (periodType === 'ANNUAL') return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  return null;
}

const formatAppraisalScore = (value: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

function goalWeightedContribution(goal: AppraisalGoal) {
  if (goal.finalScore == null) return null;
  const withinGroup = goal.finalScore * goal.weightage / 100;
  if (goal.cycle?.organizationSector === 'state') {
    const categoryWeight = goal.criteriaGroup === 'GENERAL'
      ? goal.cycle.generalCriteriaWeight ?? 30
      : goal.cycle.taskCriteriaWeight ?? 70;
    return {
      points: withinGroup * categoryWeight / 100,
      formula: `${formatAppraisalScore(goal.finalScore)} × ${formatAppraisalScore(goal.weightage)}% × ${formatAppraisalScore(categoryWeight)}%`,
      groupName: goal.criteriaGroup === 'GENERAL' ? 'tiêu chí chung' : 'kết quả nhiệm vụ',
    };
  }
  return {
    points: withinGroup,
    formula: `${formatAppraisalScore(goal.finalScore)} × ${formatAppraisalScore(goal.weightage)}%`,
    groupName: '',
  };
}

function goalContributionRule(goal: AppraisalGoal) {
  if (goal.cycle?.organizationSector !== 'state') return 'Điểm KPI × trọng số mục tiêu';
  const categoryWeight = goal.criteriaGroup === 'GENERAL'
    ? goal.cycle.generalCriteriaWeight ?? 30
    : goal.cycle.taskCriteriaWeight ?? 70;
  return `Điểm KPI × trọng số trong nhóm × ${formatAppraisalScore(categoryWeight)}%`;
}

function goalContributionGroupLabel(goal: AppraisalGoal) {
  if (goal.cycle?.organizationSector !== 'state') return '';
  const categoryWeight = goal.criteriaGroup === 'GENERAL'
    ? goal.cycle.generalCriteriaWeight ?? 30
    : goal.cycle.taskCriteriaWeight ?? 70;
  return `${goal.criteriaGroup === 'GENERAL' ? 'Tiêu chí chung' : 'Kết quả nhiệm vụ'} · tối đa ${formatAppraisalScore(categoryWeight)} điểm`;
}

function goalGroupWeightTotal(goals: AppraisalGoal[], goal: AppraisalGoal) {
  return goals.filter(item => item.userId === goal.userId && item.cycleId === goal.cycleId && item.criteriaGroup === goal.criteriaGroup)
    .reduce((sum, item) => sum + item.weightage, 0);
}

const goalEvaluationStatus = (goal: AppraisalGoal): GoalEvaluationStatus => {
  if (goal.cycle?.organizationSector === 'state' && goal.criteriaGroup === 'RESULT' && goal.cycle.periodType !== 'CUSTOM'
    && (goal.quantityScore == null || goal.qualityScore == null || goal.progressScore == null)) {
    return (goal.evidences?.length ?? 0) > 0 ? 'WAITING_SCORE' : 'WAITING_EVIDENCE';
  }
  if (goal.finalScore != null || goal.managerScore != null) return 'SCORED';
  if (goal.cycle?.organizationSector === 'state' && goal.criteriaGroup === 'GENERAL') return 'WAITING_SCORE';
  return (goal.evidences?.length ?? 0) > 0 ? 'WAITING_SCORE' : 'WAITING_EVIDENCE';
};

function safeEvidenceHref(value?: string | null) {
  const href = value?.trim();
  if (!href) return null;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  try {
    const parsed = new URL(href);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? href : null;
  } catch {
    return null;
  }
}

const GOAL_EVALUATION_STATUS_LABEL: Record<GoalEvaluationStatus, string> = {
  WAITING_EVIDENCE: 'Chờ cập nhật kết quả',
  WAITING_SCORE: 'Chờ quản lý chấm',
  SCORED: 'Đã chấm',
};

interface EmployeeItem {
  id: string;
  fullName: string;
  employeeCode: string | null;
  jobTitle?: string;
  status?: string;
  employmentStatus?: 'ACTIVE' | 'PROBATION' | 'RESIGNED' | 'RETIRED';
  orgUnitId?: string | null;
  orgUnit?: { id: string; name: string; code: string } | null;
}

interface OrgUnitItem {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  path?: string;
}

interface PublicDecisionRow {
  userId: string;
  employeeName: string;
  jobTitle?: string | null;
  orgUnitName: string;
  score: number | null;
  scoreClassification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY' | null;
  complete: boolean;
  missingTaskEvidence?: boolean;
  missingPublicDimensions?: boolean;
  periodsRequired?: number;
  periodsCompleted?: number;
  comparableGroup: string;
  finalClassification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY' | null;
  excellentCriteriaConfirmed: boolean;
  quotaExceptionApproved: boolean;
  exceptionDecisionNo: string;
  decisionNote: string;
  decided: boolean;
}

interface KpiLibraryItem {
  kraTitle: string;
  targetMetric: string;
  weightage: number;
  description: string;
}

interface KpiLibraryDepartment {
  department: string;
  deptName: string;
  items: KpiLibraryItem[];
}

type PublicDecisionDraft = {
  userId: string;
  comparableGroup: string;
  finalClassification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY';
  excellentCriteriaConfirmed: boolean;
  quotaExceptionApproved: boolean;
  exceptionDecisionNo: string;
  decisionNote: string;
};

const PUBLIC_CLASSIFICATIONS = [
  { value: 'EXCELLENT', label: 'Hoàn thành xuất sắc nhiệm vụ' },
  { value: 'GOOD', label: 'Hoàn thành tốt nhiệm vụ' },
  { value: 'SATISFACTORY', label: 'Hoàn thành nhiệm vụ' },
  { value: 'UNSATISFACTORY', label: 'Không hoàn thành nhiệm vụ' },
] as const;

const publicClassificationRank = (value?: string | null) => ({ UNSATISFACTORY: 0, SATISFACTORY: 1, GOOD: 2, EXCELLENT: 3 }[value ?? ''] ?? -1);

function isInOrgUnitSubtree(units: OrgUnitItem[], candidateId?: string | null, parentId?: string | null) {
  if (!candidateId || !parentId) return false;
  let current = units.find(unit => unit.id === candidateId);
  while (current) {
    if (current.id === parentId) return true;
    current = current.parentId ? units.find(unit => unit.id === current!.parentId) : undefined;
  }
  return false;
}

// Thư viện Mục tiêu KPI Mẫu theo Khối Phòng Ban
const KPI_LIBRARY: KpiLibraryDepartment[] = [
  {
    department: 'tech',
    deptName: 'Khối Công Nghệ & Kỹ Thuật (Tech / DevOps / QA)',
    items: [
      {
        kraTitle: 'Đảm bảo Độ sẵn sàng Hệ thống & Hạ tầng Dịch vụ (System SLA & Uptime)',
        targetMetric: 'Đạt SLA Uptime >= 99.9%, MTTR < 15 phút khi xảy ra sự cố gián đoạn',
        weightage: 30,
        description: 'Vận hành hạ tầng máy chủ Kubernetes/Docker, giám sát cảnh báo Prometheus/Grafana 24/7 và ứng cứu sự cố kịp thời.',
      },
      {
        kraTitle: 'Tốc độ Bàn giao Tính năng & Năng suất Sprint (Delivery Velocity)',
        targetMetric: 'Hoàn thành >= 95% Story Points cam kết trong mỗi Sprint chu kỳ',
        weightage: 25,
        description: 'Phát triển các module theo đúng tiến độ Jira, tuân thủ Clean Architecture và hoàn thành kiểm thử đơn vị.',
      },
      {
        kraTitle: 'Chất lượng Sản phẩm & Kiểm soát Lỗi Hệ thống (Software Quality & Defect Rate)',
        targetMetric: 'Tỷ lệ Bug nghiêm trọng trên Production = 0, Bug thứ yếu <= 2 lỗi/tháng',
        weightage: 25,
        description: 'Tự động hóa CI/CD, tăng độ bao phủ Unit Test >= 80%, thực hiện Code Review nghiêm ngặt trước khi merge.',
      },
      {
        kraTitle: 'Tối ưu Chi phí Đám mây & Ứng dụng Công nghệ Mới (Cloud Optimization & R&D)',
        targetMetric: 'Tối ưu tiết kiệm >= 15% chi phí Cloud AWS/GCP so với định mức',
        weightage: 20,
        description: 'Tái cấu trúc tài nguyên nhàn rỗi, nghiên cứu tích hợp AI Agent tự động hóa vận hành nội bộ.',
      },
    ],
  },
  {
    department: 'sales',
    deptName: 'Khối Kinh Doanh & Tiếp Thị (Sales / Marketing)',
    items: [
      {
        kraTitle: 'Chỉ tiêu Doanh thu Thực thu (Revenue Targets)',
        targetMetric: 'Đạt >= 100% hạn mức doanh số cam kết theo quý (Tối thiểu 1.5 Tỷ VNĐ)',
        weightage: 40,
        description: 'Tìm kiếm, đàm phán và chốt hợp đồng cung cấp giải pháp phần mềm cho khách hàng doanh nghiệp.',
      },
      {
        kraTitle: 'Phát triển Khách hàng Doanh nghiệp Mới (New Client Acquisition)',
        targetMetric: 'Ký kết thành công tối thiểu 10 khách hàng B2B mới trong quý',
        weightage: 25,
        description: 'Mở rộng tệp đối tác chiến lược, thực hiện demo sản phẩm chuyên sâu và chốt hợp đồng khung.',
      },
      {
        kraTitle: 'Tỷ lệ Chuyển đổi Phễu Khách hàng (Sales Pipeline Conversion Rate)',
        targetMetric: 'Tỷ lệ chuyển đổi từ Lead sang Hợp đồng đạt >= 18%',
        weightage: 20,
        description: 'Chăm sóc và nuôi dưỡng danh sách khách hàng tiềm năng qua hệ thống CRM, rút ngắn chu kỳ bán hàng.',
      },
      {
        kraTitle: 'Chỉ số Hài lòng & Tái ký Hợp đồng (CSAT & Client Retention)',
        targetMetric: 'Điểm CSAT >= 90%, Tỷ lệ khách hàng gia hạn dịch vụ >= 85%',
        weightage: 15,
        description: 'Hỗ trợ khách hàng sau bán, tiếp nhận phản hồi và xử lý nhanh chóng các thắc mắc dịch vụ.',
      },
    ],
  },
  {
    department: 'finance',
    deptName: 'Khối Tài Chính & Kế Toán (Finance / Accounting)',
    items: [
      {
        kraTitle: 'Quyết toán Sổ sách & Báo cáo Tài chính Định kỳ (Financial Statements on-time)',
        targetMetric: 'Hoàn tất báo cáo tài chính trước ngày 10 hàng tháng, độ chính xác 100%',
        weightage: 35,
        description: 'Hạch toán đầy đủ nghiệp vụ kế toán, đối chiếu số liệu ngân hàng, khóa sổ và phát hành báo cáo tài chính.',
      },
      {
        kraTitle: 'Quản lý Dòng tiền & Thu hồi Công nợ (Cashflow & AR Recovery)',
        targetMetric: 'Tỷ lệ thu hồi nợ đúng hạn >= 95%, nợ quá hạn xấu <= 2%',
        weightage: 30,
        description: 'Theo dõi chặt chẽ hạn mức công nợ khách hàng, đôn đốc thanh toán và phối hợp giải quyết vướng mắc chứng từ.',
      },
      {
        kraTitle: 'Kiểm soát Ngân sách Vận hành (OpEx Budget Management)',
        targetMetric: 'Chi phí vận hành thực tế không vượt quá hạn mức ngân sách được duyệt',
        weightage: 20,
        description: 'Kiểm soát chi phí định mức từng phòng ban, tối ưu hóa các khoản mua sắm và chi tiêu thường xuyên.',
      },
      {
        kraTitle: 'Tuân thủ Pháp luật Thuế & Kiểm toán (Tax Compliance & Audit)',
        targetMetric: 'Kê khai thuế VAT, TNCN, TNDN đúng hạn 100%, 0 vi phạm pháp luật thuế',
        weightage: 15,
        description: 'Cập nhật kịp thời chính sách thuế mới, chuẩn bị hồ sơ kiểm toán độc lập minh bạch, chuẩn xác.',
      },
    ],
  },
  {
    department: 'hr',
    deptName: 'Khối Nhân Sự & Hành Chính (HR / Administration)',
    items: [
      {
        kraTitle: 'Tuyển dụng Nhân tài Đúng hạn & Chất lượng (Recruitment Fulfillment)',
        targetMetric: 'Đáp ứng >= 90% nhu cầu nhân sự các phòng ban với Time-to-hire < 30 ngày',
        weightage: 35,
        description: 'Xây dựng thương hiệu nhà tuyển dụng, tìm nguồn ứng viên chất lượng cao, tổ chức phỏng vấn chuyên nghiệp.',
      },
      {
        kraTitle: 'Tỷ lệ Duy trì Nhân sự Cốt lõi & Gắn kết (Retention & Engagement)',
        targetMetric: 'Tỷ lệ thôi việc của nhân sự chủ chốt < 5%/năm, điểm gắn kết eNPS >= +40',
        weightage: 25,
        description: 'Thực hiện chính sách đãi ngộ linh hoạt, phỏng vấn giữ chân nhân sự và tổ chức các hoạt động văn hóa nội bộ.',
      },
      {
        kraTitle: 'Hoàn thành đào tạo bắt buộc và áp dụng kiến thức',
        targetMetric: 'Hoàn thành 100% kế hoạch đào tạo bắt buộc; tỷ lệ vận dụng sau đào tạo đạt ít nhất 85%',
        weightage: 20,
        description: 'Theo dõi khóa đào tạo bắt buộc, ghi nhận hoàn thành và kết quả áp dụng vào công việc.',
      },
      {
        kraTitle: 'Chính sách Lao động, Chấm công & Bảo hiểm (C&B & Labour Compliance)',
        targetMetric: 'Tính lương và đóng BHXH đúng hạn 100%, giải quyết 100% chế độ phúc lợi đúng luật',
        weightage: 20,
        description: 'Quản lý dữ liệu chấm công điện tử, đồng bộ bảng lương, trích nộp bảo hiểm xã hội chuẩn theo luật lao động.',
      },
    ],
  },
];

export default function PerformanceKpiPage() {
  const currentUser = useAuthStore(state => state.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [printConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(printConfig);
  const publicEmployee = printConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE';
  const canCalibrate = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD'].includes(role)));
  const canManageGoals = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD'].includes(role)));
  const canScoreGoals = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD'].includes(role)));
  const canManageCycles = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD'].includes(role)));
  const canDeleteCycles = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER'].includes(role)));
  const canAdministerGoals = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD'].includes(role)));
  const canManageKpiLibrary = Boolean(currentUser?.roles.includes('ADMIN'));

  const searchParams = useSearchParams();
  const validTabs = useMemo(() => canCalibrate && !isEnterprise ? ['goals', 'templates', 'rubrics', 'calibration', 'cycles'] : ['goals', 'templates', 'rubrics', 'cycles'], [isEnterprise, canCalibrate]);
  type TabType = typeof validTabs[number];

  const paramTab = searchParams.get('tab');
  const initialTab = (paramTab && (validTabs as readonly string[]).includes(paramTab)) ? (paramTab as TabType) : 'goals';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Lắng nghe URL searchParams để chuyển tab tức thì khi bấm từ Sidebar menu (?tab=templates hoặc ?tab=rubrics)
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && (validTabs as readonly string[]).includes(currentTab)) {
      setActiveTab(currentTab as TabType);
    } else {
      setActiveTab('goals');
    }
  }, [searchParams, validTabs]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'goals') {
      router.replace('/performance', { scroll: false });
    } else {
      router.replace(`/performance?tab=${tab}`, { scroll: false });
    }
  };

  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('ALL');
  const [selectedEvaluationFilter, setSelectedEvaluationFilter] = useState<GoalEvaluationFilter>('ALL');

  // Modals
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [evidenceGoal, setEvidenceGoal] = useState<AppraisalGoal | null>(null);
  const [evidenceViewGoal, setEvidenceViewGoal] = useState<AppraisalGoal | null>(null);
  const [evidenceForm, setEvidenceForm] = useState({ description: '', metricValue: '', evidenceUrl: '' });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [calibrationCycleId, setCalibrationCycleId] = useState('');
  const [publicDecisionDrafts, setPublicDecisionDrafts] = useState<Record<string, PublicDecisionDraft>>({});
  const [isKpiLibraryOpen, setIsKpiLibraryOpen] = useState(false);
  const [selectedKpiDept, setSelectedKpiDept] = useState<'tech' | 'sales' | 'finance' | 'hr'>('tech');
  const [isKpiTemplateFormOpen, setIsKpiTemplateFormOpen] = useState(false);
  const [editingKpiTemplateIndex, setEditingKpiTemplateIndex] = useState<number | null>(null);
  const [kpiTemplateForm, setKpiTemplateForm] = useState<KpiLibraryItem>({ kraTitle: '', targetMetric: '', weightage: 20, description: '' });
  const [selectedTemplateForPrint, setSelectedTemplateForPrint] = useState<'kra' | null>(null);

  // Active items for modals
  const [selectedGoal, setSelectedGoal] = useState<AppraisalGoal | null>(null);

  // Form Cycle
  const [selectCycleParticipants, setSelectCycleParticipants] = useState(false);
  const [cycleParticipantIds, setCycleParticipantIds] = useState<string[]>([]);
  const [cycleForm, setCycleForm] = useState<AppraisalCycleForm>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const periodType: AppraisalPeriodType = isEnterprise ? 'CUSTOM' : 'MONTHLY';
    const bounds = periodBounds(year, periodType, month, Math.ceil(month / 3));
    return {
      name: isEnterprise ? `Chu kỳ đánh giá KPI ${year}` : `Đánh giá công vụ tháng ${String(month).padStart(2, '0')}/${year}`,
      year,
      startDate: bounds?.startDate ?? `${year}-01-01`,
      endDate: bounds?.endDate ?? `${year}-12-31`,
      description: 'Theo dõi kết quả công việc và căn cứ đánh giá theo quy chế của cơ quan.',
      periodType,
      month,
      quarter: Math.ceil(month / 3),
      annualSourceFrequency: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY',
      quantityCriteriaWeight: 33.33,
      qualityCriteriaWeight: 33.33,
      progressCriteriaWeight: 33.34,
    };
  });

  // Form Goal
  const [goalForm, setGoalForm] = useState({
    cycleId: '',
    assignmentScope: 'INDIVIDUAL' as 'INDIVIDUAL' | 'ORG_UNIT',
    userId: '',
    orgUnitId: '',
    kraTitle: '',
    targetMetric: '',
    weightage: 25,
    criteriaGroup: 'RESULT' as 'GENERAL' | 'RESULT',
    description: '',
    measurementMode: 'MANUAL', targetValue: '', measurementUnit: '',
  });

  // Form Score
  const [managerScore, setManagerScore] = useState<number | null>(null);
  const [actualKpiValue, setActualKpiValue] = useState('');
  const [scoreRationale, setScoreRationale] = useState('');
  const [publicTaskScores, setPublicTaskScores] = useState<{ quantityScore: number | null; qualityScore: number | null; progressScore: number | null }>({ quantityScore: null, qualityScore: null, progressScore: null });

  // Form Sync Appraisal
  const [syncForm, setSyncForm] = useState({
    userId: '',
    year: 2026,
    comment: 'Kết quả đánh giá nhiệm vụ theo kỳ và căn cứ áp dụng',
    decisionNo: 'QĐ-ĐGCB/2026',
  });

  // Queries
  const { data: cycles = [], isLoading: isLoadingCycles } = useQuery<AppraisalCycle[]>({
    queryKey: ['hrms-performance-cycles'],
    queryFn: async () => (await api.get('/hrms/performance/cycles')).data,
  });
  const stateCycles = cycles.filter(cycle => cycle.organizationSector === 'state');
  const calibrationCycles = stateCycles.filter(cycle => cycle.periodType === 'ANNUAL' || cycle.periodType === 'CUSTOM');
  const effectiveCalibrationCycleId = calibrationCycleId || calibrationCycles.find(cycle => cycle.periodType === 'ANNUAL')?.id || calibrationCycles[0]?.id || '';

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<AppraisalGoal[]>({
    queryKey: ['hrms-performance-goals'],
    queryFn: async () => (await api.get('/hrms/performance/goals')).data,
  });

  const { data: employees = [] } = useQuery<EmployeeItem[]>({
    queryKey: ['employees-simple-list'],
    queryFn: async () => (await api.get('/employees')).data,
  });

  const { data: orgUnits = [] } = useQuery<OrgUnitItem[]>({
    queryKey: ['org-units', 'performance-assignment'],
    queryFn: async () => (await api.get('/org-units')).data,
  });

  const { data: effectiveSettings } = useQuery<Record<string, unknown>>({
    queryKey: ['settings-effective'],
    queryFn: async () => (await api.get('/settings/effective')).data,
  });
  const kpiLibrary = useMemo<KpiLibraryDepartment[]>(
    () => Array.isArray(effectiveSettings?.KPI_TEMPLATE_LIBRARY)
      ? effectiveSettings.KPI_TEMPLATE_LIBRARY as KpiLibraryDepartment[]
      : KPI_LIBRARY,
    [effectiveSettings?.KPI_TEMPLATE_LIBRARY],
  );

  useEffect(() => {
    const cycleId = searchParams.get('cycleId');
    if (cycleId && cycles.some(cycle => cycle.id === cycleId)) setSelectedCycleFilter(cycleId);
  }, [searchParams, cycles]);

  const { data: publicDecisions = [], isLoading: isLoadingPublicDecisions } = useQuery<PublicDecisionRow[]>({
    queryKey: ['hrms-performance-public-decisions', effectiveCalibrationCycleId],
    queryFn: async () => (await api.get('/hrms/performance/public-decisions', { params: { cycleId: effectiveCalibrationCycleId } })).data,
    enabled: Boolean(effectiveCalibrationCycleId),
  });

  const savePublicDecisionMutation = useMutation({
    mutationFn: async (draft: PublicDecisionDraft) => (await api.post('/hrms/performance/public-decisions', { cycleId: effectiveCalibrationCycleId, ...draft })).data,
    onSuccess: () => {
      toast('Đã lưu kết luận hiệu chuẩn công vụ.', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-public-decisions', effectiveCalibrationCycleId] });
    },
    onError: (err) => toast('Không lưu được kết luận: ' + errorMessage(err), 'error'),
  });

  const updatePublicDecisionDraft = (row: PublicDecisionRow, patch: Partial<PublicDecisionDraft>) => {
    const current = publicDecisionDrafts[row.userId] ?? {
      userId: row.userId,
      comparableGroup: row.comparableGroup,
      finalClassification: row.finalClassification ?? row.scoreClassification ?? 'UNSATISFACTORY',
      excellentCriteriaConfirmed: row.excellentCriteriaConfirmed,
      quotaExceptionApproved: row.quotaExceptionApproved,
      exceptionDecisionNo: row.exceptionDecisionNo,
      decisionNote: row.decisionNote,
    };
    setPublicDecisionDrafts(previous => ({ ...previous, [row.userId]: { ...current, ...patch } }));
  };

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: async (payload: typeof cycleForm) => {
      if (isEnterprise && selectCycleParticipants && !cycleParticipantIds.length) throw new Error('Chọn ít nhất một người thuộc đối tượng đánh giá');
      return (await api.post('/hrms/performance/cycles', {
        participantIds: isEnterprise && selectCycleParticipants ? cycleParticipantIds : undefined,
        name: payload.name,
        year: Number(payload.year),
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
        description: payload.description,
        periodType: isEnterprise ? 'CUSTOM' : payload.periodType,
        annualSourceFrequency: isEnterprise || payload.periodType !== 'ANNUAL' ? undefined : payload.annualSourceFrequency,
        quantityCriteriaWeight: !isEnterprise && publicEmployee ? Number(payload.quantityCriteriaWeight) : undefined,
        qualityCriteriaWeight: !isEnterprise && publicEmployee ? Number(payload.qualityCriteriaWeight) : undefined,
        progressCriteriaWeight: !isEnterprise && publicEmployee ? Number(payload.progressCriteriaWeight) : undefined,
      })).data;
    },
    onSuccess: () => {
      toast('Đã khởi tạo kỳ đánh giá thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
      setIsCycleModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const saveKpiLibraryMutation = useMutation({
    mutationFn: async (library: KpiLibraryDepartment[]) => (await api.patch('/admin/settings', { values: { KPI_TEMPLATE_LIBRARY: library } })).data,
    onSuccess: (settings: Record<string, unknown>) => {
      queryClient.setQueryData(['settings-effective'], settings);
      toast('Đã lưu thư viện mục tiêu KPI mẫu.', 'success');
      setIsKpiTemplateFormOpen(false);
    },
    onError: (err) => toast('Không lưu được thư viện KPI: ' + errorMessage(err), 'error'),
  });

  const toggleCycleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      return (await api.patch(`/hrms/performance/cycles/${id}`, { status: newStatus })).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật trạng thái chu kỳ đánh giá!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const deleteCycleMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/performance/cycles/${id}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa kỳ đánh giá!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const cycleId = goalForm.cycleId || cycles[0]?.id;
      if (!cycleId) throw new Error('Vui lòng chọn hoặc khởi tạo một kỳ đánh giá trước');
      if (goalForm.assignmentScope === 'INDIVIDUAL' && !goalForm.userId) throw new Error('Vui lòng chọn nhân sự thực hiện');
      if (goalForm.assignmentScope === 'ORG_UNIT' && !goalForm.orgUnitId) throw new Error('Vui lòng chọn phòng ban hoặc đơn vị thực hiện');
      return (await api.post('/hrms/performance/goals', {
        cycleId,
        ...(goalForm.assignmentScope === 'INDIVIDUAL' ? { userId: goalForm.userId } : { orgUnitId: goalForm.orgUnitId }),
        kraTitle: goalForm.kraTitle,
        targetMetric: goalForm.targetMetric,
        weightage: Number(goalForm.weightage) || 20,
        criteriaGroup: goalForm.criteriaGroup,
        description: goalForm.description,
        measurementMode: isEnterprise ? goalForm.measurementMode : 'MANUAL',
        targetValue: isEnterprise && goalForm.measurementMode !== 'MANUAL' ? Number(goalForm.targetValue) : undefined,
        measurementUnit: goalForm.measurementUnit || undefined,
      })).data;
    },
    onSuccess: (result: { createdCount: number; assignmentScope: 'INDIVIDUAL' | 'ORG_UNIT'; assignmentOrgUnit?: { name: string } | null }) => {
      toast(result.assignmentScope === 'ORG_UNIT'
        ? `Đã giao KPI cho ${result.createdCount} nhân sự trong ${result.assignmentOrgUnit?.name ?? 'đơn vị'} và gửi thông báo đến từng người.`
        : 'Đã giao KPI và gửi thông báo cho nhân viên.', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
      setIsGoalModalOpen(false);
      setGoalForm({
        cycleId: '',
        assignmentScope: 'INDIVIDUAL',
        userId: '',
        orgUnitId: '',
        kraTitle: '',
        targetMetric: '',
        weightage: 25,
        criteriaGroup: 'RESULT',
        description: '',
        measurementMode: 'MANUAL', targetValue: '', measurementUnit: '',
      });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const scoreGoalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGoal) return;
      const publicTaskGoal = selectedGoal.cycle?.organizationSector === 'state' && selectedGoal.criteriaGroup === 'RESULT' && selectedGoal.cycle.periodType !== 'CUSTOM';
      if (publicTaskGoal) {
        const { quantityScore, qualityScore, progressScore } = publicTaskScores;
        if (quantityScore === null || qualityScore === null || progressScore === null) throw new Error('Nhập đủ điểm số lượng, chất lượng và tiến độ');
        return (await api.patch(`/hrms/performance/goals/${selectedGoal.id}/score`, { quantityScore, qualityScore, progressScore })).data;
      }
      const quantitative = selectedGoal.cycle?.organizationSector === 'enterprise' && selectedGoal.measurementMode && selectedGoal.measurementMode !== 'MANUAL';
      if (!quantitative && managerScore === null) throw new Error('Nhập điểm sau khi đối chiếu kết quả và căn cứ');
      if (quantitative && actualKpiValue === '') throw new Error('Nhập kết quả thực tế để tính điểm');
      return (await api.patch(`/hrms/performance/goals/${selectedGoal.id}/score`, { managerScore: quantitative ? undefined : managerScore, actualValue: quantitative ? Number(actualKpiValue) : undefined, scoreRationale })).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật điểm đánh giá KRA!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setIsScoreModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/performance/goals/${id}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa mục tiêu KRA!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const addEvidenceMutation = useMutation({
    mutationFn: async () => {
      if (!evidenceGoal) throw new Error('Chưa chọn mục tiêu');
      if (evidenceForm.description.trim().length < 3) throw new Error('Nhập mô tả kết quả hoặc minh chứng');
      return (await api.post(`/hrms/performance/goals/${evidenceGoal.id}/evidence`, {
        description: evidenceForm.description.trim(),
        metricValue: evidenceForm.metricValue.trim() || undefined,
        evidenceUrl: evidenceForm.evidenceUrl.trim() || undefined,
      })).data;
    },
    onSuccess: () => {
      toast('Đã lưu kết quả và minh chứng.', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setEvidenceGoal(null);
      setEvidenceForm({ description: '', metricValue: '', evidenceUrl: '' });
    },
    onError: (err) => toast('Không lưu được minh chứng: ' + errorMessage(err), 'error'),
  });

  const syncAppraisalMutation = useMutation({
    mutationFn: async () => {
      if (!syncForm.userId) throw new Error('Vui lòng chọn nhân sự cần đồng bộ');
      return (await api.post('/hrms/performance/sync-appraisal', syncForm)).data;
    },
    onSuccess: () => {
      toast('Đã đồng bộ kết quả vào Hồ sơ Cán bộ (mục QT ĐGCB)!', 'success');
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      setIsSyncModalOpen(false);
    },
    onError: (err) => toast('Lỗi đồng bộ: ' + errorMessage(err), 'error'),
  });

  if (isLoadingCycles || isLoadingGoals) {
    return <LoadingState text="Đang tải dữ liệu KPI..." />;
  }

  const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];
  const goalSetupCycles = cycles.filter((cycle) => cycle.status === 'ACTIVE' && cycle.organizationSector === (isEnterprise ? 'enterprise' : 'state') && (isEnterprise || cycle.periodType !== 'ANNUAL'));
  const goalWeightTotal = (goal: AppraisalGoal) => goals
    .filter((item) => item.userId === goal.userId && item.cycleId === goal.cycleId)
    .reduce((sum, item) => sum + item.weightage, 0);
  const enterpriseGoals = goals.filter(goal => goal.cycle?.organizationSector === 'enterprise');
  const incompleteEvaluationCount = Array.from(enterpriseGoals.reduce((groups, goal) => {
    const key = `${goal.cycleId}:${goal.userId}`;
    const current = groups.get(key) ?? { weight: 0, missingScore: false, missingEvidence: false };
    groups.set(key, {
      weight: current.weight + goal.weightage,
      missingScore: current.missingScore || goal.finalScore == null,
      missingEvidence: current.missingEvidence || (goal.evidences?.length ?? 0) === 0,
    });
    return groups;
  }, new Map<string, { weight: number; missingScore: boolean; missingEvidence: boolean }>() ).values())
    .filter(group => Math.abs(group.weight - 100) > .001 || group.missingScore || group.missingEvidence).length;
  const openGoalSetup = () => {
    if (!goalSetupCycles.length) {
      toast('Chưa có chu kỳ đang mở cho chế độ tổ chức hiện tại. Hãy khởi tạo chu kỳ trước khi giao mục tiêu.', 'error');
      if (canManageCycles) openCycleModal();
      return;
    }
    setGoalForm((form) => ({ ...form, cycleId: goalSetupCycles[0].id }));
    setIsGoalModalOpen(true);
  };

  const openKpiTemplateForm = (item?: KpiLibraryItem, index?: number) => {
    setEditingKpiTemplateIndex(typeof index === 'number' ? index : null);
    setKpiTemplateForm(item ? { ...item } : { kraTitle: '', targetMetric: '', weightage: 20, description: '' });
    setIsKpiTemplateFormOpen(true);
  };

  const saveKpiTemplate = () => {
    const deptIndex = kpiLibrary.findIndex(department => department.department === selectedKpiDept);
    if (deptIndex < 0) {
      toast('Chưa có nhóm phòng ban để lưu mục tiêu mẫu.', 'error');
      return;
    }
    if (!kpiTemplateForm.kraTitle.trim() || !kpiTemplateForm.targetMetric.trim() || !kpiTemplateForm.description.trim()) {
      toast('Nhập tên mục tiêu, chỉ số đo và mô tả trước khi lưu.', 'error');
      return;
    }
    if (!Number.isFinite(Number(kpiTemplateForm.weightage)) || Number(kpiTemplateForm.weightage) < 1 || Number(kpiTemplateForm.weightage) > 100) {
      toast('Trọng số tham khảo phải nằm trong khoảng 1–100%.', 'error');
      return;
    }
    const nextLibrary = kpiLibrary.map((department, index) => {
      if (index !== deptIndex) return department;
      const items = [...department.items];
      if (editingKpiTemplateIndex === null) items.push({ ...kpiTemplateForm, kraTitle: kpiTemplateForm.kraTitle.trim(), targetMetric: kpiTemplateForm.targetMetric.trim(), description: kpiTemplateForm.description.trim(), weightage: Number(kpiTemplateForm.weightage) });
      else items[editingKpiTemplateIndex] = { ...kpiTemplateForm, kraTitle: kpiTemplateForm.kraTitle.trim(), targetMetric: kpiTemplateForm.targetMetric.trim(), description: kpiTemplateForm.description.trim(), weightage: Number(kpiTemplateForm.weightage) };
      return { ...department, items };
    });
    saveKpiLibraryMutation.mutate(nextLibrary);
  };

  const deleteKpiTemplate = (index: number) => {
    const department = kpiLibrary.find(item => item.department === selectedKpiDept);
    const item = department?.items[index];
    if (!department || !item || !window.confirm(`Xóa mục tiêu mẫu “${item.kraTitle}” khỏi thư viện? Việc này không xóa các mục tiêu đã giao cho nhân viên.`)) return;
    const nextLibrary = kpiLibrary.map(current => current.department !== selectedKpiDept
      ? current
      : { ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) });
    saveKpiLibraryMutation.mutate(nextLibrary);
  };

  const activeEmployees = employees.filter(employee => employee.id !== currentUser?.id
    && employee.status === 'ACTIVE' && ['ACTIVE', 'PROBATION'].includes(employee.employmentStatus ?? ''));
  const isRestrictedLineManager = Boolean(currentUser?.roles.includes('LINE_MANAGER')
    && !currentUser.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD'].includes(role)));
  const actorOrgUnitId = employees.find(employee => employee.id === currentUser?.id)?.orgUnitId ?? null;
  const availableAssignmentUnits = isRestrictedLineManager
    ? orgUnits.filter(unit => unit.id === actorOrgUnitId)
    : orgUnits;
  const selectedAssignmentUnit = orgUnits.find(unit => unit.id === goalForm.orgUnitId);
  const unitRecipientCount = selectedAssignmentUnit
    ? activeEmployees.filter(employee => isRestrictedLineManager
      ? employee.orgUnitId === selectedAssignmentUnit.id
      : isInOrgUnitSubtree(orgUnits, employee.orgUnitId, selectedAssignmentUnit.id)).length
    : 0;
  const cycleFilteredGoals = selectedCycleFilter === 'ALL'
    ? goals
    : goals.filter(goal => goal.cycleId === selectedCycleFilter);
  const unitFilteredGoals = selectedUnitFilter === 'ALL'
    ? cycleFilteredGoals
    : cycleFilteredGoals.filter(goal => {
      const goalUnitId = goal.assignmentOrgUnitId ?? employees.find(employee => employee.id === goal.userId)?.orgUnitId;
      return isInOrgUnitSubtree(orgUnits, goalUnitId, selectedUnitFilter);
    });
  const employeeFilterOptions = Array.from(new Map(unitFilteredGoals.map(goal => {
    const employee = employees.find(item => item.id === goal.userId);
    return [goal.userId, {
      id: goal.userId,
      name: goal.employeeName,
      code: employee?.employeeCode,
      orgUnitName: employee?.orgUnit?.name,
    }] as const;
  })).values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const employeeFilteredGoals = selectedEmployeeFilter === 'ALL'
    ? unitFilteredGoals
    : unitFilteredGoals.filter(goal => goal.userId === selectedEmployeeFilter);
  const visibleGoals = selectedEvaluationFilter === 'ALL'
    ? employeeFilteredGoals
    : employeeFilteredGoals.filter(goal => goalEvaluationStatus(goal) === selectedEvaluationFilter);
  const evaluationStatusCounts = employeeFilteredGoals.reduce<Record<GoalEvaluationStatus, number>>((counts, goal) => {
    counts[goalEvaluationStatus(goal)] += 1;
    return counts;
  }, { WAITING_EVIDENCE: 0, WAITING_SCORE: 0, SCORED: 0 });
  const updateCycleForm = (patch: Partial<typeof cycleForm>) => {
    setCycleForm(previous => {
      const next = { ...previous, ...patch };
      if (!isEnterprise) {
        const bounds = periodBounds(next.year, next.periodType, next.month, next.quarter);
        if (bounds) Object.assign(next, bounds);
      }
      return next;
    });
  };
  const openCycleModal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const periodType: AppraisalPeriodType = isEnterprise ? 'CUSTOM' : 'MONTHLY';
    const bounds = periodBounds(year, periodType, month, Math.ceil(month / 3));
    setCycleForm(previous => ({
      ...previous,
      name: isEnterprise ? `Chu kỳ đánh giá KPI ${year}` : `Đánh giá công vụ tháng ${String(month).padStart(2, '0')}/${year}`,
      year,
      startDate: bounds?.startDate ?? `${year}-01-01`,
      endDate: bounds?.endDate ?? `${year}-12-31`,
      periodType,
      month,
      quarter: Math.ceil(month / 3),
      annualSourceFrequency: 'MONTHLY',
      quantityCriteriaWeight: 33.33,
      qualityCriteriaWeight: 33.33,
      progressCriteriaWeight: 33.34,
    }));
    setIsCycleModalOpen(true);
  };
  const selectedGoalUsesPublicDimensions = Boolean(selectedGoal?.cycle?.organizationSector === 'state'
    && selectedGoal.criteriaGroup === 'RESULT' && selectedGoal.cycle.periodType !== 'CUSTOM');
  const selectedGoalRequiresEvidence = Boolean(selectedGoal && (selectedGoal.cycle?.organizationSector === 'enterprise'
    || (selectedGoal.cycle?.organizationSector === 'state' && selectedGoal.criteriaGroup === 'RESULT')));
  const selectedGoalPublicAverage = selectedGoalUsesPublicDimensions
    && publicTaskScores.quantityScore !== null && publicTaskScores.qualityScore !== null && publicTaskScores.progressScore !== null
    ? publicTaskScores.quantityScore * (selectedGoal?.cycle?.quantityCriteriaWeight ?? 100 / 3) / 100
      + publicTaskScores.qualityScore * (selectedGoal?.cycle?.qualityCriteriaWeight ?? 100 / 3) / 100
      + publicTaskScores.progressScore * (selectedGoal?.cycle?.progressCriteriaWeight ?? 100 / 3) / 100
    : null;
  const selectedGoalCanSaveScore = selectedGoalUsesPublicDimensions
    ? publicTaskScores.quantityScore !== null && publicTaskScores.qualityScore !== null && publicTaskScores.progressScore !== null
    : selectedGoal?.measurementMode && selectedGoal.measurementMode !== 'MANUAL' ? actualKpiValue !== '' && scoreRationale.trim().length >= 10 : managerScore !== null && (selectedGoal?.cycle?.organizationSector !== 'enterprise' || scoreRationale.trim().length >= 10);
  const cycleDimensionWeightTotal = cycleForm.quantityCriteriaWeight + cycleForm.qualityCriteriaWeight + cycleForm.progressCriteriaWeight;
  const cycleDimensionWeightsValid = isEnterprise || !publicEmployee || cycleForm.periodType === 'ANNUAL' || Math.abs(cycleDimensionWeightTotal - 100) < 0.001;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Đánh giá KPI"
        description={isEnterprise
          ? 'Giao mục tiêu, ghi nhận kết quả và minh chứng, rồi chấm điểm theo từng KPI và trọng số đã thống nhất.'
          : `Đánh giá nhiệm vụ theo tiêu chí chung 30% và kết quả công việc 70% (${printConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'NĐ 233/2026' : 'NĐ 335/2025'}).`}
        breadcrumbs={[{ label: 'Phát triển' }, { label: 'Đánh giá KPI' }]}
        actions={
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Link href="/performance-guide">
              <Button variant="outline" size="sm" className="h-9 w-full text-xs sm:h-8 sm:w-auto">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                Cách đánh giá
              </Button>
            </Link>
            {canManageCycles && <Button
              variant="outline"
              size="sm"
              onClick={openCycleModal}
              className="h-9 w-full text-xs sm:h-8 sm:w-auto"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Khởi tạo chu kỳ
            </Button>}
            {canManageGoals && <Button
              size="sm"
              onClick={openGoalSetup}
              className="h-9 w-full text-xs sm:h-8 sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Thiết lập mục tiêu KRA
            </Button>}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Kỳ Đánh Giá Hiện Tại"
          value={activeCycle?.name ?? 'Chưa có kỳ'}
          subtitle={activeCycle?.status === 'ACTIVE' ? 'Đang trong kỳ đánh giá' : 'Đã đóng kỳ'}
          icon={Calendar}
        />
        <NumberCard
          title="Mục Tiêu KRA/KPI"
          value={goals.length}
          subtitle={`Đã giao cho nhân sự (${goals.filter(g => g.managerScore != null).length} đã chấm)`}
          icon={Target}
        />
      </div>

      {/* Navigation Tabs (Đồng bộ chuẩn hệ thống) */}
      <div className="flex flex-wrap items-center justify-between border-b border-border gap-4">
        <div className="flex border-b border-border -mb-px space-x-1 overflow-x-auto">
          <button
            onClick={() => handleTabChange('goals')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'goals'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="h-4 w-4" />
            Mục tiêu KRA ({goals.length})
          </button>
          <button
            onClick={() => handleTabChange('templates')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'templates'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            Biểu mẫu chuẩn
          </button>
          <button
            onClick={() => handleTabChange('rubrics')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'rubrics'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Quy ước xếp loại
          </button>
          {!isEnterprise && canCalibrate && <button
            onClick={() => handleTabChange('calibration')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'calibration'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scale className="h-4 w-4" />
            Hiệu chuẩn công vụ
          </button>}
          <button
            onClick={() => handleTabChange('cycles')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'cycles'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Chu kỳ đánh giá ({cycles.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select
            value={selectedCycleFilter}
            onChange={(e) => {
              setSelectedCycleFilter(e.target.value);
              setSelectedEmployeeFilter('ALL');
            }}
            className="w-[180px] text-xs font-medium"
          >
            <option value="ALL">Tất cả chu kỳ</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </Select>
          {activeTab === 'goals' && <Select
            value={selectedUnitFilter}
            onChange={(e) => {
              setSelectedUnitFilter(e.target.value);
              setSelectedEmployeeFilter('ALL');
            }}
            searchable
            searchPlaceholder="Tìm phòng ban, khối..."
            className="w-[220px] text-xs font-medium"
          >
            <option value="ALL">Tất cả phòng ban</option>
            {orgUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.code} · {unit.name}</option>)}
          </Select>}
          {activeTab === 'goals' && <Select
            value={selectedEmployeeFilter}
            onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
            searchable
            searchPlaceholder="Tìm nhân viên..."
            className="w-[240px] text-xs font-medium"
            aria-label="Lọc mục tiêu theo nhân viên"
          >
            <option value="ALL">Tất cả nhân viên ({employeeFilterOptions.length})</option>
            {employeeFilterOptions.map(employee => <option key={employee.id} value={employee.id}>
              {employee.name}{employee.code ? ` · ${employee.code}` : ''}{employee.orgUnitName ? ` · ${employee.orgUnitName}` : ''}
            </option>)}
          </Select>}
          {activeTab === 'goals' && <Select
            value={selectedEvaluationFilter}
            onChange={(e) => setSelectedEvaluationFilter(e.target.value as GoalEvaluationFilter)}
            className="w-[200px] text-xs font-medium"
            aria-label="Lọc mục tiêu theo trạng thái đánh giá"
          >
            <option value="ALL">Mọi trạng thái ({employeeFilteredGoals.length})</option>
            <option value="WAITING_EVIDENCE">Chờ cập nhật kết quả ({evaluationStatusCounts.WAITING_EVIDENCE})</option>
            <option value="WAITING_SCORE">Chờ quản lý chấm ({evaluationStatusCounts.WAITING_SCORE})</option>
            <option value="SCORED">Đã chấm ({evaluationStatusCounts.SCORED})</option>
          </Select>}
        </div>
      </div>

      {/* TAB 1: KRA GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {visibleGoals.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card space-y-3">
              <Target className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-bold text-foreground">{employeeFilteredGoals.length === 0
                ? (goals.length === 0 ? 'Chưa có mục tiêu KRA/KPI nào trong chu kỳ này' : 'Đơn vị này chưa có mục tiêu trong chu kỳ đang chọn')
                : `Không có mục tiêu ở trạng thái “${GOAL_EVALUATION_STATUS_LABEL[selectedEvaluationFilter as GoalEvaluationStatus]}”`}</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {employeeFilteredGoals.length > 0
                  ? 'Thử chọn trạng thái khác hoặc mở lại bộ lọc chu kỳ và phòng ban.'
                  : canManageGoals
                  ? 'Quản lý thiết lập mục tiêu theo định hướng của đơn vị và thống nhất chỉ tiêu với nhân viên trước khi giao.'
                  : 'Mục tiêu được quản lý thiết lập và thống nhất với nhân viên. Nhân viên theo dõi KPI, cập nhật kết quả thực tế và nộp minh chứng.'}
              </p>
              {unitFilteredGoals.length === 0 && canManageGoals && goals.length === 0 && <Button size="sm" onClick={openGoalSetup}>
                <Plus className="w-4 h-4 mr-1.5" /> Thiết Lập Mục Tiêu KRA Đầu Tiên
              </Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {visibleGoals.map((g) => (
                <div key={g.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3 relative group">
                  <div className="flex flex-col items-start gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                        {g.kraTitle}
                      </h3>
                      <p className="text-sm text-primary font-semibold mt-0.5 flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {g.employeeName}
                      </p>
                      {g.assignmentScope === 'ORG_UNIT'
                        ? <p className="mt-1 text-xs text-muted-foreground">Giao theo {g.assignmentOrgUnitName ?? g.assignmentOrgUnit?.name} ({g.assignmentOrgUnitCode ?? g.assignmentOrgUnit?.code}); mỗi nhân viên có bản mục tiêu và điểm riêng.</p>
                        : <p className="mt-1 text-xs text-muted-foreground">KPI cá nhân · trọng số tính trong tổng điểm riêng của nhân viên.</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(() => {
                        const evaluationStatus = goalEvaluationStatus(g);
                        const statusClass = evaluationStatus === 'SCORED'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : evaluationStatus === 'WAITING_SCORE'
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : 'border-border bg-muted/40 text-muted-foreground';
                        return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${statusClass}`}>
                          {GOAL_EVALUATION_STATUS_LABEL[evaluationStatus]}
                        </span>;
                      })()}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted/40 text-foreground">
                        {g.cycle?.organizationSector === 'state' ? 'Trọng số nhóm' : 'Trọng số'}: {g.weightage}%
                      </span>
                      {canAdministerGoals && <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Xóa mục tiêu KRA "${g.kraTitle}"?`)) {
                            deleteGoalMutation.mutate(g.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors opacity-80 hover:opacity-100"
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{g.description || 'Không có mô tả chi tiết'}</p>

                  <div className="bg-muted/20 p-3 rounded-lg text-sm space-y-1.5 border border-border/40">
                    <span className="text-muted-foreground text-xs font-medium">Chỉ số đo lường mục tiêu:</span>
                    <p className="font-semibold text-foreground text-sm">{g.targetMetric || 'Chưa thiết lập'}</p>
                  </div>

                  {isEnterprise && <p className="text-xs text-muted-foreground">Tổng trọng số mục tiêu của nhân sự trong kỳ: <b className="text-foreground">{goalWeightTotal(g)}% / 100%</b>{goalWeightTotal(g) < 100 ? ` · Còn ${100 - goalWeightTotal(g)}% chưa phân bổ` : goalWeightTotal(g) > 100 ? ' · Vượt 100%, cần điều chỉnh' : ''}</p>}
                  {g.cycle?.organizationSector === 'state' && <p className="text-xs text-muted-foreground">Tổng trọng số nhóm {g.criteriaGroup === 'GENERAL' ? 'tiêu chí chung' : 'kết quả nhiệm vụ'}: <b className="text-foreground">{formatAppraisalScore(goalGroupWeightTotal(goals, g))}% / 100%</b></p>}

                  {g.evidences?.length ? <div className="border-t pt-2 text-xs text-muted-foreground">
                    Đã ghi {g.evidences.length} kết quả / minh chứng. Bấm “Xem” để đọc nội dung và mở tài liệu đính kèm.
                  </div> : g.cycle?.organizationSector === 'state' && g.criteriaGroup === 'GENERAL' ? <p className="border-t pt-2 text-xs text-muted-foreground">Tiêu chí chung được quản lý chấm theo quy chế cơ quan; không bắt buộc tệp minh chứng cho từng tiêu chí.</p> : <p className="border-t pt-2 text-xs text-muted-foreground">Chưa có kết quả thực tế hoặc minh chứng. Quản lý chỉ có thể chấm sau khi nhân viên cập nhật căn cứ.</p>}

                  <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-xs font-medium text-muted-foreground">{g.cycle?.organizationSector === 'state' ? 'Phần điểm mục tiêu trong tổng kỳ của nhân viên' : 'Phần điểm trong tổng 100 điểm cá nhân'}</span>
                      {goalContributionGroupLabel(g) && <span className="text-xs text-muted-foreground">{goalContributionGroupLabel(g)}</span>}
                    </div>
                    {goalWeightedContribution(g)
                      ? <p className="mt-1 text-sm font-semibold text-foreground">{goalWeightedContribution(g)!.formula} = {formatAppraisalScore(goalWeightedContribution(g)!.points)} / 100 điểm</p>
                      : <p className="mt-1 text-xs text-muted-foreground">Chưa tính vì chưa có điểm chấm · {goalContributionRule(g)}</p>}
                  </div>

                  <div className="pt-3 border-t flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center justify-between gap-2 lg:justify-start">
                      <span>{g.cycle?.organizationSector === 'state' ? (g.criteriaGroup === 'GENERAL' ? 'Điểm tiêu chí chung' : 'Điểm nhiệm vụ') : 'Điểm KPI'}: <b className="font-bold text-foreground">{g.finalScore != null ? `${g.finalScore}/100` : 'Chưa chấm'}</b></span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:justify-end">
                      {(g.evidences?.length ?? 0) > 0 && <button
                        type="button"
                        onClick={() => setEvidenceViewGoal(g)}
                        className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                      >
                        Xem minh chứng
                      </button>}
                      {(g.userId === currentUser?.id || canManageGoals) && <button
                        type="button"
                        onClick={() => {
                          setEvidenceGoal(g);
                          setEvidenceForm({ description: '', metricValue: '', evidenceUrl: '' });
                        }}
                        className="font-medium text-muted-foreground hover:text-foreground"
                      >Ghi kết quả / minh chứng</button>}
                      {canScoreGoals && g.userId !== currentUser?.id && <button
                        type="button"
                        onClick={() => {
                          setSelectedGoal(g);
                          setManagerScore(g.managerScore ?? null);
                          setActualKpiValue(g.actualValue == null ? '' : String(g.actualValue));
                          setScoreRationale(g.scoreRationale || '');
                          setPublicTaskScores({ quantityScore: g.quantityScore ?? null, qualityScore: g.qualityScore ?? null, progressScore: g.progressScore ?? null });
                          setIsScoreModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <span>Chấm điểm</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORM MẪU ĐÁNH GIÁ CHUẨN (TEMPLATES) */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-linear-to-r from-card to-muted/20 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-muted text-foreground border border-border">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-foreground text-base">
                  Biểu mẫu đánh giá KPI
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {isEnterprise
                  ? 'Biểu mẫu tập trung vào chỉ tiêu, kết quả thực tế, minh chứng, điểm do quản lý chấm và trọng số KPI. Kết quả không tự tạo thưởng hoặc điều chỉnh lương.'
                  : 'Kỳ khu vực công chấm tiêu chí chung 30 điểm và kết quả nhiệm vụ 70 điểm. Màn hình hiệu chuẩn lưu kết luận có thẩm quyền, phân nhóm nhiệm vụ và kiểm tra tỷ lệ 20% hoặc ngoại lệ đến 25% khi có quyết định; biểu mẫu pháp quy và quy trình ký duyệt chính thức vẫn cần cấu hình theo cơ quan.'}
              </p>
              {!isEnterprise && <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Căn cứ: công chức theo Nghị định 335/2025/NĐ-CP; viên chức theo Nghị định 233/2026/NĐ-CP. Tỷ lệ hoàn thành xuất sắc và trường hợp ngoại lệ chỉ áp dụng đúng phạm vi khu vực công, không áp dụng cho doanh nghiệp.
                {' '}<a className="underline" href="https://vanban.chinhphu.vn/?classid=1&docid=216292&pageid=27160&typegroupid=4" target="_blank" rel="noreferrer">Nghị định 335/2025</a>
                {' '}·{' '}<a className="underline" href="https://vanban.chinhphu.vn/?docid=218616&pageid=27160&typegroupid=4" target="_blank" rel="noreferrer">Nghị định 233/2026</a>.
              </p>}
            </div>
            {isEnterprise && <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsKpiLibraryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                Thư Viện KPI Mẫu
              </button>
            </div>}
          </div>

          {/* Mỗi mẫu chiếm trọn một hàng để phần mô tả và bảng xem trước không bị ép hẹp */}
          <div className="grid grid-cols-1 gap-5">
            {/* MẪU 1: PHIẾU ĐÁNH GIÁ KRA / KPI TRỌNG SỐ */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-border/80 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {isEnterprise ? 'Mẫu 01 • KPI doanh nghiệp' : 'Mẫu 01 • Tiêu chí nhiệm vụ công vụ'}
                      </div>
                      <h4 className="font-bold text-foreground text-base mt-0.5">
                        Phiếu Đánh Giá Mục Tiêu Hiệu Suất Theo Trọng Số
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thiết lập mục tiêu công việc theo các tiêu chí cụ thể, phân bổ tỷ trọng phần trăm và đo lường tỷ lệ hoàn thành giữa chỉ tiêu cam kết và kết quả thực tế.
                </p>

                {/* Bảng xem trước tiêu chí */}
                <div className="border border-border/70 rounded-lg overflow-hidden text-sm">
                  <div className="bg-muted/40 px-3.5 py-2.5 font-semibold text-foreground border-b border-border/70 flex justify-between items-center text-xs">
                    <span>Cấu trúc bảng mục tiêu mẫu (Tổng 100%)</span>
                  <span className="text-muted-foreground">Công thức: Σ(Điểm × Trọng số)</span>
                  </div>
                {!isEnterprise && <p className="border-b border-border/70 bg-muted/20 px-3.5 py-2 text-xs leading-5 text-muted-foreground">Khung kỳ: tiêu chí chung 30 điểm + kết quả nhiệm vụ 70 điểm. Các tiêu chí trong từng nhóm phải có tổng trọng số riêng bằng 100%. Đây là minh họa nhập liệu, không phải biểu mẫu pháp quy.</p>}
                  <div className="divide-y divide-border/50 bg-card">
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">{isEnterprise ? 'Mục tiêu 1: Doanh số & Nghiệp vụ cốt lõi' : 'Nhiệm vụ 1: Sản phẩm đầu ra được giao'}</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">{isEnterprise ? 'Đích: Hoàn thành 100% hạn mức cam kết' : 'Đích: Đúng sản phẩm, thời hạn và yêu cầu chất lượng được giao'}</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 35%</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">{isEnterprise ? 'Mục tiêu 2: Tiến độ & Chất lượng dịch vụ' : 'Nhiệm vụ 2: Tiến độ và chất lượng xử lý'}</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">{isEnterprise ? 'Đích: Tỷ lệ hoạt động ổn định &gt;= 99.9%, bàn giao đúng hẹn' : 'Đích: Hồ sơ hoặc sản phẩm được xử lý đúng hạn, đúng quy trình'}</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 25%</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">{isEnterprise ? 'Mục tiêu 3: Cải tiến kỹ thuật & Tiết kiệm chi phí' : 'Nhiệm vụ 3: Phối hợp và xử lý phát sinh'}</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">{isEnterprise ? 'Đích: Tiết kiệm &gt;= 15% thời gian hoặc kinh phí' : 'Đích: Phối hợp đúng đầu mối, xử lý phát sinh có căn cứ'}</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 20%</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">{isEnterprise ? 'Mục tiêu 4: Báo cáo & Tuân thủ quy trình' : 'Nhiệm vụ 4: Chất lượng tham mưu và báo cáo'}</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">{isEnterprise ? 'Đích: 100% báo cáo đúng hạn, không vi phạm nội quy' : 'Đích: Báo cáo đầy đủ, chính xác, đúng hạn và có minh chứng'}</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 20%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForPrint('kra')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  Xem và In Biểu Mẫu A4
                </button>
                {canManageGoals && <button
                  type="button"
                  onClick={openGoalSetup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  Giao Mục Tiêu Ngay
                </button>}
              </div>
            </div>




          </div>
        </div>
      )}

      {/* TAB 4: BẢNG QUY ƯỚC & THANG ĐIỂM ĐÁNH GIÁ (RUBRICS) */}
      {activeTab === 'rubrics' && (
        <div className="space-y-6">
          {isEnterprise && incompleteEvaluationCount > 0 && <p className="border-l-2 border-border pl-3 text-sm leading-5 text-muted-foreground">Chưa thể hoàn tất kỳ: {incompleteEvaluationCount} hồ sơ nhân sự còn thiếu trọng số, điểm hoặc minh chứng.</p>}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-muted text-foreground border border-border">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-foreground text-base">
                  Bảng Quy Ước Thang Điểm, Xếp Loại Thi Đua &amp; Cơ Chế Tính Lương - Thưởng Hiệu Suất
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEnterprise ? 'Quy tắc chấm và tổng hợp điểm KPI; kết quả không tự liên kết sang lương P3.' : 'Khung đánh giá công chức hoặc viên chức theo chế độ đã cấu hình; hạn ngạch chỉ áp dụng trong khu vực công.'}
                </p>
              </div>
            </div>

          <div className="space-y-4 border-t border-border/70 pt-5">
            <div className="border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base">1. Ngưỡng điểm đang được hệ thống tính</h4>
              <p className="mt-1 text-xs text-muted-foreground">{isEnterprise ? 'Ngưỡng xếp loại nội bộ của HRMS; doanh nghiệp cần ban hành quy chế riêng. Không áp dụng hạn ngạch công vụ.' : `Ngưỡng điểm tham chiếu theo ${publicEmployee ? 'Nghị định 233/2026/NĐ-CP (viên chức)' : 'Nghị định 335/2025/NĐ-CP (công chức)'}. Kết luận vẫn cần điều kiện và thẩm quyền theo quy định.`}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-border/80 rounded-lg overflow-hidden">
                <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/80"><tr><th className="py-3 px-4">Mã xếp loại</th><th className="py-3 px-4">Điểm chu kỳ</th><th className="py-3 px-4">Hệ thống lưu kết quả</th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  <tr><td className="py-3 px-4">EXCELLENT</td><td className="py-3 px-4">{isEnterprise ? '90–100' : '90–100 (đồng thời đủ điều kiện)'}</td><td className="py-3 px-4">{isEnterprise ? 'Xếp loại hiệu suất nội bộ' : 'Đề xuất mức xuất sắc; phải qua kết luận có thẩm quyền và kiểm tra tỷ lệ'}</td></tr>
                  <tr><td className="py-3 px-4">GOOD</td><td className="py-3 px-4">{isEnterprise ? '75–<90' : '70–<90'}</td><td className="py-3 px-4">{isEnterprise ? 'Xếp loại hiệu suất nội bộ' : 'Đề xuất mức tốt; phải qua kết luận có thẩm quyền'}</td></tr>
                  <tr><td className="py-3 px-4">SATISFACTORY</td><td className="py-3 px-4">{isEnterprise ? '50–<75' : '50–<70'}</td><td className="py-3 px-4">{isEnterprise ? 'Xếp loại hiệu suất nội bộ' : 'Đề xuất mức hoàn thành; phải qua kết luận có thẩm quyền'}</td></tr>
                  <tr><td className="py-3 px-4">UNSATISFACTORY</td><td className="py-3 px-4">&lt;50</td><td className="py-3 px-4">{isEnterprise ? 'Xếp loại hiệu suất nội bộ' : 'Đề xuất mức không hoàn thành; phải qua kết luận có thẩm quyền'}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">{isEnterprise ? 'Không áp dụng hạn ngạch công vụ. Thưởng, điều chỉnh lương hoặc PIP cần quy chế và phê duyệt riêng của doanh nghiệp.' : 'Trong khu vực công, tỷ lệ xuất sắc được kiểm tra theo cùng đơn vị và nhóm nhiệm vụ theo quy định áp dụng; tỷ lệ này không áp dụng cho doanh nghiệp tư nhân.'}</p>
          </div>

          <div className="space-y-4 border-t border-border/70 pt-5">
            <div className="border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base">2. Cách giao mục tiêu và công thức tính điểm</h4>
              <p className="mt-1 text-xs text-muted-foreground">{isEnterprise ? 'Có hai phạm vi giao KPI; cả hai đều được tính vào điểm riêng của từng nhân viên.' : 'Hai phạm vi giao mục tiêu giống nhau; cách tính điểm khu vực công được tách theo nhóm tiêu chí và kết quả nhiệm vụ.'}</p>
            </div>
            {isEnterprise ? <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-lg border border-border bg-card"><b>KPI cá nhân</b><p className="mt-2 text-sm text-muted-foreground">Giao đích danh cho một nhân viên. Điểm và trọng số được tính trong kỳ đánh giá của người đó.</p></div>
                <div className="p-4 rounded-lg border border-border bg-card"><b>KPI giao theo phòng ban, khối hoặc đơn vị</b><p className="mt-2 text-sm text-muted-foreground">Hệ thống tạo một bản mục tiêu cho từng nhân viên đang làm việc trong đơn vị. Mỗi người cập nhật minh chứng và được chấm riêng; hiện chưa có điểm tổng hợp riêng cho phòng ban.</p></div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <p><b>Điểm kỳ của một nhân viên</b> = Σ (điểm KPI × trọng số KPI / 100).</p>
                <p className="text-muted-foreground">Điểm từng KPI từ 0–100. Tổng trọng số của toàn bộ KPI cá nhân và KPI giao theo đơn vị trong hồ sơ một người phải bằng 100%.</p>
                <p><b>Ví dụ</b>: KPI cá nhân 90 × 40%, hai KPI giao theo phòng ban lần lượt 80 × 35% và 100 × 25% → 36 + 28 + 25 = <b>89/100 điểm</b> cho nhân viên đó.</p>
                <p className="text-muted-foreground">Kết quả KPI không tự tạo thưởng hoặc thay đổi lương; các quyết định này cần quy trình phê duyệt riêng.</p>
              </div>
            </> : <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-lg border border-border bg-card"><b>Giao cho cá nhân</b><p className="mt-2 text-sm text-muted-foreground">Mục tiêu gắn với một người; người đó được chấm theo trọng số trong nhóm tiêu chí tương ứng.</p></div>
                <div className="p-4 rounded-lg border border-border bg-card"><b>Giao theo phòng ban hoặc đơn vị</b><p className="mt-2 text-sm text-muted-foreground">Mỗi nhân viên trong đơn vị nhận một bản mục tiêu và được đánh giá riêng. Điểm đơn vị chưa được cộng gộp thành một kết quả phòng ban.</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-lg border border-border bg-card"><b>Tiêu chí chung · tỷ trọng mặc định 30%</b><p className="mt-2 text-sm text-muted-foreground">Điểm nhóm = tổng (điểm tiêu chí × trọng số trong nhóm / 100). Tổng trọng số tiêu chí trong nhóm bằng 100%.</p></div>
                <div className="p-4 rounded-lg border border-border bg-card"><b>Kết quả nhiệm vụ · tỷ trọng mặc định 70%</b><p className="mt-2 text-sm text-muted-foreground">Điểm nhiệm vụ = số lượng × tỷ trọng số lượng + chất lượng × tỷ trọng chất lượng + tiến độ × tỷ trọng tiến độ. Các tỷ trọng chiều được lưu theo kỳ.</p></div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <p><b>Điểm kỳ</b> = điểm tiêu chí chung × tỷ trọng nhóm chung + điểm kết quả nhiệm vụ × tỷ trọng nhóm nhiệm vụ (mặc định 30% và 70%).</p>
                <p><b>Ví dụ</b>: điểm chung 85, điểm nhiệm vụ 90 → 85 × 30% + 90 × 70% = <b>88,5/100 điểm</b>.</p>
                <p><b>Đóng góp một nhiệm vụ</b>: điểm nhiệm vụ × trọng số trong nhóm × tỷ trọng nhóm nhiệm vụ. Ví dụ: 90 × 25% × 70% = 15,75 điểm.</p>
                <p><b>Điểm năm</b> là trung bình cộng điểm các kỳ tháng hoặc quý đã hoàn tất. Quyết định xếp loại và tỷ lệ xuất sắc chỉ được ghi ở kỳ năm.</p>
                <p className="text-muted-foreground">Điểm là căn cứ theo dõi. Người có thẩm quyền còn phải xét điều kiện, hồ sơ, căn cứ của vị trí và quy chế áp dụng trước khi kết luận.</p>
              </div>
            </>}
          </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-foreground text-base">3. Tác động tới lương và hồ sơ</h4>
            <p className="text-sm text-muted-foreground">{isEnterprise ? 'Điểm KPI không tự tạo khoản thưởng trong bảng lương. Thưởng, thay đổi lương hoặc bổ nhiệm cần quy chế và quyết định được phê duyệt riêng.' : 'Trong nhánh công vụ, người có quyền có thể đồng bộ xếp loại đã hoàn tất vào hồ sơ. Kết luận cần có quyết định cuối cùng; biểu mẫu pháp quy, ký số và luồng phê duyệt nhiều cấp cần được cấu hình theo cơ quan.'}</p>
          </div>

          {/* QUY ƯỚC 5: QUY TRÌNH ĐÁNH GIÁ HIỆU SUẤT 4 BƯỚC KHÉP KÍN */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                {isEnterprise ? 'Chu trình quản lý KPI' : 'Chu trình đánh giá công vụ'}
              </h4>
              <span className="text-xs text-muted-foreground font-medium">Lập kế hoạch • Thực hiện • Đánh giá • Cải tiến</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 1 • {isEnterprise ? 'Đầu kỳ' : 'Chuẩn bị'}</span>
                <h5 className="font-bold text-foreground text-sm">{isEnterprise ? 'Tạo chu kỳ và giao KPI' : 'Tạo kỳ đánh giá'}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEnterprise ? 'HR tạo chu kỳ; quản lý giao chỉ số, mức cần đạt và trọng số cho từng KPI. Tổng trọng số của mỗi người phải bằng 100%.' : 'HR tạo chu kỳ theo chế độ áp dụng; xác định nhóm tiêu chí chung và kết quả nhiệm vụ.'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 2 • {isEnterprise ? 'Trong kỳ' : 'Báo cáo kết quả'}</span>
                <h5 className="font-bold text-foreground text-sm">{isEnterprise ? 'Cập nhật kết quả và minh chứng' : 'Tập hợp kết quả và hồ sơ'}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEnterprise ? 'Nhân viên ghi nhận kết quả thực tế và đính kèm minh chứng cho từng KPI.' : 'Người được đánh giá cập nhật kết quả nhiệm vụ và hồ sơ làm căn cứ.'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 3 • {isEnterprise ? 'Cuối kỳ' : 'Thẩm định'}</span>
                <h5 className="font-bold text-foreground text-sm">{isEnterprise ? 'Quản lý chấm KPI' : 'Chấm tiêu chí và nhiệm vụ'}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEnterprise ? 'Quản lý đối chiếu kết quả và minh chứng với chỉ tiêu rồi chấm từng KPI trên thang 0–100.' : 'Người có thẩm quyền chấm tiêu chí chung và kết quả nhiệm vụ theo thang điểm.'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 4 • Kết luận</span>
                <h5 className="font-bold text-foreground text-sm">{isEnterprise ? 'Tổng hợp và đóng chu kỳ' : 'Xếp loại theo quy trình công vụ'}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEnterprise ? 'Hệ thống cộng điểm KPI theo trọng số. HR hoặc quản lý rà soát dữ liệu rồi đóng kỳ; thưởng và điều chỉnh lương cần quyết định riêng.' : 'HRMS tính điểm theo chế độ 30/70, ghi kết luận và kiểm tra tỷ lệ theo nhóm nhiệm vụ. Biểu mẫu pháp quy, chữ ký số và quy trình phê duyệt cần được cấu hình theo cơ quan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calibration' && !isEnterprise && canCalibrate && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Rà soát kết quả và tỷ lệ xếp loại công vụ</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Mỗi người cần quyết định cuối cùng của cấp có thẩm quyền. Tỷ lệ xuất sắc được kiểm tra trong cùng đơn vị và nhóm nhiệm vụ tương đồng; mức 25% chỉ mở khi ghi số quyết định ngoại lệ. Kết luận này tách biệt hoàn toàn với KPI doanh nghiệp.</p>
            </div>
            <Select value={effectiveCalibrationCycleId} onChange={event => setCalibrationCycleId(event.target.value)} className="min-w-[260px]">
              {calibrationCycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.name} ({cycle.year})</option>)}
            </Select>
          </div>
          {!calibrationCycles.length ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Chưa có kỳ tổng hợp năm. Hãy tạo đủ kỳ theo dõi tháng hoặc quý, sau đó tạo kỳ tổng hợp năm.</div>
            : isLoadingPublicDecisions ? <LoadingState text="Đang tải danh sách cần hiệu chuẩn..." />
            : <div className="grid gap-3 xl:grid-cols-2">
              {publicDecisions.map(row => {
                const draft = publicDecisionDrafts[row.userId] ?? {
                  userId: row.userId,
                  comparableGroup: row.comparableGroup,
                  finalClassification: row.finalClassification ?? row.scoreClassification ?? 'UNSATISFACTORY',
                  excellentCriteriaConfirmed: row.excellentCriteriaConfirmed,
                  quotaExceptionApproved: row.quotaExceptionApproved,
                  exceptionDecisionNo: row.exceptionDecisionNo,
                  decisionNote: row.decisionNote,
                };
                const maximumRank = publicClassificationRank(row.scoreClassification);
                return <article key={row.userId} className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h4 className="font-semibold">{row.employeeName}</h4><p className="text-xs text-muted-foreground">{row.jobTitle || 'Chưa có chức danh'} · {row.orgUnitName || 'Chưa gán đơn vị'}</p></div>
                    <Badge variant={row.complete ? 'default' : 'outline'}>{row.complete ? `${row.score ?? 0} điểm · ${PUBLIC_CLASSIFICATIONS.find(item => item.value === row.scoreClassification)?.label ?? row.scoreClassification}` : row.periodsRequired ? `Thiếu kỳ theo dõi (${row.periodsCompleted ?? 0}/${row.periodsRequired})` : row.missingPublicDimensions ? 'Thiếu điểm số lượng, chất lượng hoặc tiến độ' : row.missingTaskEvidence ? 'Thiếu minh chứng nhiệm vụ' : 'Chưa đủ điểm hoặc trọng số'}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs"><span className="font-medium">Nhóm nhiệm vụ tương đồng</span><Input value={draft.comparableGroup} onChange={event => updatePublicDecisionDraft(row, { comparableGroup: event.target.value })} placeholder="Ví dụ: Chuyên viên thẩm định hồ sơ" /></label>
                    <label className="space-y-1 text-xs"><span className="font-medium">Xếp loại do cấp có thẩm quyền kết luận</span><Select value={draft.finalClassification} onChange={event => updatePublicDecisionDraft(row, { finalClassification: event.target.value as PublicDecisionDraft['finalClassification'] })}>{PUBLIC_CLASSIFICATIONS.filter(item => publicClassificationRank(item.value) <= maximumRank).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label>
                  </div>
                  {draft.finalClassification === 'EXCELLENT' && <div className="space-y-2 rounded-md bg-muted/30 p-3">
                    <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" checked={draft.excellentCriteriaConfirmed} onChange={event => updatePublicDecisionDraft(row, { excellentCriteriaConfirmed: event.target.checked })} className="mt-1" /><span>Đã đối chiếu đủ điều kiện ngoài điểm số theo nghị định và quy chế áp dụng, gồm kết quả nhiệm vụ, tiến độ, chất lượng và điều kiện của vị trí.</span></label>
                    <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" checked={draft.quotaExceptionApproved} onChange={event => updatePublicDecisionDraft(row, { quotaExceptionApproved: event.target.checked })} className="mt-1" /><span>Quyết định của cấp có thẩm quyền cho phép nhóm áp dụng tỷ lệ ngoại lệ đến 25%.</span></label>
                    {draft.quotaExceptionApproved && <Input value={draft.exceptionDecisionNo} onChange={event => updatePublicDecisionDraft(row, { exceptionDecisionNo: event.target.value })} placeholder="Số quyết định ngoại lệ" />}
                  </div>}
                  <label className="block space-y-1 text-xs"><span className="font-medium">{draft.finalClassification === 'EXCELLENT' ? 'Căn cứ và minh chứng xếp loại xuất sắc (bắt buộc)' : 'Căn cứ kết luận hoặc thay đổi mức điểm'}</span><textarea value={draft.decisionNote} onChange={event => updatePublicDecisionDraft(row, { decisionNote: event.target.value })} rows={2} maxLength={2000} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder={draft.finalClassification === 'EXCELLENT' ? 'Ghi rõ minh chứng về nhiệm vụ hoàn thành vượt mức, đúng hạn và các điều kiện áp dụng.' : 'Ghi căn cứ đánh giá, quyết định của người có thẩm quyền hoặc lý do kết luận thấp hơn mức điểm.'} /></label>
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">{row.decided ? 'Đã có kết luận lưu; có thể cập nhật trước khi khóa kỳ.' : 'Chưa có kết luận cuối cùng.'}</span>
                    <Button size="sm" disabled={!row.complete || !draft.comparableGroup.trim() || (draft.finalClassification === 'EXCELLENT' && !draft.decisionNote.trim()) || savePublicDecisionMutation.isPending} onClick={() => savePublicDecisionMutation.mutate(draft)}><Check className="h-4 w-4" />Lưu kết luận</Button>
                  </div>
                </article>;
              })}
            </div>}
        </div>
      )}

      {/* TAB 5: APPRAISAL CYCLES */}
      {activeTab === 'cycles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {isEnterprise ? 'Chu kỳ đánh giá KPI' : 'Chu kỳ đánh giá công vụ'}
            </h3>
            <div className="flex gap-2">
              {!isEnterprise && <Button size="sm" variant="outline" onClick={() => setIsSyncModalOpen(true)}>
                <Medal className="w-4 h-4 mr-1.5 text-amber-500" />
                Đồng Bộ Kết Quả Vào Hồ Sơ Cán Bộ (QT ĐGCB)
              </Button>}
              {canManageCycles && <Button size="sm" onClick={openCycleModal}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo chu kỳ mới
              </Button>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cycles.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-base">{c.name}</h3>
                    {c.organizationSector === 'state' && <p className="mt-1 text-xs font-semibold text-foreground">{c.periodType === 'ANNUAL'
                      ? `Tổng hợp năm từ ${c.annualSourceFrequency === 'QUARTERLY' ? '4 kỳ quý' : '12 kỳ tháng'}`
                      : c.periodType === 'QUARTERLY' ? 'Theo dõi theo quý' : c.periodType === 'MONTHLY' ? 'Theo dõi theo tháng' : 'Kỳ công vụ đã tạo trước đây'}</p>}
                    <div className="text-sm text-muted-foreground mt-1 font-medium">
                      Năm đánh giá: <b className="text-foreground">{c.year}</b> • Từ {new Date(c.startDate).toLocaleDateString('vi-VN')} đến {new Date(c.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-normal text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-muted-foreground'}`} />
                    {c.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'}
                  </span>
                </div>

                {c.organizationSector !== 'state' && <p className="text-sm text-muted-foreground">Phạm vi: {c.participantScope === 'SELECTED' ? 'Danh sách chọn (' + (c.participantIds?.length ?? 0) + ' người)' : 'Toàn bộ nhân sự thuộc thời gian của kỳ'}. Mỗi người cần đủ 100% trọng số, điểm và minh chứng.</p>}
                {c.organizationSector !== 'state' && canManageCycles && (c.participantIds ?? []).some(id => !goals.some(goal => goal.cycleId === c.id && goal.userId === id)) && <p className="text-sm text-amber-700">Còn {(c.participantIds ?? []).filter(id => !goals.some(goal => goal.cycleId === c.id && goal.userId === id)).length} người trong danh sách kỳ chưa có mục tiêu. Cần giao mục tiêu trước khi đóng kỳ.</p>}
                {c.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-3 rounded-lg text-sm">
                  <div>{c.organizationSector === 'state' && c.periodType === 'ANNUAL' ? 'Nguồn dữ liệu' : 'Mục tiêu KRA'}: <b className="text-primary font-bold">{c.organizationSector === 'state' && c.periodType === 'ANNUAL' ? `${c.annualSourceFrequency === 'QUARTERLY' ? '4 quý' : '12 tháng'}` : c._count?.goals ?? 0}</b></div>
                  <div>{c.organizationSector === 'state' ? 'Khung đánh giá' : 'Nhân sự đã có mục tiêu'}: <b className="text-foreground font-bold">{c.organizationSector === 'state' ? `${c.generalCriteriaWeight ?? 30} điểm chung + ${c.taskCriteriaWeight ?? 70} điểm nhiệm vụ` : `${new Set(goals.filter(goal => goal.cycleId === c.id).map(goal => goal.userId)).size} người`}</b></div>
                  {c.organizationSector === 'state' && c.publicPersonnelType === 'PUBLIC_EMPLOYEE' && c.periodType !== 'ANNUAL' && <div className="col-span-2 text-xs text-muted-foreground">Kết quả nhiệm vụ: số lượng {formatAppraisalScore(c.quantityCriteriaWeight ?? 100 / 3)}% · chất lượng {formatAppraisalScore(c.qualityCriteriaWeight ?? 100 / 3)}% · tiến độ {formatAppraisalScore(c.progressCriteriaWeight ?? 100 / 3)}%</div>}
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {canManageCycles && <button
                      onClick={() => {
                        const newStatus = c.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
                        toggleCycleStatusMutation.mutate({ id: c.id, newStatus });
                      }}
                      className="font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {c.status === 'ACTIVE' ? 'Đóng chu kỳ' : 'Kích hoạt lại'}
                    </button>}
                  </div>

                  {canDeleteCycles && c.status === 'ACTIVE' && (c._count?.goals ?? 0) === 0 && <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Xác nhận xóa chu kỳ "${c.name}" cùng toàn bộ mục tiêu liên quan?`)) {
                        deleteCycleMutation.mutate(c.id);
                      }
                    }}
                    className="text-destructive font-semibold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa chu kỳ
                  </button>}
                  {canDeleteCycles && (c._count?.goals ?? 0) > 0 && <p className="text-xs text-muted-foreground">Kỳ đã có dữ liệu; hệ thống giữ lịch sử và chỉ cho đóng kỳ sau khi hoàn tất đánh giá.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: KHỞI TẠO CHU KỲ MỚI */}
      {isCycleModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsCycleModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 text-foreground">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {isEnterprise ? 'Tạo chu kỳ KPI mới' : 'Tạo chu kỳ công vụ mới'}
                </h3>
                <button onClick={() => setIsCycleModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {isEnterprise && <div className="space-y-2">
                  <label className="block font-medium" htmlFor="kpi-participant-mode">Đối tượng đánh giá</label>
                  <Select id="kpi-participant-mode" value={selectCycleParticipants ? 'SELECTED' : 'COMPANY'} onChange={e => setSelectCycleParticipants(e.target.value === 'SELECTED')}><option value="COMPANY">Toàn bộ nhân sự thuộc thời gian của kỳ</option><option value="SELECTED">Chọn danh sách nhân sự cụ thể</option></Select>
                  {selectCycleParticipants && <fieldset className="space-y-2"><legend>Nhân sự tham gia *</legend><div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">{employees.map(employee => <label key={employee.id} className="flex items-center gap-2"><input type="checkbox" checked={cycleParticipantIds.includes(employee.id)} onChange={event => setCycleParticipantIds(ids => event.target.checked ? [...ids, employee.id] : ids.filter(id => id !== employee.id))} /><span>{employee.fullName}</span></label>)}</div></fieldset>}
                  <p className="text-muted-foreground">Chỉ đóng kỳ khi mọi người trong phạm vi đã có đủ mục tiêu, điểm và minh chứng.</p>
                </div>}
                <div>
                  <label className="font-medium text-foreground block mb-1">Tên kỳ đánh giá:</label>
                  <Input
                    value={cycleForm.name}
                    onChange={(e) => updateCycleForm({ name: e.target.value })}
                    placeholder={isEnterprise ? 'VD: Chu kỳ đánh giá KPI 2026' : 'VD: Chu kỳ đánh giá công chức 2026'}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Năm:</label>
                    <Input type="number" value={cycleForm.year} onChange={(e) => updateCycleForm({ year: Number(e.target.value) })} />
                  </div>
                  {!isEnterprise && <div>
                    <label className="font-medium text-foreground block mb-1">Loại kỳ công vụ:</label>
                    <Select value={cycleForm.periodType} onChange={e => updateCycleForm({ periodType: e.target.value as AppraisalPeriodType })}>
                      <option value="MONTHLY">Theo dõi tháng</option>
                      <option value="QUARTERLY">Theo dõi quý</option>
                      <option value="ANNUAL">Tổng hợp xếp loại năm</option>
                    </Select>
                  </div>}
                  {!isEnterprise && cycleForm.periodType === 'MONTHLY' && <div>
                    <label className="font-medium text-foreground block mb-1">Tháng:</label>
                    <Select value={cycleForm.month} onChange={e => updateCycleForm({ month: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Tháng {index + 1}</option>)}
                    </Select>
                  </div>}
                  {!isEnterprise && cycleForm.periodType === 'QUARTERLY' && <div>
                    <label className="font-medium text-foreground block mb-1">Quý:</label>
                    <Select value={cycleForm.quarter} onChange={e => updateCycleForm({ quarter: Number(e.target.value) })}>
                      {[1, 2, 3, 4].map(quarter => <option key={quarter} value={quarter}>Quý {quarter}</option>)}
                    </Select>
                  </div>}
                  {!isEnterprise && cycleForm.periodType === 'ANNUAL' && <div>
                    <label className="font-medium text-foreground block mb-1">Lấy kết quả từ:</label>
                    <Select value={cycleForm.annualSourceFrequency} onChange={e => updateCycleForm({ annualSourceFrequency: e.target.value as 'MONTHLY' | 'QUARTERLY' })}>
                      <option value="MONTHLY">12 kỳ tháng đã khóa</option>
                      <option value="QUARTERLY">4 kỳ quý đã khóa</option>
                    </Select>
                  </div>}
                  {isEnterprise && <div>
                    <label className="font-medium text-foreground block mb-1">Từ ngày:</label>
                    <Input type="date" value={cycleForm.startDate} onChange={e => updateCycleForm({ startDate: e.target.value })} />
                  </div>}
                  {isEnterprise && <div>
                    <label className="font-medium text-foreground block mb-1">Đến ngày:</label>
                    <Input type="date" value={cycleForm.endDate} onChange={e => updateCycleForm({ endDate: e.target.value })} />
                  </div>}
                </div>
                {!isEnterprise && <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/20 p-3">
                  <p><span className="text-muted-foreground">Từ ngày:</span> <b>{new Date(`${cycleForm.startDate}T00:00:00`).toLocaleDateString('vi-VN')}</b></p>
                  <p><span className="text-muted-foreground">Đến ngày:</span> <b>{new Date(`${cycleForm.endDate}T00:00:00`).toLocaleDateString('vi-VN')}</b></p>
                </div>}

                {!isEnterprise && publicEmployee && cycleForm.periodType !== 'ANNUAL' && <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="font-medium">Tỷ trọng trong nhóm kết quả nhiệm vụ</p>
                  <p className="text-muted-foreground">Điều chỉnh theo quy chế đánh giá do người đứng đầu đơn vị ban hành. Tổng ba tỷ trọng phải bằng 100%.</p>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="space-y-1"><span>Số lượng (%)</span><Input type="number" min="0" max="100" step="0.01" value={cycleForm.quantityCriteriaWeight} onChange={e => updateCycleForm({ quantityCriteriaWeight: Number(e.target.value) })} /></label>
                    <label className="space-y-1"><span>Chất lượng (%)</span><Input type="number" min="0" max="100" step="0.01" value={cycleForm.qualityCriteriaWeight} onChange={e => updateCycleForm({ qualityCriteriaWeight: Number(e.target.value) })} /></label>
                    <label className="space-y-1"><span>Tiến độ (%)</span><Input type="number" min="0" max="100" step="0.01" value={cycleForm.progressCriteriaWeight} onChange={e => updateCycleForm({ progressCriteriaWeight: Number(e.target.value) })} /></label>
                  </div>
                  <p className={`text-xs ${Math.abs(cycleForm.quantityCriteriaWeight + cycleForm.qualityCriteriaWeight + cycleForm.progressCriteriaWeight - 100) < 0.001 ? 'text-muted-foreground' : 'text-destructive'}`}>
                    Tổng tỷ trọng: {formatAppraisalScore(cycleForm.quantityCriteriaWeight + cycleForm.qualityCriteriaWeight + cycleForm.progressCriteriaWeight)}% / 100%
                  </p>
                </div>}

                <div>
                  <label className="font-medium text-foreground block mb-1">Mô tả hướng dẫn:</label>
                  <textarea
                    value={cycleForm.description}
                    onChange={(e) => updateCycleForm({ description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    placeholder="Tiêu chí đánh giá, đối tượng tham gia..."
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  {isEnterprise ? <>
                    <p className="font-medium">Kết quả đánh giá theo KPI</p>
                    <p className="mt-1 text-muted-foreground">Mỗi KPI đóng góp điểm = điểm KPI × trọng số. Ví dụ: 90 × 25% = 22,5 điểm; cộng các KPI để tính điểm chu kỳ khi tổng trọng số là 100%.</p>
                  </> : <>
                    <p className="font-medium">Khung đánh giá {cycleForm.periodType === 'ANNUAL' ? 'tổng hợp năm' : 'định kỳ'}</p>
                    {cycleForm.periodType === 'ANNUAL'
                      ? <p className="mt-1 text-muted-foreground">Kỳ năm không nhận mục tiêu riêng. Hệ thống lấy trung bình điểm từ đủ {cycleForm.annualSourceFrequency === 'QUARTERLY' ? '4 quý' : '12 tháng'} đã khóa; sau đó mới mở bước ghi kết luận xếp loại của cấp có thẩm quyền.</p>
                      : <p className="mt-1 text-muted-foreground">Điểm chung tối đa 30; kết quả nhiệm vụ tối đa 70. Mỗi nhóm có trọng số riêng đủ 100%. Điểm năm được tổng hợp từ các kỳ tháng hoặc quý đã khóa. {publicEmployee ? 'Tỷ trọng số lượng, chất lượng và tiến độ lấy theo quy chế đơn vị.' : 'Điểm nhiệm vụ tính trung bình tỷ lệ số lượng, chất lượng và tiến độ theo Nghị định 335/2025.'}</p>}
                  </>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsCycleModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => createCycleMutation.mutate(cycleForm)} disabled={createCycleMutation.isPending || !cycleDimensionWeightsValid}>
                  {createCycleMutation.isPending ? 'Đang tạo...' : 'Khởi Tạo Chu Kỳ'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 2: THIẾT LẬP MỤC TIÊU KRA */}
      {isGoalModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsGoalModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 text-foreground">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Thiết Lập Mục Tiêu KRA/KPI Mới
                </h3>
                <button onClick={() => setIsGoalModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thư viện ví dụ chỉ dành cho kỳ KPI doanh nghiệp */}
              {isEnterprise && <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm text-foreground leading-normal">
                    Cần gợi ý chỉ tiêu chuẩn? Sử dụng <b>Thư viện KPI Mẫu</b> (Tech, Sales, Kế toán, HR) để tự động điền form.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsKpiLibraryOpen(true)}
                  className="shrink-0 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                >
                  Mở Thư Viện
                </button>
              </div>}

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Chu kỳ đánh giá:</label>
                    <Select
                      value={goalForm.cycleId || cycles[0]?.id}
                      onChange={(e) => setGoalForm({ ...goalForm, cycleId: e.target.value })}
                      className="w-full text-xs"
                    >
                      {goalSetupCycles.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Trọng số trong nhóm (%):</label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={goalForm.weightage}
                      onChange={(e) => setGoalForm({ ...goalForm, weightage: Number(e.target.value) })}
                      placeholder="VD: 25"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Phạm vi giao mục tiêu:</label>
                  <Select
                    value={goalForm.assignmentScope}
                    onChange={(e) => setGoalForm({ ...goalForm, assignmentScope: e.target.value as 'INDIVIDUAL' | 'ORG_UNIT', userId: '', orgUnitId: '' })}
                    className="w-full text-xs"
                  >
                    <option value="INDIVIDUAL">Một nhân viên</option>
                    <option value="ORG_UNIT">Phòng ban, khối hoặc đơn vị</option>
                  </Select>
                </div>

                {(() => {
                  const selectedCycle = cycles.find(c => c.id === (goalForm.cycleId || cycles[0]?.id));
                  return selectedCycle?.organizationSector === 'state' ? <div>
                    <label className="font-medium text-foreground block mb-1">Nhóm tiêu chí:</label>
                    <Select value={goalForm.criteriaGroup} onChange={e => setGoalForm({ ...goalForm, criteriaGroup: e.target.value as 'GENERAL' | 'RESULT' })} className="w-full text-xs">
                      <option value="GENERAL">Tiêu chí chung (30 điểm)</option>
                      <option value="RESULT">Kết quả thực hiện nhiệm vụ (70 điểm)</option>
                    </Select>
                    <p className="mt-1 text-muted-foreground">Phân bổ trọng số đủ 100% riêng trong từng nhóm.</p>
                  </div> : null;
                })()}

                {isEnterprise && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 sm:col-span-2"><span className="font-medium">Cách đo KPI</span><Select value={goalForm.measurementMode} onChange={e => setGoalForm({ ...goalForm, measurementMode: e.target.value, targetValue: e.target.value === 'BINARY' ? '1' : '' })}><option value="MANUAL">Quản lý chấm theo rubric đã thống nhất</option><option value="HIGHER_BETTER">Càng cao càng tốt — thực tế / mục tiêu</option><option value="LOWER_BETTER">Càng thấp càng tốt — mục tiêu / thực tế</option><option value="BINARY">Đạt / không đạt</option></Select></label>
                  {goalForm.measurementMode !== 'MANUAL' && <><label className="space-y-1"><span className="font-medium">Giá trị mục tiêu</span><Input type="number" step="any" min={0} value={goalForm.targetValue} disabled={goalForm.measurementMode === 'BINARY'} onChange={e => setGoalForm({ ...goalForm, targetValue: e.target.value })} /></label><label className="space-y-1"><span className="font-medium">Đơn vị đo</span><Input value={goalForm.measurementUnit} onChange={e => setGoalForm({ ...goalForm, measurementUnit: e.target.value })} placeholder="%, hồ sơ, ngày, đồng..." /></label></>}
                </div>}

                {goalForm.assignmentScope === 'INDIVIDUAL' ? <div>
                  <label className="font-medium text-foreground block mb-1">Nhân viên nhận mục tiêu:</label>
                  <Select
                    value={goalForm.userId}
                    onChange={(e) => setGoalForm({ ...goalForm, userId: e.target.value })}
                    searchable
                    searchPlaceholder="Tìm mã NV, họ tên, chức danh..."
                    className="text-xs"
                  >
                    <option value="">-- Chọn nhân sự đang làm việc --</option>
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} {emp.jobTitle ? `- ${emp.jobTitle}` : ''} {emp.orgUnit?.name ? `· ${emp.orgUnit.name}` : ''}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-muted-foreground">Tên và đơn vị nhận mục tiêu được lấy từ hồ sơ HR; tài khoản hiện tại không được tự giao KPI cho mình.</p>
                </div> : <div>
                  <label className="font-medium text-foreground block mb-1">Đơn vị nhận mục tiêu:</label>
                  <Select
                    value={goalForm.orgUnitId}
                    onChange={(e) => setGoalForm({ ...goalForm, orgUnitId: e.target.value })}
                    searchable
                    searchPlaceholder="Tìm phòng ban, khối, bộ phận..."
                    className="text-xs"
                  >
                    <option value="">-- Chọn đơn vị tổ chức --</option>
                    {availableAssignmentUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.code} · {unit.name}</option>)}
                  </Select>
                  <p className="mt-1 text-muted-foreground">
                    {selectedAssignmentUnit
                      ? isRestrictedLineManager
                        ? `Mục tiêu sẽ được tạo riêng cho ${unitRecipientCount} nhân sự đang làm việc trực tiếp tại đơn vị bạn phụ trách. Mỗi người được quản lý chấm riêng; tổng trọng số của từng người phải đạt 100%.`
                        : `Mục tiêu sẽ được tạo riêng cho ${unitRecipientCount} nhân sự đang làm việc tại đơn vị này và các đơn vị cấp dưới. Mỗi người được quản lý chấm riêng; tổng trọng số của từng người phải đạt 100%.`
                      : 'Mỗi nhân sự trong đơn vị đã chọn sẽ nhận một mục tiêu riêng và một thông báo in-app. Tài khoản giao mục tiêu không tự giao KPI cho mình.'}
                  </p>
                  {selectedAssignmentUnit && unitRecipientCount === 0 && <p className="mt-1 text-destructive">Đơn vị này không có nhân sự đủ điều kiện nhận mục tiêu.</p>}
                  {isRestrictedLineManager && !actorOrgUnitId && <p className="mt-1 text-destructive">Tài khoản quản lý chưa được gán đơn vị HR nên chưa thể giao KPI theo phòng ban.</p>}
                </div>}

                <div>
                  <label className="font-medium text-foreground block mb-1">Tiêu đề KRA / Chỉ tiêu nhiệm vụ:</label>
                  <Input
                    value={goalForm.kraTitle}
                    onChange={(e) => setGoalForm({ ...goalForm, kraTitle: e.target.value })}
                    placeholder="VD: Đảm bảo SLA Uptime hệ thống >= 99.9%..."
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Chỉ số đo lường mục tiêu (Target Metric):</label>
                  <Input
                    value={goalForm.targetMetric}
                    onChange={(e) => setGoalForm({ ...goalForm, targetMetric: e.target.value })}
                    placeholder="VD: Đạt SLA 99.9%, hoàn thành 100% tài liệu kiến trúc..."
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Mô tả chi tiết nhiệm vụ:</label>
                  <textarea
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    placeholder="Kế hoạch hành động, mốc thời gian hoàn thành cụ thể..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsGoalModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => createGoalMutation.mutate()} disabled={createGoalMutation.isPending || (goalForm.assignmentScope === 'ORG_UNIT' && unitRecipientCount === 0)}>
                  {createGoalMutation.isPending ? 'Đang lưu...' : 'Giao Mục Tiêu KRA'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 3: CHẤM ĐIỂM KRA & DỰ BÁO LƯƠNG THƯỞNG KPI */}
      {isScoreModalOpen && selectedGoal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsScoreModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 text-foreground">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Chấm điểm mục tiêu
                </h3>
                <button onClick={() => setIsScoreModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-muted/30 p-3 rounded-lg border border-border/60">
                  <div className="font-bold text-foreground text-sm">{selectedGoal.kraTitle}</div>
                  <div className="text-muted-foreground mt-0.5">Nhân sự: <b className="text-foreground">{selectedGoal.employeeName}</b></div>
                  <div className="text-xs text-primary font-bold mt-1">Trọng số: {selectedGoal.weightage}%</div>
                </div>

                {selectedGoalUsesPublicDimensions ? <div className="space-y-3">
                  <p className="text-muted-foreground">Chấm theo tỷ lệ hoàn thành từng nhiệm vụ đã giao và căn cứ kèm theo.</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="space-y-1"><span className="font-medium">Số lượng (%)</span><Input type="number" min="0" max="100" value={publicTaskScores.quantityScore ?? ''} onChange={e => setPublicTaskScores(current => ({ ...current, quantityScore: e.target.value === '' ? null : Number(e.target.value) }))} /></label>
                    <label className="space-y-1"><span className="font-medium">Chất lượng (%)</span><Input type="number" min="0" max="100" value={publicTaskScores.qualityScore ?? ''} onChange={e => setPublicTaskScores(current => ({ ...current, qualityScore: e.target.value === '' ? null : Number(e.target.value) }))} /></label>
                    <label className="space-y-1"><span className="font-medium">Tiến độ (%)</span><Input type="number" min="0" max="100" value={publicTaskScores.progressScore ?? ''} onChange={e => setPublicTaskScores(current => ({ ...current, progressScore: e.target.value === '' ? null : Number(e.target.value) }))} /></label>
                  </div>
                </div> : <div>
                  {selectedGoal.measurementMode && selectedGoal.measurementMode !== 'MANUAL' ? <><label className="font-medium text-foreground block mb-1">Kết quả thực tế ({selectedGoal.measurementUnit || 'giá trị'}), mục tiêu {selectedGoal.targetValue}:</label><Input type="number" step="any" min={0} value={actualKpiValue} onChange={e => setActualKpiValue(e.target.value)} /><p className="mt-1 text-muted-foreground">{selectedGoal.measurementMode === 'HIGHER_BETTER' ? 'Điểm = thực tế / mục tiêu × 100' : selectedGoal.measurementMode === 'LOWER_BETTER' ? 'Điểm = mục tiêu / thực tế × 100; kết quả 0 được xử lý riêng' : 'Kết quả 1 = đạt 100 điểm; 0 = chưa đạt'}. Điểm tối đa 100 theo quy ước của doanh nghiệp.</p></> : <><label className="font-medium text-foreground block mb-1">Điểm KPI do quản lý chấm (thang 0–100):</label><Input type="number" min="0" max="100" value={managerScore ?? ''} onChange={(e) => setManagerScore(e.target.value === '' ? null : Number(e.target.value))} /></>}
                </div>}
                {selectedGoal.cycle?.organizationSector === 'enterprise' && <label className="block space-y-1"><span className="font-medium">Giải trình đối chiếu mục tiêu, kết quả và minh chứng</span><Textarea minLength={10} value={scoreRationale} onChange={e => setScoreRationale(e.target.value)} placeholder="Nêu dữ liệu thực tế và rubric/cách tính đã thống nhất" /></label>}

                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">Cách tính:</p>
                  {selectedGoalUsesPublicDimensions && <>
                    <p className="text-muted-foreground">Điểm nhiệm vụ = số lượng × {formatAppraisalScore(selectedGoal.cycle?.quantityCriteriaWeight ?? 100 / 3)}% + chất lượng × {formatAppraisalScore(selectedGoal.cycle?.qualityCriteriaWeight ?? 100 / 3)}% + tiến độ × {formatAppraisalScore(selectedGoal.cycle?.progressCriteriaWeight ?? 100 / 3)}%.</p>
                    {selectedGoalPublicAverage !== null && <p className="font-medium text-foreground">Điểm mục tiêu hiện tại: {formatAppraisalScore(publicTaskScores.quantityScore!)} × {formatAppraisalScore(selectedGoal.cycle?.quantityCriteriaWeight ?? 100 / 3)}% + {formatAppraisalScore(publicTaskScores.qualityScore!)} × {formatAppraisalScore(selectedGoal.cycle?.qualityCriteriaWeight ?? 100 / 3)}% + {formatAppraisalScore(publicTaskScores.progressScore!)} × {formatAppraisalScore(selectedGoal.cycle?.progressCriteriaWeight ?? 100 / 3)}% = {formatAppraisalScore(selectedGoalPublicAverage)}/100.</p>}
                    <p className="text-muted-foreground">Điểm này được nhân tiếp với trọng số trong nhóm kết quả nhiệm vụ và tỷ trọng 70% của toàn kỳ.</p>
                  </>}
                  {!selectedGoalUsesPublicDimensions && <p className="text-muted-foreground">Phần điểm mục tiêu tính vào tổng kỳ = điểm quản lý chấm × trọng số. {selectedGoal.cycle?.organizationSector === 'state' ? 'Điểm tiêu chí chung được tính trong nhóm 30 điểm; kết quả nhiệm vụ thuộc nhóm 70 điểm.' : 'Tổng trọng số mục tiêu của nhân sự phải đủ 100%.'}</p>}
                  {selectedGoal.finalScore != null && <p className="font-medium text-foreground">Điểm mục tiêu đã lưu: {selectedGoal.finalScore}/100; phần điểm trong kỳ là {goalWeightedContribution(selectedGoal) ? `${goalWeightedContribution(selectedGoal)!.formula} = ${formatAppraisalScore(goalWeightedContribution(selectedGoal)!.points)} / 100 điểm` : 'chưa tính'}.</p>}
                  <p className="text-muted-foreground">{selectedGoal.finalScore != null ? `Điểm đã lưu: ${selectedGoal.finalScore}/100.` : 'Điểm chưa được chấm.'} Kết quả không tự tạo thưởng hoặc thay đổi lương; quyết định đãi ngộ cần được phê duyệt riêng.</p>
                  {selectedGoalRequiresEvidence && (selectedGoal.evidences?.length ?? 0) === 0 && <p className="font-medium text-destructive">Chưa có kết quả và căn cứ đối chiếu. Hãy yêu cầu nhân viên cập nhật trước khi lưu điểm.</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsScoreModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => scoreGoalMutation.mutate()} disabled={scoreGoalMutation.isPending || !selectedGoalCanSaveScore || (selectedGoalRequiresEvidence && (selectedGoal.evidences?.length ?? 0) === 0)}>
                  {scoreGoalMutation.isPending ? 'Đang lưu...' : 'Lưu điểm KPI'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {evidenceGoal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button type="button" aria-label="Đóng biểu mẫu minh chứng" className="fixed inset-0 bg-black/60" onClick={() => setEvidenceGoal(null)} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card p-5 text-foreground shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base">Ghi kết quả / minh chứng</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{evidenceGoal.kraTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{evidenceGoal.employeeName} · {evidenceGoal.cycle?.name ?? 'Kỳ đánh giá'}</p>
                </div>
                <button type="button" aria-label="Đóng" onClick={() => setEvidenceGoal(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto py-4 text-sm">
                {(evidenceGoal.evidences?.length ?? 0) > 0 && <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Đã có {evidenceGoal.evidences?.length} kết quả / minh chứng</p>
                    <button type="button" className="text-primary underline underline-offset-2" onClick={() => {
                      setEvidenceViewGoal(evidenceGoal);
                      setEvidenceGoal(null);
                    }}>Xem nội dung đã ghi</button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Có thể ghi bổ sung kết quả mới; nội dung đã gửi sẽ được giữ trong lịch sử.</p>
                </div>}

                <label className="block space-y-1.5">
                  <span className="font-medium">Kết quả thực tế / số liệu đạt được</span>
                  <Input maxLength={300} value={evidenceForm.metricValue} onChange={(event) => setEvidenceForm({ ...evidenceForm, metricValue: event.target.value })} placeholder="Ví dụ: 9/10 bài viết đúng hạn (90%)" />
                </label>
                <label className="block space-y-1.5">
                  <span className="font-medium">Mô tả kết quả và căn cứ đối chiếu <span className="text-destructive">*</span></span>
                  <textarea
                    value={evidenceForm.description}
                    onChange={(event) => setEvidenceForm({ ...evidenceForm, description: event.target.value })}
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                    placeholder="Nêu kết quả, thời gian thực hiện và nguồn số liệu hoặc tài liệu để quản lý kiểm tra."
                  />
                  <span className="text-xs text-muted-foreground">Tối thiểu 3 ký tự. Hãy ghi đủ căn cứ để quản lý có thể đối chiếu.</span>
                </label>
                <label className="block space-y-1.5">
                  <span className="font-medium">Đường dẫn tài liệu đính kèm <span className="font-normal text-muted-foreground">(nếu có)</span></span>
                  <Input maxLength={1000} value={evidenceForm.evidenceUrl} onChange={(event) => setEvidenceForm({ ...evidenceForm, evidenceUrl: event.target.value })} placeholder="https://... hoặc /đường-dẫn-tài-liệu-nội-bộ" />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Kết quả được lưu cùng mục tiêu KPI để người đánh giá xem trước khi chấm.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEvidenceGoal(null)}>Hủy</Button>
                  <Button size="sm" onClick={() => addEvidenceMutation.mutate()} disabled={addEvidenceMutation.isPending || evidenceForm.description.trim().length < 3}>
                    {addEvidenceMutation.isPending ? 'Đang lưu...' : 'Lưu kết quả / minh chứng'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {evidenceViewGoal && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button type="button" aria-label="Đóng danh sách minh chứng" className="fixed inset-0 bg-black/60" onClick={() => setEvidenceViewGoal(null)} />
            <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card p-5 text-foreground shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-base">Kết quả và minh chứng</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{evidenceViewGoal.kraTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{evidenceViewGoal.employeeName} · {evidenceViewGoal.cycle?.name ?? 'Kỳ đánh giá'} · {evidenceViewGoal.evidences?.length ?? 0} mục</p>
                </div>
                <button type="button" aria-label="Đóng" onClick={() => setEvidenceViewGoal(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto py-4">
                {(evidenceViewGoal.evidences ?? []).length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Mục tiêu này chưa có kết quả hoặc minh chứng.</div> :
                  [...(evidenceViewGoal.evidences ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((evidence, index) => {
                    const href = safeEvidenceHref(evidence.evidenceUrl);
                    return <article key={evidence.id} className="space-y-2 rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-medium">Kết quả / minh chứng {index + 1}</h4>
                        <time className="text-xs text-muted-foreground">{formatDateTime(evidence.createdAt)}</time>
                      </div>
                      {evidence.metricValue && <div className="rounded-md bg-muted/30 px-3 py-2 text-sm"><span className="text-muted-foreground">Kết quả thực tế: </span><strong>{evidence.metricValue}</strong></div>}
                      <p className="whitespace-pre-wrap text-sm leading-6">{evidence.description}</p>
                      {evidence.evidenceUrl && (href
                        ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2"><ExternalLink className="h-4 w-4" /> Mở tài liệu đính kèm</a>
                        : <p className="break-all text-xs text-muted-foreground">Đường dẫn tài liệu đã lưu nhưng không thể mở an toàn: {evidence.evidenceUrl}</p>)}
                    </article>;
                  })}
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-3">
                {(evidenceViewGoal.userId === currentUser?.id || canManageGoals) && <Button variant="outline" size="sm" onClick={() => {
                  const goal = evidenceViewGoal;
                  setEvidenceViewGoal(null);
                  setEvidenceGoal(goal);
                  setEvidenceForm({ description: '', metricValue: '', evidenceUrl: '' });
                }}>Ghi bổ sung</Button>}
                <Button size="sm" onClick={() => setEvidenceViewGoal(null)}>Đóng</Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 5: ĐỒNG BỘ KẾT QUẢ VÀO HỒ SƠ CÁN BỘ (QT ĐGCB) */}
      {isSyncModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsSyncModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border space-y-5 animate-in fade-in zoom-in-95 text-foreground">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Medal className="w-4 h-4 text-amber-500" />
                    Đồng Bộ Kết Quả Vào Hồ Sơ Cán Bộ (Mục 6. QT ĐGCB)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ghi nhận kết quả đánh giá xếp loại thi đua chính thức vào mục 6 (Quá trình đánh giá cán bộ) trong hồ sơ gốc.
                  </p>
                </div>
                <button onClick={() => setIsSyncModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Chọn Nhân sự cần công nhận kết quả:</label>
                    <Select
                      value={syncForm.userId}
                      onChange={(e) => setSyncForm({ ...syncForm, userId: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="">-- Chọn nhân sự từ hệ thống --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} [{emp.employeeCode}]
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1">Số quyết định công nhận (nếu có):</label>
                    <Input
                      value={syncForm.decisionNo}
                      onChange={(e) => setSyncForm({ ...syncForm, decisionNo: e.target.value })}
                      placeholder="VD: QĐ-ĐGCB/2026"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Năm đánh giá:</label>
                    <Input
                      type="number"
                      value={syncForm.year}
                      onChange={(e) => setSyncForm({ ...syncForm, year: Number(e.target.value) })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="flex items-center rounded-lg border border-border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">Mức xếp loại được lấy từ kết luận hiệu chuẩn đã lưu trong chu kỳ công vụ đã khóa; biểu mẫu này không cho ghi đè kết quả.</div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Nhận xét kết quả đánh giá:</label>
                  <textarea
                    value={syncForm.comment}
                    onChange={(e) => setSyncForm({ ...syncForm, comment: e.target.value })}
                    rows={3}
                    placeholder="Ghi rõ ưu điểm, hạn chế và kiến nghị xếp loại..."
                    className="w-full rounded-lg border border-border bg-card p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsSyncModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => syncAppraisalMutation.mutate()} disabled={syncAppraisalMutation.isPending}>
                  {syncAppraisalMutation.isPending ? 'Đang ghi vào hồ sơ...' : 'Đồng Bộ Vào Hồ Sơ Gốc'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 6: THƯ VIỆN MỤC TIÊU KPI / KRA MẪU THEO PHÒNG BAN */}
      {isKpiLibraryOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsKpiLibraryOpen(false)}
            />
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-card p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 text-foreground">
              <div className="flex justify-between items-center border-b pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-muted text-foreground border border-border">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-foreground text-base">
                      Thư Viện Mục Tiêu KPI / KRA Mẫu Chuẩn SMART
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {canManageKpiLibrary
                        ? 'Quản trị viên có thể thêm, sửa, xóa mục tiêu mẫu; thay đổi không làm đổi KPI đã giao.'
                        : 'Chọn một mục tiêu để đưa sang biểu mẫu giao KPI; chỉnh sửa thư viện không làm thay đổi mục tiêu đã giao.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManageKpiLibrary && <Button size="sm" onClick={() => openKpiTemplateForm()}>
                    <Plus className="w-4 h-4 mr-1.5" /> Thêm mục tiêu mẫu
                  </Button>}
                  <button type="button" aria-label="Đóng thư viện KPI" onClick={() => setIsKpiLibraryOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Department Tabs */}
              <div className="flex gap-1.5 border-b border-border pb-2 shrink-0 overflow-x-auto text-xs">
                {kpiLibrary.map((dept) => (
                  <button
                    key={dept.department}
                    type="button"
                    onClick={() => setSelectedKpiDept(dept.department as typeof selectedKpiDept)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors whitespace-nowrap ${
                      selectedKpiDept === dept.department
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {dept.deptName.split('(')[0].trim()}
                  </button>
                ))}
              </div>

              {/* KPI Items List */}
              <div className="overflow-y-auto space-y-3.5 pr-1 py-1 flex-1 text-sm">
                {(() => {
                  const currentDept = kpiLibrary.find((d) => d.department === selectedKpiDept) || kpiLibrary[0];
                  if (!currentDept) return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Chưa có mục tiêu mẫu trong thư viện.</div>;
                  if (!currentDept.items.length) return <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nhóm này chưa có mục tiêu mẫu.{canManageKpiLibrary ? ' Dùng nút “Thêm mục tiêu mẫu” để bổ sung.' : ''}</div>;
                  return currentDept.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border bg-muted/15 hover:border-primary/40 hover:bg-card transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">
                            Mục Tiêu {idx + 1} • {currentDept.deptName.split('(')[0].trim()}
                          </div>
                          <h4 className="font-bold text-foreground text-sm leading-snug">
                            {item.kraTitle}
                          </h4>
                        </div>
                        <span className="shrink-0 text-foreground font-semibold text-xs border border-border/70 px-2 py-0.5 rounded bg-muted/40">
                          Trọng số: {item.weightage}%
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-card border border-border/60 text-sm space-y-1">
                        <span className="font-semibold text-muted-foreground text-xs block">Chỉ số đo lường mục tiêu:</span>
                        <p className="font-bold text-foreground">{item.targetMetric}</p>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                        {canManageKpiLibrary && <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openKpiTemplateForm(item, idx)} aria-label={`Sửa ${item.kraTitle}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Pencil className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button type="button" onClick={() => deleteKpiTemplate(idx)} aria-label={`Xóa ${item.kraTitle}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </div>}
                        {canManageGoals && <button
                          type="button"
                          onClick={() => {
                            setGoalForm({
                              ...goalForm,
                              kraTitle: item.kraTitle,
                              targetMetric: item.targetMetric,
                              weightage: item.weightage,
                              description: item.description,
                            });
                            setIsKpiLibraryOpen(false);
                            openGoalSetup();
                            toast(`Đã chọn mục tiêu: "${item.kraTitle.slice(0, 35)}..."`, 'success');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Sử Dụng Mục Tiêu Này
                        </button>}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="flex justify-end pt-3 border-t shrink-0">
                <Button variant="outline" size="sm" onClick={() => setIsKpiLibraryOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {isKpiTemplateFormOpen && (
        <Portal>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <button type="button" aria-label="Đóng biểu mẫu mục tiêu KPI" className="fixed inset-0 bg-black/50" onClick={() => setIsKpiTemplateFormOpen(false)} />
            <div className="relative z-10 w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-2xl text-foreground space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-base">{editingKpiTemplateIndex === null ? 'Thêm mục tiêu KPI mẫu' : 'Sửa mục tiêu KPI mẫu'}</h3>
                <p className="text-sm text-muted-foreground">Nhóm: {kpiLibrary.find(department => department.department === selectedKpiDept)?.deptName.split('(')[0].trim()}</p>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Tên mục tiêu</span>
                <Input value={kpiTemplateForm.kraTitle} onChange={event => setKpiTemplateForm(form => ({ ...form, kraTitle: event.target.value }))} placeholder="Ví dụ: Hoàn thành kế hoạch tuyển dụng" />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Chỉ số đo lường mục tiêu</span>
                <Input value={kpiTemplateForm.targetMetric} onChange={event => setKpiTemplateForm(form => ({ ...form, targetMetric: event.target.value }))} placeholder="Nêu rõ ngưỡng, đơn vị và thời hạn" />
              </label>
              <label className="block max-w-40 space-y-1.5 text-sm">
                <span className="font-medium">Trọng số tham khảo (%)</span>
                <Input type="number" min={1} max={100} value={kpiTemplateForm.weightage} onChange={event => setKpiTemplateForm(form => ({ ...form, weightage: Number(event.target.value) }))} />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Mô tả / cách thực hiện</span>
                <textarea value={kpiTemplateForm.description} onChange={event => setKpiTemplateForm(form => ({ ...form, description: event.target.value }))} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-ring" placeholder="Ghi nguồn số liệu hoặc cách xác nhận kết quả." />
              </label>
              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={() => setIsKpiTemplateFormOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={saveKpiTemplate} disabled={saveKpiLibraryMutation.isPending || !canManageKpiLibrary}>
                  {saveKpiLibraryMutation.isPending ? 'Đang lưu...' : 'Lưu mục tiêu'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 7: XEM TRƯỚC VÀ IN BIỂU MẪU ĐÁNH GIÁ CHUẨN A4 */}
      {selectedTemplateForPrint && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 no-print"
              onClick={() => setSelectedTemplateForPrint(null)}
            />
            <div className="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl bg-card shadow-2xl border border-border animate-in fade-in zoom-in-95 text-foreground overflow-hidden">
            {/* Header Modal */}
            <div className="flex justify-between items-center p-4 border-b border-border shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">
                  Xem Trước &amp; In Biểu Mẫu Đánh Giá Chuẩn A4
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printDocumentElement('print-evaluation-template')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In Biểu Mẫu (Print A4)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForPrint(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Vùng xem trước biểu mẫu in ấn (Printable Area) */}
            <div className="overflow-y-auto p-6 flex-1 text-sm">
              <div
                id="print-evaluation-template"
                className="print-area print-a4-clean-template font-times bg-card text-foreground p-6 rounded-lg border border-border/80 shadow-xs space-y-5 print:text-black print:p-0 print:border-0 print:m-0 print:shadow-none"
              >
                {/* 1. MẪU KRA TRỌNG SỐ */}
                {selectedTemplateForPrint === 'kra' && (
                  <div className="space-y-4">
                    <div className="print-template-header pb-3 flex justify-between items-start">
                      <div>
                        {printConfig.parentOrgName && <p className="text-xs uppercase">{printConfig.parentOrgName}</p>}
                        <p className="font-bold text-sm uppercase tracking-wider">{printConfig.orgName}</p>
                        {printConfig.deptName && <p className="text-xs uppercase">{printConfig.deptName}</p>}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">MẪU SỐ: 01/ĐG-KRA</p>
                        <p>Năm đánh giá: {activeCycle?.year ?? new Date().getFullYear()}</p>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="font-bold text-lg uppercase text-foreground">
                        PHIẾU GIAO VÀ ĐÁNH GIÁ MỤC TIÊU KRA / KPI THEO TRỌNG SỐ
                      </h2>
                      <p className="text-xs text-muted-foreground italic">
                        (Áp dụng cho cán bộ, nhân viên theo chính sách đánh giá KPI của đơn vị)
                      </p>
                    </div>

                    {/* Khung thông tin cá nhân */}
                    <div className="print-template-identification space-y-1.5 text-sm">
                      {['Họ và tên nhân sự', 'Mã số nhân viên', 'Chức vụ / Vị trí', 'Phòng ban / Đơn vị', 'Người quản lý trực tiếp', 'Kỳ đánh giá'].map((label) => (
                        <div className="print-field flex items-end gap-2" key={label}>
                          <span className="font-medium whitespace-nowrap">{label}:</span>
                          <div className="print-write-area print-write-area-identity min-h-[6mm] flex-1" />
                        </div>
                      ))}
                    </div>

                    {/* Bảng mục tiêu KRA */}
                    <table className="print-kpi-table w-full text-sm text-left border-collapse border border-neutral-600 [&_th]:border [&_th]:border-neutral-600 [&_td]:border [&_td]:border-neutral-600 [&_th]:px-2 [&_td]:px-2 [&_th]:py-1.5 [&_td]:py-1.5">
                      <thead className="text-foreground font-semibold">
                        <tr>
                          <th className="text-center w-8">TT</th>
                          <th>Tiêu chí KRA / Chỉ tiêu nhiệm vụ</th>
                          <th className="text-center w-20">Trọng số</th>
                          <th>Chỉ số đích (Target Metric)</th>
                          <th className="text-center w-24">Điểm KPI (0–100)</th>
                          <th className="text-center w-24">Điểm theo trọng số</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-center font-bold">1</td>
                          <td>
                            <b>KRA 1: Doanh số / Nghiệp vụ cốt lõi</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Đảm bảo chỉ tiêu doanh thu thực thu hoặc sản lượng theo cam kết</span>
                          </td>
                          <td className="text-center font-bold">35%</td>
                          <td>Đạt &gt;= 100% hạn mức doanh số cam kết theo quý</td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">2</td>
                          <td>
                            <b>KRA 2: Tiến độ bàn giao &amp; SLA Dịch vụ</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Hoàn thành Sprint/Dự án đúng hạn, đảm bảo chất lượng kỹ thuật</span>
                          </td>
                          <td className="text-center font-bold">25%</td>
                          <td>SLA Uptime &gt;= 99.9%, bàn giao đúng hạn &gt;= 95%</td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">3</td>
                          <td>
                            <b>KRA 3: Cải tiến kỹ thuật &amp; Tối ưu chi phí</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Sáng kiến tối ưu hóa, tự động hóa quy trình, tiết kiệm tài nguyên</span>
                          </td>
                          <td className="text-center font-bold">20%</td>
                          <td>Tiết kiệm &gt;= 15% thời gian xử lý hoặc ngân sách</td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                        <tr>
                          <td className="text-center font-bold">4</td>
                          <td>
                            <b>KRA 4: Báo cáo &amp; Tuân thủ kỷ luật quy trình</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Báo cáo định kỳ đầy đủ, tuân thủ quy chế nội quy cơ quan</span>
                          </td>
                          <td className="text-center font-bold">20%</td>
                          <td>100% báo cáo đúng hạn, 0 sai phạm quy chế</td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                      </tbody>
                      <tfoot className="font-bold">
                        <tr>
                          <td colSpan={2} className="text-right">TỔNG CỘNG TRỌNG SỐ:</td>
                          <td className="text-center">100%</td>
                          <td colSpan={2} className="text-right">ĐIỂM KRA TỔNG HỢP:</td>
                          <td className="text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Nhận xét & Đánh giá */}
                    <div className="space-y-3 text-sm">
                      <div><b>Nhận xét &amp; Đề xuất của Quản lý trực tiếp:</b><div className="print-write-area print-write-area-response min-h-[16mm]" /></div>
                      <div><b>Xếp loại chu kỳ dự kiến:</b> [  ] Xuất sắc    [  ] Tốt    [  ] Đạt    [  ] Chưa đạt</div>
                      <div><b>Thưởng / điều chỉnh lương:</b> theo chính sách và quyết định riêng đã được duyệt.</div>
                    </div>

                    <p className="pt-3 text-xs italic text-muted-foreground">Biểu mẫu KPI nội bộ; điểm từng KPI do quản lý chấm trên cơ sở kết quả và minh chứng. Điểm chu kỳ là tổng điểm KPI nhân trọng số mục tiêu, tổng trọng số bằng 100%. {isEnterprise ? 'Không tự động quy đổi điểm thành tiền thưởng hoặc lương.' : 'Kết luận công vụ cần được người có thẩm quyền xem xét theo quy định áp dụng.'}</p>

                    {/* 3 Khung chữ ký */}
                    <div className="print-template-signatures grid grid-cols-3 gap-4 pt-4 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">NGƯỜI LAO ĐỘNG</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-10" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">QUẢN LÝ TRỰC TIẾP</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-10" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">LÃNH ĐẠO ĐƠN VỊ DUYỆT</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, đóng dấu)</p>
                        <div className="h-10" />
                        <div className="print-signature-rule" />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-2 p-3 border-t border-border shrink-0 no-print">
              <Button variant="outline" size="sm" onClick={() => setSelectedTemplateForPrint(null)}>
                Đóng
              </Button>
              <Button size="sm" onClick={() => printDocumentElement('print-evaluation-template')}>
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                In Biểu Mẫu A4
              </Button>
            </div>
          </div>
        </div>
      </Portal>
    )}
    </div>
  );
}
