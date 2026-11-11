export const serviceTopics = [
  'Hộ tịch',
  'Chứng thực',
  'Đất đai',
  'Nhà ở',
  'Hoạt động xây dựng',
  'Thành lập và hoạt động của hộ kinh doanh',
  'An toàn thực phẩm',
  'Khám bệnh, chữa bệnh',
  'Giáo dục trung học',
  'Người có công',
  'Việc làm',
  'Đường bộ',
  'Môi trường',
  'Du lịch',
  'Hoạt động khoa học và công nghệ',
  'Lưu thông hàng hóa trong nước',
] as const

export const showcaseProcedureCodes = [
  '2.000908',
  '1.004237',
  '1.008950',
  '2.000117',
  '1.013992',
  '1.014034',
  '3.000182',
] as const

export function normalizeTopicField(value: string | undefined | null): string {
  const trimmed = (value || '').trim()
  if (trimmed === 'Khám bệnh. chữa bệnh') {
    return 'Khám bệnh, chữa bệnh'
  }
  return trimmed
}

export function matchesTopicField(itemField: string | undefined | null, selectedField: string): boolean {
  if (!selectedField || selectedField === 'all') {
    return true
  }
  return normalizeTopicField(itemField) === normalizeTopicField(selectedField)
}
