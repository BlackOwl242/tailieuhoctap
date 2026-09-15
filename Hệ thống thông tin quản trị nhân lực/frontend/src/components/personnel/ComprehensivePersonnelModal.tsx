'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Check, Save, User, Briefcase, GraduationCap, ShieldCheck, HeartHandshake,
  Clock, Plus, Trash2, Award, Building, ChevronRight, FileText, Printer, Eye,
  SlidersHorizontal, CheckCircle2, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Badge, Card, Input, Select } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toaster';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  onSuccess?: (savedUserId: string) => void;
}

export function ComprehensivePersonnelModal({ isOpen, onClose, userId, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Chế độ: 'STATE' (Cơ quan Nhà nước - Chuẩn 2C/HUHA) hoặc 'ENTERPRISE' (Doanh nghiệp tư nhân)
  const [profileMode, setProfileMode] = useState<'STATE' | 'ENTERPRISE'>('STATE');
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'p3' | 'history'>('p1');
  const [subTab, setSubTab] = useState<'work' | 'edu' | 'salary' | 'family' | 'reward' | 'appraisal' | 'appointment'>('work');

  // Form State
  const [form, setForm] = useState<any>({
    // Thông tin tài khoản & cơ bản
    fullName: '',
    email: '',
    phone: '',
    password: 'Password@123',
    employeeCode: '',
    orgUnitId: '',
    jobTitle: '',
    employmentStatus: 'ACTIVE',
    baseSalary: 15000000,
    hireDate: new Date().toISOString().slice(0, 10),

    // TRANG 1: Định danh, Nơi sinh, Tuyển dụng, Ngạch bậc
    aliasName: '',
    gender: 'Nam',
    birthDate: '',
    idCardNo: '',
    idCardIssueDate: '',
    idCardIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
    birthPlace: '',
    hometown: '',
    permanentAddress: '',
    currentAddress: '',
    ethnicity: 'Kinh',
    religion: 'Không',
    familyOrigin: 'Cán bộ',
    maritalStatus: 'Đã kết hôn',
    workPhone: '',
    homePhone: '',
    delegateRole: '', // Đại biểu Quốc hội, HĐND...

    recruitDate: '',
    recruitOrg: '',
    currentOrgDate: '',
    officialDate: '',
    recruitType: 'Thi tuyển',
    priorJob: '',
    mainDuty: '',
    govPosition: '',

    rankCode: '01.003',
    salaryStep: 1,
    salaryCoefficient: 2.34,
    salaryStepDate: '',
    overGradePercent: 0,
    positionAllowance: 0,
    otherAllowance: 0,

    // TRANG 2: Phụ cấp, Đào tạo, Chính trị, Đoàn - Đảng, LLVT
    socialInsuranceNo: '',
    socialInsuranceDate: '',
    generalEducation: '12/12',
    highestDegree: 'Đại học',
    majorName: 'Quản trị / CNTT',
    academicTitle: 'Không',
    academicTitleDate: '',
    politicalTheory: 'Trung cấp',
    stateManagement: 'Chuyên viên',
    foreignLanguage: 'Tiếng Anh (Bậc 4 / B2)',
    informaticsLevel: 'Chuẩn CNTT cơ bản',
    ethnicLanguage: 'Không',

    unionJoinDate: '',
    partyJoinDate: '',
    partyOfficialDate: '',
    partyPosition: 'Đảng viên',
    partyJoinPlace: '',
    enlistmentDate: '',
    dischargeDate: '',
    militaryRank: 'Không',
    honorTitle: 'Không',

    // TRANG 3: Sức khỏe, Khen thưởng - Kỷ luật, Lịch sử chính trị
    healthStatus: 'Loại 1 (Tốt)',
    heightCm: 170,
    weightKg: 65,
    bloodType: 'O',
    woundedClass: 'Không',
    policyFamily: 'Không',
    strengths: 'Quản lý, phân tích dữ liệu, chuyển đổi số',
    longestJob: 'Chuyên viên nghiệp vụ',

    highestReward: 'Bằng khen cấp Bộ / Doanh nghiệp',
    highestRewardDate: '',
    highestDiscipline: 'Không',
    highestDisciplineDate: '',

    arrestRecord: 'Không',
    pastRegimeWork: 'Không',
    foreignRelations: 'Không',
    foreignRelatives: 'Không',
  });

  // Modal thêm dòng Quá trình con
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [subForm, setSubForm] = useState<any>({});

  // Nạp danh mục đơn vị & ngạch bậc
  const orgUnitsQ = useQuery({
    queryKey: ['org-units'],
    queryFn: async () => (await api.get<any[]>('/org-units')).data,
  });

  const ranksQ = useQuery({
    queryKey: ['personnel-ranks'],
    queryFn: async () => (await api.get<any[]>('/personnel-ranks')).data,
  });

  // Nạp dữ liệu nếu có userId
  const profileQ = useQuery({
    queryKey: ['personnel-profile-detail', userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await api.get(`/personnel-profiles/${userId}`);
      return res.data;
    },
    enabled: !!userId && isOpen,
  });

  useEffect(() => {
    if (profileQ.data) {
      const d = profileQ.data;
      setForm((prev: any) => ({
        ...prev,
        fullName: d.user?.fullName || '',
        email: d.user?.email || '',
        phone: d.user?.phone || '',
        employeeCode: d.user?.employeeCode || '',
        orgUnitId: d.user?.orgUnitId || '',
        jobTitle: d.user?.jobTitle || '',
        employmentStatus: d.user?.employmentStatus || 'ACTIVE',
        baseSalary: d.user?.baseSalary || 15000000,
        hireDate: d.user?.hireDate ? d.user.hireDate.slice(0, 10) : '',
        aliasName: d.aliasName || '',
        gender: d.gender || 'Nam',
        birthDate: d.birthDate ? d.birthDate.slice(0, 10) : '',
        idCardNo: d.idCardNo || '',
        idCardIssueDate: d.idCardIssueDate ? d.idCardIssueDate.slice(0, 10) : '',
        idCardIssuePlace: d.idCardIssuePlace || '',
        birthPlace: d.birthPlace || '',
        hometown: d.hometown || '',
        permanentAddress: d.permanentAddress || '',
        currentAddress: d.currentAddress || '',
        ethnicity: d.ethnicity || 'Kinh',
        religion: d.religion || 'Không',
        familyOrigin: d.familyOrigin || 'Cán bộ',
        govPosition: d.govPosition || '',
        mainDuty: d.mainDuty || '',
        rankCode: d.rankCode || '01.003',
        salaryStep: d.salaryStep || 1,
        salaryCoefficient: d.salaryCoefficient || 2.34,
        overGradePercent: d.overGradePercent || 0,
        generalEducation: d.generalEducation || '12/12',
        highestDegree: d.highestDegree || 'Đại học',
        majorName: d.majorName || '',
        academicTitle: d.academicTitle || '',
        politicalTheory: d.politicalTheory || '',
        stateManagement: d.stateManagement || '',
        foreignLanguage: d.foreignLanguage || '',
        informaticsLevel: d.informaticsLevel || '',
        unionJoinDate: d.unionJoinDate ? d.unionJoinDate.slice(0, 10) : '',
        partyJoinDate: d.partyJoinDate ? d.partyJoinDate.slice(0, 10) : '',
        partyOfficialDate: d.partyOfficialDate ? d.partyOfficialDate.slice(0, 10) : '',
        partyPosition: d.partyPosition || '',
        partyJoinPlace: d.partyJoinPlace || '',
        enlistmentDate: d.enlistmentDate ? d.enlistmentDate.slice(0, 10) : '',
        dischargeDate: d.dischargeDate ? d.dischargeDate.slice(0, 10) : '',
        militaryRank: d.militaryRank || '',
        healthStatus: d.healthStatus || 'Loại 1 (Tốt)',
        heightCm: d.heightCm || 170,
        weightKg: d.weightKg || 65,
        bloodType: d.bloodType || 'O',
        strengths: d.strengths || '',
        longestJob: d.longestJob || '',
      }));
    }
  }, [profileQ.data]);

  // Xử lý tự động khi chọn Ngạch lương
  const handleRankChange = (code: string) => {
    const r = ranksQ.data?.find((x: any) => x.code === code);
    if (r && Array.isArray(r.coefficients) && r.coefficients.length > 0) {
      setForm((prev: any) => ({
        ...prev,
        rankCode: code,
        salaryStep: 1,
        salaryCoefficient: r.coefficients[0],
      }));
    } else {
      setForm((prev: any) => ({ ...prev, rankCode: code }));
    }
  };

  const handleStepChange = (step: number) => {
    const r = ranksQ.data?.find((x: any) => x.code === form.rankCode);
    if (r && Array.isArray(r.coefficients) && r.coefficients[step - 1]) {
      setForm((prev: any) => ({
        ...prev,
        salaryStep: step,
        salaryCoefficient: r.coefficients[step - 1],
      }));
    } else {
      setForm((prev: any) => ({ ...prev, salaryStep: step }));
    }
  };

  // Mutation lưu hồ sơ chính
  const saveProfile = useMutation({
    mutationFn: async () => {
      let targetId = userId;
      // 1. Nếu chưa có userId, tạo mới User trước
      if (!targetId) {
        const userRes = await api.post('/users', {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          employeeCode: form.employeeCode || undefined,
          jobTitle: form.jobTitle || undefined,
          orgUnitId: form.orgUnitId || undefined,
          employmentStatus: form.employmentStatus,
          baseSalary: Number(form.baseSalary) || undefined,
          hireDate: form.hireDate ? new Date(form.hireDate).toISOString() : undefined,
          roleCodes: ['USER'],
        });
        targetId = userRes.data?.id;
      }

      if (!targetId) throw new Error('Không thể khởi tạo mã nhân sự');

      // 2. Cập nhật Comprehensive Profile 111 trường
      const profilePayload = {
        aliasName: form.aliasName,
        gender: form.gender,
        birthPlace: form.birthPlace,
        hometown: form.hometown,
        permanentAddress: form.permanentAddress,
        currentAddress: form.currentAddress,
        idCardNo: form.idCardNo,
        idCardIssueDate: form.idCardIssueDate ? new Date(form.idCardIssueDate).toISOString() : undefined,
        idCardIssuePlace: form.idCardIssuePlace,
        ethnicity: form.ethnicity,
        religion: form.religion,
        familyOrigin: form.familyOrigin,
        priorJob: form.priorJob,
        recruitDate: form.recruitDate ? new Date(form.recruitDate).toISOString() : undefined,
        recruitOrg: form.recruitOrg,
        currentOrgDate: form.currentOrgDate ? new Date(form.currentOrgDate).toISOString() : undefined,
        officialDate: form.officialDate ? new Date(form.officialDate).toISOString() : undefined,
        govPosition: form.govPosition,
        mainDuty: form.mainDuty,
        rankCode: form.rankCode,
        salaryStep: Number(form.salaryStep) || 1,
        salaryCoefficient: Number(form.salaryCoefficient) || 2.34,
        overGradePercent: Number(form.overGradePercent) || 0,
        positionAllowance: Number(form.positionAllowance) || 0,
        otherAllowance: Number(form.otherAllowance) || 0,
        socialInsuranceNo: form.socialInsuranceNo,
        generalEducation: form.generalEducation,
        highestDegree: form.highestDegree,
        majorName: form.majorName,
        academicTitle: form.academicTitle,
        politicalTheory: form.politicalTheory,
        stateManagement: form.stateManagement,
        foreignLanguage: form.foreignLanguage,
        informaticsLevel: form.informaticsLevel,
        ethnicLanguage: form.ethnicLanguage,
        unionJoinDate: form.unionJoinDate ? new Date(form.unionJoinDate).toISOString() : undefined,
        partyJoinDate: form.partyJoinDate ? new Date(form.partyJoinDate).toISOString() : undefined,
        partyOfficialDate: form.partyOfficialDate ? new Date(form.partyOfficialDate).toISOString() : undefined,
        partyPosition: form.partyPosition,
        partyJoinPlace: form.partyJoinPlace,
        enlistmentDate: form.enlistmentDate ? new Date(form.enlistmentDate).toISOString() : undefined,
        dischargeDate: form.dischargeDate ? new Date(form.dischargeDate).toISOString() : undefined,
        militaryRank: form.militaryRank,
        healthStatus: form.healthStatus,
        heightCm: Number(form.heightCm) || 170,
        weightKg: Number(form.weightKg) || 65,
        bloodType: form.bloodType,
        strengths: form.strengths,
        longestJob: form.longestJob,
      };

      await api.patch(`/personnel-profiles/${targetId}`, profilePayload);
      return targetId;
    },
    onSuccess: (savedId) => {
      toast('Đã lưu hồ sơ cán bộ toàn diện thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (onSuccess) onSuccess(savedId);
      onClose();
    },
    onError: (err) => {
      toast('Lỗi lưu hồ sơ: ' + errorMessage(err), 'error');
    },
  });

  // Thêm quá trình con (Sub-process)
  const addSubRecord = useMutation({
    mutationFn: async () => {
      const activeId = userId || profileQ.data?.userId;
      if (!activeId) {
        throw new Error('Vui lòng lưu thông tin cơ bản trước khi thêm các quá trình lịch sử');
      }

      if (subTab === 'work') {
        return api.post(`/personnel-profiles/${activeId}/work-histories`, {
          fromDate: new Date(subForm.fromDate || new Date()).toISOString(),
          toDate: subForm.toDate ? new Date(subForm.toDate).toISOString() : undefined,
          position: subForm.position || 'Chuyên viên',
          unitName: subForm.unitName || 'Cơ quan',
          departmentName: subForm.departmentName || '',
        });
      } else if (subTab === 'edu') {
        return api.post(`/personnel-profiles/${activeId}/educations`, {
          schoolName: subForm.schoolName || 'Đại học Quốc gia',
          majorName: subForm.majorName || 'Quản lý / CNTT',
          degreeName: subForm.degreeName || 'Cử nhân',
          studyForm: subForm.studyForm || 'Chính quy',
          graduationYear: Number(subForm.graduationYear) || 2020,
        });
      } else if (subTab === 'salary') {
        return api.post(`/personnel-profiles/${activeId}/salary-histories`, {
          rankCode: form.rankCode,
          step: Number(subForm.step) || 1,
          coefficient: Number(subForm.coefficient) || 2.34,
          fromDate: new Date(subForm.fromDate || new Date()).toISOString(),
          decisionNo: subForm.decisionNo || 'QĐ-NL/2026',
        });
      } else if (subTab === 'family') {
        return api.post(`/personnel-profiles/${activeId}/family-relations`, {
          category: subForm.category || 'SELF',
          relationType: subForm.relationType || 'Bố',
          fullName: subForm.fullName || 'Nguyễn Văn',
          birthYear: Number(subForm.birthYear) || 1965,
          details: subForm.details || '',
        });
      } else if (subTab === 'reward') {
        return api.post(`/personnel-profiles/${activeId}/rewards-disciplines`, {
          type: subForm.type || 'REWARD',
          title: subForm.title || 'Chiến sĩ thi đua cơ sở',
          eventDate: new Date(subForm.eventDate || new Date()).toISOString(),
          decisionNo: subForm.decisionNo || 'QĐ-KT',
        });
      } else if (subTab === 'appraisal') {
        return api.post(`/personnel-profiles/${activeId}/appraisals`, {
          year: Number(subForm.year) || 2025,
          classification: subForm.classification || 'EXCELLENT',
          comment: subForm.comment || 'Hoàn thành xuất sắc nhiệm vụ',
        });
      } else if (subTab === 'appointment') {
        return api.post(`/personnel-profiles/${activeId}/appointments`, {
          positionTitle: subForm.positionTitle || 'Trưởng phòng',
          orgUnitName: subForm.orgUnitName || 'Đơn vị',
          effectiveDate: new Date(subForm.effectiveDate || new Date()).toISOString(),
          isCurrent: true,
        });
      }
    },
    onSuccess: () => {
      toast('Đã thêm mục quá trình thành công!', 'success');
      setIsAddSubOpen(false);
      setSubForm({});
      queryClient.invalidateQueries({ queryKey: ['personnel-profile-detail', userId] });
    },
    onError: (err) => {
      toast('Lỗi: ' + errorMessage(err), 'error');
    },
  });

  const deleteSubRecord = async (endpoint: string, id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi quá trình này?')) return;
    try {
      await api.delete(`/personnel-profiles/${userId}/${endpoint}/${id}`);
      toast('Đã xóa bản ghi thành công', 'success');
      queryClient.invalidateQueries({ queryKey: ['personnel-profile-detail', userId] });
    } catch (err) {
      toast('Lỗi khi xóa: ' + errorMessage(err), 'error');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop phủ toàn màn hình */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose} />
      <div className="relative bg-card text-card-foreground w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        
        {/* ================= HEADER ================= */}
        <div className="px-6 py-4 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {userId ? 'Chỉnh sửa Hồ sơ Cán bộ Toàn diện' : 'Khai báo Hồ sơ Cán bộ Chuyên sâu'}
                </h2>
                <Badge variant={profileMode === 'STATE' ? 'default' : 'secondary'} className="text-[11px] font-medium">
                  {profileMode === 'STATE' ? '🏛️ Chuẩn 2C-BNV / NĐ 204' : '🏢 Doanh nghiệp Tư nhân'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hồ sơ lý lịch chuyên sâu chuẩn hóa (3 trang khai báo & 7 quá trình lịch sử)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Chuyển đổi Hoàn cảnh Nhà nước vs Doanh nghiệp */}
            <div className="flex items-center bg-background border border-border rounded-lg p-1 text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setProfileMode('STATE')}
                className={`px-3 py-1.5 rounded-md transition-all ${profileMode === 'STATE' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Cơ quan Nhà nước
              </button>
              <button
                type="button"
                onClick={() => setProfileMode('ENTERPRISE')}
                className={`px-3 py-1.5 rounded-md transition-all ${profileMode === 'ENTERPRISE' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Doanh nghiệp Tư nhân
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div className="px-6 border-b border-border bg-background flex items-center justify-between gap-2 overflow-x-auto text-xs font-medium scrollbar-none">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => setActiveTab('p1')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'p1' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <User className="w-4 h-4" />
              <span>Trang 1: Nhân thân & Tuyển dụng, Ngạch bậc</span>
            </button>

            <button
              onClick={() => setActiveTab('p2')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'p2' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Trang 2: Đào tạo, Đoàn - Đảng & Phụ cấp</span>
            </button>

            <button
              onClick={() => setActiveTab('p3')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'p3' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Trang 3: Sức khỏe, KTKL & Lịch sử chính trị</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-primary/10 text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Clock className="w-4 h-4" />
              <span>7 Bảng Quá trình Lịch sử</span>
            </button>
          </div>

          {userId && (
            <a
              href={`/personnel-reports?userId=${userId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>In Sơ yếu lý lịch (Mẫu 2C-BNV)</span>
            </a>
          )}
        </div>

        {/* ================= BODY SCROLL AREA ================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ==================== TRANG 1 ==================== */}
          {activeTab === 'p1' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Khối 1: Định danh & Tài khoản */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <User className="w-4 h-4 text-primary" /> Khối 1: Định danh cá nhân & Tài khoản làm việc
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Họ và tên khai sinh *</label>
                    <Input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Văn An"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Tên thường dùng / Bí danh</label>
                    <Input
                      value={form.aliasName}
                      onChange={(e) => setForm({ ...form, aliasName: e.target.value })}
                      placeholder="VD: Thanh Phong"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Giới tính</label>
                    <Select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="text-xs"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày sinh (dd/mm/yyyy)</label>
                    <Input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Số CCCD / CMND / Hộ chiếu *</label>
                    <Input
                      value={form.idCardNo}
                      onChange={(e) => setForm({ ...form, idCardNo: e.target.value })}
                      placeholder="12 chữ số CCCD"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày cấp CCCD</label>
                    <Input
                      type="date"
                      value={form.idCardIssueDate}
                      onChange={(e) => setForm({ ...form, idCardIssueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-semibold text-foreground">Nơi cấp</label>
                    <Input
                      value={form.idCardIssuePlace}
                      onChange={(e) => setForm({ ...form, idCardIssuePlace: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Email công vụ / liên hệ *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={!!userId}
                      placeholder="canbo@huha.local"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Điện thoại di động *</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0988..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Điện thoại cơ quan (ĐTCQ)</label>
                    <Input
                      value={form.workPhone}
                      onChange={(e) => setForm({ ...form, workPhone: e.target.value })}
                      placeholder="0243..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Điện thoại nhà riêng (ĐTNR)</label>
                    <Input
                      value={form.homePhone}
                      onChange={(e) => setForm({ ...form, homePhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Khối 2: Địa bàn hành chính & Dân tộc, Tôn giáo */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Building className="w-4 h-4 text-primary" /> Khối 2: Địa bàn hành chính & Đặc điểm nhân khẩu
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Nơi sinh (Xã/Phường, Huyện/Quận, Tỉnh/TP)</label>
                    <Input
                      value={form.birthPlace}
                      onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                      placeholder="Xã Liên Trung, Đan Phượng, Hà Nội"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Quê quán</label>
                    <Input
                      value={form.hometown}
                      onChange={(e) => setForm({ ...form, hometown: e.target.value })}
                      placeholder="Xã Liên Trung, Đan Phượng, Hà Nội"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Hộ khẩu thường trú</label>
                    <Input
                      value={form.permanentAddress}
                      onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                      placeholder="Số nhà, đường, thôn..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Chỗ ở hiện nay</label>
                    <Input
                      value={form.currentAddress}
                      onChange={(e) => setForm({ ...form, currentAddress: e.target.value })}
                      placeholder="Nơi đang cư trú..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Dân tộc</label>
                    <Input
                      value={form.ethnicity}
                      onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Tôn giáo</label>
                    <Input
                      value={form.religion}
                      onChange={(e) => setForm({ ...form, religion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Thành phần xuất thân</label>
                    <Input
                      value={form.familyOrigin}
                      onChange={(e) => setForm({ ...form, familyOrigin: e.target.value })}
                      placeholder="Cán bộ / Nông dân..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Tình trạng hôn nhân</label>
                    <Select
                      value={form.maritalStatus}
                      onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
                      className="text-xs"
                    >
                      <option value="Đã kết hôn">Đã kết hôn</option>
                      <option value="Độc thân">Độc thân</option>
                      <option value="Ly hôn">Ly hôn</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Khối 3: Tuyển dụng, Đơn vị & Chức danh */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-primary" /> Khối 3: Quá trình Tuyển dụng & Đơn vị công tác
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Đơn vị / Phòng ban công tác *</label>
                    <Select
                      value={form.orgUnitId}
                      onChange={(e) => setForm({ ...form, orgUnitId: e.target.value })}
                      className="text-xs"
                      required
                    >
                      <option value="">-- Chọn đơn vị trực thuộc --</option>
                      {orgUnitsQ.data?.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.code})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Chức danh / Vị trí chuyên môn *</label>
                    <Input
                      value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      placeholder="VD: Chuyên viên Phân tích nghiệp vụ"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Mã cán bộ / Mã NV</label>
                    <Input
                      value={form.employeeCode}
                      onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                      placeholder="CB-2026..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày bắt đầu công tác</label>
                    <Input
                      type="date"
                      value={form.hireDate}
                      onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày tuyển dụng chính thức</label>
                    <Input
                      type="date"
                      value={form.recruitDate}
                      onChange={(e) => setForm({ ...form, recruitDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Cơ quan tuyển dụng</label>
                    <Input
                      value={form.recruitOrg}
                      onChange={(e) => setForm({ ...form, recruitOrg: e.target.value })}
                      placeholder="UBND / Bộ / Tập đoàn"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Hình thức tuyển dụng</label>
                    <Select
                      value={form.recruitType}
                      onChange={(e) => setForm({ ...form, recruitType: e.target.value })}
                      className="text-xs"
                    >
                      <option value="Thi tuyển">Thi tuyển</option>
                      <option value="Xét tuyển">Xét tuyển</option>
                      <option value="Tiếp nhận từ nơi khác">Tiếp nhận từ nơi khác</option>
                      <option value="Phân công công tác">Phân công công tác</option>
                      <option value="Tuyển dụng trực tiếp">Tuyển dụng trực tiếp</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Khối 4: Ngạch - Bậc lương Nghị định 204 hoặc Thỏa thuận Doanh nghiệp */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" /> Khối 4: Ngạch bậc Lương & Chế độ Đãi ngộ
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {profileMode === 'STATE' ? 'Chuẩn Nghị định 204/2004/NĐ-CP' : 'Bảng lương thỏa thuận'}
                  </Badge>
                </div>

                {profileMode === 'STATE' ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-semibold text-foreground">Ngạch công chức / viên chức</label>
                      <Select
                        value={form.rankCode}
                        onChange={(e) => handleRankChange(e.target.value)}
                        className="text-xs font-semibold"
                      >
                        {ranksQ.data?.map((r: any) => (
                          <option key={r.code} value={r.code}>
                            {r.code} - {r.name} ({r.totalSteps} bậc)
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Bậc lương hiện nay</label>
                      <Select
                        value={String(form.salaryStep)}
                        onChange={(e) => handleStepChange(Number(e.target.value))}
                        className="text-xs font-semibold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                          <option key={s} value={s}>
                            Bậc {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Hệ số lương</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.salaryCoefficient}
                        onChange={(e) => setForm({ ...form, salaryCoefficient: Number(e.target.value) })}
                        className="font-bold text-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Mức lương cơ bản (VNĐ) *</label>
                      <Input
                        type="number"
                        value={form.baseSalary}
                        onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
                        className="font-bold text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Tỷ lệ hưởng lương thử việc (%)</label>
                      <Input
                        type="number"
                        defaultValue={85}
                        className="font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Hình thức trả lương</label>
                      <Select className="text-xs">
                        <option value="BANK">Chuyển khoản qua ngân hàng</option>
                        <option value="CASH">Tiền mặt</option>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TRANG 2 ==================== */}
          {activeTab === 'p2' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Khối 1: Phụ cấp & BHXH */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Award className="w-4 h-4 text-primary" /> Khối 1: Chế độ Phụ cấp & Bảo hiểm xã hội
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Phụ cấp thâm niên vượt khung (%)</label>
                    <Input
                      type="number"
                      value={form.overGradePercent}
                      onChange={(e) => setForm({ ...form, overGradePercent: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Hệ số phụ cấp chức vụ</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.positionAllowance}
                      onChange={(e) => setForm({ ...form, positionAllowance: Number(e.target.value) })}
                      placeholder="0.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Số sổ BHXH</label>
                    <Input
                      value={form.socialInsuranceNo}
                      onChange={(e) => setForm({ ...form, socialInsuranceNo: e.target.value })}
                      placeholder="10 chữ số BHXH"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Phụ cấp khác / Trách nhiệm</label>
                    <Input
                      type="number"
                      value={form.otherAllowance}
                      onChange={(e) => setForm({ ...form, otherAllowance: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Khối 2: Học vấn, Chuyên môn & Chức danh khoa học */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-primary" /> Khối 2: Trình độ Học vấn, Chuyên môn & Khoa học
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Giáo dục phổ thông</label>
                    <Input
                      value={form.generalEducation}
                      onChange={(e) => setForm({ ...form, generalEducation: e.target.value })}
                      placeholder="12/12"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Trình độ chuyên môn cao nhất</label>
                    <Select
                      value={form.highestDegree}
                      onChange={(e) => setForm({ ...form, highestDegree: e.target.value })}
                      className="text-xs"
                    >
                      <option value="Tiến sĩ">Tiến sĩ</option>
                      <option value="Thạc sĩ">Thạc sĩ</option>
                      <option value="Đại học">Đại học</option>
                      <option value="Cao đẳng">Cao đẳng</option>
                      <option value="Trung cấp">Trung cấp</option>
                      <option value="Sơ cấp">Sơ cấp</option>
                    </Select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-semibold text-foreground">Chuyên ngành đào tạo</label>
                    <Input
                      value={form.majorName}
                      onChange={(e) => setForm({ ...form, majorName: e.target.value })}
                      placeholder="VD: Khoa học máy tính / Quản trị kinh doanh"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Chức danh khoa học</label>
                    <Input
                      value={form.academicTitle}
                      onChange={(e) => setForm({ ...form, academicTitle: e.target.value })}
                      placeholder="Giáo sư / Phó Giáo sư"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Lý luận chính trị</label>
                    <Input
                      value={form.politicalTheory}
                      onChange={(e) => setForm({ ...form, politicalTheory: e.target.value })}
                      placeholder="Cử nhân / Cao cấp / Trung cấp"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Quản lý nhà nước</label>
                    <Input
                      value={form.stateManagement}
                      onChange={(e) => setForm({ ...form, stateManagement: e.target.value })}
                      placeholder="Chuyên viên cao cấp / chính"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Trình độ Ngoại ngữ</label>
                    <Input
                      value={form.foreignLanguage}
                      onChange={(e) => setForm({ ...form, foreignLanguage: e.target.value })}
                      placeholder="Tiếng Anh C1 / IELTS 7.5"
                    />
                  </div>
                </div>
              </div>

              {/* Khối 3: Tổ chức Chính trị & Lực lượng vũ trang */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Khối 3: Tổ chức Đoàn - Đảng & Lực lượng vũ trang
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày vào Đảng CSVN</label>
                    <Input
                      type="date"
                      value={form.partyJoinDate}
                      onChange={(e) => setForm({ ...form, partyJoinDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày chính thức</label>
                    <Input
                      type="date"
                      value={form.partyOfficialDate}
                      onChange={(e) => setForm({ ...form, partyOfficialDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Chức vụ trong Đảng</label>
                    <Input
                      value={form.partyPosition}
                      onChange={(e) => setForm({ ...form, partyPosition: e.target.value })}
                      placeholder="Bí thư / Đảng viên"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Nơi kết nạp Đảng</label>
                    <Input
                      value={form.partyJoinPlace}
                      onChange={(e) => setForm({ ...form, partyJoinPlace: e.target.value })}
                      placeholder="Chi bộ..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày tham gia Quân đội/LLVT</label>
                    <Input
                      type="date"
                      value={form.enlistmentDate}
                      onChange={(e) => setForm({ ...form, enlistmentDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ngày xuất ngũ</label>
                    <Input
                      type="date"
                      value={form.dischargeDate}
                      onChange={(e) => setForm({ ...form, dischargeDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Quân hàm cao nhất</label>
                    <Input
                      value={form.militaryRank}
                      onChange={(e) => setForm({ ...form, militaryRank: e.target.value })}
                      placeholder="Đại úy / Trung tá..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Danh hiệu phong tặng cao nhất</label>
                    <Input
                      value={form.honorTitle}
                      onChange={(e) => setForm({ ...form, honorTitle: e.target.value })}
                      placeholder="Anh hùng LĐ / TTND"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TRANG 3 ==================== */}
          {activeTab === 'p3' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              {/* Khối 1: Sức khỏe & Thể trạng */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <HeartHandshake className="w-4 h-4 text-primary" /> Khối 1: Tình trạng Sức khỏe & Thể trạng
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Phân loại sức khỏe</label>
                    <Input
                      value={form.healthStatus}
                      onChange={(e) => setForm({ ...form, healthStatus: e.target.value })}
                      placeholder="Loại 1 (Tốt)"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Chiều cao (cm)</label>
                    <Input
                      type="number"
                      value={form.heightCm}
                      onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Cân nặng (kg)</label>
                    <Input
                      type="number"
                      value={form.weightKg}
                      onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Nhóm máu</label>
                    <Select
                      value={form.bloodType}
                      onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                      className="text-xs"
                    >
                      <option value="O">Nhóm O</option>
                      <option value="A">Nhóm A</option>
                      <option value="B">Nhóm B</option>
                      <option value="AB">Nhóm AB</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Khối 2: Năng lực sở trường & Khen thưởng / Kỷ luật */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Award className="w-4 h-4 text-primary" /> Khối 2: Năng lực sở trường & Khen thưởng / Kỷ luật cao nhất
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Năng lực sở trường công tác</label>
                    <Input
                      value={form.strengths}
                      onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                      placeholder="Quản lý dự án, kiến trúc hệ thống, đàm phán..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Công việc làm lâu nhất</label>
                    <Input
                      value={form.longestJob}
                      onChange={(e) => setForm({ ...form, longestJob: e.target.value })}
                      placeholder="Chuyên viên kỹ thuật (6 năm)..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Hình thức Khen thưởng cao nhất</label>
                    <Input
                      value={form.highestReward}
                      onChange={(e) => setForm({ ...form, highestReward: e.target.value })}
                      placeholder="Bằng khen Thủ tướng Chính phủ / Bộ trưởng"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Hình thức Kỷ luật cao nhất</label>
                    <Input
                      value={form.highestDiscipline}
                      onChange={(e) => setForm({ ...form, highestDiscipline: e.target.value })}
                      placeholder="Không"
                    />
                  </div>
                </div>
              </div>

              {/* Khối 3: Đặc điểm Lịch sử chính trị & Mối quan hệ nước ngoài */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Khối 3: Lịch sử chính trị & Yếu tố Nước ngoài
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Quy định 58-QĐ/TW về Bảo vệ chính trị nội bộ
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">
                      1. Bị bắt, bị tù (thời gian, ở đâu, ai bắt, đã khai với ai những vấn đề gì):
                    </label>
                    <Input
                      value={form.arrestRecord}
                      onChange={(e) => setForm({ ...form, arrestRecord: e.target.value })}
                      placeholder="Ghi rõ hoặc ghi 'Không'"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">
                      2. Bản thân có làm việc trong chế độ cũ (cơ quan, chức danh, địa điểm, thời gian):
                    </label>
                    <Input
                      value={form.pastRegimeWork}
                      onChange={(e) => setForm({ ...form, pastRegimeWork: e.target.value })}
                      placeholder="Ghi rõ hoặc ghi 'Không'"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">
                      3. Tham gia hoặc quan hệ với các tổ chức kinh tế, chính trị, xã hội nước ngoài:
                    </label>
                    <Input
                      value={form.foreignRelations}
                      onChange={(e) => setForm({ ...form, foreignRelations: e.target.value })}
                      placeholder="Tên tổ chức, làm gì, ở đâu hoặc 'Không'"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">
                      4. Có thân nhân (Cha, mẹ, vợ, chồng, con, anh chị em ruột) ở nước ngoài:
                    </label>
                    <Input
                      value={form.foreignRelatives}
                      onChange={(e) => setForm({ ...form, foreignRelatives: e.target.value })}
                      placeholder="Quan hệ, quốc gia, nghề nghiệp hoặc 'Không'"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: 7 BẢNG QUÁ TRÌNH LỊCH SỬ ==================== */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    Hệ thống 7 Quá trình Lịch sử Công tác & Vòng đời Cán bộ
                  </span>
                </div>
                {userId && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSubForm({});
                      setIsAddSubOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm dòng quá trình
                  </Button>
                )}
              </div>

              {/* Sub-tab Pills */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setSubTab('work')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'work' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  1. QT Công tác ({profileQ.data?.workHistories?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('edu')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'edu' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  2. QT Đào tạo ({profileQ.data?.educations?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('salary')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'salary' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  3. QT Lương ({profileQ.data?.salaryHistories?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('family')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'family' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  4. QH Gia đình ({profileQ.data?.familyRelations?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('reward')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'reward' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  5. QT Khen thưởng / Kỷ luật ({profileQ.data?.rewardDisciplines?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('appraisal')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'appraisal' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  6. QT Đánh giá cán bộ ({profileQ.data?.appraisals?.length || 0})
                </button>
                <button
                  onClick={() => setSubTab('appointment')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${subTab === 'appointment' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  7. QT Bổ nhiệm ({profileQ.data?.appointments?.length || 0})
                </button>
              </div>

              {!userId ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs">
                  <Info className="w-8 h-8 mx-auto mb-2 text-primary opacity-60" />
                  Vui lòng bấm <strong>&quot;Lưu &amp; Khởi tạo Hồ sơ&quot;</strong> ở góc dưới để tạo nhân sự trước khi thêm các bảng quá trình lịch sử.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Render từng bảng quá trình */}
                  {subTab === 'work' && (
                    <div className="space-y-2">
                      {profileQ.data?.workHistories?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có quá trình công tác nào</div>
                      )}
                      {profileQ.data?.workHistories?.map((w: any) => (
                        <div key={w.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm">{w.position}</div>
                            <div className="text-muted-foreground mt-0.5">
                              Đơn vị: <span className="text-foreground font-medium">{w.unitName}</span> {w.departmentName && `• ${w.departmentName}`}
                            </div>
                            <div className="text-muted-foreground text-[11px] mt-1 font-mono">
                              {formatDate(w.fromDate)} $\rightarrow$ {w.toDate ? formatDate(w.toDate) : 'Hiện nay'}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('work-histories', w.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'edu' && (
                    <div className="space-y-2">
                      {profileQ.data?.educations?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có quá trình đào tạo nào</div>
                      )}
                      {profileQ.data?.educations?.map((e: any) => (
                        <div key={e.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm">{e.schoolName}</div>
                            <div className="text-muted-foreground mt-0.5">
                              Chuyên ngành: <span className="text-foreground font-medium">{e.majorName}</span> • Văn bằng: <span className="text-primary font-bold">{e.degreeName}</span> ({e.studyForm})
                            </div>
                            <div className="text-muted-foreground text-[11px] mt-1 font-mono">
                              Năm tốt nghiệp: {e.graduationYear || '—'}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('educations', e.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'salary' && (
                    <div className="space-y-2">
                      {profileQ.data?.salaryHistories?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có quá trình nâng lương nào</div>
                      )}
                      {profileQ.data?.salaryHistories?.map((s: any) => (
                        <div key={s.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm">
                              Ngạch: {s.rankCode || 'Tiêu chuẩn'} • Bậc {s.step} (Hệ số: {s.coefficient})
                            </div>
                            <div className="text-muted-foreground mt-0.5">
                              Ngày hưởng: {formatDate(s.fromDate)} • Số QĐ: {s.decisionNo || '—'}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('salary-histories', s.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'family' && (
                    <div className="space-y-2">
                      {profileQ.data?.familyRelations?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có quan hệ gia đình nào</div>
                      )}
                      {profileQ.data?.familyRelations?.map((f: any) => (
                        <div key={f.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm">
                              <span className="text-primary mr-2">[{f.relationType}]</span> {f.fullName} ({f.birthYear || '—'})
                            </div>
                            <div className="text-muted-foreground mt-0.5">{f.details || '—'}</div>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {f.category === 'SELF' ? 'Gia đình bản thân' : 'Bên Vợ/Chồng'}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('family-relations', f.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'reward' && (
                    <div className="space-y-2">
                      {profileQ.data?.rewardDisciplines?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có bản ghi khen thưởng / kỷ luật</div>
                      )}
                      {profileQ.data?.rewardDisciplines?.map((r: any) => (
                        <div key={r.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              <Badge variant={r.type === 'REWARD' ? 'success' : 'destructive'}>
                                {r.type === 'REWARD' ? 'Khen thưởng' : 'Kỷ luật'}
                              </Badge>
                              {r.title}
                            </div>
                            <div className="text-muted-foreground mt-1">
                              Ngày: {formatDate(r.eventDate)} • QĐ: {r.decisionNo || '—'}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('rewards-disciplines', r.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'appraisal' && (
                    <div className="space-y-2">
                      {profileQ.data?.appraisals?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có đánh giá cán bộ nào</div>
                      )}
                      {profileQ.data?.appraisals?.map((a: any) => (
                        <div key={a.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm">
                              Năm {a.year}: Xếp loại <span className="text-primary font-bold">{a.classification}</span>
                            </div>
                            <div className="text-muted-foreground mt-0.5">{a.comment || '—'}</div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('appraisals', a.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subTab === 'appointment' && (
                    <div className="space-y-2">
                      {profileQ.data?.appointments?.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">Chưa có quá trình bổ nhiệm nào</div>
                      )}
                      {profileQ.data?.appointments?.map((ap: any) => (
                        <div key={ap.id} className="p-3.5 rounded-xl border border-border bg-card flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-foreground text-sm flex items-center gap-2">
                              {ap.positionTitle}
                              {ap.isCurrent && <Badge variant="success">Đương nhiệm</Badge>}
                            </div>
                            <div className="text-muted-foreground mt-0.5">
                              Đơn vị: {ap.orgUnitName} • Ngày hiệu lực: {formatDate(ap.effectiveDate)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteSubRecord('appointments', ap.id)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-4 border-t border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ 2 chiều CSDLQG & Frappe HRMS Enterprise</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saveProfile.isPending}>
              Đóng
            </Button>
            <Button
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
              className="flex items-center gap-1.5 font-bold"
            >
              <Save className="w-4 h-4" />
              {saveProfile.isPending ? 'Đang lưu...' : userId ? 'Lưu thay đổi hồ sơ' : 'Lưu & Khởi tạo Hồ sơ'}
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL CON THÊM QUÁ TRÌNH LỊCH SỬ */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-card p-6 rounded-xl border border-border shadow-xl max-w-lg w-full space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-sm text-foreground">
                Thêm mục: {subTab === 'work' ? 'Quá trình công tác' : subTab === 'edu' ? 'Quá trình đào tạo' : subTab === 'salary' ? 'Quá trình lương' : subTab === 'family' ? 'Quan hệ gia đình' : subTab === 'reward' ? 'Khen thưởng/Kỷ luật' : subTab === 'appraisal' ? 'Đánh giá cán bộ' : 'Bổ nhiệm chức vụ'}
              </span>
              <button onClick={() => setIsAddSubOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {subTab === 'work' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold">Chức vụ / Vị trí</label>
                  <Input value={subForm.position || ''} onChange={(e) => setSubForm({ ...subForm, position: e.target.value })} placeholder="VD: Trưởng phòng" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Cơ quan / Đơn vị</label>
                  <Input value={subForm.unitName || ''} onChange={(e) => setSubForm({ ...subForm, unitName: e.target.value })} placeholder="VD: Sở Tài chính / Tập đoàn" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold">Từ ngày</label>
                    <Input type="date" value={subForm.fromDate || ''} onChange={(e) => setSubForm({ ...subForm, fromDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Đến ngày</label>
                    <Input type="date" value={subForm.toDate || ''} onChange={(e) => setSubForm({ ...subForm, toDate: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {subTab === 'edu' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold">Trường / Cơ sở đào tạo</label>
                  <Input value={subForm.schoolName || ''} onChange={(e) => setSubForm({ ...subForm, schoolName: e.target.value })} placeholder="Đại học Bách Khoa" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Chuyên ngành</label>
                  <Input value={subForm.majorName || ''} onChange={(e) => setSubForm({ ...subForm, majorName: e.target.value })} placeholder="Khoa học máy tính" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold">Văn bằng</label>
                    <Input value={subForm.degreeName || ''} onChange={(e) => setSubForm({ ...subForm, degreeName: e.target.value })} placeholder="Kỹ sư / Cử nhân" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Năm tốt nghiệp</label>
                    <Input type="number" value={subForm.graduationYear || 2022} onChange={(e) => setSubForm({ ...subForm, graduationYear: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {subTab === 'salary' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold">Bậc lương</label>
                    <Input type="number" value={subForm.step || 2} onChange={(e) => setSubForm({ ...subForm, step: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Hệ số lương</label>
                    <Input type="number" step="0.01" value={subForm.coefficient || 2.67} onChange={(e) => setSubForm({ ...subForm, coefficient: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Ngày bắt đầu hưởng</label>
                  <Input type="date" value={subForm.fromDate || ''} onChange={(e) => setSubForm({ ...subForm, fromDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Số quyết định nâng bậc</label>
                  <Input value={subForm.decisionNo || ''} onChange={(e) => setSubForm({ ...subForm, decisionNo: e.target.value })} placeholder="QĐ-NL/2026" />
                </div>
              </div>
            )}

            {subTab === 'family' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold">Mối quan hệ</label>
                    <Input value={subForm.relationType || ''} onChange={(e) => setSubForm({ ...subForm, relationType: e.target.value })} placeholder="Bố / Mẹ / Vợ / Con" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Năm sinh</label>
                    <Input type="number" value={subForm.birthYear || 1970} onChange={(e) => setSubForm({ ...subForm, birthYear: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Họ và tên</label>
                  <Input value={subForm.fullName || ''} onChange={(e) => setSubForm({ ...subForm, fullName: e.target.value })} placeholder="Nguyễn Thị..." />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Nghề nghiệp, nơi ở, thái độ chính trị</label>
                  <Input value={subForm.details || ''} onChange={(e) => setSubForm({ ...subForm, details: e.target.value })} placeholder="Nghỉ hưu, thường trú tại Hà Nội..." />
                </div>
              </div>
            )}

            {subTab === 'reward' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold">Hình thức</label>
                  <Select
                    value={subForm.type || 'REWARD'}
                    onChange={(e) => setSubForm({ ...subForm, type: e.target.value })}
                    className="text-xs"
                  >
                    <option value="REWARD">Khen thưởng</option>
                    <option value="DISCIPLINE">Kỷ luật</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Nội dung / Danh hiệu</label>
                  <Input value={subForm.title || ''} onChange={(e) => setSubForm({ ...subForm, title: e.target.value })} placeholder="Bằng khen của Chủ tịch UBND tỉnh" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold">Ngày ký</label>
                    <Input type="date" value={subForm.eventDate || ''} onChange={(e) => setSubForm({ ...subForm, eventDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Số quyết định</label>
                    <Input value={subForm.decisionNo || ''} onChange={(e) => setSubForm({ ...subForm, decisionNo: e.target.value })} placeholder="123/QĐ-UBND" />
                  </div>
                </div>
              </div>
            )}

            {subTab === 'appraisal' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold">Năm đánh giá</label>
                    <Input type="number" value={subForm.year || 2025} onChange={(e) => setSubForm({ ...subForm, year: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Xếp loại</label>
                    <Select
                      value={subForm.classification || 'EXCELLENT'}
                      onChange={(e) => setSubForm({ ...subForm, classification: e.target.value })}
                      className="text-xs font-semibold"
                    >
                      <option value="EXCELLENT">Hoàn thành xuất sắc nhiệm vụ</option>
                      <option value="GOOD">Hoàn thành tốt nhiệm vụ</option>
                      <option value="SATISFACTORY">Hoàn thành nhiệm vụ</option>
                      <option value="UNSATISFACTORY">Không hoàn thành nhiệm vụ</option>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Nhận xét của thủ trưởng cơ quan</label>
                  <Input value={subForm.comment || ''} onChange={(e) => setSubForm({ ...subForm, comment: e.target.value })} placeholder="Có tinh thần trách nhiệm cao, sáng tạo..." />
                </div>
              </div>
            )}

            {subTab === 'appointment' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold">Chức vụ bổ nhiệm</label>
                  <Input value={subForm.positionTitle || ''} onChange={(e) => setSubForm({ ...subForm, positionTitle: e.target.value })} placeholder="Phó Trưởng phòng" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Cơ quan / Đơn vị bổ nhiệm</label>
                  <Input value={subForm.orgUnitName || ''} onChange={(e) => setSubForm({ ...subForm, orgUnitName: e.target.value })} placeholder="Sở Kế hoạch & Đầu tư" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Ngày hiệu lực</label>
                  <Input type="date" value={subForm.effectiveDate || ''} onChange={(e) => setSubForm({ ...subForm, effectiveDate: e.target.value })} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsAddSubOpen(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={() => addSubRecord.mutate()} disabled={addSubRecord.isPending}>
                {addSubRecord.isPending ? 'Đang lưu...' : 'Thêm vào hồ sơ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
