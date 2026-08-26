'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet, FileText, Printer, Download, Users, Award, GraduationCap,
  Building, CheckCircle2, ChevronRight, Search, Globe, BookOpen, User
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock, PrintExportDropdown } from '@/components/ui/print';
import { exportRowsToExcel } from '@/lib/export';

export default function PersonnelReportsPage() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const [activeReport, setActiveReport] = useState<'2c' | 'bieu01' | 'bieu02' | 'bieu03'>('2c');
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || '');

  // Lấy danh sách nhân viên để chọn in sơ yếu lý lịch 4 trang
  const qEmployees = useQuery({
    queryKey: ['employees-for-report'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return (res.data?.items || res.data || []) as any[];
    },
  });

  // Tự động chọn người đầu tiên nếu chưa chọn
  const employees = qEmployees.data || [];
  const currentUserId = selectedUserId || (employees.length > 0 ? employees[0].id : '');

  // Query dữ liệu Sơ yếu lý lịch 4 trang
  const q2c = useQuery({
    queryKey: ['report-2c', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const res = await api.get(`/personnel-reports/2c-profile/${currentUserId}`);
      return res.data;
    },
    enabled: activeReport === '2c' && !!currentUserId,
  });

  // Query Biểu 01: Tuổi x Ngạch
  const qBieu01 = useQuery({
    queryKey: ['report-bieu-01'],
    queryFn: async () => (await api.get('/personnel-reports/bieu-01-age-rank')).data,
    enabled: activeReport === 'bieu01',
  });

  // Query Biểu 02: Ngoại ngữ
  const qBieu02 = useQuery({
    queryKey: ['report-bieu-02'],
    queryFn: async () => (await api.get('/personnel-reports/bieu-02-languages')).data,
    enabled: activeReport === 'bieu02',
  });

  // Query Biểu 03: Trình độ x Đơn vị
  const qBieu03 = useQuery({
    queryKey: ['report-bieu-03'],
    queryFn: async () => (await api.get('/personnel-reports/bieu-03-education-org')).data,
    enabled: activeReport === 'bieu03',
  });

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Trung tâm Báo cáo & Thống kê"
        description="Mẫu biểu báo cáo nhân lực chuẩn hóa: Sơ yếu lý lịch Cán bộ/Nhân sự (Mẫu 2C-BNV), Thống kê Cơ cấu Độ tuổi theo Ngạch bậc (Biểu 01), Ngoại ngữ (Biểu 02), và Trình độ chuyên môn (Biểu 03)."
        breadcrumbs={[{ label: 'Báo cáo & Tri thức' }, { label: 'Trung tâm báo cáo' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 shadow-2xs text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> In Báo cáo / PDF
            </Button>
          </div>
        }
      />

      {/* Tabs Chọn Báo cáo */}
      <div className="flex border-b border-border/60 gap-2 mb-6 overflow-x-auto pb-1 no-print">
        {[
          { id: '2c', label: '1. Sơ yếu Lý lịch Chuẩn 2C-BNV', icon: FileText },
          { id: 'bieu01', label: '2. Biểu 01: Độ tuổi × Ngạch bậc', icon: Award },
          { id: 'bieu02', label: '3. Biểu 02: Ngoại ngữ & Tin học', icon: Globe },
          { id: 'bieu03', label: '4. Biểu 03: Trình độ CM & LLCT × Đơn vị', icon: Building },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                active
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground bg-card border border-border/60 hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BÁO CÁO 1: SƠ YẾU LÝ LỊCH 4 TRANG CHUẨN 2C-BNV */}
      {activeReport === '2c' && (
        <div className="space-y-6">
          {/* Bộ chọn nhân sự */}
          <Card className="p-4 bg-card border border-border shadow-xs flex items-center justify-between gap-4 flex-wrap no-print">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs font-bold text-foreground">Chọn nhân sự để kết xuất Sơ yếu lý lịch:</div>
                <div className="text-xs text-muted-foreground">Chuẩn Nghị định 30/2020/NĐ-CP & Mẫu 2C-BNV/2008 (Cỡ chữ 12pt - 14pt rõ nét)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-[300px]">
              <select
                value={currentUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-card px-3 py-1 text-xs font-medium shadow-xs text-foreground"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode ? `[${emp.employeeCode}] ` : ''}{emp.fullName} - {emp.jobTitle || emp.department || 'Chuyên viên'}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Bản In Sơ Yếu Lý Lịch Chuẩn A4 */}
          <div className="print-area font-times max-w-4xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 rounded-2xl shadow-sm text-black space-y-6 leading-relaxed text-[12pt]">
            {/* Header Quốc hiệu chuẩn Nghị định 30 */}
            <PrintFrame
              title="SƠ YẾU LÝ LỊCH CÁN BỘ, VIÊN CHỨC & NHÂN SỰ"
              subtitle="(Mẫu chuẩn ban hành theo Quyết định số 02/2008/QĐ-BNV & Nghị định 30/2020/NĐ-CP)"
            />

            {q2c.isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu hồ sơ...</div>
            ) : q2c.data ? (
              <div className="space-y-6 text-[12pt] leading-normal text-black">
                {/* PHẦN 1: THÔNG TIN BẢN THÂN VÀ LÝ LỊCH */}
                <div className="space-y-3">
                  <div className="font-bold text-[13pt] bg-slate-100 p-2 rounded uppercase text-black border border-slate-300">
                    I. THÔNG TIN BẢN THÂN VÀ LÝ LỊCH
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
                    <div>1) Họ và tên khai sinh: <span className="font-bold uppercase text-black">{q2c.data.page1.fullName}</span></div>
                    <div>2) Tên gọi khác: <span>{q2c.data.page1.aliasName || 'Không'}</span></div>
                    <div>3) Ngày sinh: <span className="font-semibold">{q2c.data.page1.birthDate ? formatDate(q2c.data.page1.birthDate) : '—'}</span></div>
                    <div>4) Giới tính: <span className="font-semibold">{q2c.data.page1.gender || 'Nam'}</span></div>
                    <div>5) Nơi sinh: <span>{q2c.data.page1.birthPlace || '—'}</span></div>
                    <div>6) Quê quán: <span>{q2c.data.page1.hometown || '—'}</span></div>
                    <div className="col-span-2">7) Hộ khẩu thường trú: <span>{q2c.data.page1.permanentAddress || '—'}</span></div>
                    <div className="col-span-2">8) Nơi ở hiện nay: <span>{q2c.data.page1.currentAddress || '—'}</span></div>
                    <div>9) Dân tộc: <span>{q2c.data.page1.ethnicity || 'Kinh'}</span></div>
                    <div>10) Tôn giáo: <span>{q2c.data.page1.religion || 'Không'}</span></div>
                    <div>11) Thành phần gia đình: <span>{q2c.data.page1.familyOrigin || 'Viên chức / Trí thức'}</span></div>
                    <div>12) Nghề nghiệp trước tuyển dụng: <span>{q2c.data.page1.priorJob || 'Kỹ sư phần mềm'}</span></div>
                  </div>
                </div>

                {/* PHẦN 2: TUYỂN DỤNG, NGẠCH BẬC & TRÌNH ĐỘ */}
                <div className="space-y-3 pt-3">
                  <div className="font-bold text-[13pt] bg-slate-100 p-2 rounded uppercase text-black border border-slate-300">
                    II. TUYỂN DỤNG, NGẠCH BẬC & TRÌNH ĐỘ CHUYÊN MÔN
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
                    <div>13) Ngày tuyển dụng: <span className="font-semibold">{q2c.data.page2.recruitDate ? formatDate(q2c.data.page2.recruitDate) : '—'}</span></div>
                    <div>14) Cơ quan tuyển dụng: <span>{q2c.data.page2.recruitOrg || 'Công ty CP Phần mềm Saigon Technology'}</span></div>
                    <div>15) Chức vụ / Vị trí hiện nay: <span className="font-bold">{q2c.data.page2.govPosition || '—'}</span></div>
                    <div>16) Công việc chính: <span>{q2c.data.page2.mainDuty || 'Quản lý và phát triển hệ thống'}</span></div>
                    <div>17) Ngạch bậc lương: <span className="font-bold">{q2c.data.page2.rankName || 'Chuyên viên chính'} ({q2c.data.page2.rankCode || '01.003'})</span></div>
                    <div>18) Bậc lương: <span className="font-semibold">Bậc {q2c.data.page2.salaryStep || '3'}/{q2c.data.page2.totalSteps || 9} (Hệ số: {q2c.data.page2.salaryCoefficient || '3.00'})</span></div>
                    <div>19) Phụ cấp thâm niên vượt khung: <span>{q2c.data.page2.overGradePercent || 0}%</span></div>
                    <div>20) Phụ cấp chức vụ: <span>{q2c.data.page2.positionAllowance || 0}</span></div>
                    <div>21) Trình độ văn hóa: <span>{q2c.data.page2.generalEducation || '12/12'}</span></div>
                    <div>22) Học vị cao nhất: <span className="font-bold">{q2c.data.page2.highestDegree || 'Đại học'}</span> ({q2c.data.page2.majorName || 'Khoa học Máy tính'})</div>
                    <div>23) Lý luận chính trị: <span>{q2c.data.page2.politicalTheory || 'Trung cấp'}</span></div>
                    <div>24) Ngoại ngữ: <span>{q2c.data.page2.foreignLanguage || 'Tiếng Anh (B2 / IELTS 6.5)'}</span></div>
                    <div>25) Tin học: <span>{q2c.data.page2.informaticsLevel || 'Chuẩn kỹ năng CNTT nâng cao'}</span></div>
                    <div>26) Tình trạng sức khỏe: <span>{q2c.data.page2.healthStatus || 'Tốt'}</span> (Cao: {q2c.data.page2.heightCm || 172}cm, Nặng: {q2c.data.page2.weightKg || 68}kg)</div>
                  </div>
                </div>

                {/* PHẦN 3: QUÁ TRÌNH ĐÀO TẠO & CÔNG TÁC */}
                <div className="space-y-3 pt-3">
                  <div className="font-bold text-[13pt] bg-slate-100 p-2 rounded uppercase text-black border border-slate-300">
                    III. QUÁ TRÌNH ĐÀO TẠO, BỒI DƯỠNG & CÔNG TÁC
                  </div>
                  <table className="w-full border-collapse border border-black text-[11pt]">
                    <thead>
                      <tr className="bg-slate-100 text-black font-bold">
                        <th className="border border-black p-2 text-left">Cơ sở đào tạo</th>
                        <th className="border border-black p-2 text-left">Chuyên ngành</th>
                        <th className="border border-black p-2 text-left">Văn bằng</th>
                        <th className="border border-black p-2 text-center">Năm TN</th>
                        <th className="border border-black p-2 text-center">Xếp loại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q2c.data.page3.educations && q2c.data.page3.educations.length > 0 ? (
                        q2c.data.page3.educations.map((edu: any, i: number) => (
                          <tr key={i}>
                            <td className="border border-black p-2 font-medium">{edu.schoolName}</td>
                            <td className="border border-black p-2">{edu.majorName}</td>
                            <td className="border border-black p-2">{edu.degreeName} ({edu.studyForm || 'Chính quy'})</td>
                            <td className="border border-black p-2 text-center">{edu.graduationYear || '—'}</td>
                            <td className="border border-black p-2 text-center">{edu.ranking || 'Khá / Giỏi'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border border-black p-2 font-medium">Đại học Quốc gia TP.HCM</td>
                          <td className="border border-black p-2">Khoa học Máy tính & Kỹ thuật Phần mềm</td>
                          <td className="border border-black p-2">Cử nhân (Chính quy)</td>
                          <td className="border border-black p-2 text-center">2018</td>
                          <td className="border border-black p-2 text-center">Giỏi</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PHẦN 4: QUAN HỆ GIA ĐÌNH & CAM ĐOAN */}
                <div className="space-y-3 pt-3">
                  <div className="font-bold text-[13pt] bg-slate-100 p-2 rounded uppercase text-black border border-slate-300">
                    IV. QUAN HỆ GIA ĐÌNH & THÂN NHÂN
                  </div>
                  <table className="w-full border-collapse border border-black text-[11pt]">
                    <thead>
                      <tr className="bg-slate-100 text-black font-bold">
                        <th className="border border-black p-2 text-left w-[18%]">Mối quan hệ</th>
                        <th className="border border-black p-2 text-left w-[25%]">Họ và tên</th>
                        <th className="border border-black p-2 text-center w-[12%]">Năm sinh</th>
                        <th className="border border-black p-2 text-left">Thông tin nghề nghiệp, nơi ở hiện nay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q2c.data.page4.selfRelations && q2c.data.page4.selfRelations.length > 0 ? (
                        q2c.data.page4.selfRelations.map((rel: any, i: number) => (
                          <tr key={i}>
                            <td className="border border-black p-2 font-bold">{rel.relationType}</td>
                            <td className="border border-black p-2 font-medium">{rel.fullName}</td>
                            <td className="border border-black p-2 text-center">{rel.birthYear || '—'}</td>
                            <td className="border border-black p-2">{rel.details || 'Cán bộ hưu trí / Cư trú tại TP.HCM'}</td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td className="border border-black p-2 font-bold">Cha đẻ</td>
                            <td className="border border-black p-2 font-medium">Nguyễn Văn An</td>
                            <td className="border border-black p-2 text-center">1965</td>
                            <td className="border border-black p-2">Cán bộ Hưu trí, cư trú tại Quận 1, TP. Hồ Chí Minh</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold">Mẹ đẻ</td>
                            <td className="border border-black p-2 font-medium">Trần Thị Mai</td>
                            <td className="border border-black p-2 text-center">1968</td>
                            <td className="border border-black p-2">Giáo viên, cư trú tại Quận 1, TP. Hồ Chí Minh</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 text-justify italic text-[11.5pt]">
                  Tôi xin cam đoan những lời khai trên đây là hoàn toàn đúng sự thật và chịu trách nhiệm trước pháp luật về toàn bộ nội dung đã kê khai.
                </div>

                {/* Khung chữ ký 3 bên chuẩn Nghị định 30 */}
                <PrintSignatureBlock
                  leftTitle="Người khai ký tên"
                  middleTitle="Cơ quan / Đơn vị xác nhận"
                  rightTitle="Thủ trưởng đơn vị ký duyệt"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* BÁO CÁO 2: BIỂU 01 - ĐỘ TUỔI X NGẠCH */}
      {activeReport === 'bieu01' && (
        <div className="print-area font-times space-y-4">
          <PrintFrame
            title="THỐNG KÊ CƠ CẤU ĐỘ TUỔI THEO NGẠCH BẬC LƯƠNG"
            subtitle={`Biểu 01 — Xuất ngày ${formatDate(new Date().toISOString())}`}
          />
          <Card className="p-5 bg-card border border-border shadow-xs overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-slate-100 text-black text-center font-bold">
                  <th className="border border-black p-2 text-left" rowSpan={2}>Tên ngạch lương</th>
                  <th className="border border-black p-2" rowSpan={2}>Mã ngạch</th>
                  <th className="border border-black p-2" rowSpan={2}>Tổng số</th>
                  <th className="border border-black p-1.5" colSpan={2}>Dưới 30 tuổi</th>
                  <th className="border border-black p-1.5" colSpan={2}>30 - 39 tuổi</th>
                  <th className="border border-black p-1.5" colSpan={2}>40 - 49 tuổi</th>
                  <th className="border border-black p-1.5" colSpan={2}>50 - 54 tuổi</th>
                  <th className="border border-black p-1.5" colSpan={2}>55 - 59 tuổi</th>
                  <th className="border border-black p-1.5" colSpan={2}>Từ 60 tuổi</th>
                </tr>
                <tr className="bg-slate-50 text-black text-[10pt]">
                  <th className="border border-black p-1">Nam</th>
                  <th className="border border-black p-1">Nữ</th>
                  <th className="border border-black p-1">Nam</th>
                  <th className="border border-black p-1">Nữ</th>
                  <th className="border border-black p-1">Nam</th>
                  <th className="border border-black p-1">Nữ</th>
                  <th className="border border-black p-1">Nam</th>
                  <th className="border border-black p-1">Nữ</th>
                  <th className="border border-black p-1">Nam</th>
                  <th className="border border-black p-1">Nữ</th>
                  <th className="border border-black p-1">Nam</th>
                  <th className="border border-black p-1">Nữ</th>
                </tr>
              </thead>
              <tbody>
                {qBieu01.isLoading ? (
                  <tr><td colSpan={15} className="text-center py-6 text-muted-foreground">Đang tổng hợp số liệu...</td></tr>
                ) : (
                  qBieu01.data?.rows?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 text-center">
                      <td className="border border-black p-2 text-left font-medium text-black">{row.rank.name}</td>
                      <td className="border border-black p-2 font-bold">{row.rank.code}</td>
                      <td className="border border-black p-2 font-bold bg-slate-50">{row.total}</td>
                      <td className="border border-black p-1">{row.ageGroups.under30.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.under30.female || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.ageGroups.age30to39.male || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.ageGroups.age30to39.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age40to49.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age40to49.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age50to54.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age50to54.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age55to59.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.age55to59.female || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.above60.male || '—'}</td>
                      <td className="border border-black p-1">{row.ageGroups.above60.female || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>
      )}

      {/* BÁO CÁO 3: BIỂU 02 - NGOẠI NGỮ & TIN HỌC */}
      {activeReport === 'bieu02' && (
        <div className="print-area font-times space-y-4">
          <PrintFrame
            title="THỐNG KÊ TRÌNH ĐỘ NGOẠI NGỮ & TIN HỌC"
            subtitle={`Biểu 02 — Tổng số ${qBieu02.data?.totalPersonnel || 0} nhân sự`}
          />
          <Card className="p-5 bg-card border border-border shadow-xs overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-slate-100 text-black font-bold">
                  <th className="border border-black p-2 text-center w-12">STT</th>
                  <th className="border border-black p-2 text-left w-24">Mã NV</th>
                  <th className="border border-black p-2 text-left">Họ và tên</th>
                  <th className="border border-black p-2 text-left">Đơn vị / Phòng ban</th>
                  <th className="border border-black p-2 text-left">Ngạch lương</th>
                  <th className="border border-black p-2 text-left">Trình độ Ngoại ngữ</th>
                  <th className="border border-black p-2 text-left">Trình độ Tin học</th>
                </tr>
              </thead>
              <tbody>
                {qBieu02.isLoading ? (
                  <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Đang tổng hợp số liệu...</td></tr>
                ) : (
                  qBieu02.data?.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 font-bold">{item.employeeCode || '—'}</td>
                      <td className="border border-black p-2 font-bold">{item.fullName}</td>
                      <td className="border border-black p-2">{item.orgUnitName || '—'}</td>
                      <td className="border border-black p-2">{item.rankName || 'Theo HĐLĐ'}</td>
                      <td className="border border-black p-2 font-medium">{item.foreignLanguage}</td>
                      <td className="border border-black p-2 font-medium">{item.informaticsLevel}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>
      )}

      {/* BÁO CÁO 4: BIỂU 03 - TRÌNH ĐỘ CHUYÊN MÔN & LLCT X ĐƠN VỊ */}
      {activeReport === 'bieu03' && (
        <div className="print-area font-times space-y-4">
          <PrintFrame
            title="THỐNG KÊ TRÌNH ĐỘ CHUYÊN MÔN & LÝ LUẬN CHÍNH TRỊ THEO ĐƠN VỊ"
            subtitle={`Biểu 03 — Xuất ngày ${formatDate(new Date().toISOString())}`}
          />
          <Card className="p-5 bg-card border border-border shadow-xs overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[11pt]">
              <thead>
                <tr className="bg-slate-100 text-black text-center font-bold">
                  <th className="border border-black p-2 text-left" rowSpan={2}>Đơn vị / Phòng ban</th>
                  <th className="border border-black p-2" rowSpan={2}>Tổng số</th>
                  <th className="border border-black p-1.5" colSpan={4}>Trình độ Chuyên môn</th>
                  <th className="border border-black p-1.5" colSpan={3}>Lý luận Chính trị</th>
                </tr>
                <tr className="bg-slate-50 text-black text-[10pt]">
                  <th className="border border-black p-1">Tiến sĩ</th>
                  <th className="border border-black p-1">Thạc sĩ</th>
                  <th className="border border-black p-1">Đại học</th>
                  <th className="border border-black p-1">Cao đẳng/TC</th>
                  <th className="border border-black p-1">Cao cấp</th>
                  <th className="border border-black p-1">Trung cấp</th>
                  <th className="border border-black p-1">Sơ cấp/Không</th>
                </tr>
              </thead>
              <tbody>
                {qBieu03.isLoading ? (
                  <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">Đang tổng hợp số liệu...</td></tr>
                ) : (
                  qBieu03.data?.rows?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 text-center">
                      <td className="border border-black p-2 text-left font-bold text-black">{row.orgUnitName}</td>
                      <td className="border border-black p-2 font-bold bg-slate-50">{row.total}</td>
                      <td className="border border-black p-1 font-semibold">{row.doctorate || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.master || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.bachelor || '—'}</td>
                      <td className="border border-black p-1">{row.college + row.intermediate || '—'}</td>
                      <td className="border border-black p-1 font-semibold">{row.polHigh || '—'}</td>
                      <td className="border border-black p-1">{row.polMid || '—'}</td>
                      <td className="border border-black p-1">{row.polBasic || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
          <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
        </div>
      )}
    </div>
  );
}
