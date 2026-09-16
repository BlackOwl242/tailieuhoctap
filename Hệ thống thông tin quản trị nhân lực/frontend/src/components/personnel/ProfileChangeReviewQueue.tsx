'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check, X, Eye, FileText, Search, ArrowRight, User, Building2,
  Calendar, Filter
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/primitives';

interface ChangeRequestItem {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    employeeCode: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
    orgUnit?: { id: string; name: string; code: string } | null;
  };
  changes: Record<
    string,
    { label: string; oldValue: any; newValue: any; tier: number }
  >;
  reason: string;
  attachmentUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewerId: string | null;
  reviewer?: { id: string; fullName: string; email: string } | null;
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export function ProfileChangeReviewQueue() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequestItem | null>(null);

  // Modal từ chối
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  const { data, isLoading } = useQuery<{
    items: ChangeRequestItem[];
    total: number;
    pendingCount: number;
  }>({
    queryKey: ['profile-change-requests', filterStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);
      if (searchQuery) params.set('q', searchQuery);
      const res = await api.get(`/profile-change-requests?${params.toString()}`);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      return (await api.post(`/profile-change-requests/${id}/approve`, { reviewerNote: note })).data;
    },
    onSuccess: () => {
      toast('Đã phê duyệt đề xuất! Dữ liệu đã tự động cập nhật vào hồ sơ nhân sự.', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['personnel-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSelectedRequest(null);
      setApprovalNote('');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      return (await api.post(`/profile-change-requests/${id}/reject`, { reviewerNote: note })).data;
    },
    onSuccess: () => {
      toast('Đã từ chối đề xuất điều chỉnh thông tin!', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile-change-requests'] });
      setSelectedRequest(null);
      setIsRejectModalOpen(false);
      setRejectReason('');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const requests = data?.items || [];
  const pendingCount = data?.pendingCount || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
            Chờ thẩm định
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-destructive border border-border">
            Từ chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  // Render detail modal via portal
  const renderDetailModal = () => {
    if (!selectedRequest) return null;

    const modalContent = (
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        {/* Backdrop phủ kín hoàn toàn màn hình */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedRequest(null)}
        />

        {/* Modal Hộp thoại */}
        <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-card border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/20">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Thẩm định đề xuất điều chỉnh hồ sơ
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhân viên: <strong className="text-foreground">{selectedRequest.user.fullName}</strong> ({selectedRequest.user.employeeCode || selectedRequest.user.email})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Tóm tắt nhân viên & lý do */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded border border-border bg-muted/20 space-y-1">
                <span className="text-[11px] text-muted-foreground block">Đơn vị & Vị trí:</span>
                <p className="font-medium text-foreground">
                  {selectedRequest.user.orgUnit?.name || 'Chưa phân bổ'}
                </p>
                <p className="text-muted-foreground">{selectedRequest.user.jobTitle || 'Nhân viên'}</p>
              </div>

              <div className="p-3 rounded border border-border bg-muted/20 space-y-1 sm:col-span-2">
                <span className="text-[11px] text-muted-foreground block">Lý do đề xuất:</span>
                <p className="text-foreground font-medium italic">
                  &ldquo;{selectedRequest.reason}&rdquo;
                </p>
              </div>
            </div>

            {/* Bảng đối chiếu Cũ - Mới */}
            <div className="space-y-1.5">
              <span className="font-semibold text-foreground block">
                Đối chiếu dữ liệu thay đổi:
              </span>

              <div className="rounded border border-border overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                      <th className="px-3 py-2 w-[30%]">Trường thông tin</th>
                      <th className="px-3 py-2 w-[35%]">Giá trị hiện tại</th>
                      <th className="px-3 py-2 w-[35%]">Giá trị mới đề xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(selectedRequest.changes || {}).map(([key, c]) => (
                      <tr key={key} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium text-foreground">
                          {c.label}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {c.oldValue ? String(c.oldValue) : <span className="italic text-muted-foreground/60">(Trống)</span>}
                        </td>
                        <td className="px-3 py-2 font-semibold text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            {String(c.newValue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Minh chứng đính kèm */}
            <div className="space-y-1.5">
              <span className="font-semibold text-foreground block">
                Tài liệu minh chứng đính kèm:
              </span>
              {selectedRequest.attachmentUrls && selectedRequest.attachmentUrls.length > 0 ? (
                <div className="space-y-1">
                  {selectedRequest.attachmentUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate max-w-[85%] font-mono text-[11px]">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {url}
                      </span>
                      <span className="text-[10px] text-muted-foreground underline">Mở liên kết ↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded border border-dashed border-border p-2.5 text-xs text-muted-foreground italic">
                  Không có liên kết đính kèm. Vui lòng đối chiếu hồ sơ giấy trực tiếp.
                </div>
              )}
            </div>

            {/* Lịch sử duyệt trước đó nếu không phải PENDING */}
            {selectedRequest.status !== 'PENDING' && (
              <div className="p-3 rounded border border-border bg-muted/20 space-y-1 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Kết quả thẩm định:</span>
                  <span>{formatDate(selectedRequest.reviewedAt || selectedRequest.createdAt)}</span>
                </div>
                <p className="font-medium text-foreground italic">
                  &ldquo;{selectedRequest.reviewerNote || 'Không có ghi chú thêm'}&rdquo;
                </p>
              </div>
            )}

            {/* Nhập ghi chú thẩm định khi PENDING */}
            {selectedRequest.status === 'PENDING' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  Ghi chú thẩm định (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Ví dụ: Đã đối chiếu bản gốc CCCD/Văn bằng trùng khớp..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequest(null)}
            >
              Đóng
            </Button>

            {selectedRequest.status === 'PENDING' && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Từ chối
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate({
                      id: selectedRequest.id,
                      note: approvalNote,
                    })
                  }
                >
                  {approveMutation.isPending ? 'Đang lưu...' : 'Phê duyệt & Áp dụng'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
  };

  // Render reject modal via portal
  const renderRejectModal = () => {
    if (!isRejectModalOpen || !selectedRequest) return null;

    const modalContent = (
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsRejectModalOpen(false)}
        />

        <div className="relative z-10 w-full max-w-md rounded-lg bg-card border border-border shadow-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Từ chối đề xuất điều chỉnh</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Nhập lý do để thông báo cho nhân viên</p>
          </div>

          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Ảnh chụp CCCD bị mờ góc không rõ số; Bằng tốt nghiệp thiếu công chứng..."
            className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden resize-none"
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              onClick={() =>
                rejectMutation.mutate({
                  id: selectedRequest.id,
                  note: rejectReason.trim(),
                })
              }
            >
              {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
  };

  return (
    <div className="space-y-4">
      {/* Thanh bộ lọc */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {st === 'PENDING' && `Chờ duyệt (${pendingCount})`}
              {st === 'APPROVED' && 'Đã duyệt'}
              {st === 'REJECTED' && 'Từ chối'}
              {st === 'ALL' && 'Tất cả'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, mã NV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-input bg-background text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Danh sách yêu cầu */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Đang tải danh sách đề xuất...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
          Không có đề xuất nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                  <th className="px-4 py-2.5">Thời gian</th>
                  <th className="px-4 py-2.5">Cán bộ / Nhân viên</th>
                  <th className="px-4 py-2.5">Các trường đề xuất đổi</th>
                  <th className="px-4 py-2.5">Lý do</th>
                  <th className="px-4 py-2.5 text-center">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => {
                  const changedLabels = Object.values(req.changes || {}).map((c) => c.label);
                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{req.user.fullName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {req.user.employeeCode || req.user.email} · {req.user.jobTitle || 'Nhân viên'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {changedLabels.slice(0, 3).map((lbl, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10.5px] bg-muted text-foreground border border-border/60"
                            >
                              {lbl}
                            </span>
                          ))}
                          {changedLabels.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{changedLabels.length - 3} trường khác
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                        {req.reason}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Thẩm định
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Render modals */}
      {renderDetailModal()}
      {renderRejectModal()}
    </div>
  );
}
