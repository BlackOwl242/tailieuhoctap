export type RoutedProcedure = {
  code: string
  agency: string
  level?: string
  executionLevel?: string
  field?: string
  routing?: {
    mode?: string
    officialAgencyHints?: string[]
    observedAuthorities?: { authority: string }[]
  }
}

export function normalizeAgency(value: string): string {
  return value
    .toLocaleLowerCase('vi')
    .replace(/u[ỷỵ] ban nhân dân|ủy ban nhân dân/g, 'ubnd')
    .replace(/\s+(thành phố\s+)?hà nội$/i, '')
    .replace(/\s+(các\s+)?tỉnh,?\s*thành phố(\s+trực thuộc trung ương)?\.?$/i, '')
    .trim()
}

function isCommuneLevelHint(normalizedHint: string): boolean {
  return /^(chủ tịch\s+)?ubnd\s+(cấp\s+)?(xã|phường|phường,\s*xã)/.test(normalizedHint)
}

function isCommuneAgencyName(agency: string): boolean {
  return /^ubnd\s+(phường|xã|đặc khu)\s+\S/i.test(normalizeAgency(agency))
}

function usesCommuneIntakeFallback(procedure: RoutedProcedure): boolean {
  const levelText = `${procedure.executionLevel || ''} ${procedure.agency || ''}`.toLocaleLowerCase('vi')
  if (/cấp xã|ubnd\s+(cấp\s+)?xã|phường,\s*xã/.test(levelText)) {
    return true
  }
  return procedure.field === 'Chứng thực' && !procedure.routing?.officialAgencyHints?.length && (!procedure.agency || /sở tư pháp|ubnd/i.test(procedure.agency))
}

// Keep the procedure detail page and the first submission step on the same agency list.
export function procedureAgencies(procedure: RoutedProcedure, agencies: string[]): string[] {
  const hints = procedure.routing?.officialAgencyHints || []
  if (hints.length > 0) {
    return agencies.filter(agency =>
      hints.some(hint => {
        const normalizedHint = normalizeAgency(hint)
        const normalizedCandidate = normalizeAgency(agency)
        return (
          normalizedHint === normalizedCandidate ||
          (isCommuneLevelHint(normalizedHint) && isCommuneAgencyName(agency))
        )
      }),
    )
  }

  const observed = procedure.routing?.observedAuthorities || []
  const communeAgencies = usesCommuneIntakeFallback(procedure)
    ? agencies.filter(isCommuneAgencyName)
    : []

  const directAgency =
    !observed.length && !communeAgencies.length && procedure.agency ? [procedure.agency] : []

  return [...new Set([...observed.map(item => item.authority), ...communeAgencies, ...directAgency])]
}
