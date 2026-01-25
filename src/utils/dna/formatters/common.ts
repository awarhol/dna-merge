export function normalizeGenotypeForFormat(
  genotype: string,
  targetFormat: 'ancestry' | 'myheritage'
): string {
  let normalized = genotype.trim()

  // Handle single-character genotypes from 23andMe (hemizygous regions)
  // Convert to double characters for output formats
  if (normalized.length === 1) {
    const char = normalized.toUpperCase()
    if (char === 'A' || char === 'T' || char === 'C' || char === 'G') {
      normalized = char + char
    } else if (char === '-') {
      normalized = '--'
    } else if (char === '0') {
      normalized = '00'
    }
  }

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

/**
 * Normalize genotypes for comparison to handle single vs double character differences
 * E.g., "A" and "AA" should be considered equal (23andMe hemizygous vs diploid)
 */
export function normalizeGenotypeForComparison(genotype: string): string {
  const normalized = genotype.trim().toUpperCase()

  // If single character, double it for comparison
  if (normalized.length === 1) {
    const char = normalized
    if (char === 'A' || char === 'T' || char === 'C' || char === 'G') {
      return char + char
    } else if (char === '-') {
      return '--'
    } else if (char === '0') {
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
