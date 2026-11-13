import QRCode from 'qrcode'
import { channelNames } from './portalUtils'
import type { CaseFile } from './types'

export type OfficialSlipKind = 'MAU_01' | 'MAU_02' | 'MAU_03' | 'MAU_04' | 'MAU_05' | 'MAU_06'

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c,
  )

const value = (text: unknown) => escapeHtml(text || '………………………………')

const date = (input?: string) => {
  if (!input) return '………………………………'
  const parsed = new Date(input)
  return Number.isNaN(parsed.getTime())
    ? escapeHtml(input)
    : escapeHtml(
        parsed.toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          ...(input.includes('T')
            ? { dateStyle: 'short', timeStyle: 'short' }
            : { dateStyle: 'short' }),
        }),
      )
}

const field = (label: string, contents: unknown) =>
  `<p><b>${escapeHtml(label)}:</b> ${value(contents)}</p>`

function buildInlineQrSvg(code: string, size = 76): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8766'
  const url = `${origin}/tra-cuu-ho-so?code=${encodeURIComponent(code)}`
  const modules = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules
  const rects: string[] = []
  for (let r = 0; r < modules.size; r++) {
    for (let c = 0; c < modules.size; c++) {
      if (modules.get(r, c)) {
        rects.push(`<rect x="${c + 4}" y="${r + 4}" width="1" height="1" fill="#000000" />`)
      }
    }
  }
  const viewSize = modules.size + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges" role="img" aria-label="Mã QR tra cứu hồ sơ ${escapeHtml(code)}"><rect width="${viewSize}" height="${viewSize}" fill="#ffffff" stroke="#000000" stroke-width="0.5" />${rects.join('')}</svg>`
}

function formatDeliveryMethod(raw?: string, address?: string): string {
  if (!raw) return ''
  const friendly = channelNames[raw] || raw
  return address ? `${friendly} (${address})` : friendly
}

/**
 * Printable A4 statutory draft compliant with Decree 30/2020/NĐ-CP & Circular 01/2023/TT-VPCP.
 * Populated solely from recorded data; never represents an externally signed legal instrument.
 */
export function renderOfficialDraft(
  kind: OfficialSlipKind,
  item: CaseFile,
  options?: { autoPrint?: boolean },
): string {
  const autoPrint = options?.autoPrint ?? true
  const acceptedDate = item.acceptedAt ? new Date(item.acceptedAt) : null
  const acceptedDay =
    acceptedDate && !Number.isNaN(acceptedDate.getTime())
      ? new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(acceptedDate)
      : ''
  const prior = Boolean(acceptedDay && acceptedDay < '2026-10-10')
  const unknownDate = !acceptedDay
  const law = prior ? '03/2025/TT-VPCP' : '13/2026/TT-BTP'
  const number = kind === 'MAU_06' && prior ? '05' : kind.slice(-2)
  const applicant = item.applicant || { name: '', phone: '', email: '' }
  const agency = item.receivingAgency || item.agencyScope || item.procedure?.agency
  const withdrawal = item.withdrawal || {}
  const extension = item.forms?.mau04

  const identity = [
    field('Hồ sơ của Ông (Bà)/Tổ chức', applicant.name),
    field('Số định danh cá nhân/tổ chức', applicant.citizenId),
    field('Địa chỉ', applicant.address),
    field('Số điện thoại', applicant.phone),
    field('Email', applicant.email),
    field('Mã số hồ sơ', item.code),
  ].join('')

  const procedure = field('Nội dung yêu cầu giải quyết', item.procedure?.name)
  let title = ''
  let body = ''
  let signer = 'NGƯỜI TIẾP NHẬN HỒ SƠ'

  switch (kind) {
    case 'MAU_01': {
      title = 'GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ'
      const docs = [item.paperOriginals, ...(item.attachments || []).map(f => f.name)].filter(
        Boolean,
      )
      body = `${field('Cơ quan tiếp nhận', agency)}${identity}${procedure}${field('Mã thủ tục hành chính', item.procedureCode)}<p><b>Thành phần hồ sơ nộp gồm:</b></p>${docs.length ? `<ol>${docs.map(doc => `<li>${value(doc)}</li>`).join('')}</ol>` : '<p>………………………………</p>'}${field('Số lượng hồ sơ (bộ)', '01')}${field('Cơ quan có thẩm quyền giải quyết', item.procedure?.agency)}${field('Thời gian giải quyết theo quy định', item.deadlineNote)}<p><b>Thời gian nhận hồ sơ:</b> ${date(item.acceptedAt || item.createdAt)}</p><p><b>Thời gian hẹn trả kết quả:</b> ${date(item.deadline)}</p>${field('Đăng ký nhận kết quả', formatDeliveryMethod(item.deliveryMethod, item.deliveryAddress))}${field('Sổ theo dõi hồ sơ, số thứ tự', '')}`
      break
    }
    case 'MAU_02': {
      title = 'PHIẾU YÊU CẦU BỔ SUNG, HOÀN THIỆN HỒ SƠ'
      const entries = item.supplement?.items || []
      body = `${identity}${procedure}<p><b>Nội dung cần bổ sung, hoàn thiện:</b></p>${entries.length ? `<ol>${entries.map(entry => `<li>${value(entry)}</li>`).join('')}</ol>` : '<p>………………………………</p>'}<p><b>Thời hạn hoàn thành bổ sung:</b> ${date(item.supplementDueAt || item.supplement?.dueAt)}</p>${field('Căn cứ / Lý do yêu cầu bổ sung', item.supplement?.reason)}${field('Cán bộ hướng dẫn, điện thoại liên hệ', 'Tổng đài 024 1022')}"`
      body = body.replace(/"$/, '')
      signer = 'NGƯỜI HƯỚNG DẪN'
      break
    }
    case 'MAU_03':
      title = 'PHIẾU TỪ CHỐI TIẾP NHẬN GIẢI QUYẾT HỒ SƠ'
      body = `${identity}${procedure}${field('Lý do không tiếp nhận giải quyết', item.publicNote)}<p>Cơ quan tiếp nhận thông báo để Ông (Bà)/Tổ chức được biết và phối hợp thực hiện theo quy định.</p>`
      break
    case 'MAU_04':
      title = 'PHIẾU XIN LỖI VÀ HẸN LẠI NGÀY TRẢ KẾT QUẢ'
      body = `<p><b>Kính gửi:</b> ${value(applicant.name)}</p>${identity}${procedure}<p><b>Thời gian hẹn trả kết quả đã thông báo:</b> ${date(extension?.previousDeadline)}</p>${field('Nguyên nhân chậm trễ', extension?.reason)}<p>${value(agency)} trân trọng xin lỗi Ông (Bà)/Tổ chức vì sự chậm trễ nêu trên và hẹn lại thời gian trả kết quả giải quyết hồ sơ vào ngày: <b>${date(extension?.newDeadline)}</b>.</p>`
      signer = 'THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ'
      break
    case 'MAU_05':
      title = 'PHIẾU YÊU CẦU RÚT / DỪNG GIẢI QUYẾT HỒ SƠ'
      body = `<p><b>Kính gửi:</b> ${value(agency)}</p><h2>I. THÔNG TIN NGƯỜI YÊU CẦU</h2>${field('Họ và tên', withdrawal.requesterName || applicant.name)}${field('Số định danh cá nhân/tổ chức', withdrawal.requesterIdentifier || applicant.citizenId)}${field('Địa chỉ', withdrawal.requesterAddress || applicant.address)}${field('Số điện thoại', withdrawal.requesterPhone || applicant.phone)}${field('Email', withdrawal.requesterEmail || applicant.email)}<h2>II. NỘI DUNG ĐỀ NGHỊ</h2>${field('Mã số hồ sơ', item.code)}${procedure}${field('Lý do đề nghị dừng giải quyết', withdrawal.reason)}<p>Đề nghị cơ quan tiếp nhận xem xét dừng giải quyết hồ sơ theo nguyện vọng.</p>`
      signer = 'NGƯỜI YÊU CẦU'
      break
    case 'MAU_06':
      title = 'THÔNG BÁO DỪNG GIẢI QUYẾT HỒ SƠ'
      body = `${field('Cơ quan tiếp nhận', agency)}${identity}${procedure}<p><b>Ngày tiếp nhận yêu cầu dừng:</b> ${date(withdrawal.requestReceivedAt)}</p>${field('Người đề nghị dừng', withdrawal.requesterName || applicant.name)}${field('Lý do dừng giải quyết', withdrawal.reason)}${field('Nơi liên hệ nhận lại hồ sơ gốc và chứng từ phí/lệ phí (nếu có)', withdrawal.collectionOffice || agency)}`
      signer = 'THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ'
      break
  }

  const transitional = unknownDate
    ? 'Chưa xác định thời điểm tiếp nhận chính thức; cần đối chiếu quy định chuyển tiếp và mẫu áp dụng.'
    : prior
      ? 'Hồ sơ tiếp nhận trước 10/10/2026: cần đối chiếu quy định chuyển tiếp và bản gốc của hồ sơ.'
      : ''

  const heading =
    kind === 'MAU_05'
      ? ''
      : `<div><b class="agency-upper">${value(agency)}</b><hr><p>Số: ………/………</p></div>`

  const qrSection = item.code
    ? `<div class="qr-box">${buildInlineQrSvg(item.code, 72)}<div class="qr-caption"><b>TRA CỨU TIẾN ĐỘ TRỰC TUYẾN</b><span>Mã hồ sơ: ${escapeHtml(item.code)}</span><span>Quét mã QR hoặc truy cập /tra-cuu-ho-so</span></div></div>`
    : ''

  const autoScript = autoPrint ? `<script>window.onload=()=>window.print()</script>` : ''

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(title)} - ${value(item.code)}</title><style>
  @page{size:A4;margin:20mm 15mm 20mm 30mm}
  body{margin:0;padding:${autoPrint ? '0' : '16mm 14mm 16mm 22mm'};background:#ffffff;color:#000000;font:13pt/1.45 "Times New Roman","Tinos",Times,serif}
  .notice{border:1px dashed #333;padding:5pt 8pt;margin-bottom:10pt;text-align:center;font-size:10pt}
  .top-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:8pt;font-size:10.5pt}
  .number{font-style:italic;margin:0}
  .head{display:grid;grid-template-columns:1fr 1.25fr;gap:14pt;text-align:center;margin-bottom:12pt}
  .head.one{grid-template-columns:1fr}
  .head p{margin:4pt 0;font-size:12pt}
  .head hr{width:44%;border:0;border-top:1px solid #000;margin:4pt auto}
  .head b{font-size:12pt}
  .agency-upper{text-transform:uppercase}
  .motto-sub{font-size:13pt}
  .title{text-align:center;font-size:14pt;font-weight:bold;margin:14pt 0 12pt;text-transform:uppercase}
  .content p{margin:0 0 6pt;overflow-wrap:anywhere}
  .content h2{font-size:12.5pt;margin:10pt 0 4pt}
  .content ol{margin:0 0 8pt;padding-left:22pt}
  .content li{margin-bottom:3pt}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16pt;margin-top:18pt;break-inside:avoid}
  .qr-box{display:flex;align-items:center;gap:8pt;border:1px solid #000;padding:5pt 7pt;max-width:52%}
  .qr-caption{font-size:9.5pt;line-height:1.35}
  .qr-caption b,.qr-caption span{display:block}
  .sign{margin-left:auto;width:45%;text-align:center}
  .sign span{display:block;font-style:italic;font-size:11pt;margin-top:2pt}
  .sign-space{height:48pt}
  .transition{font-size:10pt;margin-top:12pt;font-style:italic}
  @media print{body{padding:0}}
  </style></head><body>
  <div class="notice">BẢN DỰ THẢO TRÍCH XUẤT TỪ HỆ THỐNG — CHƯA KÝ PHÁT HÀNH CHÍNH THỨC</div>
  <div class="top-meta"><span>Hệ thống Thông tin Giải quyết TTHC TP. Hà Nội</span><p class="number">${unknownDate || (kind === 'MAU_05' && prior) ? 'Cần đối chiếu số hiệu mẫu áp dụng' : `Mẫu số ${number} (${law})`}</p></div>
  <header class="head ${kind === 'MAU_05' ? 'one' : ''}">${heading}<div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b class="motto-sub">Độc lập - Tự do - Hạnh phúc</b><hr><p><i>Hà Nội, ngày …… tháng …… năm 20……</i></p></div></header>
  <h1 class="title">${escapeHtml(title)}</h1>
  <div class="content">${body}</div>
  <div class="footer-row">${qrSection}<div class="sign"><b>${signer}</b><span>(Ký, ghi rõ họ tên hoặc ký số theo quy định)</span><div class="sign-space"></div></div></div>
  ${transitional ? `<p class="transition">${escapeHtml(transitional)}</p>` : ''}
  ${autoScript}</body></html>`
}
