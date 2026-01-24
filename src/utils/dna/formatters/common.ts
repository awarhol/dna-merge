export function normalizeGenotypeForFormat(
  genotype: string,
  targetFormat: 'ancestry' | 'myheritage'
): string {
  const normalized = genotype.trim()

  if (targetFormat === 'myheritage') {
    // When converting to MyHeritage: "0 0" or "00" -> "--"
    if (normalized === '0 0' || normalized === '00') {
      return '--'
    }
  } else if (targetFormat === 'ancestry') {
    // When converting to Ancestry: "--" -> "0 0"
    if (normalized === '--') {
      return '00'
    }
  }

  return normalized
}

export function chromosomeToSortKey(chr: string): number {
  const upper = chr.toUpperCase()
  // Handle letter chromosomes (from MyHeritage format)
  if (upper === 'X') return 23
  if (upper === 'Y') return 24
  if (upper === 'XY') return 25 // PAR region
  if (upper === 'MT' || upper === 'M') return 26
  const num = parseInt(chr, 10)
  return isNaN(num) ? 999 : num
}
