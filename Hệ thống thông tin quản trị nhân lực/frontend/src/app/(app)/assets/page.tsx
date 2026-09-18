'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop, Plus, Search, Filter, Printer, CheckCircle2,
  Clock, ShieldAlert, ArrowRight, UserCheck, RotateCcw,
  FileText, Check, X, ShieldCheck, Building2
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';
import { Button, Input, Select } from '@/components/ui/primitives';

interface AssetItem {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  assignedUserId?: string;
  assignedEmployeeName?: string;
  allocatedDate?: string;
  returnedDate?: string;
  status: 'AVAILABLE' | 'ALLOCATED' | 'MAINTENANCE' | 'DISPOSED';
  condition: string;
  value: number;
  notes?: string;
  createdAt: string;
}

interface EmployeeOption {
  id: string;
  fullName: string;
  employeeCode: string | null;
  orgUnit?: { name: string } | null;
  jobTitle?: string | null;
}

/**
 * Danh mục phân loại tài sản chuẩn, bao quát cả:
 * - Đơn vị sự nghiệp công lập / Cơ quan Nhà nước (Thông tư 23/2023/TT-BTC)
 * - Doanh nghiệp / Tập đoàn kinh tế (Thông tư 45/2013/TT-BTC)
 */
const ASSET_CATEGORIES: { key: string; label: string; desc: string }[] = [
  { key: 'ALL', label: 'Tất cả phân loại', desc: 'Toàn bộ danh mục' },
  { key: 'REAL_ESTATE', label: 'Trụ sở, nhà làm việc & công trình', desc: 'Nhà làm việc, giảng đường, hội trường, phòng thí nghiệm (TT 23)' },
  { key: 'SPECIALIZED', label: 'Máy móc, thiết bị chuyên dùng', desc: 'Thiết bị y tế, nghiên cứu, thực hành, sản xuất chuyên ngành' },
  { key: 'VEHICLE', label: 'Phương tiện vận tải & xe công tác', desc: 'Xe ô tô phục vụ công tác, xe chuyên dùng' },
  { key: 'OFFICE_DEVICE', label: 'Thiết bị văn phòng', desc: 'Máy in, máy scan, photocopy, máy fax' },
  { key: 'IT_EQUIPMENT', label: 'Thiết bị CNTT & Máy tính', desc: 'Máy tính để bàn, laptop, máy chủ, hạ tầng mạng' },
  { key: 'FURNITURE', label: 'Bàn ghế, tủ & trang thiết bị nội thất', desc: 'Bàn ghế làm việc, tủ tài liệu, nội thất văn phòng' },
  { key: 'INTANGIBLE', label: 'Tài sản cố định vô hình', desc: 'Phần mềm chuyên dụng, bản quyền, quyền sử dụng đất' },
  { key: 'TOOLS', label: 'Công cụ, dụng cụ làm việc', desc: 'Công cụ lao động phân bổ' },
];

const ASSET_CATEGORY_LABEL: Record<string, string> = {
  REAL_ESTATE: 'Trụ sở & Công trình',
  SPECIALIZED: 'Thiết bị chuyên dùng',
  VEHICLE: 'Phương tiện vận tải',
  OFFICE_DEVICE: 'Thiết bị văn phòng',
  IT_EQUIPMENT: 'Thiết bị CNTT & Máy tính',
  'Laptop & IT': 'Thiết bị CNTT & Máy tính',
  FURNITURE: 'Bàn ghế & Nội thất',
  INTANGIBLE: 'Tài sản vô hình',
  TOOLS: 'Công cụ dụng cụ',
};

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  // Form State Tạo Mới
  const [assetCode, setAssetCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('IT_EQUIPMENT');
  const [serialNumber, setSerialNumber] = useState('');
  const [value, setValue] = useState<number>(10000000);
  const [notes, setNotes] = useState('');

  // Form State Cấp Phát (liên kết nhân viên thực tế)
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeName, setAssigneeName] = useState('');

  const { data: assets, isLoading, isError, error, refetch } = useQuery<AssetItem[]>({
    queryKey: ['hrms-assets'],
    queryFn: async () => (await api.get('/hrms/assets')).data,
  });

  const { data: employeeList } = useQuery<EmployeeOption[]>({
    queryKey: ['employees-for-assets'],
    queryFn: async () => (await api.get('/employees')).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      assetCode: string;
      name: string;
      category: string;
      serialNumber: string;
      value: number;
      notes: string;
    }) => {
      return (await api.post('/hrms/assets', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-assets'] });
      setIsCreateModalOpen(false);
      setName('');
      setAssetCode('');
      setSerialNumber('');
      setNotes('');
    },
  });

  const allocateMutation = useMutation({
    mutationFn: async ({ id, assignedUserId, assignedEmployeeName }: { id: string; assignedUserId: string; assignedEmployeeName: string }) => {
      return (await api.patch(`/hrms/assets/${id}/allocate`, { assignedUserId, assignedEmployeeName })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-assets'] });
      setIsAllocateModalOpen(false);
      setAssigneeId('');
      setAssigneeName('');
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.patch(`/hrms/assets/${id}/return`, {})).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-assets'] });
    },
  });

  if (isLoading) return <LoadingState text="Đang tải danh mục tài sản & thiết bị..." />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const assetList = assets ?? [];
  const filteredAssets = assetList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.assignedEmployeeName && a.assignedEmployeeName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesCategory = false;
    if (selectedCategory === 'ALL') {
      matchesCategory = true;
    } else if (selectedCategory === 'IT_EQUIPMENT') {
      matchesCategory = a.category === 'IT_EQUIPMENT' || a.category === 'Laptop & IT';
    } else {
      matchesCategory = a.category === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  const totalValue = assetList.reduce((acc, cur) => acc + (cur.value || 0), 0);
  const allocatedCount = assetList.filter((a) => a.status === 'ALLOCATED').length;
  const availableCount = assetList.filter((a) => a.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Tài sản"
        description="Theo dõi danh mục tài sản, trụ sở, máy móc, thiết bị; lập biên bản bàn giao và thu hồi khi luân chuyển."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Tài sản' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              In Biên Bản Bàn Giao
            </button>
            <button
              onClick={() => {
                const nextNum = (assetList.length + 1).toString().padStart(3, '0');
                setAssetCode(`AST-${nextNum}`);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              Khai Báo Tài Sản Mới
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NumberCard
          title="Tổng Tài Sản Quản Lý"
          value={String(assetList.length || 0)}
          subtitle={`Tổng nguyên giá: ${(totalValue / 1_000_000).toFixed(0)} Tr VND`}
          icon={Building2}
        />
        <NumberCard
          title="Đang Cấp Phát Sử Dụng"
          value={String(allocatedCount || 0)}
          subtitle="Đã ký biên bản tiếp nhận"
          icon={UserCheck}
          trend={{ value: `${assetList.length ? Math.round((allocatedCount / assetList.length) * 100) : 0}%`, isPositive: true, label: 'tỷ lệ sử dụng' }}
        />
        <NumberCard
          title="Sẵn Sàng Trong Kho"
          value={String(availableCount || 0)}
          subtitle="Sẵn sàng cấp phát nhân sự mới"
          icon={CheckCircle2}
        />
        <NumberCard
          title="Tuân Thủ Bàn Giao"
          value="100%"
          subtitle="Đầy đủ biên bản bàn giao & thu hồi"
          icon={ShieldCheck}
          trend={{ value: 'Đồng bộ hồ sơ', isPositive: true }}
        />
      </div>

      {/* Filter & Search Bar — Bao quát và chuyên nghiệp */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã tài sản, tên thiết bị, người sử dụng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-[180px] text-xs"
          >
            {ASSET_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Assets Table */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tài sản nào"
          description="Hãy thêm mới tài sản hoặc điều chỉnh bộ lọc tìm kiếm."
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Mã Tài Sản</th>
                  <th className="py-3 px-4">Tên Tài Sản / Thiết Bị</th>
                  <th className="py-3 px-4">Phân Loại</th>
                  <th className="py-3 px-4 text-right">Nguyên Giá (VND)</th>
                  <th className="py-3 px-4">Người Đang Sử Dụng</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {asset.assetCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{asset.name}</p>
                      {asset.serialNumber && (
                        <p className="text-xs text-muted-foreground font-mono">Số hiệu / S/N: {asset.serialNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground text-xs">
                      {ASSET_CATEGORY_LABEL[asset.category] || asset.category}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {(asset.value || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4">
                      {asset.assignedEmployeeName ? (
                        <div>
                          <p className="font-semibold text-foreground">{asset.assignedEmployeeName}</p>
                          <p className="text-xs text-muted-foreground">
                            Cấp ngày: {asset.allocatedDate ? new Date(asset.allocatedDate).toLocaleDateString('vi-VN') : 'Gần đây'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Trong kho</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            asset.status === 'ALLOCATED'
                              ? 'bg-blue-600'
                              : asset.status === 'AVAILABLE'
                              ? 'bg-emerald-600'
                              : 'bg-amber-600'
                          }`}
                        />
                        {asset.status === 'ALLOCATED' ? 'Đang cấp phát' : asset.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo trì'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {asset.status === 'AVAILABLE' ? (
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setAssigneeId('');
                            setAssigneeName('');
                            setIsAllocateModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors text-xs"
                        >
                          <UserCheck className="h-3 w-3" />
                          Cấp phát
                        </button>
                      ) : (
                        <button
                          onClick={() => returnMutation.mutate(asset.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 font-semibold hover:bg-rose-500/20 transition-colors text-xs"
                          title="Thu hồi về kho"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Khai Báo Tài Sản Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">Khai Báo Tài Sản / Thiết Bị Mới</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mã tài sản <span className="text-destructive">*</span></label>
              <Input
                type="text"
                placeholder="VD: AST-010"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="h-9 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tên tài sản / Thông số kỹ thuật <span className="text-destructive">*</span></label>
              <Input
                type="text"
                placeholder="VD: Máy in Laser Đa năng / Bàn làm việc chữ L / Máy chiếu hội trường"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Phân loại tài sản</label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 text-xs"
                >
                  {ASSET_CATEGORIES.filter((c) => c.key !== 'ALL').map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Nguyên giá (VND)</label>
                <Input
                  type="number"
                  step={500000}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="h-9 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Số hiệu / Số Serial / Biển số</label>
              <Input
                type="text"
                placeholder="VD: SN-2026-X88 hoặc 51K-892.45"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Ghi chú xuất xứ / Tình trạng</label>
              <Input
                type="text"
                placeholder="VD: Mua sắm theo gói thầu 2026 / Mới 100%"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  createMutation.mutate({
                    assetCode,
                    name,
                    category,
                    serialNumber,
                    value,
                    notes,
                  });
                }}
                disabled={!name || !assetCode}
              >
                Lưu Khai Báo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấp Phát — Liên kết trực tiếp với Nhân sự thực tế trong hệ thống */}
      {isAllocateModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Lập Biên Bản Cấp Phát & Bàn Giao
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Tài sản: {selectedAsset.assetCode} — {selectedAsset.name}
                </p>
              </div>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nhân sự tiếp nhận bàn giao <span className="text-destructive">*</span>
              </label>
              <Select
                value={assigneeId}
                onChange={(e) => {
                  const emp = employeeList?.find((u) => u.id === e.target.value);
                  setAssigneeId(e.target.value);
                  setAssigneeName(emp?.fullName || '');
                }}
                className="w-full text-xs"
              >
                <option value="">-- Chọn nhân sự trong danh sách hệ thống --</option>
                {employeeList?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} {emp.employeeCode ? `(${emp.employeeCode})` : ''} {emp.orgUnit?.name ? `— ${emp.orgUnit.name}` : ''}
                  </option>
                ))}
              </Select>
              {!assigneeId && (
                <p className="text-xs text-amber-600 mt-1">
                  * Bắt buộc chọn nhân viên thực tế từ cơ sở dữ liệu để liên kết trách nhiệm quản lý tài sản.
                </p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-muted/30 text-xs space-y-1 text-muted-foreground">
              <p>Mã tài sản: <b className="text-foreground">{selectedAsset.assetCode}</b></p>
              <p>Phân loại: <b className="text-foreground">{ASSET_CATEGORY_LABEL[selectedAsset.category] || selectedAsset.category}</b></p>
              <p>Nguyên giá: <b className="text-foreground">{selectedAsset.value.toLocaleString('vi-VN')} đ</b></p>
              <p className="text-xs text-primary pt-1">
                * Kèm cam kết bảo quản tài sản cơ quan/doanh nghiệp, chịu trách nhiệm bồi hoàn khi làm mất mát hoặc hư hỏng.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAllocateModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!assigneeId || !assigneeName) return;
                  allocateMutation.mutate({
                    id: selectedAsset.id,
                    assignedUserId: assigneeId,
                    assignedEmployeeName: assigneeName,
                  });
                }}
                disabled={!assigneeId}
                className="px-4 py-2 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Xác Nhận Bàn Giao
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
