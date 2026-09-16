'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Trash2, FileText, Send, Plus } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Input, Select, Textarea } from '@/components/ui/primitives';
import { getTier2EditableFields, type FieldDefinition } from '@/lib/personnel-tiers';
import { formatDate } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentProfileData?: any;
  onSuccess?: () => void;
}

interface SelectedChange {
  fieldKey: string;
  label: string;
  oldValue: any;
  newValue: any;
  tier: number;
}

export function ProfileChangeRequestModal({
  isOpen,
  onClose,
  currentProfileData,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const tier2Fields = getTier2EditableFields();
  const [selectedChanges, setSelectedChanges] = useState<Record<string, SelectedChange>>({});
  const [reason, setReason] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');

  // Lấy giá trị hiện tại của 1 trường từ dữ liệu hồ sơ
  const getCurrentValue = (key: string) => {
    if (!currentProfileData) return '';
    if (key === 'fullName') return currentProfileData.user?.fullName || currentProfileData.fullName || '';
    if (key === 'birthDate') return currentProfileData.user?.birthDate || currentProfileData.birthDate || '';
    if (key === 'phone') return currentProfileData.user?.phone || currentProfileData.phone || '';
    if (key === 'currentAddress') return currentProfileData.user?.address || currentProfileData.currentAddress || '';
    return currentProfileData[key] || '';
  };

  const handleAddField = (fieldKey: string) => {
    if (!fieldKey) return;
    const fieldDef = tier2Fields.find((f) => f.key === fieldKey);
    if (!fieldDef) return;

    const currentVal = getCurrentValue(fieldKey);
    setSelectedChanges((prev) => ({
      ...prev,
      [fieldKey]: {
        fieldKey,
        label: fieldDef.label,
        oldValue: currentVal,
        newValue: '',
        tier: 2,
      },
    }));
  };

  const handleRemoveField = (fieldKey: string) => {
    setSelectedChanges((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const handleNewValueChange = (fieldKey: string, val: any) => {
    setSelectedChanges((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        newValue: val,
      },
    }));
  };

  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) return;
    setAttachmentUrls((prev) => [...prev, attachmentInput.trim()]);
    setAttachmentInput('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (Object.keys(selectedChanges).length === 0) {
        throw new Error('Vui lòng chọn ít nhất một trường thông tin cần điều chỉnh');
      }

      for (const [_, item] of Object.entries(selectedChanges)) {
        if (item.newValue === undefined || item.newValue === null || String(item.newValue).trim() === '') {
          throw new Error(`Vui lòng nhập giá trị mới cho trường "${item.label}"`);
        }
      }

      if (!reason.trim() || reason.trim().length < 5) {
        throw new Error('Vui lòng nhập lý do đề xuất (tối thiểu 5 ký tự)');
      }

      return (
        await api.post('/profile-change-requests', {
          changes: selectedChanges,
          reason: reason.trim(),
          attachmentUrls,
        })
      ).data;
    },
    onSuccess: () => {
      toast('Đã gửi đề xuất điều chỉnh thông tin cá nhân tới Phòng Nhân sự!', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-profile-change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['profile-change-requests'] });
      setSelectedChanges({});
      setReason('');
      setAttachmentUrls([]);
      onSuccess?.();
      onClose();
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const availableFieldsToAdd = tier2Fields.filter((f) => !selectedChanges[f.key]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      {/* Backdrop phủ kín hoàn toàn màn hình */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Hộp thoại Modal theo phong cách doanh nghiệp tối giản */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg bg-card border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/20">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Đề xuất thay đổi thông tin cá nhân
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Áp dụng cho thông tin nhân thân pháp lý và bằng cấp. Cần Phòng Nhân sự thẩm định trước khi cập nhật.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* 1. Chọn trường cần thay đổi bằng Dropdown chuẩn hệ thống */}
          <div className="space-y-2">
            <label className="font-semibold text-foreground block">
              1. Chọn trường thông tin cần điều chỉnh:
            </label>

            <Select
              className="h-9 text-xs"
              placeholder="-- Chọn trường thông tin (CCCD, Họ tên, Ngày sinh, Bằng cấp...) --"
              searchPlaceholder="Tìm kiếm trường thông tin..."
              searchable
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAddField(e.target.value);
                }
              }}
              options={availableFieldsToAdd.map((f) => ({
                value: f.key,
                label: f.label,
                badge: f.category,
                sublabel: f.helperText,
              }))}
            />

            {/* Danh sách các trường đã chọn */}
            {Object.keys(selectedChanges).length === 0 ? (
              <div className="rounded-md border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                Chưa chọn trường thông tin nào. Vui lòng chọn ở danh sách phía trên.
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {Object.values(selectedChanges).map((item) => {
                  const fieldDef = tier2Fields.find((f) => f.key === item.fieldKey);
                  return (
                    <div
                      key={item.fieldKey}
                      className="rounded-md border border-border bg-muted/20 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {item.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(item.fieldKey)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Bỏ trường này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">
                            Giá trị hiện tại:
                          </span>
                          <div className="px-3 py-2 rounded-md border border-border bg-muted/40 font-medium text-muted-foreground text-xs truncate">
                            {item.oldValue ? (
                              fieldDef?.type === 'date' ? formatDate(item.oldValue) : String(item.oldValue)
                            ) : (
                              <span className="italic text-muted-foreground/60">(Trống)</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-foreground block mb-1">
                            Giá trị mới (*):
                          </span>
                          {fieldDef?.type === 'select' && fieldDef.options ? (
                            <Select
                              className="h-9 text-xs"
                              placeholder="-- Chọn giá trị --"
                              value={item.newValue || ''}
                              onChange={(e) => handleNewValueChange(item.fieldKey, e.target.value)}
                              options={fieldDef.options.map((opt) => ({
                                value: opt,
                                label: opt,
                              }))}
                            />
                          ) : fieldDef?.type === 'date' ? (
                            <Input
                              type="date"
                              value={item.newValue || ''}
                              onChange={(e) => handleNewValueChange(item.fieldKey, e.target.value)}
                              className="h-9 text-xs"
                            />
                          ) : (
                            <Input
                              type="text"
                              value={item.newValue || ''}
                              onChange={(e) => handleNewValueChange(item.fieldKey, e.target.value)}
                              placeholder={fieldDef?.placeholder || 'Nhập giá trị mới...'}
                              className="h-9 text-xs"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Lý do xin điều chỉnh */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              2. Lý do đề xuất (*):
            </label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ lý do (ví dụ: Đổi thẻ CCCD gắn chip mới, Cập nhật bằng tốt nghiệp đại học...)"
              className="text-xs resize-none"
            />
          </div>

          {/* 3. Tài liệu / Minh chứng đính kèm */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground block">
              3. Tài liệu minh chứng (Link ảnh hoặc đường dẫn nội bộ):
            </label>

            <div className="flex gap-2">
              <Input
                type="text"
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttachment();
                  }
                }}
                placeholder="Ví dụ: /uploads/cccd_scan.pdf hoặc link tài liệu..."
                className="flex-1 h-9 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttachment}
              >
                Thêm
              </Button>
            </div>

            {attachmentUrls.length > 0 && (
              <div className="space-y-1 pt-1">
                {attachmentUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs text-foreground border border-border"
                  >
                    <span className="flex items-center gap-1.5 font-mono text-xs truncate max-w-[85%]">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {url}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Đóng
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={submitMutation.isPending || Object.keys(selectedChanges).length === 0}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? 'Đang gửi...' : 'Gửi đề xuất'}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
