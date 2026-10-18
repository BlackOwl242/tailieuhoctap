import { useEffect, useState, type FormEvent } from 'react'
import { serviceModeLabel } from './procedureLabels'

type Condition = { field: string; equals?: string; not?: string }
export type SubmissionField = { id: string; label: string; type?: string; required?: boolean; options?: string[]; applicantTypes?: string[]; when?: Condition; maxLength?: number; min?: number; max?: number; help?: string; officialAttachmentNames?: string[]; templateSourceUrl?: string }
export type SubmissionSchema = { version: string; title: string; sourceUrl: string; formSourceUrl?: string; formSourceLabel?: string; sourceStatus?: string; legalBasis: string; deadlineText: string; feeText: string; fields: SubmissionField[]; documents: SubmissionField[]; deliveryMethods: string[]; deliveryNote: string }
type Procedure = { code: string; name: string; field: string; agency: string; level: string; serviceMode?: string; submission?: SubmissionSchema; routing?: { observedAuthorities?: { authority: string }[] } }
type Receipt = { code: string; accessKey?: string; status?: string; statusLabel?: string; duplicate?: boolean }
type Request = <T>(path: string, body?: unknown) => Promise<T>
function visibleFormItem(item: SubmissionField, applicantType: string, values: Record<string, string>) {
  if (item.applicantTypes && !item.applicantTypes.includes(applicantType)) return false
  const condition = item.when
  if (!condition) return true
  const value = values[condition.field] || ''
  return (condition.equals === undefined || value === condition.equals) && (condition.not === undefined || value !== condition.not)
}
function RequiredMark() { return <span className="required-mark">*</span> }
const titles = ['Thủ tục và cơ quan', 'Người yêu cầu', 'Tờ khai', 'Thành phần hồ sơ', 'Kiểm tra và gửi']
function secureToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('') }
async function encode(file: File, componentId: string) {
  const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return { name: file.name, type: file.type, data: btoa(binary), componentId }
}
export function CitizenApplicationForm({ initialProcedureCode, onSubmitted, request }: { initialProcedureCode: string; onSubmitted: (receipt: Receipt) => void; request: Request }) {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [agencies, setAgencies] = useState<string[]>([])
  const [selectedCode, setSelectedCode] = useState(initialProcedureCode)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(10)
  const [step, setStep] = useState(0)
  const [applicantType, setApplicantType] = useState(() => (new URLSearchParams(location.search).get('applicant') || sessionStorage.getItem('hanoiApplicantType')) === 'organization' ? 'organization' : 'citizen')
  const [values, setValues] = useState<Record<string, string>>({ nationalityType: 'Trong nước', submissionRole: 'Tự nộp' })
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [agency, setAgency] = useState('')
  const [documents, setDocuments] = useState<Record<string, File[]>>({})
  const [delivery, setDelivery] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [keys, setKeys] = useState<{ submissionKey: string; submissionToken: string } | null>(null)
  useEffect(() => {
    let active = true
    Promise.all([request<{ procedures: Procedure[] }>('/api/procedures'), request<{ agencies: string[] }>('/api/public/agencies')])
      .then(([catalog, directory]) => { if (active) { setProcedures(catalog.procedures); setAgencies(directory.agencies); setSelectedCode(initialProcedureCode); setStep(0) } })
      .catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [initialProcedureCode, request])
  const procedure = procedures.find(p => p.code === selectedCode)
  const schema = procedure?.submission
  const observed = procedure?.routing?.observedAuthorities || []
  const matchingAgencies = [...new Set(observed.length ? observed.map(a => a.authority) : procedure?.agency ? [procedure.agency] : [])]
  const hasIntake = agencies.some(a => a.toLocaleLowerCase('vi') === agency.toLocaleLowerCase('vi'))
  const fields = schema?.fields.filter(f => visibleFormItem(f, applicantType, values)) || []
  const components = schema?.documents.filter(f => visibleFormItem(f, applicantType, values)) || []
  const files = components.flatMap(c => (documents[c.id] || []).map(file => ({ file, componentId: c.id })))
  const results = query.trim().length < 2 ? [] : procedures.filter(p => `${p.code} ${p.name} ${p.field}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))
  function changeProcedure(code: string) {
    setSelectedCode(code); setStep(0); setAgency(''); setValues({ nationalityType: 'Trong nước', submissionRole: 'Tự nộp' }); setDocuments({}); setDelivery(''); setConfirmed(false); setKeys(null); setError('')
    const params = new URLSearchParams(location.search); if (code) params.set('procedure', code); else params.delete('procedure')
    history.replaceState(history.state, '', `${location.pathname}${params.size ? '?' + params : ''}`)
  }
  function chooseApplicant(type: string) { setApplicantType(type); if (type === 'organization') setValues(old => ({ ...old, nationalityType: 'Trong nước' })); sessionStorage.setItem('hanoiApplicantType', type); setConfirmed(false); setKeys(null) }
  function changeValue(id: string, value: string) { setValues(old => ({ ...old, [id]: value })); setConfirmed(false); setKeys(null) }
  function validateStage(index: number) {
    if (index === 0 && !schema) return 'Thủ tục này chưa có biểu mẫu được cấu hình. Không thể dùng biểu mẫu chung để nộp.'
    if (index === 0 && schema?.sourceStatus === 'official-document-list-only') return 'Nguồn công khai mới xác nhận thành phần hồ sơ, chưa có cấu trúc tờ khai điện tử. Hãy mở trang thủ tục chính thức để nộp; ứng dụng chưa nhận hồ sơ này.'
    if (index === 0 && procedure?.serviceMode === 'INFORMATION') return 'Thủ tục chỉ cung cấp thông tin, chưa tiếp nhận trực tuyến.'
    if (index === 0 && !agency) return 'Chọn đúng cơ quan tiếp nhận. Nếu danh sách trống, đơn vị quản trị cần cấp tài khoản tiếp nhận cho cơ quan.'
    if (index === 1 && contact.name.trim().length < 2) return 'Nhập tên người nộp hoặc tổ chức.'
    if (index === 1 && contact.phone && !/^[+0-9(). -]{8,40}$/.test(contact.phone)) return 'Số điện thoại không hợp lệ.'
    if (index === 1 && !contact.phone.trim() && !contact.email.trim()) return 'Cần số điện thoại hoặc email để cơ quan liên hệ.'
    if (index === 2) { const missing = fields.find(f => f.required && !values[f.id]?.trim()); if (missing) return `Cần khai: ${missing.label}.` }
    if (index === 3) {
      const missing = components.find(c => c.required && !documents[c.id]?.length); if (missing) return `Thiếu: ${missing.label}.`
      if (files.length > 8 || files.some(f => f.file.size > 8 * 1024 * 1024) || files.reduce((n, f) => n + f.file.size, 0) > 9 * 1024 * 1024) return 'Tối đa 8 tệp; mỗi tệp 8 MB; tổng dung lượng 9 MB.'
    }
    if (index === 4 && !delivery) return 'Chọn phương thức nhận kết quả.'
    if (index === 4 && delivery === 'Bưu chính' && deliveryAddress.trim().length < 10) return 'Nhập đầy đủ địa chỉ nhận qua bưu chính.'
    if (index === 4 && !confirmed) return 'Cần xác nhận đã kiểm tra hồ sơ.'
    if (index === 4 && !hasIntake) return 'Cơ quan chưa có cán bộ tiếp nhận còn hiệu lực. Hồ sơ chưa được gửi; liên hệ quản trị viên để cấp tài khoản tiếp nhận.'
    return ''
  }
  function go(index: number) { setStep(index); setError(''); setConfirmed(false); setKeys(null); document.querySelector('.submission-wizard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  async function proceed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const stageError = validateStage(step)
    if (stageError) { setError(stageError); return }
    if (step < 4) { go(step + 1); return }
    for (let index = 0; index < 4; index++) { const issue = validateStage(index); if (issue) { go(index); setError(issue); return } }
    const requestKeys = keys || { submissionKey: crypto.randomUUID(), submissionToken: secureToken() }
    setKeys(requestKeys); setBusy(true); setError('')
    try {
      const declaration = Object.fromEntries(fields.map(f => [f.id, values[f.id] || '']))
      const summary = selectedCode === '1.004237' ? `${values.dataRequested}. Mục đích: ${values.purpose}` : `Đề nghị cấp ${values.copies} bản sao ${values.documentName} cho ${values.originalOwner}.`
      onSubmitted(await request<Receipt>('/api/cases', { ...requestKeys, procedureCode: selectedCode, schemaVersion: schema!.version, applicantType, applicant: contact, receivingAgency: agency, declaration, requestSummary: summary.slice(0, 3000), deliveryMethod: delivery, deliveryAddress, confirmed: true, files: await Promise.all(files.map(f => encode(f.file, f.componentId))) }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Không gửi được hồ sơ. Thông tin đang nhập vẫn được giữ để thử lại.') } finally { setBusy(false) }
  }
  return <section className="citizen-form-page submission-wizard">
    <div className="citizen-page-heading"><span className="eyebrow">NỘP HỒ SƠ TRỰC TUYẾN</span><h1>Lập hồ sơ mới</h1><p>Chọn thủ tục, khai đúng trường hợp và kiểm tra giấy tờ trước khi gửi. Hồ sơ chỉ được tạo sau bước cuối.</p></div>
    <ol className="submission-steps" aria-label="Các bước lập hồ sơ">{titles.map((title, i) => <li key={title} aria-current={step === i ? 'step' : undefined} className={i === step ? 'current' : i < step ? 'completed' : ''}><span>{i + 1}</span>{i < step ? <button type="button" disabled={busy} onClick={() => go(i)}>{title}</button> : <b>{title}</b>}</li>)}</ol>
    <p className="required-field-note">Dấu sao màu đỏ (<RequiredMark />) ở cuối nhãn cho biết thông tin cần điền.</p>
    <form className="citizen-application-form" onSubmit={proceed}>
      {step === 0 && <section className="citizen-form-section"><h2>1. Chọn thủ tục và cơ quan</h2><label className="citizen-field">Tìm theo mã, tên hoặc lĩnh vực<input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(10) }} placeholder="Nhập mã thủ tục hoặc tên thủ tục" /></label>
        {!procedure && <div className="procedure-choice-list">{loading ? <p>Đang tải danh mục…</p> : <>{results.slice(0, limit).map(p => <button type="button" key={p.code} onClick={() => changeProcedure(p.code)}><span><b>{p.name}</b><small>{p.code} · {serviceModeLabel(p.level)}</small></span><i>Chọn</i></button>)}{results.length > limit && <button type="button" onClick={() => setLimit(n => n + 10)}>Xem thêm</button>}{!results.length && <p>{initialProcedureCode && !procedures.some(p => p.code === initialProcedureCode) ? 'Mã thủ tục trong đường dẫn không có trong danh mục. Hãy chọn lại.' : 'Nhập ít nhất 2 ký tự để tìm thủ tục.'}</p>}</>}</div>}
        {procedure && <><div className="selected-procedure"><div><small>{procedure.code} · {procedure.field}</small><b>{procedure.name}</b><span>{serviceModeLabel(procedure.level)}</span></div><button type="button" className="text-button" onClick={() => changeProcedure('')}>Đổi thủ tục</button></div>
          <div className="citizen-source-note"><b>Mức dịch vụ theo danh mục công bố</b><span>{procedure.level === 'Toàn trình' ? 'Toàn trình: các bước có thể thực hiện trực tuyến theo quy trình công bố, gồm thanh toán nếu có và trả kết quả điện tử hoặc bưu chính.' : procedure.level === 'Một phần' ? 'Một phần: có thể nộp và theo dõi trực tuyến; một hoặc nhiều khâu cần thực hiện theo yêu cầu riêng của thủ tục. Không có nghĩa là mọi khâu đều trực tuyến.' : 'Chỉ cung cấp thông tin: không dùng biểu mẫu này để gửi hồ sơ trực tuyến.'}</span><span>Mức công bố không chứng nhận các kết nối của ứng dụng này đã hoạt động.</span></div>
          {schema ? <><p><b>{schema.sourceStatus === 'official-document-list-only' ? 'Tham chiếu thành phần hồ sơ:' : 'Biểu mẫu:'}</b> {schema.title}</p><p>{schema.deadlineText}</p><p>{schema.feeText}</p><a href={schema.sourceUrl} target="_blank" rel="noreferrer">Nội dung và thành phần hồ sơ công bố ↗</a>{schema.sourceStatus === 'official-document-list-only' && <p className="citizen-source-note">Đã có danh sách thành phần hồ sơ và tên tệp mẫu do Cổng quốc gia công khai. Nguồn không cung cấp cấu trúc tờ khai điện tử cho ứng dụng này; nút tiếp tục nộp cục bộ được khóa để tránh nhận hồ sơ thiếu khai báo. Dùng liên kết nguồn chính thức để lập và gửi hồ sơ.</p>}</> : <p className="form-error">Chưa cấu hình tờ khai và thành phần hồ sơ của thủ tục này. Không nhận hồ sơ bằng một ô mô tả chung.</p>}
          <label className="citizen-field">Tỉnh, thành phố<input value="Thành phố Hà Nội" readOnly /></label><label className="citizen-field"><span>Cơ quan tiếp nhận<RequiredMark /></span><select required value={agency} onChange={e => { setAgency(e.target.value); setValues(old => ({ ...old, registerAuthority: e.target.value })) }} disabled={!matchingAgencies.length}><option value="">{matchingAgencies.length ? 'Chọn cơ quan tiếp nhận' : 'Chưa có cơ quan tiếp nhận đang hoạt động'}</option>{matchingAgencies.map(a => <option key={a}>{a}</option>)}</select><small>Chọn cơ quan thuộc tuyến của thủ tục. Việc gửi cần cán bộ tiếp nhận còn hiệu lực tại cơ quan đó. Với cấp bản sao, phải là cơ quan đang lưu sổ gốc.</small></label>{(!agency || !hasIntake) && <p className="citizen-source-note">Bạn có thể xem yêu cầu hồ sơ tại đây. Bạn vẫn có thể chuẩn bị tờ khai. Để gửi hồ sơ, quản trị viên cần cấp và duyệt tài khoản tiếp nhận tại {procedure.agency}.</p>}</>}
      </section>}
      {step === 1 && <section className="citizen-form-section"><h2>2. Người yêu cầu giải quyết</h2><div className="citizen-applicant-type"><label><input type="radio" checked={applicantType === 'citizen'} onChange={() => chooseApplicant('citizen')} /> Cá nhân</label><label><input type="radio" checked={applicantType === 'organization'} onChange={() => chooseApplicant('organization')} /> Tổ chức</label></div><div className="citizen-form-grid"><label className="citizen-field"><span>{applicantType === 'citizen' ? 'Họ và tên người yêu cầu' : 'Tên tổ chức yêu cầu'}<RequiredMark /></span><input value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} minLength={2} maxLength={150} required autoComplete="name" /></label><p id="contact-requirement" className="contact-requirement">Số điện thoại hoặc email<RequiredMark /><small>Điền ít nhất một trong hai để cơ quan liên hệ khi xử lý hồ sơ.</small></p><label className="citizen-field">Số điện thoại<input type="tel" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} maxLength={40} autoComplete="tel" aria-describedby="contact-requirement" /></label><label className="citizen-field">Email<input type="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} maxLength={254} autoComplete="email" aria-describedby="contact-requirement" /></label></div><p>Các thông tin của thủ tục được khai ở bước tiếp theo.</p></section>}
      {step === 2 && <section className="citizen-form-section"><h2>3. {schema?.title}</h2><p>{schema?.legalBasis}</p><div className="citizen-form-grid">{fields.map(f => <label className={`citizen-field${f.type === 'textarea' || f.id === 'submissionRole' ? ' field-wide' : ''}`} key={f.id}><span>{f.label}{f.required && <RequiredMark />}</span>{f.type === 'select' ? <select required={f.required} value={values[f.id] || ''} onChange={e => changeValue(f.id, e.target.value)}><option value="">Chọn…</option>{f.options?.map(option => <option key={option}>{option}</option>)}</select> : f.type === 'textarea' ? <textarea rows={4} required={f.required} maxLength={f.maxLength || 500} value={values[f.id] || ''} onChange={e => changeValue(f.id, e.target.value)} /> : <input type={f.type || 'text'} readOnly={f.id === 'registerAuthority'} required={f.required} min={f.min} max={f.max} maxLength={f.maxLength || 500} value={values[f.id] || ''} onChange={e => changeValue(f.id, e.target.value)} />}{f.help && <small>{f.help}</small>}</label>)}</div></section>}
      {step === 3 && <section className="citizen-form-section"><h2>4. Thành phần hồ sơ</h2><p>Đính kèm theo từng loại giấy tờ. PDF, PNG, JPG, JPEG; tối đa 8 tệp, mỗi tệp 8 MB, tổng 9 MB.</p>{schema?.formSourceUrl && <p><a href={schema.formSourceUrl} target="_blank" rel="noreferrer">{schema.formSourceLabel || 'Xem thành phần hồ sơ và biểu mẫu trên nguồn chính thức ↗'}</a></p>}{components.map(c => <div className="document-component" key={c.id}><label className="citizen-field"><b>{c.label}{c.required && <RequiredMark />}</b>{c.help && <small>{c.help}</small>}{c.officialAttachmentNames?.length ? <small>Mẫu được nguồn chính thức liệt kê: {c.officialAttachmentNames.join('; ')}. Mở trang thủ tục chính thức ở trên để xem hoặc tải nếu được cung cấp.</small> : null}<span className="file-picker-control">Chọn tệp đính kèm<input type="file" aria-required={c.required || undefined} accept=".pdf,.png,.jpg,.jpeg" multiple onChange={e => { setDocuments(old => ({ ...old, [c.id]: Array.from(e.target.files || []) })); setKeys(null) }} /></span></label>{(documents[c.id] || []).map((file, i) => <div className="selected-document" key={`${file.name}-${i}`}><span>{file.name} · {(file.size / 1024).toFixed(0)} KB</span><button type="button" className="text-button" onClick={() => setDocuments(old => ({ ...old, [c.id]: old[c.id].filter((_, j) => i !== j) }))}>Gỡ</button></div>)}</div>)}</section>}
      {step === 4 && <section className="citizen-form-section"><h2>5. Kiểm tra hồ sơ và chọn cách nhận kết quả</h2><div className="submission-review"><h3>{procedure?.name}</h3><p>{selectedCode} · {serviceModeLabel(procedure?.level || '')}</p><dl><div><dt>Cơ quan tiếp nhận</dt><dd>{agency}</dd></div><div><dt>Người yêu cầu</dt><dd>{contact.name}</dd></div><div><dt>Liên hệ</dt><dd>{[contact.phone, contact.email].filter(Boolean).join(' · ')}</dd></div>{fields.map(f => <div key={f.id}><dt>{f.label}</dt><dd>{values[f.id] || 'Không khai'}</dd></div>)}</dl><h3>Giấy tờ gửi kèm</h3>{components.map(c => <p key={c.id}><b>{c.label}:</b> {(documents[c.id] || []).map(f => f.name).join(', ') || 'Không đính kèm'}</p>)}</div><label className="citizen-field"><span>Phương thức nhận kết quả<RequiredMark /></span><select required value={delivery} onChange={e => { setDelivery(e.target.value); setKeys(null) }}><option value="">Chọn cách nhận</option>{schema?.deliveryMethods.map(d => <option key={d}>{d}</option>)}</select><small>{schema?.deliveryNote}</small></label>{delivery === 'Bưu chính' && <label className="citizen-field"><span>Địa chỉ nhận kết quả<RequiredMark /></span><textarea required minLength={10} maxLength={500} value={deliveryAddress} onChange={e => { setDeliveryAddress(e.target.value); setKeys(null) }} /></label>}<p>{schema?.feeText}</p><label className="citizen-consent"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> Tôi đã kiểm tra tờ khai, giấy tờ và cơ quan; chịu trách nhiệm về thông tin đã khai.<RequiredMark /></label>{!hasIntake && <p className="form-error">Cơ quan chưa có tài khoản tiếp nhận còn hiệu lực. Bạn đã chuẩn bị hồ sơ nhưng chưa thể gửi; cần đơn vị quản trị cấp tài khoản tiếp nhận.</p>}<p>Gửi hồ sơ vào hàng đợi kiểm tra. Việc gửi thành công chưa phải là xác nhận đã tiếp nhận hợp lệ.</p></section>}
      {error && <div className="form-error" role="alert">{error}</div>}<div className="citizen-form-actions">{step > 0 && <button type="button" className="button secondary" disabled={busy} onClick={() => go(step - 1)}>Quay lại</button>}<button className="button primary" disabled={busy || loading || (step === 0 && (!schema || schema.sourceStatus === 'official-document-list-only' || !agency || procedure?.serviceMode === 'INFORMATION'))}>{busy ? 'Đang lưu hồ sơ…' : step === 4 ? 'Xác nhận và gửi hồ sơ' : 'Tiếp tục'}</button><span>Bước {step + 1} / 5 · {step < 4 ? 'Chưa gửi hồ sơ' : 'Chỉ gửi khi bạn xác nhận'}</span></div>
    </form>
  </section>
}
