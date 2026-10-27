import { getOrgConfig, isEnterpriseSector } from '@/lib/org-config';

export interface TableOutput {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  scope?: string;
}

/** Print a data snapshot without inheriting the application's print visibility rules. */
export async function printTableOutput(output: TableOutput): Promise<void> {
  const frame = document.createElement('iframe');
  frame.title = 'Bản in bảng dữ liệu';
  frame.dataset.tablePrint = 'true';
  Object.assign(frame.style, { position: 'fixed', left: '-10000px', top: '0', width: '297mm', height: '210mm', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const printWindow = frame.contentWindow;
  if (!doc || !printWindow) { frame.remove(); throw new Error('Không thể tạo bản in. Vui lòng thử lại.'); }
  const config = getOrgConfig();
  const enterprise = isEnterpriseSector(config);
  const landscape = output.headers.length >= 5 || output.headers.some(header => /việc cần xử lý|ghi chú|diễn giải|mô tả/i.test(header));
  const addSerial = !output.headers.some(header => /^(stt|số thứ tự)$/i.test(header.trim()));
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  doc.open();
  doc.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>
    @page {
      size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 18mm 15mm 18mm 20mm;
      @bottom-left { content: "Báo cáo nội bộ"; font: 9pt 'Times New Roman', Times, serif; color: #555; }
      @bottom-right { content: "Trang " counter(page) " / " counter(pages); font: 10pt 'Times New Roman', Times, serif; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: white; color: #000; font: 13pt 'Times New Roman', Times, serif; line-height: 1.4; }
    h1 { font-size: 17pt; line-height: 1.3; text-align: center; text-transform: uppercase; margin: 9mm 0 3mm; }
    p { margin: 0 0 2mm; }
    .document-heading { display: flex; justify-content: space-between; gap: 12mm; break-inside: avoid; }
    .organization, .document-kind { width: 48%; text-align: center; }
    .organization-name, .document-label { font-weight: bold; text-transform: uppercase; }
    .parent-name, .department { font-size: 11pt; text-transform: uppercase; }
    .document-kind { font-size: 11pt; }
    .document-date { font-style: italic; margin-top: 3mm; }
    .subtitle { text-align: center; white-space: pre-line; font-size: 12pt; margin-bottom: 5mm; }
    .meta { font-size: 11pt; margin-bottom: 2mm; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 4mm; font-size: ${output.headers.length > 8 ? '10.5' : '12'}pt; line-height: 1.35; }
    th, td { border: 0.6pt solid #333; padding: 5pt 6pt; text-align: left; vertical-align: top; white-space: pre-wrap; overflow-wrap: anywhere; }
    th { font-weight: bold; background: #f3f3f3; text-align: center; vertical-align: middle; }
    .serial { text-align: center; padding-left: 2pt; padding-right: 2pt; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    .signatures { display: flex; justify-content: space-around; gap: 15mm; break-inside: avoid; margin-top: 8mm; }
    .signature { width: 42%; text-align: center; min-height: 35mm; }
    .signature strong { display: block; text-transform: uppercase; font-size: 12pt; }
    .signature em { display: block; font-size: 11pt; margin-top: 1mm; }
  </style></head><body></body></html>`);
  doc.close();
  doc.title = output.title;
  const addText = (tag: string, text: string, className?: string) => {
    const element = doc.createElement(tag); element.textContent = text;
    if (className) element.className = className;
    doc.body.appendChild(element);
  };
  const heading = doc.createElement('div'); heading.className = 'document-heading';
  const organization = doc.createElement('div'); organization.className = 'organization';
  const appendLine = (parent: HTMLElement, text: string, className: string) => { if (!text) return; const line = doc.createElement('p'); line.className = className; line.textContent = text; parent.appendChild(line); };
  appendLine(organization, config.parentOrgName, 'parent-name');
  appendLine(organization, config.orgName, 'organization-name');
  appendLine(organization, config.deptName, 'department');
  const kind = doc.createElement('div'); kind.className = 'document-kind';
  appendLine(kind, enterprise ? 'Báo cáo quản trị nội bộ' : 'Cộng hòa xã hội chủ nghĩa Việt Nam', 'document-label');
  if (!enterprise) appendLine(kind, 'Độc lập - Tự do - Hạnh phúc', 'document-label');
  appendLine(kind, `${config.location || ''}${config.location ? ', ' : ''}ngày ${part('day')} tháng ${part('month')} năm ${part('year')}`, 'document-date');
  heading.append(organization, kind); doc.body.appendChild(heading);
  addText('h1', output.title);
  if (output.subtitle) addText('p', output.subtitle, 'subtitle');
  if (output.scope) addText('p', `Phạm vi: ${output.scope}`, 'meta');
  addText('p', `Tổng số: ${output.rows.length.toLocaleString('vi-VN')} bản ghi`, 'meta');
  addText('p', `Thời điểm lập báo cáo: ${new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(now)}`, 'meta');
  const table = doc.createElement('table');
  const colgroup = doc.createElement('colgroup');
  if (addSerial) { const serialCol = doc.createElement('col'); serialCol.style.width = landscape ? '4%' : '5%'; colgroup.appendChild(serialCol); }
  const weights = output.headers.map(header => /việc cần|ghi chú|mô tả|diễn giải|nội dung/i.test(header) ? 30 : /nhân viên|người dùng|nhân sự|họ.*tên|vai trò|tiến độ/i.test(header) ? 23 : /điểm|kết quả|trạng thái|số lượng/i.test(header) ? 16 : 20);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  weights.forEach(weight => { const col = doc.createElement('col'); col.style.width = `${weight / totalWeight * (addSerial ? landscape ? 96 : 95 : 100)}%`; colgroup.appendChild(col); });
  table.appendChild(colgroup);
  const header = table.createTHead().insertRow();
  if (addSerial) { const serialHeader = doc.createElement('th'); serialHeader.scope = 'col'; serialHeader.textContent = 'STT'; serialHeader.className = 'serial'; header.appendChild(serialHeader); }
  output.headers.forEach(text => { const cell = doc.createElement('th'); cell.scope = 'col'; cell.textContent = text; header.appendChild(cell); });
  const body = table.createTBody();
  output.rows.forEach((values, index) => {
    const row = body.insertRow();
    if (addSerial) { const serial = row.insertCell(); serial.className = 'serial'; serial.textContent = String(index + 1); }
    values.forEach(value => { row.insertCell().textContent = String(value ?? ''); });
  });
  if (!output.rows.length) { const cell = body.insertRow().insertCell(); cell.colSpan = output.headers.length + (addSerial ? 1 : 0); cell.textContent = 'Không có dữ liệu phù hợp với bộ lọc.'; }
  doc.body.appendChild(table);
  const signatures = doc.createElement('div'); signatures.className = 'signatures';
  for (const title of [config.signerTitle1 || 'Người lập báo cáo', config.signerTitle2 || 'Người kiểm tra']) {
    const signature = doc.createElement('div'); signature.className = 'signature';
    const label = doc.createElement('strong'); label.textContent = title;
    const instruction = doc.createElement('em'); instruction.textContent = '(Ký, ghi rõ họ tên)';
    signature.append(label, instruction); signatures.appendChild(signature);
  }
  doc.body.appendChild(signatures);
  const cleanup = () => { window.clearTimeout(timeout); window.setTimeout(() => frame.remove(), 500); };
  const timeout = window.setTimeout(() => frame.remove(), 10 * 60_000);
  printWindow.addEventListener('afterprint', cleanup, { once: true });
  try {
    await doc.fonts.ready;
    await new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    printWindow.focus();
    printWindow.print();
  } catch (error) { cleanup(); throw error; }
}

/** Read rendered cell labels, separating blocks and ignoring decorative icons. */
export function cellOutputText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element)) return '';
  if (node.matches('svg, script, style, [aria-hidden="true"], .no-print')) return '';
  const text = Array.from(node.childNodes).map(cellOutputText).join('');
  const block = /^(P|DIV|LI|BR)$/.test(node.tagName)
    || (node.tagName === 'SPAN' && window.getComputedStyle(node).display === 'block');
  return block ? `${text}\n` : text;
}
