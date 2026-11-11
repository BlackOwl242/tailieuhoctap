import { useEffect, useState } from 'react'
import { serviceTopics } from './serviceTopics'

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

const NEWS_SECTIONS = [
  'Hoạt động của Trung tâm',
  'Hành chính xung kích',
  'Cải cách hành chính',
  'Chuyển đổi số',
  'Tiện ích công dân',
] as const

const QUICK_SERVICES = [
  ['/nop-ho-so', 'nophoso.png', 'Nộp hồ sơ', '↑'],
  ['/tra-cuu-ho-so', 'tracuuhoso1cua.png', 'Tra cứu hồ sơ', '⌕'],
  ['/thu-tuc', '', 'Tra cứu thủ tục', '☷'],
  ['/huong-dan', '', 'Hướng dẫn sử dụng', '?'],
] as const

function readArticleIdFromLocation(): string {
  return new URLSearchParams(window.location.search).get('tin') || ''
}

export function InformationHome() {
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

  function renderNewsLink(article: NewsArticle, showImage = false) {
    return (
      <a
        href={`/?tin=${encodeURIComponent(article.id)}`}
        onClick={event => {
          event.preventDefault()
          openArticle(article.id)
        }}
      >
        {showImage && article.image && (
          <img src={`/images/${article.image}`} alt={article.title} loading="lazy" />
        )}
        <b>{article.title}</b>
        <time>{article.date}</time>
      </a>
    )
  }

  return (
    <div className="information-home">
      <div className="information-bulletin">
        <span>THÔNG TIN MỚI</span>
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
          <span>{loadingNews ? 'Đang tải tin tức…' : 'Chưa có tin được xuất bản.'}</span>
        )}
      </div>

      <img
        className="city-event-banner"
        src="/images/hanoi-liberation.jpg"
        alt="Kỷ niệm 72 năm Ngày Giải phóng Thủ đô, 10/10/1954 – 10/10/2026"
      />

      <div className="information-columns">
        <div className="information-main">
          {selected ? (
            <article className="information-article">
              <button type="button" className="text-button" onClick={closeArticle}>
                ← Quay lại danh sách tin
              </button>
              <p className="article-category">{selected.section}</p>
              <h1>{selected.title}</h1>
              <time>{selected.date}</time>
              {selected.image && <img src={`/images/${selected.image}`} alt={selected.title} />}
              <div className="information-article-body">
                {selected.body
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
              <p>
                Nguồn tin và ảnh: Trang thông tin điện tử Trung tâm Phục vụ hành chính công thành phố
                Hà Nội.
              </p>
              {selected.sourceUrl && (
                <a className="button secondary" href={selected.sourceUrl} target="_blank" rel="noreferrer">
                  Đọc bài đầy đủ tại nguồn ↗
                </a>
              )}
            </article>
          ) : (
            <>
              <div className="headline-columns">
                {lead ? (
                  <article className="headline-story">
                    {renderNewsLink(lead, true)}
                    <p>{lead.description}</p>
                  </article>
                ) : (
                  <div className="news-empty">
                    {loadingNews ? 'Đang tải tin nổi bật…' : 'Tin nổi bật sẽ được cập nhật tại đây.'}
                  </div>
                )}

                <section className="headline-list">
                  <h2 className="information-section-title">Tin nổi bật</h2>
                  {articles
                    .filter(article => article.id !== lead?.id)
                    .slice(0, 4)
                    .map(article => (
                      <article key={article.id}>{renderNewsLink(article)}</article>
                    ))}
                </section>
              </div>

              <section className="information-service-block">
                <h2 className="information-section-title">Dịch vụ công trực tuyến</h2>
                <div className="information-services">
                  {QUICK_SERVICES.map(([href, img, label, symbol]) => (
                    <a href={href} key={href}>
                      {img ? (
                        <img src={`/images/${img}`} alt="" />
                      ) : (
                        <span className="information-service-symbol" aria-hidden="true">
                          {symbol}
                        </span>
                      )}
                      <b>{label}</b>
                    </a>
                  ))}
                </div>

                <div className="home-topic-directory">
                  <div>
                    <h3>Lĩnh vực dịch vụ công</h3>
                    <a href="/thu-tuc">Xem toàn bộ danh mục →</a>
                  </div>
                  <nav aria-label="Lĩnh vực dịch vụ công tại Hà Nội">
                    {serviceTopics.map(topic => (
                      <a key={topic} href={`/thu-tuc?field=${encodeURIComponent(topic)}`}>
                        {topic}
                      </a>
                    ))}
                  </nav>
                </div>
              </section>

              <section className="information-news" id="tin-tuc">
                <h2 className="information-section-title">Tin tức và thông tin hành chính</h2>
                <label className="news-search" htmlFor="home-news-search">
                  <span>Tìm tin tức</span>
                  <input
                    id="home-news-search"
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Nhập nội dung hoặc từ khóa cần tìm"
                  />
                </label>

                <div className="news-category-tabs" role="group" aria-label="Chuyên mục tin tức">
                  {['Tất cả', ...NEWS_SECTIONS].map(section => (
                    <button
                      type="button"
                      key={section}
                      aria-pressed={category === section}
                      onClick={() => setCategory(section)}
                    >
                      {section}
                    </button>
                  ))}
                </div>

                <div className="news-result-grid">
                  {filtered.map(article => (
                    <article key={article.id}>
                      {renderNewsLink(article, true)}
                      <small>{article.section}</small>
                    </article>
                  ))}
                </div>

                {!filtered.length && !loadingNews && (
                  <p>Không có tin phù hợp. Hãy đổi từ khóa hoặc chuyên mục.</p>
                )}
              </section>

            </>
          )}
        </div>

        <aside className="information-sidebar">
          <a href="https://dichvucong.gov.vn/" target="_blank" rel="noreferrer">
            <img src="/images/congdichvucongquocgia.png" alt="Cổng Dịch vụ công quốc gia" />
          </a>
          <a href="https://congdanso.hanoi.gov.vn/" target="_blank" rel="noreferrer">
            <img src="/images/ihanoi.png" alt="Ứng dụng Công dân Thủ đô số iHanoi" />
          </a>
          <a href="tel:0241022">
            <img src="/images/duongdaynong.png" alt="Đường dây nóng 024 1022; tổng đài 1900 1009" />
          </a>

          <section className="sidebar-guide">
            <h2 className="information-section-title">Hướng dẫn và hỗ trợ</h2>
            <a href="/huong-dan">Hướng dẫn người dân, tổ chức</a>
            <a href="/huong-dan?role=staff">Hướng dẫn cán bộ</a>
            <a href="/staff">Đăng nhập bàn cán bộ</a>
            <a href="/thu-tuc">Thành phần hồ sơ và thời hạn</a>
          </section>

          <section className="sidebar-guide">
            <h2 className="information-section-title">Thông tin cần biết</h2>
            <p>Chọn đúng thủ tục và cơ quan trước khi khai hồ sơ.</p>
            <p>Cán bộ tiếp nhận hoặc trả kết quả quản lý khóa tra cứu và cung cấp cho chủ hồ sơ.</p>
            <a href="https://vanban.hanoi.gov.vn/" target="_blank" rel="noreferrer">
              Văn bản của thành phố ↗
            </a>
          </section>
        </aside>
      </div>

      {!selected && (
        <>
          <div className="information-topic-grid">
            {NEWS_SECTIONS.slice(0, 4).filter(section => articles.some(article => article.section === section)).map(section => (
              <section key={section}>
                <h2 className="information-section-title">{section}</h2>
                {articles.filter(article => article.section === section).map(article => (
                  <article key={article.id}>{renderNewsLink(article, true)}</article>
                ))}
              </section>
            ))}
          </div>
          <section className="information-intro" id="gioi-thieu">
            <h2 className="information-section-title">Thông tin và dịch vụ hành chính</h2>
            <p>
              Tra cứu thông tin thủ tục, cơ quan thực hiện, thành phần hồ sơ và thời hạn. Người dân
              lập yêu cầu, theo dõi xử lý; cán bộ tiếp nhận, phân công, thụ lý và trả kết quả theo
              quyền được cấp.
            </p>
            <a href="/huong-dan" className="button secondary">
              Hướng dẫn thao tác với hệ thống
            </a>
          </section>

          <section className="information-gallery" id="thu-vien-anh">
            <h2 className="information-section-title">Thư viện ảnh</h2>
            <div>
              {articles
                .filter(article => ['khai-sinh', 'ho-tro', 'ngoai-gio'].includes(article.id))
                .map(article => (
                  <figure key={article.id}>
                    <a
                      href={`/?tin=${encodeURIComponent(article.id)}`}
                      onClick={event => {
                        event.preventDefault()
                        openArticle(article.id)
                      }}
                    >
                      <img src={`/images/${article.image}`} alt={article.title} loading="lazy" />
                    </a>
                    <figcaption>{article.title}</figcaption>
                  </figure>
                ))}
            </div>
          </section>
        </>
      )}

      <p className="information-source">
        Tin được tóm tắt từ{' '}
        <a href={`${HANOI_CENTER_ORIGIN}/trang-chu`} target="_blank" rel="noreferrer">
          Trang thông tin điện tử Trung tâm Phục vụ hành chính công thành phố Hà Nội
        </a>
        . Ảnh giữ nguyên từ nguồn; bài đầy đủ được dẫn tới trang đăng tin.
      </p>
    </div>
  )
}

export default InformationHome
