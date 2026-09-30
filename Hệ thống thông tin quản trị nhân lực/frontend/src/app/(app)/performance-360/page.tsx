'use client';

import React, { useState, useEffect } from 'react';
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
  Percent, Info, ExternalLink
} from 'lucide-react';
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

interface AppraisalCycle {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
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
  targetMetric: string;
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  status: string;
  cycle?: AppraisalCycle;
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const searchParams = useSearchParams();
  const validTabs = ['goals', 'reviews', 'templates', 'rubrics', 'cycles'] as const;
  type TabType = typeof validTabs[number];

  const paramTab = searchParams.get('tab');
  const initialTab = (paramTab && (validTabs as readonly string[]).includes(paramTab)) ? (paramTab as TabType) : 'goals';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Lắng nghe URL searchParams để chuyển tab tức thì khi bấm từ Sidebar menu (?tab=templates hoặc ?tab=rubrics)
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && (validTabs as readonly string[]).includes(currentTab)) {
      setActiveTab(currentTab as TabType);
    } else if (!currentTab) {
      setActiveTab('goals');
    }
  }, [searchParams]);

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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isKpiLibraryOpen, setIsKpiLibraryOpen] = useState(false);
  const [selectedKpiDept, setSelectedKpiDept] = useState<'tech' | 'sales' | 'finance' | 'hr'>('tech');
  const [selectedTemplateForPrint, setSelectedTemplateForPrint] = useState<'kra' | 'bars' | 'survey360' | 'nd90' | null>(null);

  // Active items for modals
  const [selectedGoal, setSelectedGoal] = useState<AppraisalGoal | null>(null);

  // Form Cycle
  const [cycleForm, setCycleForm] = useState({
    name: 'Kỳ Đánh giá Hiệu suất & Năng lực 2026',
    year: 2026,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    description: 'Chu kỳ đánh giá năng lực, KRA/KPI và phản hồi 360 độ toàn diện toàn cơ quan/doanh nghiệp.',
  });

  // Form Goal
  const [goalForm, setGoalForm] = useState({
    cycleId: '',
    userId: '',
    employeeName: '',
    kraTitle: '',
    targetMetric: '',
    weightage: 25,
    description: '',
  });

  // Form Score
  const [selfScore, setSelfScore] = useState(90);
  const [managerScore, setManagerScore] = useState(95);

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
    classification: 'EXCELLENT' as 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY',
    comment: 'Hoàn thành xuất sắc nhiệm vụ theo kỳ đánh giá hiệu suất 360 độ',
    decisionNo: 'QĐ-ĐGCB/2026',
  });

  // Queries
  const { data: cycles = [], isLoading: isLoadingCycles } = useQuery<AppraisalCycle[]>({
    queryKey: ['hrms-performance-cycles'],
    queryFn: async () => (await api.get('/hrms/performance/cycles')).data,
  });

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
        description: '',
      });
    },
    onError: (err) => toast('Lỗi: ' + errorMessage(err), 'error'),
  });

  const scoreGoalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGoal) return;
      return (await api.patch(`/hrms/performance/goals/${selectedGoal.id}/score`, {
        selfScore: Number(selfScore),
        managerScore: Number(managerScore),
      })).data;
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
    : '5.0';

  const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Đánh giá KPI"
        description="Thiết lập mục tiêu KPI theo trọng số, quy trình tự đánh giá và phản hồi đa chiều."
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCycleModalOpen(true)}
              className="text-xs h-8"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Khởi tạo chu kỳ
            </Button>
            <Button
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
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (cycles.length === 0) {
                  toast('Vui lòng tạo ít nhất 1 chu kỳ đánh giá trước!', 'error');
                  setIsCycleModalOpen(true);
                  return;
                }
                setIsGoalModalOpen(true);
              }}
              className="text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Thiết lập mục tiêu KRA
            </Button>
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
        <NumberCard
          title="Phản Hồi 360 Độ"
          value={reviews.length}
          subtitle="Từ cấp trên, đồng nghiệp & cấp dưới"
          icon={MessageSquare}
        />
        <NumberCard
          title="Điểm Đánh Giá TB"
          value={`${avgRating} / 5.0`}
          subtitle="Mức đánh giá tích lũy"
          icon={Star}
          trend={{ value: '+0.2', isPositive: true, label: 'chu kỳ này' }}
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
            onClick={() => handleTabChange('reviews')}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'reviews'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Phản hồi 360 ({reviews.length})
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
                Bấm nút &quot;Thiết Lập Mục Tiêu KRA&quot; để giao chỉ tiêu cụ thể, trọng số phần trăm và phương pháp đo lường cho cán bộ nhân viên.
              </p>
              <Button size="sm" onClick={() => setIsGoalModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Thiết Lập Mục Tiêu KRA Đầu Tiên
              </Button>
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
                      <button
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
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{g.description || 'Không có mô tả chi tiết'}</p>

                  <div className="bg-muted/20 p-3 rounded-lg text-sm space-y-1.5 border border-border/40">
                    <span className="text-muted-foreground text-xs font-medium">Chỉ số đo lường mục tiêu:</span>
                    <p className="font-semibold text-foreground text-sm">{g.targetMetric || 'Chưa thiết lập'}</p>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-sm">
                    <div className="space-x-2">
                      <span>Tự chấm: <b>{g.selfScore != null ? `${g.selfScore}/100` : '—'}</b></span>
                      <span>•</span>
                      <span>Quản lý: <b className="font-bold text-foreground">{g.managerScore != null ? `${g.managerScore}/100` : '—'}</b></span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setSelfScore(g.selfScore ?? 90);
                        setManagerScore(g.managerScore ?? 95);
                        setIsScoreModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <span>Chấm Điểm</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
                  Bộ Biểu Mẫu Đánh Giá Nhân Sự Chuẩn Quốc Tế & Quy Định Nhà Nước
                </h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Hệ thống chuẩn hóa 4 bộ form mẫu đánh giá toàn diện: KRA/KPI trọng số định lượng, Khung năng lực hành vi BARS 1-5 sao, Khảo sát đa chiều 360 độ và Mẫu phân loại cán bộ theo Nghị định 90/2020/NĐ-CP. Hỗ trợ xem trước và in ấn A4 chuẩn văn bản hành chính.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsKpiLibraryOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                Thư Viện KPI Mẫu
              </button>
            </div>
          </div>

          {/* Grid 4 Form Mẫu Đánh Giá Chuẩn */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                        Mẫu 01 • Định Lượng
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
                  <div className="divide-y divide-border/50 bg-card">
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">Mục tiêu 1: Doanh số &amp; Nghiệp vụ cốt lõi</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">Đích: Hoàn thành 100% hạn mức cam kết</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 35%</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">Mục tiêu 2: Tiến độ &amp; Chất lượng dịch vụ</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">Đích: Tỷ lệ hoạt động ổn định &gt;= 99.9%, bàn giao đúng hẹn</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 25%</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">Mục tiêu 3: Cải tiến kỹ thuật &amp; Tiết kiệm chi phí</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">Đích: Tiết kiệm &gt;= 15% thời gian hoặc kinh phí</span>
                      </div>
                      <span className="font-semibold text-foreground text-sm shrink-0 ml-3">Trọng số 20%</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <b className="text-foreground">Mục tiêu 4: Báo cáo &amp; Tuân thủ kỷ luật quy trình</b>
                        <span className="block text-xs text-muted-foreground mt-0.5">Đích: 100% báo cáo đúng hạn, không vi phạm nội quy</span>
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
                <button
                  type="button"
                  onClick={() => {
                    setIsGoalModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  Giao Mục Tiêu Ngay
                </button>
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

            {/* MẪU 4: PHIẾU ĐÁNH GIÁ PHÂN LOẠI CÁN BỘ THEO NGHỊ ĐỊNH 90 */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4 hover:border-border/80 transition-colors flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground border border-border">
                      <Medal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        Mẫu 04 • Quy Chuẩn Nhà Nước
                      </div>
                      <h4 className="font-bold text-foreground text-base mt-0.5">
                        Phiếu Đánh Giá &amp; Xếp Loại Cán Bộ (Nghị định 90/2020/NĐ-CP)
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Áp dụng cho khối Cơ quan Nhà nước, Đơn vị sự nghiệp công lập và Doanh nghiệp Nhà nước theo Nghị định 90/2020/NĐ-CP và Hướng dẫn 89-HD/BTCTW của Ban Tổ chức Trung ương.
                </p>

                {/* Bảng xem trước 4 tiêu chuẩn chính */}
                <div className="border border-border/70 rounded-lg overflow-hidden text-sm">
                  <div className="bg-muted/40 px-3.5 py-2.5 font-semibold text-foreground border-b border-border/70 flex justify-between items-center text-xs">
                    <span>4 Tiêu chuẩn chung &amp; Kết quả chức trách</span>
                    <span className="text-muted-foreground">Quy định NĐ 90/2020</span>
                  </div>
                  <div className="divide-y divide-border/50 bg-card p-3.5 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">1. Chính trị tư tưởng:</span>
                      <span className="text-xs text-muted-foreground">Chấp hành đường lối, chủ trương Đảng &amp; Nhà nước</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">2. Đạo đức, lối sống:</span>
                      <span className="text-xs text-muted-foreground">Giữ gìn phẩm chất, không tham nhũng, lãng phí</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">3. Tác phong lề lối làm việc:</span>
                      <span className="text-xs text-muted-foreground">Tinh thần trách nhiệm, thái độ phục vụ nhân dân</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">4. Ý thức tổ chức kỷ luật:</span>
                      <span className="text-xs text-muted-foreground">Chấp hành phân công, quy chế văn hóa công sở</span>
                    </div>
                    <div className="pt-1.5 border-t border-border/70 text-foreground font-semibold text-xs">
                      ★ Định mức phân bổ: Hoàn thành Xuất sắc (≤ 20%) • Tốt • Hoàn thành • Không hoàn thành
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateForPrint('nd90')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  Xem và In Mẫu NĐ 90 A4
                </button>
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors shadow-2xs"
                >
                  <Medal className="w-4 h-4 text-muted-foreground" />
                  Đồng Bộ Vào Hồ Sơ (QT ĐGCB)
                </button>
              </div>
            </div>
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
                  Quy định khung đánh giá hiệu suất nhân sự, công thức trọng số đa chiều và ma trận liên kết trực tiếp sang Bảng tính lương tự động.
                </p>
              </div>
            </div>
          </div>

          {/* QUY ƯỚC 1: XẾP LOẠI THI ĐUA & ĐỊNH MỨC PHÂN BỔ CHẤT LƯỢNG */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-foreground" />
                1. QUY ƯỚC XẾP LOẠI THI ĐUA &amp; ĐỊNH MỨC PHÂN BỔ CHẤT LƯỢNG
              </h4>
              <span className="text-xs text-muted-foreground font-medium">
                Căn cứ Nghị định 90/2020/NĐ-CP &amp; Tiêu chuẩn Quản trị Nhân sự
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Nhằm đảm bảo tính công bằng, thực chất và phản ánh đúng hiệu quả đóng góp (tránh xu hướng cào bằng), hệ thống áp dụng hạn mức phân bổ tối đa cho mức Hoàn thành xuất sắc nhiệm vụ là <b className="text-foreground">không quá 20%</b> tổng số cán bộ nhân viên trong đơn vị theo quy chuẩn quản trị.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-border/80 rounded-lg overflow-hidden">
                <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4">Xếp Loại Thi Đua</th>
                    <th className="py-3 px-4">Thang Điểm Tổng Hợp</th>
                    <th className="py-3 px-4 text-center">Hạn Mức Phân Bổ Tối Đa</th>
                    <th className="py-3 px-4 text-center">Hệ Số Thưởng Hiệu Suất</th>
                    <th className="py-3 px-4">Quyền Lợi &amp; Biện Pháp Quản Trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <span className="font-bold text-foreground mr-1.5">Loại A:</span>
                      Hoàn thành xuất sắc nhiệm vụ
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">90 - 100 điểm</td>
                    <td className="py-3 px-4 text-center font-medium text-muted-foreground">≤ 20% tổng số nhân sự</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">
                      1.15 (+15%)
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      Ưu tiên xét nâng lương trước thời hạn, quy hoạch bổ nhiệm cán bộ nguồn, vinh danh cấp toàn đơn vị.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <span className="font-bold text-foreground mr-1.5">Loại B:</span>
                      Hoàn thành tốt nhiệm vụ
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">75 - 89 điểm</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">Phân bổ tự nhiên (khoảng 60 - 75%)</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">
                      1.10 (+10%)
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      Đạt chuẩn nâng bậc lương thường xuyên định kỳ, hưởng đầy đủ thưởng hiệu suất và phúc lợi năm.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <span className="font-bold text-foreground mr-1.5">Loại C:</span>
                      Hoàn thành nhiệm vụ
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">50 - 74 điểm</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">Hạn mức khuyến nghị ≤ 15%</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">
                      1.05 (+5%)
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      Giữ nguyên bậc lương, yêu cầu tham gia khóa đào tạo bồi dưỡng nâng cao năng lực chuyên môn.
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">
                      <span className="font-bold text-foreground mr-1.5">Loại D:</span>
                      Không hoàn thành nhiệm vụ
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">&lt; 50 điểm (hoặc vi phạm kỷ luật)</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">Phát sinh theo thực tế đánh giá</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">
                      1.00 (0%)
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      Không xét thưởng hiệu suất. Đưa vào diện Kế hoạch cải thiện hiệu suất 90 ngày (PIP).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* QUY ƯỚC 2: MA TRẬN TRỌNG SỐ TÍNH ĐIỂM TỔNG HỢP CHU KỲ */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-foreground" />
                2. CÔNG THỨC TRỌNG SỐ TÍNH ĐIỂM HIỆU SUẤT TỔNG HỢP
              </h4>
              <span className="text-xs text-muted-foreground font-medium">Mô hình 60 - 20 - 20</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <span className="text-sm font-bold text-foreground block">
                  1. Mục Tiêu Định Lượng (60%)
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Điểm trung bình có trọng số của các chỉ tiêu định lượng (Doanh số, Dự án, Chất lượng dịch vụ) do Quản lý trực tiếp chấm.
                </p>
                <div className="font-semibold text-foreground text-sm pt-2 border-t border-border/50">
                  Đóng góp: Điểm mục tiêu × 0.60
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <span className="text-sm font-bold text-foreground block">
                  2. Năng Lực Hành Vi Cốt Lõi (20%)
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Đánh giá 5 năng lực cốt lõi theo thang 1 - 5 sao. Quy đổi thang 100: (Tổng điểm 5 năng lực / 25) × 100.
                </p>
                <div className="font-semibold text-foreground text-sm pt-2 border-t border-border/50">
                  Đóng góp: Điểm năng lực × 0.20
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <span className="text-sm font-bold text-foreground block">
                  3. Đánh Giá Đa Chiều 360° (20%)
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Điểm bình quân thu thập từ Quản lý, Đồng nghiệp ngang cấp và Cấp dưới. Quy đổi thang 100: Điểm sao TB × 20.
                </p>
                <div className="font-semibold text-foreground text-sm pt-2 border-t border-border/50">
                  Đóng góp: Điểm đa chiều × 0.20
                </div>
              </div>
            </div>

            {/* Khung công thức toán học và ví dụ minh họa */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/80 space-y-3">
              <div className="text-foreground font-bold text-base">
                Công thức tổng hợp: Điểm Tổng = (Điểm Mục Tiêu × 60%) + (Điểm Năng Lực × 20%) + (Điểm Đa Chiều × 20%)
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2 pt-2 border-t border-border/60">
                <p className="font-semibold text-foreground">Ví dụ minh họa chi tiết:</p>
                <p>
                  Nhân sự Nguyễn Văn A có Điểm Mục Tiêu KRA đạt <b className="text-foreground">92/100</b>; Điểm Năng Lực Cốt Lõi đạt 22/25 sao (quy đổi tương đương <b className="text-foreground">88/100</b>); Điểm Phản Hồi Đa Chiều 360° đạt 4.6/5.0 sao (quy đổi tương đương <b className="text-foreground">92/100</b>).
                </p>
                <div className="font-medium text-foreground text-sm bg-card p-3 rounded-md border border-border/70">
                  ➔ Điểm Tổng Hợp = (92 × 0.60) + (88 × 0.20) + (92 × 0.20) = 55.2 + 17.6 + 18.4 = <b className="text-base text-foreground font-bold">91.2 điểm</b>.
                </div>
                <p>
                  ➔ Kết luận xếp loại: <b className="text-foreground font-semibold">Loại A (Hoàn thành xuất sắc nhiệm vụ)</b> • Chế độ thụ hưởng: Hệ số thưởng hiệu suất <b className="text-foreground font-semibold">+15%</b> lương vị trí.
                </p>
              </div>
            </div>
          </div>

          {/* QUY ƯỚC 3: MA TRẬN LIÊN KẾT ĐIỂM SANG CÁCH TÍNH LƯƠNG & THƯỞNG */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h4 className="font-bold text-foreground text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-foreground" />
                3. MA TRẬN LIÊN KẾT ĐIỂM HIỆU SUẤT SANG CÁCH TÍNH LƯƠNG &amp; THƯỞNG
              </h4>
              <span className="text-xs text-muted-foreground font-medium">
                Đồng bộ tự động sang Bảng tính lương
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Điểm đánh giá hiệu suất chu kỳ không chỉ là thước đo xếp loại thi đua mà được tự động kết xuất sang phân hệ <b className="text-foreground">Bảng Lương</b> để làm căn cứ tính khoản <b className="text-foreground">&ldquo;Thưởng hiệu suất&rdquo;</b> trong tổng thu nhập của cán bộ nhân viên.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-border/80 rounded-lg overflow-hidden">
                <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4">Xếp Loại Hiệu Suất</th>
                    <th className="py-3 px-4 text-center">Hệ Số Thưởng</th>
                    <th className="py-3 px-4">Công Thức Tính Tiền Thưởng Hiệu Suất</th>
                    <th className="py-3 px-4">Ví Dụ Mẫu (Lương Vị Trí 20 Triệu)</th>
                    <th className="py-3 px-4">Xử Lý Trên Phiếu Lương</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">Loại A (Xuất sắc)</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">1.15 (+15%)</td>
                    <td className="py-3 px-4 text-foreground">Lương vị trí × 15%</td>
                    <td className="py-3 px-4 font-medium text-foreground">+3.000.000 đ</td>
                    <td className="py-3 px-4 text-muted-foreground">Cộng vào Tổng thu nhập, chịu thuế TNCN</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">Loại B (Tốt)</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">1.10 (+10%)</td>
                    <td className="py-3 px-4 text-foreground">Lương vị trí × 10%</td>
                    <td className="py-3 px-4 font-medium text-foreground">+2.000.000 đ</td>
                    <td className="py-3 px-4 text-muted-foreground">Cộng vào Tổng thu nhập, chịu thuế TNCN</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">Loại C (Hoàn thành)</td>
                    <td className="py-3 px-4 text-center font-bold text-foreground">1.05 (+5%)</td>
                    <td className="py-3 px-4 text-foreground">Lương vị trí × 5%</td>
                    <td className="py-3 px-4 font-medium text-foreground">+1.000.000 đ</td>
                    <td className="py-3 px-4 text-muted-foreground">Cộng vào Tổng thu nhập, chịu thuế TNCN</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">Loại D (Không đạt)</td>
                    <td className="py-3 px-4 text-center font-bold text-muted-foreground">1.00 (0%)</td>
                    <td className="py-3 px-4 text-muted-foreground">0 đ</td>
                    <td className="py-3 px-4 font-medium text-muted-foreground">0 đ</td>
                    <td className="py-3 px-4 text-muted-foreground">Không có khoản thưởng hiệu suất trong kỳ</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                <h5 className="font-bold text-foreground text-sm">Tự Chấm &amp; Đánh Giá 360°</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nhân viên tự chấm điểm KRA, đồng nghiệp và cấp dưới gửi phiếu phản hồi 360 độ bí mật kèm nhận xét định tính.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1.5 relative">
                <span className="text-xs uppercase font-bold text-primary block">Giai đoạn 4 • Kết luận</span>
                <h5 className="font-bold text-foreground text-sm">Bình Xét, Phê Duyệt &amp; Trả Thưởng</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hội đồng họp xét, áp dụng hạn mức xuất sắc ≤ 20%, ra quyết định xếp loại, tự động liên kết Bảng lương và Hồ sơ cán bộ.
                </p>
              </div>
            </div>
          </div>
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
              <Button size="sm" variant="outline" onClick={() => setIsSyncModalOpen(true)}>
                <Medal className="w-4 h-4 mr-1.5 text-amber-500" />
                Đồng Bộ Kết Quả Vào Hồ Sơ Cán Bộ (QT ĐGCB)
              </Button>
              <Button size="sm" onClick={() => setIsCycleModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo chu kỳ mới
              </Button>
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
                  <div>Phản hồi 360: <b className="text-foreground font-bold">{c._count?.reviews ?? 0}</b></div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newStatus = c.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
                        toggleCycleStatusMutation.mutate({ id: c.id, newStatus });
                      }}
                      className="font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {c.status === 'ACTIVE' ? 'Đóng chu kỳ' : 'Kích hoạt lại'}
                    </button>
                  </div>

                  <button
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
                  </button>
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

              {/* Thanh gợi ý chọn từ thư viện KPI mẫu */}
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
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
              </div>

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
                    <label className="font-medium text-foreground block mb-1">Trọng số đề xuất (%):</label>
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
                  Chấm Điểm &amp; Dự Báo Thưởng KPI
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-foreground block mb-1">Điểm nhân sự tự chấm (Thang 100):</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={selfScore}
                      onChange={(e) => setSelfScore(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="font-medium text-foreground block mb-1">Điểm cấp quản lý đánh giá (Thang 100):</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={managerScore}
                      onChange={(e) => setManagerScore(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* DỰ BÁO XẾP LOẠI & THƯỞNG HIỆU SUẤT THEO QUY ƯỚC */}
                {(() => {
                  const weightedPoints = ((managerScore * selectedGoal.weightage) / 100).toFixed(1);
                  let classification = 'Loại B — Hoàn thành tốt';
                  let bonusFactor = '+10%';

                  if (managerScore >= 90) {
                    classification = 'Loại A — Hoàn thành xuất sắc';
                    bonusFactor = '+15%';
                  } else if (managerScore >= 75) {
                    classification = 'Loại B — Hoàn thành tốt';
                    bonusFactor = '+10%';
                  } else if (managerScore >= 50) {
                    classification = 'Loại C — Hoàn thành nhiệm vụ';
                    bonusFactor = '+5%';
                  } else {
                    classification = 'Loại D — Không hoàn thành';
                    bonusFactor = '0% (Cần cải thiện)';
                  }

                  return (
                    <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Điểm quy đổi trọng số:</span>
                        <span className="text-foreground">
                          {managerScore} × {selectedGoal.weightage}% = <strong className="font-semibold text-foreground">{weightedPoints} điểm</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                        <span className="text-muted-foreground font-medium">Xếp loại dự kiến:</span>
                        <span className="font-semibold text-foreground">
                          {classification}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                        <span className="text-muted-foreground font-medium">Điều chỉnh lương hiệu quả:</span>
                        <span className="text-foreground">
                          Hệ số: <strong className="font-semibold text-foreground">{bonusFactor}</strong> lương vị trí
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsScoreModalOpen(false)}>Hủy</Button>
                <Button size="sm" onClick={() => scoreGoalMutation.mutate()} disabled={scoreGoalMutation.isPending}>
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
                      <option value="SELF">Tự đánh giá</option>
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

                  <div>
                    <label className="font-medium text-foreground block mb-1">Xếp loại chất lượng:</label>
                    <Select
                      value={syncForm.classification}
                      onChange={(e: any) => setSyncForm({ ...syncForm, classification: e.target.value })}
                      className="w-full text-xs font-semibold"
                    >
                      <option value="EXCELLENT">Hoàn thành xuất sắc</option>
                      <option value="GOOD">Hoàn thành tốt</option>
                      <option value="SATISFACTORY">Hoàn thành nhiệm vụ</option>
                      <option value="UNSATISFACTORY">Không hoàn thành</option>
                    </Select>
                  </div>
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
                        <button
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
                            setIsGoalModalOpen(true);
                            toast(`Đã chọn mục tiêu: "${item.kraTitle.slice(0, 35)}..."`, 'success');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Sử Dụng Mục Tiêu Này
                        </button>
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
                className="print-area font-times bg-card text-foreground p-6 rounded-lg border border-border/80 shadow-xs space-y-5 print:text-black print:p-0 print:border-0 print:m-0 print:shadow-none"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* 1. MẪU KRA TRỌNG SỐ */}
                {selectedTemplateForPrint === 'kra' && (
                  <div className="space-y-4">
                    <div className="border-b-2 border-foreground/30 pb-3 flex justify-between items-start">
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
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-border/70 text-sm bg-muted/10">
                      <div>Họ và tên nhân sự: <b className="text-foreground">................................................................</b></div>
                      <div>Mã số nhân viên: <b className="text-foreground">...................................</b></div>
                      <div>Chức vụ / Vị trí: <b className="text-foreground">................................................................</b></div>
                      <div>Phòng ban / Đơn vị: <b className="text-foreground">...................................</b></div>
                      <div>Người quản lý trực tiếp: <b className="text-foreground">............................................................</b></div>
                      <div>Kỳ đánh giá: <b className="text-foreground">Năm 2026 (Từ 01/01 đến 31/12/2026)</b></div>
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
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center">....... đ</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">2</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 2: Tiến độ bàn giao &amp; SLA Dịch vụ</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Hoàn thành Sprint/Dự án đúng hạn, đảm bảo chất lượng kỹ thuật</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">25%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">SLA Uptime &gt;= 99.9%, bàn giao đúng hạn &gt;= 95%</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center">....... đ</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">3</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 3: Cải tiến kỹ thuật &amp; Tối ưu chi phí</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Sáng kiến tối ưu hóa, tự động hóa quy trình, tiết kiệm tài nguyên</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">20%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Tiết kiệm &gt;= 15% thời gian xử lý hoặc ngân sách</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center">....... đ</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">4</td>
                          <td className="p-2.5 border-r border-border/60">
                            <b>KRA 4: Báo cáo &amp; Tuân thủ kỷ luật quy trình</b>
                            <span className="block text-xs text-muted-foreground mt-0.5">Báo cáo định kỳ đầy đủ, tuân thủ quy chế nội quy cơ quan</span>
                          </td>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">20%</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">100% báo cáo đúng hạn, 0 sai phạm quy chế</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center border-r border-border/60">... / 100</td>
                          <td className="p-2.5 text-center">....... đ</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-muted/30 font-bold border-t border-border/80">
                        <tr>
                          <td colSpan={2} className="p-2.5 text-right">TỔNG CỘNG TRỌNG SỐ:</td>
                          <td className="p-2.5 text-center">100%</td>
                          <td colSpan={3} className="p-2.5 text-right">ĐIỂM KRA TỔNG HỢP:</td>
                          <td className="p-2.5 text-center text-primary">....... / 100</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Nhận xét & Đánh giá */}
                    <div className="space-y-2 border border-border/70 p-3 rounded-lg text-sm">
                      <div><b>Ý kiến tự nhận xét của nhân sự:</b> ....................................................................................................................................................</div>
                      <div><b>Nhận xét &amp; Đề xuất của Quản lý trực tiếp:</b> ............................................................................................................................................</div>
                      <div><b>Xếp loại dự kiến:</b> [  ] Loại A (Xuất sắc)    [  ] Loại B (Tốt)    [  ] Loại C (Hoàn thành)    [  ] Loại D (Không đạt)</div>
                      <div><b>Hệ số thưởng KPI Bảng lương liên kết:</b> [  ] +15%    [  ] +10%    [  ] +5%    [  ] 0%</div>
                    </div>

                    {/* 3 Khung chữ ký */}
                    <div className="grid grid-cols-3 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">NGƯỜI LAO ĐỘNG</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase">QUẢN LÝ TRỰC TIẾP</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase">LÃNH ĐẠO ĐƠN VỊ DUYỆT</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, đóng dấu)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MẪU NĂNG LỰC HÀNH VI BARS */}
                {selectedTemplateForPrint === 'bars' && (
                  <div className="space-y-4">
                    <div className="border-b-2 border-foreground/30 pb-3 flex justify-between items-start">
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
                          <td className="p-2.5 text-center font-bold">....... / 5★</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">2</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Tư duy giải quyết vấn đề &amp; Sáng tạo</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Xử lý tốt sự cố thông thường, phân tích nguyên nhân gốc rễ rõ ràng</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Đột phá, biến khủng hoảng thành cơ hội cải tiến quy trình vượt trội</td>
                          <td className="p-2.5 text-center font-bold">....... / 5★</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">3</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Giao tiếp &amp; Phối hợp đội ngũ</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Giao tiếp mạch lạc, tôn trọng ý kiến đồng nghiệp, hợp tác nội bộ tốt</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Truyền cảm hứng, hóa giải mâu thuẫn, xây dựng văn hóa gắn kết tập thể</td>
                          <td className="p-2.5 text-center font-bold">....... / 5★</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">4</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Chuyên môn &amp; Tốc độ thực thi</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Làm chủ công việc chuyên trách, năng suất ổn định, ít sai sót nghiệp vụ</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Chuyên gia đầu ngành, tốc độ xử lý nhanh, đào tạo và dẫn dắt đội ngũ</td>
                          <td className="p-2.5 text-center font-bold">....... / 5★</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-center font-bold border-r border-border/60">5</td>
                          <td className="p-2.5 font-semibold border-r border-border/60">Tính chủ động &amp; Năng lực dẫn dắt</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Tự giác trong công việc, sẵn sàng nhận nhiệm vụ mới khi được phân công</td>
                          <td className="p-2.5 border-r border-border/60 text-sm">Đề xuất sáng kiến chiến lược, hướng dẫn và kèm cặp nhân viên mới tận tình</td>
                          <td className="p-2.5 text-center font-bold">....... / 5★</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-muted/30 font-bold border-t border-border/80">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-right">TỔNG ĐIỂM BARS (QUY ĐỔI THANG 100):</td>
                          <td className="p-2.5 text-center text-purple-700 dark:text-purple-400 font-bold">....... / 100</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* 3 Khung chữ ký */}
                    <div className="grid grid-cols-3 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">CÁN BỘ ĐƯỢC ĐÁNH GIÁ</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase">HỘI ĐỒNG ĐÁNH GIÁ NĂNG LỰC</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase">GIÁM ĐỐC NHÂN SỰ</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, đóng dấu)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MẪU KHẢO SÁT 360 ĐỘ */}
                {selectedTemplateForPrint === 'survey360' && (
                  <div className="space-y-4">
                    <div className="border-b-2 border-foreground/30 pb-3 flex justify-between items-start">
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
                            <td className="p-2.5 text-center font-medium">....... / 5★</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">2</td>
                            <td className="p-2.5 border-r border-border/60">Thái độ hợp tác tích cực, tôn trọng ý kiến khác biệt và lắng nghe phản hồi của người khác.</td>
                            <td className="p-2.5 text-center font-medium">....... / 5★</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">3</td>
                            <td className="p-2.5 border-r border-border/60">Tốc độ phản hồi nhanh, sẵn sàng tương trợ đồng nghiệp trong các tình huống khẩn cấp, quá tải.</td>
                            <td className="p-2.5 text-center font-medium">....... / 5★</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">4</td>
                            <td className="p-2.5 border-r border-border/60">Sự trung thực, minh bạch, liêm chính và luôn đặt lợi ích chung của đơn vị lên trên lợi ích riêng.</td>
                            <td className="p-2.5 text-center font-medium">....... / 5★</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">5</td>
                            <td className="p-2.5 border-r border-border/60">Khả năng thích ứng linh hoạt trước sự thay đổi về công nghệ, quy trình hoặc định hướng của đơn vị.</td>
                            <td className="p-2.5 text-center font-medium">....... / 5★</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 text-center font-bold border-r border-border/60">6</td>
                            <td className="p-2.5 border-r border-border/60">Tinh thần chủ động đóng góp sáng kiến, tích cực tham gia các phong trào, hoạt động của cơ quan.</td>
                            <td className="p-2.5 text-center font-medium">....... / 5★</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-muted/30 font-bold border-t border-border/80">
                          <tr>
                            <td colSpan={2} className="p-2.5 text-right">ĐIỂM ĐÁNH GIÁ 360 ĐỘ BÌNH QUÂN:</td>
                            <td className="p-2.5 text-center text-emerald-700 dark:text-emerald-400 font-bold">....... / 5.0★</td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Nhận xét mở */}
                      <div className="p-3.5 border border-border/70 rounded-lg space-y-2.5 text-sm">
                        <div><b>1. Ba điểm mạnh nổi bật nhất của nhân sự:</b> ....................................................................................................................................</div>
                        <div><b>2. Hai điểm cần nỗ lực cải thiện trong chu kỳ tới:</b> .................................................................................................................................</div>
                        <div><b>3. Đề xuất kế hoạch đào tạo &amp; phát triển cá nhân (IDP):</b> ...................................................................................................................</div>
                      </div>
                    </div>

                    {/* Khung chữ ký */}
                    <div className="grid grid-cols-2 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">NGƯỜI LẬP PHIẾU PHẢN HỒI</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên - Thông tin được bảo mật)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase">BỘ PHẬN NHÂN SỰ XÁC NHẬN</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MẪU NGHỊ ĐỊNH 90/2020 */}
                {selectedTemplateForPrint === 'nd90' && (
                  <div className="space-y-4">
                    <div className="text-center space-y-1 border-b pb-3">
                      <p className="font-bold text-sm uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="font-bold text-sm underline">Độc lập - Tự do - Hạnh phúc</p>
                      <p className="text-xs italic text-muted-foreground pt-1">Hà Nội, ngày ...... tháng ...... năm 2026</p>
                    </div>

                    <div className="text-center space-y-1">
                      <h2 className="font-bold text-lg uppercase text-foreground">
                        PHIẾU ĐÁNH GIÁ, XẾP LOẠI CHẤT LƯỢNG CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC
                      </h2>
                      <p className="text-xs text-muted-foreground italic">
                        (Ban hành kèm theo Nghị định số 90/2020/NĐ-CP ngày 13 tháng 8 năm 2020 của Chính phủ)
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>Họ và tên: <b className="text-foreground">................................................................................</b> Chức vụ, chức danh: <b className="text-foreground">................................................................</b></div>
                      <div>Cơ quan, tổ chức, đơn vị công tác: <b className="text-foreground">........................................................................................................................................</b></div>
                    </div>

                    {/* Phần I: Tự đánh giá */}
                    <div className="space-y-2.5 text-sm border border-border/70 p-3.5 rounded-lg">
                      <p className="font-bold uppercase text-foreground">I. KẾT QUẢ TỰ ĐÁNH GIÁ CỦA CÁN BỘ, CÔNG CHỨC, VIÊN CHỨC</p>
                      <p><b>1. Chính trị tư tưởng:</b> Chấp hành nghiêm chỉnh chủ trương, đường lối của Đảng, chính sách, pháp luật của Nhà nước .........................</p>
                      <p><b>2. Đạo đức, lối sống:</b> Giữ gìn phẩm chất đạo đức, không tham nhũng, lãng phí, có lối sống lành mạnh, trung thực ..................................</p>
                      <p><b>3. Tác phong, lề lối làm việc:</b> Tinh thần trách nhiệm, thái độ phục vụ tận tụy, tôn trọng nhân dân và đồng nghiệp .................................</p>
                      <p><b>4. Ý thức tổ chức kỷ luật:</b> Chấp hành sự phân công của tổ chức, thực hiện nghiêm quy chế văn hóa công sở .........................................</p>
                      <p><b>5. Kết quả thực hiện chức trách, nhiệm vụ:</b> Đạt tiến độ 100%, đảm bảo chất lượng, hiệu quả công tác năm .........................................</p>
                      <p className="pt-1 font-medium"><b>Tự nhận mức xếp loại chất lượng:</b> [  ] Xuất sắc (≤ 20%)    [  ] Tốt    [  ] Hoàn thành    [  ] Không hoàn thành</p>
                    </div>

                    {/* Phần II: Ý kiến nhận xét */}
                    <div className="space-y-2.5 text-sm border border-border/70 p-3.5 rounded-lg">
                      <p className="font-bold uppercase text-foreground">II. Ý KIẾN NHẬN XÉT CỦA TẬP THỂ VÀ CẤP ỦY NƠI CÔNG TÁC</p>
                      <p>Ý kiến nhận xét của Cấp ủy đơn vị: ................................................................................................................................................................</p>
                      <p>Ý kiến của tập thể lãnh đạo cơ quan, đơn vị: ................................................................................................................................................</p>
                    </div>

                    {/* Phần III: Kết luận */}
                    <div className="space-y-2.5 text-sm border border-border/70 p-3.5 rounded-lg bg-muted/10">
                      <p className="font-bold uppercase text-foreground">III. KẾT LUẬN VÀ QUYẾT ĐỊNH XẾP LOẠI CỦA CẤP CÓ THẨM QUYỀN</p>
                      <p>Người đứng đầu cơ quan, đơn vị quyết định xếp loại chất lượng cán bộ, công chức, viên chức năm 2026 ở mức:</p>
                      <p className="font-bold text-foreground">
                        [  ] Hoàn thành xuất sắc nhiệm vụ (≤ 20%) &nbsp;&nbsp;&nbsp;&nbsp; [  ] Hoàn thành tốt nhiệm vụ &nbsp;&nbsp;&nbsp;&nbsp; [  ] Hoàn thành nhiệm vụ &nbsp;&nbsp;&nbsp;&nbsp; [  ] Không hoàn thành nhiệm vụ
                      </p>
                    </div>

                    {/* 2 Khung chữ ký */}
                    <div className="grid grid-cols-2 gap-4 pt-6 text-center text-sm">
                      <div>
                        <p className="font-bold uppercase">CÁ NHÂN TỰ ĐÁNH GIÁ</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
                      </div>
                      <div>
                        <p className="font-bold uppercase">THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ</p>
                        <p className="text-xs italic text-muted-foreground">(Ký, ghi rõ họ tên và đóng dấu)</p>
                        <div className="h-14" />
                        <p className="font-medium">....................................................</p>
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
