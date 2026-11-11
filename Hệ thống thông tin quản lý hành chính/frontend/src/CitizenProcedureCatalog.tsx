import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { serviceModeLabel } from './procedureLabels'
import {
  matchesTopicField,
  normalizeTopicField,
  serviceTopics,
  showcaseProcedureCodes,
} from './serviceTopics'
import type { ApiRequest, Procedure } from './types'

const LazyCitizenProcedureDetail = lazy(() => import('./CitizenProcedureDetail'))

const formatCount = (value: number) => value.toLocaleString('vi-VN')
const levels = ['Toàn trình', 'Một phần', 'Cung cấp thông tin']

const catalogField = (item: Procedure): string =>
  normalizeTopicField(item.field || (item.code === '2.000908' ? 'Chứng thực' : ''))

const catalogAgency = (item: Procedure): string =>
  item.agency || (['2.000908', '2.000635'].includes(item.code) ? 'Sở Tư pháp' : '')

const hasInteractiveForm = (item: Procedure | null | undefined): boolean =>
  item?.submissionEnabled === true

export function CitizenProcedureCatalog({ request }: { request: ApiRequest }) {
  const params = new URLSearchParams(window.location.search)
  const pathCode = window.location.pathname.match(/^\/thu-tuc\/([^/]+)\/?$/)?.[1]
  const code = pathCode ? decodeURIComponent(pathCode) : params.get('code') || ''

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
  const params = new URLSearchParams(window.location.search)
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [query, setQuery] = useState(params.get('q') || '')
  const [field, setField] = useState(() => normalizeTopicField(params.get('field') || '') || 'all')
  const [agency, setAgency] = useState('all')
  const [mode, setMode] = useState('all')
  const [formOnly, setFormOnly] = useState(false)
  const [limit, setLimit] = useState(24)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      levels.map(level => ({
        level,
        count: procedures.filter(item => item.level === level).length,
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
    const term = query.trim().toLocaleLowerCase('vi')
    return browseOrder.filter(
      item =>
        (field === 'all' || matchesTopicField(catalogField(item), field)) &&
        (agency === 'all' || catalogAgency(item) === agency) &&
        (mode === 'all' || item.level === mode) &&
        (!formOnly || hasInteractiveForm(item)) &&
        (!term ||
          [item.code, item.name, item.field, item.agency, item.level]
            .join(' ')
            .toLocaleLowerCase('vi')
            .includes(term)),
    )
  }, [browseOrder, query, field, agency, mode, formOnly])

  function selectField(value: string) {
    const normalized = value === 'all' ? 'all' : normalizeTopicField(value)
    setField(normalized)
    setLimit(24)
    const next = new URLSearchParams(window.location.search)
    if (normalized === 'all') next.delete('field')
    else next.set('field', normalized)
    window.history.replaceState(
      window.history.state,
      '',
      `/thu-tuc${next.size ? `?${next}` : ''}`,
    )
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

  return (
    <section className="citizen-catalog-page">
      <div className="citizen-page-heading">
        <h1>Dịch vụ công tại Hà Nội</h1>
        <p>
          Duyệt theo lĩnh vực và cơ quan, hoặc tìm theo mã, tên thủ tục. Mở từng thủ tục để xem trình tự, thành phần hồ sơ, thời hạn, phí và cơ quan tiếp nhận.
        </p>
      </div>

      {!loading && !error && (
        <>
          <div className="catalog-overview" aria-label="Quy mô danh mục">
            <div>
              <b className="tabular-nums">{formatCount(procedures.length)}</b>
              <span>thủ tục công bố</span>
            </div>
            <div>
              <b className="tabular-nums">{formatCount(fieldCounts.size)}</b>
              <span>lĩnh vực</span>
            </div>
            <div>
              <b className="tabular-nums">{formatCount(agencyCounts.length)}</b>
              <span>nhóm cơ quan</span>
            </div>
            <div>
              <b className="tabular-nums">{formatCount(configured)}</b>
              <span>thủ tục nộp trực tuyến</span>
            </div>
          </div>

          <div className="catalog-level-summary" role="group" aria-label="Lọc nhanh theo mức dịch vụ">
            {levelCounts.map(({ level, count }) => (
              <button
                type="button"
                key={level}
                aria-pressed={mode === level}
                onClick={() => {
                  setMode(mode === level ? 'all' : level)
                  setLimit(24)
                }}
              >
                <b className="tabular-nums">{formatCount(count)}</b>
                <span>{serviceModeLabel(level)}</span>
              </button>
            ))}
          </div>

          <section className="catalog-browse-section" aria-labelledby="catalog-fields-title">
            <div className="catalog-browse-heading">
              <h2 id="catalog-fields-title">Lĩnh vực thường tra cứu</h2>
              <span>Chọn lĩnh vực để xem thủ tục trong danh mục</span>
            </div>
            <div className="catalog-topic-grid">
              {serviceTopics
                .filter(topic => fieldCounts.has(normalizeTopicField(topic)))
                .map(topic => {
                  const active = matchesTopicField(field, topic)
                  return (
                    <button
                      type="button"
                      key={topic}
                      className={active ? 'active' : ''}
                      aria-pressed={active}
                      onClick={() => selectField(active ? 'all' : topic)}
                    >
                      <span>{topic}</span>
                      <b className="tabular-nums">
                        {formatCount(fieldCounts.get(normalizeTopicField(topic)) || 0)}
                      </b>
                    </button>
                  )
                })}
            </div>
          </section>

          <section className="catalog-browse-section" aria-labelledby="catalog-agencies-title">
            <div className="catalog-browse-heading">
              <h2 id="catalog-agencies-title">Theo cơ quan trong danh mục</h2>
              <span>{formatCount(agencyCounts.length)} nhóm cơ quan</span>
            </div>
            <div className="catalog-agency-list">
              {agencyCounts.map(([name, count]) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={agency === name}
                  className={agency === name ? 'active' : ''}
                  onClick={() => {
                    setAgency(agency === name ? 'all' : name)
                    setLimit(24)
                  }}
                >
                  <span>{name}</span>
                  <b className="tabular-nums">{formatCount(count)}</b>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <section
        className="catalog-browse-section catalog-search-section"
        aria-labelledby="catalog-results-title"
      >
        <div className="catalog-browse-heading">
          <h2 id="catalog-results-title">Danh sách thủ tục</h2>
          <button type="button" className="text-button" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        </div>

        <div className="citizen-catalog-controls">
          <label className="citizen-field" htmlFor="catalog-search-input">
            <span>Tên hoặc mã thủ tục</span>
            <input
              id="catalog-search-input"
              type="search"
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setLimit(24)
              }}
              placeholder="Ví dụ: khai sinh, bản sao, hộ kinh doanh"
            />
          </label>

          <label className="citizen-field" htmlFor="catalog-field-select">
            <span>Lĩnh vực</span>
            <select
              id="catalog-field-select"
              value={field}
              onChange={event => selectField(event.target.value)}
            >
              <option value="all">Tất cả lĩnh vực</option>
              {fields.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="citizen-field" htmlFor="catalog-agency-select">
            <span>Cơ quan</span>
            <select
              id="catalog-agency-select"
              value={agency}
              onChange={event => {
                setAgency(event.target.value)
                setLimit(24)
              }}
            >
              <option value="all">Tất cả cơ quan</option>
              {agencyCounts.map(([name]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="citizen-field" htmlFor="catalog-mode-select">
            <span>Mức dịch vụ</span>
            <select
              id="catalog-mode-select"
              value={mode}
              onChange={event => {
                setMode(event.target.value)
                setLimit(24)
              }}
            >
              <option value="all">Tất cả mức dịch vụ</option>
              {levels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="catalog-form-filter" htmlFor="catalog-form-only-checkbox">
          <input
            id="catalog-form-only-checkbox"
            type="checkbox"
            checked={formOnly}
            onChange={event => {
              setFormOnly(event.target.checked)
              setLimit(24)
            }}
          />
          <span>Chỉ xem thủ tục nộp trực tuyến ({formatCount(configured)})</span>
        </label>

        {loading && (
          <p className="catalog-status" role="status">
            Đang tải danh mục thủ tục…
          </p>
        )}
        {error && (
          <p className="catalog-status catalog-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="citizen-catalog-layout catalog-list-layout">
            <section className="citizen-catalog-results" aria-label="Kết quả tìm kiếm thủ tục">
              <p className="catalog-status">
                {formatCount(filtered.length)} thủ tục phù hợp · đang hiển thị{' '}
                {formatCount(Math.min(limit, filtered.length))}
              </p>

              {filtered.slice(0, limit).map(item => (
                <a
                  className="citizen-catalog-row"
                  key={item.code}
                  href={`/thu-tuc/${encodeURIComponent(item.code)}`}
                >
                  <span>
                    <small>
                      {item.code} · {catalogField(item) || 'Chưa phân nhóm'}
                    </small>
                    <b>{item.name}</b>
                    <span>
                      {catalogAgency(item) || 'Cơ quan theo thủ tục'} · {serviceModeLabel(item.level)}
                      {hasInteractiveForm(item) ? ' · Hỗ trợ nộp trực tuyến' : ' · Tra cứu thông tin'}
                    </span>
                  </span>
                  <i>Chi tiết</i>
                </a>
              ))}

              {!filtered.length && (
                <div className="catalog-empty">
                  Không tìm thấy thủ tục khớp điều kiện. Hãy đổi từ khóa hoặc bỏ bớt bộ lọc.
                </div>
              )}

              {filtered.length > limit && (
                <button
                  type="button"
                  className="button secondary catalog-more"
                  onClick={() => setLimit(value => value + 24)}
                >
                  Xem thêm 24 thủ tục
                </button>
              )}
            </section>
          </div>
        )}
      </section>
    </section>
  )
}

export default CitizenProcedureCatalog
