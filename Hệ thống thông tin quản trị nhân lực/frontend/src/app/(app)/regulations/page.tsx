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

// ----------------------------------------------------------------------
// DỮ LIỆU: 5 BẢNG QUY ƯỚC TIỀN LƯƠNG & PHÚC LỢI CHUẨN
// ----------------------------------------------------------------------

const ATTENDANCE_REGULATIONS = [
  { code: 'X', label: 'Có mặt đúng giờ (Đủ ngày công)', rate: '100% lương ngày', deduct: '0%', note: 'Chấm đủ 2 lượt vào/ra, đúng khung giờ quy định' },
  { code: 'M/S', label: 'Đi muộn hoặc Về sớm', rate: 'Tính công theo giờ', deduct: 'Trừ thời gian thiếu', note: 'Vi phạm sau 15 phút trừ 0.25 công, sau 60 phút trừ 0.5 công' },
  { code: 'P', label: 'Nghỉ phép năm hưởng nguyên lương', rate: '100% lương ngày', deduct: '0%', note: 'Theo Điều 113 Bộ luật Lao động 2019, có đơn duyệt trước' },
  { code: 'L', label: 'Nghỉ Lễ / Tết theo luật', rate: '100% lương ngày', deduct: '0%', note: '11 ngày lễ tết chính thức theo quy định Nhà nước' },
  { code: 'TS', label: 'Nghỉ ốm đau / Thai sản', rate: '75% BHXH chi trả', deduct: '100% lương cty', note: 'Cơ quan Bảo hiểm xã hội chi trả trợ cấp, Công ty không trả lương' },
  { code: 'KL', label: 'Nghỉ không hưởng lương (Có phép)', rate: '0% lương ngày', deduct: 'Trừ 1 công/ngày', note: 'Có đơn xin nghỉ không hưởng lương được phê duyệt' },
  { code: 'KP', label: 'Vắng mặt không phép (Vô kỷ luật)', rate: '0% lương ngày', deduct: 'Trừ 1 công + Vi phạm', note: 'Trừ 1 ngày lương và xem xét xử lý kỷ luật lao động' },
];

const SOCIAL_INSURANCE_RATES = [
  { fund: 'Bảo hiểm Xã hội (BHXH)', employee: '8.0%', company: '17.5%', total: '25.5%', ceiling: 'Mức trần: 20 lần mức lương cơ sở' },
  { fund: 'Bảo hiểm Y tế (BHYT)', employee: '1.5%', company: '3.0%', total: '4.5%', ceiling: 'Mức trần: 20 lần mức lương cơ sở' },
  { fund: 'Bảo hiểm Thất nghiệp (BHTN)', employee: '1.0%', company: '1.0%', total: '2.0%', ceiling: 'Mức trần: 20 lần mức lương tối thiểu vùng' },
  { fund: 'Kinh phí Công đoàn', employee: '0.0%', company: '2.0%', total: '2.0%', ceiling: 'NSDLĐ đóng trên toàn bộ quỹ lương đóng BHXH' },
];

const TAX_BRACKETS = [
  { level: 1, range: 'Đến 5 triệu đ', rate: '5%', fastCalc: 'Thu nhập tính thuế × 5%', maxDeduct: '0 đ' },
  { level: 2, range: 'Trên 5 đến 10 triệu đ', rate: '10%', fastCalc: 'Thu nhập tính thuế × 10% - 0.25 triệu đ', maxDeduct: '250.000 đ' },
  { level: 3, range: 'Trên 10 đến 18 triệu đ', rate: '15%', fastCalc: 'Thu nhập tính thuế × 15% - 0.75 triệu đ', maxDeduct: '750.000 đ' },
  { level: 4, range: 'Trên 18 đến 32 triệu đ', rate: '20%', fastCalc: 'Thu nhập tính thuế × 20% - 1.65 triệu đ', maxDeduct: '1.650.000 đ' },
  { level: 5, range: 'Trên 32 đến 52 triệu đ', rate: '25%', fastCalc: 'Thu nhập tính thuế × 25% - 3.25 triệu đ', maxDeduct: '3.250.000 đ' },
  { level: 6, range: 'Trên 52 đến 80 triệu đ', rate: '30%', fastCalc: 'Thu nhập tính thuế × 30% - 5.85 triệu đ', maxDeduct: '5.850.000 đ' },
  { level: 7, range: 'Trên 80 triệu đ', rate: '35%', fastCalc: 'Thu nhập tính thuế × 35% - 9.85 triệu đ', maxDeduct: '9.850.000 đ' },
];

// Khớp 100% với hệ thống phân loại bên Performance-360
const KPI_BONUS_RATES = [
  { grade: 'Loại A (Xuất sắc)', score: 'Từ 90 đến 100 điểm', bonus: '1.15 (+15%)', formula: 'Lương vị trí × 15%', status: 'Hoàn thành xuất sắc (≤ 20% NV)' },
  { grade: 'Loại B (Tốt)', score: 'Từ 75 đến 89 điểm', bonus: '1.10 (+10%)', formula: 'Lương vị trí × 10%', status: 'Đạt chuẩn nâng bậc thường xuyên' },
  { grade: 'Loại C (Hoàn thành)', score: 'Từ 50 đến 74 điểm', bonus: '1.05 (+5%)', formula: 'Lương vị trí × 5%', status: 'Giữ nguyên bậc lương hiện tại' },
  { grade: 'Loại D (Không đạt)', score: 'Dưới 50 điểm (hoặc kỷ luật)', bonus: '1.00 (0%)', formula: '0 đ', status: 'Kế hoạch cải thiện hiệu suất 90 ngày' },
];

const OVERTIME_RATES = [
  { type: 'Làm thêm ngày làm việc bình thường', factor: '150% (Hệ số 1.5)', nightAdd: '+30% nếu làm ca đêm (Tổng 210%)', lawRef: 'Khoản 1 Điều 98 Bộ luật Lao động' },
  { type: 'Làm thêm ngày nghỉ hằng tuần (Thứ 7, CN)', factor: '200% (Hệ số 2.0)', nightAdd: '+30% nếu làm ca đêm (Tổng 270%)', lawRef: 'Khoản 1 Điều 98 Bộ luật Lao động' },
  { type: 'Làm thêm ngày Lễ, Tết hưởng lương', factor: '300% (Hệ số 3.0)', nightAdd: '+30% nếu làm ca đêm (Tổng 390%)', lawRef: 'Chưa kể tiền lương ngày lễ hưởng 100%' },
];

export default function RegulationsPage() {
  const [activeTab, setActiveTab] = useState<'tables' | 'simulator'>('tables');

  // State Máy tính mô phỏng lương tương tác
  const [calcBaseSalary, setCalcBaseSalary] = useState(15000000);
  const [calcStdDays, setCalcStdDays] = useState(22);
  const [calcActualDays, setCalcActualDays] = useState(22);
  const [calcDependents, setCalcDependents] = useState(1);
  const [calcOtHours, setCalcOtHours] = useState(4);
  const [calcKpiGrade, setCalcKpiGrade] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Tính toán mô phỏng C&B
  const simulation = useMemo(() => {
    const dailyWage = Math.round(calcBaseSalary / calcStdDays);
    const hourlyWage = Math.round(dailyWage / 8);
    const paidSalary = Math.round(dailyWage * Math.min(calcActualDays, calcStdDays));
    const missingDays = Math.max(0, calcStdDays - calcActualDays);
    const deductedAbsent = Math.round(dailyWage * missingDays);

    // OT (150% ngày thường)
    const otPay = Math.round(calcOtHours * hourlyWage * 1.5);

    // KPI Bonus theo chuẩn A, B, C, D
    let kpiBonusRate = 0;
    if (calcKpiGrade === 'A') kpiBonusRate = 0.15;
    else if (calcKpiGrade === 'B') kpiBonusRate = 0.10;
    else if (calcKpiGrade === 'C') kpiBonusRate = 0.05;
    const kpiBonus = Math.round(calcBaseSalary * kpiBonusRate);

    // Tổng thu nhập trước giảm trừ (Gross Pay)
    const gross = paidSalary + otPay + kpiBonus;

    // BHXH (10.5%)
    const maxInsuranceBase = 2340000 * 20; // 46.8tr
    const insuranceBase = Math.min(calcBaseSalary, maxInsuranceBase);
    const bhxh = Math.round(insuranceBase * 0.08);
    const bhyt = Math.round(insuranceBase * 0.015);
    const bhtn = Math.round(insuranceBase * 0.01);
    const totalInsurance = bhxh + bhyt + bhtn;

    // Thuế TNCN
    const personalDeduct = 11000000;
    const dependentDeduct = calcDependents * 4400000;
    const taxableIncome = Math.max(0, gross - totalInsurance - personalDeduct - dependentDeduct);

    let pit = 0;
    if (taxableIncome <= 5000000) {
      pit = Math.round(taxableIncome * 0.05);
    } else if (taxableIncome <= 10000000) {
      pit = Math.round(taxableIncome * 0.10 - 250000);
    } else if (taxableIncome <= 18000000) {
      pit = Math.round(taxableIncome * 0.15 - 750000);
    } else if (taxableIncome <= 32000000) {
      pit = Math.round(taxableIncome * 0.20 - 1650000);
    } else {
      pit = Math.round(taxableIncome * 0.25 - 3250000);
    }

    const netPay = gross - totalInsurance - pit;

    return {
      dailyWage,
      hourlyWage,
      paidSalary,
      deductedAbsent,
      otPay,
      kpiBonus,
      gross,
      totalInsurance,
      taxableIncome,
      pit,
      netPay,
    };
  }, [calcBaseSalary, calcStdDays, calcActualDays, calcDependents, calcOtHours, calcKpiGrade]);

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
          value="10.5% / 21.5%"
          subtitle="NLĐ đóng 10.5% - Doanh nghiệp 21.5%"
          icon={ShieldCheck}
        />
        <NumberCard
          title="Biểu thuế TNCN"
          value="7 Bậc"
          subtitle="Lũy tiến từ 5% đến tối đa 35%"
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
                      <th className="py-2.5 px-4 font-semibold">Mức khống chế trần đóng</th>
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
                      <td className="py-2.5 px-4 font-mono text-foreground">21.5% (Chi phí DN)</td>
                      <td className="py-2.5 px-4 font-mono text-foreground">32.0%</td>
                      <td className="py-2.5 px-4 text-muted-foreground">Theo quy định hiện hành</td>
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
                    <CardTitle className="text-sm">Biểu thuế Thu nhập cá nhân (TNCN) 7 bậc lũy tiến từng phần</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">Điều 22 Luật Thuế TNCN</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 p-0 overflow-x-auto">
                <div className="p-3 bg-muted/10 border-b border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>Mức giảm trừ gia cảnh hiện hành:</span>
                  <span className="font-semibold text-foreground">
                    Bản thân: 11.000.000 đ/tháng · Người phụ thuộc: 4.400.000 đ/người/tháng
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
              {/* BẢNG 4 */}
              <Card>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground font-mono">BẢNG 4</span>
                      <CardTitle className="text-sm">Hệ số Thưởng Hiệu Suất trong Bảng lương</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">Quy chế tiền lương</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-0 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground text-left">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Xếp loại thi đua</th>
                        <th className="py-2.5 px-3 font-semibold">Khung điểm</th>
                        <th className="py-2.5 px-3 font-semibold">Hệ số thưởng</th>
                        <th className="py-2.5 px-3 font-semibold">Xử lý lương</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {KPI_BONUS_RATES.map((row) => (
                        <tr key={row.grade} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground">{row.grade}</td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">{row.score}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{row.bonus}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{row.formula}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-muted/10 border-t border-border/60 text-2xs text-muted-foreground">
                    ★ Kết quả xếp loại nhân sự được đồng bộ tự động từ <Link href="/performance-360" className="underline font-medium text-foreground">Phân hệ Đánh giá Hiệu suất 360°</Link>.
                  </div>
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
                    ★ Tiền lương làm thêm giờ được miễn thuế TNCN đối với phần chênh lệch vượt quá 100% lương giờ bình thường.
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Người phụ thuộc</label>
                    <Input
                      type="number"
                      value={calcDependents}
                      onChange={(e) => setCalcDependents(Number(e.target.value))}
                      className="text-xs font-mono h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Xếp loại hiệu suất</label>
                    <Select
                      value={calcKpiGrade}
                      onChange={(e) => setCalcKpiGrade(e.target.value as any)}
                      className="text-xs h-8"
                    >
                      <option value="A">Loại A (+15%)</option>
                      <option value="B">Loại B (+10%)</option>
                      <option value="C">Loại C (+5%)</option>
                      <option value="D">Loại D (0%)</option>
                    </Select>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
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
                        {calcOtHours} giờ × {simulation.hourlyWage.toLocaleString('vi-VN')}đ × 1.5
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">3. Thưởng hiệu suất</span>
                      <span className="font-semibold font-mono text-foreground block mt-0.5">
                        +{simulation.kpiBonus.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Xếp loại {calcKpiGrade} theo kết quả chu kỳ
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">4. Khấu trừ bảo hiểm (10.5%)</span>
                      <span className="font-semibold font-mono text-muted-foreground block mt-0.5">
                        -{simulation.totalInsurance.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        BHXH 8%, BHYT 1.5%, BHTN 1%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md border border-border bg-card">
                      <span className="text-muted-foreground block text-[11px]">5. Thuế TNCN lũy tiến</span>
                      <span className="font-semibold font-mono text-muted-foreground block mt-0.5">
                        -{simulation.pit.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Thu nhập tính thuế: {simulation.taxableIncome.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
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
                <span className="font-semibold text-foreground text-sm">Phân hệ Đánh giá Hiệu suất & Năng lực 360°</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hệ thống chỉ tiêu công việc định lượng, khung năng lực hành vi 1-5 sao, khảo sát đa chiều 360 độ và 4 bộ biểu mẫu A4 chuẩn (Nghị định 90/2020/NĐ-CP) được quản lý tập trung tại phân hệ Đánh giá.
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
