'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Eye, PencilLine, Plus, Trash2, CheckCircle2, ShieldCheck, GraduationCap,
  Award, HeartHandshake, BookOpen, Clock, Users, Building, ChevronRight, X, Printer,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge, Button, Card, Input } from '@/components/ui/primitives';
import { DataTable, type DataColumn, type RowActionItem } from '@/components/ui/data-table';
import { PageHeader, ErrorState } from '@/components/common/states';
import { PrintFrame, PrintSignatureBlock } from '@/components/ui/print';

interface ComprehensiveProfileRow {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    employeeCode: string | null;
    jobTitle: string | null;
    hireDate: string | null;
    orgUnit?: { name: string; code: string } | null;
  };
  gender: string | null;
  rankCode: string | null;
  rank?: { name: string; groupCode: string; totalSteps: number } | null;
  salaryStep: number | null;
  salaryCoefficient: number | null;
  highestDegree: string | null;
  politicalTheory: string | null;
  ethnicity: string | null;
  idCardNo: string | null;
  govPosition: string | null;
}

export default function PersonnelProfilesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'salary' | 'education' | 'work' | 'family' | 'rewards'>('info');
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch danh sách hồ sơ toàn diện
  const qList = useQuery({
    queryKey: ['personnel-profiles'],
    queryFn: async () => {
      const res = await api.get('/personnel-profiles?limit=100');
      return (res.data.items || res.data) as ComprehensiveProfileRow[];
    },
  });

  // Fetch chi tiết 1 hồ sơ khi mở modal
  const qDetail = useQuery({
    queryKey: ['personnel-profile-detail', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const res = await api.get(`/personnel-profiles/${selectedUserId}`);
      setEditFormData(res.data);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  // Save profile changes
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!selectedUserId) return;
      return api.patch(`/personnel-profiles/${selectedUserId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['personnel-profile-detail', selectedUserId] });
      alert('Đã cập nhật hồ sơ thành công!');
    },
    onError: (err) => {
      alert('Lỗi cập nhật: ' + errorMessage(err));
    },
  });

  const columns: DataColumn<ComprehensiveProfileRow>[] = [
    {
      key: 'employeeCode',
      header: 'Mã nhân sự',
      sortable: true,
      className: 'w-[10%] text-center',
      exportValue: (r) => r.user.employeeCode || '',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {r.user.employeeCode || '—'}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Họ và tên',
      sortable: true,
      className: 'w-[18%]',
      exportValue: (r) => r.user.fullName,
      render: (r) => (
        <div>
          <span className="font-semibold text-foreground hidden print:inline">{r.user.fullName}</span>
          <button
            type="button"
            onClick={() => setSelectedUserId(r.userId)}
            className="font-semibold text-primary hover:underline text-left block no-print"
          >
            {r.user.fullName}
          </button>
          <span className="text-xs text-muted-foreground block no-print">{r.user.email}</span>
        </div>
      ),
    },
    {
      key: 'orgUnit',
      header: 'Đơn vị / Phòng ban',
      sortable: true,
      className: 'w-[18%]',
      exportValue: (r) => r.user.orgUnit?.name || '—',
      render: (r) => r.user.orgUnit?.name || '—',
    },
    {
      key: 'govPosition',
      header: 'Chức danh / Vị trí',
      className: 'w-[17%]',
      exportValue: (r) => r.govPosition || r.user.jobTitle || '—',
      render: (r) => r.govPosition || r.user.jobTitle || '—',
    },
    {
      key: 'rank',
      header: 'Ngạch bậc lương',
      className: 'w-[13%]',
      exportValue: (r) => (r.rank ? `${r.rank.name} (Bậc ${r.salaryStep}/${r.rank.totalSteps})` : 'Theo hợp đồng'),
      render: (r) =>
        r.rank ? (
          <div>
            <Badge variant="info">
              {r.rank.name}
            </Badge>
            <div className="text-xs text-muted-foreground mt-0.5 no-print">
              Bậc {r.salaryStep}/{r.rank.totalSteps} (HS: {r.salaryCoefficient})
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Theo hợp đồng</span>
        ),
    },
    {
      key: 'highestDegree',
      header: 'Trình độ chuyên môn',
      className: 'w-[12%]',
      exportValue: (r) => r.highestDegree || '—',
      render: (r) => r.highestDegree || '—',
    },
    {
      key: 'politicalTheory',
      header: 'Lý luận chính trị',
      className: 'w-[12%] text-center',
      exportValue: (r) => r.politicalTheory || 'Không',
      render: (r) => (
        <Badge variant={r.politicalTheory === 'Cao cấp' ? 'warning' : 'secondary'}>
          {r.politicalTheory || 'Không'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Hồ sơ Toàn diện & Quá trình Lịch sử"
        description="Quản lý 111 thuộc tính dữ liệu lý lịch chuẩn hóa và 8 bảng quá trình biến động lịch sử (Lương, Bổ nhiệm, Đào tạo, Công tác, Khen thưởng, Gia đình)."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/personnel-reports')}
              className="flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-primary" />
              Trung tâm Báo cáo & In 4 trang
            </Button>
          </div>
        }
      />

      <div className="print-area">
        <PrintFrame
          title="DANH SÁCH HỒ SƠ NHÂN SỰ TOÀN DIỆN"
          subtitle={`Tổng số ${qList.data?.length || 0} hồ sơ chuẩn hóa`}
        />

        {qList.isError ? (
          <ErrorState message={errorMessage(qList.error)} onRetry={() => qList.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            rows={qList.data || []}
            rowKey={(r) => r.id}
            loading={qList.isLoading}
            exportFilename="ho-so-nhan-su-toan-dien"
            printLabel="In danh sách"
            searchFields={(r) => [
              r.user.fullName,
              r.user.email,
              r.user.employeeCode || '',
              r.govPosition || '',
              r.user.orgUnit?.name || '',
              r.rank?.name || '',
              r.highestDegree || '',
            ]}
            filters={[
              {
                key: 'groupCode',
                label: 'Nhóm ngạch',
                value: (r) => r.rank?.groupCode || 'Khác',
                options: [
                  { value: 'A3', label: 'Nhóm A3 (Cao cấp)' },
                  { value: 'A2', label: 'Nhóm A2 (Chính)' },
                  { value: 'A1', label: 'Nhóm A1 (Chuyên viên/Kỹ sư)' },
                  { value: 'B', label: 'Nhóm B (Cán sự)' },
                  { value: 'C', label: 'Nhóm C (Nhân viên)' },
                  { value: 'Khác', label: 'Khác / HĐLĐ' },
                ],
              },
            ]}
            emptyTitle="Chưa có hồ sơ nhân sự toàn diện"
            actions={(r): RowActionItem[] => [
              {
                label: 'Xem & Chỉnh sửa hồ sơ chi tiết',
                icon: PencilLine,
                onSelect: () => setSelectedUserId(r.userId),
              },
              {
                label: 'Xem Sơ yếu lý lịch 4 trang',
                icon: Eye,
                onSelect: () => router.push(`/personnel-reports?userId=${r.userId}`),
              },
            ]}
          />
        )}

        <PrintSignatureBlock leftTitle="Người lập bảng" middleTitle="Trưởng phòng Tổ chức - Nhân sự" rightTitle="Thủ trưởng đơn vị" />
      </div>

      {/* Modal Drawer Chi tiết Hồ sơ 111 trường */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {qDetail.data?.user?.fullName?.charAt(0) || 'H'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {qDetail.data?.user?.fullName || 'Đang tải hồ sơ...'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Mã số: <span className="font-semibold text-slate-700">{qDetail.data?.user?.employeeCode || '—'}</span> • {qDetail.data?.user?.jobTitle || 'Chuyên viên'} • {qDetail.data?.user?.orgUnit?.name || 'Đơn vị'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/personnel-reports?userId=${selectedUserId}`)}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> In 4 trang
                </Button>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto gap-2 py-2">
              {[
                { id: 'info', label: '1. Cá nhân & Định danh', icon: FileText },
                { id: 'salary', label: '2. Tuyển dụng & Ngạch lương', icon: Award },
                { id: 'education', label: '3. Đào tạo & Bồi dưỡng', icon: GraduationCap },
                { id: 'work', label: '4. Quá trình Công tác', icon: Clock },
                { id: 'family', label: '5. Quan hệ Gia đình', icon: Users },
                { id: 'rewards', label: '6. Khen thưởng & Kỷ luật', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                      active ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {qDetail.isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu hồ sơ...</div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {/* TAB 1: CÁ NHÂN & ĐỊNH DANH */}
                  {activeTab === 'info' && (
                    <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Thông tin Định danh & Lý lịch
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Tên gọi khác</label>
                          <Input
                            value={editFormData.aliasName || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, aliasName: e.target.value })}
                            placeholder="Không"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Giới tính</label>
                          <select
                            value={editFormData.gender || 'Nam'}
                            onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Nơi sinh</label>
                          <Input
                            value={editFormData.birthPlace || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, birthPlace: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Quê quán</label>
                          <Input
                            value={editFormData.hometown || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, hometown: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium text-slate-600 mb-1 block">Hộ khẩu thường trú</label>
                          <Input
                            value={editFormData.permanentAddress || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium text-slate-600 mb-1 block">Nơi ở hiện nay</label>
                          <Input
                            value={editFormData.currentAddress || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, currentAddress: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Số CCCD / CMND</label>
                          <Input
                            value={editFormData.idCardNo || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, idCardNo: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Nơi cấp CCCD</label>
                          <Input
                            value={editFormData.idCardIssuePlace || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, idCardIssuePlace: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Dân tộc</label>
                          <Input
                            value={editFormData.ethnicity || 'Kinh'}
                            onChange={(e) => setEditFormData({ ...editFormData, ethnicity: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Tôn giáo</label>
                          <Input
                            value={editFormData.religion || 'Không'}
                            onChange={(e) => setEditFormData({ ...editFormData, religion: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Tình trạng sức khỏe</label>
                          <Input
                            value={editFormData.healthStatus || 'Tốt'}
                            onChange={(e) => setEditFormData({ ...editFormData, healthStatus: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Nhóm máu</label>
                          <Input
                            value={editFormData.bloodType || 'O'}
                            onChange={(e) => setEditFormData({ ...editFormData, bloodType: e.target.value })}
                          />
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* TAB 2: TUYỂN DỤNG & NGẠCH LƯƠNG */}
                  {activeTab === 'salary' && (
                    <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> Tuyển dụng, Ngạch bậc Lương & Phụ cấp
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Mã ngạch lương</label>
                          <Input
                            value={editFormData.rankCode || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, rankCode: e.target.value })}
                            placeholder="Ví dụ: 01.003, 13.095..."
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Tên ngạch lương</label>
                          <Input value={editFormData.rank?.name || 'Chuyên viên / Kỹ sư'} disabled className="bg-slate-100" />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Bậc lương hiện hưởng (1..16)</label>
                          <Input
                            type="number"
                            value={editFormData.salaryStep || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, salaryStep: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Hệ số lương</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editFormData.salaryCoefficient || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, salaryCoefficient: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Phụ cấp thâm niên vượt khung (%)</label>
                          <Input
                            type="number"
                            value={editFormData.overGradePercent || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, overGradePercent: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Phụ cấp chức vụ (Hệ số)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editFormData.positionAllowance || 0}
                            onChange={(e) => setEditFormData({ ...editFormData, positionAllowance: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Trình độ văn hóa</label>
                          <Input
                            value={editFormData.generalEducation || '12/12'}
                            onChange={(e) => setEditFormData({ ...editFormData, generalEducation: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Học vị cao nhất</label>
                          <Input
                            value={editFormData.highestDegree || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, highestDegree: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Lý luận chính trị</label>
                          <Input
                            value={editFormData.politicalTheory || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, politicalTheory: e.target.value })}
                            placeholder="Cử nhân / Cao cấp / Trung cấp / Sơ cấp"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 mb-1 block">Ngoại ngữ chính</label>
                          <Input
                            value={editFormData.foreignLanguage || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, foreignLanguage: e.target.value })}
                          />
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* TAB 3: ĐÀO TẠO & BỒI DƯỠNG */}
                  {activeTab === 'education' && (
                    <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-primary" /> Quá trình Đào tạo, Bồi dưỡng Chuyên môn
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {qDetail.data?.educations?.length === 0 ? (
                          <div className="text-center py-6 text-xs text-muted-foreground">Chưa có bản ghi đào tạo</div>
                        ) : (
                          qDetail.data?.educations?.map((edu: any) => (
                            <div key={edu.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                              <div>
                                <div className="font-bold text-slate-800">{edu.schoolName}</div>
                                <div className="text-muted-foreground mt-0.5">
                                  Chuyên ngành: <span className="text-slate-700 font-medium">{edu.majorName}</span> • Văn bằng: <span className="text-primary font-medium">{edu.degreeName}</span> ({edu.studyForm})
                                </div>
                              </div>
                              <span className="font-mono text-slate-600 bg-white px-2 py-1 rounded border">
                                Năm TN: {edu.graduationYear || '—'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  )}

                  {/* TAB 4: QUÁ TRÌNH CÔNG TÁC */}
                  {activeTab === 'work' && (
                    <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Quá trình Công tác & Bổ nhiệm Chức vụ
                      </h3>
                      <div className="space-y-3">
                        {qDetail.data?.appointments?.map((app: any) => (
                          <div key={app.id} className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 text-xs flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-900">{app.positionTitle}</div>
                              <div className="text-muted-foreground mt-0.5">
                                Đơn vị: {app.orgUnitName} • Số QĐ: {app.decisionNo || '—'}
                              </div>
                            </div>
                            <Badge variant={app.isCurrent ? 'success' : 'secondary'}>
                              {app.isCurrent ? 'Đang giữ chức vụ' : 'Đã miễn nhiệm'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* TAB 5: QUAN HỆ GIA ĐÌNH */}
                  {activeTab === 'family' && (
                    <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> Quan hệ Gia đình (Bản thân & Bên Vợ/Chồng)
                      </h3>
                      <div className="space-y-3">
                        {qDetail.data?.familyRelations?.length === 0 ? (
                           <div className="text-center py-6 text-xs text-muted-foreground">Chưa có thông tin quan hệ gia đình</div>
                        ) : (
                          qDetail.data?.familyRelations?.map((rel: any) => (
                            <div key={rel.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-primary mr-2">[{rel.relationType}]</span>
                                <span className="font-semibold text-slate-800">{rel.fullName}</span>
                                <span className="text-muted-foreground ml-2">({rel.birthYear || '—'})</span>
                                <div className="text-slate-600 mt-1">{rel.details || '—'}</div>
                              </div>
                              <Badge variant="secondary">
                                {rel.category === 'SELF' ? 'Gia đình bản thân' : 'Bên Vợ/Chồng'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  )}

                  {/* TAB 6: KHEN THƯỞNG & KỶ LUẬT */}
                  {activeTab === 'rewards' && (
                    <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-sm">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" /> Lịch sử Khen thưởng, Kỷ luật & Đánh giá
                      </h3>
                      <div className="space-y-3">
                        {qDetail.data?.rewardDisciplines?.length === 0 ? (
                          <div className="text-center py-6 text-xs text-muted-foreground">Chưa có hồ sơ khen thưởng / kỷ luật</div>
                        ) : (
                          qDetail.data?.rewardDisciplines?.map((rd: any) => (
                            <div key={rd.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs flex justify-between items-center">
                              <div>
                                <div className="font-bold text-slate-900">{rd.title}</div>
                                <div className="text-muted-foreground mt-0.5">
                                  Ngày: {formatDate(rd.eventDate)} • QĐ: {rd.decisionNo || '—'} • Cơ quan ký: {rd.issuingAuthority || '—'}
                                </div>
                              </div>
                              <Badge variant={rd.type === 'REWARD' ? 'success' : 'destructive'}>
                                {rd.type === 'REWARD' ? 'Khen thưởng' : 'Kỷ luật'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Tự động đồng bộ chuẩn hóa Unicode UTF-8 & PostgreSQL
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                  Đóng
                </Button>
                <Button
                  onClick={() => saveMutation.mutate(editFormData)}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
