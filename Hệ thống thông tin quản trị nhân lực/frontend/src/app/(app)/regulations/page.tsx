'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator, CheckCircle2, Printer, ArrowRight,
  ShieldCheck, Scale, Clock, Sliders, Eye, Percent,
  Target, Sparkles, AlertCircle
} from 'lucide-react';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input, Select } from '@/components/ui/primitives';
import { printDocumentElement } from '@/components/ui/print';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

// ----------------------------------------------------------------------
// Các bảng tham chiếu và giả định mô phỏng; không thay thế chính sách doanh nghiệp.
// ----------------------------------------------------------------------

const ATTENDANCE_REGULATIONS = [
  { code: 'X', label: 'Có mặt đúng giờ (Đủ ngày công)', rate: '100% lương ngày', deduct: '0%', note: 'Chấm đủ 2 lượt vào/ra, đúng khung giờ quy định' },
  { code: 'M/S', label: 'Đi muộn hoặc về sớm', rate: 'Tính theo thời gian làm việc được xác nhận', deduct: 'Không phạt tiền/cắt lương thay kỷ luật', note: 'Đối chiếu giờ thực tế, lịch làm và giải trình được duyệt.' },
  { code: 'P', label: 'Nghỉ phép năm hưởng nguyên lương', rate: '100% lương ngày', deduct: '0%', note: 'Theo Điều 113 Bộ luật Lao động 2019, có đơn duyệt trước' },
  { code: 'L', label: 'Nghỉ Lễ / Tết theo luật', rate: 'Hưởng nguyên lương theo căn cứ áp dụng', deduct: '0%', note: 'Năm 2026 có 12 ngày hưởng lương: 11 ngày theo Bộ luật Lao động và Ngày Văn hóa Việt Nam 24/11 theo Nghị quyết 28/2026/QH16.' },
  { code: 'TS', label: 'Nghỉ ốm đau / Thai sản', rate: 'Theo căn cứ và tỷ lệ riêng từng chế độ', deduct: 'Đối soát thời gian không hưởng lương', note: 'BHXH giải quyết theo hồ sơ và quy tắc từng chế độ; không dùng một tỷ lệ 75% chung cho ốm đau và thai sản.' },
  { code: 'KL', label: 'Nghỉ không hưởng lương (Có phép)', rate: '0% lương ngày', deduct: 'Trừ 1 công/ngày', note: 'Có đơn xin nghỉ không hưởng lương được phê duyệt' },
  { code: 'KP', label: 'Vắng mặt không phép', rate: 'Không tính lương thời gian không làm việc theo căn cứ thực tế', deduct: 'Không phạt tiền/cắt lương thay kỷ luật', note: 'Xử lý kỷ luật, nếu có, phải theo đúng trình tự và căn cứ áp dụng.' },
];

const SOCIAL_INSURANCE_RATES = [
  { fund: 'Bảo hiểm Xã hội (BHXH)', employee: '8.0%', company: '17.0%', total: '25.0%', ceiling: 'Mức trần theo đối tượng; năm 2026 tối đa 20 lần mức tham chiếu' },
  { fund: 'Tai nạn lao động, bệnh nghề nghiệp', employee: '0.0%', company: '0.5%*', total: '0.5%*', ceiling: '*Có thể có tỷ lệ khác theo điều kiện áp dụng' },
  { fund: 'Bảo hiểm Y tế (BHYT)', employee: '1.5%', company: '3.0%', total: '4.5%', ceiling: 'Mức trần: 20 lần mức lương cơ sở' },
  { fund: 'Bảo hiểm Thất nghiệp (BHTN)', employee: '1.0%', company: '1.0%', total: '2.0%', ceiling: 'Mức trần: 20 lần mức lương tối thiểu vùng tương ứng' },
  { fund: 'Kinh phí Công đoàn', employee: '0.0%', company: '2.0%', total: '2.0%', ceiling: 'NSDLĐ đóng trên toàn bộ quỹ lương đóng BHXH' },
];

const TAX_BRACKETS = [
  { level: 1, range: 'Đến 10 triệu đ', rate: '5%', fastCalc: 'Thu nhập tính thuế × 5%', maxDeduct: '0 đ' },
  { level: 2, range: 'Trên 10 đến 30 triệu đ', rate: '10%', fastCalc: 'Thu nhập tính thuế × 10% - 0.5 triệu đ', maxDeduct: '500.000 đ' },
  { level: 3, range: 'Trên 30 đến 60 triệu đ', rate: '20%', fastCalc: 'Thu nhập tính thuế × 20% - 3.5 triệu đ', maxDeduct: '3.500.000 đ' },
  { level: 4, range: 'Trên 60 đến 100 triệu đ', rate: '30%', fastCalc: 'Thu nhập tính thuế × 30% - 9.5 triệu đ', maxDeduct: '9.500.000 đ' },
  { level: 5, range: 'Trên 100 triệu đ', rate: '35%', fastCalc: 'Thu nhập tính thuế × 35% - 14.5 triệu đ', maxDeduct: '14.500.000 đ' },
];

const OVERTIME_RATES = [
  { type: 'Làm thêm ngày làm việc bình thường', factor: '150% (Hệ số 1.5)', nightAdd: '+30% tiền lương đêm + 20% × mức OT ban ngày (Tổng tối thiểu 200%)', lawRef: 'Khoản 1–3 Điều 98 Bộ luật Lao động' },
  { type: 'Làm thêm ngày nghỉ hằng tuần', factor: '200% (Hệ số 2.0)', nightAdd: '+30% tiền lương đêm + 20% × mức OT ban ngày (Tổng tối thiểu 270%)', lawRef: 'Khoản 1–3 Điều 98 Bộ luật Lao động' },
  { type: 'Làm thêm ngày Lễ, Tết hưởng lương', factor: '300% (Hệ số 3.0)', nightAdd: '+30% tiền lương đêm + 20% × mức OT ban ngày (Tổng tối thiểu 390%)', lawRef: 'Khoản 1–3 Điều 98 Bộ luật Lao động; ngoài ra còn lương ngày lễ' },
];

export default function RegulationsPage() {
  const [orgConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(orgConfig);
  const [activeTab, setActiveTab] = useState<'tables' | 'simulator'>('tables');

  // State Máy tính mô phỏng lương tương tác
  const [calcBaseSalary, setCalcBaseSalary] = useState(15000000);
  const [calcStdDays, setCalcStdDays] = useState(22);
  const [calcActualDays, setCalcActualDays] = useState(22);
  const [calcDependents, setCalcDependents] = useState(1);
  const [calcOtHours, setCalcOtHours] = useState(4);
  const [calcNightHours, setCalcNightHours] = useState(0);
  const [calcOtCategory, setCalcOtCategory] = useState<'WEEKDAY' | 'WEEKLY_REST' | 'PUBLIC_HOLIDAY'>('WEEKDAY');

  // Tính toán mô phỏng C&B
  const simulation = useMemo(() => {
    const dailyWage = Math.round(calcBaseSalary / calcStdDays);
    const hourlyWage = Math.round(dailyWage / 8);
    const paidSalary = Math.round(dailyWage * Math.min(calcActualDays, calcStdDays));
    const missingDays = Math.max(0, calcStdDays - calcActualDays);
    const deductedAbsent = Math.round(dailyWage * missingDays);

    const otFactor = calcOtCategory === 'PUBLIC_HOLIDAY' ? 3 : calcOtCategory === 'WEEKLY_REST' ? 2 : 1.5;
    const otNightAdditional = 0.3 + 0.2 * (calcOtCategory === 'WEEKDAY' ? 1 : otFactor);
    const otPay = Math.round(calcOtHours * hourlyWage * otFactor + Math.min(calcNightHours, calcOtHours) * hourlyWage * otNightAdditional);

    // Thưởng KPI không được suy ra tự động từ xếp loại; chỉ tính khoản có quyết định riêng.
    const gross = paidSalary + otPay;

    // Scenario: resident employee in Region I, reference-salary cap from 01/07/2026.
    const socialInsuranceBase = Math.min(calcBaseSalary, 2530000 * 20);
    const unemploymentBase = Math.min(calcBaseSalary, 5310000 * 20);
    const bhxh = Math.round(socialInsuranceBase * 0.08);
    const bhyt = Math.round(socialInsuranceBase * 0.015);
    const bhtn = Math.round(unemploymentBase * 0.01);
    const totalInsurance = bhxh + bhyt + bhtn;

    // Thuế TNCN
    const personalDeduct = 15500000;
    const dependentDeduct = calcDependents * 6200000;
    const taxableIncome = Math.max(0, gross - otPay - totalInsurance - personalDeduct - dependentDeduct);

    let pit = 0;
    if (taxableIncome <= 10000000) {
      pit = Math.round(taxableIncome * 0.05);
    } else if (taxableIncome <= 30000000) {
      pit = Math.round(taxableIncome * 0.10 - 500000);
    } else if (taxableIncome <= 60000000) {
      pit = Math.round(taxableIncome * 0.20 - 3500000);
    } else if (taxableIncome <= 100000000) {
      pit = Math.round(taxableIncome * 0.30 - 9500000);
    } else {
      pit = Math.round(taxableIncome * 0.35 - 14500000);
    }

    const netPay = gross - totalInsurance - pit;

    return {
      dailyWage,
      hourlyWage,
      paidSalary,
      deductedAbsent,
      otPay,
      otNightAdditional,
      gross,
      totalInsurance,
      taxableIncome,
      pit,
      netPay,
    };
  }, [calcBaseSalary, calcStdDays, calcActualDays, calcDependents, calcOtHours, calcNightHours, calcOtCategory]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header chuẩn giao diện hệ thống */}
      <WorkspaceHeader
        title="Quy chế Tiền lương & Phúc lợi"
        description="Sổ tay quy chế tiền lương, công thức trích nộp bảo hiểm, biểu thuế thu nhập cá nhân, chế độ làm thêm giờ và cơ chế tính toán lương thực nhận."
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Quy chế Tiền lương & Phúc lợi' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => printDocumentElement('regulations-content')}
              className="text-xs h-8"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              In toàn văn quy chế A4
            </Button>
            <Link href="/payroll-engine">
              <Button size="sm" className="text-xs h-8">
                <Calculator className="h-3.5 w-3.5 mr-1.5" />
                Vào Bảng tính lương
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Thẻ chỉ số tổng quan chuẩn NumberCard (Hoàn toàn về Tiền lương) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NumberCard
          title="Quy ước tiền lương"
          value="5 Bảng"
          subtitle="Chấm công, bảo hiểm, thuế, hiệu suất & tăng ca"
          icon={Scale}
        />
        <NumberCard
          title="Tỷ lệ trích BHXH"
          value="10.5% / 23.5%*"
          subtitle="NLĐ 10.5%; DN 21.5% BH bắt buộc + 2% KPCĐ*"
          icon={ShieldCheck}
        />
        <NumberCard
          title="Biểu thuế TNCN"
          value="5 bậc (2026)"
          subtitle="Năm 2025: 7 bậc; giảm trừ theo kỳ tính thuế"
          icon={Percent}
        />
        <NumberCard
          title="Lương làm thêm giờ"
          value="150% - 300%"
          subtitle="Ngày thường, nghỉ tuần, lễ tết"
          icon={Clock}
        />
      </div>

      {/* Thanh điều hướng Tabs đồng bộ */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('tables')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'tables'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scale className="w-4 h-4" />
            5 Bảng Quy Ước Tiền Lương &amp; Phúc Lợi
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'border-foreground text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Bộ Mô Phỏng Tính Lương Thực Tế (Lương Gộp ➔ Thực Nhận)
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* NỘI DUNG CHÍNH */}
      {/* ============================================================== */}
      <div id="regulations-content" className="space-y-6">

        {/* TAB 1: 5 BẢNG QUY ƯỚC C&B CHUẨN */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            {/* BẢNG 1: MÃ TRẠNG THÁI CHẤM CÔNG & CÔNG THỨC TRỪ VẮNG */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground font-mono">BẢNG 1</span>
                    <CardTitle className="text-sm">Quy ước mã chấm công &amp; Công thức khấu trừ ngày vắng</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">Điều 113 BLLĐ 2019</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground text-left">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Mã chấm công</th>
                      <th className="py-2.5 px-4 font-semibold">Tên trạng thái</th>
                      <th className="py-2.5 px-4 font-semibold">Hưởng lương</th>
                      <th className="py-2.5 px-4 font-semibold">Mức khấu trừ</th>
                      <th className="py-2.5 px-4 font-semibold">Quy định xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ATTENDANCE_REGULATIONS.map((row) => (
                      <tr key={row.code} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-foreground">{row.code}</td>
                        <td className="py-2.5 px-4 font-medium text-foreground">{row.label}</td>
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground">
                            {row.rate}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">{row.deduct}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* BẢNG 2: TỶ LỆ TRÍCH ĐÓNG BẢO HIỂM BẮT BUỘC */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground font-mono">BẢNG 2</span>
                    <CardTitle className="text-sm">Tỷ lệ trích đóng Bảo hiểm (BHXH, BHYT, BHTN) &amp; Mức trần đóng</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">Luật BHXH 2024</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground text-left">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Quỹ bảo hiểm bắt buộc</th>
                      <th className="py-2.5 px-4 font-semibold">Người lao động đóng</th>
                      <th className="py-2.5 px-4 font-semibold">Doanh nghiệp đóng</th>
                      <th className="py-2.5 px-4 font-semibold">Tổng tỷ lệ</th>
                      <th className="py-2.5 px-4 font-semibold">Mức trần đóng tối đa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {SOCIAL_INSURANCE_RATES.map((row) => (
                      <tr key={row.fund} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-foreground">{row.fund}</td>
                        <td className="py-2.5 px-4 font-mono font-medium text-foreground">{row.employee}</td>
                        <td className="py-2.5 px-4 font-mono text-muted-foreground">{row.company}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground">{row.total}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{row.ceiling}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/30 font-semibold">
                      <td className="py-2.5 px-4 text-foreground">TỔNG CỘNG TRÍCH NỘP</td>
                      <td className="py-2.5 px-4 font-mono text-foreground">10.5% (Trừ lương)</td>
                      <td className="py-2.5 px-4 font-mono text-foreground">21.5% BH + 2.0% KPCĐ</td>
                      <td className="py-2.5 px-4 font-mono text-foreground">34.0%*</td>
                      <td className="py-2.5 px-4 text-muted-foreground">*Căn cứ/trần khác nhau; tỷ lệ có thể đổi theo đối tượng</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* BẢNG 3: BIỂU THUẾ THU NHẬP CÁ NHÂN LŨY TIẾN TỪNG PHẦN */}
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground font-mono">BẢNG 3</span>
                    <CardTitle className="text-sm">Biểu thuế TNCN cư trú năm 2026 — 5 bậc</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">Điều 22 Luật Thuế TNCN</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-x-auto">
                <div className="p-3 bg-muted/10 border-b border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>Kỳ tính thuế 2026 (kỳ 2025 tiếp tục dùng biểu 7 bậc và mức giảm trừ cũ):</span>
                  <span className="font-semibold text-foreground">
                    Bản thân: 15.500.000 đ/tháng · Người phụ thuộc: 6.200.000 đ/người/tháng
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground text-left">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Bậc thuế</th>
                      <th className="py-2.5 px-4 font-semibold">Thu nhập tính thuế / tháng</th>
                      <th className="py-2.5 px-4 font-semibold">Thuế suất</th>
                      <th className="py-2.5 px-4 font-semibold">Công thức tính nhanh</th>
                      <th className="py-2.5 px-4 font-semibold">Số tiền trừ bậc trước</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {TAX_BRACKETS.map((row) => (
                      <tr key={row.level} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-foreground">Bậc {row.level}</td>
                        <td className="py-2.5 px-4 font-medium text-foreground">{row.range}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground">{row.rate}</td>
                        <td className="py-2.5 px-4 font-mono text-muted-foreground">{row.fastCalc}</td>
                        <td className="py-2.5 px-4 font-mono text-muted-foreground">{row.maxDeduct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* BẢNG 4 & BẢNG 5: THƯỞNG KPI VÀ LÀM THÊM GIỜ OT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground font-mono">KPI</span>
                      <CardTitle className="text-sm">Đánh giá hiệu suất và phát triển năng lực</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">Quy tắc của hệ thống</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 text-xs">
                  {isEnterprise ? <>
                    <p className="font-semibold text-foreground">Nhân viên: tự đánh giá 20% + đồng nghiệp 30% + quản lý 50%. Quản lý có cấp dưới: tự đánh giá 20% + đồng nghiệp 20% + cấp trên 50% + cấp dưới 10%.</p>
                    <p className="text-muted-foreground">Tỷ trọng mục tiêu KPI cộng thành 100%. Ngưỡng nội bộ: Xuất sắc từ 90; Tốt từ 75; Đạt từ 50. Không áp dụng hạn ngạch xếp loại công vụ cho doanh nghiệp.</p>
                    <p className="rounded-md border border-border bg-muted/30 p-3 text-muted-foreground">Điểm đánh giá chưa tự tạo thưởng, điều chỉnh lương hoặc kết nối P3. Đãi ngộ cần chính sách và quyết định riêng được duyệt.</p>
                  </> : <>
                    <p className="font-semibold text-foreground">Khung đánh giá: tiêu chí chung 30 điểm + kết quả thực hiện nhiệm vụ 70 điểm.</p>
                    <p className="text-muted-foreground">Ngưỡng điểm tham chiếu: Hoàn thành xuất sắc từ 90; tốt từ 70; hoàn thành từ 50. Công chức theo NĐ 335/2025/NĐ-CP, viên chức theo NĐ 233/2026/NĐ-CP. Hạn ngạch 20% và trường hợp ngoại lệ đến 25% chỉ áp dụng khi đúng điều kiện/phạm vi khu vực công; HRMS đã có bước hiệu chuẩn và kiểm tra tỷ lệ, nhưng chưa tích hợp biểu mẫu pháp quy, chữ ký số và quy trình đầy đủ của từng cơ quan.</p>
                    <p className="rounded-md border border-border bg-muted/30 p-3 text-muted-foreground">Chế độ nhà nước không dùng trọng số phản hồi 360 của doanh nghiệp. Kết quả xếp loại phải qua thẩm quyền và căn cứ áp dụng; không đồng bộ sang lương P3.</p>
                  </>}
                  <Link href="/performance-360" className="inline-flex font-medium text-primary underline">Mở phân hệ đánh giá</Link>
                </CardContent>
              </Card>

              {/* BẢNG 5 */}
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground font-mono">BẢNG 5</span>
                      <CardTitle className="text-sm">Quy định đơn giá làm thêm giờ (Tăng ca)</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">Điều 98 Bộ luật Lao động</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-0 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground text-left">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Thời điểm làm thêm giờ</th>
                        <th className="py-2.5 px-3 font-semibold">Hệ số ban ngày</th>
                        <th className="py-2.5 px-3 font-semibold">Phụ cấp ca đêm</th>
                        <th className="py-2.5 px-3 font-semibold">Căn cứ pháp lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {OVERTIME_RATES.map((row) => (
                        <tr key={row.type} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground">{row.type}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{row.factor}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{row.nightAdd}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{row.lawRef}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-muted/10 border-t border-border/60 text-2xs text-muted-foreground">
                    ★ Theo quy định thuế áp dụng cho kỳ tính thuế 2026, tiền lương làm việc ban đêm và làm thêm giờ thuộc khoản thu nhập được miễn thuế; hệ thống phải lưu tách riêng giờ/tiền đủ điều kiện để giải trình.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: BỘ MÔ PHỎNG TÍNH LƯƠNG THỰC TẾ (LƯƠNG GỘP ➔ THỰC NHẬN) */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-foreground" />
                    <CardTitle className="text-sm">Bộ mô phỏng luồng tính toán lương gộp sang thực nhận 5 bước</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">Công cụ kiểm thử</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                {/* Form nhập tham số tính thử */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Lương vị trí (đ)</label>
                    <Input
                      type="number"
                      value={calcBaseSalary}
                      onChange={(e) => setCalcBaseSalary(Number(e.target.value))}
                      className="text-xs font-mono h-8"
                      step={500000}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Công chuẩn tháng</label>
                    <Input
                      type="number"
                      value={calcStdDays}
                      onChange={(e) => setCalcStdDays(Number(e.target.value))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Công đi làm thực tế</label>
                    <Input
                      type="number"
                      value={calcActualDays}
                      onChange={(e) => setCalcActualDays(Number(e.target.value))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Giờ làm thêm (Tăng ca)</label>
                    <Input
                      type="number"
                      value={calcOtHours}
                      onChange={(e) => setCalcOtHours(Number(e.target.value))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Loại ngày OT</label>
                    <Select value={calcOtCategory} onChange={(e) => setCalcOtCategory(e.target.value as typeof calcOtCategory)} className="text-xs h-8">
                      <option value="WEEKDAY">Ngày thường</option><option value="WEEKLY_REST">Ngày nghỉ tuần</option><option value="PUBLIC_HOLIDAY">Lễ, Tết</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Giờ OT ban đêm</label>
                    <Input type="number" min={0} max={calcOtHours} value={calcNightHours} onChange={(e) => setCalcNightHours(Number(e.target.value))} className="text-xs font-mono h-8" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Người phụ thuộc</label>
                    <Input
                      type="number"
                      value={calcDependents}
                      onChange={(e) => setCalcDependents(Number(e.target.value))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                </div>

                {/* Kết quả phân tích 5 bước */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/80 pb-2">
                    <span className="text-xs font-bold text-foreground">BẢNG KẾT QUẢ QUYẾT TOÁN LƯƠNG MÔ PHỎNG</span>
                    <span className="text-xs font-mono font-bold text-foreground">
                      LƯƠNG THỰC NHẬN: {simulation.netPay.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">1. Lương ngày công</span>
                      <span className="font-semibold font-mono text-foreground block mt-0.5">
                        {simulation.paidSalary.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Đơn giá: {simulation.dailyWage.toLocaleString('vi-VN')}đ/ngày
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">2. Tiền làm thêm giờ</span>
                      <span className="font-semibold font-mono text-foreground block mt-0.5">
                        +{simulation.otPay.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {calcOtHours} giờ × {simulation.hourlyWage.toLocaleString('vi-VN')}đ × {calcOtCategory === 'PUBLIC_HOLIDAY' ? '3.0' : calcOtCategory === 'WEEKLY_REST' ? '2.0' : '1.5'}{calcNightHours > 0 ? ` (phụ trội đêm ${(simulation.otNightAdditional * 100).toFixed(0)}% × ${Math.min(calcNightHours, calcOtHours)}h)` : ''}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">3. BH bắt buộc NLĐ</span>
                      <span className="font-semibold font-mono text-muted-foreground block mt-0.5">
                        -{simulation.totalInsurance.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        BHXH 8%, BHYT 1.5%, BHTN 1% (căn cứ/trần có thể khác)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">4. Thuế TNCN lũy tiến</span>
                      <span className="font-semibold font-mono text-muted-foreground block mt-0.5">
                        -{simulation.pit.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Thu nhập tính thuế: {simulation.taxableIncome.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">Mô phỏng giả định người lao động cư trú, đủ điều kiện tham gia bảo hiểm, ở vùng I và được hưởng OT đã duyệt. Năm 2026 miễn thuế thu nhập làm ban đêm/làm thêm giờ; trần BHXH/BHYT lấy mức tham chiếu từ 01/07/2026, BHTN lấy trần vùng I. Chưa tính khoản giảm trừ y tế/giáo dục, khoản đãi ngộ phải có quyết định riêng, kinh phí công đoàn của doanh nghiệp hoặc các trường hợp thuế/bảo hiểm ngoại lệ. Kết quả chỉ minh họa, không thay thế bảng lương đã khóa theo hồ sơ và chính sách thực tế.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* LIÊN KẾT SANG PHÂN HỆ ĐÁNH GIÁ HIỆU SUẤT */}
        <Card className="border border-border bg-card">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-foreground" />
                <span className="font-semibold text-foreground text-sm">{isEnterprise ? 'Đánh giá KPI và năng lực doanh nghiệp' : 'Đánh giá công chức, viên chức'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isEnterprise
                  ? 'KPI theo mục tiêu, phản hồi theo vai trò (20/30/50 hoặc 20/20/50/10) và phát triển năng lực. Không áp dụng hạn ngạch công vụ; điểm chưa tự kết nối P3 hoặc phát sinh khoản lương.'
                  : `Khung tiêu chí chung 30% và kết quả nhiệm vụ 70%; căn cứ ${orgConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'Nghị định 233/2026/NĐ-CP' : 'Nghị định 335/2025/NĐ-CP'}. Có lưu kết luận và kiểm tra tỷ lệ khu vực công; biểu mẫu pháp quy, chữ ký số và quy trình phê duyệt đầy đủ theo cơ quan chưa tích hợp.`}
              </p>
            </div>
            <Link href="/performance-360">
              <Button variant="outline" size="sm" className="text-xs shrink-0">
                Tới Phân hệ Đánh giá Hiệu suất <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
