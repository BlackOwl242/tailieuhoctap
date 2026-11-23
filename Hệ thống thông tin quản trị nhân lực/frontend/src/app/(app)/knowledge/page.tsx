'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Bell,
  BookOpen,
  CheckCircle2,
  Edit3,
  Eye,
  Heart,
  History,
  Inbox,
  MessageSquare,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { api, errorMessage, openProtectedFile } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type {
  ArticleDetail,
  ArticleListItem,
  CommentItem,
  OnboardingAssignmentView,
  SpaceSummary,
} from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/common/states';
import { MarkdownViewer } from '@/components/common/markdown-viewer';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, Textarea } from '@/components/ui/primitives';
import { Modal, ModalFooterActions } from '@/components/ui/modal';

type KmsTab = 'spaces' | 'reviews' | 'search' | 'onboarding' | 'experts';

interface SpaceDetailView extends SpaceSummary {
  following: boolean;
  canManage: boolean;
  members: Array<{
    id: string;
    fullName: string;
    email: string;
    jobTitle: string | null;
    spaceRole: 'MANAGER' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER';
  }>;
}

interface PendingReviewItem {
  id: string;
  title: string;
  summary: string | null;
  space: { id: string; name: string; slug: string };
  author: { id: string; fullName: string };
  submittedAt: string;
  reviewDueAt: string | null;
}

interface SearchHitRow {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  space: { id: string; name: string; slug: string };
  authorName: string;
  publishedAt: string | null;
  score: number;
}

interface OnboardingPathSummary {
  id: string;
  title: string;
  description: string | null;
  targetJobTitle: string | null;
  orgUnit: { id: string; name: string } | null;
  itemCount: number;
  assignedCount: number;
}

interface ExpertSummary {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  expertise: string[];
  bio: string | null;
  orgUnit: { id: string; name: string } | null;
  publishedCount: number;
}

interface ExpertDetail extends ExpertSummary {
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    publishedAt: string | null;
    viewCount: number;
    helpfulCount: number;
  }>;
}

const ARTICLE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_REVIEW: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  ARCHIVED: 'Đã lưu trữ',
};

function KnowledgePortalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];

  const isKmAdmin = roles.some((r) => ['ADMIN', 'KM_MANAGER'].includes(r));
  const canManageOnboarding = roles.some((r) => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER'].includes(r));

  const paramTab = searchParams.get('tab');
  const paramArticle = searchParams.get('article');

  const [activeTab, setActiveTab] = useState<KmsTab>(
    paramTab && ['spaces', 'reviews', 'search', 'onboarding', 'experts'].includes(paramTab)
      ? (paramTab as KmsTab)
      : 'spaces',
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [openArticleId, setOpenArticleId] = useState<string | null>(paramArticle);

  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [spaceForm, setSpaceForm] = useState({ name: '', description: '', visibility: 'PUBLIC' as 'PUBLIC' | 'RESTRICTED' | 'PRIVATE' });

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ userId: '', spaceRole: 'CONTRIBUTOR' as 'MANAGER' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER' });

  const [articleModal, setArticleModal] = useState<{
    mode: 'create' | 'edit';
    articleId?: string;
    title: string;
    summary: string;
    contentMd: string;
    changeNote: string;
  } | null>(null);

  const [reviewComment, setReviewComment] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentIsQuestion, setCommentIsQuestion] = useState(false);

  const [ftsInput, setFtsInput] = useState('');
  const [ftsQuery, setFtsQuery] = useState('');
  const [ftsSpaceId, setFtsSpaceId] = useState('');

  const [expertSearch, setExpertSearch] = useState('');
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);

  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [pathForm, setPathForm] = useState({ title: '', description: '', targetJobTitle: '', articleIds: [] as string[] });
  const [assignModalPath, setAssignModalPath] = useState<OnboardingPathSummary | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: '', dueDate: '' });

  useEffect(() => {
    if (paramTab && ['spaces', 'reviews', 'search', 'onboarding', 'experts'].includes(paramTab)) {
      setActiveTab(paramTab as KmsTab);
    }
  }, [paramTab]);

  useEffect(() => {
    if (paramArticle) {
      setOpenArticleId(paramArticle);
    }
  }, [paramArticle]);

  const switchTab = (tab: KmsTab) => {
    setActiveTab(tab);
    router.replace(`/knowledge?tab=${tab}`, { scroll: false });
  };

  // --- Queries ---
  const spacesQ = useQuery({
    queryKey: ['kms-spaces'],
    queryFn: async () => (await api.get<{ items: SpaceSummary[] }>('/spaces', { params: { limit: 100 } })).data.items,
  });

  const spaces = spacesQ.data ?? [];
  const effectiveSpaceId = selectedSpaceId && spaces.some((s) => s.id === selectedSpaceId)
    ? selectedSpaceId
    : (spaces[0]?.id ?? '');

  const spaceDetailQ = useQuery({
    queryKey: ['kms-space-detail', effectiveSpaceId],
    queryFn: async () => (await api.get<SpaceDetailView>(`/spaces/${effectiveSpaceId}`)).data,
    enabled: Boolean(effectiveSpaceId),
  });

  const articlesQ = useQuery({
    queryKey: ['kms-space-articles', effectiveSpaceId, statusFilter],
    queryFn: async () =>
      (
        await api.get<{ items: ArticleListItem[] }>(`/spaces/${effectiveSpaceId}/articles`, {
          params: { limit: 50, ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}) },
        })
      ).data.items,
    enabled: Boolean(effectiveSpaceId),
  });

  const pendingReviewsQ = useQuery({
    queryKey: ['kms-pending-reviews'],
    queryFn: async () => (await api.get<{ items: PendingReviewItem[] }>('/reviews/pending', { params: { limit: 50 } })).data.items,
  });

  const articleDetailQ = useQuery({
    queryKey: ['kms-article-detail', openArticleId],
    queryFn: async () => (await api.get<ArticleDetail>(`/articles/${openArticleId}`)).data,
    enabled: Boolean(openArticleId),
  });

  const commentsQ = useQuery({
    queryKey: ['kms-article-comments', openArticleId],
    queryFn: async () => (await api.get<CommentItem[]>(`/articles/${openArticleId}/comments`)).data,
    enabled: Boolean(openArticleId),
  });

  useEffect(() => {
    if (openArticleId) {
      void api.post(`/articles/${openArticleId}/view`).catch(() => undefined);
    }
  }, [openArticleId]);

  const ftsQ = useQuery({
    queryKey: ['kms-fts-search', ftsQuery, ftsSpaceId],
    queryFn: async () =>
      (
        await api.get<{ items: SearchHitRow[] }>('/search', {
          params: { q: ftsQuery, limit: 25, ...(ftsSpaceId ? { spaceId: ftsSpaceId } : {}) },
        })
      ).data.items,
    enabled: ftsQuery.trim().length >= 1,
  });

  const myOnboardingQ = useQuery({
    queryKey: ['kms-onboarding-my'],
    queryFn: async () => (await api.get<OnboardingAssignmentView[]>('/onboarding/my')).data,
  });

  const onboardingPathsQ = useQuery({
    queryKey: ['kms-onboarding-paths'],
    queryFn: async () => (await api.get<OnboardingPathSummary[]>('/onboarding/paths')).data,
  });

  const expertsQ = useQuery({
    queryKey: ['kms-people', expertSearch],
    queryFn: async () =>
      (await api.get<{ items: ExpertSummary[] }>('/people', { params: { limit: 60, ...(expertSearch.trim() ? { q: expertSearch.trim() } : {}) } })).data.items,
  });

  const expertDetailQ = useQuery({
    queryKey: ['kms-people-detail', selectedExpertId],
    queryFn: async () => (await api.get<ExpertDetail>(`/people/${selectedExpertId}`)).data,
    enabled: Boolean(selectedExpertId),
  });

  const candidateUsersQ = useQuery({
    queryKey: ['kms-candidate-users'],
    queryFn: async () => (await api.get<{ items: Array<{ id: string; fullName: string; email: string }> }>('/people', { params: { limit: 60 } })).data.items,
    enabled: memberModalOpen || Boolean(assignModalPath),
  });

  // --- Mutations ---
  const createSpace = useMutation({
    mutationFn: async () => (await api.post<SpaceSummary>('/spaces', spaceForm)).data,
    onSuccess: (created) => {
      toast('Đã tạo không gian tri thức mới', 'success');
      setSpaceModalOpen(false);
      setSpaceForm({ name: '', description: '', visibility: 'PUBLIC' });
      setSelectedSpaceId(created.id);
      qc.invalidateQueries({ queryKey: ['kms-spaces'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const toggleFollow = useMutation({
    mutationFn: async (spaceId: string) => (await api.put<{ following: boolean }>(`/spaces/${spaceId}/follow`)).data,
    onSuccess: (res) => {
      toast(res.following ? 'Đã theo dõi không gian tri thức' : 'Đã bỏ theo dõi', 'success');
      qc.invalidateQueries({ queryKey: ['kms-space-detail', effectiveSpaceId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const addMember = useMutation({
    mutationFn: async () =>
      (await api.post(`/spaces/${effectiveSpaceId}/members`, memberForm)).data,
    onSuccess: () => {
      toast('Đã cập nhật thành viên Space', 'success');
      setMemberForm({ userId: '', spaceRole: 'CONTRIBUTOR' });
      qc.invalidateQueries({ queryKey: ['kms-space-detail', effectiveSpaceId] });
      qc.invalidateQueries({ queryKey: ['kms-spaces'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) =>
      (await api.delete(`/spaces/${effectiveSpaceId}/members/${memberId}`)).data,
    onSuccess: () => {
      toast('Đã xóa thành viên khỏi Space', 'success');
      qc.invalidateQueries({ queryKey: ['kms-space-detail', effectiveSpaceId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const saveArticle = useMutation({
    mutationFn: async () => {
      if (!articleModal) return null;
      if (articleModal.mode === 'create') {
        return (
          await api.post<ArticleDetail>(`/spaces/${effectiveSpaceId}/articles`, {
            title: articleModal.title.trim(),
            summary: articleModal.summary.trim() || undefined,
            contentMd: articleModal.contentMd,
            changeNote: articleModal.changeNote.trim() || 'Tạo ban đầu',
          })
        ).data;
      }
      return (
        await api.patch<ArticleDetail>(`/articles/${articleModal.articleId}`, {
          title: articleModal.title.trim(),
          summary: articleModal.summary.trim() || undefined,
          contentMd: articleModal.contentMd,
          changeNote: articleModal.changeNote.trim() || 'Cập nhật nội dung',
        })
      ).data;
    },
    onSuccess: (saved) => {
      toast('Đã lưu bài viết (tự động lưu phiên bản mới)', 'success');
      setArticleModal(null);
      if (saved?.id) setOpenArticleId(saved.id);
      qc.invalidateQueries({ queryKey: ['kms-space-articles', effectiveSpaceId] });
      qc.invalidateQueries({ queryKey: ['kms-article-detail'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const submitArticle = useMutation({
    mutationFn: async (id: string) => (await api.post(`/articles/${id}/submit`)).data,
    onSuccess: () => {
      toast('Đã trình duyệt bài viết', 'success');
      qc.invalidateQueries({ queryKey: ['kms-space-articles'] });
      qc.invalidateQueries({ queryKey: ['kms-article-detail'] });
      qc.invalidateQueries({ queryKey: ['kms-pending-reviews'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const reviewArticle = useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'; comment?: string }) =>
      (await api.post(`/articles/${id}/review`, { action, comment })).data,
    onSuccess: () => {
      toast('Đã xử lý kiểm duyệt bài viết', 'success');
      setReviewComment('');
      qc.invalidateQueries({ queryKey: ['kms-pending-reviews'] });
      qc.invalidateQueries({ queryKey: ['kms-space-articles'] });
      qc.invalidateQueries({ queryKey: ['kms-article-detail'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) =>
      (await api.post(`/articles/${id}/${archived ? 'archive' : 'restore'}`)).data,
    onSuccess: () => {
      toast('Đã cập nhật trạng thái lưu trữ', 'success');
      qc.invalidateQueries({ queryKey: ['kms-space-articles'] });
      qc.invalidateQueries({ queryKey: ['kms-article-detail'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const restoreVersion = useMutation({
    mutationFn: async ({ id, versionNo }: { id: string; versionNo: number }) =>
      (await api.post(`/articles/${id}/versions/${versionNo}/restore`)).data,
    onSuccess: () => {
      toast('Đã khôi phục nội dung về phiên bản đã chọn', 'success');
      qc.invalidateQueries({ queryKey: ['kms-article-detail'] });
      qc.invalidateQueries({ queryKey: ['kms-space-articles'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const toggleReaction = useMutation({
    mutationFn: async (id: string) => (await api.post(`/articles/${id}/reaction`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kms-article-detail', openArticleId] });
      qc.invalidateQueries({ queryKey: ['kms-space-articles'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const addComment = useMutation({
    mutationFn: async () =>
      (await api.post(`/articles/${openArticleId}/comments`, { body: commentBody.trim(), isQuestion: commentIsQuestion })).data,
    onSuccess: () => {
      setCommentBody('');
      setCommentIsQuestion(false);
      qc.invalidateQueries({ queryKey: ['kms-article-comments', openArticleId] });
      qc.invalidateQueries({ queryKey: ['kms-article-detail', openArticleId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const resolveComment = useMutation({
    mutationFn: async (commentId: string) => (await api.post(`/comments/${commentId}/resolve`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kms-article-comments', openArticleId] }),
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => (await api.delete(`/comments/${commentId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kms-article-comments', openArticleId] });
      qc.invalidateQueries({ queryKey: ['kms-article-detail', openArticleId] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const completeOnboardingItem = useMutation({
    mutationFn: async ({ assignmentId, itemId }: { assignmentId: string; itemId: string }) =>
      (await api.post(`/onboarding/assignments/${assignmentId}/items/${itemId}/complete`)).data,
    onSuccess: () => {
      toast('Đã ghi nhận hoàn thành mục đọc hội nhập', 'success');
      qc.invalidateQueries({ queryKey: ['kms-onboarding-my'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const createOnboardingPath = useMutation({
    mutationFn: async () =>
      (
        await api.post('/onboarding/paths', {
          title: pathForm.title.trim(),
          description: pathForm.description.trim() || undefined,
          targetJobTitle: pathForm.targetJobTitle.trim() || undefined,
          articleIds: pathForm.articleIds,
        })
      ).data,
    onSuccess: () => {
      toast('Đã tạo lộ trình hội nhập tri thức', 'success');
      setPathModalOpen(false);
      setPathForm({ title: '', description: '', targetJobTitle: '', articleIds: [] });
      qc.invalidateQueries({ queryKey: ['kms-onboarding-paths'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const assignOnboardingPath = useMutation({
    mutationFn: async () => {
      if (!assignModalPath) return null;
      return (
        await api.post(`/onboarding/paths/${assignModalPath.id}/assign`, {
          userId: assignForm.userId,
          dueDate: assignForm.dueDate || undefined,
        })
      ).data;
    },
    onSuccess: () => {
      toast('Đã giao lộ trình đọc cho nhân sự', 'success');
      setAssignModalPath(null);
      setAssignForm({ userId: '', dueDate: '' });
      qc.invalidateQueries({ queryKey: ['kms-onboarding-paths'] });
      qc.invalidateQueries({ queryKey: ['kms-onboarding-my'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const publishedForPathPicker = articlesQ.data?.filter((a) => a.status === 'PUBLISHED') ?? [];
  const pendingCount = pendingReviewsQ.data?.length ?? 0;
  const articleDetail = articleDetailQ.data;

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Cổng Tri thức Nội bộ (KMS)"
        description="Quản trị tri thức tổ chức theo Không gian (Spaces), kiểm duyệt xuất bản, phiên bản bất biến, tìm kiếm toàn văn PostgreSQL FTS, lộ trình hội nhập và danh bạ chuyên gia."
        breadcrumbs={[{ label: 'Báo cáo & Tri thức' }, { label: 'Cổng Tri thức (KMS)' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isKmAdmin && (
              <Button size="sm" variant="outline" onClick={() => setSpaceModalOpen(true)}>
                <Plus className="h-4 w-4" /> Tạo không gian (Space)
              </Button>
            )}
            {effectiveSpaceId && (
              <Button
                size="sm"
                onClick={() =>
                  setArticleModal({
                    mode: 'create',
                    title: '',
                    summary: '',
                    contentMd: '# Tiêu đề mục\n\nNội dung hướng dẫn…',
                    changeNote: 'Tạo ban đầu',
                  })
                }
              >
                <Plus className="h-4 w-4" /> Viết bài tri thức
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {[
          { key: 'spaces', label: 'Không gian & Bài viết', icon: BookOpen },
          { key: 'reviews', label: `Hộp duyệt bài (${pendingCount})`, icon: Inbox },
          { key: 'search', label: 'Tìm kiếm toàn văn (FTS)', icon: Search },
          { key: 'onboarding', label: 'Lộ trình Hội nhập', icon: UserCheck },
          { key: 'experts', label: 'Danh bạ Chuyên gia', icon: Users },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key as KmsTab)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                active ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SPACES & ARTICLES */}
      {activeTab === 'spaces' && (
        <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm">Không gian Tri thức ({spaces.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {spacesQ.isLoading ? (
                <LoadingBlock label="Đang tải không gian…" />
              ) : spaces.length === 0 ? (
                <p className="text-xs text-muted-foreground">Chưa có không gian tri thức nào.</p>
              ) : (
                spaces.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setSelectedSpaceId(sp.id)}
                    className={`w-full rounded-md border p-2.5 text-left text-xs transition-colors ${
                      effectiveSpaceId === sp.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/70 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{sp.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        <Badge variant="secondary" className="text-[11px]" style={{ fontWeight: 500 }}>
                          {sp.visibility}
                        </Badge>
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {sp.publishedCount} bài xuất bản · {sp.memberCount} thành viên
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">{spaceDetailQ.data?.name ?? 'Chọn không gian tri thức'}</CardTitle>
                <CardDescription>
                  {spaceDetailQ.data?.description || 'Danh sách bài viết hướng dẫn, SOP và quy chuẩn thuộc không gian này.'}
                </CardDescription>
              </div>
              {spaceDetailQ.data && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggleFollow.isPending}
                    onClick={() => toggleFollow.mutate(spaceDetailQ.data!.id)}
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {spaceDetailQ.data.following ? 'Đang theo dõi' : 'Theo dõi Space'}
                  </Button>
                  {spaceDetailQ.data.canManage && (
                    <Button size="sm" variant="outline" onClick={() => setMemberModalOpen(true)}>
                      <Users className="h-3.5 w-3.5" /> Thành viên ({spaceDetailQ.data.members.length})
                    </Button>
                  )}
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36 text-xs">
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="PENDING_REVIEW">Chờ duyệt</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="ARCHIVED">Lưu trữ</option>
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2.5">
              {articlesQ.isLoading ? (
                <LoadingBlock label="Đang tải bài viết…" />
              ) : articlesQ.isError ? (
                <ErrorState message={errorMessage(articlesQ.error)} onRetry={() => articlesQ.refetch()} />
              ) : !articlesQ.data?.length ? (
                <EmptyState title="Chưa có bài viết nào" description="Hãy bấm Viết bài tri thức để khởi tạo bài viết đầu tiên trong Space này." />
              ) : (
                articlesQ.data.map((art) => (
                  <div
                    key={art.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenArticleId(art.id)}
                          className="text-left text-sm font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {art.title}
                        </button>
                        <span className="text-muted-foreground/50">·</span>
                        <span className={art.status === 'PUBLISHED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                          <Badge
                            variant={art.status === 'PUBLISHED' ? 'default' : 'secondary'}
                            style={{ fontWeight: 500 }}
                          >
                            {ARTICLE_STATUS_LABEL[art.status] ?? art.status}
                          </Badge>
                        </span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-[11px] font-mono text-muted-foreground">v{art.versionNo}</span>
                      </div>
                      {art.summary && <p className="text-xs text-muted-foreground line-clamp-2">{art.summary}</p>}
                      <p className="text-[11px] text-muted-foreground">
                        Tác giả: {art.author.fullName} · {art.viewCount} lượt xem · {art.helpfulCount} hữu ích ·{' '}
                        {art.commentCount} bình luận · Cập nhật {formatDateTime(art.updatedAt)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setOpenArticleId(art.id)}>
                      <Eye className="h-3.5 w-3.5" /> Đọc bài
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: HỘP DUYỆT BÀI */}
      {activeTab === 'reviews' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hộp phê duyệt bài viết tri thức ({pendingCount})</CardTitle>
            <CardDescription>Các bản thảo đang chờ quản lý Space hoặc KM_MANAGER thẩm định xuất bản.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviewsQ.isLoading ? (
              <LoadingBlock label="Đang tải hộp duyệt…" />
            ) : !pendingReviewsQ.data?.length ? (
              <EmptyState title="Hộp duyệt trống" description="Hiện không có bản thảo tri thức nào chờ phê duyệt." />
            ) : (
              pendingReviewsQ.data.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 text-xs">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setOpenArticleId(item.id)}
                      className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {item.title}
                    </button>
                    {item.summary && <p className="text-muted-foreground">{item.summary}</p>}
                    <p className="text-muted-foreground">
                      Space: <strong>{item.space.name}</strong> · Tác giả: <strong>{item.author.fullName}</strong> · Trình duyệt lúc{' '}
                      {formatDateTime(item.submittedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setOpenArticleId(item.id)}>
                      <Eye className="h-3.5 w-3.5" /> Xem &amp; Thẩm định
                    </Button>
                    <Button
                      size="sm"
                      disabled={reviewArticle.isPending}
                      onClick={() => reviewArticle.mutate({ id: item.id, action: 'APPROVE' })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt xuất bản
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TÌM KIẾM TOÀN VĂN FTS */}
      {activeTab === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tìm kiếm toàn văn Tri thức (PostgreSQL FTS + pg_trgm)</CardTitle>
            <CardDescription>Tìm xuyên tiêu đề, tóm tắt và nội dung Markdown của toàn bộ bài đã xuất bản trong phạm vi được phép xem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setFtsQuery(ftsInput.trim());
              }}
            >
              <Input
                value={ftsInput}
                onChange={(e) => setFtsInput(e.target.value)}
                placeholder="Nhập từ khóa chuyên môn, quy trình, hướng dẫn…"
                className="flex-1 min-w-[240px]"
              />
              <Select value={ftsSpaceId} onChange={(e) => setFtsSpaceId(e.target.value)} className="w-48">
                <option value="">Tất cả Space được xem</option>
                {spaces.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={!ftsInput.trim()}>
                <Search className="h-4 w-4" /> Tìm kiếm
              </Button>
            </form>

            {ftsQuery ? (
              ftsQ.isLoading ? (
                <LoadingBlock label="Đang truy vấn PostgreSQL Full-Text Search…" />
              ) : !ftsQ.data?.length ? (
                <EmptyState title="Không tìm thấy bài viết khớp từ khóa" description={`Từ khóa "${ftsQuery}" chưa khớp bài viết xuất bản nào.`} />
              ) : (
                <div className="space-y-2.5">
                  {ftsQ.data.map((hit) => (
                    <div key={hit.id} className="rounded-lg border border-border p-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenArticleId(hit.id)}
                          className="text-sm font-semibold text-primary hover:underline text-left"
                        >
                          {hit.title}
                        </button>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-primary">
                          <Badge variant="secondary" className="font-mono" style={{ fontWeight: 500 }}>
                            Điểm khớp {hit.score.toFixed(2)}
                          </Badge>
                        </span>
                      </div>
                      {hit.summary && <p className="mt-1 text-muted-foreground">{hit.summary}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {hit.space.name} · {hit.authorName} ·{' '}
                        {hit.publishedAt ? `Xuất bản ${formatDate(hit.publishedAt)}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: LỘ TRÌNH ĐỌC HỘI NHẬP */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lộ trình đọc hội nhập của tôi</CardTitle>
              <CardDescription>Hoàn thành các bài tri thức bắt buộc khi nhận việc hoặc chuyển vị trí.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myOnboardingQ.isLoading ? (
                <LoadingBlock label="Đang tải lộ trình của bạn…" />
              ) : !myOnboardingQ.data?.length ? (
                <p className="text-xs text-muted-foreground">Bạn hiện chưa được giao lộ trình đọc tri thức nào.</p>
              ) : (
                myOnboardingQ.data.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-border p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{assignment.path.title}</p>
                        {assignment.path.description && <p className="text-muted-foreground">{assignment.path.description}</p>}
                      </div>
                      <span className={assignment.progressPercent === 100 ? 'shrink-0 text-emerald-700 dark:text-emerald-400' : 'shrink-0 text-muted-foreground'}>
                        <Badge
                          variant={assignment.progressPercent === 100 ? 'default' : 'secondary'}
                          style={{ fontWeight: assignment.progressPercent === 100 ? 600 : 500 }}
                        >
                          Tiến độ {assignment.progressPercent}%
                        </Badge>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {assignment.items.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/70 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setOpenArticleId(item.article.id)}
                            className="font-medium text-primary hover:underline text-left"
                          >
                            {item.article.title}
                          </button>
                          {item.completed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={completeOnboardingItem.isPending}
                              onClick={() =>
                                completeOnboardingItem.mutate({ assignmentId: assignment.id, itemId: item.id })
                              }
                            >
                              Đánh dấu đã đọc
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {canManageOnboarding && (
            <Card>
              <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Thư viện Lộ trình Hội nhập</CardTitle>
                  <CardDescription>Thiết kế lộ trình từ các bài đã xuất bản trong Space và giao cho nhân sự.</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setPathModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Tạo lộ trình mới
                </Button>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {!onboardingPathsQ.data?.length ? (
                  <p className="text-xs text-muted-foreground">Chưa có lộ trình nào được tạo.</p>
                ) : (
                  onboardingPathsQ.data.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-xs">
                      <div>
                        <p className="font-semibold text-sm">{p.title}</p>
                        <p className="text-muted-foreground">
                          {p.itemCount} bài đọc · Đã giao cho {p.assignedCount} nhân sự
                          {p.targetJobTitle ? ` · Vị trí: ${p.targetJobTitle}` : ''}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setAssignModalPath(p)}>
                        Giao nhân sự
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: DANH BẠ CHUYÊN GIA */}
      {activeTab === 'experts' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Danh bạ Chuyên môn (&quot;Ai biết gì&quot;)</CardTitle>
                <CardDescription>Định vị chuyên gia nội bộ theo lĩnh vực, đơn vị và số bài tri thức đã xuất bản.</CardDescription>
              </div>
              <Input
                value={expertSearch}
                onChange={(e) => setExpertSearch(e.target.value)}
                placeholder="Tìm tên, chức danh, kỹ năng…"
                className="w-60 text-xs"
              />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {expertsQ.isLoading ? (
                <LoadingBlock label="Đang tải danh bạ…" />
              ) : !expertsQ.data?.length ? (
                <p className="text-xs text-muted-foreground">Không có chuyên gia nào khớp từ khóa.</p>
              ) : (
                expertsQ.data.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => setSelectedExpertId(person.id)}
                    className={`rounded-lg border p-3 text-left text-xs transition-colors ${
                      selectedExpertId === person.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <p className="font-semibold text-sm text-foreground">{person.fullName}</p>
                    <p className="text-muted-foreground">
                      {[person.jobTitle, person.orgUnit?.name].filter(Boolean).join(' · ') || person.email}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      {person.expertise.map((tag) => (
                        <span key={tag} className="text-foreground/80">
                          <Badge variant="secondary" className="text-[11px]" style={{ fontWeight: 500 }}>
                            #{tag}
                          </Badge>
                        </span>
                      ))}
                      {person.expertise.length > 0 && <span className="text-muted-foreground/50">·</span>}
                      <span className="text-muted-foreground">
                        <Badge variant="outline" className="text-[11px]" style={{ fontWeight: 500 }}>
                          {person.publishedCount} bài xuất bản
                        </Badge>
                      </span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-sm">Hồ sơ &amp; Đóng góp Tri thức</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {!selectedExpertId ? (
                <p className="text-muted-foreground">Chọn một nhân sự bên trái để xem chuyên môn và các bài viết tri thức của họ.</p>
              ) : expertDetailQ.isLoading ? (
                <LoadingBlock label="Đang tải chi tiết…" />
              ) : expertDetailQ.data ? (
                <>
                  <div>
                    <p className="text-sm font-semibold">{expertDetailQ.data.fullName}</p>
                    <p className="text-muted-foreground">{expertDetailQ.data.jobTitle} · {expertDetailQ.data.orgUnit?.name}</p>
                    {expertDetailQ.data.bio && <p className="mt-2 text-muted-foreground">{expertDetailQ.data.bio}</p>}
                  </div>
                  <div className="space-y-1.5 border-t border-border pt-2.5">
                    <p className="font-semibold">Bài viết đã xuất bản</p>
                    {expertDetailQ.data.articles.length === 0 ? (
                      <p className="text-muted-foreground">Chưa có bài xuất bản trong phạm vi được xem.</p>
                    ) : (
                      expertDetailQ.data.articles.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setOpenArticleId(a.id)}
                          className="block w-full rounded border border-border/70 p-2 text-left hover:bg-muted/40"
                        >
                          <p className="font-medium text-primary hover:underline">{a.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {a.viewCount} lượt xem · {a.helpfulCount} hữu ích
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL CHI TIẾT BÀI VIẾT + PHIÊN BẢN + DUYỆT + HỎI ĐÁP */}
      <Modal
        open={Boolean(openArticleId)}
        onOpenChange={(open) => !open && setOpenArticleId(null)}
        title={articleDetail?.title ?? 'Chi tiết bài viết tri thức'}
        size="xl"
      >
        {articleDetailQ.isLoading ? (
          <LoadingBlock label="Đang tải nội dung bài viết…" />
        ) : articleDetailQ.isError ? (
          <ErrorState message={errorMessage(articleDetailQ.error)} />
        ) : articleDetail ? (
          <div className="max-h-[70dvh] space-y-5 overflow-y-auto pr-1 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={articleDetail.status === 'PUBLISHED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                    <Badge
                      variant={articleDetail.status === 'PUBLISHED' ? 'default' : 'secondary'}
                      style={{ fontWeight: 500 }}
                    >
                      {ARTICLE_STATUS_LABEL[articleDetail.status] ?? articleDetail.status}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="font-mono text-muted-foreground">Phiên bản v{articleDetail.versionNo}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-muted-foreground">Space: {articleDetail.space.name}</span>
                </div>
                <p className="text-muted-foreground">
                  Tác giả: <strong className="text-foreground">{articleDetail.author.fullName}</strong> ·{' '}
                  {articleDetail.viewCount} lượt xem · {articleDetail.helpfulCount} hữu ích
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={articleDetail.myReaction ? 'default' : 'outline'}
                  disabled={toggleReaction.isPending}
                  onClick={() => toggleReaction.mutate(articleDetail.id)}
                >
                  <Heart className="h-3.5 w-3.5" /> Hữu ích ({articleDetail.helpfulCount})
                </Button>
                {articleDetail.permissions.canEdit && articleDetail.status !== 'ARCHIVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setArticleModal({
                        mode: 'edit',
                        articleId: articleDetail.id,
                        title: articleDetail.title,
                        summary: articleDetail.summary ?? '',
                        contentMd: articleDetail.contentMd,
                        changeNote: '',
                      })
                    }
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Sửa bài (tạo phiên bản mới)
                  </Button>
                )}
                {articleDetail.permissions.canSubmit && articleDetail.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    disabled={submitArticle.isPending}
                    onClick={() => submitArticle.mutate(articleDetail.id)}
                  >
                    <Send className="h-3.5 w-3.5" /> Trình duyệt
                  </Button>
                )}
                {articleDetail.permissions.canArchive && articleDetail.status === 'PUBLISHED' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleArchive.mutate({ id: articleDetail.id, archived: true })}
                  >
                    <Archive className="h-3.5 w-3.5" /> Lưu trữ
                  </Button>
                )}
                {articleDetail.permissions.canArchive && articleDetail.status === 'ARCHIVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleArchive.mutate({ id: articleDetail.id, archived: false })}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Khôi phục
                  </Button>
                )}
              </div>
            </div>

            {articleDetail.permissions.canReview && articleDetail.status === 'PENDING_REVIEW' && (
              <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <p className="font-semibold text-foreground">Thẩm định xuất bản bài viết</p>
                <Input
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Nhận xét / lý do yêu cầu sửa hoặc từ chối…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={reviewArticle.isPending}
                    onClick={() => reviewArticle.mutate({ id: articleDetail.id, action: 'APPROVE', comment: reviewComment || undefined })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Phê duyệt xuất bản
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewArticle.isPending || !reviewComment.trim()}
                    onClick={() => reviewArticle.mutate({ id: articleDetail.id, action: 'REQUEST_CHANGES', comment: reviewComment })}
                  >
                    Yêu cầu chỉnh sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reviewArticle.isPending}
                    onClick={() => reviewArticle.mutate({ id: articleDetail.id, action: 'REJECT', comment: reviewComment || undefined })}
                  >
                    Từ chối
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <MarkdownViewer content={articleDetail.contentMd} />
            </div>

            {articleDetail.attachments.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-semibold">Tệp đính kèm</p>
                <div className="flex flex-wrap gap-2">
                  {articleDetail.attachments.map((att) => (
                    <Button key={att.id} size="sm" variant="outline" onClick={() => void openProtectedFile(att.url)}>
                      {att.fileName} ({Math.ceil(att.sizeBytes / 1024)} KB)
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <details className="rounded-lg border border-border p-3">
              <summary className="cursor-pointer font-semibold inline-flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Lịch sử phiên bản bất biến ({articleDetail.versions.length})
              </summary>
              <div className="mt-2 space-y-1.5">
                {articleDetail.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                    <span>
                      <strong className="font-mono">v{v.versionNo}</strong> — {v.changeNote || 'Cập nhật'} ({formatDateTime(v.createdAt)})
                    </span>
                    {articleDetail.permissions.canEdit && v.versionNo !== articleDetail.versionNo && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={restoreVersion.isPending}
                        onClick={() => restoreVersion.mutate({ id: articleDetail.id, versionNo: v.versionNo })}
                      >
                        <RotateCcw className="h-3 w-3" /> Khôi phục bản này
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </details>

            {/* Bình luận & Hỏi đáp */}
            <div className="space-y-3 border-t border-border pt-3">
              <p className="font-semibold flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Hỏi đáp &amp; Thảo luận ({commentsQ.data?.length ?? 0})
              </p>
              <div className="space-y-2">
                <Textarea
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Đặt câu hỏi hoặc đóng góp ý kiến cập nhật nội dung…"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={commentIsQuestion}
                      onChange={(e) => setCommentIsQuestion(e.target.checked)}
                    />
                    Đánh dấu là câu hỏi cần giải đáp
                  </label>
                  <Button size="sm" disabled={addComment.isPending || !commentBody.trim()} onClick={() => addComment.mutate()}>
                    Gửi bình luận
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {(commentsQ.data ?? []).map((c) => (
                  <div key={c.id} className="rounded-lg border border-border/80 bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{c.author.fullName}</span>
                        {c.isQuestion && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="text-amber-700 dark:text-amber-400">
                              <Badge variant="secondary" style={{ fontWeight: 500 }}>Câu hỏi</Badge>
                            </span>
                          </>
                        )}
                        {c.resolvedAt && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="text-emerald-700 dark:text-emerald-400">
                              <Badge variant="default" style={{ fontWeight: 500 }}>Đã giải đáp</Badge>
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {c.isQuestion && (
                          <Button size="sm" variant="ghost" onClick={() => resolveComment.mutate(c.id)}>
                            {c.resolvedAt ? 'Mở lại' : 'Đã giải đáp'}
                          </Button>
                        )}
                        {(c.mine || isKmAdmin) && (
                          <Button size="sm" variant="ghost" onClick={() => deleteComment.mutate(c.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* MODAL TẠO SPACE */}
      <Modal open={spaceModalOpen} onOpenChange={setSpaceModalOpen} title="Tạo Không gian Tri thức (Space)">
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label>Tên không gian *</Label>
            <Input value={spaceForm.name} onChange={(e) => setSpaceForm((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Quy trình Kỹ thuật & Vận hành" />
          </div>
          <div className="space-y-1.5">
            <Label>Phạm vi hiển thị</Label>
            <Select
              value={spaceForm.visibility}
              onChange={(e) => setSpaceForm((p) => ({ ...p, visibility: e.target.value as 'PUBLIC' | 'RESTRICTED' | 'PRIVATE' }))}
            >
              <option value="PUBLIC">PUBLIC — Toàn công ty xem bài xuất bản</option>
              <option value="RESTRICTED">RESTRICTED — Thành viên được cấp quyền</option>
              <option value="PRIVATE">PRIVATE — Nội bộ riêng tư Space</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={spaceForm.description} onChange={(e) => setSpaceForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setSpaceModalOpen(false)}
          onConfirm={() => createSpace.mutate()}
          confirmLabel="Tạo Space"
          pending={createSpace.isPending}
          disabled={!spaceForm.name.trim()}
        />
      </Modal>

      {/* MODAL QUẢN LÝ THÀNH VIÊN SPACE */}
      <Modal open={memberModalOpen} onOpenChange={setMemberModalOpen} title={`Thành viên Space: ${spaceDetailQ.data?.name ?? ''}`}>
        <div className="space-y-4 text-xs">
          <div className="flex gap-2">
            <Select value={memberForm.userId} onChange={(e) => setMemberForm((p) => ({ ...p, userId: e.target.value }))} className="flex-1">
              <option value="">Chọn nhân sự thêm vào Space…</option>
              {(candidateUsersQ.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </Select>
            <Select value={memberForm.spaceRole} onChange={(e) => setMemberForm((p) => ({ ...p, spaceRole: e.target.value as 'MANAGER' | 'EDITOR' | 'CONTRIBUTOR' | 'VIEWER' }))} className="w-36">
              <option value="VIEWER">VIEWER</option>
              <option value="CONTRIBUTOR">CONTRIBUTOR</option>
              <option value="EDITOR">EDITOR</option>
              <option value="MANAGER">MANAGER</option>
            </Select>
            <Button size="sm" disabled={addMember.isPending || !memberForm.userId} onClick={() => addMember.mutate()}>
              Thêm
            </Button>
          </div>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {(spaceDetailQ.data?.members ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                <span>
                  <strong>{m.fullName}</strong> · <span className="text-muted-foreground">{m.email}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    <Badge variant="secondary" className="text-xs" style={{ fontWeight: 500 }}>{m.spaceRole}</Badge>
                  </span>
                  {m.id !== user?.id && (
                    <Button size="sm" variant="ghost" onClick={() => removeMember.mutate(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL VIẾT / SỬA BÀI TRI THỨC */}
      <Modal
        open={Boolean(articleModal)}
        onOpenChange={(open) => !open && setArticleModal(null)}
        title={articleModal?.mode === 'create' ? 'Viết bài tri thức mới' : 'Chỉnh sửa bài viết (sinh phiên bản mới)'}
        size="lg"
      >
        {articleModal && (
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label>Tiêu đề bài viết *</Label>
              <Input
                value={articleModal.title}
                onChange={(e) => setArticleModal((p) => (p ? { ...p, title: e.target.value } : null))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tóm tắt ngắn</Label>
              <Input
                value={articleModal.summary}
                onChange={(e) => setArticleModal((p) => (p ? { ...p, summary: e.target.value } : null))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nội dung Markdown *</Label>
              <Textarea
                rows={10}
                value={articleModal.contentMd}
                onChange={(e) => setArticleModal((p) => (p ? { ...p, contentMd: e.target.value } : null))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú phiên bản</Label>
              <Input
                value={articleModal.changeNote}
                onChange={(e) => setArticleModal((p) => (p ? { ...p, changeNote: e.target.value } : null))}
                placeholder="VD: Bổ sung quy trình bước 3"
              />
            </div>
          </div>
        )}
        <ModalFooterActions
          onCancel={() => setArticleModal(null)}
          onConfirm={() => saveArticle.mutate()}
          confirmLabel="Lưu bài viết"
          pending={saveArticle.isPending}
          disabled={!articleModal?.title.trim() || !articleModal?.contentMd.trim()}
        />
      </Modal>

      {/* MODAL TẠO LỘ TRÌNH HỘI NHẬP */}
      <Modal open={pathModalOpen} onOpenChange={setPathModalOpen} title="Tạo Lộ trình Đọc Hội nhập">
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label>Tên lộ trình *</Label>
            <Input value={pathForm.title} onChange={(e) => setPathForm((p) => ({ ...p, title: e.target.value }))} placeholder="VD: Hội nhập Kỹ sư Backend mới" />
          </div>
          <div className="space-y-1.5">
            <Label>Chức danh áp dụng</Label>
            <Input value={pathForm.targetJobTitle} onChange={(e) => setPathForm((p) => ({ ...p, targetJobTitle: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Chọn bài viết đã xuất bản trong Space hiện tại *</Label>
            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded border border-border p-2.5">
              {publishedForPathPicker.length === 0 ? (
                <p className="text-muted-foreground">Không gian hiện tại chưa có bài đã xuất bản.</p>
              ) : (
                publishedForPathPicker.map((art) => (
                  <label key={art.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pathForm.articleIds.includes(art.id)}
                      onChange={(e) =>
                        setPathForm((p) => ({
                          ...p,
                          articleIds: e.target.checked
                            ? [...p.articleIds, art.id]
                            : p.articleIds.filter((id) => id !== art.id),
                        }))
                      }
                    />
                    <span>{art.title}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setPathModalOpen(false)}
          onConfirm={() => createOnboardingPath.mutate()}
          confirmLabel="Tạo lộ trình"
          pending={createOnboardingPath.isPending}
          disabled={!pathForm.title.trim() || pathForm.articleIds.length === 0}
        />
      </Modal>

      {/* MODAL GIAO LỘ TRÌNH CHO NHÂN SỰ */}
      <Modal
        open={Boolean(assignModalPath)}
        onOpenChange={(open) => !open && setAssignModalPath(null)}
        title={`Giao lộ trình: ${assignModalPath?.title ?? ''}`}
      >
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label>Nhân sự *</Label>
            <Select value={assignForm.userId} onChange={(e) => setAssignForm((p) => ({ ...p, userId: e.target.value }))}>
              <option value="">Chọn nhân sự…</option>
              {(candidateUsersQ.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Hạn hoàn thành</Label>
            <Input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm((p) => ({ ...p, dueDate: e.target.value }))} />
          </div>
        </div>
        <ModalFooterActions
          onCancel={() => setAssignModalPath(null)}
          onConfirm={() => assignOnboardingPath.mutate()}
          confirmLabel="Giao lộ trình"
          pending={assignOnboardingPath.isPending}
          disabled={!assignForm.userId}
        />
      </Modal>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<LoadingBlock label="Đang tải Cổng Tri thức…" />}>
      <KnowledgePortalInner />
    </Suspense>
  );
}
