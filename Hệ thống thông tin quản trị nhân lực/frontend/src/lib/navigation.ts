import type { ComponentType } from 'react';
import {
  Home, Users, Clock4, Wallet, Briefcase, FolderOpen, Settings,
} from 'lucide-react';
import { isEnterpriseSector, type OrgPrintConfig } from '@/lib/org-config';

export interface NavSubItem {
  href: string;
  label: string;
  badge?: string | number;
}

export interface NavItem {
  href: string;
  label: string;
  badge?: string | number;
  roles?: string[];
  sector?: 'enterprise' | 'state';
  keywords?: string[];
  subItems?: NavSubItem[];
}

export interface NavFolder {
  id: string;
  label: string;
  count?: number;
  items: NavItem[];
}

export interface NavTag {
  id: string;
  label: string;
  count?: number;
  href: string;
}

export interface NavDomain {
  id: string;
  label: string;
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
  roles?: string[];
  folders: NavFolder[];
  tags: NavTag[];
}

export interface SearchableNavItem {
  href: string;
  label: string;
  domainId: string;
  domainLabel: string;
  folderLabel: string;
  icon: ComponentType<{ className?: string }>;
  keywords: string[];
}

/** Nguồn chân lý điều hướng duy nhất cho Sidebar, Sub-sidebar Search, GlobalSearch và CommandPalette. */
export const DOMAINS: NavDomain[] = [
  {
    id: 'workspace',
    label: 'Tổng quan',
    shortLabel: 'Tổng quan',
    icon: Home,
    folders: [
      {
        id: 'ws-general',
        label: 'Bàn làm việc',
        items: [
          { href: '/dashboard', label: 'Tổng quan', keywords: ['trang chu', 'ban dieu khien', 'thong ke', 'home'] },
          { href: '/ess', label: 'Cổng nhân viên', keywords: ['ess', 'ca nhan', 'don tu', 'tu phuc vu'] },
          { href: '/hr-workflows', label: 'Quy trình & xác nhận', keywords: ['giai trinh cong', 'ngan hang thue', 'muon ho so', 'thu viec', 'hoi nhap', 'chot cong', 'chi tieu tuyen dung'] },
          { href: '/org-chart', label: 'Sơ đồ tổ chức', keywords: ['co cau', 'phong ban', 'cay to chuc', 'bo phan'] },
          { href: '/notifications', label: 'Thông báo', keywords: ['viec can xu ly', 'canh bao', 'duyet'] },
          { href: '/profile', label: 'Hồ sơ cá nhân', keywords: ['tai khoan ca nhan', 'doi mat khau', 'thong tin ca nhan'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-daily', label: '#Hàng ngày', href: '/ess' },
      { id: 'tag-my-payslip', label: '#Phiếu lương', href: '/my-payslips' },
      { id: 'tag-alerts', label: '#Thông báo', href: '/notifications' },
    ],
  },
  {
    id: 'personnel',
    label: 'Nhân sự',
    shortLabel: 'Nhân sự',
    icon: Users,
    roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'LINE_MANAGER', 'HR_CB', 'HR_RECRUITER', 'HR_TRAINER', 'AUDITOR'],
    folders: [
      {
        id: 'pers-records',
        label: 'Hồ sơ',
        items: [
          { href: '/employees', label: 'Hồ sơ nhân sự', keywords: ['nhan vien', 'danh sach nhan su', 'hop dong', 'ma nhan vien', 'thue'] },
          { href: '/employees?tab=approvals', label: 'Duyệt yêu cầu sửa hồ sơ', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB'], keywords: ['duyet ho so', 'thay doi thong tin', 'yeu cau sua'] },
          { href: '/assets', label: 'Tài sản', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'LINE_MANAGER', 'HR_CB'], keywords: ['thiet bi', 'laptop', 'cap phat', 'tai san'] },
        ],
      },
      {
        id: 'pers-movements',
        label: 'Chế độ & Ngạch bậc',
        items: [
          { href: '/personnel', label: 'Biến động nhân sự', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'HR_CB'], keywords: ['quyet dinh', 'thuyen chuyen', 'bo nhiem', 'thoi viec', 'ky luat', 'khen thuong', 'hop dong'] },
          { href: '/salary-ranks', label: 'Ngạch, bậc lương khu vực công', sector: 'state', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'HR_CB'], keywords: ['ngach cong chuc', 'nang bac', 'he so luong'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-active', label: '#Đang làm việc', href: '/employees?status=ACTIVE' },
      { id: 'tag-probation', label: '#Thử việc', href: '/employees?status=PROBATION' },
      { id: 'tag-contract', label: '#Biến động', href: '/personnel' },
      { id: 'tag-assets', label: '#Tài sản', href: '/assets' },
    ],
  },
  {
    id: 'time',
    label: 'Chấm công',
    shortLabel: 'Chấm công',
    icon: Clock4,
    folders: [
      {
        id: 'time-attendance',
        label: 'Điểm danh',
        items: [
          { href: '/attendance', label: 'Bảng chấm công', keywords: ['diem danh', 'gio vao ra', 'cham cong', 'cong ca nhan'] },
          { href: '/check-in', label: 'Điểm danh khuôn mặt', keywords: ['camera', 'khuon mat', 'face id', 'kiosk'] },
          { href: '/shifts', label: 'Ca làm việc', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'LINE_MANAGER', 'HR_CB'], keywords: ['phan ca', 'lich truc', 'ca sang', 'ca chieu'] },
          { href: '/hr-workflows?tab=correction', label: 'Giải trình công', keywords: ['bo sung cong', 'thieu gio vao ra', 'sua cong'] },
        ],
      },
      {
        id: 'time-leave',
        label: 'Đơn từ',
        items: [
          { href: '/leave', label: 'Nghỉ phép', keywords: ['don nghi phep', 'phep nam', 'nghi om', 'nghi khong luong'] },
          { href: '/overtime', label: 'Làm thêm giờ', keywords: ['tang ca', 'ot', 'overtime'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-face', label: '#Điểm danh khuôn mặt', href: '/check-in' },
      { id: 'tag-pending-leave', label: '#Nghỉ phép', href: '/leave' },
      { id: 'tag-ot', label: '#Làm thêm giờ', href: '/overtime' },
    ],
  },
  {
    id: 'compensation',
    label: 'Tiền lương',
    shortLabel: 'Tiền lương',
    icon: Wallet,
    folders: [
      {
        id: 'comp-payroll',
        label: 'Tiền lương & Quy chế',
        items: [
          { href: '/my-payslips', label: 'Phiếu lương của tôi', keywords: ['phieu luong', 'payslip', 'luong ca nhan', 'thu nhap', 'thue tncn'] },
          { href: '/salary-bands', label: 'Khung lương vị trí', sector: 'enterprise', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'HR_CB', 'HR_RECRUITER'], keywords: ['dai luong', 'thang luong', 'muc luong'] },
          { href: '/payroll-engine', label: 'Bảng tính lương', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'HR_CB', 'ACCOUNTANT'], keywords: ['chay luong', 'ky luong', 'tinh luong', 'bang luong', 'bhxh', 'thue tncn'] },
          { href: '/payroll-engine?tab=policy', label: 'Chính sách & quy tắc lương', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'HR_CB', 'ACCOUNTANT'], keywords: ['quy che luong', 'giam tru gia canh', 'luong toi thieu vung', 'bao hiem'] },
        ],
      },
      {
        id: 'comp-benefits',
        label: 'Phúc lợi & Chi phí',
        items: [
          { href: '/loans', label: 'Tạm ứng & Vay', keywords: ['ung luong', 'khoan vay', 'ho tro tai chinh'] },
          { href: '/expense-claims', label: 'Công tác phí', keywords: ['chi phi cong tac', 'thanh toan', 'tam ung cong tac'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-my-payslips', label: '#Phiếu lương', href: '/my-payslips' },
      { id: 'tag-payroll-run', label: '#Bảng tính lương', href: '/payroll-engine' },
      { id: 'tag-payroll-policy', label: '#Chính sách lương', href: '/payroll-engine?tab=policy' },
      { id: 'tag-expense-pending', label: '#Công tác phí', href: '/expense-claims' },
    ],
  },
  {
    id: 'talent',
    label: 'Phát triển',
    shortLabel: 'Phát triển',
    icon: Briefcase,
    folders: [
      {
        id: 'talent-recruitment',
        label: 'Tuyển dụng',
        items: [
          { href: '/recruitment-ats', label: 'Tuyển dụng & Phỏng vấn', roles: ['ADMIN', 'KM_MANAGER', 'HR_RECRUITER', 'HR_CB', 'BOD'], keywords: ['ats', 'ung vien', 'tin tuyen dung', 'offer', 'phong van'] },
        ],
      },
      {
        id: 'talent-growth',
        label: 'Đánh giá & Đào tạo',
        items: [
          { href: '/performance', label: 'Đánh giá KPI', keywords: ['kpi', 'muc tieu', 'chu ky danh gia', 'hieu suat'] },
          { href: '/performance?tab=reviews-pip', label: 'Đánh giá 360° & PIP', keywords: ['360', 'pip', 'phat trien', 'ke hoach cai thien', 'khen thuong'] },
          { href: '/performance?tab=templates', label: 'Biểu mẫu đánh giá chuẩn', keywords: ['mau kpi', 'thu vien kpi'] },
          { href: '/performance?tab=rubrics', label: 'Quy ước xếp loại thi đua', keywords: ['xep loai', 'thang diem', 'thi dua'] },
          { href: '/training-grievance', label: 'Đào tạo & Khiếu nại', keywords: ['khoa hoc', 'chung chi', 'khieu nai', 'gop y'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-ats-interview', label: '#Lịch phỏng vấn', href: '/recruitment-ats' },
      { id: 'tag-kpi-q3', label: '#Đánh giá KPI', href: '/performance' },
      { id: 'tag-cert', label: '#Đào tạo', href: '/training-grievance' },
    ],
  },
  {
    id: 'reports-docs',
    label: 'Báo cáo & Tri thức',
    shortLabel: 'Báo cáo',
    icon: FolderOpen,
    folders: [
      {
        id: 'docs-vault',
        label: 'Tri thức & Tài liệu',
        items: [
          { href: '/knowledge', label: 'Cổng tri thức (KMS)', keywords: ['tri thuc', 'bai viet', 'wiki', 'kms', 'space', 'chuyen gia'] },
          { href: '/knowledge?tab=reviews', label: 'Duyệt bài tri thức', keywords: ['duyet bai', 'phe duyet', 'kiem duyet', 'kms'] },
          { href: '/knowledge?tab=onboarding', label: 'Lộ trình hội nhập', keywords: ['hoi nhap', 'onboarding', 'tan binh'] },
          { href: '/documents', label: 'Kho tài liệu', keywords: ['chinh sach', 'quy che', 'bieu mau', 'van ban', 'noi quy'] },
        ],
      },
      {
        id: 'docs-analytics',
        label: 'Phân tích & Báo cáo',
        items: [
          { href: '/analytics', label: 'Phân tích & Ra quyết định (DSS)', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'SHAREHOLDER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'AUDITOR'], keywords: ['dss', 'analytics', 'phan tich', 'ra quyet dinh', 'turnover', 'canh bao', 'bieu do', 'quy luong'] },
          { href: '/personnel-reports', label: 'Báo cáo nhân sự', roles: ['ADMIN', 'KM_MANAGER', 'BOD', 'LINE_MANAGER', 'HR_CB', 'HR_RECRUITER', 'HR_TRAINER', 'AUDITOR', 'ACCOUNTANT'], keywords: ['thong ke', 'bieu mau 2c', 'bao cao lao dong', 'xuat excel'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-kms', label: '#Tri thức KMS', href: '/knowledge' },
      { id: 'tag-dss', label: '#Phân tích DSS', href: '/analytics' },
      { id: 'tag-templates', label: '#Mẫu văn bản', href: '/documents' },
      { id: 'tag-labor-report', label: '#Báo cáo định kỳ', href: '/personnel-reports' },
    ],
  },
  {
    id: 'admin',
    label: 'Quản trị',
    shortLabel: 'Quản trị',
    icon: Settings,
    roles: ['ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD', 'AUDITOR'],
    folders: [
      {
        id: 'admin-users',
        label: 'Phân quyền',
        items: [
          { href: '/admin/roles', label: 'Quản lý phân quyền', roles: ['ADMIN'], keywords: ['rbac', 'vai tro', 'quyen han', 'gan vai tro'] },
          { href: '/admin/users', label: 'Tài khoản', roles: ['ADMIN'], keywords: ['nguoi dung', 'user', 'khoa tai khoan', 'dat lai mat khau', 'gan role'] },
          { href: '/admin/org-units', label: 'Đơn vị phòng ban', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD'], keywords: ['phong ban', 'chi nhanh', 'khoi', 'to chuc'] },
        ],
      },
      {
        id: 'admin-system',
        label: 'Hệ thống',
        items: [
          { href: '/admin/catalogs', label: 'Danh mục gốc', roles: ['ADMIN'], keywords: ['danh muc', 'tham so', 'tra cuu'] },
          { href: '/admin/attendance', label: 'Máy chấm công', roles: ['ADMIN', 'KM_MANAGER', 'HR_CB'], keywords: ['thiet bi', 'webhook', 'hieu chinh cong', 'chot cong thang', 'mo phong'] },
          { href: '/admin/settings', label: 'Cấu hình', roles: ['ADMIN'], keywords: ['cai dat', 'ma nhan vien', 'tien to', 'vai tro mac dinh', 'ten doanh nghiep', 'khu vuc'] },
          { href: '/admin/audit', label: 'Nhật ký', roles: ['ADMIN', 'AUDITOR', 'BOD'], keywords: ['audit log', 'lich su thao tac', 'truy vet'] },
        ],
      },
    ],
    tags: [
      { id: 'tag-user-accounts', label: '#Tài khoản quản trị', href: '/admin/users' },
      { id: 'tag-devices', label: '#Máy chấm công', href: '/admin/attendance' },
      { id: 'tag-settings', label: '#Cấu hình', href: '/admin/settings' },
    ],
  },
];

function stripQuery(href: string): string {
  const idx = href.indexOf('?');
  return idx === -1 ? href : href.slice(0, idx);
}

/** Lọc cây điều hướng theo vai trò người dùng và khu vực tổ chức (doanh nghiệp / nhà nước). */
export function getAvailableDomains(userRoles: string[], orgConfig: OrgPrintConfig): NavDomain[] {
  const enterprise = isEnterpriseSector(orgConfig);
  const currentSector = enterprise ? 'enterprise' : 'state';
  const hasRole = (roles?: string[]) => !roles || roles.some((r) => userRoles.includes(r));

  return DOMAINS.filter((domain) => hasRole(domain.roles))
    .map((domain) => {
      const folders = domain.folders
        .map((folder) => ({
          ...folder,
          items: folder.items.filter(
            (item) => hasRole(item.roles) && (!item.sector || item.sector === currentSector),
          ),
        }))
        .filter((folder) => folder.items.length > 0);

      const allowedExact = new Set<string>();
      const allowedBase = new Set<string>();
      for (const folder of folders) {
        for (const item of folder.items) {
          allowedExact.add(item.href);
          allowedBase.add(stripQuery(item.href));
        }
      }

      const tags = domain.tags.filter(
        (tag) => allowedExact.has(tag.href) || allowedBase.has(stripQuery(tag.href)),
      );

      return { ...domain, folders, tags };
    })
    .filter((domain) => domain.folders.length > 0);
}

/** Trích danh sách phẳng (đã loại trùng) các chức năng mà người dùng được phép truy cập để phục vụ tìm kiếm toàn cục. */
export function getSearchableNavItems(userRoles: string[], orgConfig: OrgPrintConfig): SearchableNavItem[] {
  const domains = getAvailableDomains(userRoles, orgConfig);
  const seen = new Set<string>();
  const out: SearchableNavItem[] = [];
  for (const domain of domains) {
    for (const folder of domain.folders) {
      for (const item of folder.items) {
        if (seen.has(item.href)) continue;
        seen.add(item.href);
        out.push({
          href: item.href,
          label: item.label,
          domainId: domain.id,
          domainLabel: domain.label,
          folderLabel: folder.label,
          icon: domain.icon,
          keywords: item.keywords ?? [],
        });
      }
    }
  }
  return out;
}

/** Suy ra domainId đang active từ pathname + searchParams (ưu tiên khớp query chính xác trước). */
export function resolveDomainIdForRoute(
  domains: NavDomain[],
  pathname: string,
  searchParams: Pick<URLSearchParams, 'get'>,
): string {
  for (const domain of domains) {
    for (const folder of domain.folders) {
      for (const item of folder.items) {
        if (!item.href.includes('?')) continue;
        const [path, query] = item.href.split('?');
        if (pathname !== path) continue;
        const params = new URLSearchParams(query);
        let match = true;
        params.forEach((v, k) => {
          if (searchParams.get(k) !== v) match = false;
        });
        if (match) return domain.id;
      }
    }
  }

  for (const domain of domains) {
    for (const folder of domain.folders) {
      for (const item of folder.items) {
        const base = stripQuery(item.href);
        if (pathname === base || pathname.startsWith(`${base}/`)) {
          return domain.id;
        }
        if (item.subItems?.some((sub) => pathname === stripQuery(sub.href))) {
          return domain.id;
        }
      }
    }
  }

  return domains[0]?.id ?? 'workspace';
}
