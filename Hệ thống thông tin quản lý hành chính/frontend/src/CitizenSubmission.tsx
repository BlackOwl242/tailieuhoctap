import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { serviceModeLabel } from './procedureLabels'
import { normalizeAgency, procedureAgencies } from './procedureAgencies'
import {
  CITIZEN_UPLOAD_LIMIT_TEXT,
  CITIZEN_UPLOAD_MAX_FILES,
  CITIZEN_UPLOAD_MAX_FILE_BYTES,
  CITIZEN_UPLOAD_MAX_TOTAL_BYTES,
  type ApiRequest,
  type CitizenProfile,
  type Procedure,
  type SubmissionField,
  type SubmissionReceipt,
  type SubmissionSchema,
} from './types'

export type { SubmissionField, SubmissionSchema }

type SavedDraft = {
  id: string
  version: number
  updatedAt: string
  procedureCode: string
  applicantType: string
  values: Record<string, string>
  contact: { name: string; phone: string; email: string }
  agency: string
  delivery: string
  deliveryAddress: string
  step: number
  useOwnInformation: boolean
  documentExemptions: Record<string, string>
  submissionKey: string
  submissionToken: string
}

type LibraryDocument = {
  id: string
  code: string
  name: string
  size: number
  downloadUrl: string
}

const STEP_TITLES = [
  'Thủ tục và cơ quan',
  'Người yêu cầu',
  'Tờ khai',
  'Thành phần hồ sơ',
  'Kiểm tra và gửi',
]

const DEFAULT_VALUES: Record<string, string> = {
  nationalityType: 'Trong nước',
  submissionRole: 'Tự nộp',
  identityType: '',
  requestType: 'Cấp mới / Đăng ký lần đầu',
  verificationMethod: 'Sử dụng văn bản điện tử / bản sao điện tử có ký số hợp lệ',
}

const REUSABLE_PROFILE_FIELDS = [
  'address',
  'identityType',
  'identityNumber',
  'identityDate',
  'identityPlace',
  'dateOfBirth',
  'gender',
  'nationality',
  'nationalityType',
  'passport',
  'originalOwner',
  'submitterName',
  'submitterIdentity',
  'submitterIdentityDate',
  'submitterIdentityPlace',
  'submitterAddress',
  'submitterPhone',
  'submitterEmail',
] as const

function visibleFormItem(
  item: SubmissionField,
  applicantType: string,
  values: Record<string, string>,
): boolean {
  if (item.applicantTypes && !item.applicantTypes.includes(applicantType)) return false
  const condition = item.when
  if (!condition) return true
  const value = values[condition.field] || ''
  return (
    (condition.equals === undefined || value === condition.equals) &&
    (condition.not === undefined || value !== condition.not)
  )
}

function RequiredMark() {
  return <span className="required-mark">*</span>
}

function createSubmissionKeys() {
  return {
    submissionKey: crypto.randomUUID(),
    submissionToken: crypto.randomUUID(),
  }
}

async function encodeAttachment(file: File, componentId: string) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return { name: file.name, type: file.type, data: btoa(binary), componentId }
}

function isAbortError(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === 'AbortError'
}

export function CitizenApplicationForm({
  initialProcedureCode,
  onSubmitted,
  request,
}: {
  initialProcedureCode: string
  onSubmitted: (receipt: SubmissionReceipt) => void
  request: ApiRequest
}) {
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

  const [applicantType, setApplicantType] = useState(() =>
    (new URLSearchParams(location.search).get('applicant') ||
      sessionStorage.getItem('hanoiApplicantType')) === 'organization'
      ? 'organization'
      : 'citizen',
  )
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...DEFAULT_VALUES,
    officialCase: new URLSearchParams(location.search).get('case') || '',
  }))
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [profileError, setProfileError] = useState('')
  const [useOwnInformation, setUseOwnInformation] = useState(true)
  const edited = useRef({
    fields: new Set<string>(),
    contact: new Set<string>(),
    delivery: false,
  })

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
  const [schemaLoading, setSchemaLoading] = useState(Boolean(initialProcedureCode))
  const [delivery, setDelivery] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [keys, setKeys] = useState<{ submissionKey: string; submissionToken: string } | null>(null)

  const syncProfileDefaults = useCallback(
    (
      prof: CitizenProfile | null,
      nextApplicantType: string,
      nextUseOwn: boolean,
      baseValues: Record<string, string>,
    ) => {
      if (!prof) return baseValues
      const isProxy = baseValues.submissionRole === 'Nộp thay theo ủy quyền'
      const isOwnApplicant = nextApplicantType === 'citizen' && nextUseOwn && !isProxy
      const personal: Record<string, string> = isOwnApplicant
        ? {
            address: prof.contactAddress,
            identityType: prof.identityType,
            identityNumber: prof.identityNumber,
            identityDate: prof.identityDate,
            identityPlace: prof.identityPlace,
            dateOfBirth: prof.dateOfBirth,
            gender: prof.gender,
            nationality: prof.nationality,
            nationalityType:
              prof.nationality === 'Việt Nam'
                ? 'Trong nước'
                : prof.nationality
                  ? 'Cá nhân nước ngoài tại Việt Nam'
                  : '',
            passport: prof.identityType === 'Hộ chiếu' ? prof.identityNumber : '',
            originalOwner: baseValues.relation === 'Người được cấp bản chính' ? prof.name : '',
          }
        : {}
      const submitter: Record<string, string> = isProxy
        ? {
            submitterName: prof.name,
            submitterIdentity: prof.identityNumber,
            submitterIdentityDate: prof.identityDate,
            submitterIdentityPlace: prof.identityPlace,
            submitterAddress: prof.contactAddress,
            submitterPhone: prof.phone,
            submitterEmail: prof.email,
          }
        : {}
      const desired: Record<string, string> = { ...personal, ...submitter }
      const nextValues = { ...baseValues }
      for (const key of REUSABLE_PROFILE_FIELDS) {
        if (!edited.current.fields.has(key)) nextValues[key] = desired[key] || ''
      }
      setContact(old => {
        const next = { ...old }
        for (const key of ['name', 'phone', 'email'] as const) {
          if (!edited.current.contact.has(key)) {
            next[key] = isOwnApplicant ? prof[key] : ''
          }
        }
        return next
      })
      if (!edited.current.delivery) {
        setDeliveryAddress(isOwnApplicant ? prof.contactAddress : '')
      }
      return nextValues
    },
    [],
  )

  useEffect(() => {
    if (!initialDraftId) return
    const controller = new AbortController()
    request<{ draft: SavedDraft }>(
      `/api/citizen/drafts/${encodeURIComponent(initialDraftId)}`,
      undefined,
      controller.signal,
    )
      .then(result => {
        if (controller.signal.aborted) return
        const saved = result.draft
        edited.current = {
          fields: new Set(Object.keys(saved.values)),
          contact: new Set(['name', 'phone', 'email']),
          delivery: true,
        }
        setDraft({ id: saved.id, version: saved.version, updatedAt: saved.updatedAt })
        setSelectedCode(saved.procedureCode)
        setSchemaLoading(Boolean(saved.procedureCode))
        setApplicantType(saved.applicantType)
        setValues(saved.values)
        setContact(saved.contact)
        setAgency(saved.agency)
        setDelivery(saved.delivery)
        setDeliveryAddress(saved.deliveryAddress)
        setUseOwnInformation(saved.useOwnInformation)
        setDocumentExemptions(saved.documentExemptions)
        setStep(Math.min(saved.step, 3))
        setConfirmed(false)
        savedKeys.current =
          saved.submissionKey && saved.submissionToken
            ? { submissionKey: saved.submissionKey, submissionToken: saved.submissionToken }
            : null
        setDraftNotice(
          'Đã mở hồ sơ nháp. Kiểm tra lại nội dung và chọn lại các tệp đính kèm trước khi gửi.',
        )
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setError(reason instanceof Error ? reason.message : 'Chưa mở được hồ sơ nháp.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setDraftLoading(false)
      })
    return () => controller.abort()
  }, [initialDraftId, request])

  useEffect(() => {
    const controller = new AbortController()
    request<{ profile: CitizenProfile }>('/api/citizen/profile', undefined, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return
        setProfile(result.profile)
        setValues(current =>
          syncProfileDefaults(result.profile, applicantType, useOwnInformation, current),
        )
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setProfileError(reason instanceof Error ? reason.message : 'Chưa tải được thông tin cá nhân.')
      })
    return () => controller.abort()
  }, [applicantType, request, syncProfileDefaults, useOwnInformation])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      request<{ procedures: Procedure[] }>('/api/procedures?summary=1', undefined, controller.signal),
      request<{ agencies: string[] }>('/api/public/agencies', undefined, controller.signal),
    ])
      .then(([catalog, directory]) => {
        if (controller.signal.aborted) return
        setProcedures(catalog.procedures)
        setAgencies(directory.agencies)
        if (!initialDraftId) {
          setSelectedCode(initialProcedureCode)
          setSchemaLoading(Boolean(initialProcedureCode))
          setStep(0)
          const selected = catalog.procedures.find(item => item.code === initialProcedureCode)
          const allowedCases =
            selected?.submission?.fields.find(field => field.id === 'officialCase')?.options || []
          setValues(current =>
            !current.officialCase || allowedCases.includes(current.officialCase)
              ? current
              : { ...current, officialCase: '' },
          )
          const allowedAgencies = selected ? procedureAgencies(selected, directory.agencies) : []
          setAgency(current =>
            allowedAgencies.some(candidate => normalizeAgency(candidate) === normalizeAgency(current))
              ? current
              : '',
          )
        }
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setError(reason instanceof Error ? reason.message : 'Không tải được danh mục.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [initialDraftId, initialProcedureCode, request])

  useEffect(() => {
    if (!selectedCode) return
    const controller = new AbortController()
    request<{ procedure: Procedure }>(
      `/api/procedures/${encodeURIComponent(selectedCode)}/detail`,
      undefined,
      controller.signal,
    )
      .then(result => {
        if (!controller.signal.aborted) setSelectedProcedure(result.procedure)
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setError(reason instanceof Error ? reason.message : 'Không tải được biểu mẫu thủ tục.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setSchemaLoading(false)
      })
    return () => controller.abort()
  }, [selectedCode, request])

  const procedure = selectedCode ? selectedProcedure : null
  const schema = procedure?.submission
  const matchingAgencies = useMemo(
    () => (procedure ? procedureAgencies(procedure, agencies) : []),
    [procedure, agencies],
  )
  const autoSelectedAgency = useMemo(() => {
    if (!procedure) return ''
    if (matchingAgencies.length === 1) return matchingAgencies[0]
    const observed = procedure.routing?.observedAuthorities || []
    if (observed.length === 1 && matchingAgencies.includes(observed[0].authority)) {
      return observed[0].authority
    }
    return ''
  }, [procedure, matchingAgencies])

  const effectiveAgency = agency || autoSelectedAgency
  const effectiveValues = useMemo(
    (): Record<string, string> => ({
      ...values,
      registerAuthority: values.registerAuthority || effectiveAgency,
    }),
    [values, effectiveAgency],
  )

  const proxy = effectiveValues.submissionRole === 'Nộp thay theo ủy quyền'
  const hasIntake =
    Boolean(effectiveAgency) &&
    agencies.some(item => normalizeAgency(item) === normalizeAgency(effectiveAgency))
  const fields =
    schema?.fields.filter(field => visibleFormItem(field, applicantType, effectiveValues)) || []
  const components =
    schema?.documents.filter(doc => visibleFormItem(doc, applicantType, effectiveValues)) || []
  const files = components.flatMap(component =>
    (documents[component.id] || []).map(file => ({ file, componentId: component.id })),
  )
  const submittableProcedures = procedures.filter(item => item.submissionEnabled === true)
  const results = !query.trim()
    ? submittableProcedures
    : submittableProcedures.filter(item =>
        `${item.code} ${item.name} ${item.field} ${item.agency}`
          .toLocaleLowerCase('vi')
          .includes(query.trim().toLocaleLowerCase('vi')),
      )

  async function saveDraft() {
    if (!selectedCode) {
      setError('Chọn thủ tục trước khi lưu nháp.')
      return
    }
    setBusy(true)
    setError('')
    setDraftNotice('')
    const requestKeys = keys || savedKeys.current || createSubmissionKeys()
    try {
      const result = await request<{ draft: { id: string; version: number; updatedAt: string } }>(
        '/api/citizen/drafts',
        {
          id: draft?.id,
          version: draft?.version || 0,
          procedureCode: selectedCode,
          applicantType,
          values: effectiveValues,
          contact,
          agency: effectiveAgency,
          delivery,
          deliveryAddress,
          step,
          useOwnInformation,
          documentExemptions,
          ...requestKeys,
        },
      )
      setDraft(result.draft)
      savedKeys.current = requestKeys
      setKeys(requestKeys)
      const params = new URLSearchParams(location.search)
      params.set('draft', result.draft.id)
      params.set('procedure', selectedCode)
      history.replaceState(history.state, '', `${location.pathname}?${params}`)
      setDraftNotice(
        'Đã lưu nội dung tờ khai vào tài khoản. Tệp đính kèm chưa được lưu trong nháp và cần chọn lại khi mở trên lần khác.',
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Chưa lưu được hồ sơ nháp. Nội dung đang nhập vẫn được giữ.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function openDocumentLibrary(componentId: string) {
    setLibraryComponent(componentId)
    setLibrarySelection('')
    setLibraryError('')
    setLibraryLoading(true)
    try {
      const result = await request<{ documents: LibraryDocument[] }>('/api/citizen/workspace')
      setLibraryDocuments(result.documents)
    } catch (reason) {
      setLibraryError(
        reason instanceof Error ? reason.message : 'Chưa tải được tài liệu trong tài khoản.',
      )
    } finally {
      setLibraryLoading(false)
    }
  }

  async function reuseDocument() {
    const context = documentContext.current
    const item = libraryDocuments.find(document => document.id === librarySelection)
    if (!item || !libraryComponent) return
    setLibraryLoading(true)
    setLibraryError('')
    try {
      if (files.length >= CITIZEN_UPLOAD_MAX_FILES) {
        throw new Error(`Tối đa ${CITIZEN_UPLOAD_MAX_FILES} tệp đính kèm mỗi lần gửi.`)
      }
      if (item.size > CITIZEN_UPLOAD_MAX_FILE_BYTES) {
        throw new Error('Tệp vượt giới hạn 8 MB.')
      }
      const response = await fetch(item.downloadUrl, { credentials: 'include' })
      if (!response.ok) {
        if (response.status === 401) window.dispatchEvent(new Event('citizen-session-expired'))
        throw new Error(
          'Không tải được tài liệu thuộc tài khoản. Hãy đăng nhập lại hoặc chọn tệp từ thiết bị.',
        )
      }
      const blob = await response.blob()
      if (blob.size > CITIZEN_UPLOAD_MAX_FILE_BYTES) {
        throw new Error('Tệp vượt giới hạn 8 MB.')
      }
      const currentTotal = files.reduce((sum, entry) => sum + entry.file.size, 0)
      if (currentTotal + blob.size > CITIZEN_UPLOAD_MAX_TOTAL_BYTES) {
        throw new Error('Tổng dung lượng tệp đính kèm vượt giới hạn 9 MB.')
      }
      if (context !== documentContext.current) return
      const file = new File([blob], item.name, { type: blob.type })
      setDocuments(old => ({
        ...old,
        [libraryComponent]: [...(old[libraryComponent] || []), file],
      }))
      setLibraryComponent('')
      setKeys(null)
      setConfirmed(false)
    } catch (reason) {
      setLibraryError(reason instanceof Error ? reason.message : 'Chưa lấy được tài liệu.')
    } finally {
      setLibraryLoading(false)
    }
  }

  function changeProcedure(code: string) {
    documentContext.current++
    setLibraryComponent('')
    edited.current.fields.clear()
    setSelectedProcedure(null)
    setSchemaLoading(Boolean(code))
    setSelectedCode(code)
    setStep(0)
    setAgency('')
    setValues(syncProfileDefaults(profile, applicantType, useOwnInformation, { ...DEFAULT_VALUES }))
    setDocuments({})
    setDocumentExemptions({})
    setDelivery('')
    setConfirmed(false)
    setKeys(null)
    setError('')
    const params = new URLSearchParams(location.search)
    if (code) params.set('procedure', code)
    else params.delete('procedure')
    history.replaceState(
      history.state,
      '',
      `${location.pathname}${params.size ? `?${params}` : ''}`,
    )
  }

  function chooseApplicant(type: string) {
    documentContext.current++
    setLibraryComponent('')
    edited.current = { fields: new Set(), contact: new Set(), delivery: false }
    setContact({ name: '', phone: '', email: '' })
    setDocuments({})
    setDocumentExemptions({})
    setDelivery('')
    setDeliveryAddress('')
    setApplicantType(type)
    sessionStorage.setItem('hanoiApplicantType', type)
    setValues(syncProfileDefaults(profile, type, useOwnInformation, { ...DEFAULT_VALUES }))
    setConfirmed(false)
    setKeys(null)
  }

  function toggleOwnInformation(checked: boolean) {
    setUseOwnInformation(checked)
    setValues(current => syncProfileDefaults(profile, applicantType, checked, current))
    setConfirmed(false)
    setKeys(null)
  }

  function changeValue(id: string, value: string) {
    edited.current.fields.add(id)
    setValues(old => {
      const updated = { ...old, [id]: value }
      if (id === 'submissionRole' || id === 'relation') {
        return syncProfileDefaults(profile, applicantType, useOwnInformation, updated)
      }
      return updated
    })
    setConfirmed(false)
    setKeys(null)
  }

  function changeContact(id: 'name' | 'phone' | 'email', value: string) {
    edited.current.contact.add(id)
    setContact(old => ({ ...old, [id]: value }))
    setConfirmed(false)
    setKeys(null)
  }

  function validateStage(index: number): string {
    if (index === 0 && schemaLoading) return 'Đang tải biểu mẫu của thủ tục…'
    if (index === 0 && procedure?.serviceMode === 'INFORMATION') {
      return 'Thủ tục này thuộc mức Cung cấp thông tin, thực hiện nộp trực tiếp tại Bộ phận Một cửa.'
    }
    if (index === 0 && procedure?.submissionEnabled !== true) {
      return (
        procedure?.submissionDisabledReason ||
        'Thủ tục chưa có tờ khai và quy trình đã đối chiếu.'
      )
    }
    if (index === 0 && !schema) {
      return 'Thủ tục này chưa có biểu mẫu trực tuyến. Vui lòng chọn thủ tục mức Toàn trình hoặc Một phần.'
    }
    if (index === 0 && schema?.sourceStatus === 'official-document-list-only') {
      return 'Nguồn công khai mới xác nhận thành phần hồ sơ, chưa có cấu trúc tờ khai điện tử.'
    }
    if (index === 0 && !effectiveAgency) {
      return 'Chọn đúng cơ quan tiếp nhận. Nếu danh sách trống, đơn vị quản trị cần cấp tài khoản tiếp nhận cho cơ quan.'
    }
    if (index === 1 && contact.name.trim().length < 2) return 'Nhập tên người nộp hoặc tổ chức.'
    if (index === 1 && contact.phone && !/^[+0-9(). -]{8,40}$/.test(contact.phone)) {
      return 'Số điện thoại không hợp lệ.'
    }
    if (index === 1 && !contact.phone.trim() && !contact.email.trim()) {
      return 'Cần số điện thoại hoặc email để cơ quan liên hệ.'
    }
    if (index === 2) {
      const missing = fields.find(field => field.required && !effectiveValues[field.id]?.trim())
      if (missing) return `Cần khai: ${missing.label}.`
    }
    if (index === 3) {
      const missing = components.find(
        component => component.required && !documents[component.id]?.length,
      )
      if (missing) return `Thiếu: ${missing.label}.`
      if (schema?.declarationMode === 'OFFICIAL_ATTACHMENTS') {
        const unexplained = components.find(
          component =>
            !documents[component.id]?.length &&
            (documentExemptions[component.id] || '').trim().length < 12,
        )
        if (unexplained) {
          return `Đính kèm hoặc ghi căn cứ không phải nộp: ${unexplained.label}.`
        }
      }
      if (files.length > CITIZEN_UPLOAD_MAX_FILES) {
        return `Tối đa ${CITIZEN_UPLOAD_MAX_FILES} tệp đính kèm mỗi lần gửi.`
      }
      if (files.some(entry => entry.file.size > CITIZEN_UPLOAD_MAX_FILE_BYTES)) {
        return 'Mỗi tệp đính kèm không được vượt quá 8 MB.'
      }
      if (
        files.reduce((sum, entry) => sum + entry.file.size, 0) > CITIZEN_UPLOAD_MAX_TOTAL_BYTES
      ) {
        return 'Tổng dung lượng tệp đính kèm không được vượt quá 9 MB.'
      }
    }
    if (index === 4 && !delivery) return 'Chọn phương thức nhận kết quả.'
    if (index === 4 && delivery === 'Bưu chính' && deliveryAddress.trim().length < 10) {
      return 'Nhập đầy đủ địa chỉ nhận qua bưu chính.'
    }
    if (index === 4 && !confirmed) return 'Cần xác nhận đã kiểm tra hồ sơ.'
    if (index === 4 && !hasIntake) {
      return 'Cơ quan chưa có cán bộ tiếp nhận còn hiệu lực. Hồ sơ chưa được gửi; liên hệ quản trị viên để cấp tài khoản tiếp nhận.'
    }
    return ''
  }

  function go(index: number) {
    setStep(index)
    setError('')
    setConfirmed(false)
    setKeys(null)
    document
      .querySelector('.submission-wizard')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function proceed(event: FormEvent<HTMLFormElement>) {
    if (draftLoading) {
      event.preventDefault()
      return
    }
    event.preventDefault()
    const stageError = validateStage(step)
    if (stageError) {
      setError(stageError)
      return
    }
    if (step < 4) {
      go(step + 1)
      return
    }
    for (let index = 0; index < 4; index++) {
      const issue = validateStage(index)
      if (issue) {
        go(index)
        setError(issue)
        return
      }
    }
    const requestKeys = keys || savedKeys.current || createSubmissionKeys()
    setKeys(requestKeys)
    setBusy(true)
    setError('')
    try {
      const declaration = Object.fromEntries(
        fields.map(field => [field.id, effectiveValues[field.id] || '']),
      )
      const summary =
        selectedCode === '1.004237'
          ? `${effectiveValues.dataRequested || ''}. Mục đích: ${effectiveValues.purpose || ''}`
          : selectedCode === '2.000908'
            ? `Đề nghị cấp ${effectiveValues.copies || 1} bản sao ${effectiveValues.documentName || ''} cho ${effectiveValues.originalOwner || contact.name}.`
            : effectiveValues.requestContent
              ? `${effectiveValues.requestContent}${effectiveValues.relatedDocumentsInfo ? ` (${effectiveValues.relatedDocumentsInfo})` : ''}`
              : fields
                  .map(field =>
                    effectiveValues[field.id]
                      ? `${field.label}: ${effectiveValues[field.id]}`
                      : '',
                  )
                  .filter(Boolean)
                  .slice(0, 4)
                  .join('; ') || `Nộp hồ sơ ${procedure?.name || selectedCode}`

      const receipt = await request<SubmissionReceipt>('/api/cases', {
        ...requestKeys,
        draftId: draft?.id,
        draftVersion: draft?.version,
        procedureCode: selectedCode,
        schemaVersion: schema!.version,
        applicantType,
        applicant: contact,
        receivingAgency: effectiveAgency,
        declaration,
        documentExemptions: Object.fromEntries(
          components
            .filter(component => !documents[component.id]?.length)
            .map(component => [component.id, documentExemptions[component.id] || '']),
        ),
        requestSummary: summary.slice(0, 3000),
        deliveryMethod: delivery,
        deliveryAddress,
        confirmed: true,
        files: await Promise.all(
          files.map(entry => encodeAttachment(entry.file, entry.componentId)),
        ),
      })
      onSubmitted(receipt)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không gửi được hồ sơ. Thông tin đang nhập vẫn được giữ để thử lại.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="citizen-form-page submission-wizard">
      <div className="citizen-page-heading">
        <h1>Lập hồ sơ mới</h1>
        <p>
          Chọn thủ tục, khai đúng trường hợp và kiểm tra giấy tờ trước khi gửi. Hồ sơ chỉ được tạo sau bước cuối.
        </p>
      </div>

      <div className="profile-reuse">
        <p>
          {profile
            ? 'Thông tin đã lưu được dùng để điền sẵn khi bạn tự nộp hồ sơ.'
            : profileError
              ? 'Chưa tải được thông tin cá nhân. Bạn có thể tự điền các trường bên dưới.'
              : 'Đang tải thông tin cá nhân để điền sẵn…'}
        </p>
        <a href="/tai-khoan/thong-tin-ca-nhan">Xem, cập nhật thông tin cá nhân</a>
      </div>

      <div className="profile-reuse">
        <button
          type="button"
          className="button secondary"
          disabled={busy || draftLoading || !selectedCode}
          onClick={() => void saveDraft()}
        >
          Lưu nháp vào tài khoản
        </button>
        <a href="/tai-khoan/ho-so-nhap">Hồ sơ nháp của tôi</a>
        {draftLoading && <span role="status">Đang mở hồ sơ nháp…</span>}
      </div>

      {draftNotice && (
        <p className="citizen-success" role="status">
          {draftNotice}
        </p>
      )}

      <ol className="submission-steps" aria-label="Các bước lập hồ sơ">
        {STEP_TITLES.map((title, index) => (
          <li
            key={title}
            aria-current={step === index ? 'step' : undefined}
            className={index === step ? 'current' : index < step ? 'completed' : ''}
          >
            <span>{index + 1}</span>
            {index < step ? (
              <button type="button" disabled={busy} onClick={() => go(index)}>
                {title}
              </button>
            ) : (
              <b>{title}</b>
            )}
          </li>
        ))}
      </ol>

      <p className="required-field-note">
        Dấu sao màu đỏ (<RequiredMark />) ở cuối nhãn cho biết thông tin cần điền.
      </p>

      <form className="citizen-application-form" onSubmit={proceed}>
        {step === 0 && (
          <section className="citizen-form-section">
            <h2>1. Chọn thủ tục và cơ quan</h2>
            <label className="citizen-field" htmlFor="submission-procedure-search">
              <span>Tìm theo mã, tên, lĩnh vực hoặc cơ quan</span>
              <input
                id="submission-procedure-search"
                type="search"
                value={query}
                onChange={event => {
                  setQuery(event.target.value)
                  setLimit(10)
                }}
                placeholder="Nhập mã thủ tục, tên thủ tục hoặc tên Sở/ngành"
              />
            </label>

            {!procedure && (
              <div className="procedure-choice-list">
                {loading || schemaLoading ? (
                  <p role="status">Đang tải danh mục…</p>
                ) : (
                  <>
                    {results.slice(0, limit).map(item => (
                      <button
                        type="button"
                        key={item.code}
                        onClick={() => changeProcedure(item.code)}
                      >
                        <span>
                          <b>{item.name}</b>
                          <small>
                            {item.code} · {item.agency} · {serviceModeLabel(item.level)}
                          </small>
                        </span>
                        <i>Chọn</i>
                      </button>
                    ))}
                    {results.length > limit && (
                      <button type="button" onClick={() => setLimit(current => current + 10)}>
                        Xem thêm ({results.length - limit} thủ tục)
                      </button>
                    )}
                    {!results.length && (
                      <p>
                        {initialProcedureCode &&
                        !procedures.some(item => item.code === initialProcedureCode)
                          ? 'Mã thủ tục trong đường dẫn không có trong danh mục. Hãy chọn lại.'
                          : 'Không tìm thấy thủ tục phù hợp với từ khóa.'}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {procedure && (
              <>
                <div className="selected-procedure">
                  <div>
                    <small>
                      {procedure.code} · {procedure.field}
                    </small>
                    <b>{procedure.name}</b>
                    <span>{serviceModeLabel(procedure.level)}</span>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => changeProcedure('')}
                  >
                    Đổi thủ tục
                  </button>
                </div>

                <div className="citizen-source-note">
                  <b>Mức dịch vụ theo danh mục công bố</b>
                  <span>
                    {procedure.level === 'Toàn trình'
                      ? 'Toàn trình: các bước có thể thực hiện trực tuyến theo quy trình công bố, gồm thanh toán nếu có và trả kết quả điện tử hoặc bưu chính.'
                      : procedure.level === 'Một phần'
                        ? 'Một phần: có thể nộp và theo dõi trực tuyến; một hoặc nhiều khâu cần thực hiện theo yêu cầu riêng của thủ tục.'
                        : 'Chỉ cung cấp thông tin: thủ tục chỉ tra cứu thông tin và nộp trực tiếp tại Bộ phận Một cửa.'}
                  </span>
                </div>

                {schema ? (
                  <>
                    <p>
                      <b>Biểu mẫu:</b> {schema.title}
                    </p>
                    {schema.deadlineText && (schema.deadlineText.length > 240 ? (
                      <details className="submission-reference-details">
                        <summary>Xem thông tin về thời hạn và cách thức thực hiện</summary>
                        <p>{schema.deadlineText}</p>
                      </details>
                    ) : <p>{schema.deadlineText}</p>)}
                    <p>{schema.feeText}</p>
                    <a href={`/thu-tuc/${encodeURIComponent(procedure.code)}`}>
                      Xem chi tiết thủ tục, thành phần hồ sơ và mẫu đơn
                    </a>
                  </>
                ) : (
                  <p className="citizen-source-note">
                    Thủ tục thuộc mức <b>Cung cấp thông tin</b>: công dân tra cứu quy trình tại Danh mục thủ tục hoặc đặt lịch hẹn để nộp trực tiếp tại Bộ phận Một cửa.
                  </p>
                )}

                <label className="citizen-field" htmlFor="submission-province">
                  <span>Tỉnh, thành phố</span>
                  <input id="submission-province" value="Thành phố Hà Nội" readOnly />
                </label>

                <label className="citizen-field" htmlFor="submission-agency">
                  <span>
                    Cơ quan tiếp nhận
                    <RequiredMark />
                  </span>
                  <select
                    id="submission-agency"
                    required
                    value={effectiveAgency}
                    onChange={event => {
                      setAgency(event.target.value)
                      setValues(old => ({ ...old, registerAuthority: event.target.value }))
                    }}
                    disabled={!matchingAgencies.length}
                  >
                    <option value="">
                      {matchingAgencies.length
                        ? 'Chọn cơ quan tiếp nhận'
                        : 'Chưa có cơ quan tiếp nhận đang hoạt động'}
                    </option>
                    {matchingAgencies.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <small>
                    Chọn cơ quan thuộc tuyến của thủ tục. Việc gửi cần cán bộ tiếp nhận còn hiệu lực tại cơ quan đó. Với cấp bản sao, phải là cơ quan đang lưu sổ gốc.
                  </small>
                </label>

                {(!effectiveAgency || !hasIntake) && (
                  <p className="citizen-source-note">
                    Hãy chọn cơ quan tiếp nhận để chuẩn bị hồ sơ theo biểu mẫu chính thức.
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="citizen-form-section">
            <h2>2. Người yêu cầu giải quyết</h2>
            <div className="citizen-applicant-type">
              <label>
                <input
                  type="radio"
                  checked={applicantType === 'citizen'}
                  onChange={() => chooseApplicant('citizen')}
                />{' '}
                Cá nhân
              </label>
              <label>
                <input
                  type="radio"
                  checked={applicantType === 'organization'}
                  onChange={() => chooseApplicant('organization')}
                />{' '}
                Tổ chức
              </label>
            </div>

            <div className="profile-reuse">
              {applicantType === 'citizen' && (
                <label>
                  <input
                    type="checkbox"
                    checked={useOwnInformation && !proxy}
                    disabled={proxy || !profile}
                    onChange={event => toggleOwnInformation(event.target.checked)}
                  />
                  Tôi là người yêu cầu, dùng thông tin cá nhân đã lưu
                </label>
              )}
              <p>
                {proxy
                  ? 'Bạn đang nộp thay. Khai thông tin người yêu cầu ở đây; thông tin tài khoản chỉ điền vào phần người nộp thay.'
                  : applicantType === 'organization'
                    ? 'Khai tên và thông tin liên hệ của tổ chức; hệ thống không dùng thông tin cá nhân làm thông tin tổ chức.'
                    : 'Thông tin điền sẵn vẫn có thể sửa riêng cho hồ sơ này.'}
              </p>
            </div>

            <div className="citizen-form-grid">
              <label className="citizen-field">
                <span>
                  {applicantType === 'citizen' ? 'Họ và tên người yêu cầu' : 'Tên tổ chức yêu cầu'}
                  <RequiredMark />
                </span>
                <input
                  value={contact.name}
                  onChange={event => changeContact('name', event.target.value)}
                  minLength={2}
                  maxLength={150}
                  required
                  autoComplete="name"
                />
              </label>

              <p id="contact-requirement" className="contact-requirement">
                Số điện thoại hoặc email
                <RequiredMark />
                <small>Điền ít nhất một trong hai để cơ quan liên hệ khi xử lý hồ sơ.</small>
              </p>

              <label className="citizen-field">
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={event => changeContact('phone', event.target.value)}
                  maxLength={40}
                  autoComplete="tel"
                  aria-describedby="contact-requirement"
                />
              </label>

              <label className="citizen-field">
                <span>Email</span>
                <input
                  type="email"
                  value={contact.email}
                  onChange={event => changeContact('email', event.target.value)}
                  maxLength={254}
                  autoComplete="email"
                  aria-describedby="contact-requirement"
                />
              </label>
            </div>

            <p>Các thông tin của thủ tục được khai ở bước tiếp theo.</p>
          </section>
        )}

        {step === 2 && (
          <section className="citizen-form-section">
            <h2>3. {schema?.title}</h2>
            {proxy && (
              <p>
                Bạn đang nộp thay theo ủy quyền.{' '}
                <button type="button" className="text-button" onClick={() => go(1)}>
                  Kiểm tra tên và liên hệ của người yêu cầu ở bước 2
                </button>
                . Thông tin tài khoản chỉ dùng cho phần người nộp thay dưới đây.
              </p>
            )}
            <p>{schema?.legalBasis}</p>
            {schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' && (
              <p>
                Tải biểu mẫu gốc ở bước Thành phần hồ sơ, điền đầy đủ, ký theo yêu cầu và đính kèm bản đã hoàn thiện. Nội dung bên dưới giúp cơ quan xác định yêu cầu của hồ sơ.
              </p>
            )}

            <div className="citizen-form-grid">
              {fields.map(field => (
                <label
                  className={`citizen-field${
                    field.type === 'textarea' ||
                    field.id === 'submissionRole' ||
                    field.id === 'verificationMethod'
                      ? ' field-wide'
                      : ''
                  }`}
                  key={field.id}
                >
                  <span>
                    {field.label}
                    {field.required && <RequiredMark />}
                  </span>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={effectiveValues[field.id] || ''}
                      onChange={event => changeValue(field.id, event.target.value)}
                    >
                      <option value="">Chọn…</option>
                      {field.options?.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      rows={4}
                      required={field.required}
                      maxLength={field.maxLength || 500}
                      value={effectiveValues[field.id] || ''}
                      onChange={event => changeValue(field.id, event.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      readOnly={field.id === 'registerAuthority'}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      maxLength={field.maxLength || 500}
                      value={effectiveValues[field.id] || ''}
                      onChange={event => changeValue(field.id, event.target.value)}
                    />
                  )}
                  {field.help && <small>{field.help}</small>}
                </label>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="citizen-form-section">
            <h2>4. Thành phần hồ sơ</h2>
            <p>Đính kèm theo từng loại giấy tờ. {CITIZEN_UPLOAD_LIMIT_TEXT}</p>
            {schema?.formSourceUrl && (
              <p>
                <a href={schema.formSourceUrl} target="_blank" rel="noreferrer">
                  {schema.formSourceLabel ||
                    'Xem thành phần hồ sơ và biểu mẫu trên nguồn chính thức ↗'}
                </a>
              </p>
            )}

            {components.map(component => (
              <div className="document-component" key={component.id}>
                <label className="citizen-field">
                  <b>
                    {component.label}
                    {component.required && <RequiredMark />}
                  </b>
                  {component.help && <small>{component.help}</small>}
                  {component.officialAttachmentNames?.length ? (
                    <small>
                      Mẫu được nguồn chính thức liệt kê:{' '}
                      {component.officialAttachmentNames.join('; ')}. Mở trang thủ tục chính thức ở trên để xem hoặc tải nếu được cung cấp.
                    </small>
                  ) : null}
                  <span className="file-picker-control">
                    Chọn tệp đính kèm
                    <input
                      type="file"
                      aria-required={component.required || undefined}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      multiple
                      onChange={event => {
                        setDocuments(old => ({
                          ...old,
                          [component.id]: Array.from(event.target.files || []),
                        }))
                        setKeys(null)
                      }}
                    />
                  </span>
                </label>

                {component.officialAttachments?.map(attachment => (
                  <p key={attachment.id}>
                    <a
                      className="text-link"
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tải {attachment.name}
                    </a>
                  </p>
                ))}

                <button
                  type="button"
                  className="text-button"
                  disabled={libraryLoading}
                  onClick={() => void openDocumentLibrary(component.id)}
                >
                  Chọn từ tài liệu đã nộp
                </button>

                {libraryComponent === component.id && (
                  <div className="profile-reuse">
                    <p>
                      Chọn đúng giấy tờ còn giá trị sử dụng cho thành phần này. Việc dùng lại không thay thế kiểm tra của cơ quan.
                    </p>
                    {libraryLoading ? (
                      <span role="status">Đang tải tài liệu…</span>
                    ) : libraryDocuments.length ? (
                      <>
                        <label className="citizen-field">
                          <span>Tài liệu trong tài khoản</span>
                          <select
                            value={librarySelection}
                            onChange={event => setLibrarySelection(event.target.value)}
                          >
                            <option value="">Chọn tài liệu</option>
                            {libraryDocuments.map(item => (
                              <option value={item.id} key={item.id}>
                                {item.name} · {item.code}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="button secondary"
                          disabled={!librarySelection}
                          onClick={() => void reuseDocument()}
                        >
                          Dùng tài liệu này
                        </button>
                      </>
                    ) : (
                      <p>Chưa có tài liệu trong tài khoản.</p>
                    )}
                    {libraryError && (
                      <p role="alert" className="form-error">
                        {libraryError}
                      </p>
                    )}
                    <button
                      type="button"
                      className="text-button"
                      disabled={libraryLoading}
                      onClick={() => setLibraryComponent('')}
                    >
                      Đóng
                    </button>
                  </div>
                )}

                {(documents[component.id] || []).map((file, fileIndex) => (
                  <div className="selected-document" key={`${file.name}-${fileIndex}`}>
                    <span>
                      {file.name} · {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setDocuments(old => ({
                          ...old,
                          [component.id]: old[component.id].filter((_, idx) => fileIndex !== idx),
                        }))
                      }
                    >
                      Gỡ
                    </button>
                  </div>
                ))}

                {schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' &&
                  !documents[component.id]?.length && (
                    <label className="citizen-field">
                      <span>Căn cứ không phải nộp / cơ quan khai thác dữ liệu</span>
                      <textarea
                        rows={2}
                        minLength={12}
                        maxLength={1200}
                        value={documentExemptions[component.id] || ''}
                        onChange={event => {
                          setDocumentExemptions(old => ({
                            ...old,
                            [component.id]: event.target.value,
                          }))
                          setKeys(null)
                        }}
                        placeholder="Ghi rõ trường hợp không áp dụng hoặc nguồn dữ liệu cơ quan được khai thác."
                      />
                    </label>
                  )}
              </div>
            ))}
          </section>
        )}

        {step === 4 && (
          <section className="citizen-form-section">
            <h2>5. Kiểm tra hồ sơ và chọn cách nhận kết quả</h2>
            <div className="submission-review">
              <h3>{procedure?.name}</h3>
              <p>
                {selectedCode} · {serviceModeLabel(procedure?.level || '')}
              </p>
              <dl>
                <div>
                  <dt>Cơ quan tiếp nhận</dt>
                  <dd>{effectiveAgency}</dd>
                </div>
                <div>
                  <dt>Người yêu cầu</dt>
                  <dd>{contact.name}</dd>
                </div>
                <div>
                  <dt>Liên hệ</dt>
                  <dd>{[contact.phone, contact.email].filter(Boolean).join(' · ')}</dd>
                </div>
                {fields.map(field => (
                  <div key={field.id}>
                    <dt>{field.label}</dt>
                    <dd>{effectiveValues[field.id] || 'Không khai'}</dd>
                  </div>
                ))}
              </dl>
              <h3>Giấy tờ gửi kèm</h3>
              {components.map(component => (
                <p key={component.id}>
                  <b>{component.label}:</b>{' '}
                  {(documents[component.id] || []).map(file => file.name).join(', ') ||
                    documentExemptions[component.id] ||
                    'Không đính kèm'}
                </p>
              ))}
            </div>

            <label className="citizen-field">
              <span>
                Phương thức nhận kết quả
                <RequiredMark />
              </span>
              <select
                required
                value={delivery}
                onChange={event => {
                  setDelivery(event.target.value)
                  setKeys(null)
                }}
              >
                <option value="">Chọn cách nhận</option>
                {schema?.deliveryMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <small>{schema?.deliveryNote}</small>
            </label>

            {delivery === 'Bưu chính' && (
              <label className="citizen-field">
                <span>
                  Địa chỉ nhận kết quả
                  <RequiredMark />
                </span>
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  value={deliveryAddress}
                  onChange={event => {
                    edited.current.delivery = true
                    setDeliveryAddress(event.target.value)
                    setConfirmed(false)
                    setKeys(null)
                  }}
                />
              </label>
            )}

            <p>{schema?.feeText}</p>

            <label className="citizen-consent">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={event => setConfirmed(event.target.checked)}
              />
              <span>
                Tôi đã kiểm tra tờ khai, giấy tờ và cơ quan; chịu trách nhiệm về thông tin đã khai.
                <RequiredMark />
              </span>
            </label>

            {!hasIntake && (
              <p className="form-error">
                Cơ quan chưa có tài khoản tiếp nhận còn hiệu lực. Bạn đã chuẩn bị hồ sơ nhưng chưa thể gửi; cần đơn vị quản trị cấp tài khoản tiếp nhận.
              </p>
            )}

            <p>
              Gửi hồ sơ vào hàng đợi kiểm tra. Việc gửi thành công chưa phải là xác nhận đã tiếp nhận hợp lệ.
            </p>
          </section>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <div className="citizen-form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => go(step - 1)}
            >
              Quay lại
            </button>
          )}
          <button
            className="button primary"
            disabled={
              busy ||
              loading ||
              schemaLoading ||
              (step === 0 &&
                (!schema ||
                  schema.sourceStatus === 'official-document-list-only' ||
                  !effectiveAgency ||
                  procedure?.serviceMode === 'INFORMATION'))
            }
          >
            {busy ? 'Đang lưu hồ sơ…' : step === 4 ? 'Xác nhận và gửi hồ sơ' : 'Tiếp tục'}
          </button>
          <span>
            Bước {step + 1} / 5 · {step < 4 ? 'Chưa gửi hồ sơ' : 'Chỉ gửi khi bạn xác nhận'}
          </span>
        </div>
      </form>
    </section>
  )
}

export default CitizenApplicationForm
