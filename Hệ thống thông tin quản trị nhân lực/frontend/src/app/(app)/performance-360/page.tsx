'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target, Award, MessageSquare, Star, Plus, CheckCircle2,
  Calendar, Layers, Sparkles, TrendingUp, Trash2, X, RefreshCw,
  Filter, User, Building2, Check, Award as Medal, ShieldAlert,
  ArrowRight, CheckCheck, FileSpreadsheet, BookOpen, FileText,
  Printer, Calculator, BarChart3, HelpCircle, Eye, Sliders,
  ChevronRight, Bookmark, ArrowUpRight, CheckSquare, ShieldCheck,
  Percent, Info, ExternalLink, Scale
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, Badge, Input, Select } from '@/components/ui/primitives';
import { StarRating } from '@/components/ui/star-rating';
import { useToast } from '@/components/ui/toaster';
import { printDocumentElement } from '@/components/ui/print';
import { Portal } from '@/components/ui/portal';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

interface AppraisalCycle {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
  organizationSector?: 'enterprise' | 'state';
  publicPersonnelType?: 'CIVIL_SERVANT' | 'PUBLIC_EMPLOYEE' | null;
  selfWeight?: number;
  peerWeight?: number;
  managerWeight?: number;
  subordinateWeight?: number;
  generalCriteriaWeight?: number;
  taskCriteriaWeight?: number;
  _count?: { goals: number; reviews: number };
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
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  status: string;
  cycle?: AppraisalCycle;
  evidences?: { id: string; description: string; metricValue?: string | null; evidenceUrl?: string | null; createdAt: string }[];
}

interface AppraisalReview {
  id: string;
  cycleId: string;
  userId: string;
  reviewerName: string;
  relationship: string;
  rating: number;
  feedback: string;
  submittedAt: string;
  cycle?: AppraisalCycle;
}

interface EmployeeItem {
  id: string;
  fullName: string;
  employeeCode: string;
  jobTitle?: string;
  orgUnit?: { name: string };
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
  comparableGroup: string;
  finalClassification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY' | null;
  excellentCriteriaConfirmed: boolean;
  quotaExceptionApproved: boolean;
  exceptionDecisionNo: string;
  decisionNote: string;
  decided: boolean;
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

// Thư viện Mục tiêu KPI Mẫu theo Khối Phòng Ban
const KPI_LIBRARY = [
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
        kraTitle: 'Đào tạo & Phát triển Năng lực Cán bộ (Training & Skill Matrix)',
        targetMetric: 'Hoàn thành 100% kế hoạch đào tạo năm, đánh giá hiệu quả sau đào tạo >= 85%',
        weightage: 20,
        description: 'Thiết kế khung năng lực, tổ chức các khóa nâng cao chuyên môn và hội thảo chia sẻ tri thức nội bộ.',
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

export default function Performance360Page() {
  const currentUser = useAuthStore(state => state.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [printConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(printConfig);
  const publicEmployee = printConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE';
  const canCalibrate = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD'].includes(role)));
  const canManageGoals = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD'].includes(role)));
  const canManageCycles = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'BOD'].includes(role)));
  const canAdministerGoals = Boolean(currentUser?.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD'].includes(role)));

  const searchParams = useSearchParams();
  const validTabs = useMemo(() => isEnterprise ? ['goals', 'reviews', 'templates', 'rubrics', 'cycles'] : canCalibrate ? ['goals', 'templates', 'rubrics', 'calibration', 'cycles'] : ['goals', 'templates', 'rubrics', 'cycles'], [isEnterprise, canCalibrate]);
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
      router.replace('/performance-360', { scroll: false });
    } else {
      router.replace(`/performance-360?tab=${tab}`, { scroll: false });
    }
  };

  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('ALL');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('ALL');

  // Modals
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [evidenceGoal, setEvidenceGoal] = useState<AppraisalGoal | null>(null);
  const [evidenceForm, setEvidenceForm] = useState({ description: '', metricValue: '', evidenceUrl: '' });
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [calibrationCycleId, setCalibrationCycleId] = useState('');
  const [publicDecisionDrafts, setPublicDecisionDrafts] = useState<Record<string, PublicDecisionDraft>>({});
  const [isKpiLibraryOpen, setIsKpiLibraryOpen] = useState(false);
  const [selectedKpiDept, setSelectedKpiDept] = useState<'tech' | 'sales' | 'finance' | 'hr'>('tech');
  const [selectedTemplateForPrint, setSelectedTemplateForPrint] = useState<'kra' | 'bars' | 'survey360' | 'internalDevelopment' | null>(null);

  // Active items for modals
  const [selectedGoal, setSelectedGoal] = useState<AppraisalGoal | null>(null);

  // Form Cycle
  const [cycleForm, setCycleForm] = useState({
    name: 'Kỳ Đánh giá Hiệu suất & Năng lực 2026',
    year: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    description: 'Chu kỳ đánh giá theo chế độ tổ chức đã cấu hình.',
  });

  // Form Goal
  const [goalForm, setGoalForm] = useState({
    cycleId: '',
    userId: '',
    employeeName: '',
    kraTitle: '',
    targetMetric: '',
    weightage: 25,
    criteriaGroup: 'RESULT' as 'GENERAL' | 'RESULT',
    description: '',
  });

  // Form Score
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [managerScore, setManagerScore] = useState<number | null>(null);

  // Form Review 360
  const [reviewForm, setReviewForm] = useState({
    cycleId: '',
    userId: '',
    reviewerName: 'Trần Minh Quang (Trưởng ban)',
    relationship: 'MANAGER',
    rating: 5,
    feedback: 'Tác phong làm việc chuyên nghiệp, có tinh thần trách nhiệm và hoàn thành tốt chỉ tiêu.',
  });

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
  const effectiveCalibrationCycleId = calibrationCycleId || stateCycles[0]?.id || '';

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<AppraisalGoal[]>({
    queryKey: ['hrms-performance-goals', selectedCycleFilter, selectedEmpFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCycleFilter !== 'ALL') params.cycleId = selectedCycleFilter;
      if (selectedEmpFilter !== 'ALL') params.userId = selectedEmpFilter;
      return (await api.get('/hrms/performance/goals', { params })).data;
    },
  });

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<AppraisalReview[]>({
    queryKey: ['hrms-performance-reviews', selectedCycleFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedCycleFilter !== 'ALL') params.cycleId = selectedCycleFilter;
      return (await api.get('/hrms/performance/reviews', { params })).data;
    },
  });

  const { data: employees = [] } = useQuery<EmployeeItem[]>({
    queryKey: ['employees-simple-list'],
    queryFn: async () => (await api.get('/employees')).data,
  });

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
      return (await api.post('/hrms/performance/cycles', {
        name: payload.name,
        year: Number(payload.year),
        startDate: new Date(payload.startDate).toISOString(),
        endDate: new Date(payload.endDate).toISOString(),
        description: payload.description,
      })).data;
    },
    onSuccess: () => {
      toast('Đã khởi tạo kỳ đánh giá thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-cycles'] });
      setIsCycleModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
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
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-reviews'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const cycleId = goalForm.cycleId || cycles[0]?.id;
      if (!cycleId) throw new Error('Vui lòng chọn hoặc khởi tạo một kỳ đánh giá trước');
      if (!goalForm.userId) throw new Error('Vui lòng chọn nhân sự thực hiện');
      return (await api.post('/hrms/performance/goals', {
        cycleId,
        userId: goalForm.userId,
        employeeName: goalForm.employeeName,
        kraTitle: goalForm.kraTitle,
        targetMetric: goalForm.targetMetric,
        weightage: Number(goalForm.weightage) || 20,
        criteriaGroup: goalForm.criteriaGroup,
        description: goalForm.description,
      })).data;
    },
    onSuccess: () => {
      toast('Đã thiết lập mục tiêu KRA thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-goals'] });
      setIsGoalModalOpen(false);
      setGoalForm({
        cycleId: '',
        userId: '',
        employeeName: '',
        kraTitle: '',
        targetMetric: '',
        weightage: 25,
        criteriaGroup: 'RESULT',
        description: '',
      });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const scoreGoalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGoal) return;
      if (selectedGoal.userId === currentUser?.id) {
        if (selfScore === null) throw new Error('Nhập điểm tự đánh giá');
        return (await api.patch(`/hrms/performance/goals/${selectedGoal.id}/score`, { selfScore })).data;
      }
      if (managerScore === null) throw new Error('Nhập điểm quản lý đánh giá');
      return (await api.patch(`/hrms/performance/goals/${selectedGoal.id}/score`, { managerScore })).data;
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

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const cycleId = reviewForm.cycleId || cycles[0]?.id;
      if (!cycleId) throw new Error('Vui lòng chọn kỳ đánh giá');
      if (!reviewForm.userId) throw new Error('Vui lòng chọn nhân sự được đánh giá');
      return (await api.post('/hrms/performance/reviews', {
        cycleId,
        userId: reviewForm.userId,
        reviewerName: reviewForm.reviewerName,
        relationship: reviewForm.relationship,
        rating: Number(reviewForm.rating),
        feedback: reviewForm.feedback,
      })).data;
    },
    onSuccess: () => {
      toast('Đã gửi đánh giá 360 độ thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-reviews'] });
      setIsReviewModalOpen(false);
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/hrms/performance/reviews/${id}`)).data;
    },
    onSuccess: () => {
      toast('Đã xóa đánh giá 360!', 'success');
      queryClient.invalidateQueries({ queryKey: ['hrms-performance-reviews'] });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
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

  if (isLoadingCycles || isLoadingGoals || isLoadingReviews) {
    return <LoadingState text="Đang tải dữ liệu Đánh giá Hiệu suất 360..." />;
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];
  const goalSetupCycles = cycles.filter((cycle) => cycle.status === 'ACTIVE' && cycle.organizationSector === (isEnterprise ? 'enterprise' : 'state'));
  const goalWeightTotal = (goal: AppraisalGoal) => goals
    .filter((item) => item.userId === goal.userId && item.cycleId === goal.cycleId)
    .reduce((sum, item) => sum + item.weightage, 0);
  const incompleteGoalWeightCount = Array.from(goals.reduce((totals, goal) => {
    const key = `${goal.cycleId}:${goal.userId}`;
    totals.set(key, (totals.get(key) ?? 0) + goal.weightage);
    return totals;
  }, new Map<string, number>()).values()).filter((total) => Math.abs(total - 100) > 0.001).length;
  const openGoalSetup = () => {
    if (!goalSetupCycles.length) {
      toast('Chưa có chu kỳ đang mở cho chế độ tổ chức hiện tại. Hãy khởi tạo chu kỳ trước khi giao mục tiêu.', 'error');
      if (canManageCycles) setIsCycleModalOpen(true);
      return;
    }
    setGoalForm((form) => ({ ...form, cycleId: goalSetupCycles[0].id }));
    setIsGoalModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Đánh giá KPI"
        description={isEnterprise
          ? 'Quy trình quản lý hiệu suất: nhân viên và quản lý thống nhất KRA/KPI có trọng số, sau đó đánh giá và dùng phản hồi 360. Điểm không tự động chuyển thành lương thưởng.'
          : `Đánh giá nhiệm vụ theo tiêu chí chung 30% và kết quả công việc 70% (${printConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'NĐ 233/2026' : 'NĐ 335/2025'}).`}
        breadcrumbs={[{ label: 'Phát triển' }, { label: 'Đánh giá KPI' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/regulations">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Sổ tay Quy ước C&amp;B
              </Button>
            </Link>
            <Link href="/performance-guide">
              <Button variant="outline" size="sm" className="text-xs h-8">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                Cách đánh giá
              </Button>
            </Link>
            {canManageCycles && <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCycleModalOpen(true)}
              className="text-xs h-8"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Khởi tạo chu kỳ
            </Button>}
            {isEnterprise && <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (cycles.length === 0) {
                  toast('Vui lòng tạo ít nhất 1 chu kỳ đánh giá trước!', 'error');
                  setIsCycleModalOpen(true);
                  return;
                }
                setIsReviewModalOpen(true);
              }}
              className="text-xs h-8"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Gửi phản hồi 360
            </Button>}
            {canManageGoals && <Button
              size="sm"
              onClick={openGoalSetup}
              className="text-xs h-8"
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
        {isEnterprise && <NumberCard
          title="Phản Hồi 360 Độ"
          value={reviews.length}
          subtitle="Từ cấp trên, đồng nghiệp & cấp dưới"
          icon={MessageSquare}
        />}
        {isEnterprise && <NumberCard
          title="Điểm phản hồi 360 trung bình"
          value={avgRating === null ? 'Chưa có phản hồi' : `${avgRating} / 5.0`}
          subtitle={avgRating === null ? 'Chưa có phiếu trong chu kỳ đang lọc' : 'Trung bình các phiếu phản hồi 360'}
          icon={Star}
        />}
      </div>

      {isEnterprise && <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6">
        <p className="font-semibold text-foreground">Đây là quy trình kết hợp KPI và phản hồi 360</p>
        <p className="text-muted-foreground">Quản lý hoặc HR giao mục tiêu cho nhân viên; từng KPI cần chỉ số, ngưỡng đạt, thời hạn và nguồn đối chiếu. Nhân viên tự chấm, quản lý chấm kết quả, còn đồng nghiệp/cấp dưới gửi phản hồi 360. Hệ thống ghép các nguồn theo trọng số của chu kỳ và chỉ hoàn tất điểm chu kỳ khi tổng trọng số KPI của mỗi người đủ 100%.</p>
        {incompleteGoalWeightCount > 0 && <p className="mt-1 text-foreground">Hiện có {incompleteGoalWeightCount} nhóm nhân sự/chu kỳ chưa đủ 100% trọng số mục tiêu.</p>}
      </div>}

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
          {isEnterprise && <button
            onClick={() => handleTabChange('reviews')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reviews'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Phản hồi 360 ({reviews.length})
          </button>}
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
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select
            value={selectedCycleFilter}
            onChange={(e) => setSelectedCycleFilter(e.target.value)}
            className="w-[180px] text-xs font-medium"
          >
            <option value="ALL">Tất cả chu kỳ</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </Select>
        </div>
      </div>

      {/* TAB 1: KRA GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card space-y-3">
              <Target className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-bold text-foreground">Chưa có mục tiêu KRA/KPI nào trong chu kỳ này</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {canManageGoals
                  ? 'Quản lý thiết lập mục tiêu theo định hướng của đơn vị và thống nhất chỉ tiêu với nhân viên trước khi giao.'
                  : 'Mục tiêu được quản lý thiết lập và thống nhất với nhân viên. Tại đây, nhân viên theo dõi mục tiêu, tự đánh giá và nộp minh chứng.'}
              </p>
              {canManageGoals && <Button size="sm" onClick={openGoalSetup}>
                <Plus className="w-4 h-4 mr-1.5" /> Thiết Lập Mục Tiêu KRA Đầu Tiên
              </Button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g) => (
                <div key={g.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                        {g.kraTitle}
                      </h3>
                      <p className="text-sm text-primary font-semibold mt-0.5 flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {g.employeeName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted/40 text-foreground">
                        Trọng số: {g.weightage}%
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

                  {g.evidences?.length ? <div className="space-y-1 border-t pt-2 text-xs">
                    <p className="font-medium text-foreground">Kết quả / minh chứng đã ghi ({g.evidences.length})</p>
                    {g.evidences.map((evidence) => <div key={evidence.id} className="text-muted-foreground">
                      <span>{evidence.metricValue ? `${evidence.metricValue} · ` : ''}{evidence.description}</span>
                      {evidence.evidenceUrl && <a href={evidence.evidenceUrl} target="_blank" rel="noreferrer" className="ml-2 text-primary underline">Mở tài liệu</a>}
                    </div>)}
                  </div> : null}

                  <div className="pt-3 border-t flex items-center justify-between text-sm">
                    <div className="space-x-2">
                      <span>Tự chấm: <b>{g.selfScore != null ? `${g.selfScore}/100` : 'Chưa cập nhật'}</b></span>
                      <span>•</span>
                      <span>Quản lý: <b className="font-bold text-foreground">{g.managerScore != null ? `${g.managerScore}/100` : 'Chưa cập nhật'}</b></span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(g.userId === currentUser?.id || canManageGoals) && <button
                        onClick={() => {
                          setEvidenceGoal(g);
                          setEvidenceForm({ description: '', metricValue: '', evidenceUrl: '' });
                        }}
                        className="font-medium text-muted-foreground hover:text-foreground"
                      >Ghi kết quả / minh chứng</button>}
                      <button
                        onClick={() => {
                          setSelectedGoal(g);
                          setSelfScore(g.selfScore ?? null);
                          setManagerScore(g.managerScore ?? null);
                          setIsScoreModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <span>Chấm điểm</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 360 REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-card space-y-3">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-bold text-foreground">Chưa có phản hồi đánh giá 360 độ nào</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Bấm &quot;Gửi Phản Hồi 360&quot; để cấp trên, đồng nghiệp hoặc cấp dưới gửi nhận xét khách quan kèm xếp hạng sao.
              </p>
              <Button size="sm" onClick={() => setIsReviewModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Gửi Đánh Giá 360 Độ
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => {
                const relationMap: Record<string, { label: string; dot: string }> = {
                  MANAGER: { label: 'Cấp Quản lý', dot: 'bg-blue-600' },
                  PEER: { label: 'Đồng nghiệp', dot: 'bg-emerald-600' },
                  SUBORDINATE: { label: 'Cấp dưới', dot: 'bg-purple-600' },
                  SELF: { label: 'Tự đánh giá', dot: 'bg-amber-600' },
                };
                const rel = relationMap[r.relationship] || { label: r.relationship, dot: 'bg-muted-foreground' };

                return (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                          {r.reviewerName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${rel.dot}`} />
                            {rel.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={r.rating} readOnly size="sm" showLabel={false} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Xóa phản hồi 360 này?')) {
                              deleteReviewMutation.mutate(r.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors"
                          title="Xóa đánh giá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-muted/15 p-3.5 rounded-lg border border-border/40">
                      <p className="text-sm text-foreground/85 italic leading-relaxed">&ldquo;{r.feedback}&rdquo;</p>
                    </div>

                    <div className="pt-3 border-t border-border/50 text-sm text-muted-foreground flex justify-between items-center">
                      <span>Thời điểm gửi: {new Date(r.submittedAt).toLocaleDateString('vi-VN')}</span>
                      <span className="font-semibold text-primary">{r.rating} / 5.0</span>
                    </div>
                  </div>
                );
              })}
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
                  Bộ mẫu đánh giá hiệu suất nội bộ
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {isEnterprise
                  ? 'Các mẫu ở chế độ doanh nghiệp là biểu mẫu nội bộ; trọng số thay đổi theo vai trò và không áp dụng hạn ngạch xếp loại công vụ. Kết quả KPI không tự tạo thưởng, điều chỉnh lương hoặc kết nối P3.'
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

            {/* MẪU 2: KHUNG NĂNG LỰC HÀNH VI 1-5 SAO */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-border/80 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        Mẫu 02 • Năng Lực Hành Vi
                      </div>
                      <h4 className="font-bold text-foreground text-base mt-0.5">
                        Khung Đánh Giá Năng Lực Hành Vi Cốt Lõi (1 - 5 Sao)
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Phương pháp đánh giá gắn liền từng mức điểm từ 1 đến 5 với các hành vi thực tế quan sát được, loại bỏ định kiến cảm tính và đảm bảo tính khách quan.
                </p>

                {/* Bảng xem trước 5 năng lực then chốt */}
                <div className="border border-border/70 rounded-lg overflow-hidden text-sm">
                  <div className="bg-muted/40 px-3.5 py-2.5 font-semibold text-foreground border-b border-border/70 flex justify-between items-center text-xs">
                    <span>5 Năng lực hành vi chuẩn hóa</span>
                    <span className="text-muted-foreground">Thang đo: 1★ (Kém) - 5★ (Xuất sắc)</span>
                  </div>
                  <div className="divide-y divide-border/50 bg-card">
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">1. Trách nhiệm &amp; Kỷ luật lao động</span>
                      <span className="text-xs text-muted-foreground italic shrink-0 ml-3">Tuân thủ cam kết, trung thực, nhận lỗi</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">2. Tư duy giải quyết vấn đề &amp; Sáng tạo</span>
                      <span className="text-xs text-muted-foreground italic shrink-0 ml-3">Phân tích nguyên nhân gốc, đưa ra giải pháp</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">3. Kỹ năng giao tiếp &amp; Phối hợp đội ngũ</span>
                      <span className="text-xs text-muted-foreground italic shrink-0 ml-3">Lắng nghe tích cực, kết nối liên phòng ban</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">4. Năng lực chuyên môn &amp; Tốc độ thực thi</span>
                      <span className="text-xs text-muted-foreground italic shrink-0 ml-3">Làm chủ công nghệ, năng suất xử lý cao</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">5. Tính chủ động &amp; Năng lực dẫn dắt</span>
                      <span className="text-xs text-muted-foreground italic shrink-0 ml-3">Tự đề xuất sáng kiến, kèm cặp nhân sự mới</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForPrint('bars')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  Xem và In Khung Năng Lực Hành Vi A4
                </button>
                <span className="text-xs text-muted-foreground font-medium">Áp dụng cho 100% cán bộ nhân viên</span>
              </div>
            </div>

            {isEnterprise && <>
            {/* MẪU 3: PHIẾU KHẢO SÁT ĐÁNH GIÁ ĐA CHIỀU 360 ĐỘ */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-border/80 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        Mẫu 03 • Đa Chiều 360°
                      </div>
                      <h4 className="font-bold text-foreground text-base mt-0.5">
                        Phiếu Khảo Sát Đánh Giá Đa Chiều 360 Độ
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thu thập góc nhìn khách quan từ 4 đối tượng: Quản lý trực tiếp, Đồng nghiệp cùng cấp, Cấp dưới và Tự đánh giá cá nhân, kết hợp điểm số và nhận xét định tính.
                </p>

                {/* Bảng xem trước 6 câu hỏi tình huống */}
                <div className="border border-border/70 rounded-lg overflow-hidden text-sm">
                  <div className="bg-muted/40 px-3.5 py-2.5 font-semibold text-foreground border-b border-border/70 flex justify-between items-center text-xs">
                    <span>Bộ 6 câu hỏi tình huống đánh giá</span>
                    <span className="text-muted-foreground">Thang điểm 1 - 5</span>
                  </div>
                  <div className="divide-y divide-border/50 bg-card p-3.5 space-y-2 text-sm">
                    <p className="text-foreground"><b>Q1:</b> Mức độ giữ đúng cam kết về chất lượng và thời hạn công việc.</p>
                    <p className="text-foreground"><b>Q2:</b> Thái độ hợp tác, lắng nghe và tôn trọng ý kiến đóng góp của người khác.</p>
                    <p className="text-foreground"><b>Q3:</b> Tốc độ phản hồi và sự sẵn sàng tương trợ đồng nghiệp trong tình huống khẩn.</p>
                    <p className="text-foreground"><b>Q4:</b> Sự liêm chính, minh bạch và tinh thần bảo vệ lợi ích chung của đơn vị.</p>
                    <p className="text-xs text-muted-foreground italic pt-1">
                      + 3 Nhận xét mở: Điểm mạnh nổi bật • Điểm cần cải thiện • Kế hoạch phát triển cá nhân.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForPrint('survey360')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  Xem và In Mẫu Khảo Sát A4
                </button>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  Gửi Phản Hồi 360
                </button>
              </div>
            </div>
            </>}

            {isEnterprise && <>
            {/* MẪU 4: PHIẾU ĐÁNH GIÁ NỘI BỘ DOANH NGHIỆP */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-border/80 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                      <Medal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        Mẫu 04 • Nội bộ doanh nghiệp
                      </div>
                      <h4 className="font-bold text-foreground text-base mt-0.5">
                        Phiếu đánh giá hiệu suất và kế hoạch phát triển
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mẫu tham khảo để nhân viên và quản lý ghi nhận kết quả, điểm mạnh, điểm cần cải thiện và mục tiêu phát triển. Không phải biểu mẫu pháp quy.
                </p>

                {/* Bảng xem trước 4 tiêu chuẩn chính */}
                <div className="border border-border/70 rounded-lg overflow-hidden text-sm">
                  <div className="bg-muted/40 px-3.5 py-2.5 font-semibold text-foreground border-b border-border/70 flex justify-between items-center text-xs">
                    <span>Kết quả, năng lực và kế hoạch cải thiện</span>
                    <span className="text-muted-foreground">Mẫu nội bộ</span>
                  </div>
                  <div className="divide-y divide-border/50 bg-card p-3.5 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">1. Kết quả mục tiêu:</span>
                      <span className="text-xs text-muted-foreground">KPI, chất lượng, thời hạn và minh chứng</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">2. Năng lực:</span>
                      <span className="text-xs text-muted-foreground">Năng lực chuyên môn và hành vi theo vị trí</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">3. Phản hồi:</span>
                      <span className="text-xs text-muted-foreground">Ý kiến nhân viên, quản lý và bên liên quan</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">4. Phát triển:</span>
                      <span className="text-xs text-muted-foreground">Mục tiêu, hoạt động, mốc thời gian và minh chứng</span>
                    </div>
                    <div className="pt-1.5 border-t border-border/70 text-foreground font-semibold text-xs">
                      Mức đánh giá theo quy chế và thang điểm doanh nghiệp đã phê duyệt.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForPrint('internalDevelopment')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  Xem và In Mẫu Nội Bộ A4
                </button>
                {!isEnterprise && <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors shadow-2xs"
                >
                  <Medal className="w-4 h-4 text-muted-foreground" />
                  Đồng Bộ Vào Hồ Sơ (QT ĐGCB)
                </button>}
              </div>
            </div>
            </>}
          </div>
        </div>
      )}

      {/* TAB 4: BẢNG QUY ƯỚC & THANG ĐIỂM ĐÁNH GIÁ (RUBRICS) */}
      {activeTab === 'rubrics' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-muted text-foreground border border-border">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-foreground text-base">
                  Bảng Quy Ước Thang Điểm, Xếp Loại Thi Đua &amp; Cơ Chế Tính Lương - Thưởng Hiệu Suất
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEnterprise ? 'Khung đánh giá nội bộ theo vai trò; kết quả KPI chưa tự liên kết sang lương P3.' : 'Khung đánh giá công chức hoặc viên chức theo chế độ đã cấu hình; hạn ngạch chỉ áp dụng trong khu vực công.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
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

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base">2. Công thức theo chế độ và vai trò</h4>
              <p className="mt-1 text-xs text-muted-foreground">{isEnterprise ? 'Trọng số phản hồi áp dụng cho từng mục tiêu; trọng số mục tiêu của cả kỳ cộng đủ 100%.' : 'Điểm từng nhóm tiêu chí được nhân với tỷ lệ 30/70 của kỳ công vụ.'}</p>
            </div>
            {isEnterprise ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-lg border border-border bg-card"><b>Nhân viên không có cấp dưới</b><p className="mt-2 text-sm text-muted-foreground">20% tự đánh giá + 30% đồng nghiệp + 50% quản lý trực tiếp.</p></div>
              <div className="p-4 rounded-lg border border-border bg-card"><b>Quản lý có cấp dưới</b><p className="mt-2 text-sm text-muted-foreground">20% tự đánh giá + 20% đồng nghiệp + 50% cấp trên + 10% cấp dưới.</p></div>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-lg border border-border bg-card"><b>Tiêu chí chung · 30 điểm</b><p className="mt-2 text-sm text-muted-foreground">Tổng trọng số nội bộ nhóm bằng 100%; điểm nhóm được quy đổi vào tỷ lệ 30%.</p></div>
              <div className="p-4 rounded-lg border border-border bg-card"><b>Kết quả nhiệm vụ · 70 điểm</b><p className="mt-2 text-sm text-muted-foreground">Tổng trọng số nội bộ nhóm bằng 100%; điểm nhóm được quy đổi vào tỷ lệ 70%.</p></div>
            </div>}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
              {isEnterprise ? <><p><b>Điểm mục tiêu</b> = tổng điểm phản hồi × trọng số theo vai trò.</p><p><b>Điểm chu kỳ</b> = tổng (điểm mục tiêu × trọng số mục tiêu); trọng số mục tiêu cộng đủ 100%.</p><p className="text-muted-foreground">Kỳ chỉ hoàn tất khi đủ nguồn phản hồi bắt buộc và trọng số mục tiêu. Kết quả không tự nối sang P3 hoặc bảng lương.</p></> : <><p><b>Điểm kỳ</b> = điểm tiêu chí chung × 30% + điểm kết quả nhiệm vụ × 70%.</p><p><b>Xếp loại cuối</b> cần ghi nhận kết luận có thẩm quyền; chỉ đóng kỳ sau khi lưu quyết định cho từng người và qua kiểm tra tỷ lệ khu vực công.</p><p className="text-muted-foreground">Ngưỡng điểm không thay thế các điều kiện định tính, hồ sơ và quy trình phê duyệt theo chế độ công chức/viên chức.</p></>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-foreground text-base">3. Tác động tới lương và hồ sơ</h4>
            <p className="text-sm text-muted-foreground">Hệ thống có thao tác đồng bộ xếp loại đã hoàn tất vào hồ sơ đánh giá nhân sự khi người có quyền thực hiện. Điểm hiện chưa tự tạo khoản thưởng trong bảng lương; chưa có hệ số thưởng được cấu hình và phê duyệt trong bài tập.</p>
            <p className="text-sm text-muted-foreground">{isEnterprise ? 'Các mức thưởng, thay đổi lương, điều kiện thăng chức hoặc kế hoạch cải thiện hiệu suất phải theo chính sách doanh nghiệp. Màn hình này không tự phát sinh các quyết định đó.' : 'Kết luận công vụ chỉ được đồng bộ sau khi kỳ đã hoàn tất và có quyết định cuối cùng. Biểu mẫu pháp quy, ký số và luồng phê duyệt nhiều cấp chưa được tích hợp đầy đủ.'}</p>
          </div>

          {/* QUY ƯỚC 4: THANG ĐO NĂNG LỰC HÀNH VI 5 MỨC */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-foreground" />
                4. THANG ĐO NĂNG LỰC HÀNH VI 5 MỨC ĐỘ CHUẨN HÓA
              </h4>
              <span className="text-xs text-muted-foreground font-medium">Thang đo hành vi thực chứng</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-semibold text-foreground text-sm flex items-center justify-between">
                  <span>1.0 - 1.9 ★</span>
                  <span className="text-xs font-normal text-muted-foreground">(Kém)</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thiếu hụt kiến thức cơ bản, thường xuyên chậm trễ, mắc lỗi sai lặp lại, cần người kèm cặp liên tục từng bước.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-semibold text-foreground text-sm flex items-center justify-between">
                  <span>2.0 - 2.9 ★</span>
                  <span className="text-xs font-normal text-muted-foreground">(Cần cải thiện)</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hoàn thành công việc cơ bản nhưng còn thụ động, tốc độ chậm, gặp khó khăn khi có tình huống phát sinh mới.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-semibold text-foreground text-sm flex items-center justify-between">
                  <span>3.0 - 3.9 ★</span>
                  <span className="text-xs font-normal text-muted-foreground">(Đạt chuẩn)</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Độc lập tác nghiệp tốt, tuân thủ đúng quy trình, hoàn thành đầy đủ khối lượng và chất lượng cam kết đúng tiến độ.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-semibold text-foreground text-sm flex items-center justify-between">
                  <span>4.0 - 4.7 ★</span>
                  <span className="text-xs font-normal text-muted-foreground">(Vượt chuẩn)</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tác phong làm việc chuyên nghiệp, năng suất cao, chủ động giải quyết sự cố và tích cực hỗ trợ đồng nghiệp trong nhóm.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-border bg-card space-y-1.5">
                <div className="font-semibold text-foreground text-sm flex items-center justify-between">
                  <span>4.8 - 5.0 ★</span>
                  <span className="text-xs font-normal text-muted-foreground">(Xuất sắc)</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hình mẫu truyền cảm hứng, dẫn dắt đổi mới sáng tạo, giải quyết bài toán phức tạp và đào tạo thế hệ kế cận.
                </p>
              </div>
            </div>
          </div>

          {/* QUY ƯỚC 5: QUY TRÌNH ĐÁNH GIÁ HIỆU SUẤT 4 BƯỚC KHÉP KÍN */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                5. CHU TRÌNH ĐÁNH GIÁ HIỆU SUẤT 4 GIAI ĐOẠN KHÉP KÍN
              </h4>
              <span className="text-xs text-muted-foreground font-medium">Lập kế hoạch • Thực hiện • Đánh giá • Cải tiến</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 1 • Đầu kỳ</span>
                <h5 className="font-bold text-foreground text-sm">Giao Chỉ Tiêu &amp; Ký Cam Kết</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Quản lý và nhân viên cùng thống nhất mục tiêu KRA theo tiêu chí rõ ràng, phân bổ tỷ trọng % và phương pháp đo lường.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 2 • Giữa kỳ</span>
                <h5 className="font-bold text-foreground text-sm">Trao Đổi &amp; Hiệu Chỉnh Tiến Độ</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tổ chức phiên trao đổi định kỳ rà soát tiến độ, cảnh báo nguy cơ chậm trễ, hỗ trợ tháo gỡ vướng mắc và điều chỉnh chỉ tiêu nếu cần.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 3 • Cuối kỳ</span>
                <h5 className="font-bold text-foreground text-sm">{isEnterprise ? 'Tự chấm & đánh giá nhiều nguồn' : 'Tự đánh giá & thẩm định nhiệm vụ'}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEnterprise ? 'Nhân viên tự chấm KRA; quản lý, đồng nghiệp và cấp dưới gửi phản hồi theo hồ sơ vai trò.' : 'Người được đánh giá tự báo cáo kết quả và minh chứng; người có thẩm quyền chấm tiêu chí chung và kết quả nhiệm vụ theo thang điểm.'}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 4 • Kết luận</span>
                <h5 className="font-bold text-foreground text-sm">{isEnterprise ? 'Hiệu chuẩn và quyết định đãi ngộ' : 'Xếp loại theo quy trình công vụ'}</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEnterprise ? 'Không áp dụng hạn ngạch công vụ. Điểm KPI không tự liên kết bảng lương P3; quyết định thưởng hoặc lương cần quy trình riêng.' : 'HRMS tính điểm theo chế độ 30/70, ghi kết luận và kiểm tra tỷ lệ 20%/ngoại lệ tối đa 25% theo nhóm nhiệm vụ. Biểu mẫu pháp quy đầy đủ, chữ ký số và quy trình phê duyệt của cơ quan chưa được tích hợp đầy đủ.'}
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
              {stateCycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.name} ({cycle.year})</option>)}
            </Select>
          </div>
          {!stateCycles.length ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Chưa có chu kỳ khu vực công. Hãy chọn chế độ tổ chức tại Cấu hình tổ chức và tạo kỳ đánh giá mới.</div>
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
                    <Badge variant={row.complete ? 'default' : 'outline'}>{row.complete ? `${row.score ?? 0} điểm · ${PUBLIC_CLASSIFICATIONS.find(item => item.value === row.scoreClassification)?.label ?? row.scoreClassification}` : row.missingTaskEvidence ? 'Thiếu minh chứng nhiệm vụ' : 'Chưa đủ điểm hoặc trọng số'}</Badge>
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
              Danh sách các Chu kỳ Đánh giá Hiệu suất Toàn diện
            </h3>
            <div className="flex gap-2">
              {!isEnterprise && <Button size="sm" variant="outline" onClick={() => setIsSyncModalOpen(true)}>
                <Medal className="w-4 h-4 mr-1.5 text-amber-500" />
                Đồng Bộ Kết Quả Vào Hồ Sơ Cán Bộ (QT ĐGCB)
              </Button>}
              {canManageCycles && <Button size="sm" onClick={() => setIsCycleModalOpen(true)}>
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
                    <div className="text-sm text-muted-foreground mt-1 font-medium">
                      Năm đánh giá: <b className="text-foreground">{c.year}</b> • Từ {new Date(c.startDate).toLocaleDateString('vi-VN')} đến {new Date(c.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-normal text-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-muted-foreground'}`} />
                    {c.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'}
                  </span>
                </div>

                {c.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-3 rounded-lg text-sm">
                  <div>Mục tiêu KRA: <b className="text-primary font-bold">{c._count?.goals ?? 0}</b></div>
                  <div>{c.organizationSector === 'state' ? 'Khung đánh giá' : 'Phản hồi 360'}: <b className="text-foreground font-bold">{c.organizationSector === 'state' ? `${c.generalCriteriaWeight ?? 30} điểm chung + ${c.taskCriteriaWeight ?? 70} điểm nhiệm vụ` : `${c._count?.reviews ?? 0} phiếu`}</b></div>
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

                  {canManageCycles && <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Xác nhận xóa chu kỳ "${c.name}" cùng toàn bộ mục tiêu và phản hồi liên quan?`)) {
                        deleteCycleMutation.mutate(c.id);
                      }
                    }}
                    className="text-destructive font-semibold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa chu kỳ
                  </button>}
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
                  Khởi Tạo Chu Kỳ Đánh Giá Mới
                </h3>
                <button onClick={() => setIsCycleModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-medium text-foreground block mb-1">Tên kỳ đánh giá:</label>
                  <Input
                    value={cycleForm.name}
                    onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                    placeholder="VD: Kỳ Đánh giá Hiệu suất 2026..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Năm:</label>
                    <Input
                      type="number"
                      value={cycleForm.year}
                      onChange={(e) => setCycleForm({ ...cycleForm, year: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Từ ngày:</label>
                    <Input
                      type="date"
                      value={cycleForm.startDate}
                      onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Đến ngày:</label>
                    <Input
                      type="date"
                      value={cycleForm.endDate}
                      onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Mô tả hướng dẫn:</label>
                  <textarea
                    value={cycleForm.description}
                    onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    placeholder="Tiêu chí đánh giá, đối tượng tham gia..."
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  {isEnterprise ? <>
                    <p className="font-medium">Trọng số cố định theo vai trò người được đánh giá</p>
                    <p className="mt-1 text-muted-foreground">Nhân viên: tự đánh giá 20%, đồng nghiệp 30%, quản lý 50%. Quản lý có cấp dưới: tự đánh giá 20%, đồng nghiệp 20%, cấp trên 50%, cấp dưới 10%.</p>
                  </> : <>
                    <p className="font-medium">Khung đánh giá khu vực nhà nước</p>
                    <p className="mt-1 text-muted-foreground">Tiêu chí chung 30 điểm; kết quả nhiệm vụ 70 điểm. Ngưỡng tham chiếu 90 / 70 / 50; mỗi nhóm tiêu chí phân bổ đủ 100% trọng số.</p>
                  </>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsCycleModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => createCycleMutation.mutate(cycleForm)} disabled={createCycleMutation.isPending}>
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
                      {cycles.map((c) => (
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

                <div>
                  <label className="font-medium text-foreground block mb-1">Chọn Nhân sự thực hiện (Cơ sở dữ liệu):</label>
                  <Select
                    value={goalForm.userId}
                    onChange={(e) => {
                      const found = employees.find((emp) => emp.id === e.target.value);
                      setGoalForm({
                        ...goalForm,
                        userId: e.target.value,
                        employeeName: found ? found.fullName : '',
                      });
                    }}
                    searchable
                    searchPlaceholder="Tìm mã NV, họ tên cán bộ, chức danh..."
                    className="text-xs"
                  >
                    <option value="">-- Chọn nhân sự từ hệ thống --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} {emp.jobTitle ? `- ${emp.jobTitle}` : ''}
                      </option>
                    ))}
                  </Select>
                </div>

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
                <Button size="sm" onClick={() => createGoalMutation.mutate()} disabled={createGoalMutation.isPending}>
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

                <div className="grid grid-cols-1 gap-3">
                  {selectedGoal.userId === currentUser?.id ? (
                    <div>
                      <label className="font-medium text-foreground block mb-1">Điểm tự đánh giá (thang 0–100):</label>
                      <Input type="number" min="0" max="100" value={selfScore ?? ''} onChange={(e) => setSelfScore(e.target.value === '' ? null : Number(e.target.value))} />
                    </div>
                  ) : (
                    <div>
                      <label className="font-medium text-foreground block mb-1">Điểm quản lý đánh giá (thang 0–100):</label>
                      <Input type="number" min="0" max="100" value={managerScore ?? ''} onChange={(e) => setManagerScore(e.target.value === '' ? null : Number(e.target.value))} />
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">Cách tính đang dùng:</p>
                  <p className="text-muted-foreground">{selectedGoal.cycle?.organizationSector === 'state' ? 'Kỳ khu vực công: tiêu chí chung chiếm 30 điểm và kết quả nhiệm vụ 70 điểm. Điểm quản lý là căn cứ nhập liệu; kết luận xếp loại cần qua bước hiệu chuẩn có thẩm quyền.' : 'Kỳ doanh nghiệp: nhân viên 20% tự đánh giá, 30% đồng nghiệp và 50% quản lý. Với quản lý có cấp dưới, mô hình là 20% tự đánh giá, 20% đồng nghiệp, 50% cấp trên và 10% cấp dưới. Điểm chu kỳ cộng điểm mục tiêu theo trọng số; tổng trọng số phải bằng 100%.'}</p>
                  <p className="text-muted-foreground">{selectedGoal.finalScore != null ? `Điểm tổng hợp hiện đã lưu: ${selectedGoal.finalScore}/100.` : 'Chưa đủ dữ liệu để hiển thị điểm tổng hợp của mục tiêu.'} Điểm này không tự tạo thưởng hoặc thay đổi lương; quyết định đã duyệt phải được ghi riêng.</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsScoreModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => scoreGoalMutation.mutate()} disabled={scoreGoalMutation.isPending || (selectedGoal?.userId === currentUser?.id ? selfScore === null : managerScore === null)}>
                  {scoreGoalMutation.isPending ? 'Đang lưu...' : 'Lưu Điểm Đánh Giá'}
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 4: GỬI PHẢN HỒI ĐÁNH GIÁ 360 */}
      {isReviewModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={() => setIsReviewModalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 text-foreground">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Gửi Phản Hồi Đánh Giá 360 Độ
                </h3>
                <button onClick={() => setIsReviewModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Kỳ đánh giá:</label>
                    <Select
                      value={reviewForm.cycleId || cycles[0]?.id}
                      onChange={(e) => setReviewForm({ ...reviewForm, cycleId: e.target.value })}
                      className="w-full text-xs"
                    >
                      {cycles.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Nhân sự được đánh giá:</label>
                    <Select
                      value={reviewForm.userId}
                      onChange={(e) => setReviewForm({ ...reviewForm, userId: e.target.value })}
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
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Người đánh giá:</label>
                    <Input
                      value={reviewForm.reviewerName}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Mối quan hệ:</label>
                    <Select
                      value={reviewForm.relationship}
                      onChange={(e) => setReviewForm({ ...reviewForm, relationship: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="MANAGER">Cấp Quản lý</option>
                      <option value="PEER">Đồng nghiệp</option>
                      <option value="SUBORDINATE">Cấp dưới</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Đánh giá sao (1 - 5 sao):</label>
                  <div className="p-2 border rounded-lg bg-card flex items-center justify-between">
                    <StarRating
                      value={reviewForm.rating}
                      onChange={(val) => setReviewForm({ ...reviewForm, rating: val })}
                      size="md"
                      showLabel
                    />
                  </div>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1">Ý kiến phản hồi & Nhận xét:</label>
                  <textarea
                    value={reviewForm.feedback}
                    onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground"
                    placeholder="Góp ý cụ thể về năng lực, thái độ, tinh thần cộng tác..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => createReviewMutation.mutate()} disabled={createReviewMutation.isPending}>
                  {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                </Button>
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
                  <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-foreground text-base">
                      Thư Viện Mục Tiêu KPI / KRA Mẫu Chuẩn SMART
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Chọn mục tiêu mẫu định chuẩn cho từng khối phòng ban để tự động áp dụng vào chu kỳ đánh giá.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsKpiLibraryOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Department Tabs */}
              <div className="flex gap-1.5 border-b border-border pb-2 shrink-0 overflow-x-auto text-xs">
                {KPI_LIBRARY.map((dept) => (
                  <button
                    key={dept.department}
                    type="button"
                    onClick={() => setSelectedKpiDept(dept.department as any)}
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
                  const currentDept = KPI_LIBRARY.find((d) => d.department === selectedKpiDept) || KPI_LIBRARY[0];
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

                      <div className="pt-2 border-t border-border/50 flex justify-end">
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
                    <div className="pb-3 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wider">CÔNG TY CỔ PHẦN CÔNG NGHỆ HRMIS PRO</p>
                        <p className="text-xs text-muted-foreground">BAN NHÂN SỰ &amp; QUẢN TRỊ HIỆU SUẤT</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">MẪU SỐ: 01/ĐG-KRA</p>
                        <p>Năm đánh giá: 2026</p>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="font-bold text-lg uppercase text-foreground">
                        PHIẾU GIAO VÀ ĐÁNH GIÁ MỤC TIÊU KRA / KPI THEO TRỌNG SỐ
                      </h2>
                      <p className="text-xs text-muted-foreground italic">
                        (Áp dụng cho toàn bộ Cán bộ, Nhân viên trong kỳ đánh giá hiệu suất định kỳ)
                      </p>
                    </div>

                    {/* Khung thông tin cá nhân */}
                    <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
                      {['Họ và tên nhân sự', 'Mã số nhân viên', 'Chức vụ / Vị trí', 'Phòng ban / Đơn vị', 'Người quản lý trực tiếp', 'Kỳ đánh giá'].map((label) => (
                        <div className="print-field" key={label}>
                          <p className="font-medium">{label}</p>
                          <div className="print-write-area print-write-area-identity min-h-[9mm]" />
                        </div>
                      ))}
                    </div>

                    {/* Bảng mục tiêu KRA */}
                    <table className="w-full text-sm text-left border border-border/80">
                      <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/80">
                        <tr>
                          <th className="p-2.5 border-r border-border/60 text-center w-8">TT</th>
                          <th className="p-2.5 border-r border-border/60">Tiêu chí KRA / Chỉ tiêu nhiệm vụ</th>
                          <th className="p-2.5 border-r border-border/60 text-center w-20">Trọng số</th>
                          <th className="p-2.5 border-r border-border/60">Chỉ số đích (Target Metric)</th>
                          <th className="p-2.5 border-r border-border/60 text-center w-20">Tự chấm</th>
                          <th className="p-2.5 border-r border-border/60 text-center w-20">QL chấm</th>
                          <th className="p-2.5 text-center w-24">Quy đổi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">1</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 1: Doanh số / Nghiệp vụ cốt lõi</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Đảm bảo chỉ tiêu doanh thu thực thu hoặc sản lượng theo cam kết</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">35%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Đạt &gt;= 100% hạn mức doanh số cam kết theo quý</td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-money" /> đ</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">2</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 2: Tiến độ bàn giao &amp; SLA Dịch vụ</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Hoàn thành Sprint/Dự án đúng hạn, đảm bảo chất lượng kỹ thuật</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">25%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">SLA Uptime &gt;= 99.9%, bàn giao đúng hạn &gt;= 95%</td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-money" /> đ</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">3</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 3: Cải tiến kỹ thuật &amp; Tối ưu chi phí</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Sáng kiến tối ưu hóa, tự động hóa quy trình, tiết kiệm tài nguyên</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">20%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Tiết kiệm &gt;= 15% thời gian xử lý hoặc ngân sách</td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-money" /> đ</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">4</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 4: Báo cáo &amp; Tuân thủ kỷ luật quy trình</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Báo cáo định kỳ đầy đủ, tuân thủ quy chế nội quy cơ quan</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">20%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">100% báo cáo đúng hạn, 0 sai phạm quy chế</td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center border-r border-border/60"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                          <td className="p-2.5 text-center"><span className="print-score-entry"><span className="print-score-slot print-score-slot-money" /> đ</span></td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-muted/30 font-bold border-t border-border/80">
                        <tr>
                          <td colSpan={2} className="p-2.5 text-right">TỔNG CỘNG TRỌNG SỐ:</td>
                          <td className="p-2.5 text-center">100%</td>
                          <td colSpan={3} className="p-2.5 text-right">ĐIỂM KRA TỔNG HỢP:</td>
                          <td className="p-2.5 text-center text-primary"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Nhận xét & Đánh giá */}
                    <div className="space-y-3 text-sm">
                      <div><b>Ý kiến tự nhận xét của nhân sự:</b><div className="print-write-area print-write-area-response min-h-[16mm]" /></div>
                      <div><b>Nhận xét &amp; Đề xuất của Quản lý trực tiếp:</b><div className="print-write-area print-write-area-response min-h-[16mm]" /></div>
                      <div><b>Xếp loại chu kỳ dự kiến:</b> [  ] Xuất sắc    [  ] Tốt    [  ] Đạt    [  ] Chưa đạt</div>
                      <div><b>Thưởng / điều chỉnh lương:</b> theo chính sách và quyết định riêng đã được duyệt.</div>
                    </div>

                    <p className="pt-3 text-xs italic text-muted-foreground">Biểu mẫu nội bộ tham khảo. {isEnterprise ? 'Nhân viên: 20% tự đánh giá, 30% đồng nghiệp, 50% quản lý; quản lý có cấp dưới: 20% tự đánh giá, 20% đồng nghiệp, 50% cấp trên, 10% cấp dưới.' : 'Khu vực công: tiêu chí chung 30 điểm và kết quả nhiệm vụ 70 điểm; kết luận cần qua bước có thẩm quyền.'} Trọng số mục tiêu lấy theo kỳ đánh giá. Không tự động quy đổi điểm thành tiền thưởng hoặc lương.</p>

                    {/* 3 Khung chữ ký */}
                    <div className="grid grid-cols-3 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">NGƯỜI LAO ĐỘNG</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">QUẢN LÝ TRỰC TIẾP</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">LÃNH ĐẠO ĐƠN VỊ DUYỆT</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, đóng dấu)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MẪU NĂNG LỰC HÀNH VI BARS */}
                {selectedTemplateForPrint === 'bars' && (
                  <div className="space-y-4">
                    <div className="pb-3 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wider">HỆ THỐNG QUẢN TRỊ NĂNG LỰC NHÂN SỰ</p>
                        <p className="text-xs text-muted-foreground">KHUNG ĐÁNH GIÁ NĂNG LỰC HÀNH VI CỐT LÕI (BARS)</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">MẪU SỐ: 02/ĐG-BARS</p>
                        <p>Năm đánh giá: 2026</p>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="font-bold text-lg uppercase text-foreground">
                        PHIẾU ĐÁNH GIÁ NĂNG LỰC HÀNH VI CỐT LÕI (BARS FRAMEWORK)
                      </h2>
                      <p className="text-xs text-muted-foreground italic">
                        (Thang đo neo hành vi thực chứng từ 1 đến 5 sao - Behaviorally Anchored Rating Scales)
                      </p>
                    </div>

                    {/* Bảng 5 năng lực */}
                    <table className="w-full text-sm text-left border border-border/80">
                      <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/80">
                        <tr>
                          <th className="p-2.5 border-r border-border/60 text-center w-8">TT</th>
                          <th className="p-2.5 border-r border-border/60">Nhóm Năng Lực Cốt Lõi</th>
                          <th className="p-2.5 border-r border-border/60">Minh Chứng Hành Vi Neo (Mức 3 - Đạt Chuẩn)</th>
                          <th className="p-2.5 border-r border-border/60">Minh Chứng Hành Vi Vượt Trội (Mức 5 - Xuất Sắc)</th>
                          <th className="p-2.5 text-center w-28">Điểm Đánh Giá (1-5★)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">1</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Trách nhiệm &amp; Kỷ luật lao động</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Tuân thủ nội quy, hoàn thành công việc đúng cam kết, không đùn đẩy trách nhiệm</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Tận tâm vượt bậc, chủ động nhận lỗi và giải pháp, làm gương cho toàn đơn vị</td>
                          <td className="p-2.5 text-center font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">2</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Tư duy giải quyết vấn đề &amp; Sáng tạo</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Xử lý tốt sự cố thông thường, phân tích nguyên nhân gốc rễ rõ ràng</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Đột phá, biến khủng hoảng thành cơ hội cải tiến quy trình vượt trội</td>
                          <td className="p-2.5 text-center font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">3</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Giao tiếp &amp; Phối hợp đội ngũ</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Giao tiếp mạch lạc, tôn trọng ý kiến đồng nghiệp, hợp tác nội bộ tốt</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Truyền cảm hứng, hóa giải mâu thuẫn, xây dựng văn hóa gắn kết tập thể</td>
                          <td className="p-2.5 text-center font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">4</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Chuyên môn &amp; Tốc độ thực thi</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Làm chủ công việc chuyên trách, năng suất ổn định, ít sai sót nghiệp vụ</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Chuyên gia đầu ngành, tốc độ xử lý nhanh, đào tạo và dẫn dắt đội ngũ</td>
                          <td className="p-2.5 text-center font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">5</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Tính chủ động &amp; Năng lực dẫn dắt</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Tự giác trong công việc, sẵn sàng nhận nhiệm vụ mới khi được phân công</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Đề xuất sáng kiến chiến lược, hướng dẫn và kèm cặp nhân viên mới tận tình</td>
                          <td className="p-2.5 text-center font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-muted/30 font-bold border-t border-border/80">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right">TỔNG ĐIỂM BARS (QUY ĐỔI THANG 100):</td>
                          <td className="p-2.5 text-center text-purple-700 dark:text-purple-400 font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-100" /> / 100</span></td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* 3 Khung chữ ký */}
                    <div className="grid grid-cols-3 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">CÁN BỘ ĐƯỢC ĐÁNH GIÁ</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">HỘI ĐỒNG ĐÁNH GIÁ NĂNG LỰC</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">GIÁM ĐỐC NHÂN SỰ</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, đóng dấu)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MẪU KHẢO SÁT 360 ĐỘ */}
                {isEnterprise && selectedTemplateForPrint === 'survey360' && (
                  <div className="space-y-4">
                    <div className="pb-3 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wider">HỆ THỐNG ĐÁNH GIÁ ĐA CHIỀU 360 ĐỘ</p>
                        <p className="text-xs text-muted-foreground">PHIẾU KHẢO SÁT &amp; PHẢN HỒI KÍN ĐỊNH KỲ</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">MẪU SỐ: 03/ĐG-360</p>
                        <p>Năm đánh giá: 2026</p>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="font-bold text-lg uppercase text-foreground">
                        PHIẾU KHẢO SÁT &amp; PHẢN HỒI ĐÁNH GIÁ 360 ĐỘ
                      </h2>
                      <p className="text-xs text-muted-foreground italic">
                        (Mối quan hệ đánh giá: [  ] Quản lý trực tiếp    [  ] Đồng nghiệp cùng cấp    [  ] Cấp dưới    [  ] Tự đánh giá)
                      </p>
                    </div>

                    {/* Bộ 6 câu hỏi */}
                    <div className="space-y-3">
                      <table className="w-full text-sm text-left border border-border/80">
                        <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/80">
                          <tr>
                            <th className="p-2.5 border-r border-border/60 text-center w-8">TT</th>
                            <th className="p-2.5 border-r border-border/60">Nội Dung Khảo Sát Năng Lực &amp; Phẩm Chất</th>
                            <th className="p-2.5 text-center w-36">Đánh giá (1-5 Sao)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">1</td>
                            <td className="p-2.5 border-r border-border/60">Nhân sự luôn giữ đúng cam kết về chất lượng, số lượng và thời hạn hoàn thành công việc.</td>
                            <td className="p-2.5 text-center font-medium"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">2</td>
                            <td className="p-2.5 border-r border-border/60">Thái độ hợp tác tích cực, tôn trọng ý kiến khác biệt và lắng nghe phản hồi của người khác.</td>
                            <td className="p-2.5 text-center font-medium"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">3</td>
                            <td className="p-2.5 border-r border-border/60">Tốc độ phản hồi nhanh, sẵn sàng tương trợ đồng nghiệp trong các tình huống khẩn cấp, quá tải.</td>
                            <td className="p-2.5 text-center font-medium"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">4</td>
                            <td className="p-2.5 border-r border-border/60">Sự trung thực, minh bạch, liêm chính và luôn đặt lợi ích chung của đơn vị lên trên lợi ích riêng.</td>
                            <td className="p-2.5 text-center font-medium"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">5</td>
                            <td className="p-2.5 border-r border-border/60">Khả năng thích ứng linh hoạt trước sự thay đổi về công nghệ, quy trình hoặc định hướng của đơn vị.</td>
                            <td className="p-2.5 text-center font-medium"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">6</td>
                            <td className="p-2.5 border-r border-border/60">Tinh thần chủ động đóng góp sáng kiến, tích cực tham gia các phong trào, hoạt động của cơ quan.</td>
                            <td className="p-2.5 text-center font-medium"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5★</span></td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-muted/30 font-bold border-t border-border/80">
                          <tr>
                            <td colSpan={2} className="p-2.5 text-right">ĐIỂM ĐÁNH GIÁ 360 ĐỘ BÌNH QUÂN:</td>
                            <td className="p-2.5 text-center text-emerald-700 dark:text-emerald-400 font-bold"><span className="print-score-entry"><span className="print-score-slot print-score-slot-5" /> / 5.0★</span></td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Nhận xét mở */}
                      <div className="space-y-3 text-sm">
                        <div><b>1. Ba điểm mạnh nổi bật nhất của nhân sự:</b><div className="print-write-area print-write-area-response min-h-[16mm]" /></div>
                        <div><b>2. Hai điểm cần nỗ lực cải thiện trong chu kỳ tới:</b><div className="print-write-area print-write-area-response min-h-[16mm]" /></div>
                        <div><b>3. Đề xuất kế hoạch đào tạo &amp; phát triển cá nhân (IDP):</b><div className="print-write-area print-write-area-response min-h-[16mm]" /></div>
                      </div>
                    </div>

                    {/* Khung chữ ký */}
                    <div className="grid grid-cols-2 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">NGƯỜI LẬP PHIẾU PHẢN HỒI</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên - Thông tin được bảo mật)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                      <div>
                        <p className="font-bold uppercase">BỘ PHẬN NHÂN SỰ XÁC NHẬN</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <div className="print-signature-rule" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mẫu đánh giá nội bộ; không dùng làm mẫu pháp quy */}
                {isEnterprise && selectedTemplateForPrint === 'internalDevelopment' && (
                  <div className="print-a4-compact space-y-3 text-sm">
                    <div className="text-center space-y-1 pb-2">
                      <p className="font-bold text-sm uppercase">{printConfig.orgName || 'TÊN DOANH NGHIỆP'}</p>
                      <p className="font-bold text-base uppercase">PHIẾU ĐÁNH GIÁ HIỆU SUẤT VÀ KẾ HOẠCH PHÁT TRIỂN</p>
                      <p className="text-xs italic">Mẫu nội bộ · Kỳ đánh giá:</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {['Họ và tên', 'Chức danh', 'Đơn vị', 'Quản lý đánh giá'].map((label) => (
                        <div className="print-field" key={label}>
                          <p className="font-medium">{label}</p>
                          <div className="print-write-area print-write-area-identity min-h-[9mm]" />
                        </div>
                      ))}
                    </div>
                    <div className="print-section space-y-2">
                      <p className="font-bold uppercase">I. Kết quả mục tiêu và minh chứng</p>
                      {['Mục tiêu / chỉ số', 'Kết quả, chất lượng và thời hạn', 'Minh chứng / liên kết hồ sơ'].map((label) => (
                        <div className="print-field" key={label}>
                          <p>{label}</p>
                          <div className="print-write-area print-write-area-response min-h-[16mm]" />
                        </div>
                      ))}
                    </div>
                    <div className="print-section space-y-2">
                      <p className="font-bold uppercase">II. Năng lực và phản hồi</p>
                      {['Năng lực nổi bật, có ví dụ minh chứng', 'Năng lực cần cải thiện', 'Phản hồi của nhân viên / quản lý / bên liên quan'].map((label) => (
                        <div className="print-field" key={label}>
                          <p>{label}</p>
                          <div className="print-write-area print-write-area-response min-h-[16mm]" />
                        </div>
                      ))}
                    </div>
                    <div className="print-section space-y-2">
                      <p className="font-bold uppercase">III. Kế hoạch phát triển kỳ tiếp theo</p>
                      {['Mục tiêu cải thiện', 'Hoạt động, người hỗ trợ và hạn hoàn thành', 'Tiêu chí xác nhận hoàn thành'].map((label) => (
                        <div className="print-field" key={label}>
                          <p>{label}</p>
                          <div className="print-write-area print-write-area-response min-h-[16mm]" />
                        </div>
                      ))}
                    </div>
                    <div className="print-signatures grid grid-cols-2 gap-4 pt-3 text-center">
                      <div><p className="font-bold uppercase">NHÂN VIÊN</p><p className="text-xs italic">(Xác nhận nội bộ)</p><div className="h-16" /><div className="print-signature-rule mx-auto" /></div>
                      <div><p className="font-bold uppercase">QUẢN LÝ</p><p className="text-xs italic">(Xác nhận nội bộ)</p><div className="h-16" /><div className="print-signature-rule mx-auto" /></div>
                    </div>
                    <p className="pt-2 text-xs italic text-muted-foreground">Biểu mẫu nội bộ. Với công chức hoặc viên chức, cần dùng đúng mẫu và quy trình hiện hành theo đối tượng; hệ thống chưa tích hợp các mẫu pháp quy đó.</p>
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
