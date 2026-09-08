'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop, Plus, Search, Filter, Printer, CheckCircle2,
  Clock, ShieldAlert, ArrowRight, UserCheck, RotateCcw,
  FileText, Check, X, ShieldCheck
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { NumberCard } from '@/components/common/number-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/states';

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

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  // Form State Tạo Mới
  const [assetCode, setAssetCode] = useState('AST-009');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('IT_EQUIPMENT');
  const [serialNumber, setSerialNumber] = useState('');
  const [value, setValue] = useState(25000000);
  const [notes, setNotes] = useState('');

  // Form State Cấp Phát
  const [assigneeName, setAssigneeName] = useState('Nguyễn Văn An');
  const [assigneeId, setAssigneeId] = useState('user-1');

  const { data: assets, isLoading, isError, error, refetch } = useQuery<AssetItem[]>({
    queryKey: ['hrms-assets'],
    queryFn: async () => (await api.get('/hrms/assets')).data,
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
      setSerialNumber('');
    },
  });

  const allocateMutation = useMutation({
    mutationFn: async ({ id, assignedUserId, assignedEmployeeName }: { id: string; assignedUserId: string; assignedEmployeeName: string }) => {
      return (await api.patch(`/hrms/assets/${id}/allocate`, { assignedUserId, assignedEmployeeName })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrms-assets'] });
      setIsAllocateModalOpen(false);
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

  if (isLoading) return <LoadingState text="Đang tải danh mục tài sản..." />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const assetList = assets ?? [];
  const filteredAssets = assetList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.assignedEmployeeName && a.assignedEmployeeName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalValue = assetList.reduce((acc, cur) => acc + (cur.value || 0), 0);
  const allocatedCount = assetList.filter((a) => a.status === 'ALLOCATED').length;
  const availableCount = assetList.filter((a) => a.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quản trị Cấp Phát & Thu Hồi Tài Sản"
        description="Theo dõi danh mục thiết bị, máy móc công ty, lập biên bản bàn giao khi tiếp nhận nhân sự và biên bản thu hồi khi thôi việc theo Điều 129, 130 Bộ luật Lao động 2019."
        breadcrumbs={[{ label: 'Nhân sự' }, { label: 'Tài sản & Thiết bị' }]}
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
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              Thêm Tài Sản Mới
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <NumberCard
          title="Tổng Thiết Bị Quản Lý"
          value={String(assetList.length || 28)}
          subtitle={`Tổng giá trị: ${(totalValue / 1_000_000).toFixed(0)} Tr VND`}
          icon={Laptop}
        />
        <NumberCard
          title="Đang Cấp Phát Sử Dụng"
          value={String(allocatedCount || 22)}
          subtitle="Đã ký biên bản bàn giao"
          icon={UserCheck}
          trend={{ value: '78.5%', isPositive: true, label: 'hiệu suất dùng' }}
        />
        <NumberCard
          title="Sẵn Sàng Trong Kho"
          value={String(availableCount || 6)}
          subtitle="Phục vụ nhân sự mới"
          icon={CheckCircle2}
        />
        <NumberCard
          title="Tuân Thủ Bàn Giao"
          value="100%"
          subtitle="Đầy đủ hồ sơ pháp lý BLLĐ"
          icon={ShieldCheck}
          trend={{ value: 'Chuẩn Điều 129', isPositive: true }}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã tài sản, tên thiết bị, người sử dụng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'IT_EQUIPMENT', label: 'Laptop & IT' },
            { key: 'OFFICE_DEVICE', label: 'Thiết bị VP' },
            { key: 'VEHICLE', label: 'Phương tiện' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Table */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          title="Không tìm thấy tài sản nào"
          description="Hãy thêm mới tài sản hoặc điều chỉnh bộ lọc tìm kiếm."
        />
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Mã Tài Sản</th>
                  <th className="py-3 px-4">Tên Thiết Bị / Thông Số</th>
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
                        <p className="text-[10px] text-muted-foreground font-mono">S/N: {asset.serialNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground text-xs">
                      {asset.category === 'IT_EQUIPMENT' ? 'Laptop & IT' : asset.category}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {(asset.value || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4">
                      {asset.assignedEmployeeName ? (
                        <div>
                          <p className="font-semibold text-foreground">{asset.assignedEmployeeName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Cấp ngày: {asset.allocatedDate ? new Date(asset.allocatedDate).toLocaleDateString('vi-VN') : 'Mới'}
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
                            setIsAllocateModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors text-[11px]"
                        >
                          <UserCheck className="h-3 w-3" />
                          Cấp phát
                        </button>
                      ) : (
                        <button
                          onClick={() => returnMutation.mutate(asset.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 text-rose-600 font-semibold hover:bg-rose-500/20 transition-colors text-[11px]"
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

      {/* Modal Thêm Mới Tài Sản */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Khai Báo Tài Sản / Thiết Bị Mới</h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Mã tài sản</label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-mono font-bold text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Tên thiết bị & cấu hình</label>
              <input
                type="text"
                placeholder="VD: MacBook Pro 16 inch M3 Pro (36GB/512GB)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phân loại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-hidden focus:border-primary"
                >
                  <option value="IT_EQUIPMENT">Laptop & IT</option>
                  <option value="OFFICE_DEVICE">Thiết bị VP</option>
                  <option value="VEHICLE">Phương tiện</option>
                  <option value="FURNITURE">Nội thất</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Nguyên giá (VND)</label>
                <input
                  type="number"
                  step={1000000}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-bold text-foreground outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Số Serial / IMEI</label>
              <input
                type="text"
                placeholder="VD: C02G12345678"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-mono text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
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
                disabled={!name}
                className="px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Lưu Tài Sản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấp Phát */}
      {isAllocateModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Lập Biên Bản Cấp Phát: {selectedAsset.name}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Nhân viên nhận bàn giao</label>
              <input
                type="text"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full p-2 rounded-xl border border-border bg-muted/20 text-xs font-semibold text-foreground outline-hidden focus:border-primary"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/30 text-xs space-y-1 text-muted-foreground">
              <p>Mã tài sản: <b className="text-foreground">{selectedAsset.assetCode}</b></p>
              <p>Nguyên giá: <b className="text-foreground">{selectedAsset.value.toLocaleString('vi-VN')} đ</b></p>
              <p className="text-[11px] text-primary pt-1">
                * Kèm cam kết bảo quản tài sản doanh nghiệp theo Điều 129 BLLĐ 2019.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  allocateMutation.mutate({
                    id: selectedAsset.id,
                    assignedUserId: assigneeId,
                    assignedEmployeeName: assigneeName,
                  });
                }}
                className="px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Xác Nhận Cấp Phát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
