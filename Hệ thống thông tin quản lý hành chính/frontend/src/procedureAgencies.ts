export type RoutedProcedure = {
  code: string
  agency: string
  routing?: { officialAgencyHints?: string[]; observedAuthorities?: { authority: string }[] }
}

export const normalizeAgency = (value: string) => value.toLocaleLowerCase('vi').replace(/u[ỷỵ] ban nhân dân|ủy ban nhân dân/g, 'ubnd').replace(/\s+(thành phố\s+)?hà nội$/i, '').replace(/\s+(các\s+)?tỉnh,?\s*thành phố(\s+trực thuộc trung ương)?\.?$/i, '').trim()

// Keep the detail page and the first submission step on the same agency list.
export function procedureAgencies(procedure: RoutedProcedure, agencies: string[]) {
  const hints = procedure.routing?.officialAgencyHints || []
  if (hints.length) return agencies.filter(agency => hints.some(hint => {
    const normalizedHint = normalizeAgency(hint)
    return normalizedHint === normalizeAgency(agency) || (/^(chủ tịch )?ubnd (cấp )?xã$/.test(normalizedHint) && /^ubnd (phường|xã|đặc khu)\s+\S/.test(normalizeAgency(agency)))
  }))
  const observed = procedure.routing?.observedAuthorities || []
  const communeAgencies = procedure.code === '2.000908'
    ? agencies.filter(agency => /^ubnd\s+(phường|xã)\s+/i.test(agency)) : []
  return [...new Set([
    ...observed.map(item => item.authority), ...communeAgencies,
    ...(!observed.length && !communeAgencies.length && procedure.agency ? [procedure.agency] : []),
  ])]
}
