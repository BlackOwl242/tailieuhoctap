export type RoutedProcedure = {
  code: string
  agency: string
  routing?: { observedAuthorities?: { authority: string }[] }
}

export const normalizeAgency = (value: string) => value.toLocaleLowerCase('vi').replace(/\s+(thành phố\s+)?hà nội$/i, '').trim()

// Keep the detail page and the first submission step on the same agency list.
export function procedureAgencies(procedure: RoutedProcedure, agencies: string[]) {
  const observed = procedure.routing?.observedAuthorities || []
  const communeAgencies = ['2.000908', '2.000635'].includes(procedure.code)
    ? agencies.filter(agency => /^(ubnd\s+(phường|xã)\s+|sở\s+tư\s+pháp)/i.test(agency)) : []
  return [...new Set([
    ...observed.map(item => item.authority), ...communeAgencies,
    ...(!observed.length && !communeAgencies.length && procedure.agency ? [procedure.agency] : []),
  ])]
}
