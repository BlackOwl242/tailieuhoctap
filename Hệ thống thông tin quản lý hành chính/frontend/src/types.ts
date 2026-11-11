export type ApiRequest = <T>(path: string, body?: unknown, signal?: AbortSignal) => Promise<T>

export const CITIZEN_UPLOAD_MAX_FILES = 8
export const CITIZEN_UPLOAD_MAX_FILE_BYTES = 8 * 1024 * 1024
export const CITIZEN_UPLOAD_MAX_TOTAL_BYTES = 9 * 1024 * 1024
export const CITIZEN_UPLOAD_LIMIT_TEXT =
  'Định dạng PDF, DOC, DOCX, PNG, JPG, JPEG; tối đa 8 tệp mỗi lần gửi, mỗi tệp không quá 8 MB và tổng dung lượng không vượt quá 9 MB.'

export const identityTypes = [
  'Thẻ căn cước',
  'Thẻ căn cước công dân',
  'Giấy chứng nhận căn cước',
  'Hộ chiếu',
  'Giấy tờ xuất nhập cảnh hoặc đi lại quốc tế',
] as const

export type DetailKey =
  | 'name'
  | 'phone'
  | 'email'
  | 'dateOfBirth'
  | 'gender'
  | 'nationality'
  | 'identityType'
  | 'identityNumber'
  | 'identityDate'
  | 'identityPlace'
  | 'permanentProvince'
  | 'permanentCommune'
  | 'permanentStreet'
  | 'contactProvince'
  | 'contactCommune'
  | 'contactStreet'

export type CitizenProfile = Record<DetailKey, string> & {
  sameContactAddress: boolean
  version: number
  updatedAt: string
  verificationStatus: string
  permanentAddress: string
  contactAddress: string
  missingFields: string[]
}

export type SubmissionCondition = {
  field: string
  equals?: string
  not?: string
}

export type SubmissionField = {
  id: string
  label: string
  type?: string
  required?: boolean
  options?: string[]
  applicantTypes?: string[]
  when?: SubmissionCondition
  maxLength?: number
  min?: number
  max?: number
  help?: string
  officialAttachmentNames?: string[]
  officialAttachments?: { id: string; name: string; url: string }[]
  templateSourceUrl?: string
}

export type SubmissionSchema = {
  version: string
  title: string
  sourceUrl: string
  formSourceUrl?: string
  formSourceLabel?: string
  sourceStatus?: string
  declarationMode?: string
  officialSteps?: { id: string; name: string; description: string }[]
  conditions?: string
  legalBasis: string
  deadlineText: string
  feeText: string
  fields: SubmissionField[]
  documents: SubmissionField[]
  deliveryMethods: string[]
  deliveryNote: string
}

export type User = {
  id: string
  email: string
  phone: string
  name: string
  role: string
  emailVerified: boolean
  agencyScope?: string
  validFrom?: string
  validUntil?: string
  maySignStop?: boolean
  maySignSandbox?: boolean
  signingAuthorityRef?: string
  mustChangePassword?: boolean
  canManageAgencyAccounts?: boolean
}

export type ProcedureEditMeta = {
  sourceUrl: string
  checkedAt: string
  reason: string
  version: number
  updatedBy: string
  updatedAt: string
}

export type Procedure = {
  ref?: string
  sourceCode?: string
  code: string
  name: string
  field: string
  categoryKey?: string
  categoryEdit?: ProcedureEditMeta
  level: string
  executionLevel?: string
  agency: string
  verified?: boolean
  submissionEnabled?: boolean
  counterEnabled?: boolean
  submissionDisabledReason?: string
  serviceMode?: string
  submission?: SubmissionSchema
  localEdit?: ProcedureEditMeta
  routing?: {
    mode?: string
    status?: string
    summary?: string
    officialUrl?: string
    checkedAt?: string
    officialAgencyHints?: string[]
    observedAuthorities?: { locality?: string; authority: string }[]
  }
}

export type ProcedureCategory = {
  key: string
  name: string
  count: number
  source: 'reference' | 'internal'
  procedures: Procedure[]
  categoryEdit?: ProcedureEditMeta | null
}

export type Mau04ExtensionRecord = {
  issuedAt?: string
  issuedBy?: string
  previousDeadline?: string
  newDeadline?: string
  addDays?: number
  reason?: string
  number?: string
}

export type CaseFile = {
  code: string
  procedureCode: string
  procedure: Procedure
  status: string
  statusLabel: string
  version: number
  createdAt: string
  updatedAt?: string
  acceptedAt?: string
  deadline?: string
  deadlineNote?: string
  supplementDueAt?: string
  receivingAgency?: string
  agencyScope?: string
  submissionChannel?: string
  deliveryMethod?: string
  deliveryAddress?: string
  requestSummary?: string
  paperOriginals?: string
  publicNote?: string
  proposedDecision?: string
  canManageLookupKey?: boolean
  sampleData?: boolean
  sampleDataNote?: string
  feedbackSubmitted?: boolean
  applicant: {
    name: string
    phone: string
    email: string
    citizenId?: string
    address?: string
  }
  subject?: {
    name: string
    relation: string
  }
  events: {
    title: string
    detail: string
    at: string
    audience: string
    actor?: string
    role?: string
    action?: string
    id?: string
  }[]
  supplement?: {
    reason: string
    resumeStatus?: string
    items?: string[]
    citizenNote?: string
    respondedAt?: string
    requestedAt?: string
    dueAt?: string
    noticeDocument?: { name: string; url?: string; downloadUrl?: string }
  }
  forms?: {
    mau04?: Mau04ExtensionRecord
    [key: string]: unknown
  }
  draftResult?: string
  approvalNote?: string
  approvedAt?: string
  approvedById?: string
  resultIssuedAt?: string
  decisionIssuedAt?: string
  resultNoticeIssuedAt?: string
  result?: {
    number: string
    content: string
    issuedAt?: string
    document?: { name: string; url?: string; downloadUrl?: string }
    files?: {
      id?: string
      name: string
      storedName?: string
      size?: number
      type?: string
      uploadedAt?: string
      downloadUrl?: string
    }[]
    signature?: {
      verified: boolean
      documentHash: string
      signer: string
      signedAt: string
    }
  }
  attachments?: { name: string; url?: string; downloadUrl?: string }[]
  [key: string]: any
}

export type Index766Summary = {
  transparency?: number
  progress?: number
  onlineService?: number
  onlineAndPayment?: number
  digitization?: number
  satisfaction?: number
  total?: number
  totalScore?: number
  classification?: string
}

export type PeriodBalanceSummary = {
  opening?: number
  openingBacklog?: number
  received?: number
  receivedInPeriod?: number
  resolvedOnTime?: number
  resolvedOverdue?: number
  stoppedOrRejected?: number
  closing?: number
  closingBacklog?: number
}

export type Bootstrap = {
  user?: User
  procedures: Procedure[]
  procedureCategories?: ProcedureCategory[]
  cases: CaseFile[]
  stats: {
    total?: number
    open?: number
    waiting?: number
    supplement?: number
    review?: number
    overdue?: number
    byStatus?: Record<string, number>
    index766?: Index766Summary
    periodBalance?: PeriodBalanceSummary
  }
  storage?: {
    database: string
    procedureCount: number
    caseRecords: number
    sampleCaseCount?: number
    sampleDataVersion?: number
    publishedNews: number
    caseCountScope: string
  }
  statusLabels: Record<string, string>
  staff?: { id: string; name: string; role: string }[]
  feedback?: { code: string; score: number; content: string; created_at: string }[]
  outbox?: { code: string; status: string; attempts: number; lastError?: string; messageId?: string }[]
}

export type ManagedUser = {
  id: string
  email: string
  phone: string
  name: string
  role: string
  active: boolean
  agencyScope: string
  validFrom: string
  validUntil: string
  maySignStop: boolean
  signingAuthorityRef: string
  mustChangePassword?: boolean
  canManageAgencyAccounts?: boolean
  createdAt: string
}

export type StaffAccessRequest = {
  id: string
  userId: string
  email: string
  name: string
  requestedBy: string
  requestedById: string
  role: string
  agencyScope: string
  validFrom: string
  validUntil: string
  maySignStop: boolean
  signingAuthorityRef: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy?: string
  reviewNote: string
  createdAt: string
  reviewedAt?: string
}

export type AccountAccess = {
  role: string
  active: boolean
  agencyScope: string
  validFrom: string
  validUntil: string
  canManageAgencyAccounts?: boolean
}

export type StaffAccountChange = {
  id: string
  userId: string
  email: string
  name: string
  requestedBy: string
  requestedById: string
  before: AccountAccess
  proposed: AccountAccess
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy?: string
  reviewNote: string
  createdAt: string
  reviewedAt?: string
}

export type ManagedNews = {
  id: string
  title: string
  summary: string
  body: string
  category: string
  image: string
  sourceUrl: string
  featured: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string
  date?: string
  version: number
  updatedAt: string
}

export type SubmissionReceipt = {
  code: string
  accessKey?: string
  status?: string
  statusLabel?: string
  duplicate?: boolean
}

export type PublicStatusCheck = {
  code: string
  procedureCode?: string
  procedureName?: string
  receivingAgency?: string
  status: string
  statusLabel: string
  createdAt?: string
  acceptedAt?: string
  deadline?: string
  deadlineNote?: string
  supplementDueAt?: string
  updatedAt?: string
  hasMau04Extension?: boolean
  sampleData?: boolean
}

export type PortalRoute =
  | 'citizen-profile'
  | 'citizen-login'
  | 'public'
  | 'staff'
  | 'guide'
  | 'catalog'
  | 'submit'
  | 'track'
  | 'citizen-services'
  | 'not-found'

export type PublicView = 'public' | 'catalog' | 'submit' | 'track' | 'receipt'

export type QueueFocus = {
  statuses?: string[]
  deadlineFilter?: string
  assigneeFilter?: string
  agencyFilter?: string
  procedureCode?: string
  updatedSince?: string
  createdFrom?: string
  createdTo?: string
  label?: string
}
