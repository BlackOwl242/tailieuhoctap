import { ChevronRight, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Suspense, lazy, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { ServiceLevelBadge, SideDrawer } from './design-system'
import { matchesTopicField, normalizeTopicField, showcaseProcedureCodes } from './serviceTopics'
import type { ApiRequest, Procedure } from './types'
import './ProcedureDetail.css'

const LazyCitizenProcedureDetail = lazy(() => import('./CitizenProcedureDetail'))

const formatCount = (value: number) => value.toLocaleString('vi-VN')

const SERVICE_LEVEL_GUIDE = [
  {
    level: 'Toàn trình',
    label: 'Trực tuyến toàn trình (Nộp & nhận kết quả tại nhà)',
    shortDesc: 'Thực hiện trực tuyến toàn bộ quy trình, thanh toán và nhận kết quả điện tử hoặc qua bưu chính.',
  },
  {
    level: 'Một phần',
    label: 'Trực tuyến một phần',
    shortDesc: 'Nộp hồ sơ và theo dõi trực tuyến; xuất trình bản chính hoặc nhận kết quả theo quy định riêng.',
  },
  {
    level: 'Cung cấp thông tin',
    label: 'Cung cấp thông tin',
    shortDesc: 'Tra cứu thành phần hồ sơ, biểu mẫu trên cổng và nộp trực tiếp tại Bộ phận Một cửa.',
  },
] as const

const LIFE_EVENT_GROUPS: Record<string, readonly string[]> = {
  'Hộ tịch & Cư trú': [
    'hộ tịch',
    'cư trú',
    'quốc tịch',
    'nuôi con nuôi',
    'căn cước',
    'chứng minh nhân dân',
  ],
  'Chứng thực & Tư pháp': [
    'chứng thực',
    'lý lịch tư pháp',
    'bồi thường nhà nước',
    'trợ giúp pháp lý',
    'phổ biến, giáo dục pháp luật',
    'hòa giải ở cơ sở',
    'công chứng',
    'luật sư',
    'đấu giá tài sản',
    'thừa phát lại',
    'tư pháp',
  ],
  'Đất đai, Nhà ở & Xây dựng': [
    'đất đai',
    'nhà ở',
    'hoạt động xây dựng',
    'xây dựng',
    'quy hoạch',
    'kinh doanh bất động sản',
    'hạ tầng kỹ thuật',
  ],
  'Hộ kinh doanh & Doanh nghiệp': [
    'hộ kinh doanh',
    'doanh nghiệp',
    'hợp tác xã',
    'an toàn thực phẩm',
    'lưu thông hàng hóa',
    'thương mại',
    'du lịch',
    'đầu tư',
  ],
  'Y tế, Giáo dục & An sinh': [
    'khám bệnh, chữa bệnh',
    'y tế',
    'dược',
    'mỹ phẩm',
    'giáo dục',
    'đào tạo',
    'người có công',
    'bảo trợ xã hội',
    'việc làm',
    'lao động',
    'bảo hiểm xã hội',
    'trẻ em',
  ],
  'Tài nguyên, Môi trường & Đô thị': [
    'môi trường',
    'tài nguyên',
    'khoáng sản',
    'đo đạc và bản đồ',
    'khí tượng thủy văn',
    'biến đổi khí hậu',
    'viễn thám',
    'đường bộ',
    'đường thủy',
    'giao thông',
    'vận tải',
  ],
}

const catalogField = (item: Procedure): string =>
  normalizeTopicField(item.field || (item.code === '2.000908' ? 'Chứng thực' : ''))

const catalogAgency = (item: Procedure): string =>
  item.agency || (['2.000908', '2.000635'].includes(item.code) ? 'Sở Tư pháp' : '')

const hasInteractiveForm = (item: Procedure | null | undefined): boolean =>
  item?.submissionEnabled === true

function matchesCatalogField(item: Procedure, selectedField: string): boolean {
  if (!selectedField || selectedField === 'all') return true
  const normalizedItemField = catalogField(item)
  if (matchesTopicField(normalizedItemField, selectedField)) return true

  const lifeEventKeywords = LIFE_EVENT_GROUPS[selectedField]
  if (lifeEventKeywords) {
    const haystack = `${normalizedItemField} ${item.name} ${catalogAgency(item)}`.toLocaleLowerCase('vi')
    return lifeEventKeywords.some(keyword => haystack.includes(keyword))
  }
  return false
}

function matchesSearchTerm(item: Procedure, rawTerm: string): boolean {
  const trimmed = rawTerm.trim().toLocaleLowerCase('vi')
  if (!trimmed) return true
  const expanded = trimmed
    .replace(/\btnmt\b/g, 'tài nguyên và môi trường')
    .replace(/\btthc\b/g, 'thủ tục hành chính')
    .replace(/\bhkd\b/g, 'hộ kinh doanh')

  const haystack = [item.code, item.name, catalogField(item), catalogAgency(item), item.level]
    .join(' ')
    .toLocaleLowerCase('vi')

  if (haystack.includes(trimmed) || haystack.includes(expanded)) return true
  const tokens = expanded.split(/\s+/).filter(Boolean)
  return tokens.length > 1 && tokens.every(token => haystack.includes(token))
}

function readCodeFromLocation(): string {
  const params = new URLSearchParams(window.location.search)
  const pathCode = window.location.pathname.match(/^\/thu-tuc\/([^/]+)\/?$/)?.[1]
  return pathCode ? decodeURIComponent(pathCode) : params.get('code') || ''
}

export function CitizenProcedureCatalog({ request }: { request: ApiRequest }) {
  const [code, setCode] = useState<string>(readCodeFromLocation)

  useEffect(() => {
    const syncRoute = () => setCode(readCodeFromLocation())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  if (code) {
    return (
      <Suspense
        fallback={
          <section className="procedure-detail-page">
            <p role="status">Đang tải chi tiết thủ tục…</p>
          </section>
        }
      >
        <LazyCitizenProcedureDetail key={code} code={code} request={request} />
      </Suspense>
    )
  }

  return <ProcedureCatalogList request={request} />
}

function ProcedureCatalogList({ request }: { request: ApiRequest }) {
  const initialParams = new URLSearchParams(window.location.search)
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [query, setQuery] = useState(initialParams.get('q') || '')
  const [field, setField] = useState(
    () => normalizeTopicField(initialParams.get('field') || '') || 'all',
  )
  const [agency, setAgency] = useState('all')
  const [mode, setMode] = useState('all')
  const [formOnly, setFormOnly] = useState(false)
  const [limit, setLimit] = useState(24)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      setQuery(params.get('q') || '')
      setField(normalizeTopicField(params.get('field') || '') || 'all')
    }
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    request<{ procedures: Procedure[] }>('/api/procedures?summary=1', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setProcedures(result.procedures)
      })
      .catch(reason => {
        if (controller.signal.aborted) return
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : 'Không tải được danh mục thủ tục.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [request])

  const fieldCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of procedures) {
      const normalized = catalogField(item)
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1)
    }
    return counts
  }, [procedures])

  const lifeEventCounts = useMemo(() => {
    return Object.keys(LIFE_EVENT_GROUPS).map(groupName => ({
      groupName,
      count: procedures.filter(item => matchesCatalogField(item, groupName)).length,
    }))
  }, [procedures])

  const agencyCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of procedures) {
      const name = catalogAgency(item)
      if (name) counts.set(name, (counts.get(name) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [procedures])

  const fields = useMemo(
    () => [...fieldCounts.keys()].filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')),
    [fieldCounts],
  )

  const configured = useMemo(
    () => procedures.filter(item => hasInteractiveForm(item)).length,
    [procedures],
  )

  const levelCounts = useMemo(
    () =>
      SERVICE_LEVEL_GUIDE.map(entry => ({
        ...entry,
        count: procedures.filter(item => item.level === entry.level).length,
      })),
    [procedures],
  )

  const browseOrder = useMemo(() => {
    const featured = showcaseProcedureCodes
      .map(code => procedures.find(item => item.code === code))
      .filter((item): item is Procedure => Boolean(item))
    const agencies = new Map<string, Procedure>()
    for (const item of procedures) {
      const groupName = catalogAgency(item)
      if (groupName && !agencies.has(groupName)) agencies.set(groupName, item)
    }
    const front = [...featured, ...agencies.values()]
    const seen = new Set(front.map(item => item.code))
    return [
      ...front.filter(
        (item, index) => front.findIndex(previous => previous.code === item.code) === index,
      ),
      ...procedures.filter(item => !seen.has(item.code)),
    ]
  }, [procedures])

  const filtered = useMemo(() => {
    return browseOrder.filter(
      item =>
        matchesCatalogField(item, field) &&
        (agency === 'all' || catalogAgency(item) === agency) &&
        (mode === 'all' || item.level === mode) &&
        (!formOnly || hasInteractiveForm(item)) &&
        matchesSearchTerm(item, query),
    )
  }, [browseOrder, query, field, agency, mode, formOnly])

  function syncUrlParams(nextQuery: string, nextField: string) {
    const next = new URLSearchParams(window.location.search)
    if (nextQuery.trim()) next.set('q', nextQuery.trim())
    else next.delete('q')
    if (nextField && nextField !== 'all') next.set('field', nextField)
    else next.delete('field')
    window.history.replaceState(
      window.history.state,
      '',
      `/thu-tuc${next.size ? `?${next}` : ''}`,
    )
  }

  function selectField(value: string) {
    const normalized = value === 'all' ? 'all' : normalizeTopicField(value)
    setField(normalized)
    setLimit(24)
    syncUrlParams(query, normalized)
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery)
    setLimit(24)
    syncUrlParams(nextQuery, field)
  }

  function clearFilters() {
    setQuery('')
    setField('all')
    setAgency('all')
    setMode('all')
    setFormOnly(false)
    setLimit(24)
    window.history.replaceState(window.history.state, '', '/thu-tuc')
  }

  function openProcedureLink(event: MouseEvent<HTMLAnchorElement>, href: string) {
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
    window.history.pushState({}, '', href)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilterCount =
    (field !== 'all' ? 1 : 0) +
    (agency !== 'all' ? 1 : 0) +
    (mode !== 'all' ? 1 : 0) +
    (formOnly ? 1 : 0)

  function renderFilterControls(idPrefix: string) {
    return (
      <div className="hcds-filter-stack">
        <div className="hcds-filter-group">
          <div className="hcds-filter-group__head">
            <span className="hcds-filter-group__title">Mức độ dịch vụ công</span>
            {activeFilterCount > 0 && (
              <button type="button" className="text-button" onClick={clearFilters}>
                <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" /> Đặt lại
              </button>
            )}
          </div>
          {levelCounts.map(entry => {
            const active = mode === entry.level
            return (
              <button
                type="button"
                key={entry.level}
                className="hcds-level-option"
                aria-pressed={active}
                onClick={() => {
                  setMode(active ? 'all' : entry.level)
                  setLimit(24)
                }}
              >
                <span className="hcds-level-option__top">
                  <span>{entry.label}</span>
                  <b className="tabular-nums">{formatCount(entry.count)}</b>
                </span>
                <span className="hcds-level-option__desc">{entry.shortDesc}</span>
              </button>
            )
          })}
        </div>

        <div className="hcds-filter-group">
          <label className="catalog-form-filter" htmlFor={`${idPrefix}-form-only`}>
            <input
              id={`${idPrefix}-form-only`}
              type="checkbox"
              checked={formOnly}
              onChange={event => {
                setFormOnly(event.target.checked)
                setLimit(24)
              }}
            />
            <span>
              Chỉ hiện thủ tục nộp trực tuyến (<b className="tabular-nums">{formatCount(configured)}</b>)
            </span>
          </label>
        </div>

        <div className="hcds-filter-group">
          <label className="citizen-field" htmlFor={`${idPrefix}-field-select`}>
            <span className="hcds-filter-group__title">Nhóm sự kiện &amp; Lĩnh vực</span>
            <select
              id={`${idPrefix}-field-select`}
              value={field}
              onChange={event => selectField(event.target.value)}
            >
              <option value="all">Tất cả lĩnh vực ({formatCount(procedures.length)})</option>
              <optgroup label="Nhóm sự kiện đời sống (Nghị định 42)">
                {lifeEventCounts.map(({ groupName, count }) => (
                  <option key={groupName} value={groupName}>
                    {groupName} ({formatCount(count)})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Lĩnh vực chuyên ngành công bố">
                {fields.map(value => (
                  <option key={value} value={value}>
                    {value} ({formatCount(fieldCounts.get(value) || 0)})
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>

        <div className="hcds-filter-group">
          <label className="citizen-field" htmlFor={`${idPrefix}-agency-select`}>
            <span className="hcds-filter-group__title">Cơ quan thực hiện</span>
            <select
              id={`${idPrefix}-agency-select`}
              value={agency}
              onChange={event => {
                setAgency(event.target.value)
                setLimit(24)
              }}
            >
              <option value="all">Tất cả cơ quan ({formatCount(agencyCounts.length)})</option>
              {agencyCounts.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({formatCount(count)})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    )
  }

  return (
    <section className="citizen-catalog-page hcds-catalog-page">
      <header className="hcds-catalog-header">
        <div>
          <h1>Danh mục thủ tục hành chính Thành phố Hà Nội</h1>
          <p>
            Tra cứu trình tự, thành phần hồ sơ, biểu mẫu đính kèm, mức phí và cơ quan tiếp nhận trước khi nộp trực tuyến.
          </p>
        </div>
        {!loading && !error && (
          <div className="hcds-catalog-stats-inline" aria-label="Quy mô danh mục công bố">
            <span>
              <b className="tabular-nums">{formatCount(procedures.length)}</b> thủ tục công bố
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <b className="tabular-nums">{formatCount(fieldCounts.size)}</b> lĩnh vực
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <b className="tabular-nums">{formatCount(agencyCounts.length)}</b> cơ quan
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <b className="tabular-nums">{formatCount(configured)}</b> biểu mẫu điện tử
            </span>
          </div>
        )}
      </header>

      <div className="hcds-catalog-shell">
        <aside className="hcds-catalog-sidebar" aria-label="Bộ lọc danh mục thủ tục">
          {renderFilterControls('desktop-catalog')}
        </aside>

        <div className="hcds-catalog-main">
          <div className="hcds-catalog-search-bar">
            <div className="hcds-catalog-search-input-wrap">
              <Search
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
                className="hcds-hero__input-icon"
              />
              <input
                id="catalog-search-input"
                type="search"
                aria-label="Tìm theo tên thủ tục, mã thủ tục, lĩnh vực hoặc cơ quan"
                value={query}
                onChange={event => updateQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc mã thủ tục (ví dụ: 2.000908, khai sinh, chứng thực, đất đai, hộ kinh doanh…)"
              />
            </div>

            <button
              type="button"
              className="button secondary hcds-catalog-mobile-filter-btn"
              onClick={() => setDrawerOpen(true)}
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>
                Bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </span>
            </button>
          </div>

          {(query.trim() || activeFilterCount > 0) && (
            <div className="hcds-active-chips" role="region" aria-label="Điều kiện lọc đang áp dụng">
              {query.trim() && (
                <button
                  type="button"
                  className="hcds-active-chip"
                  onClick={() => updateQuery('')}
                >
                  <span>Từ khóa: &ldquo;{query.trim()}&rdquo;</span>
                  <X size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
              {field !== 'all' && (
                <button
                  type="button"
                  className="hcds-active-chip"
                  onClick={() => selectField('all')}
                >
                  <span>Lĩnh vực: {field}</span>
                  <X size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
              {agency !== 'all' && (
                <button
                  type="button"
                  className="hcds-active-chip"
                  onClick={() => {
                    setAgency('all')
                    setLimit(24)
                  }}
                >
                  <span>Cơ quan: {agency}</span>
                  <X size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
              {mode !== 'all' && (
                <button
                  type="button"
                  className="hcds-active-chip"
                  onClick={() => {
                    setMode('all')
                    setLimit(24)
                  }}
                >
                  <span>
                    Mức độ:{' '}
                    {mode === 'Toàn trình'
                      ? 'Trực tuyến toàn trình (Nộp & nhận kết quả tại nhà)'
                      : mode === 'Một phần'
                        ? 'Trực tuyến một phần'
                        : mode}
                  </span>
                  <X size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
              {formOnly && (
                <button
                  type="button"
                  className="hcds-active-chip"
                  onClick={() => {
                    setFormOnly(false)
                    setLimit(24)
                  }}
                >
                  <span>Có biểu mẫu nộp trực tuyến</span>
                  <X size={13} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
              <button type="button" className="text-button" onClick={clearFilters}>
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          <div className="hcds-service-legend" aria-label="Giải thích mức độ dịch vụ công theo Nghị định 42/2022/NĐ-CP">
            <span className="hcds-service-legend__item">
              <ServiceLevelBadge level="Toàn trình" />
              <span>Trực tuyến toàn trình (Nộp &amp; nhận kết quả tại nhà)</span>
            </span>
            <span className="hcds-service-legend__item">
              <ServiceLevelBadge level="Một phần" />
              <span>Trực tuyến một phần (Nộp trực tuyến, nhận hoặc đối chiếu theo quy định)</span>
            </span>
          </div>

          {loading && (
            <p className="catalog-status" role="status">
              Đang tải danh mục thủ tục hành chính…
            </p>
          )}

          {error && (
            <p className="catalog-status catalog-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && (
            <section className="hcds-catalog-results" aria-label="Kết quả tìm kiếm thủ tục hành chính">
              <div className="hcds-catalog-toolbar-meta">
                <span className="tabular-nums">
                  Tìm thấy <b>{formatCount(filtered.length)}</b> thủ tục phù hợp · đang hiển thị{' '}
                  <b>{formatCount(Math.min(limit, filtered.length))}</b>
                </span>
              </div>

              {filtered.slice(0, limit).map(item => {
                const detailHref = `/thu-tuc/${encodeURIComponent(item.code)}`
                return (
                  <a
                    className="hcds-catalog-card"
                    key={item.code}
                    href={detailHref}
                    onClick={event => openProcedureLink(event, detailHref)}
                  >
                    <div className="hcds-catalog-card__body">
                      <div className="hcds-catalog-card__top">
                        <span className="hcds-catalog-card__code tabular-nums">{item.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{catalogField(item) || 'Chưa phân nhóm lĩnh vực'}</span>
                        <ServiceLevelBadge level={item.level} serviceMode={item.serviceMode} />
                      </div>
                      <strong className="hcds-catalog-card__title">{item.name}</strong>
                      <div className="hcds-catalog-card__meta">
                        <span>{catalogAgency(item) || 'Cơ quan theo quy định thủ tục'}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.level === 'Toàn trình'
                            ? 'Trực tuyến toàn trình (Nộp & nhận kết quả tại nhà)'
                            : item.level === 'Một phần'
                              ? 'Trực tuyến một phần'
                              : 'Cung cấp thông tin quy trình'}
                        </span>
                        {hasInteractiveForm(item) && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Hỗ trợ kê khai điện tử</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="hcds-catalog-card__cta">
                      <span>Chi tiết</span>
                      <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                  </a>
                )
              })}

              {!filtered.length && (
                <div className="catalog-empty">
                  Không tìm thấy thủ tục khớp điều kiện lọc. Vui lòng thử từ khóa ngắn hơn hoặc đặt lại bộ lọc.
                </div>
              )}

              {filtered.length > limit && (
                <button
                  type="button"
                  className="button secondary catalog-more"
                  onClick={() => setLimit(value => value + 24)}
                >
                  Xem thêm <span className="tabular-nums">24</span> thủ tục (còn{' '}
                  <span className="tabular-nums">{formatCount(filtered.length - limit)}</span>)
                </button>
              )}
            </section>
          )}
        </div>
      </div>

      <SideDrawer
        open={drawerOpen}
        title="Lọc danh mục thủ tục"
        subtitle="Chọn mức độ dịch vụ công, nhóm sự kiện hoặc cơ quan thực hiện"
        onClose={() => setDrawerOpen(false)}
        footer={
          <>
            <button type="button" className="button secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
            <button type="button" className="button primary" onClick={() => setDrawerOpen(false)}>
              Xem <span className="tabular-nums">{formatCount(filtered.length)}</span> thủ tục
            </button>
          </>
        }
      >
        {renderFilterControls('mobile-catalog')}
      </SideDrawer>
    </section>
  )
}

export default CitizenProcedureCatalog
