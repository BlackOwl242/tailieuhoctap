'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  Clock4,
  Globe,
  Hash,
  KeyRound,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { ISO_CURRENCY_OPTIONS } from '@/lib/hr';
import {
  DEFAULT_ORG_CONFIG,
  ORG_LEVEL_LABELS,
  saveOrgConfig,
  type OrgPrintConfig,
  type OrgSectorType,
  type PublicPersonnelType,
} from '@/lib/org-config';
import { useToast } from '@/components/ui/toaster';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Skeleton,
} from '@/components/ui/primitives';
import { ErrorState, PageHeader } from '@/components/common/states';

const FALLBACK_ROLES = [
  { code: 'USER', name: 'Nhân viên (Cổng ESS)' },
  { code: 'LINE_MANAGER', name: 'Quản lý / Trưởng bộ phận' },
  { code: 'KM_MANAGER', name: 'Cán bộ Quản trị Nhân sự' },
  { code: 'HR_CB', name: 'Chuyên viên C&B (Lương & Phúc lợi)' },
  { code: 'ACCOUNTANT', name: 'Kế toán Doanh nghiệp & Thanh toán' },
  { code: 'HR_RECRUITER', name: 'Chuyên viên Tuyển dụng' },
  { code: 'HR_TRAINER', name: 'Chuyên viên Đào tạo & Phát triển' },
  { code: 'AUDITOR', name: 'Kiểm toán Nội bộ & Pháp chế' },
  { code: 'SHAREHOLDER', name: 'Cổ đông & Hội đồng Quản trị' },
  { code: 'BOD', name: 'Ban Giám Đốc (Executive)' },
  { code: 'ADMIN', name: 'Quản trị viên Hệ thống' },
];

function isStatutoryCulturesDay(dateStr: string): boolean {
  const m = dateStr.match(/^(\d{4})-11-24$/);
  if (!m) return false;
  const year = Number(m[1]);
  return year >= 2026 && year <= 2100;
}

function formatHolidayDisplay(dateStr: string): string {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : dateStr;
}

/** KC04 — Cấu hình tham số vận hành hệ thống HRMIS (không cài cứng mã nguồn). */
export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [employeeCodePrefix, setEmployeeCodePrefix] = useState('NV');
  const [employeeCodePadding, setEmployeeCodePadding] = useState(4);
  const [defaultUserRoles, setDefaultUserRoles] = useState<string[]>(['USER']);

  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('17:30');
  const [workBreakStart, setWorkBreakStart] = useState('12:00');
  const [workBreakEnd, setWorkBreakEnd] = useState('13:30');
  const [faceThreshold, setFaceThreshold] = useState('0.95');
  const [qrTtlSec, setQrTtlSec] = useState('30');

  const [annualLeaveDays, setAnnualLeaveDays] = useState('12');
  const [leaveAllocationMode, setLeaveAllocationMode] = useState('PRORATED_YEAR');
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');

  const [loginMaxAttempts, setLoginMaxAttempts] = useState('5');
  const [lockMinutes, setLockMinutes] = useState('15');
  const [defaultCurrency, setDefaultCurrency] = useState('VND');
  const [systemTimezone, setSystemTimezone] = useState('Asia/Ho_Chi_Minh');

  const [orgProfile, setOrgProfile] = useState<OrgPrintConfig>(DEFAULT_ORG_CONFIG);

  const q = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Record<string, unknown>>('/settings/effective')).data,
  });

  const rolesQ = useQuery({
    queryKey: ['system-roles'],
    queryFn: async () => (await api.get<Array<{ code: string; name: string }>>('/roles')).data,
  });

  const availableRoles = rolesQ.data?.length ? rolesQ.data : FALLBACK_ROLES;

  useEffect(() => {
    if (!q.data) return;
    const d = q.data;
    setEmployeeCodePrefix(typeof d.EMPLOYEE_CODE_PREFIX === 'string' && d.EMPLOYEE_CODE_PREFIX ? d.EMPLOYEE_CODE_PREFIX : 'NV');
    setEmployeeCodePadding(typeof d.EMPLOYEE_CODE_PADDING === 'number' ? d.EMPLOYEE_CODE_PADDING : 4);
    setDefaultUserRoles(
      Array.isArray(d.DEFAULT_USER_ROLES) && d.DEFAULT_USER_ROLES.length
        ? d.DEFAULT_USER_ROLES.map((r) => String(r))
        : ['USER'],
    );
    setWorkStart(String(d.WORK_START ?? '08:00'));
    setWorkEnd(String(d.WORK_END ?? '17:30'));
    setWorkBreakStart(String(d.WORK_BREAK_START ?? '12:00'));
    setWorkBreakEnd(String(d.WORK_BREAK_END ?? '13:30'));
    setFaceThreshold(String(d.FACE_THRESHOLD ?? '0.95'));
    setQrTtlSec(String(d.QR_TTL_SEC ?? '30'));
    setAnnualLeaveDays(String(d.ANNUAL_LEAVE_DAYS ?? '12'));
    setLeaveAllocationMode(String(d.LEAVE_ALLOCATION_MODE ?? 'PRORATED_YEAR'));
    setHolidays(
      Array.isArray(d.HOLIDAYS)
        ? d.HOLIDAYS.filter((item): item is string => typeof item === 'string' && !isStatutoryCulturesDay(item)).sort()
        : [],
    );
    setLoginMaxAttempts(String(d.LOGIN_MAX_ATTEMPTS ?? '5'));
    setLockMinutes(String(d.LOCK_MINUTES ?? '15'));
    setDefaultCurrency(typeof d.DEFAULT_CURRENCY === 'string' && d.DEFAULT_CURRENCY ? d.DEFAULT_CURRENCY : 'VND');
    setSystemTimezone(typeof d.SYSTEM_TIMEZONE === 'string' && d.SYSTEM_TIMEZONE ? d.SYSTEM_TIMEZONE : 'Asia/Ho_Chi_Minh');
    if (d.ORG_PROFILE && typeof d.ORG_PROFILE === 'object' && !Array.isArray(d.ORG_PROFILE)) {
      setOrgProfile({ ...DEFAULT_ORG_CONFIG, ...(d.ORG_PROFILE as Partial<OrgPrintConfig>) });
    }
  }, [q.data]);

  const previewPrefix = employeeCodePrefix.trim().toUpperCase() || 'NV';
  const codePreview = `${previewPrefix}${'1'.padStart(employeeCodePadding, '0')}`;

  const handleAddHoliday = () => {
    if (!newHolidayDate) return;
    if (isStatutoryCulturesDay(newHolidayDate)) {
      toast('Ngày 24/11 hằng năm đã được hệ thống tự động áp dụng cố định theo quy định.', 'success');
      setNewHolidayDate('');
      return;
    }
    if (holidays.includes(newHolidayDate)) {
      toast('Ngày nghỉ lễ này đã có trong danh sách', 'error');
      return;
    }
    setHolidays((prev) => [...prev, newHolidayDate].sort());
    setNewHolidayDate('');
  };

  const handleSectorChange = (sector: OrgSectorType) => {
    setOrgProfile((prev) => ({
      ...prev,
      orgSector: sector,
      orgLevel: sector === 'enterprise' ? 'DV_DNTN' : prev.orgLevel === 'DV_DNTN' ? 'DV_SNCL' : prev.orgLevel,
      publicPersonnelType: sector === 'state' ? (prev.publicPersonnelType ?? 'CIVIL_SERVANT') : null,
    }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const normalizedPrefix = employeeCodePrefix.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{1,10}$/.test(normalizedPrefix)) {
        throw new Error('Tiền tố mã nhân viên phải gồm 1–10 ký tự chữ, số, dấu gạch ngang (-) hoặc gạch dưới (_)');
      }
      if (defaultUserRoles.length === 0) {
        throw new Error('Phải chọn ít nhất 1 vai trò mặc định khi tiếp nhận nhân sự mới');
      }
      if (!orgProfile.orgName.trim()) {
        throw new Error('Tên đơn vị / doanh nghiệp không được để trống');
      }
      if (!systemTimezone.trim()) {
        throw new Error('Múi giờ hệ thống IANA không được để trống');
      }

      const normalizedOrgProfile: OrgPrintConfig = {
        ...DEFAULT_ORG_CONFIG,
        ...orgProfile,
        orgName: orgProfile.orgName.trim(),
        parentOrgName: orgProfile.parentOrgName.trim(),
        deptName: orgProfile.deptName.trim(),
        location: orgProfile.location.trim(),
        signerTitle1: orgProfile.signerTitle1.trim(),
        signerTitle2: orgProfile.signerTitle2.trim(),
        signerTitle3: orgProfile.signerTitle3.trim(),
        orgLevel: orgProfile.orgSector === 'enterprise' ? 'DV_DNTN' : orgProfile.orgLevel === 'DV_DNTN' ? 'DV_SNCL' : orgProfile.orgLevel,
        publicPersonnelType: orgProfile.orgSector === 'state' ? (orgProfile.publicPersonnelType ?? 'CIVIL_SERVANT') : null,
      };

      const values: Record<string, unknown> = {
        EMPLOYEE_CODE_PREFIX: normalizedPrefix,
        EMPLOYEE_CODE_PADDING: Number(employeeCodePadding),
        DEFAULT_USER_ROLES: defaultUserRoles,
        WORK_START: workStart,
        WORK_END: workEnd,
        WORK_BREAK_START: workBreakStart,
        WORK_BREAK_END: workBreakEnd,
        FACE_THRESHOLD: Number(faceThreshold),
        QR_TTL_SEC: Math.round(Number(qrTtlSec)),
        ANNUAL_LEAVE_DAYS: Math.round(Number(annualLeaveDays)),
        LEAVE_ALLOCATION_MODE: leaveAllocationMode,
        HOLIDAYS: holidays,
        LOGIN_MAX_ATTEMPTS: Math.round(Number(loginMaxAttempts)),
        LOCK_MINUTES: Math.round(Number(lockMinutes)),
        DEFAULT_CURRENCY: defaultCurrency.trim().toUpperCase(),
        SYSTEM_TIMEZONE: systemTimezone.trim(),
        ORG_PROFILE: normalizedOrgProfile,
      };

      await api.patch('/admin/settings', { values });
      return normalizedOrgProfile;
    },
    onSuccess: (normalizedOrgProfile) => {
      saveOrgConfig(normalizedOrgProfile);
      toast('Đã lưu toàn bộ cấu hình hệ thống', 'success');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  if (q.isLoading) return <Skeleton className="h-64" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Thiết lập quy tắc cấp mã nhân viên tự động, giờ làm việc, nghỉ phép, bảo mật đăng nhập và hồ sơ đơn vị."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Phân quyền (RBAC)
            </Link>
            <Button size="sm" disabled={save.isPending || defaultUserRoles.length === 0} onClick={() => save.mutate()}>
              <Save className="h-4 w-4" /> {save.isPending ? 'Đang lưu…' : 'Lưu cấu hình'}
            </Button>
          </div>
        }
      />

      {/* Lối tắt Phân quyền & Tài khoản */}
      <Card className="border-border shadow-2xs">
        <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Quản lý Tài khoản, Vai trò & Ma trận Phân quyền (RBAC)</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Gán nhiều vai trò cho từng nhân sự, gán danh sách tài khoản trực tiếp vào vai trò và thiết lập ma trận quyền 8 phân hệ.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              Tài khoản & Nhân sự
            </Link>
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-2xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Mở Quản lý Phân quyền
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 1: Quy tắc Cấp Mã Nhân viên Tự động & Vai trò Mặc định */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="h-4 w-4 text-primary" />
            1. Quy tắc Cấp Mã Nhân viên Tự động & Vai trò Mặc định
          </CardTitle>
          <CardDescription>
            Mã nhân viên được hệ thống tự động cấp phát tuần tự không trùng lặp khi tiếp nhận nhân sự, tạo tài khoản hoặc chuyển ứng viên trúng tuyển.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="set-prefix">Tiền tố mã nhân viên</Label>
              <Input
                id="set-prefix"
                maxLength={10}
                value={employeeCodePrefix}
                onChange={(e) => setEmployeeCodePrefix(e.target.value.toUpperCase())}
                placeholder="NV"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">Từ 1–10 ký tự (VD: NV, CB, EMP).</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-padding">Độ dài phần số thứ tự</Label>
              <Select
                id="set-padding"
                value={String(employeeCodePadding)}
                onChange={(e) => setEmployeeCodePadding(Number(e.target.value))}
              >
                {[3, 4, 5, 6, 7, 8].map((len) => (
                  <option key={len} value={String(len)}>
                    {len} chữ số ({'1'.padStart(len, '0')})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">Số chữ số đệm 0 đứng trước số tăng dần.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Xem trước mẫu mã tự động</Label>
              <div className="flex h-10 items-center justify-between rounded-lg border border-dashed border-border bg-muted/40 px-3">
                <span className="font-mono text-sm font-bold text-foreground">{codePreview}</span>
                <span className="text-xs text-muted-foreground">Tự động tăng</span>
              </div>
              <p className="text-xs text-muted-foreground">Hệ thống tự cấp, không cho nhập tay trên form.</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between">
              <Label>Vai trò mặc định khi tiếp nhận nhân sự mới *</Label>
              <span className={`text-xs ${defaultUserRoles.length === 0 ? 'font-medium text-rose-600' : 'text-muted-foreground'}`}>
                {defaultUserRoles.length === 0 ? 'Cần ít nhất 1 vai trò' : `Đang chọn ${defaultUserRoles.length} vai trò`}
              </span>
            </div>
            <div className="grid max-h-[220px] grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-border p-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {availableRoles.map((r) => {
                const checked = defaultUserRoles.includes(r.code);
                return (
                  <label
                    key={r.code}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
                      checked ? 'border-foreground bg-muted/40' : 'border-transparent hover:bg-muted/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setDefaultUserRoles((prev) =>
                          e.target.checked
                            ? Array.from(new Set([...prev, r.code]))
                            : prev.filter((c) => c !== r.code),
                        )
                      }
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-foreground">{r.name}</span>
                      <span className="block font-mono text-[10px] text-muted-foreground">{r.code}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 2: Thời giờ Làm việc, Nghỉ giữa ca & Điểm danh */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock4 className="h-4 w-4 text-primary" />
            2. Thời giờ Làm việc, Nghỉ giữa ca & Điểm danh (FaceID / QR)
          </CardTitle>
          <CardDescription>
            Khung giờ ca chuẩn, khoảng nghỉ trưa mặc định và ngưỡng xác thực khi chấm công trên ứng dụng.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="set-work-start">Giờ bắt đầu ca chuẩn</Label>
            <Input id="set-work-start" type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-work-end">Giờ kết thúc ca chuẩn</Label>
            <Input id="set-work-end" type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-break-start">Giờ bắt đầu nghỉ giữa ca</Label>
            <Input id="set-break-start" type="time" value={workBreakStart} onChange={(e) => setWorkBreakStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-break-end">Giờ kết thúc nghỉ giữa ca</Label>
            <Input id="set-break-end" type="time" value={workBreakEnd} onChange={(e) => setWorkBreakEnd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-face-threshold">Ngưỡng khớp khuôn mặt (FaceID)</Label>
            <Input
              id="set-face-threshold"
              type="number"
              step="0.01"
              min="0.5"
              max="1"
              value={faceThreshold}
              onChange={(e) => setFaceThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Giá trị trong khoảng (0, 1], khuyến nghị 0.90 – 0.96.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-qr-ttl">Thời hạn mã QR điểm danh (giây)</Label>
            <Input
              id="set-qr-ttl"
              type="number"
              min="10"
              max="300"
              value={qrTtlSec}
              onChange={(e) => setQrTtlSec(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Mã QR tự động làm mới sau số giây này.</p>
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 3: Chính sách Nghỉ phép & Lịch Ngày nghỉ Lễ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            3. Chính sách Nghỉ phép & Lịch Ngày nghỉ Lễ
          </CardTitle>
          <CardDescription>
            Hạn mức phép năm chuẩn, cơ chế phân bổ quỹ phép và danh sách ngày nghỉ lễ được tính nguyên công.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="set-annual-leave">Số ngày phép năm cơ bản</Label>
              <Input
                id="set-annual-leave"
                type="number"
                min="12"
                max="60"
                value={annualLeaveDays}
                onChange={(e) => setAnnualLeaveDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Từ 12 đến 60 ngày/năm theo quy định BLLĐ.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-leave-mode">Cách phân bổ phép năm</Label>
              <Select id="set-leave-mode" value={leaveAllocationMode} onChange={(e) => setLeaveAllocationMode(e.target.value)}>
                <option value="PRORATED_YEAR">Theo thời gian dự kiến làm việc trong năm</option>
                <option value="ACCRUED">Tích lũy theo tháng đến hiện tại</option>
                <option value="FULL_YEAR">Cấp trước trọn vẹn cả năm</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="set-holiday-picker">Thêm ngày nghỉ lễ / Tết</Label>
                <Input
                  id="set-holiday-picker"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="sm:w-48"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddHoliday} disabled={!newHolidayDate}>
                <Plus className="h-4 w-4" /> Thêm ngày lễ
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ngày Văn hóa Việt Nam 24/11 hằng năm (từ 2026) được hệ thống tự động cộng hưởng mặc định; cấu hình thêm các ngày nghỉ lễ khác (Tết Dương lịch, Tết Âm lịch, 30/4, 1/5, 2/9...) tại đây.
            </p>
            {holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Chưa cấu hình thêm ngày nghỉ lễ tùy chỉnh nào.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {holidays.map((day) => (
                  <span
                    key={day}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    <span className="font-mono">{formatHolidayDisplay(day)}</span>
                    <button
                      type="button"
                      onClick={() => setHolidays((prev) => prev.filter((item) => item !== day))}
                      aria-label={`Xóa ngày lễ ${day}`}
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 4: An toàn Đăng nhập & Khóa Tài khoản */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            4. An toàn Đăng nhập & Khóa Tài khoản Tự động
          </CardTitle>
          <CardDescription>
            Giới hạn số lần nhập sai mật khẩu liên tiếp trước khi tạm khóa bảo vệ tài khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-login-attempts">Số lần đăng nhập sai tối đa</Label>
            <Input
              id="set-login-attempts"
              type="number"
              min="1"
              max="20"
              value={loginMaxAttempts}
              onChange={(e) => setLoginMaxAttempts(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-lock-minutes">Thời gian khóa tạm thời (phút)</Label>
            <Input
              id="set-lock-minutes"
              type="number"
              min="1"
              max="1440"
              value={lockMinutes}
              onChange={(e) => setLockMinutes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 5: Hồ sơ Đơn vị & Chế độ Vận hành Tổ chức */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            5. Hồ sơ Đơn vị & Chế độ Vận hành Tổ chức
          </CardTitle>
          <CardDescription>
            Xác định loại hình tổ chức (Doanh nghiệp hoặc Cơ quan Nhà nước / Đơn vị sự nghiệp) và thông tin chữ ký trên biểu mẫu in ấn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="set-org-sector">Chế độ vận hành tổ chức</Label>
              <Select
                id="set-org-sector"
                value={orgProfile.orgSector ?? 'enterprise'}
                onChange={(e) => handleSectorChange(e.target.value as OrgSectorType)}
              >
                <option value="enterprise">Doanh nghiệp (HĐLĐ & Khung lương)</option>
                <option value="state">Cơ quan Nhà nước / Đơn vị sự nghiệp (Ngạch bậc 2C)</option>
              </Select>
            </div>

            {orgProfile.orgSector === 'state' ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="set-public-type">Chế độ nhân sự công vụ</Label>
                  <Select
                    id="set-public-type"
                    value={orgProfile.publicPersonnelType ?? 'CIVIL_SERVANT'}
                    onChange={(e) =>
                      setOrgProfile((prev) => ({ ...prev, publicPersonnelType: e.target.value as PublicPersonnelType }))
                    }
                  >
                    <option value="CIVIL_SERVANT">Công chức</option>
                    <option value="PUBLIC_EMPLOYEE">Viên chức</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="set-org-level">Cấp quản lý đơn vị</Label>
                  <Select
                    id="set-org-level"
                    value={orgProfile.orgLevel}
                    onChange={(e) => setOrgProfile((prev) => ({ ...prev, orgLevel: e.target.value }))}
                  >
                    {Object.entries(ORG_LEVEL_LABELS)
                      .filter(([code]) => code !== 'DV_DNTN')
                      .map(([code, label]) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                  </Select>
                </div>
              </>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="set-parent-org">Cơ quan / Tập đoàn chủ quản</Label>
              <Input
                id="set-parent-org"
                value={orgProfile.parentOrgName}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, parentOrgName: e.target.value }))}
                placeholder="Để trống nếu là đơn vị độc lập"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-org-name">Tên đơn vị / doanh nghiệp *</Label>
              <Input
                id="set-org-name"
                required
                value={orgProfile.orgName}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, orgName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-dept-name">Bộ phận tham mưu nhân sự</Label>
              <Input
                id="set-dept-name"
                value={orgProfile.deptName}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, deptName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-org-location">Địa danh ban hành văn bản</Label>
              <Input
                id="set-org-location"
                value={orgProfile.location}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-signer-1">Chức danh ký 1 (Lập biểu)</Label>
              <Input
                id="set-signer-1"
                value={orgProfile.signerTitle1}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, signerTitle1: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-signer-2">Chức danh ký 2 (Trưởng phòng)</Label>
              <Input
                id="set-signer-2"
                value={orgProfile.signerTitle2}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, signerTitle2: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-signer-3">Chức danh ký 3 (Thủ trưởng)</Label>
              <Input
                id="set-signer-3"
                value={orgProfile.signerTitle3}
                onChange={(e) => setOrgProfile((prev) => ({ ...prev, signerTitle3: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
            <span className="text-muted-foreground">
              Chế độ hiện chọn:{' '}
              <Badge variant={orgProfile.orgSector === 'state' ? 'default' : 'secondary'} className="ml-1 font-medium">
                {orgProfile.orgSector === 'state' ? 'Khu vực công' : 'Doanh nghiệp'}
              </Badge>
            </span>
            <Link href="/admin/org-units" className="font-medium text-primary hover:underline">
              Mở Cơ cấu Tổ chức & Phòng ban →
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Thẻ 6: Chuẩn Tiền tệ (ISO 4217) & Múi giờ hệ thống (IANA) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            6. Chuẩn Tiền tệ (ISO 4217) & Múi giờ hệ thống (IANA)
          </CardTitle>
          <CardDescription>
            Chuẩn hóa đơn vị tiền tệ kế toán mặc định và múi giờ tham chiếu khi kết sổ chấm công, bảng lương và nhật ký kiểm toán.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="set-default-currency">Đơn vị tiền tệ mặc định (ISO 4217)</Label>
            <Select
              id="set-default-currency"
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
            >
              {ISO_CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-system-timezone">Múi giờ hệ thống (IANA Timezone)</Label>
            <Input
              id="set-system-timezone"
              list="iana-timezone-presets"
              value={systemTimezone}
              onChange={(e) => setSystemTimezone(e.target.value)}
              placeholder="Asia/Ho_Chi_Minh"
            />
            <datalist id="iana-timezone-presets">
              <option value="Asia/Ho_Chi_Minh" />
              <option value="UTC" />
              <option value="Asia/Singapore" />
              <option value="Asia/Tokyo" />
              <option value="Europe/London" />
              <option value="America/New_York" />
            </datalist>
          </div>
        </CardContent>
      </Card>

      {/* Lối tắt Cấu hình Lương */}
      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Chính sách Tiền lương, BHXH & Thuế TNCN</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Quản lý phiên bản chính sách lương theo ngày hiệu lực, thành phần thu nhập và cấu trúc áp dụng tập trung trong trang Tiền lương.
              </p>
            </div>
          </div>
          <Link
            href="/payroll-engine?tab=policy"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Mở quản lý lương <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
