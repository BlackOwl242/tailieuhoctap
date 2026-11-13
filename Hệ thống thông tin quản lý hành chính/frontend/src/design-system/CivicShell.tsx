import {
  BookOpen,
  CalendarClock,
  FilePlus2,
  FolderSearch,
  Home,
  LayoutGrid,
  Menu,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types'
import { GovTrustBanner, SkipLink } from './Primitives'

const CITIZEN_NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/thu-tuc', label: 'Danh mục thủ tục', icon: LayoutGrid },
  { href: '/nop-ho-so', label: 'Nộp hồ sơ trực tuyến', icon: FilePlus2 },
  { href: '/tra-cuu-ho-so', label: 'Tra cứu hồ sơ', icon: FolderSearch },
  { href: '/tien-ich', label: 'Lịch hẹn & Phản ánh', icon: CalendarClock },
  { href: '/huong-dan', label: 'Hướng dẫn', icon: BookOpen },
] as const

function isNavItemActive(currentPath: string, itemHref: string): boolean {
  if (itemHref === '/') return currentPath === '/' || currentPath.startsWith('/tin-tuc')
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`)
}

export function CivicShell({
  currentPath,
  citizenUser,
  onNavigate,
  onLogoutCitizen,
  mainClassName = '',
  children,
}: {
  currentPath: string
  citizenUser?: User | null
  onNavigate: (path: string) => void
  onLogoutCitizen?: () => void
  mainClassName?: string
  children: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [largeFont, setLargeFont] = useState(() => {
    try {
      return window.localStorage.getItem('hcds_large_font') === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-surface', 'citizen')
    if (largeFont) {
      document.documentElement.setAttribute('data-font-scale', 'large')
    } else {
      document.documentElement.removeAttribute('data-font-scale')
    }
    try {
      window.localStorage.setItem('hcds_large_font', largeFont ? '1' : '0')
    } catch {
      /* ignore storage restrictions */
    }
  }, [largeFont])

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    setMobileOpen(false)
    onNavigate(href)
  }

  return (
    <div className="civic-shell" data-surface="citizen">
      <SkipLink targetId="main-content" />

      <GovTrustBanner
        citizenUser={citizenUser}
        largeFont={largeFont}
        onToggleLargeFont={() => setLargeFont(prev => !prev)}
        onNavigate={onNavigate}
        onLogoutCitizen={onLogoutCitizen}
      />

      <header className="civic-masthead">
        <div className="civic-masthead__inner">
          <a
            href="/"
            className="civic-masthead__brand"
            onClick={e => handleNavClick(e, '/')}
          >
            <img
              src="/images/hanoi-logo.png"
              alt="Biểu trưng Thành phố Hà Nội"
              width={52}
              height={56}
              className="civic-masthead__emblem"
            />
            <span className="civic-masthead__titles">
              <span className="civic-masthead__governing">
                TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG THÀNH PHỐ HÀ NỘI
              </span>
              <span className="civic-masthead__system-name">
                HỆ THỐNG THÔNG TIN GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH
              </span>
              <span className="civic-masthead__subtitle">
                Cổng dịch vụ công trực tuyến phục vụ người dân, tổ chức tại cấp thành phố và 126 UBND phường, xã
              </span>
            </span>
          </a>

          <div className="civic-masthead__hotline" aria-label="Tổng đài hỗ trợ công dân">
            <PhoneCall size={20} strokeWidth={1.75} color="var(--p-red-700)" aria-hidden="true" />
            <div>
              <span className="civic-masthead__hotline-label">Tổng đài hỗ trợ dịch vụ công</span>
              <strong className="civic-masthead__hotline-num">024 1022 · Nhánh 7</strong>
            </div>
          </div>
        </div>
      </header>

      <nav className="civic-navbar" aria-label="Điều hướng dịch vụ công chính">
        <div className="civic-navbar__inner">
          <button
            type="button"
            className="civic-navbar__mobile-btn"
            aria-expanded={mobileOpen}
            aria-controls="civic-primary-menu"
            onClick={() => setMobileOpen(prev => !prev)}
          >
            {mobileOpen ? (
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
            )}
            <span>Danh mục menu</span>
          </button>

          <div
            id="civic-primary-menu"
            className={`civic-navbar__links ${mobileOpen ? 'is-open' : ''}`.trim()}
          >
            {CITIZEN_NAV_ITEMS.map(item => {
              const Icon = item.icon
              const active = isNavItemActive(currentPath, item.href)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`civic-navbar__link ${active ? 'is-active' : ''}`.trim()}
                  aria-current={active ? 'page' : undefined}
                  onClick={e => handleNavClick(e, item.href)}
                >
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              )
            })}
          </div>

          <div className="civic-navbar__account">
            {citizenUser ? (
              <a
                href="/tai-khoan"
                className="civic-navbar__cta"
                aria-current={currentPath.startsWith('/tai-khoan') ? 'page' : undefined}
                onClick={e => handleNavClick(e, '/tai-khoan')}
              >
                <UserCheck size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Không gian công dân số</span>
              </a>
            ) : (
              <a
                href="/dang-nhap"
                className="civic-navbar__cta"
                aria-current={currentPath === '/dang-nhap' ? 'page' : undefined}
                onClick={e => handleNavClick(e, '/dang-nhap')}
              >
                <UserCheck size={16} strokeWidth={1.75} aria-hidden="true" />
                <span>Tài khoản công dân</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      <main id="main-content" className={`civic-main ${mainClassName}`.trim()} tabIndex={-1}>
        {children}
      </main>

      <footer className="civic-footer" aria-label="Thông tin cơ quan quản lý vận hành">
        <div className="civic-footer__inner">
          <div className="civic-footer__meta">
            <div className="civic-footer__title">
              TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG THÀNH PHỐ HÀ NỘI
            </div>
            <p>
              <b>Đơn vị vận hành:</b> Hệ thống Thông tin Giải quyết Thủ tục Hành chính TP. Hà Nội
              (Môi trường nghiên cứu & thực hành cục bộ)
            </p>
            <p>
              <b>Địa chỉ tham chiếu:</b> Số 197 phố Nghi Tàm, phường Yên Phụ, TP. Hà Nội
            </p>
            <p className="tabular-nums">
              <b>Tổng đài hỗ trợ:</b> 024 1022 (Nhánh 7) · Tổng đài AI: 1900 1009 · Email công vụ:
              dichvucong@hanoi.gov.vn
            </p>
          </div>

          <div>
            <div className="civic-footer__title">Sơ đồ cổng dịch vụ công</div>
            <ul className="civic-footer__links">
              <li>
                <a href="/thu-tuc" onClick={e => handleNavClick(e, '/thu-tuc')}>
                  Danh mục 2.075 thủ tục hành chính
                </a>
              </li>
              <li>
                <a href="/nop-ho-so" onClick={e => handleNavClick(e, '/nop-ho-so')}>
                  Nộp hồ sơ trực tuyến 5 bước
                </a>
              </li>
              <li>
                <a href="/tra-cuu-ho-so" onClick={e => handleNavClick(e, '/tra-cuu-ho-so')}>
                  Tra cứu tiến độ & kết quả giải quyết
                </a>
              </li>
              <li>
                <a href="/tien-ich" onClick={e => handleNavClick(e, '/tien-ich')}>
                  Đặt lịch hẹn Một cửa & Phản ánh kiến nghị
                </a>
              </li>
              <li>
                <a href="/tai-khoan" onClick={e => handleNavClick(e, '/tai-khoan')}>
                  Không gian công dân số & Kho tài liệu điện tử
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="civic-footer__title">Tiêu chuẩn pháp lý & Trợ giúp</div>
            <ul className="civic-footer__links">
              <li>
                <a href="/huong-dan" onClick={e => handleNavClick(e, '/huong-dan')}>
                  Hướng dẫn sử dụng cho người dân & cán bộ
                </a>
              </li>
              <li>
                <a href="/staff" onClick={e => handleNavClick(e, '/staff')}>
                  Bàn làm việc nội bộ cán bộ Một cửa
                </a>
              </li>
              <li>
                <span>Tuân thủ Nghị định 42/2022/NĐ-CP & Thông tư 21, 22/2023/TT-BTTTT</span>
              </li>
              <li>
                <span>Bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="civic-footer__bottom">
          <span>
            © Hệ thống Thông tin Giải quyết TTHC TP. Hà Nội · Chuẩn giao diện Chính phủ số (WCAG 2.2 AA)
          </span>
          <span className="civic-emc-badge">
            <ShieldCheck size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Tương thích chuẩn giám sát Chính phủ số (EMC) & Bộ chỉ số Quyết định 766/QĐ-TTg</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
