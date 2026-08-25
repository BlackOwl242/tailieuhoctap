'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { api, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, Input, Label, Textarea } from '@/components/ui/primitives';

export interface ArticleFormValues {
  title: string;
  summary: string;
  contentMd: string;
  changeNote: string;
}

/**
 * Form soạn/sửa bài viết dùng chung cho "tạo mới" và "chỉnh sửa".
 * Có tab xem trước Markdown để tác giả kiểm tra định dạng ngay khi soạn.
 */
export function ArticleForm({
  initial,
  onSubmit,
  submitLabel = 'Lưu bài viết',
}: {
  initial?: Partial<ArticleFormValues>;
  onSubmit: (values: ArticleFormValues) => Promise<unknown>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [values, setValues] = useState<ArticleFormValues>({
    title: initial?.title ?? '',
    summary: initial?.summary ?? '',
    contentMd: initial?.contentMd ?? '',
    changeNote: initial?.changeNote ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewHtml = useMemoHtml(values.contentMd);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="af-title">Tiêu đề *</Label>
        <Input id="af-title" required minLength={3} maxLength={200}
          value={values.title}
          onChange={(e) => setValues({ ...values, title: e.target.value })}
          placeholder="Tiêu đề ngắn gọn, dễ tìm kiếm" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="af-summary">Tóm tắt</Label>
        <Input id="af-summary" maxLength={300}
          value={values.summary}
          onChange={(e) => setValues({ ...values, summary: e.target.value })}
          placeholder="Một câu mô tả nội dung (hiển thị trong danh sách và kết quả tìm kiếm)" />
      </div>

      {/* Tab soạn / xem trước */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="af-content">Nội dung (Markdown) *</Label>
          <div className="flex rounded-md border p-0.5 text-xs">
            {(['write', 'preview'] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => setTab(t)}
                className={`rounded px-2 py-1 ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                {t === 'write' ? 'Soạn' : 'Xem trước'}
              </button>
            ))}
          </div>
        </div>
        {tab === 'write' ? (
          <Textarea id="af-content" required rows={16} className="font-mono text-[13px]"
            value={values.contentMd}
            onChange={(e) => setValues({ ...values, contentMd: e.target.value })}
            placeholder={'# Tiêu đề\n\nNội dung với **Markdown**…'} />
        ) : (
          <div className="markdown-body min-h-[200px] rounded-md border bg-card p-4"
            dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="af-note">Ghi chú phiên bản</Label>
        <Input id="af-note" maxLength={200}
          value={values.changeNote}
          onChange={(e) => setValues({ ...values, changeNote: e.target.value })}
          placeholder="VD: bổ sung bước 4 của runbook" />
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Hủy</Button>
      </div>
    </form>
  );
}

function useMemoHtml(md: string): string {
  // marked là đồng bộ khi không truyền async option
  const raw = marked.parse(md ?? '', { async: false }) as string;
  return DOMPurify.sanitize(raw);
}
