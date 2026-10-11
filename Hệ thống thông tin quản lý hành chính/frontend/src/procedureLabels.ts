export function serviceModeLabel(level: string) {
  return level === 'Toàn trình' ? 'Dịch vụ công trực tuyến toàn trình' : level === 'Một phần' ? 'Dịch vụ công trực tuyến một phần' : level === 'Cung cấp thông tin' ? 'Cung cấp thông tin thủ tục' : 'Chưa xác định mức dịch vụ'
}
