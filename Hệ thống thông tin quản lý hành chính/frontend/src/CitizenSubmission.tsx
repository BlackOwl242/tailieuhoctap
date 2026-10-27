import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CitizenProfile } from './CitizenProfile'
import { serviceModeLabel } from './procedureLabels'
import { normalizeAgency, procedureAgencies } from './procedureAgencies'

type Condition = { field: string; equals?: string; not?: string }
export type SubmissionField = { id: string; label: string; type?: string; required?: boolean; options?: string[]; applicantTypes?: string[]; when?: Condition; maxLength?: number; min?: number; max?: number; help?: string; officialAttachmentNames?: string[]; officialAttachments?: { id: string; name: string; url: string }[]; templateSourceUrl?: string }
export type SubmissionSchema = { version: string; title: string; sourceUrl: string; formSourceUrl?: string; formSourceLabel?: string; sourceStatus?: string; declarationMode?: string; officialSteps?: { id: string; name: string; description: string }[]; conditions?: string; legalBasis: string; deadlineText: string; feeText: string; fields: SubmissionField[]; documents: SubmissionField[]; deliveryMethods: string[]; deliveryNote: string }
type Procedure = { code: string; name: string; field: string; agency: string; level: string; submissionEnabled?: boolean; submissionDisabledReason?: string; serviceMode?: string; submission?: SubmissionSchema; routing?: { officialAgencyHints?: string[]; observedAuthorities?: { authority: string }[] } }
type Receipt = { code: string; accessKey?: string; status?: string; statusLabel?: string; duplicate?: boolean }
type Request = <T>(path: string, body?: unknown) => Promise<T>
type SavedDraft = { id: string; version: number; updatedAt: string; procedureCode: string; applicantType: string; values: Record<string, string>; contact: { name: string; phone: string; email: string }; agency: string; delivery: string; deliveryAddress: string; step: number; useOwnInformation: boolean; documentExemptions: Record<string, string>; submissionKey: string; submissionToken: string }
type LibraryDocument = { id: string; code: string; name: string; size: number; downloadUrl: string }
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
  const [initialDraftId] = useState(() => new URLSearchParams(location.search).get('draft') || '')
  const [draft, setDraft] = useState<{ id: string; version: number; updatedAt: string } | null>(null)
  const [draftLoading, setDraftLoading] = useState(Boolean(initialDraftId))
  const [draftNotice, setDraftNotice] = useState('')
  const savedKeys = useRef<{ submissionKey: string; submissionToken: string } | null>(null)
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [agencies, setAgencies] = useState<string[]>([])
  const [selectedCode, setSelectedCode] = useState(initialProcedureCode)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(10)
  const [step, setStep] = useState(0)
  const defaultValues = {
    nationalityType: 'Trong nước',
    submissionRole: 'Tự nộp',
    identityType: '',
    requestType: 'Cấp mới / Đăng ký lần đầu',
    verificationMethod: 'Sử dụng văn bản điện tử / bản sao điện tử có ký số hợp lệ',
  }
  const [applicantType, setApplicantType] = useState(() => (new URLSearchParams(location.search).get('applicant') || sessionStorage.getItem('hanoiApplicantType')) === 'organization' ? 'organization' : 'citizen')
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...defaultValues, officialCase: new URLSearchParams(location.search).get('case') || '' }))
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [useOwnInformation, setUseOwnInformation] = useState(true)
  const edited = useRef({ fields: new Set<string>(), contact: new Set<string>(), delivery: false })
  const [agency, setAgency] = useState(() => new URLSearchParams(location.search).get('agency') || '')
  const [documents, setDocuments] = useState<Record<string, File[]>>({})
  const [libraryDocuments, setLibraryDocuments] = useState<LibraryDocument[]>([])
  const [libraryComponent, setLibraryComponent] = useState('')
  const [librarySelection, setLibrarySelection] = useState('')
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState('')
  const documentContext = useRef(0)
  const [documentExemptions, setDocumentExemptions] = useState<Record<string, string>>({})
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [delivery, setDelivery] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [keys, setKeys] = useState<{ submissionKey: string; submissionToken: string } | null>(null)
  useEffect(() => {
    if (!initialDraftId) return
    let active = true
    request<{ draft: SavedDraft }>(`/api/citizen/drafts/${encodeURIComponent(initialDraftId)}`).then(result => {
      if (!active) return
      const saved = result.draft
      edited.current = { fields: new Set(Object.keys(saved.values)), contact: new Set(['name', 'phone', 'email']), delivery: true }
      setDraft({ id: saved.id, version: saved.version, updatedAt: saved.updatedAt }); setSelectedCode(saved.procedureCode)
      setApplicantType(saved.applicantType); setValues(saved.values); setContact(saved.contact); setAgency(saved.agency)
      setDelivery(saved.delivery); setDeliveryAddress(saved.deliveryAddress); setUseOwnInformation(saved.useOwnInformation)
      setDocumentExemptions(saved.documentExemptions); setStep(Math.min(saved.step, 3)); setConfirmed(false)
      savedKeys.current = saved.submissionKey && saved.submissionToken ? { submissionKey: saved.submissionKey, submissionToken: saved.submissionToken } : null
      setDraftNotice('Đã mở hồ sơ nháp. Kiểm tra lại nội dung và chọn lại các tệp đính kèm trước khi gửi.')
    }).catch(reason => { if (active) setError(reason.message) }).finally(() => { if (active) setDraftLoading(false) })
    return () => { active = false }
  }, [initialDraftId, request])
  async function saveDraft() {
    if (!selectedCode) { setError('Chọn thủ tục trước khi lưu nháp.'); return }
    setBusy(true); setError(''); setDraftNotice('')
    const requestKeys = keys || savedKeys.current || { submissionKey: crypto.randomUUID(), submissionToken: secureToken() }
    try {
      const result = await request<{ draft: { id: string; version: number; updatedAt: string } }>('/api/citizen/drafts', { id: draft?.id, version: draft?.version || 0, procedureCode: selectedCode, applicantType, values, contact, agency, delivery, deliveryAddress, step, useOwnInformation, documentExemptions, ...requestKeys })
      setDraft(result.draft); savedKeys.current = requestKeys; setKeys(requestKeys)
      const params = new URLSearchParams(location.search); params.set('draft', result.draft.id); params.set('procedure', selectedCode)
      history.replaceState(history.state, '', `${location.pathname}?${params}`)
      setDraftNotice('Đã lưu nội dung tờ khai vào tài khoản. Tệp đính kèm chưa được lưu trong nháp và cần chọn lại khi mở trên lần khác.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa lưu được hồ sơ nháp. Nội dung đang nhập vẫn được giữ.') }
    finally { setBusy(false) }
  }
  async function openDocumentLibrary(componentId: string) {
    setLibraryComponent(componentId); setLibrarySelection(''); setLibraryError(''); setLibraryLoading(true)
    try { const result = await request<{ documents: LibraryDocument[] }>('/api/citizen/workspace'); setLibraryDocuments(result.documents) }
    catch (reason) { setLibraryError(reason instanceof Error ? reason.message : 'Chưa tải được tài liệu trong tài khoản.') }
    finally { setLibraryLoading(false) }
  }
  async function reuseDocument() {
    const context = documentContext.current
    const item = libraryDocuments.find(document => document.id === librarySelection)
    if (!item || !libraryComponent) return
    setLibraryLoading(true); setLibraryError('')
    try {
      if (item.size > 8 * 1024 * 1024) throw new Error('Tệp vượt giới hạn 8 MB.')
      const response = await fetch(item.downloadUrl, { credentials: 'include' })
      if (!response.ok) {
        if (response.status === 401) window.dispatchEvent(new Event('citizen-session-expired'))
        throw new Error('Không tải được tài liệu thuộc tài khoản. Hãy đăng nhập lại hoặc chọn tệp từ thiết bị.')
      }
      const blob = await response.blob()
      if (blob.size > 8 * 1024 * 1024) throw new Error('Tệp vượt giới hạn 8 MB.')
      if (context !== documentContext.current) return
      const file = new File([blob], item.name, { type: blob.type })
      setDocuments(old => ({ ...old, [libraryComponent]: [...(old[libraryComponent] || []), file] }))
      setLibraryComponent(''); setKeys(null); setConfirmed(false)
    } catch (reason) { setLibraryError(reason instanceof Error ? reason.message : 'Chưa lấy được tài liệu.') }
    finally { setLibraryLoading(false) }
  }
  useEffect(() => {
    let active = true
    request<{ profile: CitizenProfile }>('/api/citizen/profile').then(result => { if (active) setProfile(result.profile) }).catch(reason => { if (active) setProfileError(reason.message) })
    return () => { active = false }
  }, [request])
  const proxy = values.submissionRole === 'Nộp thay theo ủy quyền'
  const ownApplicant = applicantType === 'citizen' && useOwnInformation && !proxy
  useEffect(() => {
    if (!profile) return
    const personal: Record<string, string> = ownApplicant ? {
      address: profile.contactAddress, identityType: profile.identityType, identityNumber: profile.identityNumber,
      identityDate: profile.identityDate, identityPlace: profile.identityPlace,
      dateOfBirth: profile.dateOfBirth, gender: profile.gender, nationality: profile.nationality,
      nationalityType: profile.nationality === 'Việt Nam' ? 'Trong nước' : profile.nationality ? 'Cá nhân nước ngoài tại Việt Nam' : '',
      passport: profile.identityType === 'Hộ chiếu' ? profile.identityNumber : '',
      originalOwner: values.relation === 'Người được cấp bản chính' ? profile.name : '',
    } : {}
    const submitter: Record<string, string> = proxy ? {
      submitterName: profile.name, submitterIdentity: profile.identityNumber,
      submitterIdentityDate: profile.identityDate, submitterIdentityPlace: profile.identityPlace,
      submitterAddress: profile.contactAddress, submitterPhone: profile.phone, submitterEmail: profile.email,
    } : {}
    const desired: Record<string, string> = { ...personal, ...submitter }
    const reusableFields = ['address', 'identityType', 'identityNumber', 'identityDate', 'identityPlace', 'dateOfBirth', 'gender', 'nationality', 'nationalityType', 'passport', 'originalOwner', 'submitterName', 'submitterIdentity', 'submitterIdentityDate', 'submitterIdentityPlace', 'submitterAddress', 'submitterPhone', 'submitterEmail']
    setValues(old => {
      const next = { ...old }
      reusableFields.forEach(key => { if (!edited.current.fields.has(key)) next[key] = desired[key] || '' })
      return next
    })
    setContact(old => {
      const next = { ...old }
      for (const key of ['name', 'phone', 'email'] as const) if (!edited.current.contact.has(key)) next[key] = ownApplicant ? profile[key] : ''
      return next
    })
    if (!edited.current.delivery) setDeliveryAddress(ownApplicant ? profile.contactAddress : '')
    setConfirmed(false); setKeys(null)
  }, [profile, ownApplicant, proxy, values.relation, selectedCode])
  useEffect(() => {
    let active = true
    Promise.all([request<{ procedures: Procedure[] }>('/api/procedures?summary=1'), request<{ agencies: string[] }>('/api/public/agencies')])
      .then(([catalog, directory]) => { if (active) {
        setProcedures(catalog.procedures); setAgencies(directory.agencies); if (!initialDraftId) { setSelectedCode(initialProcedureCode); setStep(0) }
        const selected = catalog.procedures.find(item => item.code === initialProcedureCode)
        const allowedCases = selected?.submission?.fields.find(field => field.id === 'officialCase')?.options || []
        if (!initialDraftId) setValues(current => !current.officialCase || allowedCases.includes(current.officialCase) ? current : { ...current, officialCase: '' })
        const allowedAgencies = selected ? procedureAgencies(selected, directory.agencies) : []
        if (!initialDraftId) setAgency(current => allowedAgencies.some(candidate => normalizeAgency(candidate) === normalizeAgency(current)) ? current : '')
      } })
      .catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [initialProcedureCode, request])
  useEffect(() => {
    let active = true
    setSelectedProcedure(null)
    if (!selectedCode) { setSchemaLoading(false); return () => { active = false } }
    setSchemaLoading(true)
    request<{ procedure: Procedure }>(`/api/procedures/${encodeURIComponent(selectedCode)}/detail`).then(result => {
      if (active) setSelectedProcedure(result.procedure)
    }).catch(reason => { if (active) setError(reason.message) }).finally(() => { if (active) setSchemaLoading(false) })
    return () => { active = false }
  }, [selectedCode, request])
  const procedure = selectedProcedure
  const schema = procedure?.submission
  const observed = procedure?.routing?.observedAuthorities || []
  const matchingAgencies = procedure ? procedureAgencies(procedure, agencies) : []
  useEffect(() => {
    if (!procedure || agency) return
    if (matchingAgencies.length === 1) {
      setAgency(matchingAgencies[0])
      setValues(old => ({ ...old, registerAuthority: matchingAgencies[0] }))
    } else if (observed.length === 1 && matchingAgencies.includes(observed[0].authority)) {
      setAgency(observed[0].authority)
      setValues(old => ({ ...old, registerAuthority: observed[0].authority }))
    }
  }, [procedure, matchingAgencies, observed, agency])
  const hasIntake = Boolean(agency) && agencies.some(a => normalizeAgency(a) === normalizeAgency(agency))
  const fields = schema?.fields.filter(f => visibleFormItem(f, applicantType, values)) || []
  const components = schema?.documents.filter(f => visibleFormItem(f, applicantType, values)) || []
  const files = components.flatMap(c => (documents[c.id] || []).map(file => ({ file, componentId: c.id })))
  const submittableProcedures = procedures.filter(p => p.submissionEnabled === true)
  const results = !query.trim() ? submittableProcedures : submittableProcedures.filter(p => `${p.code} ${p.name} ${p.field} ${p.agency}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))
  function changeProcedure(code: string) {
    documentContext.current++; setLibraryComponent('')
    edited.current.fields.clear()
    setSelectedCode(code); setStep(0); setAgency(''); setValues(defaultValues); setDocuments({}); setDocumentExemptions({}); setDelivery(''); setConfirmed(false); setKeys(null); setError('')
    const params = new URLSearchParams(location.search); if (code) params.set('procedure', code); else params.delete('procedure')
    history.replaceState(history.state, '', `${location.pathname}${params.size ? '?' + params : ''}`)
  }
  function chooseApplicant(type: string) { documentContext.current++; setLibraryComponent(''); edited.current = { fields: new Set(), contact: new Set(), delivery: false }; setContact({ name: '', phone: '', email: '' }); setValues(defaultValues); setDocuments({}); setDocumentExemptions({}); setDelivery(''); setDeliveryAddress(''); setApplicantType(type); sessionStorage.setItem('hanoiApplicantType', type); setConfirmed(false); setKeys(null) }
  function changeValue(id: string, value: string) { edited.current.fields.add(id); setValues(old => ({ ...old, [id]: value })); setConfirmed(false); setKeys(null) }
  function changeContact(id: 'name' | 'phone' | 'email', value: string) { edited.current.contact.add(id); setContact(old => ({ ...old, [id]: value })); setConfirmed(false); setKeys(null) }
  function validateStage(index: number) {
    if (index === 0 && schemaLoading) return 'Đang tải biểu mẫu của thủ tục…'
    if (index === 0 && procedure?.serviceMode === 'INFORMATION') return 'Thủ tục này thuộc mức Cung cấp thông tin, thực hiện nộp trực tiếp tại Bộ phận Một cửa.'
    if (index === 0 && procedure?.submissionEnabled !== true) return procedure?.submissionDisabledReason || 'Thủ tục chưa có tờ khai và quy trình đã đối chiếu.'
    if (index === 0 && !schema) return 'Thủ tục này chưa có biểu mẫu trực tuyến. Vui lòng chọn thủ tục mức Toàn trình hoặc Một phần.'
    if (index === 0 && schema?.sourceStatus === 'official-document-list-only') return 'Nguồn công khai mới xác nhận thành phần hồ sơ, chưa có cấu trúc tờ khai điện tử.'
    if (index === 0 && !agency) return 'Chọn đúng cơ quan tiếp nhận. Nếu danh sách trống, đơn vị quản trị cần cấp tài khoản tiếp nhận cho cơ quan.'
    if (index === 1 && contact.name.trim().length < 2) return 'Nhập tên người nộp hoặc tổ chức.'
    if (index === 1 && contact.phone && !/^[+0-9(). -]{8,40}$/.test(contact.phone)) return 'Số điện thoại không hợp lệ.'
    if (index === 1 && !contact.phone.trim() && !contact.email.trim()) return 'Cần số điện thoại hoặc email để cơ quan liên hệ.'
    if (index === 2) { const missing = fields.find(f => f.required && !values[f.id]?.trim()); if (missing) return `Cần khai: ${missing.label}.` }
    if (index === 3) {
      const missing = components.find(c => c.required && !documents[c.id]?.length); if (missing) return `Thiếu: ${missing.label}.`
      if (schema?.declarationMode === 'OFFICIAL_ATTACHMENTS') {
        const unexplained = components.find(c => !documents[c.id]?.length && (documentExemptions[c.id] || '').trim().length < 12)
        if (unexplained) return `Đính kèm hoặc ghi căn cứ không phải nộp: ${unexplained.label}.`
      }
      if (files.length > 32 || files.some(f => f.file.size > 8 * 1024 * 1024) || files.reduce((n, f) => n + f.file.size, 0) > 32 * 1024 * 1024) return 'Tối đa 32 tệp; mỗi tệp 8 MB; tổng dung lượng 32 MB.'
    }
    if (index === 4 && !delivery) return 'Chọn phương thức nhận kết quả.'
    if (index === 4 && delivery === 'Bưu chính' && deliveryAddress.trim().length < 10) return 'Nhập đầy đủ địa chỉ nhận qua bưu chính.'
    if (index === 4 && !confirmed) return 'Cần xác nhận đã kiểm tra hồ sơ.'
    if (index === 4 && !hasIntake) return 'Cơ quan chưa có cán bộ tiếp nhận còn hiệu lực. Hồ sơ chưa được gửi; liên hệ quản trị viên để cấp tài khoản tiếp nhận.'
    return ''
  }
  function go(index: number) { setStep(index); setError(''); setConfirmed(false); setKeys(null); document.querySelector('.submission-wizard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  async function proceed(event: FormEvent<HTMLFormElement>) {
    if (draftLoading) { event.preventDefault(); return }
    event.preventDefault(); const stageError = validateStage(step)
    if (stageError) { setError(stageError); return }
    if (step < 4) { go(step + 1); return }
    for (let index = 0; index < 4; index++) { const issue = validateStage(index); if (issue) { go(index); setError(issue); return } }
    const requestKeys = keys || savedKeys.current || { submissionKey: crypto.randomUUID(), submissionToken: secureToken() }
    setKeys(requestKeys); setBusy(true); setError('')
    try {
      const declaration = Object.fromEntries(fields.map(f => [f.id, values[f.id] || '']))
      const summary = selectedCode === '1.004237'
        ? `${values.dataRequested || ''}. Mục đích: ${values.purpose || ''}`
        : selectedCode === '2.000908'
          ? `Đề nghị cấp ${values.copies || 1} bản sao ${values.documentName || ''} cho ${values.originalOwner || contact.name}.`
          : values.requestContent
            ? `${values.requestContent}${values.relatedDocumentsInfo ? ` (${values.relatedDocumentsInfo})` : ''}`
            : fields.map(f => values[f.id] ? `${f.label}: ${values[f.id]}` : '').filter(Boolean).slice(0, 4).join('; ') || `Nộp hồ sơ ${procedure?.name || selectedCode}`
      onSubmitted(await request<Receipt>('/api/cases', { ...requestKeys, draftId: draft?.id, draftVersion: draft?.version, procedureCode: selectedCode, schemaVersion: schema!.version, applicantType, applicant: contact, receivingAgency: agency, declaration, documentExemptions: Object.fromEntries(components.filter(c => !documents[c.id]?.length).map(c => [c.id, documentExemptions[c.id] || ''])), requestSummary: summary.slice(0, 3000), deliveryMethod: delivery, deliveryAddress, confirmed: true, files: await Promise.all(files.map(f => encode(f.file, f.componentId))) }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Không gửi được hồ sơ. Thông tin đang nhập vẫn được giữ để thử lại.') } finally { setBusy(false) }
  }
  return <section className="citizen-form-page submission-wizard">
    <div className="citizen-page-heading"><span className="eyebrow">NỘP HỒ SƠ TRỰC TUYẾN</span><h1>Lập hồ sơ mới</h1><p>Chọn thủ tục, khai đúng trường hợp và kiểm tra giấy tờ trước khi gửi. Hồ sơ chỉ được tạo sau bước cuối.</p></div>
    <div className="profile-reuse"><p>{profile ? 'Thông tin đã lưu được dùng để điền sẵn khi bạn tự nộp hồ sơ.' : profileError ? 'Chưa tải được thông tin cá nhân. Bạn có thể tự điền các trường bên dưới.' : 'Đang tải thông tin cá nhân để điền sẵn…'}</p><a href="/tai-khoan/thong-tin-ca-nhan">Xem, cập nhật thông tin cá nhân</a></div>
    <div className="profile-reuse"><button type="button" className="button secondary" disabled={busy || draftLoading || !selectedCode} onClick={saveDraft}>Lưu nháp vào tài khoản</button><a href="/tai-khoan/ho-so-nhap">Hồ sơ nháp của tôi</a>{draftLoading && <span role="status">Đang mở hồ sơ nháp…</span>}</div>
    {draftNotice && <p className="citizen-success" role="status">{draftNotice}</p>}
    <ol className="submission-steps" aria-label="Các bước lập hồ sơ">{titles.map((title, i) => <li key={title} aria-current={step === i ? 'step' : undefined} className={i === step ? 'current' : i < step ? 'completed' : ''}><span>{i + 1}</span>{i < step ? <button type="button" disabled={busy} onClick={() => go(i)}>{title}</button> : <b>{title}</b>}</li>)}</ol>
    <p className="required-field-note">Dấu sao màu đỏ (<RequiredMark />) ở cuối nhãn cho biết thông tin cần điền.</p>
    <form className="citizen-application-form" onSubmit={proceed}>
      {step === 0 && <section className="citizen-form-section"><h2>1. Chọn thủ tục và cơ quan</h2><label className="citizen-field">Tìm theo mã, tên, lĩnh vực hoặc cơ quan<input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(10) }} placeholder="Nhập mã thủ tục, tên thủ tục hoặc tên Sở/ngành" /></label>
        {!procedure && <div className="procedure-choice-list">{loading ? <p>Đang tải danh mục…</p> : <>{results.slice(0, limit).map(p => <button type="button" key={p.code} onClick={() => changeProcedure(p.code)}><span><b>{p.name}</b><small>{p.code} · {p.agency} · {serviceModeLabel(p.level)}</small></span><i>Chọn</i></button>)}{results.length > limit && <button type="button" onClick={() => setLimit(n => n + 10)}>Xem thêm ({results.length - limit} thủ tục)</button>}{!results.length && <p>{initialProcedureCode && !procedures.some(p => p.code === initialProcedureCode) ? 'Mã thủ tục trong đường dẫn không có trong danh mục. Hãy chọn lại.' : 'Không tìm thấy thủ tục phù hợp với từ khóa.'}</p>}</>}</div>}
        {procedure && <><div className="selected-procedure"><div><small>{procedure.code} · {procedure.field}</small><b>{procedure.name}</b><span>{serviceModeLabel(procedure.level)}</span></div><button type="button" className="text-button" onClick={() => changeProcedure('')}>Đổi thủ tục</button></div>
          <div className="citizen-source-note"><b>Mức dịch vụ theo danh mục công bố</b><span>{procedure.level === 'Toàn trình' ? 'Toàn trình: các bước có thể thực hiện trực tuyến theo quy trình công bố, gồm thanh toán nếu có và trả kết quả điện tử hoặc bưu chính.' : procedure.level === 'Một phần' ? 'Một phần: có thể nộp và theo dõi trực tuyến; một hoặc nhiều khâu cần thực hiện theo yêu cầu riêng của thủ tục.' : 'Chỉ cung cấp thông tin: thủ tục chỉ tra cứu thông tin và nộp trực tiếp tại Bộ phận Một cửa.'}</span></div>
          {schema ? <><p><b>Biểu mẫu:</b> {schema.title}</p><p>{schema.deadlineText}</p><p>{schema.feeText}</p><a href={`/thu-tuc/${encodeURIComponent(procedure.code)}`}>Xem chi tiết thủ tục, thành phần hồ sơ và mẫu đơn</a></> : <p className="citizen-source-note">Thủ tục thuộc mức <b>Cung cấp thông tin</b>: công dân tra cứu quy trình tại Danh mục thủ tục hoặc đặt lịch hẹn để nộp trực tiếp tại Bộ phận Một cửa.</p>}
          <label className="citizen-field">Tỉnh, thành phố<input value="Thành phố Hà Nội" readOnly /></label><label className="citizen-field"><span>Cơ quan tiếp nhận<RequiredMark /></span><select required value={agency} onChange={e => { setAgency(e.target.value); setValues(old => ({ ...old, registerAuthority: e.target.value })) }} disabled={!matchingAgencies.length}><option value="">{matchingAgencies.length ? 'Chọn cơ quan tiếp nhận' : 'Chưa có cơ quan tiếp nhận đang hoạt động'}</option>{matchingAgencies.map(a => <option key={a}>{a}</option>)}</select><small>Chọn cơ quan thuộc tuyến của thủ tục. Việc gửi cần cán bộ tiếp nhận còn hiệu lực tại cơ quan đó. Với cấp bản sao, phải là cơ quan đang lưu sổ gốc.</small></label>{(!agency || !hasIntake) && <p className="citizen-source-note">Hãy chọn cơ quan tiếp nhận để chuẩn bị hồ sơ theo biểu mẫu chính thức.</p>}</>}
      </section>}
      {step === 1 && <section className="citizen-form-section"><h2>2. Người yêu cầu giải quyết</h2><div className="citizen-applicant-type"><label><input type="radio" checked={applicantType === 'citizen'} onChange={() => chooseApplicant('citizen')} /> Cá nhân</label><label><input type="radio" checked={applicantType === 'organization'} onChange={() => chooseApplicant('organization')} /> Tổ chức</label></div><div className="profile-reuse">{applicantType === 'citizen' && <label><input type="checkbox" checked={useOwnInformation && !proxy} disabled={proxy || !profile} onChange={e => { setUseOwnInformation(e.target.checked); setConfirmed(false); setKeys(null) }} />Tôi là người yêu cầu, dùng thông tin cá nhân đã lưu</label>}<p>{proxy ? 'Bạn đang nộp thay. Khai thông tin người yêu cầu ở đây; thông tin tài khoản chỉ điền vào phần người nộp thay.' : applicantType === 'organization' ? 'Khai tên và thông tin liên hệ của tổ chức; hệ thống không dùng thông tin cá nhân làm thông tin tổ chức.' : 'Thông tin điền sẵn vẫn có thể sửa riêng cho hồ sơ này.'}</p></div><div className="citizen-form-grid"><label className="citizen-field"><span>{applicantType === 'citizen' ? 'Họ và tên người yêu cầu' : 'Tên tổ chức yêu cầu'}<RequiredMark /></span><input value={contact.name} onChange={e => changeContact('name', e.target.value)} minLength={2} maxLength={150} required autoComplete="name" /></label><p id="contact-requirement" className="contact-requirement">Số điện thoại hoặc email<RequiredMark /><small>Điền ít nhất một trong hai để cơ quan liên hệ khi xử lý hồ sơ.</small></p><label className="citizen-field">Số điện thoại<input type="tel" value={contact.phone} onChange={e => changeContact('phone', e.target.value)} maxLength={40} autoComplete="tel" aria-describedby="contact-requirement" /></label><label className="citizen-field">Email<input type="email" value={contact.email} onChange={e => changeContact('email', e.target.value)} maxLength={254} autoComplete="email" aria-describedby="contact-requirement" /></label></div><p>Các thông tin của thủ tục được khai ở bước tiếp theo.</p></section>}
      {step === 2 && <section className="citizen-form-section"><h2>3. {schema?.title}</h2>{proxy && <p>Bạn đang nộp thay theo ủy quyền. <button type="button" className="text-button" onClick={() => go(1)}>Kiểm tra tên và liên hệ của người yêu cầu ở bước 2</button>. Thông tin tài khoản chỉ dùng cho phần người nộp thay dưới đây.</p>}<p>{schema?.legalBasis}</p>{schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' && <p>Tải biểu mẫu gốc ở bước Thành phần hồ sơ, điền đầy đủ, ký theo yêu cầu và đính kèm bản đã hoàn thiện. Nội dung bên dưới giúp cơ quan xác định yêu cầu của hồ sơ.</p>}<div className="citizen-form-grid">{fields.map(f => <label className={`citizen-field${f.type === 'textarea' || f.id === 'submissionRole' || f.id === 'verificationMethod' ? ' field-wide' : ''}`} key={f.id}><span>{f.label}{f.required && <RequiredMark />}</span>{f.type === 'select' ? <select required={f.required} value={values[f.id] || ''} onChange={e => changeValue(f.id, e.target.value)}><option value="">Chọn…</option>{f.options?.map(option => <option key={option}>{option}</option>)}</select> : f.type === 'textarea' ? <textarea rows={4} required={f.required} maxLength={f.maxLength || 500} value={values[f.id] || ''} onChange={e => changeValue(f.id, e.target.value)} /> : <input type={f.type || 'text'} readOnly={f.id === 'registerAuthority'} required={f.required} min={f.min} max={f.max} maxLength={f.maxLength || 500} value={values[f.id] || ''} onChange={e => changeValue(f.id, e.target.value)} />}{f.help && <small>{f.help}</small>}</label>)}</div></section>}
      {step === 3 && <section className="citizen-form-section"><h2>4. Thành phần hồ sơ</h2><p>Đính kèm theo từng loại giấy tờ. PDF, Word (DOC, DOCX), PNG, JPG, JPEG; tối đa 32 tệp, mỗi tệp 8 MB, tổng 32 MB.</p>{schema?.formSourceUrl && <p><a href={schema.formSourceUrl} target="_blank" rel="noreferrer">{schema.formSourceLabel || 'Xem thành phần hồ sơ và biểu mẫu trên nguồn chính thức ↗'}</a></p>}{components.map(c => <div className="document-component" key={c.id}><label className="citizen-field"><b>{c.label}{c.required && <RequiredMark />}</b>{c.help && <small>{c.help}</small>}{c.officialAttachmentNames?.length ? <small>Mẫu được nguồn chính thức liệt kê: {c.officialAttachmentNames.join('; ')}. Mở trang thủ tục chính thức ở trên để xem hoặc tải nếu được cung cấp.</small> : null}<span className="file-picker-control">Chọn tệp đính kèm<input type="file" aria-required={c.required || undefined} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" multiple onChange={e => { setDocuments(old => ({ ...old, [c.id]: Array.from(e.target.files || []) })); setKeys(null) }} /></span></label>{c.officialAttachments?.map(attachment => <p key={attachment.id}><a className="text-link" href={attachment.url} target="_blank" rel="noreferrer">Tải {attachment.name}</a></p>)}<button type="button" className="text-button" disabled={libraryLoading} onClick={() => openDocumentLibrary(c.id)}>Chọn từ tài liệu đã nộp</button>{libraryComponent === c.id && <div className="profile-reuse"><p>Chọn đúng giấy tờ còn giá trị sử dụng cho thành phần này. Việc dùng lại không thay thế kiểm tra của cơ quan.</p>{libraryLoading ? <span role="status">Đang tải tài liệu…</span> : libraryDocuments.length ? <><label className="citizen-field">Tài liệu trong tài khoản<select value={librarySelection} onChange={event => setLibrarySelection(event.target.value)}><option value="">Chọn tài liệu</option>{libraryDocuments.map(item => <option value={item.id} key={item.id}>{item.name} · {item.code}</option>)}</select></label><button type="button" className="button secondary" disabled={!librarySelection} onClick={reuseDocument}>Dùng tài liệu này</button></> : <p>Chưa có tài liệu trong tài khoản.</p>}{libraryError && <p role="alert" className="form-error">{libraryError}</p>}<button type="button" className="text-button" disabled={libraryLoading} onClick={() => setLibraryComponent('')}>Đóng</button></div>}{(documents[c.id] || []).map((file, i) => <div className="selected-document" key={`${file.name}-${i}`}><span>{file.name} · {(file.size / 1024).toFixed(0)} KB</span><button type="button" className="text-button" onClick={() => setDocuments(old => ({ ...old, [c.id]: old[c.id].filter((_, j) => i !== j) }))}>Gỡ</button></div>)}{schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' && !documents[c.id]?.length && <label className="citizen-field">Căn cứ không phải nộp / cơ quan khai thác dữ liệu<textarea rows={2} minLength={12} maxLength={1200} value={documentExemptions[c.id] || ''} onChange={event => { setDocumentExemptions(old => ({ ...old, [c.id]: event.target.value })); setKeys(null) }} placeholder="Ghi rõ trường hợp không áp dụng hoặc nguồn dữ liệu cơ quan được khai thác." /></label>}</div>)}</section>}
      {step === 4 && <section className="citizen-form-section"><h2>5. Kiểm tra hồ sơ và chọn cách nhận kết quả</h2><div className="submission-review"><h3>{procedure?.name}</h3><p>{selectedCode} · {serviceModeLabel(procedure?.level || '')}</p><dl><div><dt>Cơ quan tiếp nhận</dt><dd>{agency}</dd></div><div><dt>Người yêu cầu</dt><dd>{contact.name}</dd></div><div><dt>Liên hệ</dt><dd>{[contact.phone, contact.email].filter(Boolean).join(' · ')}</dd></div>{fields.map(f => <div key={f.id}><dt>{f.label}</dt><dd>{values[f.id] || 'Không khai'}</dd></div>)}</dl><h3>Giấy tờ gửi kèm</h3>{components.map(c => <p key={c.id}><b>{c.label}:</b> {(documents[c.id] || []).map(f => f.name).join(', ') || documentExemptions[c.id] || 'Không đính kèm'}</p>)}</div><label className="citizen-field"><span>Phương thức nhận kết quả<RequiredMark /></span><select required value={delivery} onChange={e => { setDelivery(e.target.value); setKeys(null) }}><option value="">Chọn cách nhận</option>{schema?.deliveryMethods.map(d => <option key={d}>{d}</option>)}</select><small>{schema?.deliveryNote}</small></label>{delivery === 'Bưu chính' && <label className="citizen-field"><span>Địa chỉ nhận kết quả<RequiredMark /></span><textarea required minLength={10} maxLength={500} value={deliveryAddress} onChange={e => { edited.current.delivery = true; setDeliveryAddress(e.target.value); setConfirmed(false); setKeys(null) }} /></label>}<p>{schema?.feeText}</p><label className="citizen-consent"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> Tôi đã kiểm tra tờ khai, giấy tờ và cơ quan; chịu trách nhiệm về thông tin đã khai.<RequiredMark /></label>{!hasIntake && <p className="form-error">Cơ quan chưa có tài khoản tiếp nhận còn hiệu lực. Bạn đã chuẩn bị hồ sơ nhưng chưa thể gửi; cần đơn vị quản trị cấp tài khoản tiếp nhận.</p>}<p>Gửi hồ sơ vào hàng đợi kiểm tra. Việc gửi thành công chưa phải là xác nhận đã tiếp nhận hợp lệ.</p></section>}
      {error && <div className="form-error" role="alert">{error}</div>}<div className="citizen-form-actions">{step > 0 && <button type="button" className="button secondary" disabled={busy} onClick={() => go(step - 1)}>Quay lại</button>}<button className="button primary" disabled={busy || loading || schemaLoading || (step === 0 && (!schema || schema.sourceStatus === 'official-document-list-only' || !agency || procedure?.serviceMode === 'INFORMATION'))}>{busy ? 'Đang lưu hồ sơ…' : step === 4 ? 'Xác nhận và gửi hồ sơ' : 'Tiếp tục'}</button><span>Bước {step + 1} / 5 · {step < 4 ? 'Chưa gửi hồ sơ' : 'Chỉ gửi khi bạn xác nhận'}</span></div>
    </form>
  </section>
}
