import {
  AlertTriangle,
  FileText,
  FolderOpen,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ErrorSummary,
  LockedFieldNotice,
  ServiceLevelBadge,
  VerifiedFieldBadge,
} from './design-system'
import { normalizeAgency, procedureAgencies } from './procedureAgencies'
import { serviceModeLabel } from './procedureLabels'
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
import './ProcedureDetail.css'

export type { SubmissionField, SubmissionSchema }

const DRAFT_FILES_VALUE_KEY = '__draftAttachmentNames'
const DRAFT_FILES_STORAGE_PREFIX = 'hanoiCitizenDraftFiles:'

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

type ValidationIssue = {
  id?: string
  message: string
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

function parseSavedAttachmentNames(raw?: string | null): Record<string, string[]> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, string[]> = {}
    for (const [compId, names] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(names)) {
        const clean = names.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        if (clean.length > 0) out[compId] = clean
      }
    }
    return out
  } catch {
    return {}
  }
}

function readLocalDraftFiles(draftId: string): Record<string, string[]> {
  if (!draftId) return {}
  try {
    return parseSavedAttachmentNames(localStorage.getItem(`${DRAFT_FILES_STORAGE_PREFIX}${draftId}`))
  } catch {
    return {}
  }
}

function writeLocalDraftFiles(draftId: string, map: Record<string, string[]>) {
  if (!draftId) return
  try {
    if (Object.keys(map).length > 0) {
      localStorage.setItem(`${DRAFT_FILES_STORAGE_PREFIX}${draftId}`, JSON.stringify(map))
    } else {
      localStorage.removeItem(`${DRAFT_FILES_STORAGE_PREFIX}${draftId}`)
    }
  } catch {
    /* Ignore storage quota errors */
  }
}

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
  const [restoredAttachmentNames, setRestoredAttachmentNames] = useState<Record<string, string[]>>(
    {},
  )
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
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([])
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
        const serializedFiles = saved.values[DRAFT_FILES_VALUE_KEY]
        const parsedFromServer = parseSavedAttachmentNames(serializedFiles)
        const parsedFromLocal = readLocalDraftFiles(saved.id)
        const restoredMap =
          Object.keys(parsedFromServer).length > 0 ? parsedFromServer : parsedFromLocal

        const cleanValues = { ...saved.values }
        delete cleanValues[DRAFT_FILES_VALUE_KEY]

        edited.current = {
          fields: new Set(Object.keys(cleanValues)),
          contact: new Set(['name', 'phone', 'email']),
          delivery: true,
        }
        setDraft({ id: saved.id, version: saved.version, updatedAt: saved.updatedAt })
        setRestoredAttachmentNames(restoredMap)
        setSelectedCode(saved.procedureCode)
        setSchemaLoading(Boolean(saved.procedureCode))
        setApplicantType(saved.applicantType)
        setValues(cleanValues)
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
          'Đã khôi phục nội dung tờ khai nháp. Vui lòng kiểm tra thông tin và đính kèm lại tệp giấy tờ trước khi gửi.',
        )
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setValidationErrors([
          {
            message: reason instanceof Error ? reason.message : 'Chưa mở được hồ sơ nháp.',
          },
        ])
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
        setProfileError(
          reason instanceof Error ? reason.message : 'Chưa tải được thông tin cá nhân.',
        )
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
        setValidationErrors([
          {
            message: reason instanceof Error ? reason.message : 'Không tải được danh mục.',
          },
        ])
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
        setValidationErrors([
          {
            message: reason instanceof Error ? reason.message : 'Không tải được biểu mẫu thủ tục.',
          },
        ])
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
  const isOwnCitizenApplicant = applicantType === 'citizen' && useOwnInformation && !proxy
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

  const missingRestoredAttachments = useMemo(() => {
    const entries: { componentId: string; label: string; fileNames: string[] }[] = []
    for (const [compId, fileNames] of Object.entries(restoredAttachmentNames)) {
      if (!fileNames.length || documents[compId]?.length) continue
      const matchedComp = schema?.documents.find(doc => doc.id === compId)
      entries.push({
        componentId: compId,
        label: matchedComp?.label || compId,
        fileNames,
      })
    }
    return entries
  }, [restoredAttachmentNames, documents, schema])

  const profileDesiredValues = useMemo<Record<string, string>>(() => {
    if (!profile) return {}
    const personal: Record<string, string> = isOwnCitizenApplicant
      ? {
          address: profile.contactAddress,
          identityType: profile.identityType,
          identityNumber: profile.identityNumber,
          identityDate: profile.identityDate,
          identityPlace: profile.identityPlace,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          nationality: profile.nationality,
          nationalityType:
            profile.nationality === 'Việt Nam'
              ? 'Trong nước'
              : profile.nationality
                ? 'Cá nhân nước ngoài tại Việt Nam'
                : '',
          passport: profile.identityType === 'Hộ chiếu' ? profile.identityNumber : '',
          originalOwner: effectiveValues.relation === 'Người được cấp bản chính' ? profile.name : '',
        }
      : {}
    const submitter: Record<string, string> = proxy
      ? {
          submitterName: profile.name,
          submitterIdentity: profile.identityNumber,
          submitterIdentityDate: profile.identityDate,
          submitterIdentityPlace: profile.identityPlace,
          submitterAddress: profile.contactAddress,
          submitterPhone: profile.phone,
          submitterEmail: profile.email,
        }
      : {}
    return { ...personal, ...submitter }
  }, [profile, isOwnCitizenApplicant, proxy, effectiveValues.relation])

  function isProfileSyncedContact(key: 'name' | 'phone' | 'email'): boolean {
    if (!profile || !isOwnCitizenApplicant) return false
    const val = contact[key]?.trim()
    return Boolean(val) && val === profile[key]?.trim()
  }

  function isProfileSyncedField(fieldId: string): boolean {
    if (!profile) return false
    if (!(REUSABLE_PROFILE_FIELDS as readonly string[]).includes(fieldId)) return false
    const val = effectiveValues[fieldId]?.trim()
    const target = profileDesiredValues[fieldId]?.trim()
    return Boolean(val && target && val === target)
  }

  function isProfileSyncedDelivery(): boolean {
    if (!profile || !isOwnCitizenApplicant) return false
    return (
      Boolean(deliveryAddress.trim()) && deliveryAddress.trim() === profile.contactAddress?.trim()
    )
  }

  async function saveDraft() {
    if (!selectedCode) {
      setValidationErrors([
        { id: 'submission-procedure-search', message: 'Chọn thủ tục trước khi lưu nháp.' },
      ])
      return
    }
    setBusy(true)
    setValidationErrors([])
    setDraftNotice('')
    const requestKeys = keys || savedKeys.current || createSubmissionKeys()

    const attachmentNamesSnapshot: Record<string, string[]> = {}
    for (const [compId, prevNames] of Object.entries(restoredAttachmentNames)) {
      if (!documents[compId]?.length && prevNames.length > 0) {
        attachmentNamesSnapshot[compId] = prevNames
      }
    }
    for (const [compId, fileList] of Object.entries(documents)) {
      if (fileList.length > 0) {
        attachmentNamesSnapshot[compId] = fileList.map(file => file.name)
      }
    }

    const draftValues: Record<string, string> = { ...effectiveValues }
    delete draftValues[DRAFT_FILES_VALUE_KEY]
    if (Object.keys(attachmentNamesSnapshot).length > 0) {
      draftValues[DRAFT_FILES_VALUE_KEY] = JSON.stringify(attachmentNamesSnapshot).slice(0, 9500)
    }

    try {
      const result = await request<{ draft: { id: string; version: number; updatedAt: string } }>(
        '/api/citizen/drafts',
        {
          id: draft?.id,
          version: draft?.version || 0,
          procedureCode: selectedCode,
          applicantType,
          values: draftValues,
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
      writeLocalDraftFiles(result.draft.id, attachmentNamesSnapshot)
      setRestoredAttachmentNames(attachmentNamesSnapshot)
      savedKeys.current = requestKeys
      setKeys(requestKeys)
      const params = new URLSearchParams(location.search)
      params.set('draft', result.draft.id)
      params.set('procedure', selectedCode)
      history.replaceState(history.state, '', `${location.pathname}?${params}`)
      setDraftNotice(
        'Đã lưu nội dung tờ khai và danh sách tên tệp đính kèm vào tài khoản. Nếu đóng trình duyệt, vui lòng đính kèm lại tệp nhị phân từ thiết bị trước khi gửi.',
      )
    } catch (reason) {
      setValidationErrors([
        {
          message:
            reason instanceof Error
              ? reason.message
              : 'Chưa lưu được hồ sơ nháp. Nội dung đang nhập vẫn được giữ.',
        },
      ])
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
      setValidationErrors([])
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
    setRestoredAttachmentNames({})
    setDocumentExemptions({})
    setDelivery('')
    setConfirmed(false)
    setKeys(null)
    setValidationErrors([])
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
    setValidationErrors([])
    setKeys(null)
  }

  function toggleOwnInformation(checked: boolean) {
    setUseOwnInformation(checked)
    setValues(current => syncProfileDefaults(profile, applicantType, checked, current))
    setConfirmed(false)
    setValidationErrors([])
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
    setValidationErrors([])
    setKeys(null)
  }

  function changeContact(id: 'name' | 'phone' | 'email', value: string) {
    edited.current.contact.add(id)
    setContact(old => ({ ...old, [id]: value }))
    setConfirmed(false)
    setValidationErrors([])
    setKeys(null)
  }

  function validateStageItems(index: number): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    if (index === 0) {
      if (schemaLoading) {
        issues.push({ message: 'Đang tải biểu mẫu của thủ tục…' })
        return issues
      }
      if (!selectedCode) {
        issues.push({
          id: 'submission-procedure-search',
          message: 'Vui lòng chọn thủ tục hành chính cần nộp hồ sơ.',
        })
        return issues
      }
      if (procedure?.serviceMode === 'INFORMATION') {
        issues.push({
          message:
            'Thủ tục này thuộc mức Cung cấp thông tin, thực hiện nộp trực tiếp tại Bộ phận Một cửa.',
        })
      }
      if (procedure?.submissionEnabled !== true) {
        issues.push({
          message:
            procedure?.submissionDisabledReason ||
            'Thủ tục chưa có tờ khai và quy trình đã đối chiếu.',
        })
      }
      if (!schema) {
        issues.push({
          message:
            'Thủ tục này chưa có biểu mẫu trực tuyến. Vui lòng chọn thủ tục mức Toàn trình hoặc Một phần.',
        })
      } else if (schema.sourceStatus === 'official-document-list-only') {
        issues.push({
          message:
            'Nguồn công khai mới xác nhận thành phần hồ sơ, chưa có cấu trúc tờ khai điện tử.',
        })
      }
      if (!effectiveAgency) {
        issues.push({
          id: 'submission-agency',
          message:
            'Chọn đúng cơ quan tiếp nhận. Nếu danh sách trống, đơn vị quản trị cần cấp tài khoản tiếp nhận cho cơ quan.',
        })
      }
    }

    if (index === 1) {
      if (contact.name.trim().length < 2) {
        issues.push({
          id: 'applicant-contact-name',
          message: 'Nhập họ tên người nộp hoặc tên tổ chức yêu cầu giải quyết.',
        })
      }
      if (contact.phone && !/^[+0-9(). -]{8,40}$/.test(contact.phone)) {
        issues.push({
          id: 'applicant-contact-phone',
          message: 'Số điện thoại không hợp lệ (gồm 8 đến 40 chữ số).',
        })
      }
      if (!contact.phone.trim() && !contact.email.trim()) {
        issues.push({
          id: 'applicant-contact-phone',
          message: 'Cần cung cấp số điện thoại hoặc email để cơ quan liên hệ khi xử lý hồ sơ.',
        })
      }
    }

    if (index === 2) {
      for (const field of fields) {
        if (field.required && !effectiveValues[field.id]?.trim()) {
          issues.push({
            id: `field-${field.id}`,
            message: `Cần khai đầy đủ trường bắt buộc: ${field.label}.`,
          })
        }
      }
    }

    if (index === 3) {
      for (const component of components) {
        if (component.required && !documents[component.id]?.length) {
          issues.push({
            id: `doc-${component.id}`,
            message: `Thiếu tệp đính kèm bắt buộc: ${component.label}.`,
          })
        } else if (
          schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' &&
          !documents[component.id]?.length &&
          (documentExemptions[component.id] || '').trim().length < 12
        ) {
          issues.push({
            id: `exemption-${component.id}`,
            message: `Đính kèm tệp hoặc ghi rõ căn cứ không phải nộp đối với: ${component.label}.`,
          })
        }
      }
      if (files.length > CITIZEN_UPLOAD_MAX_FILES) {
        issues.push({
          message: `Tối đa ${CITIZEN_UPLOAD_MAX_FILES} tệp đính kèm mỗi lần gửi.`,
        })
      }
      if (files.some(entry => entry.file.size > CITIZEN_UPLOAD_MAX_FILE_BYTES)) {
        issues.push({
          message: 'Mỗi tệp đính kèm không được vượt quá 8 MB.',
        })
      }
      if (
        files.reduce((sum, entry) => sum + entry.file.size, 0) > CITIZEN_UPLOAD_MAX_TOTAL_BYTES
      ) {
        issues.push({
          message: 'Tổng dung lượng tệp đính kèm không được vượt quá 9 MB.',
        })
      }
    }

    if (index === 4) {
      if (!delivery) {
        issues.push({
          id: 'submission-delivery-method',
          message: 'Chọn phương thức nhận kết quả giải quyết.',
        })
      }
      if (delivery === 'Bưu chính' && deliveryAddress.trim().length < 10) {
        issues.push({
          id: 'submission-delivery-address',
          message: 'Nhập đầy đủ địa chỉ nhận kết quả qua dịch vụ bưu chính (tối thiểu 10 ký tự).',
        })
      }
      if (!confirmed) {
        issues.push({
          id: 'submission-confirm-checkbox',
          message: 'Cần đánh dấu xác nhận chịu trách nhiệm về thông tin đã kê khai.',
        })
      }
      if (!hasIntake) {
        issues.push({
          message:
            'Cơ quan chưa có cán bộ tiếp nhận còn hiệu lực. Hồ sơ chưa được gửi; liên hệ quản trị viên để cấp tài khoản tiếp nhận.',
        })
      }
    }

    return issues
  }

  function focusErrorSummary() {
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.hcds-error-summary')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
    }, 30)
  }

  function go(index: number) {
    setStep(index)
    setValidationErrors([])
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
    const stageIssues = validateStageItems(step)
    if (stageIssues.length > 0) {
      setValidationErrors(stageIssues)
      focusErrorSummary()
      return
    }
    if (step < 4) {
      go(step + 1)
      return
    }
    for (let index = 0; index < 4; index++) {
      const priorIssues = validateStageItems(index)
      if (priorIssues.length > 0) {
        setStep(index)
        setConfirmed(false)
        setKeys(null)
        setValidationErrors(priorIssues)
        focusErrorSummary()
        return
      }
    }
    const requestKeys = keys || savedKeys.current || createSubmissionKeys()
    setKeys(requestKeys)
    setBusy(true)
    setValidationErrors([])
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
      if (draft?.id) {
        writeLocalDraftFiles(draft.id, {})
      }
      onSubmitted(receipt)
    } catch (reason) {
      setValidationErrors([
        {
          message:
            reason instanceof Error
              ? reason.message
              : 'Không gửi được hồ sơ. Thông tin đang nhập vẫn được giữ để thử lại.',
        },
      ])
      focusErrorSummary()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="citizen-form-page submission-wizard">
      <div className="citizen-page-heading">
        <h1>Nộp hồ sơ dịch vụ công trực tuyến</h1>
        <p>
          Hoàn thành từng bước kê khai, đính kèm thành phần hồ sơ và kiểm tra tổng thể trước khi gửi chính thức.
        </p>
      </div>

      <div className="hcds-draft-bar">
        <div className="hcds-draft-bar__info">
          <span>
            {profile
              ? 'Thông tin công dân đã xác thực sẽ được tự động đồng bộ vào các trường tương ứng.'
              : profileError
                ? 'Chưa tải được hồ sơ cá nhân. Bạn có thể tự nhập đầy đủ các trường bên dưới.'
                : 'Đang tải thông tin hồ sơ cá nhân để điền sẵn…'}
          </span>
          <a href="/tai-khoan/thong-tin-ca-nhan">Cập nhật hồ sơ cá nhân</a>
        </div>

        <div className="hcds-draft-bar__actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy || draftLoading || !selectedCode}
            onClick={() => void saveDraft()}
          >
            <Save size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>Lưu nháp vào tài khoản</span>
          </button>
          <a href="/tai-khoan/ho-so-nhap">Hồ sơ nháp của tôi</a>
          {draftLoading && <span role="status">Đang mở hồ sơ nháp…</span>}
        </div>
      </div>

      {draftNotice && (
        <p className="citizen-success" role="status">
          {draftNotice}
        </p>
      )}

      {missingRestoredAttachments.length > 0 && (
        <div className="hcds-amber-alert" role="status">
          <div className="hcds-amber-alert__title">
            <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>Cần chọn lại tệp đính kèm từ thiết bị cho hồ sơ nháp</span>
          </div>
          <p>
            Để bảo vệ an toàn dữ liệu trên trình duyệt, tệp nhị phân không lưu tự động khi đóng trang. Hệ thống đã ghi nhận các tệp bạn từng chọn ở phiên trước — vui lòng đính kèm lại tại Bước 4:
          </p>
          <ul>
            {missingRestoredAttachments.map(entry => (
              <li key={entry.componentId}>
                <b>{entry.label}:</b> {entry.fileNames.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="submission-steps" aria-label="Các bước lập hồ sơ">
        {STEP_TITLES.map((title, index) => (
          <li
            key={title}
            aria-current={step === index ? 'step' : undefined}
            className={index === step ? 'current' : index < step ? 'completed' : ''}
          >
            <span className="tabular-nums">{index + 1}</span>
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
        Dấu sao màu đỏ (<RequiredMark />) cho biết trường thông tin bắt buộc kê khai.
      </p>

      <form className="citizen-application-form" noValidate onSubmit={proceed}>
        <ErrorSummary errors={validationErrors} />

        {step === 0 && (
          <section className="citizen-form-section">
            <h2>1. Chọn thủ tục hành chính và cơ quan tiếp nhận</h2>

            {!procedure && (
              <>
                <label className="citizen-field" htmlFor="submission-procedure-search">
                  <span>Tìm theo mã, tên thủ tục, lĩnh vực hoặc cơ quan</span>
                  <input
                    id="submission-procedure-search"
                    type="search"
                    value={query}
                    onChange={event => {
                      setQuery(event.target.value)
                      setLimit(10)
                    }}
                    placeholder="Nhập mã thủ tục (ví dụ: 2.000908), tên thủ tục hoặc tên Sở/ngành"
                  />
                </label>

                <div className="procedure-choice-list">
                  {loading || schemaLoading ? (
                    <p role="status">Đang tải danh mục thủ tục…</p>
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
                            <small className="tabular-nums">
                              {item.code} · {item.agency} · {serviceModeLabel(item.level)}
                            </small>
                          </span>
                          <i>Chọn</i>
                        </button>
                      ))}
                      {results.length > limit && (
                        <button type="button" onClick={() => setLimit(current => current + 10)}>
                          Xem thêm (<span className="tabular-nums">{results.length - limit}</span>{' '}
                          thủ tục)
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
              </>
            )}

            {procedure && (
              <>
                <div className="selected-procedure">
                  <div>
                    <small className="tabular-nums">
                      {procedure.code} · {procedure.field}
                    </small>
                    <b>{procedure.name}</b>
                    <div>
                      <ServiceLevelBadge
                        level={procedure.level}
                        serviceMode={procedure.serviceMode}
                      />
                    </div>
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
                  <b>Giải thích mức độ dịch vụ công (Nghị định 42/2022/NĐ-CP)</b>
                  <span>
                    {procedure.level === 'Toàn trình'
                      ? 'Trực tuyến toàn trình (Nộp & nhận kết quả tại nhà): thực hiện trực tuyến toàn bộ các bước kê khai, thanh toán lệ phí (nếu có) và nhận kết quả điện tử hoặc qua bưu chính.'
                      : procedure.level === 'Một phần'
                        ? 'Trực tuyến một phần: nộp và theo dõi hồ sơ trực tuyến; việc xuất trình bản chính hoặc nhận kết quả thực hiện theo quy định riêng của thủ tục.'
                        : 'Cung cấp thông tin: tra cứu thành phần hồ sơ trên cổng và nộp trực tiếp tại Bộ phận Một cửa.'}
                  </span>
                </div>

                {schema ? (
                  <>
                    <p>
                      <b>Biểu mẫu điện tử:</b> {schema.title}
                    </p>
                    {schema.deadlineText &&
                      (schema.deadlineText.length > 240 ? (
                        <details className="submission-reference-details">
                          <summary>Xem quy định về thời hạn và cách thức giải quyết</summary>
                          <p className="tabular-nums">{schema.deadlineText}</p>
                        </details>
                      ) : (
                        <p className="tabular-nums">{schema.deadlineText}</p>
                      ))}
                    <p className="tabular-nums">{schema.feeText}</p>
                    <a href={`/thu-tuc/${encodeURIComponent(procedure.code)}`}>
                      Xem đầy đủ trình tự, thành phần hồ sơ và biểu mẫu gốc
                    </a>
                  </>
                ) : (
                  <p className="citizen-source-note">
                    Thủ tục thuộc mức <b>Cung cấp thông tin</b>: công dân tra cứu quy trình tại Danh mục thủ tục hoặc đặt lịch hẹn để nộp trực tiếp tại Bộ phận Một cửa.
                  </p>
                )}

                <label className="citizen-field" htmlFor="submission-province">
                  <span>Tỉnh / Thành phố</span>
                  <input id="submission-province" value="Thành phố Hà Nội" readOnly />
                </label>
                <LockedFieldNotice>
                  Đơn vị hành chính mặc định theo thẩm quyền giải quyết của Thành phố Hà Nội.
                </LockedFieldNotice>

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
                      setValidationErrors([])
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
                    Chọn đúng cơ quan thuộc thẩm quyền của thủ tục. Đối với thủ tục cấp bản sao trích lục, chọn cơ quan đang lưu giữ sổ gốc.
                  </small>
                </label>

                {(!effectiveAgency || !hasIntake) && (
                  <p className="citizen-source-note">
                    Hãy chọn cơ quan tiếp nhận để khởi tạo tờ khai theo đúng thẩm quyền.
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="citizen-form-section">
            <h2>2. Thông tin người yêu cầu giải quyết</h2>
            <div className="citizen-applicant-type">
              <label>
                <input
                  type="radio"
                  checked={applicantType === 'citizen'}
                  onChange={() => chooseApplicant('citizen')}
                />{' '}
                Cá nhân / Công dân
              </label>
              <label>
                <input
                  type="radio"
                  checked={applicantType === 'organization'}
                  onChange={() => chooseApplicant('organization')}
                />{' '}
                Tổ chức / Doanh nghiệp
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
                  Tôi là người yêu cầu, tự động điền thông tin từ hồ sơ cá nhân
                </label>
              )}
              <p>
                {proxy
                  ? 'Bạn đang nộp thay theo ủy quyền. Nhập thông tin người được ủy quyền tại đây; thông tin tài khoản của bạn sẽ tự động điền vào mục Người nộp thay ở bước kế tiếp.'
                  : applicantType === 'organization'
                    ? 'Nhập tên pháp nhân và đầu mối liên hệ của tổ chức.'
                    : 'Bạn vẫn có thể điều chỉnh thông tin liên hệ riêng cho hồ sơ này nếu cần.'}
              </p>
            </div>

            <div className="citizen-form-grid">
              <label className="citizen-field field-wide" htmlFor="applicant-contact-name">
                <span className="hcds-field-label-row">
                  <span>
                    {applicantType === 'citizen' ? 'Họ và tên người yêu cầu' : 'Tên tổ chức yêu cầu'}
                    <RequiredMark />
                  </span>
                  {isProfileSyncedContact('name') && (
                    <VerifiedFieldBadge text="Đồng bộ từ hồ sơ cá nhân" />
                  )}
                </span>
                <input
                  id="applicant-contact-name"
                  value={contact.name}
                  onChange={event => changeContact('name', event.target.value)}
                  minLength={2}
                  maxLength={150}
                  required
                  autoComplete="name"
                />
              </label>

              <p id="contact-requirement" className="contact-requirement">
                Phương thức liên hệ bắt buộc
                <RequiredMark />
                <small>Cung cấp ít nhất số điện thoại hoặc email để nhận thông báo tiến độ và kết quả.</small>
              </p>

              <label className="citizen-field" htmlFor="applicant-contact-phone">
                <span className="hcds-field-label-row">
                  <span>Số điện thoại</span>
                  {isProfileSyncedContact('phone') && (
                    <VerifiedFieldBadge text="Đồng bộ từ hồ sơ cá nhân" />
                  )}
                </span>
                <input
                  id="applicant-contact-phone"
                  type="tel"
                  className="tabular-nums"
                  value={contact.phone}
                  onChange={event => changeContact('phone', event.target.value)}
                  maxLength={40}
                  autoComplete="tel"
                  aria-describedby="contact-requirement"
                />
              </label>

              <label className="citizen-field" htmlFor="applicant-contact-email">
                <span className="hcds-field-label-row">
                  <span>Địa chỉ Email</span>
                  {isProfileSyncedContact('email') && (
                    <VerifiedFieldBadge text="Đồng bộ từ hồ sơ cá nhân" />
                  )}
                </span>
                <input
                  id="applicant-contact-email"
                  type="email"
                  value={contact.email}
                  onChange={event => changeContact('email', event.target.value)}
                  maxLength={254}
                  autoComplete="email"
                  aria-describedby="contact-requirement"
                />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="citizen-form-section">
            <h2>3. {schema?.title}</h2>
            {proxy && (
              <p className="citizen-source-note">
                Bạn đang khai theo tư cách <b>Người nộp thay theo ủy quyền</b>.{' '}
                <button type="button" className="text-button" onClick={() => go(1)}>
                  Kiểm tra lại thông tin người ủy quyền tại Bước 2
                </button>
                .
              </p>
            )}
            {schema?.legalBasis && <p>{schema.legalBasis}</p>}
            {schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' && (
              <p className="citizen-source-note">
                Tải biểu mẫu gốc ở Bước 4 (Thành phần hồ sơ), kê khai đầy đủ, ký xác nhận theo quy định và đính kèm bản điện tử hoàn chỉnh.
              </p>
            )}

            <div className="citizen-form-grid">
              {fields.map(field => {
                const inputId = `field-${field.id}`
                const isLocked = field.id === 'registerAuthority'
                const isVerified = isProfileSyncedField(field.id)
                return (
                  <div
                    className={`citizen-field${
                      field.type === 'textarea' ||
                      field.id === 'submissionRole' ||
                      field.id === 'verificationMethod'
                        ? ' field-wide'
                        : ''
                    }`}
                    key={field.id}
                  >
                    <label htmlFor={inputId} className="hcds-field-label-row">
                      <span>
                        {field.label}
                        {field.required && <RequiredMark />}
                      </span>
                      {isVerified && <VerifiedFieldBadge text="Đồng bộ từ hồ sơ cá nhân" />}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        id={inputId}
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
                        id={inputId}
                        rows={4}
                        required={field.required}
                        maxLength={field.maxLength || 500}
                        value={effectiveValues[field.id] || ''}
                        onChange={event => changeValue(field.id, event.target.value)}
                      />
                    ) : (
                      <input
                        id={inputId}
                        type={field.type || 'text'}
                        readOnly={isLocked}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        maxLength={field.maxLength || 500}
                        value={effectiveValues[field.id] || ''}
                        onChange={event => changeValue(field.id, event.target.value)}
                      />
                    )}
                    {isLocked && (
                      <LockedFieldNotice>
                        Đồng bộ tự động theo cơ quan tiếp nhận đã chọn tại Bước 1.
                      </LockedFieldNotice>
                    )}
                    {field.help && <small>{field.help}</small>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="citizen-form-section">
            <h2>4. Đính kèm thành phần hồ sơ</h2>
            <p className="tabular-nums">
              Đính kèm tệp điện tử tương ứng với từng thành phần giấy tờ. {CITIZEN_UPLOAD_LIMIT_TEXT}
            </p>

            <div className="citizen-source-note" role="note">
              <b>Lưu ý khi lưu hồ sơ nháp:</b> Nội dung tờ khai và danh mục tên tệp đã chọn được lưu vào tài khoản. Tuy nhiên, nếu bạn đóng trình duyệt sau khi lưu nháp, bạn sẽ cần chọn lại tệp nhị phân từ thiết bị (hoặc từ kho tài liệu cá nhân) trước khi bấm gửi hồ sơ.
            </div>

            {schema?.formSourceUrl && (
              <p>
                <a href={schema.formSourceUrl} target="_blank" rel="noreferrer">
                  {schema.formSourceLabel ||
                    'Xem thành phần hồ sơ và tải biểu mẫu gốc trên Cổng chính thức'}
                </a>
              </p>
            )}

            {components.map(component => {
              const previouslyChosen = restoredAttachmentNames[component.id] || []
              const currentlyChosen = documents[component.id] || []
              const needsReselect = previouslyChosen.length > 0 && currentlyChosen.length === 0

              return (
                <div className="hcds-doc-flat-item" key={component.id}>
                  <div className="citizen-field">
                    <label htmlFor={`doc-${component.id}`}>
                      <b>
                        {component.label}
                        {component.required && <RequiredMark />}
                      </b>
                    </label>
                    {component.help && <small>{component.help}</small>}
                    {component.officialAttachmentNames?.length ? (
                      <small>
                        Biểu mẫu theo quy định:{' '}
                        {component.officialAttachmentNames.join('; ')}.
                      </small>
                    ) : null}

                    {needsReselect && (
                      <div className="hcds-amber-alert" role="status">
                        <div className="hcds-amber-alert__title">
                          <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
                          <span>
                            Tệp đã chọn trước khi đóng nháp (vui lòng chọn lại):{' '}
                            {previouslyChosen.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="hcds-draft-bar__actions">
                      <label className="file-picker-control" htmlFor={`doc-${component.id}`}>
                        <Upload size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>Chọn tệp từ thiết bị</span>
                        <input
                          id={`doc-${component.id}`}
                          type="file"
                          aria-required={component.required || undefined}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          multiple
                          onChange={event => {
                            const selectedFiles = Array.from(event.target.files || [])
                            setDocuments(old => ({
                              ...old,
                              [component.id]: selectedFiles,
                            }))
                            setValidationErrors([])
                            setKeys(null)
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        className="button secondary"
                        disabled={libraryLoading}
                        onClick={() => void openDocumentLibrary(component.id)}
                      >
                        <FolderOpen size={15} strokeWidth={1.75} aria-hidden="true" />
                        <span>Chọn từ kho tài liệu đã nộp</span>
                      </button>
                    </div>
                  </div>

                  {component.officialAttachments?.map(attachment => (
                    <p key={attachment.id}>
                      <a
                        className="text-link"
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText size={14} strokeWidth={1.75} aria-hidden="true" /> Tải mẫu:{' '}
                        {attachment.name}
                      </a>
                    </p>
                  ))}

                  {libraryComponent === component.id && (
                    <div className="profile-reuse">
                      <p>
                        Chọn tài liệu điện tử còn hiệu lực trong tài khoản của bạn để tái sử dụng cho thành phần hồ sơ này.
                      </p>
                      {libraryLoading ? (
                        <span role="status">Đang tải danh sách tài liệu…</span>
                      ) : libraryDocuments.length ? (
                        <>
                          <label
                            className="citizen-field"
                            htmlFor={`library-select-${component.id}`}
                          >
                            <span>Tài liệu lưu trong tài khoản</span>
                            <select
                              id={`library-select-${component.id}`}
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
                            Đính kèm tài liệu này
                          </button>
                        </>
                      ) : (
                        <p>Chưa có tài liệu nào được lưu trong kho cá nhân.</p>
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
                        Đóng kho tài liệu
                      </button>
                    </div>
                  )}

                  {currentlyChosen.map((file, fileIndex) => (
                    <div className="selected-document" key={`${file.name}-${fileIndex}`}>
                      <span className="tabular-nums">
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
                        <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" /> Gỡ tệp
                      </button>
                    </div>
                  ))}

                  {schema?.declarationMode === 'OFFICIAL_ATTACHMENTS' &&
                    !currentlyChosen.length && (
                      <label className="citizen-field" htmlFor={`exemption-${component.id}`}>
                        <span>Căn cứ không phải nộp / cơ quan khai thác dữ liệu có sẵn</span>
                        <textarea
                          id={`exemption-${component.id}`}
                          rows={2}
                          minLength={12}
                          maxLength={1200}
                          value={documentExemptions[component.id] || ''}
                          onChange={event => {
                            setDocumentExemptions(old => ({
                              ...old,
                              [component.id]: event.target.value,
                            }))
                            setValidationErrors([])
                            setKeys(null)
                          }}
                          placeholder="Ghi rõ trường hợp không áp dụng hoặc nguồn cơ sở dữ liệu quốc gia cơ quan được khai thác."
                        />
                      </label>
                    )}
                </div>
              )
            })}
          </section>
        )}

        {step === 4 && (
          <section className="citizen-form-section">
            <h2>5. Kiểm tra nội dung kê khai và xác nhận gửi hồ sơ</h2>
            <p>
              Đối chiếu kỹ từng mục dưới đây. Bấm <b>Thay đổi</b> tại dòng tương ứng nếu cần quay lại chỉnh sửa.
            </p>

            <dl className="hcds-kv-list" aria-label="Bảng kiểm tra thông tin hồ sơ trước khi gửi">
              <div className="hcds-kv-row">
                <dt>Thủ tục hành chính</dt>
                <dd>
                  <b>{procedure?.name}</b>{' '}
                  <span className="tabular-nums">({selectedCode})</span>
                </dd>
                <dd className="hcds-kv-action">
                  <button type="button" className="text-button" onClick={() => go(0)}>
                    Thay đổi
                  </button>
                </dd>
              </div>

              <div className="hcds-kv-row">
                <dt>Cơ quan tiếp nhận</dt>
                <dd>{effectiveAgency}</dd>
                <dd className="hcds-kv-action">
                  <button type="button" className="text-button" onClick={() => go(0)}>
                    Thay đổi
                  </button>
                </dd>
              </div>

              <div className="hcds-kv-row">
                <dt>Người yêu cầu</dt>
                <dd>
                  {contact.name} (
                  {applicantType === 'organization' ? 'Tổ chức / Doanh nghiệp' : 'Cá nhân'})
                </dd>
                <dd className="hcds-kv-action">
                  <button type="button" className="text-button" onClick={() => go(1)}>
                    Thay đổi
                  </button>
                </dd>
              </div>

              <div className="hcds-kv-row">
                <dt>Thông tin liên hệ</dt>
                <dd className="tabular-nums">
                  {[contact.phone, contact.email].filter(Boolean).join(' · ') || 'Chưa cung cấp'}
                </dd>
                <dd className="hcds-kv-action">
                  <button type="button" className="text-button" onClick={() => go(1)}>
                    Thay đổi
                  </button>
                </dd>
              </div>

              {fields.map(field => (
                <div className="hcds-kv-row" key={field.id}>
                  <dt>{field.label}</dt>
                  <dd>{effectiveValues[field.id] || 'Không kê khai'}</dd>
                  <dd className="hcds-kv-action">
                    <button type="button" className="text-button" onClick={() => go(2)}>
                      Thay đổi
                    </button>
                  </dd>
                </div>
              ))}

              {components.map(component => (
                <div className="hcds-kv-row" key={component.id}>
                  <dt>{component.label}</dt>
                  <dd>
                    {(documents[component.id] || []).map(file => file.name).join(', ') ||
                      documentExemptions[component.id] ||
                      'Không đính kèm'}
                  </dd>
                  <dd className="hcds-kv-action">
                    <button type="button" className="text-button" onClick={() => go(3)}>
                      Thay đổi
                    </button>
                  </dd>
                </div>
              ))}
            </dl>

            <label className="citizen-field" htmlFor="submission-delivery-method">
              <span>
                Phương thức nhận kết quả giải quyết
                <RequiredMark />
              </span>
              <select
                id="submission-delivery-method"
                required
                value={delivery}
                onChange={event => {
                  setDelivery(event.target.value)
                  setValidationErrors([])
                  setKeys(null)
                }}
              >
                <option value="">Chọn phương thức nhận kết quả</option>
                {schema?.deliveryMethods.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {schema?.deliveryNote && <small>{schema.deliveryNote}</small>}
            </label>

            {delivery === 'Bưu chính' && (
              <div className="citizen-field">
                <label htmlFor="submission-delivery-address" className="hcds-field-label-row">
                  <span>
                    Địa chỉ nhận kết quả qua dịch vụ bưu chính
                    <RequiredMark />
                  </span>
                  {isProfileSyncedDelivery() && (
                    <VerifiedFieldBadge text="Đồng bộ từ hồ sơ cá nhân" />
                  )}
                </label>
                <textarea
                  id="submission-delivery-address"
                  required
                  minLength={10}
                  maxLength={500}
                  value={deliveryAddress}
                  onChange={event => {
                    edited.current.delivery = true
                    setDeliveryAddress(event.target.value)
                    setConfirmed(false)
                    setValidationErrors([])
                    setKeys(null)
                  }}
                />
              </div>
            )}

            {schema?.feeText && <p className="tabular-nums">{schema.feeText}</p>}

            <label className="citizen-consent" htmlFor="submission-confirm-checkbox">
              <input
                id="submission-confirm-checkbox"
                type="checkbox"
                required
                checked={confirmed}
                onChange={event => {
                  setConfirmed(event.target.checked)
                  setValidationErrors([])
                }}
              />
              <span>
                Tôi cam đoan toàn bộ thông tin kê khai và tài liệu đính kèm là đúng sự thật, chịu trách nhiệm trước pháp luật về nội dung hồ sơ.
                <RequiredMark />
              </span>
            </label>

            {!hasIntake && (
              <p className="form-error">
                Cơ quan chưa có tài khoản tiếp nhận còn hiệu lực. Bạn có thể lưu nháp hồ sơ và gửi lại sau khi đơn vị hoàn tất phân quyền tiếp nhận.
              </p>
            )}

            <p className="citizen-source-note">
              Hồ sơ sau khi gửi sẽ được cấp Mã hồ sơ và chuyển vào hàng đợi kiểm tra tính đầy đủ, hợp lệ của Bộ phận Một cửa.
            </p>
          </section>
        )}

        <div className="citizen-form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => go(step - 1)}
            >
              Quay lại bước trước
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
            {busy ? 'Đang gửi hồ sơ…' : step === 4 ? 'Xác nhận và gửi hồ sơ' : 'Tiếp tục'}
          </button>
          <span className="tabular-nums">
            Bước {step + 1} / 5 · {step < 4 ? 'Chưa gửi hồ sơ' : 'Chỉ gửi khi xác nhận'}
          </span>
        </div>
      </form>
    </section>
  )
}

export default CitizenApplicationForm
