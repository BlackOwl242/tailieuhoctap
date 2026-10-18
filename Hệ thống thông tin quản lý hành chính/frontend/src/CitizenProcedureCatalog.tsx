import { useEffect, useMemo, useState } from 'react'
import { serviceModeLabel } from './procedureLabels'
import { serviceTopics, showcaseProcedureCodes } from './serviceTopics'
import type { SubmissionSchema } from './CitizenSubmission'

type Procedure = {
  ref?: string
  code: string
  name: string
  field: string
  level: string
  agency: string
  verified: boolean
  submission?: SubmissionSchema
  routing?: { status?: string; summary?: string; checkedAt?: string; officialUrl?: string }
}

const format = (value: number) => value.toLocaleString('vi-VN')
const levels = ['Toàn trình', 'Một phần', 'Cung cấp thông tin']
const catalogField = (item: Procedure) => item.field || (item.code === '2.000908' ? 'Chứng thực' : '')
const catalogAgency = (item: Procedure) => item.agency || (['2.000908', '2.000635'].includes(item.code) ? 'Sở Tư pháp' : '')
const hasInteractiveForm = (item: Procedure | null | undefined) => Boolean(item?.submission && item.submission.sourceStatus !== 'official-document-list-only' && item.submission.fields?.length)

export function CitizenProcedureCatalog({ onStartProcedure, request }: { onStartProcedure: (code: string) => void; request: <T>(path: string) => Promise<T> }) {
  const params = new URLSearchParams(window.location.search)
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [query, setQuery] = useState(params.get('q') || '')
  const [field, setField] = useState(params.get('field') || 'all')
  const [agency, setAgency] = useState('all')
  const [mode, setMode] = useState('all')
  const [formOnly, setFormOnly] = useState(false)
  const [selectedCode, setSelectedCode] = useState(params.get('code') || '')
  const [limit, setLimit] = useState(24)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    request<{ procedures: Procedure[] }>('/api/procedures')
      .then(result => { if (active) setProcedures(result.procedures) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được danh mục thủ tục.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [request])

  const fieldCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of procedures) counts.set(catalogField(item), (counts.get(catalogField(item)) || 0) + 1)
    return counts
  }, [procedures])
  const agencyCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of procedures) counts.set(catalogAgency(item), (counts.get(catalogAgency(item)) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [procedures])
  const fields = useMemo(() => [...fieldCounts.keys()].filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')), [fieldCounts])
  const configured = procedures.filter(item => hasInteractiveForm(item)).length
  const levelCounts = useMemo(() => levels.map(level => ({ level, count: procedures.filter(item => item.level === level).length })), [procedures])
  const browseOrder = useMemo(() => {
    const featured = showcaseProcedureCodes.map(code => procedures.find(item => item.code === code)).filter((item): item is Procedure => Boolean(item))
    const agencies = new Map<string, Procedure>()
    for (const item of procedures) if (!agencies.has(catalogAgency(item))) agencies.set(catalogAgency(item), item)
    const front = [...featured, ...agencies.values()]
    const seen = new Set(front.map(item => item.code))
    return [...front.filter((item, index) => front.findIndex(previous => previous.code === item.code) === index), ...procedures.filter(item => !seen.has(item.code))]
  }, [procedures])
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi')
    return browseOrder.filter(item => (field === 'all' || catalogField(item) === field)
      && (agency === 'all' || catalogAgency(item) === agency)
      && (mode === 'all' || item.level === mode)
      && (!formOnly || hasInteractiveForm(item))
      && (!term || [item.code, item.name, item.field, item.agency, item.level].join(' ').toLocaleLowerCase('vi').includes(term)))
  }, [browseOrder, query, field, agency, mode, formOnly])
  const selected = procedures.find(item => item.code === selectedCode) || null

  function selectField(value: string) {
    setField(value); setLimit(24)
    const next = new URLSearchParams(window.location.search)
    if (value === 'all') next.delete('field'); else next.set('field', value)
    window.history.replaceState(window.history.state, '', `/thu-tuc${next.size ? `?${next}` : ''}`)
  }
  function selectProcedure(code: string) {
    setSelectedCode(code)
    const next = new URLSearchParams(window.location.search)
    next.set('code', code)
    window.history.replaceState(window.history.state, '', `/thu-tuc?${next}`)
    if (window.innerWidth < 700) document.querySelector('.citizen-catalog-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function clearFilters() { setQuery(''); setField('all'); setAgency('all'); setMode('all'); setFormOnly(false); setLimit(24); window.history.replaceState(window.history.state, '', '/thu-tuc') }
  const officialLink = selected?.submission?.sourceUrl || (selected ? `https://dichvucong.gov.vn/dvc-ket-qua-thu-tuc?keyword=${encodeURIComponent(selected.name)}` : '')

  return <section className="citizen-catalog-page">
    <div className="citizen-page-heading"><span className="eyebrow">DANH MỤC THỦ TỤC</span><h1>Dịch vụ công tại Hà Nội</h1><p>Duyệt theo lĩnh vực và cơ quan, hoặc tìm theo mã, tên thủ tục. Chỉ các thủ tục có tờ khai điện tử riêng mới lập hồ sơ trực tiếp trong ứng dụng.</p></div>
    {!loading && !error && <>
      <div className="catalog-overview" aria-label="Quy mô danh mục"><div><b>{format(procedures.length)}</b><span>thủ tục tham chiếu</span></div><div><b>{format(fieldCounts.size)}</b><span>lĩnh vực</span></div><div><b>{format(agencyCounts.length)}</b><span>nhóm cơ quan</span></div><div><b>{format(configured)}</b><span>tờ khai có thể lập trong ứng dụng</span></div></div>
      <div className="catalog-level-summary">{levelCounts.map(({ level, count }) => <button type="button" key={level} aria-pressed={mode === level} onClick={() => { setMode(mode === level ? 'all' : level); setLimit(24) }}><b>{format(count)}</b><span>{serviceModeLabel(level)}</span></button>)}</div>
      <section className="catalog-browse-section" aria-labelledby="catalog-fields-title"><div className="catalog-browse-heading"><h2 id="catalog-fields-title">Lĩnh vực thường tra cứu</h2><span>Chọn lĩnh vực để xem thủ tục trong danh mục</span></div><div className="catalog-topic-grid">{serviceTopics.filter(topic => fieldCounts.has(topic)).map(topic => <button type="button" key={topic} className={field === topic ? 'active' : ''} aria-pressed={field === topic} onClick={() => selectField(field === topic ? 'all' : topic)}><span>{topic}</span><b>{format(fieldCounts.get(topic) || 0)}</b></button>)}</div></section>
      <section className="catalog-browse-section" aria-labelledby="catalog-agencies-title"><div className="catalog-browse-heading"><h2 id="catalog-agencies-title">Theo cơ quan trong danh mục</h2><span>{format(agencyCounts.length)} nhóm cơ quan</span></div><div className="catalog-agency-list">{agencyCounts.map(([name, count]) => <button type="button" key={name} aria-pressed={agency === name} className={agency === name ? 'active' : ''} onClick={() => { setAgency(agency === name ? 'all' : name); setLimit(24) }}><span>{name}</span><b>{format(count)}</b></button>)}</div></section>
    </>}
    <section className="catalog-browse-section catalog-search-section" aria-labelledby="catalog-results-title"><div className="catalog-browse-heading"><h2 id="catalog-results-title">Danh sách thủ tục</h2><button type="button" className="text-button" onClick={clearFilters}>Xóa bộ lọc</button></div>
      <div className="citizen-catalog-controls"><label className="citizen-field">Tên hoặc mã thủ tục<input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(24) }} placeholder="Ví dụ: khai sinh, bản sao, hộ kinh doanh" /></label><label className="citizen-field">Lĩnh vực<select value={field} onChange={event => selectField(event.target.value)}><option value="all">Tất cả lĩnh vực</option>{fields.map(value => <option key={value}>{value}</option>)}</select></label><label className="citizen-field">Cơ quan<select value={agency} onChange={event => { setAgency(event.target.value); setLimit(24) }}><option value="all">Tất cả cơ quan</option>{agencyCounts.map(([name]) => <option key={name}>{name}</option>)}</select></label><label className="citizen-field">Mức dịch vụ<select value={mode} onChange={event => { setMode(event.target.value); setLimit(24) }}><option value="all">Tất cả mức dịch vụ</option>{levels.map(level => <option key={level}>{level}</option>)}</select></label></div>
      <label className="catalog-form-filter"><input type="checkbox" checked={formOnly} onChange={event => { setFormOnly(event.target.checked); setLimit(24) }} /> Chỉ xem thủ tục có tờ khai trong ứng dụng ({format(configured)})</label>
      {loading && <p className="catalog-status" role="status">Đang tải danh mục thủ tục…</p>}
      {error && <p className="catalog-status catalog-error" role="alert">{error}</p>}
      {!loading && !error && <div className="citizen-catalog-layout"><section className="citizen-catalog-results" aria-label="Kết quả tìm kiếm thủ tục"><p className="catalog-status">{format(filtered.length)} thủ tục phù hợp · đang hiển thị {format(Math.min(limit, filtered.length))}</p>
        {filtered.slice(0, limit).map(item => <button type="button" className={`citizen-catalog-row${selectedCode === item.code ? ' selected' : ''}`} key={item.code} onClick={() => selectProcedure(item.code)}><span><small>{item.code} · {item.field || 'Chưa phân nhóm'}</small><b>{item.name}</b><span>{item.agency || 'Cơ quan theo thủ tục'} · {serviceModeLabel(item.level)}{hasInteractiveForm(item) ? ' · Có tờ khai trong ứng dụng' : item.submission ? ' · Đã đồng bộ thành phần hồ sơ' : ''}</span></span><i>Chi tiết →</i></button>)}
        {!filtered.length && <div className="catalog-empty">Không tìm thấy thủ tục khớp điều kiện. Hãy đổi từ khóa hoặc bỏ bớt bộ lọc.</div>}
        {filtered.length > limit && <button type="button" className="button secondary catalog-more" onClick={() => setLimit(value => value + 24)}>Xem thêm 24 thủ tục</button>}
      </section><aside className="citizen-catalog-detail" aria-live="polite">{selected ? <><span className="eyebrow">THÔNG TIN THỦ TỤC</span><small className="procedure-detail-code">{selected.code}{selected.ref ? ` · ${selected.ref}` : ''}</small><h2>{selected.name}</h2><dl className="procedure-facts"><div><dt>Lĩnh vực</dt><dd>{selected.field || 'Chưa xác định'}</dd></div><div><dt>Mức dịch vụ theo danh mục</dt><dd>{serviceModeLabel(selected.level)}</dd></div><div><dt>Cơ quan trong danh mục</dt><dd>{selected.agency || 'Chưa xác định'}</dd></div></dl><div className="citizen-source-note"><b>{hasInteractiveForm(selected) ? 'Có tờ khai riêng trong ứng dụng' : selected.submission ? 'Đã đồng bộ danh mục thành phần hồ sơ (chưa có tờ khai điện tử)' : 'Chưa có tờ khai riêng trong ứng dụng'}</b><span>{selected.routing?.summary || 'Danh mục hiện có tên, lĩnh vực và cơ quan tham chiếu; cần xem trang công bố để biết hồ sơ, phí và thời hạn.'}</span></div>{selected.submission && <section className="procedure-requirements"><h3>Yêu cầu lập hồ sơ</h3><p>{selected.submission.deadlineText}</p><p>{selected.submission.feeText}</p><h3>Giấy tờ theo trường hợp</h3><ul>{selected.submission.documents.map(document => <li key={document.id}><b>{document.label}</b>{document.help && <p>{document.help}</p>}</li>)}</ul></section>}<div className="citizen-catalog-actions">{hasInteractiveForm(selected) ? <button type="button" className="button primary" onClick={() => onStartProcedure(selected.code)}>Lập hồ sơ theo thủ tục này</button> : <p className="catalog-unavailable">{selected.submission ? 'Thủ tục đã có danh sách thành phần hồ sơ tham chiếu; hãy mở Cổng Dịch vụ công Quốc gia để nộp trực tuyến hoặc đặt lịch nộp tại quầy Một cửa.' : 'Chưa thể lập hồ sơ ở đây vì thiếu tờ khai và thành phần hồ sơ riêng cho thủ tục.'}</p>}<a className="button secondary" href={officialLink} target="_blank" rel="noreferrer">Tra cứu thủ tục trên Cổng quốc gia ↗</a></div></> : <div className="catalog-placeholder"><h2>Chọn một thủ tục</h2><p>Xem lĩnh vực, mức dịch vụ, cơ quan và khả năng lập hồ sơ trong ứng dụng.</p></div>}</aside></div>}
    </section>
  </section>
}
