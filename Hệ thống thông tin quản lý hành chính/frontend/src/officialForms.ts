import type { CaseFile } from './types'

export type OfficialSlipKind = 'MAU_01' | 'MAU_02' | 'MAU_03' | 'MAU_04' | 'MAU_05' | 'MAU_06'

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c)
const value = (text: unknown) => escapeHtml(text || '………………………………')
const date = (input?: string) => {
  if (!input) return '………………………………'
  const parsed = new Date(input)
  return Number.isNaN(parsed.getTime()) ? escapeHtml(input) : escapeHtml(parsed.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', ...(input.includes('T') ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }) }))
}
const field = (label: string, contents: unknown) => `<p>${escapeHtml(label)}: ${value(contents)}</p>`

/** Printable draft populated solely from recorded data; never represents a signed document. */
export function renderOfficialDraft(kind: OfficialSlipKind, item: CaseFile): string {
  const acceptedDate = item.acceptedAt ? new Date(item.acceptedAt) : null
  const acceptedDay = acceptedDate && !Number.isNaN(acceptedDate.getTime())
    ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(acceptedDate)
    : ''
  const prior = Boolean(acceptedDay && acceptedDay < '2026-10-10')
  const unknownDate = !acceptedDay
  const law = prior ? '03/2025/TT-VPCP' : '13/2026/TT-BTP'
  const number = kind === 'MAU_06' && prior ? '05' : kind.slice(-2)
  const applicant = item.applicant || { name: '', phone: '', email: '' }
  const agency = item.receivingAgency || item.agencyScope || item.procedure?.agency
  const withdrawal = item.withdrawal || {}
  const extension = item.forms?.mau04
  const identity = [field('Hồ sơ của Ông (Bà)/Tổ chức', applicant.name), field('Số định danh cá nhân/tổ chức', applicant.citizenId), field('Địa chỉ', applicant.address), field('Số điện thoại', applicant.phone), field('Email', applicant.email), field('Mã số hồ sơ', item.code)].join('')
  const procedure = field('Nội dung yêu cầu giải quyết', item.procedure?.name)
  let title = ''
  let body = ''
  let signer = 'NGƯỜI TIẾP NHẬN HỒ SƠ'
  switch (kind) {
    case 'MAU_01': {
      title = 'GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ'
      const docs = [item.paperOriginals, ...(item.attachments || []).map(f => f.name)].filter(Boolean)
      body = `${field('Mã số hồ sơ', item.code)}${field('Cơ quan tiếp nhận', agency)}${identity}${procedure}${field('Mã thủ tục hành chính', item.procedureCode)}<p>Thành phần hồ sơ nộp gồm:</p>${docs.length ? `<ol>${docs.map(doc => `<li>${value(doc)}</li>`).join('')}</ol>` : '<p>………………………………</p>'}${field('Số lượng hồ sơ (bộ)', '')}${field('Cơ quan có thẩm quyền giải quyết', item.procedure?.agency)}${field('Thời gian giải quyết theo quy định', item.deadlineNote)}<p>Thời gian nhận hồ sơ: ${date(item.acceptedAt)}</p><p>Thời gian trả kết quả: ${date(item.deadline)}</p>${field('Đăng ký nhận kết quả tại', item.deliveryMethod)}${field('Sổ theo dõi hồ sơ, số thứ tự', '')}`
      break
    }
    case 'MAU_02': {
      title = 'PHIẾU YÊU CẦU BỔ SUNG, HOÀN THIỆN HỒ SƠ'
      const entries = item.supplement?.items || []
      body = `${identity}${procedure}<p>Nội dung cần bổ sung, hoàn thiện:</p>${entries.length ? `<ol>${entries.map(entry => `<li>${value(entry)}</li>`).join('')}</ol>` : '<p>………………………………</p>'}<p>Thời hạn hoàn thành bổ sung: ${date(item.supplementDueAt || item.supplement?.dueAt)}</p>${field('Lý do', item.supplement?.reason)}${field('Liên hệ hướng dẫn, số điện thoại', '')}`
      signer = 'NGƯỜI HƯỚNG DẪN'
      break
    }
    case 'MAU_03':
      title = 'PHIẾU TỪ CHỐI TIẾP NHẬN GIẢI QUYẾT HỒ SƠ'
      body = `${identity}${procedure}${field('Lý do không tiếp nhận', item.publicNote)}<p>Thông báo để người nộp hồ sơ biết và phối hợp thực hiện.</p>`
      break
    case 'MAU_04':
      title = 'VĂN BẢN XIN LỖI VÀ ĐỀ NGHỊ GIA HẠN THỜI GIAN GIẢI QUYẾT'
      body = `<p>Kính gửi: ${value(applicant.name)}</p>${identity}${procedure}<p>Thời gian hẹn trả kết quả đã thông báo: ${date(extension?.previousDeadline)}</p>${field('Lý do chậm trễ', extension?.reason)}<p>${value(agency)} xin lỗi vì sự chậm trễ và đề nghị hẹn lại ngày trả kết quả: ${date(extension?.newDeadline)}</p>`
      signer = 'THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ'
      break
    case 'MAU_05':
      title = 'VĂN BẢN YÊU CẦU DỪNG GIẢI QUYẾT HỒ SƠ'
      body = `<p>Kính gửi: ${value(agency)}</p><h2>I. NGƯỜI YÊU CẦU</h2>${field('Họ và tên', withdrawal.requesterName)}${field('Số định danh cá nhân/tổ chức', withdrawal.requesterIdentifier)}${field('Địa chỉ', withdrawal.requesterAddress)}${field('Số điện thoại', withdrawal.requesterPhone)}${field('Email', withdrawal.requesterEmail)}<h2>II. NỘI DUNG YÊU CẦU</h2>${field('Mã hồ sơ', item.code)}${procedure}${field('Lý do đề nghị dừng', withdrawal.reason)}<p>Đề nghị cơ quan tiếp nhận xem xét yêu cầu dừng giải quyết hồ sơ.</p>`
      signer = 'NGƯỜI YÊU CẦU'
      break
    case 'MAU_06':
      title = 'THÔNG BÁO DỪNG GIẢI QUYẾT HỒ SƠ'
      body = `${field('Cơ quan tiếp nhận', agency)}${identity}${procedure}<p>Ngày tiếp nhận yêu cầu dừng: ${date(withdrawal.requestReceivedAt)}</p>${field('Người yêu cầu', withdrawal.requesterName)}${field('Lý do đề nghị dừng', withdrawal.reason)}${field('Nơi liên hệ nhận lại hồ sơ giấy và phí, lệ phí nếu có', withdrawal.collectionOffice)}`
      signer = 'THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ'
      break
  }
  const transitional = unknownDate ? 'Chưa xác định thời điểm tiếp nhận; cần đối chiếu quy định chuyển tiếp và mẫu áp dụng.' : prior ? 'Hồ sơ tiếp nhận trước 10/10/2026: cần đối chiếu quy định chuyển tiếp và bản gốc của hồ sơ.' : ''
  const heading = kind === 'MAU_05' ? '' : `<div><b>${value(agency)}</b><hr><p>Số: ………………………</p></div>`
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(title)} - ${value(item.code)}</title><style>
  @page{size:A4;margin:20mm 20mm 20mm 30mm}body{margin:0;color:#000;font:13pt/1.45 'Times New Roman',serif}.notice{border:1px solid #000;padding:6pt;margin-bottom:12pt;text-align:center;font-size:10pt}.number{text-align:right;font-style:italic}.head{display:grid;grid-template-columns:1fr 1.2fr;gap:16pt;text-align:center}.head.one{grid-template-columns:1fr}.head p{margin:5pt 0}.head hr{width:50%;border:0;border-top:1px solid #000}.head b{font-size:12pt}.title{text-align:center;font-size:14pt;margin:16pt 0}.content p{margin:0 0 6pt;overflow-wrap:anywhere}.content h2{font-size:13pt;margin:10pt 0 4pt}.content ol{margin:0 0 8pt;padding-left:24pt}.sign{margin-top:16pt;margin-left:auto;width:48%;text-align:center;break-inside:avoid}.sign span{display:block;font-style:italic}.transition{font-size:10pt;margin-top:12pt} </style></head><body>
  <div class="notice">BẢN DỰ THẢO THAM KHẢO — CHƯA KÝ, CHƯA CÓ GIÁ TRỊ PHÁT HÀNH</div><p class="number">${unknownDate || (kind === 'MAU_05' && prior) ? 'Cần đối chiếu số hiệu mẫu áp dụng' : `Mẫu số ${number} · ${law}`}</p><header class="head ${kind === 'MAU_05' ? 'one' : ''}">${heading}<div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</b><hr><p>………, ngày …… tháng …… năm ………</p></div></header>
  <h1 class="title">${escapeHtml(title)}</h1><div class="content">${body}</div><div class="sign"><b>${signer}</b><span>(Ký và ghi rõ họ tên hoặc chữ ký số nếu là biểu mẫu điện tử)</span></div>${transitional ? `<p class="transition">${escapeHtml(transitional)}</p>` : ''}<script>window.onload=()=>window.print()</script></body></html>`
}
