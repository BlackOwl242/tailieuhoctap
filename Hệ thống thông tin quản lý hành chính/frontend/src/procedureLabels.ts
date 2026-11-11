export function serviceModeLabel(level: string): string {
  if (level === 'Toàn trình') return 'Dịch vụ công trực tuyến toàn trình'
  if (level === 'Một phần') return 'Dịch vụ công trực tuyến một phần'
  if (level === 'Cung cấp thông tin') return 'Cung cấp thông tin thủ tục'
  return 'Chưa xác định mức dịch vụ'
}
