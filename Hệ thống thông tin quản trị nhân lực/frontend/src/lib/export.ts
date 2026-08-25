/**
 * Xuất dữ liệu ra Word (.doc) và Excel (.xls) — KHÔNG cần thư viện ngoài:
 * dùng chuẩn "HTML as Word/Excel" mà Microsoft Office mở trực tiếp với
 * định dạng giữ nguyên (tiêu đề, bảng viền, nền header).
 */

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>');
}

/** Tải nội dung (HTML body) dưới dạng tập tin Word .doc mở được bằng MS Word. */
export function downloadWordFromHtml(title: string, bodyHtml: string): void {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; }
  h1 { font-size: 17pt; text-align: center; text-transform: uppercase; }
  h2 { font-size: 14pt; }
  h3 { font-size: 13pt; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #555; padding: 5px 8px; font-size: 12pt; }
</style></head>
<body>${bodyHtml}</body></html>`;
  saveBlob(new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }), `${title}.doc`);
}

/**
 * Xuất bảng dữ liệu ra Excel .xls (HTML table workbook).
 * @param filename  tên tập tin (không cần phần mở rộng)
 * @param headers   tiêu đề các cột
 * @param rows      dữ liệu các dòng (đã qua lọc/sắp xếp hiện tại)
 */
export function exportRowsToExcel(filename: string, headers: string[], rows: (string | number)[][]): void {
  const thead = `<tr>${headers
    .map((h) => `<th style="background:#dbeafe;border:1px solid #666;padding:4px 8px;font-weight:bold;">${escapeHtml(h)}</th>`)
    .join('')}</tr>`;
  const tbody = rows
    .map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #999;padding:4px 8px;">${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('');
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"></head>
<body><table>${thead}${tbody}</table></body></html>`;
  saveBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' }), `${filename}.xls`);
}
