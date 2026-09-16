// Các kiểu dữ liệu dùng chung giữa các trang — khớp contract của backend API

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
}

export interface MeProfile extends Omit<AuthUser, 'roles'> {
  jobTitle: string | null;
  expertise: string[];
  bio: string | null;
  avatarUrl: string | null;
  orgUnit: { id: string; name: string; code: string } | null;
  faceConsentAt: string | null;
  status: string;
  roles: string[];
  isAdminOrKm: boolean;
  phone?: string | null;
  employeeCode?: string | null;
  birthDate?: string | null;
  hireDate?: string | null;
}

export interface SpaceSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  visibility: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
  orgUnit?: { id: string; name: string } | null;
  publishedCount: number;
  memberCount: number;
  myRole: string | null;
  createdAt: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  author: { id: string; fullName: string; avatarUrl: string | null };
  versionNo: number;
  publishedAt: string | null;
  updatedAt: string;
  viewCount: number;
  helpfulCount: number;
  commentCount: number;
}

export interface ArticleDetail extends ArticleListItem {
  space: { id: string; name: string; slug: string; visibility: string };
  category: { id: string; name: string; slug: string } | null;
  tags: Array<{ id: string; name: string; slug: string }>;
  contentMd: string;
  versions: Array<{ id: string; versionNo: number; changeNote: string | null; authorId: string; createdAt: string }>;
  timeline: Array<{ action: string; comment: string | null; at: string; reviewer: { id: string; fullName: string; avatarUrl: string | null } }>;
  attachments: Array<{ id: string; fileName: string; url: string; sizeBytes: number }>;
  archivedAt: string | null;
  reviewDueAt: string | null;
  myReaction: boolean;
  myBookmark: boolean;
  permissions: { canEdit: boolean; canSubmit: boolean; canReview: boolean; canArchive: boolean };
}

export interface CommentItem {
  id: string;
  parentId: string | null;
  body: string;
  isQuestion: boolean;
  resolvedAt: string | null;
  createdAt: string;
  mine: boolean;
  author: { id: string; fullName: string; avatarUrl: string | null; jobTitle: string | null };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface DashboardStats {
  me: {
    pendingReviews: number;
    pendingOnboardingItems: number;
    todayAttendance: { status: string; lateMinutes: number } | null;
  };
  content: { publishedCount: number; pendingReviewCount: number; myDrafts: number };
  attendanceWeek: Array<{ date: string; status: string; lateMinutes: number }>;
  topArticles: Array<{ id: string; title: string; viewCount: number; helpfulCount: number }>;
  recentArticles: Array<{ id: string; title: string; publishedAt: string; author: { fullName: string }; space: { name: string; slug: string } }>;
  hr: {
    totalEmployees: number;
    presentToday: number;
    onLeaveToday: number;
    pendingLeave: number;
    pendingOvertime: number;
    pendingActions: number;
    latestPeriod: { month: number; year: number; status: string } | null;
  };
}

export interface AttendanceDayRow {
  userId: string;
  workDate: string;
  firstInAt: string | null;
  lastOutAt: string | null;
  workedMinutes: number;
  lateMinutes: number;
  earlyMinutes: number;
  status: string;
  eventCount: number;
}

export interface AttendanceEventRow {
  id: string;
  source: string;
  occurredAt: string;
  payload: { punch?: string } | null;
}

export interface OnboardingAssignmentView {
  id: string;
  status: string;
  dueDate: string | null;
  assignedAt: string;
  progressPercent: number;
  path: { id: string; title: string; description: string | null };
  items: Array<{ id: string; article: { id: string; title: string }; completed: boolean; isRequired: boolean }>;
}

export interface HandoverView {
  id: string;
  owner: { id: string; fullName: string; email: string; jobTitle: string | null };
  leavingDate: string;
  status: 'OPEN' | 'CLOSED';
  total: number;
  done: number;
  items: Array<{ id: string; title: string; status: string; articleId: string | null }>;
}

/** Shape lỗi thống nhất từ backend (AllExceptionsFilter). */
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string | null;
}
