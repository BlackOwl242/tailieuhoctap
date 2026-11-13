import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  ExternalLink,
  FilePlus2,
  FolderSearch,
  HeartPulse,
  MessageSquarePlus,
  PhoneCall,
  Scale,
  Search,
  Trees,
  Users,
} from 'lucide-react'
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { handleTabArrows } from './portalUtils'
import './ProcedureDetail.css'

const HANOI_CENTER_ORIGIN = 'https://ttpvhcc.hanoi.gov.vn'

type NewsArticle = {
  id: string
  title: string
  date: string
  section: string
  image: string
  description: string
  body: string
  sourceUrl: string
  featured: boolean
}

export type HomeProps = {
  onNavigate?: (path: string) => void
}

const NEWS_SECTIONS = [
  'Hoạt động của Trung tâm',
  'Hành chính xung kích',
  'Cải cách hành chính',
  'Chuyển đổi số',
  'Tiện ích công dân',
] as const

const HERO_SEARCH_TABS = ['procedures', 'tracking'] as const
type HeroSearchTab = (typeof HERO_SEARCH_TABS)[number]

const POPULAR_KEYWORDS = [
  { label: 'Đăng ký khai sinh', href: '/thu-tuc?q=Đăng+ký+khai+sinh' },
  { label: 'Bản sao trích lục', href: '/thu-tuc?q=Bản+sao+trích+lục' },
  { label: 'Chứng thực', href: '/thu-tuc?field=Chứng+thực' },
  { label: 'Đất đai', href: '/thu-tuc?field=Đất+đai' },
  { label: 'Hộ kinh doanh', href: '/thu-tuc?q=Hộ+kinh+doanh' },
  { label: 'Cung cấp dữ liệu TNMT', href: '/thu-tuc?q=Cung+cấp+dữ+liệu+TNMT' },
] as const

const QUICK_ACTIONS = [
  {
    href: '/nop-ho-so',
    title: 'Nộp hồ sơ trực tuyến',
    description: 'Kê khai biểu mẫu điện tử và đính kèm thành phần hồ sơ',
    Icon: FilePlus2,
  },
  {
    href: '/tra-cuu-ho-so',
    title: 'Tra cứu tiến độ hồ sơ',
    description: 'Theo dõi trạng thái xử lý, hạn giải quyết và kết quả',
    Icon: FolderSearch,
  },
  {
    href: '/tien-ich',
    title: 'Đặt lịch hẹn Một cửa',
    description: 'Đăng ký trước ngày và khung giờ làm việc tại quầy',
    Icon: CalendarClock,
  },
  {
    href: '/tien-ich?tab=phan-anh',
    title: 'Gửi phản ánh, kiến nghị',
    description: 'Tiếp nhận vướng mắc hành chính và trả lời đúng thẩm quyền',
    Icon: MessageSquarePlus,
  },
] as const

const LIFE_EVENT_GROUPS = [
  {
    field: 'Hộ tịch & Cư trú',
    description: 'Đăng ký khai sinh, kết hôn, trích lục hộ tịch, xác nhận tình trạng nhân thân và cư trú.',
    Icon: Users,
  },
  {
    field: 'Chứng thực & Tư pháp',
    description: 'Cấp bản sao từ sổ gốc, chứng thực bản sao điện tử, chữ ký, giao dịch và lý lịch tư pháp.',
    Icon: Scale,
  },
  {
    field: 'Đất đai, Nhà ở & Xây dựng',
    description: 'Đăng ký biến động đất đai, cấp giấy phép xây dựng, quản lý nhà ở và quy hoạch đô thị.',
    Icon: Building2,
  },
  {
    field: 'Hộ kinh doanh & Doanh nghiệp',
    description: 'Đăng ký thành lập hộ kinh doanh, giấy phép đủ điều kiện kinh doanh và an toàn thực phẩm.',
    Icon: Briefcase,
  },
  {
    field: 'Y tế, Giáo dục & An sinh',
    description: 'Hành nghề khám chữa bệnh, tuyển sinh chuyển trường, người có công, bảo trợ xã hội và việc làm.',
    Icon: HeartPulse,
  },
  {
    field: 'Tài nguyên, Môi trường & Đô thị',
    description: 'Cung cấp dữ liệu tài nguyên môi trường, giấy phép môi trường, giao thông đường bộ và hạ tầng.',
    Icon: Trees,
  },
] as const

function readArticleIdFromLocation(): string {
  return new URLSearchParams(window.location.search).get('tin') || ''
}

export function InformationHome({ onNavigate }: HomeProps = {}) {
  const [heroTab, setHeroTab] = useState<HeroSearchTab>('procedures')
  const [procedureQuery, setProcedureQuery] = useState('')
  const [trackingCode, setTrackingCode] = useState('')

  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [selectedId, setSelectedId] = useState<string>(readArticleIdFromLocation)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/public/news', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Không tải được tin tức.')
        }
        return (await response.json()) as { articles: NewsArticle[] }
      })
      .then(result => {
        if (!controller.signal.aborted) {
          setArticles(result.articles || [])
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setArticles([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingNews(false)
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setSelectedId(readArticleIdFromLocation())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigateSpa(url: string) {
    if (onNavigate) {
      onNavigate(url)
      return
    }
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleInternalLink(event: MouseEvent<HTMLAnchorElement>, url: string) {
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
    navigateSpa(url)
  }

  function submitProcedureSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = procedureQuery.trim()
    const url = trimmed ? `/thu-tuc?q=${encodeURIComponent(trimmed)}` : '/thu-tuc'
    navigateSpa(url)
  }

  function submitTrackingSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = trackingCode.trim()
    const url = trimmed
      ? `/tra-cuu-ho-so?code=${encodeURIComponent(trimmed)}`
      : '/tra-cuu-ho-so'
    navigateSpa(url)
  }

  const selected = selectedId ? articles.find(article => article.id === selectedId) : undefined
  const normalizedQuery = query.trim().toLocaleLowerCase('vi')
  const filtered = articles.filter(
    article =>
      (category === 'Tất cả' || article.section === category) &&
      `${article.title} ${article.description}`.toLocaleLowerCase('vi').includes(normalizedQuery),
  )
  const lead = articles.find(article => article.featured) || articles[0]

  function openArticle(id: string) {
    const nextUrl = `/?tin=${encodeURIComponent(id)}`
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.pushState({ route: 'public', tin: id }, '', nextUrl)
    }
    setSelectedId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeArticle() {
    if (window.history.state?.tin) {
      window.history.back()
      return
    }
    window.history.pushState({ route: 'public' }, '', '/')
    setSelectedId('')
  }

  if (selected) {
    return (
      <div className="hcds-home">
        <article className="hcds-editorial-surface" aria-labelledby="home-article-title">
          <div>
            <button type="button" className="text-button" onClick={closeArticle}>
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" /> Quay lại trang chủ dịch vụ công
            </button>
          </div>
          <div className="hcds-news-meta">
            <span>{selected.section}</span>
            <span aria-hidden="true">·</span>
            <time className="tabular-nums">{selected.date}</time>
          </div>
          <h1 id="home-article-title" className="hcds-hero__title">
            {selected.title}
          </h1>
          {selected.image && (
            <img
              className="hcds-news-thumb"
              src={`/images/${selected.image}`}
              alt={selected.title}
              width={960}
              height={540}
              loading="lazy"
            />
          )}
          <div className="information-article-body">
            {selected.body
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
          <p className="hcds-news-meta">
            Nguồn tin và ảnh: Trang thông tin điện tử Trung tâm Phục vụ hành chính công thành phố Hà Nội.
          </p>
          {selected.sourceUrl && (
            <div>
              <a
                className="button secondary"
                href={selected.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>Đọc bài đầy đủ tại nguồn</span>
                <ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" />
              </a>
            </div>
          )}
        </article>
      </div>
    )
  }

  return (
    <div className="hcds-home">
      <section className="hcds-hero" aria-labelledby="civic-hero-heading">
        <div className="hcds-hero__header">
          <h1 id="civic-hero-heading" className="hcds-hero__title">
            Dịch vụ công trực tuyến Thành phố Hà Nội
          </h1>
          <p className="hcds-hero__subtitle">
            Tra cứu quy trình pháp lý, nộp hồ sơ trực tuyến và theo dõi tiến độ giải quyết thủ tục hành chính tập trung tại một điểm duy nhất.
          </p>
        </div>

        <div
          className="hcds-tabs"
          role="tablist"
          aria-label="Chế độ tra cứu nhanh trên trang chủ"
          onKeyDown={event =>
            handleTabArrows(event, [...HERO_SEARCH_TABS], heroTab, setHeroTab)
          }
        >
          <button
            type="button"
            id="hero-tab-procedures"
            role="tab"
            tabIndex={heroTab === 'procedures' ? 0 : -1}
            aria-selected={heroTab === 'procedures'}
            aria-controls="hero-panel-procedures"
            className="hcds-tab"
            onClick={() => setHeroTab('procedures')}
          >
            <Search size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>
              Tìm kiếm <span className="tabular-nums">2.075</span> thủ tục hành chính
            </span>
          </button>
          <button
            type="button"
            id="hero-tab-tracking"
            role="tab"
            tabIndex={heroTab === 'tracking' ? 0 : -1}
            aria-selected={heroTab === 'tracking'}
            aria-controls="hero-panel-tracking"
            className="hcds-tab"
            onClick={() => setHeroTab('tracking')}
          >
            <FolderSearch size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Tra cứu nhanh tiến độ hồ sơ</span>
          </button>
        </div>

        {heroTab === 'procedures' ? (
          <div
            id="hero-panel-procedures"
            role="tabpanel"
            aria-labelledby="hero-tab-procedures"
            className="hcds-hero__search-panel"
          >
            <form className="hcds-hero__form" onSubmit={submitProcedureSearch}>
              <div className="hcds-hero__input-wrap">
                <Search
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="hcds-hero__input-icon"
                />
                <input
                  id="hero-procedure-search-input"
                  type="search"
                  aria-label="Nhập tên thủ tục, mã thủ tục hoặc nhu cầu giải quyết"
                  value={procedureQuery}
                  onChange={event => setProcedureQuery(event.target.value)}
                  placeholder="Nhập tên thủ tục, mã thủ tục (ví dụ: 2.000908, khai sinh, chứng thực, đất đai…)"
                />
              </div>
              <button type="submit" className="button primary hcds-hero__submit">
                Tìm thủ tục
              </button>
            </form>

            <div className="hcds-hero__chips" aria-label="Từ khóa thủ tục tra cứu nhiều">
              <span className="hcds-hero__chips-label">Tra cứu phổ biến:</span>
              {POPULAR_KEYWORDS.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="hcds-keyword-chip"
                  onClick={event => handleInternalLink(event, item.href)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div
            id="hero-panel-tracking"
            role="tabpanel"
            aria-labelledby="hero-tab-tracking"
            className="hcds-hero__search-panel"
          >
            <form className="hcds-hero__form" onSubmit={submitTrackingSearch}>
              <div className="hcds-hero__input-wrap">
                <FolderSearch
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="hcds-hero__input-icon"
                />
                <input
                  id="hero-tracking-code-input"
                  type="text"
                  className="tabular-nums"
                  aria-label="Nhập mã hồ sơ hành chính cần tra cứu"
                  value={trackingCode}
                  onChange={event => setTrackingCode(event.target.value)}
                  placeholder="Nhập mã hồ sơ trên Giấy tiếp nhận (ví dụ: HN-2026-0001…)"
                />
              </div>
              <button type="submit" className="button primary hcds-hero__submit">
                Tra cứu tiến độ
              </button>
            </form>
            <p className="hcds-news-meta">
              Tra cứu trạng thái chung bằng Mã hồ sơ. Để tải kết quả điện tử hoặc bổ sung giấy tờ, chuẩn bị thêm Khóa tra cứu được cấp khi nộp.
            </p>
          </div>
        )}

        <nav className="hcds-quick-grid" aria-label="Tác vụ dịch vụ công trọng tâm">
          {QUICK_ACTIONS.map(({ href, title, description, Icon }) => (
            <a
              key={href}
              href={href}
              className="hcds-quick-card"
              onClick={event => handleInternalLink(event, href)}
            >
              <span className="hcds-quick-card__icon">
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="hcds-quick-card__body">
                <span className="hcds-quick-card__title">{title}</span>
                <span className="hcds-quick-card__desc">{description}</span>
              </span>
            </a>
          ))}
        </nav>
      </section>

      <section className="hcds-section-block" aria-labelledby="life-events-heading">
        <div className="hcds-section-head">
          <div>
            <h2 id="life-events-heading">Nhóm dịch vụ công theo sự kiện đời sống và hoạt động kinh doanh</h2>
            <p>Phân nhóm lấy người dân, doanh nghiệp làm trung tâm theo Nghị định 42/2022/NĐ-CP</p>
          </div>
          <a
            href="/thu-tuc"
            className="procedure-return-link"
            onClick={event => handleInternalLink(event, '/thu-tuc')}
          >
            <span>Xem toàn bộ danh mục thủ tục</span>
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>

        <div className="hcds-lifeevent-grid">
          {LIFE_EVENT_GROUPS.map(({ field, description, Icon }) => {
            const href = `/thu-tuc?field=${encodeURIComponent(field)}`
            return (
              <a
                key={field}
                href={href}
                className="hcds-lifeevent-card"
                onClick={event => handleInternalLink(event, href)}
              >
                <div className="hcds-lifeevent-card__top">
                  <span className="hcds-lifeevent-card__icon">
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h3 className="hcds-lifeevent-card__title">{field}</h3>
                </div>
                <p className="hcds-lifeevent-card__desc">{description}</p>
                <span className="hcds-lifeevent-card__cta">
                  <span>Xem thủ tục trong nhóm</span>
                  <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <section className="hcds-editorial-surface" id="tin-tuc" aria-labelledby="editorial-news-heading">
        <div className="hcds-section-head">
          <div>
            <h2 id="editorial-news-heading">Thông báo hành chính và tin hoạt động</h2>
            <p>Thông tin chỉ đạo điều hành, cải cách thủ tục hành chính và hướng dẫn phục vụ công dân</p>
          </div>
        </div>

        <div className="hcds-bulletin-bar" role="status">
          <span className="hcds-bulletin-bar__badge">
            <Bell size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Thông báo mới:</span>
          </span>
          {lead ? (
            <a
              href={`/?tin=${encodeURIComponent(lead.id)}`}
              onClick={event => {
                event.preventDefault()
                openArticle(lead.id)
              }}
            >
              {lead.title}
            </a>
          ) : (
            <span>{loadingNews ? 'Đang tải thông báo hành chính…' : 'Chưa có thông báo mới được xuất bản.'}</span>
          )}
        </div>

        {lead && (
          <div className="hcds-editorial-lead-grid">
            <article className="hcds-lead-article">
              <a
                className="hcds-lead-article__link"
                href={`/?tin=${encodeURIComponent(lead.id)}`}
                onClick={event => {
                  event.preventDefault()
                  openArticle(lead.id)
                }}
              >
                {lead.image && (
                  <img
                    className="hcds-news-thumb"
                    src={`/images/${lead.image}`}
                    alt={lead.title}
                    width={640}
                    height={360}
                    loading="lazy"
                  />
                )}
                <h3 className="hcds-lead-article__title">{lead.title}</h3>
              </a>
              <p className="hcds-lead-article__desc">{lead.description}</p>
              <div className="hcds-news-meta">
                <span>{lead.section}</span>
                <span aria-hidden="true">·</span>
                <time className="tabular-nums">{lead.date}</time>
              </div>
            </article>

            <div className="hcds-editorial-side-list">
              <h3>Tin tiêu điểm</h3>
              {articles
                .filter(article => article.id !== lead.id)
                .slice(0, 4)
                .map(article => (
                  <article key={article.id} className="hcds-side-news-item">
                    <a
                      href={`/?tin=${encodeURIComponent(article.id)}`}
                      onClick={event => {
                        event.preventDefault()
                        openArticle(article.id)
                      }}
                    >
                      <b>{article.title}</b>
                      <span className="hcds-news-meta">
                        <span>{article.section}</span>
                        <span aria-hidden="true">·</span>
                        <time className="tabular-nums">{article.date}</time>
                      </span>
                    </a>
                  </article>
                ))}
            </div>
          </div>
        )}

        <div className="hcds-news-toolbar">
          <label className="citizen-field hcds-news-search-field" htmlFor="home-news-search">
            <span>Tìm kiếm thông báo, tin tức</span>
            <input
              id="home-news-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Nhập từ khóa thông báo hoặc chuyên mục cần tra cứu"
            />
          </label>

          <div className="hcds-news-filter-tabs" role="group" aria-label="Chuyên mục tin tức">
            {['Tất cả', ...NEWS_SECTIONS].map(section => (
              <button
                type="button"
                key={section}
                className="hcds-filter-btn"
                aria-pressed={category === section}
                onClick={() => setCategory(section)}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="hcds-news-grid">
            {filtered.map(article => (
              <article key={article.id} className="hcds-news-item">
                <a
                  href={`/?tin=${encodeURIComponent(article.id)}`}
                  onClick={event => {
                    event.preventDefault()
                    openArticle(article.id)
                  }}
                >
                  {article.image && (
                    <img
                      className="hcds-news-thumb"
                      src={`/images/${article.image}`}
                      alt={article.title}
                      width={400}
                      height={225}
                      loading="lazy"
                    />
                  )}
                  <b>{article.title}</b>
                </a>
                <div className="hcds-news-meta">
                  <span>{article.section}</span>
                  <span aria-hidden="true">·</span>
                  <time className="tabular-nums">{article.date}</time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loadingNews && (
            <p className="hcds-news-meta">
              Không có bài viết phù hợp với điều kiện lọc. Vui lòng đổi từ khóa hoặc chọn lại chuyên mục.
            </p>
          )
        )}

        <div className="hcds-support-links-row" aria-label="Liên kết hệ thống dịch vụ công và hỗ trợ">
          <a
            href="/huong-dan"
            className="hcds-support-link-item"
            onClick={event => handleInternalLink(event, '/huong-dan')}
          >
            <span>Hướng dẫn nộp và tra cứu hồ sơ trực tuyến</span>
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </a>
          <a
            href="https://dichvucong.gov.vn/"
            target="_blank"
            rel="noreferrer"
            className="hcds-support-link-item"
          >
            <span>Cổng Dịch vụ công Quốc gia</span>
            <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
          </a>
          <a href="tel:0241022" className="hcds-support-link-item">
            <span className="tabular-nums">Tổng đài hỗ trợ 024 1022 · 1900 1009</span>
            <PhoneCall size={16} strokeWidth={1.75} aria-hidden="true" />
          </a>
        </div>

        <p className="hcds-news-meta">
          Nguồn tin tổng hợp từ{' '}
          <a href={`${HANOI_CENTER_ORIGIN}/trang-chu`} target="_blank" rel="noreferrer">
            Trang thông tin điện tử Trung tâm Phục vụ hành chính công thành phố Hà Nội
          </a>
          .
        </p>
      </section>
    </div>
  )
}

export default InformationHome
