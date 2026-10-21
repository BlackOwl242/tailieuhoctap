import { useEffect, useState, type ReactNode } from 'react'
import type { SubmissionSchema } from './CitizenSubmission'
import { normalizeAgency, procedureAgencies } from './procedureAgencies'
import { serviceModeLabel } from './procedureLabels'
import './ProcedureDetail.css'

type Named = { id?: string; name?: string; code?: string }
type Fee = { type?: string; value?: number; currencyName?: string; description?: string }
type Method = { submissionMethod?: string; processingTime?: number; processingTimeUnit?: string; description?: string; fees?: Fee[] }
type Component = Named & { profileComponentId?: string; originalQty?: number; copyQty?: number; attachments?: { id?: string; fileName?: string; name?: string; url?: string }[] }
type OfficialDetail = {
  code: string; name: string; sourceUrl: string; checkedAt: string; decisionNumber: string; executionLevel: string; procedureType: string
  fields: string[]; targets: string[]; authorities: string[]; executingAgencies: string[]; authorizedAgencies: string[]; coordinatingAgencies: string[]
  receivingAddress: string; steps: { name: string; description: string }[]; methods: Method[]; cases: { name?: string; profileComponents?: Component[] }[]
  legalBases: Named[]; conditions: string; results: Named[]; relatedProcedures: Named[]; keywords: string; description: string
}
type Procedure = {
  code: string; sourceCode?: string; name: string; field: string; agency: string; level: string; submissionEnabled?: boolean; submissionDisabledReason?: string; serviceMode?: string; submission?: SubmissionSchema
  routing?: { observedAuthorities?: { authority: string }[] }
}
type DetailResponse = { procedure: Procedure; detail: OfficialDetail | null }
const sections = [
  ['thong-tin', 'Thông tin thủ tục'], ['trinh-tu', 'Trình tự thực hiện'], ['cach-thuc', 'Cách thức thực hiện'],
  ['thanh-phan', 'Thành phần hồ sơ'], ['can-cu', 'Căn cứ pháp lý'], ['co-quan', 'Cơ quan thực hiện'],
  ['dieu-kien', 'Yêu cầu, điều kiện'], ['ket-qua', 'Kết quả xử lý'],
]
const methodNames: Record<string, string> = { ONLINE: 'Trực tuyến', DIRECT: 'Trực tiếp', POSTAL: 'Dịch vụ bưu chính' }
const timeUnits: Record<string, string> = { DAY: 'ngày', WORKING_DAY: 'ngày làm việc', MONTH: 'tháng', YEAR: 'năm', HOUR: 'giờ', MINUTE: 'phút' }
const empty = 'Chưa có thông tin trong bản công bố đã lưu.'

function plain(value: string | undefined) {
  if (!value) return ''
  const html = value.replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6])>/gi, '\n')
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() || ''
}
function Text({ children }: { children: string | undefined }) {
  return <p className="procedure-text">{plain(children) || empty}</p>
}
function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="procedure-section" aria-labelledby={`${id}-heading`}><h2 id={`${id}-heading`}>{title}</h2>{children}</section>
}
function Fact({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={wide ? 'procedure-info-fact wide' : 'procedure-info-fact'}><dt>{label}</dt><dd>{children || <span className="procedure-missing">Chưa có thông tin</span>}</dd></div>
}
function duration(method: Method) {
  const unit = timeUnits[method.processingTimeUnit || '']
  return method.processingTime !== undefined && method.processingTime !== null && unit ? `${method.processingTime.toLocaleString('vi-VN')} ${unit}` : 'Chưa công bố'
}
function Fees({ fees }: { fees?: Fee[] }) {
  if (!fees?.length) return <span>Chưa có thông tin</span>
  return <div className="procedure-fees">{fees.map((fee, index) => <div key={index}>
    <b>{fee.type === 'CHARGE' ? 'Lệ phí' : 'Phí'}: {fee.value === 0 ? (fee.description?.trim() ? 'Theo mức thu mô tả bên dưới' : 'Miễn phí') : fee.value !== undefined && fee.value !== null ? `${fee.value.toLocaleString('vi-VN')} ${fee.currencyName || 'đồng'}` : 'Theo quy định trong mô tả'}</b>
    {fee.description && <Text>{fee.description}</Text>}
  </div>)}</div>
}

export function CitizenProcedureDetail({ code, request, audience = 'citizen' }: { code: string; request: <T>(path: string) => Promise<T>; audience?: 'citizen' | 'staff' }) {
  const staffView = audience === 'staff'
  const DetailTitle = staffView ? 'h2' : 'h1'
  const [response, setResponse] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [agencies, setAgencies] = useState<string[]>([])
  const [directoryError, setDirectoryError] = useState('')
  const [selectedAgency, setSelectedAgency] = useState('')
  const [selectedCase, setSelectedCase] = useState(0)
  const [downloading, setDownloading] = useState('')
  const [downloadError, setDownloadError] = useState('')

  async function downloadTemplate(id: string, name: string) {
    setDownloading(id); setDownloadError('')
    try {
      const result = await fetch(`/api/procedures/${encodeURIComponent(code)}/templates/${encodeURIComponent(id)}`)
      if (!result.ok) {
        const failure = await result.json().catch(() => ({}))
        throw new Error(failure.error || 'Không tải được mẫu đơn. Hãy thử lại hoặc mở bản công bố gốc.')
      }
      const url = URL.createObjectURL(await result.blob())
      const link = document.createElement('a')
      link.href = url; link.download = name
      document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (reason) {
      setDownloadError(reason instanceof Error ? reason.message : 'Không tải được mẫu đơn.')
    } finally { setDownloading('') }
  }

  useEffect(() => {
    let active = true
    request<DetailResponse>(`/api/procedures/${encodeURIComponent(code)}/detail`)
      .then(result => { if (active) setResponse(result) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được thông tin thủ tục.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [code, request, attempt])
  useEffect(() => {
    let active = true
    if (staffView) return
    request<{ agencies: string[] }>('/api/public/agencies').then(result => { if (active) setAgencies(result.agencies) })
      .catch(() => { if (active) setDirectoryError('Không tải được danh sách cơ quan tiếp nhận. Vui lòng thử lại.') })
    return () => { active = false }
  }, [request, attempt, staffView])

  function retry() { setLoading(true); setError(''); setResponse(null); setDirectoryError(''); setAttempt(value => value + 1) }

  if (loading) return <section className="procedure-detail-page"><p role="status">Đang tải chi tiết thủ tục…</p></section>
  if (error || !response) return <section className="procedure-detail-page"><h1>Không tải được thủ tục</h1><p role="alert">{error || 'Không tìm thấy thủ tục trong danh mục.'}</p><div className="procedure-page-actions"><button className="button secondary" onClick={retry}>Thử lại</button><a href="/thu-tuc" className="button secondary">Về danh mục thủ tục</a></div></section>

  const { procedure, detail } = response
  const sourceCode = procedure.sourceCode || procedure.code
  const schema = procedure.submission
  const configured = procedure.submissionEnabled === true
  const matching = procedureAgencies({ ...procedure, code: sourceCode }, agencies)
  const eligible = matching.filter(agency => agencies.some(registered => normalizeAgency(agency) === normalizeAgency(registered)))
  const activeCase = detail?.cases[selectedCase]
  const formCase = schema?.fields.find(field => field.id === 'officialCase')?.options?.[selectedCase]
  const sourceUrl = detail?.sourceUrl || schema?.sourceUrl
  const fallbackDocuments = schema?.sourceStatus !== 'configured-standard' ? schema?.documents : []
  const checked = detail?.checkedAt ? new Date(detail.checkedAt).toLocaleDateString('vi-VN') : ''

  return <article className={`procedure-detail-page${staffView ? ' procedure-detail-staff' : ''}`}>
    {!staffView && <nav className="procedure-breadcrumb" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span aria-hidden="true">/</span><a href="/thu-tuc">Thủ tục hành chính</a><span aria-hidden="true">/</span><span aria-current="page">Chi tiết thủ tục</span></nav>}
    <header className="procedure-page-heading"><DetailTitle>{detail?.name || procedure.name}</DetailTitle><div className="procedure-page-actions"><span className="procedure-code">Mã thủ tục: <b>{sourceCode}</b></span><button className="button secondary" type="button" onClick={() => window.print()}>In / Lưu PDF</button>{sourceUrl && <a className="button secondary" href={sourceUrl} target="_blank" rel="noreferrer">{detail ? 'Xem bản công bố gốc' : 'Tra cứu trên cổng chính thức'}</a>}</div></header>
    {detail ? <p className="procedure-source-line">Nguồn: Cổng Dịch vụ công quốc gia · Đối chiếu ngày {checked}. {staffView ? 'Nội dung theo bản công bố gốc; cấu hình nội bộ được hiển thị riêng ở trên.' : 'Nội dung giữ theo bản công bố; cơ quan nộp hồ sơ được chọn ở phần tiếp nhận.'}</p> : <p className="procedure-source-line">Danh mục hiện có thông tin cơ bản của thủ tục này. Chưa có bản chi tiết chính thức được đối chiếu để hiển thị đầy đủ.</p>}
    <div className="procedure-detail-layout">
      <div className="procedure-detail-content">
        <Block id="thong-tin" title="Thông tin thủ tục"><dl className="procedure-info-grid">
          <Fact label="Tên thủ tục" wide>{detail?.name || procedure.name}</Fact>
          <Fact label="Mã thủ tục">{sourceCode}</Fact><Fact label="Số quyết định">{detail?.decisionNumber}</Fact>
          <Fact label="Cấp thực hiện">{detail?.executionLevel}</Fact><Fact label="Loại thủ tục">{detail?.procedureType}</Fact>
          <Fact label="Lĩnh vực">{detail?.fields.join(', ') || procedure.field}</Fact><Fact label="Đối tượng thực hiện">{detail?.targets.join(', ')}</Fact>
          <Fact label="Cơ quan có thẩm quyền" wide>{detail?.authorities.join(', ')}</Fact>
          <Fact label="Địa chỉ tiếp nhận hồ sơ" wide>{detail?.receivingAddress}</Fact>
          <Fact label="Cơ quan được ủy quyền">{detail?.authorizedAgencies.join(', ')}</Fact><Fact label="Cơ quan phối hợp">{detail?.coordinatingAgencies.join(', ')}</Fact>
        </dl></Block>
        <Block id="lien-quan" title="Thủ tục hành chính liên quan">{detail?.relatedProcedures.length ? detail.relatedProcedures.map((item, index) => <p key={item.id || index}>{item.name}{item.code && ` (${item.code})`}</p>) : <p className="procedure-missing">Chưa có thông tin trong bản công bố.</p>}</Block>
        <Block id="trinh-tu" title="Trình tự thực hiện">{detail?.steps.length ? detail.steps.map((step, index) => <div key={index} className="procedure-step">{step.name && <h3>{plain(step.name)}</h3>}<Text>{step.description}</Text></div>) : <Text>{undefined}</Text>}</Block>
        <Block id="cach-thuc" title="Cách thức thực hiện">{detail?.methods.length ? <table className="procedure-data-table procedure-method-table"><thead><tr><th scope="col">Hình thức nộp</th><th scope="col">Thời hạn giải quyết</th><th scope="col">Phí, lệ phí</th><th scope="col">Mô tả</th></tr></thead><tbody>{detail.methods.map((method, index) => <tr key={index}><td data-label="Hình thức nộp">{methodNames[method.submissionMethod || ''] || method.submissionMethod || 'Chưa công bố'}</td><td data-label="Thời hạn giải quyết">{duration(method)}</td><td data-label="Phí, lệ phí"><Fees fees={method.fees} /></td><td data-label="Mô tả"><Text>{method.description}</Text></td></tr>)}</tbody></table> : <Text>{undefined}</Text>}</Block>
        {configured && schema && <section className="procedure-section" aria-labelledby="configured-deadline-heading"><h2 id="configured-deadline-heading">Thời hạn và khoản thu khi lập hồ sơ</h2><p className="procedure-text">{schema.deadlineText}</p><p className="procedure-text">{schema.feeText}</p><p className="procedure-source-line">Quy tắc tiếp nhận đã cấu hình cho cơ quan trong ứng dụng. Bảng phía trên giữ số liệu của bản công bố đã lưu; phần diễn giải này làm rõ mốc áp dụng cho hồ sơ.</p></section>}
        <Block id="thanh-phan" title="Thành phần hồ sơ">
          {downloadError && <p className="form-error" role="alert">{downloadError} {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">Mở bản công bố gốc</a>}</p>}
          {detail && detail.cases.length > 1 && <label className="procedure-case-select">Chọn trường hợp thực hiện<select value={selectedCase} onChange={event => setSelectedCase(Number(event.target.value))}>{detail.cases.map((item, index) => <option value={index} key={index}>{index + 1}. {plain(item.name) || `Trường hợp ${index + 1}`}</option>)}</select></label>}
          {activeCase?.name && <h3>{plain(activeCase.name)}</h3>}
          {activeCase?.profileComponents?.length ? <table className="procedure-data-table procedure-document-table"><thead><tr><th scope="col">Tên giấy tờ</th><th scope="col">Mẫu đơn, tờ khai</th><th scope="col">Số lượng</th></tr></thead><tbody>{activeCase.profileComponents.map((document, index) => <tr key={document.profileComponentId || index}><td data-label="Tên giấy tờ"><Text>{document.name}</Text></td><td data-label="Mẫu đơn, tờ khai">{document.attachments?.length ? <ul className="procedure-template-list">{document.attachments.map((attachment, attachmentIndex) => <li key={attachment.id || attachmentIndex}>{attachment.id ? <button type="button" className="procedure-template-download" disabled={Boolean(downloading)} onClick={() => downloadTemplate(attachment.id!, attachment.fileName || attachment.name || 'mau-don')}>{downloading === attachment.id ? 'Đang tải mẫu…' : attachment.fileName || attachment.name || 'Tải mẫu đơn'}</button> : <a href={detail?.sourceUrl} target="_blank" rel="noreferrer">{attachment.fileName || attachment.name || 'Xem mẫu đơn trên Cổng quốc gia'}</a>}<small>Tệp mẫu gốc từ Cổng quốc gia</small></li>)}</ul> : <span className="procedure-missing">Không có tệp mẫu kèm theo</span>}</td><td data-label="Số lượng"><span className="procedure-quantity">{document.originalQty !== undefined && <span>Bản chính: {document.originalQty}</span>}{document.copyQty !== undefined && <span>Bản sao: {document.copyQty}</span>}{document.originalQty === undefined && document.copyQty === undefined && 'Chưa công bố'}</span></td></tr>)}</tbody></table> : fallbackDocuments?.length ? <ul className="procedure-fallback-docs">{fallbackDocuments.map(document => <li key={document.id}><b>{document.label}</b>{document.help && <Text>{document.help}</Text>}</li>)}</ul> : <Text>{undefined}</Text>}
        </Block>
        <Block id="can-cu" title="Căn cứ pháp lý">{detail?.legalBases.length ? <table className="procedure-data-table procedure-legal-table"><thead><tr><th scope="col">Tên văn bản pháp lý</th><th scope="col">Mã văn bản</th></tr></thead><tbody>{detail.legalBases.map((basis, index) => <tr key={basis.id || index}><td data-label="Tên văn bản pháp lý"><Text>{basis.name}</Text></td><td data-label="Mã văn bản">{basis.code || 'Chưa công bố'}</td></tr>)}</tbody></table> : <Text>{schema?.sourceStatus !== 'configured-standard' ? schema?.legalBasis : undefined}</Text>}</Block>
        <Block id="co-quan" title="Cơ quan thực hiện"><Text>{detail?.executingAgencies.join(', ') || procedure.agency}</Text></Block>
        <Block id="dieu-kien" title="Yêu cầu, điều kiện thực hiện"><Text>{detail?.conditions}</Text></Block>
        <Block id="ket-qua" title="Kết quả xử lý">{detail?.results.length ? detail.results.map((result, index) => <div key={result.id || index}><Text>{result.name}</Text>{result.code && <p className="procedure-result-code">Mã kết quả: {result.code}</p>}</div>) : <Text>{undefined}</Text>}</Block>
        <Block id="tu-khoa" title="Từ khóa"><Text>{detail?.keywords}</Text></Block>
        <Block id="mo-ta" title="Mô tả"><Text>{detail?.description}</Text></Block>
      </div>
      <aside className="procedure-detail-sidebar">
        {!staffView && <section className="procedure-intake-panel" aria-labelledby="procedure-intake-title"><h2 id="procedure-intake-title">Chọn cơ quan thực hiện</h2><p>Chọn nơi tiếp nhận tại Hà Nội để bắt đầu lập hồ sơ.</p><label>Tỉnh / Thành phố<input value="Thành phố Hà Nội" readOnly /></label><label>Cơ quan tiếp nhận<select value={selectedAgency} onChange={event => setSelectedAgency(event.target.value)} disabled={!configured || !eligible.length}><option value="">Chọn cơ quan thực hiện</option>{eligible.map(agency => <option key={agency}>{agency}</option>)}</select></label>
          {directoryError ? <p role="alert">{directoryError} <button className="text-button" onClick={retry}>Thử lại</button></p> : <p className="procedure-intake-hint">{!configured ? (procedure.submissionDisabledReason || 'Thủ tục chưa có tờ khai và quy trình đã đối chiếu. Xem cách thức thực hiện ở bên cạnh.') : !eligible.length ? 'Chưa có đơn vị tiếp nhận trực tuyến cho thủ tục này trong hệ thống.' : 'Danh sách chỉ gồm cơ quan đã có bộ phận tiếp nhận trong hệ thống.'}</p>}
          {selectedAgency && configured ? <a className="button primary" href={`/nop-ho-so?${new URLSearchParams({ procedure: sourceCode, agency: selectedAgency, ...(formCase ? { case: formCase } : {}) })}`}>Nộp hồ sơ</a> : <button className="button primary" disabled type="button">Nộp hồ sơ</button>}
          <dl className="procedure-intake-mode"><dt>Mức dịch vụ trong danh mục Hà Nội</dt><dd>{serviceModeLabel(procedure.level)}</dd></dl>
        </section>}
        <nav className="procedure-section-nav" aria-label="Nội dung thủ tục"><h2>Nội dung thủ tục</h2>{sections.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</nav>
        {!staffView && <a className="procedure-return-link" href="/thu-tuc">Về danh mục thủ tục</a>}
      </aside>
    </div>
  </article>
}
