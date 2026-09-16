'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, LogOut, Trash2, Edit3, Send, Clock, FileText, CheckCircle2,
  AlertCircle, ShieldCheck, Lock, UserCheck, Phone, MapPin, Building
} from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import type { MeProfile } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import {
  Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Skeleton
} from '@/components/ui/primitives';
import { PageHeader, ErrorState } from '@/components/common/states';
import { ProfileChangeRequestModal } from '@/components/personnel/ProfileChangeRequestModal';

interface FaceStatus {
  consentAt: string | null;
  samples: Array<{ id: string; dimensions: number; createdAt: string }>;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'tiers' | 'requests' | 'security'>('tiers');
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  // Dữ liệu người dùng hiện tại
  const meQ = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<MeProfile>('/auth/me')).data,
  });

  const me = meQ.data;

  // Dữ liệu hồ sơ toàn diện (đầy đủ các trường)
  const profileQ = useQuery({
    queryKey: ['my-comprehensive-profile', me?.id],
    queryFn: async () => {
      if (!me?.id) return null;
      return (await api.get(`/personnel-profiles/${me.id}`)).data;
    },
    enabled: !!me?.id,
  });

  const profile = profileQ.data;

  // Dữ liệu các yêu cầu thay đổi của tôi
  const myRequestsQ = useQuery<any[]>({
    queryKey: ['my-profile-change-requests'],
    queryFn: async () => (await api.get('/profile-change-requests/my')).data,
    enabled: !!me?.id,
  });

  // Dữ liệu sinh trắc học khuôn mặt
  const faceQ = useQuery({
    queryKey: ['face-status'],
    queryFn: async () => (await api.get<FaceStatus>('/attendance/face/enrollments')).data,
  });

  // State Form chỉnh sửa trực tiếp Mức 1
  const [tier1Form, setTier1Form] = useState({
    phone: '',
    currentAddress: '',
    bio: '',
    strengths: '',
    expertise: '',
  });

  useEffect(() => {
    if (me || profile) {
      setTier1Form({
        phone: profile?.user?.phone || me?.phone || '',
        currentAddress: profile?.currentAddress || profile?.user?.address || '',
        bio: profile?.user?.bio || me?.bio || '',
        strengths: profile?.strengths || '',
        expertise: (me?.expertise || profile?.user?.expertise || []).join(', '),
      });
    }
  }, [me, profile]);

  // Mutation cập nhật trực tiếp Mức 1
  const updateTier1Mutation = useMutation({
    mutationFn: async () => {
      const expArray = tier1Form.expertise
        ? tier1Form.expertise.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      return (
        await api.patch('/personnel-profiles/me/self-update', {
          phone: tier1Form.phone || undefined,
          currentAddress: tier1Form.currentAddress || undefined,
          bio: tier1Form.bio || undefined,
          strengths: tier1Form.strengths || undefined,
          expertise: expArray,
        })
      ).data;
    },
    onSuccess: () => {
      toast('Đã cập nhật thông tin thành công!', 'success');
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['my-comprehensive-profile'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutation xóa mẫu khuôn mặt
  const delFace = useMutation({
    mutationFn: async () => api.delete('/attendance/face/enrollments'),
    onSuccess: () => {
      toast('Đã xóa toàn bộ mẫu khuôn mặt', 'success');
      qc.invalidateQueries({ queryKey: ['face-status'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Đăng xuất khỏi mọi thiết bị
  const logoutAll = useMutation({
    mutationFn: async () => api.post<{ revoked: number }>('/auth/logout-all'),
    onSuccess: (res) => {
      toast(`Đã thu hồi ${res.data.revoked} phiên đăng nhập trên mọi thiết bị`, 'success');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  // Mutation hủy yêu cầu đang chờ
  const cancelRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.post(`/profile-change-requests/${id}/cancel`)).data;
    },
    onSuccess: () => {
      toast('Đã hủy đề xuất điều chỉnh thông tin!', 'success');
      qc.invalidateQueries({ queryKey: ['my-profile-change-requests'] });
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  if (meQ.isLoading || !me) return <Skeleton className="h-64" />;

  const myRequests = myRequestsQ.data || [];
  const pendingRequestsCount = myRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Hồ Sơ Cá Nhân */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Hồ Sơ Cá Nhân"
          description="Quản trị thông tin nhân sự theo phân cấp và tiếp nhận đề xuất điều chỉnh hồ sơ."
        />
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChangeModalOpen(true)}
          >
            Đề xuất thay đổi thông tin (Mức 2)
          </Button>
        </div>
      </div>

      {/* Card Tóm Tắt Thông Tin Cá Nhân */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-14 w-14 border border-border">
            <AvatarFallback className="bg-muted text-foreground text-base font-semibold">
              {me.fullName?.split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">{me.fullName}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {profile?.user?.employeeCode || me.employeeCode || 'EMP-2026'}
              </span>
              <span className="text-xs text-muted-foreground">
                · {me.jobTitle || 'Chuyên viên'}{me.orgUnit ? ` · ${me.orgUnit.name}` : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{me.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Điều Hướng */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === 'tiers' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('tiers')}
        >
          Thông tin cá nhân (3 Mức độ)
        </Button>

        <Button
          variant={activeTab === 'requests' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('requests')}
        >
          Lịch sử đề xuất
          {pendingRequestsCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/20 text-primary text-xs px-1.5 py-0.5 font-mono font-semibold">
              {pendingRequestsCount}
            </span>
          )}
        </Button>

        <Button
          variant={activeTab === 'security' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('security')}
        >
          Bảo mật & Điểm danh
        </Button>
      </div>

      {/* ================= TAB 1: PHÂN CẤP THÔNG TIN 3 MỨC ĐỘ ================= */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Thông tin hồ sơ được chia theo 3 mức độ quản trị dữ liệu: Mức 1 (Tự cập nhật), Mức 2 (Cần gửi đề xuất phê duyệt), Mức 3 (Do tổ chức điều hành).
          </p>

          {/* KHỐI MỨC 1: TỰ PHỤC VỤ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">1. Thông tin liên hệ & Giới thiệu</CardTitle>
                <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                  Mức 1: Tự cập nhật
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => updateTier1Mutation.mutate()}
                disabled={updateTier1Mutation.isPending}
              >
                {updateTier1Mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground block">
                    Số điện thoại cá nhân:
                  </label>
                  <Input
                    value={tier1Form.phone}
                    onChange={(e) => setTier1Form({ ...tier1Form, phone: e.target.value })}
                    placeholder="0901234567"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground block">
                    Nơi ở hiện nay / Tạm trú:
                  </label>
                  <Input
                    value={tier1Form.currentAddress}
                    onChange={(e) => setTier1Form({ ...tier1Form, currentAddress: e.target.value })}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground block">
                    Kỹ năng & Chuyên môn (cách nhau bởi dấu phẩy):
                  </label>
                  <Input
                    value={tier1Form.expertise}
                    onChange={(e) => setTier1Form({ ...tier1Form, expertise: e.target.value })}
                    placeholder="Ví dụ: Quản trị dự án, React, Phân tích dữ liệu..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground block">
                    Sở trường công tác:
                  </label>
                  <Input
                    value={tier1Form.strengths}
                    onChange={(e) => setTier1Form({ ...tier1Form, strengths: e.target.value })}
                    placeholder="Ví dụ: Lãnh đạo đội ngũ, giao tiếp, xử lý vấn đề..."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-medium text-foreground block">
                    Giới thiệu bản thân (Bio):
                  </label>
                  <Textarea
                    rows={2}
                    value={tier1Form.bio}
                    onChange={(e) => setTier1Form({ ...tier1Form, bio: e.target.value })}
                    placeholder="Tóm tắt ngắn gọn định hướng, kinh nghiệm cá nhân..."
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KHỐI MỨC 2: ĐỊNH DANH NHÂN THÂN & BẰNG CẤP */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">2. Thông tin nhân thân & Bằng cấp</CardTitle>
                <Badge variant="outline" className="text-xs font-normal">
                  Mức 2: Cần duyệt
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangeModalOpen(true)}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Đề xuất chỉnh sửa
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Họ và tên khai sinh:</span>
                  <p className="font-semibold text-foreground uppercase">{me.fullName}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Ngày sinh:</span>
                  <p className="font-medium text-foreground">
                    {profile?.user?.birthDate || me.birthDate ? formatDate(profile?.user?.birthDate || me.birthDate) : '—'}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Giới tính:</span>
                  <p className="font-medium text-foreground">{profile?.gender || 'Nam'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Số CCCD / Hộ chiếu:</span>
                  <p className="font-mono font-medium text-foreground">{profile?.idCardNo || '—'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Ngày cấp & Nơi cấp:</span>
                  <p className="font-medium text-foreground">
                    {profile?.idCardIssueDate ? formatDate(profile.idCardIssueDate) : '—'} · {profile?.idCardIssuePlace || 'Cục CSQLHC về TTXH'}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Quê quán / Nơi sinh:</span>
                  <p className="font-medium text-foreground">{profile?.hometown || profile?.birthPlace || '—'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1 sm:col-span-2">
                  <span className="text-xs text-muted-foreground block">Hộ khẩu thường trú:</span>
                  <p className="font-medium text-foreground">{profile?.permanentAddress || '—'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Mã số BHXH:</span>
                  <p className="font-mono font-medium text-foreground">{profile?.socialInsuranceNo || '—'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Trình độ học vấn cao nhất:</span>
                  <p className="font-medium text-foreground">
                    {profile?.highestDegree || 'Đại học'} · {profile?.majorName || 'Chuyên ngành'}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Ngoại ngữ & Tin học:</span>
                  <p className="font-medium text-foreground">
                    {profile?.foreignLanguage || 'Tiếng Anh B2'} · {profile?.informaticsLevel || 'Chuẩn CNTT'}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Dân tộc / Tôn giáo:</span>
                  <p className="font-medium text-foreground">
                    {profile?.ethnicity || 'Kinh'} · {profile?.religion || 'Không'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KHỐI MỨC 3: TỔ CHỨC & TIỀN LƯƠNG */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">3. Thông tin tổ chức & Tiền lương</CardTitle>
                <Badge variant="outline" className="text-xs font-normal">
                  Mức 3: Tổ chức quản lý
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Mã nhân viên:</span>
                  <p className="font-mono font-medium text-foreground">{profile?.user?.employeeCode || me.employeeCode || '—'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Phòng ban / Đơn vị:</span>
                  <p className="font-medium text-foreground">{me.orgUnit?.name || 'Văn phòng'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Chức vụ:</span>
                  <p className="font-medium text-foreground">{me.jobTitle || 'Chuyên viên'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Ngày tuyển dụng:</span>
                  <p className="font-medium text-foreground">{me.hireDate ? formatDate(me.hireDate) : '—'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Ngạch bậc:</span>
                  <p className="font-medium text-foreground">{profile?.rank?.name || profile?.rankCode || 'Chuyên viên'}</p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Bậc & Hệ số lương:</span>
                  <p className="font-mono font-medium text-foreground">
                    Bậc {profile?.salaryStep || 1} · HS: {profile?.salaryCoefficient || 2.34}
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Phụ cấp chức vụ / VK:</span>
                  <p className="font-medium text-foreground">
                    {profile?.positionAllowance || 0} · {profile?.overGradePercent || 0}%
                  </p>
                </div>

                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Đoàn - Đảng - Quân ngũ:</span>
                  <p className="font-medium text-foreground">
                    {profile?.partyPosition || 'Đảng viên'} {profile?.militaryRank ? `· ${profile.militaryRank}` : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 2: LỊCH SỬ ĐỀ XUẤT CỦA TÔI ================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Theo dõi tiến độ các yêu cầu điều chỉnh thông tin hồ sơ đã gửi tới Phòng Nhân sự.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangeModalOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              Tạo đề xuất mới
            </Button>
          </div>

          {myRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Bạn chưa có đề xuất điều chỉnh nào. Bấm &ldquo;Tạo đề xuất mới&rdquo; khi cần cập nhật thông tin Mức 2.
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          Yêu cầu #{req.id.slice(0, 8)}
                        </span>
                        <span className="text-muted-foreground">
                          · {formatDate(req.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'PENDING' && (
                          <Badge variant="outline" className="text-xs font-normal gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Chờ thẩm định
                          </Badge>
                        )}
                        {req.status === 'APPROVED' && (
                          <Badge variant="outline" className="text-xs font-normal gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đã duyệt
                          </Badge>
                        )}
                        {req.status === 'REJECTED' && (
                          <Badge variant="outline" className="text-xs font-normal gap-1.5 text-destructive border-destructive/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            Từ chối
                          </Badge>
                        )}
                        {req.status === 'CANCELLED' && (
                          <Badge variant="outline" className="text-xs font-normal gap-1.5 text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            Đã hủy
                          </Badge>
                        )}

                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => cancelRequestMutation.mutate(req.id)}
                            disabled={cancelRequestMutation.isPending}
                            className="text-xs text-destructive hover:underline ml-2"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Chi tiết các trường thay đổi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(req.changes || {}).map(([k, c]: [string, any]) => (
                        <div key={k} className="p-2 rounded-md border border-border bg-muted/20 space-y-0.5">
                          <span className="text-xs text-muted-foreground block">{c.label}</span>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="text-muted-foreground truncate">{c.oldValue ? String(c.oldValue) : '(Trống)'}</span>
                            <span className="text-muted-foreground">➡️</span>
                            <span className="text-foreground truncate">{String(c.newValue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-muted-foreground">
                      Lý do: &ldquo;{req.reason}&rdquo;
                    </p>

                    {req.reviewerNote && (
                      <div className="p-2 rounded border border-border bg-muted/30 text-xs space-y-0.5">
                        <span className="font-semibold text-foreground">Nhận xét từ Phòng Nhân sự:</span>
                        <p className="text-muted-foreground italic">&ldquo;{req.reviewerNote}&rdquo;</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: BẢO MẬT & SINH TRẮC HỌC ================= */}
      {activeTab === 'security' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Dữ liệu sinh trắc học */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Camera className="h-4 w-4" /> Khuôn mặt & quyền riêng tư
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faceQ.isLoading ? (
                <Skeleton className="h-16" />
              ) : faceQ.isError ? (
                <ErrorState message={errorMessage(faceQ.error)} />
              ) : (
                <>
                  <p className="text-xs flex items-center gap-2">
                    Đồng thuận:{' '}
                    {faceQ.data!.consentAt ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        Đã đồng ý lúc {formatDate(faceQ.data!.consentAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        Chưa đồng ý
                      </span>
                    )}
                  </p>
                  <p className="text-xs">
                    Mẫu đã đăng ký: <strong>{faceQ.data!.samples.length}</strong> (vector mã hóa)
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link href="/check-in?mode=face">
                      <Button size="sm" variant="outline">Đăng ký / Điểm danh</Button>
                    </Link>
                    {faceQ.data!.samples.length > 0 ? (
                      <Button size="sm" variant="destructive" onClick={() => delFace.mutate()}>
                        <Trash2 className="h-4 w-4" /> Xóa tất cả mẫu
                      </Button>
                    ) : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Phiên đăng nhập & bảo mật */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <LogOut className="h-4 w-4" /> Phiên đăng nhập & bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Đăng xuất khỏi mọi thiết bị sẽ thu hồi toàn bộ phiên đăng nhập của bạn. Các thiết bị khác sẽ phải đăng nhập lại ở lần truy cập kế tiếp.
              </p>
              <Button variant="outline" size="sm" disabled={logoutAll.isPending} onClick={() => logoutAll.mutate()}>
                <LogOut className="h-4 w-4" /> Đăng xuất khỏi mọi thiết bị
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal đề xuất thay đổi Mức 2 */}
      <ProfileChangeRequestModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        currentProfileData={profile || me}
        onSuccess={() => setActiveTab('requests')}
      />
    </div>
  );
}
