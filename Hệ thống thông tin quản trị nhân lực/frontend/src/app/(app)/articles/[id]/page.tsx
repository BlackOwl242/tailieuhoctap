'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ThumbsUp, Bookmark, Eye, Send, CheckCircle2, Undo2, ArchiveRestore,
  Archive, Pencil, Paperclip, History, MessageSquarePlus,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime, ARTICLE_STATUS_LABEL, ARTICLE_STATUS_TONE } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea, Skeleton } from '@/components/ui/primitives';
import { ErrorState, LoadingBlock } from '@/components/common/states';
import { MarkdownViewer } from '@/components/common/markdown-viewer';
import type { ArticleDetail, CommentItem } from '@/lib/types';

const ACTION_LABEL: Record<string, string> = {
  SUBMIT: 'Trình duyệt', APPROVE: 'Duyệt & xuất bản',
  REQUEST_CHANGES: 'Yêu cầu chỉnh sửa', REJECT: 'Từ chối',
};

/** Trang đọc bài viết + toàn bộ hành động theo vai (KC06–KC16). */
export default function ArticlePage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const [commentDraft, setCommentDraft] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const q = useQuery({
    queryKey: ['article', params.id],
    queryFn: async () => (await api.get<ArticleDetail>(`/articles/${params.id}`)).data,
  });

  // Đếm lượt xem một lần khi mở bài
  useEffect(() => {
    if (q.data?.id) void api.post(`/articles/${q.data.id}/view`).catch(() => undefined);
  }, [q.data?.id]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['article', params.id] });

  // Mutation tổng hợp cho mọi hành động (duyệt/sửa/lưu trữ/khôi phục…)
  const act = useMutation<unknown, Error, { fn: () => Promise<unknown> }>({
    mutationFn: ({ fn }) => fn(),
    onSuccess: () => invalidate(),
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const commentsQ = useQuery({
    queryKey: ['comments', params.id],
    enabled: !!q.data,
    queryFn: async () => (await api.get<CommentItem[]>(`/articles/${params.id}/comments`)).data,
  });

  if (q.isLoading) return <LoadingBlock label="Đang mở bài viết…" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const a = q.data!;

  // Nhận object { fn } khớp với variables của mutation ở trên
  const doAction = (vars: { fn: () => Promise<unknown> }) => act.mutate(vars);

  /** Gửi bình luận mới; sau đó xóa ô nhập. */
  async function addComment() {
    if (!commentDraft.trim()) return;
    try {
      await api.post(`/articles/${a.id}/comments`, { body: commentDraft.trim() });
      setCommentDraft('');
      qc.invalidateQueries({ queryKey: ['comments', params.id] });
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <article className="mx-auto max-w-3xl">
      {/* ---------- Đầu bài: tiêu đề + meta + trạng thái ---------- */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={ARTICLE_STATUS_TONE[a.status]}>{ARTICLE_STATUS_LABEL[a.status]}</Badge>
          <Link href={`/spaces/${a.space.slug}`} className="text-xs text-primary hover:underline">{a.space.name}</Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{a.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {a.author.fullName} · v{a.versionNo} · Cập nhật {formatDateTime(a.updatedAt)}
          {a.publishedAt ? ` · Xuất bản ${formatDateTime(a.publishedAt)}` : ''}
        </p>
        {a.summary ? <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p> : null}
      </div>

      {/* ---------- Thanh hành động ---------- */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={a.myReaction ? 'success' : 'outline'}
          onClick={() => doAction({ fn: () => api.post(`/articles/${a.id}/reaction`) })}>
          <ThumbsUp className="h-4 w-4" /> Hữu ích ({a.helpfulCount})
        </Button>
        <Button size="sm" variant={a.myBookmark ? 'default' : 'outline'}
          onClick={() => doAction({ fn: () => api.put(`/articles/${a.id}/bookmark`) })}>
          <Bookmark className="h-4 w-4" /> {a.myBookmark ? 'Đã lưu' : 'Lưu'}
        </Button>
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> {a.viewCount} lượt xem
        </span>

        {/* Hành động theo quyền — backend vẫn kiểm tra lại từng route */}
        {a.permissions.canEdit && a.status !== 'ARCHIVED' ? (
          <Link href={`/articles/${a.id}/edit`}><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Sửa</Button></Link>
        ) : null}
        {a.permissions.canSubmit && a.status === 'DRAFT' ? (
          <Button size="sm" onClick={() => doAction({ fn: () => api.post(`/articles/${a.id}/submit`) })}>
            <Send className="h-4 w-4" /> Trình duyệt
          </Button>
        ) : null}
        {a.permissions.canReview && a.status === 'PENDING_REVIEW' ? (
          <>
            <Button size="sm" variant="success"
              onClick={() => doAction({ fn: () => api.post(`/articles/${a.id}/review`, { action: 'APPROVE' }) })}>
              <CheckCircle2 className="h-4 w-4" /> Duyệt
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowRejectBox((v) => !v)}>
              Yêu cầu sửa / Từ chối
            </Button>
          </>
        ) : null}
        {a.permissions.canArchive && a.status === 'PUBLISHED' ? (
          <Button size="sm" variant="ghost" onClick={() => doAction({ fn: () => api.post(`/articles/${a.id}/archive`) })}>
            <Archive className="h-4 w-4" /> Lưu trữ
          </Button>
        ) : null}
        {a.permissions.canArchive && a.status === 'ARCHIVED' ? (
          <Button size="sm" variant="ghost" onClick={() => doAction({ fn: () => api.post(`/articles/${a.id}/restore`) })}>
            <ArchiveRestore className="h-4 w-4" /> Khôi phục
          </Button>
        ) : null}
      </div>

      {/* Ô ý kiến khi yêu cầu chỉnh sửa / từ chối */}
      {showRejectBox && a.status === 'PENDING_REVIEW' ? (
        <Card className="mb-5 border-amber-300">
          <CardContent className="space-y-2 p-4">
            <Textarea rows={3} value={rejectComment} onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Ý kiến cho tác giả (bắt buộc khi yêu cầu chỉnh sửa)" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={!rejectComment.trim()}
                onClick={() => { doAction({ fn: () => api.post(`/articles/${a.id}/review`, { action: 'REQUEST_CHANGES', comment: rejectComment }) }); setShowRejectBox(false); setRejectComment(''); }}>
                Gửi yêu cầu chỉnh sửa
              </Button>
              <Button size="sm" variant="destructive"
                onClick={() => { doAction({ fn: () => api.post(`/articles/${a.id}/review`, { action: 'REJECT', comment: rejectComment }) }); setShowRejectBox(false); }}>
                Từ chối
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ---------- Nội dung Markdown ---------- */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <MarkdownViewer content={a.contentMd} />
        </CardContent>
      </Card>

      {/* ---------- Tệp đính kèm ---------- */}
      {a.attachments.length > 0 ? (
        <Card className="mt-4">
          <CardHeader><CardTitle className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Tệp đính kèm</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {a.attachments.map((f) => (
              <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">
                {f.fileName} ({Math.round(f.sizeBytes / 1024)} KB)
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* ---------- Lịch sử phiên bản + timeline duyệt ---------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Phiên bản</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {a.versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">v{v.versionNo}</span>{' '}
                  <span className="truncate text-muted-foreground">{v.changeNote}</span>
                  <span className="block text-xs text-muted-foreground">{formatDateTime(v.createdAt)}</span>
                </span>
                {v.versionNo !== a.versionNo && a.permissions.canEdit ? (
                  <Button size="sm" variant="ghost"
                    onClick={() => doAction({ fn: () => api.post(`/articles/${a.id}/versions/${v.versionNo}/restore`) })}>
                    <Undo2 className="h-3.5 w-3.5" /> Khôi phục
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dòng thời gian duyệt</CardTitle></CardHeader>
          <CardContent>
            {a.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có bước duyệt nào.</p>
            ) : (
              <ol className="relative space-y-3 border-l pl-4">
                {a.timeline.map((t, i) => (
                  <li key={i} className="text-sm">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="font-medium">{ACTION_LABEL[t.action] ?? t.action}</span> — {t.reviewer.fullName}
                    <span className="block text-xs text-muted-foreground">{formatDateTime(t.at)}{t.comment ? ` · ${t.comment}` : ''}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------- Bình luận / hỏi đáp ---------- */}
      <Card className="mt-4">
        <CardHeader><CardTitle>Hỏi đáp & bình luận</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Textarea rows={2} value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến…" />
            <Button className="self-end" size="sm" onClick={addComment}>
              <MessageSquarePlus className="h-4 w-4" /> Gửi
            </Button>
          </div>

          {commentsQ.isLoading ? <Skeleton className="h-20" /> : null}
          {(commentsQ.data ?? []).length === 0 && !commentsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>
          ) : null}
          {(commentsQ.data ?? []).map((c) => (
            <div key={c.id} className={`rounded-md border p-3 ${c.parentId ? 'ml-6 bg-muted/40' : ''}`}>
              <p className="text-sm font-medium">
                {c.author.fullName}
                {c.isQuestion ? <Badge className="ml-2 bg-amber-100 text-amber-800">Câu hỏi</Badge> : null}
                {c.resolvedAt ? <Badge className="ml-2 bg-emerald-100 text-emerald-800">Đã giải đáp</Badge> : null}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </article>
  );
}
