export function validateGenotype(genotype: string, allowSingleChar = false): boolean {
  const normalized = genotype.toUpperCase().trim()

  const validNucleotides = [
    'AA',
    'AT',
    'AC',
    'AG',
    'TA',
    'TT',
    'TC',
    'TG',
    'CA',
    'CT',
    'CC',
    'CG',
    'GA',
    'GT',
    'GC',
    'GG',
  ]
  const validSpecial = ['--', '00', 'DD', 'II', 'DI', 'ID']

  // Check two-character genotypes
  if (validNucleotides.includes(normalized) || validSpecial.includes(normalized)) {
    return true
  }

  // Check single-character genotypes (for hemizygous regions in 23andMe)
  if (allowSingleChar) {
    const validSingleChar = ['A', 'T', 'C', 'G', '-', '0', 'D', 'I']
    return validSingleChar.includes(normalized)
  }

  return false
}

/**
 * Check if a genotype string is a multi-base genotype (Indel)
 * Multi-base genotypes are even-length strings > 2 characters with only valid nucleotides
 */
export function isMultibaseGenotype(genotype: string): boolean {
  const normalized = genotype.toUpperCase().trim()

  // Must be even length and > 2 characters
  if (normalized.length <= 2 || normalized.length % 2 !== 0) {
    return false
  }

  // All characters must be valid nucleotides (A, T, C, G)
  return /^[ATCG]+$/.test(normalized)
}

/**
 * Split a multi-base genotype into two alleles
 * Example: "TAAGTGTAAGTG" -> "TAAGTG TAAGTG"
 */
export function splitMultibaseGenotype(genotype: string): string {
  const normalized = genotype.toUpperCase().trim()

  if (!isMultibaseGenotype(normalized)) {
    return genotype
  }

  const halfLength = normalized.length / 2
  const allele1 = normalized.substring(0, halfLength)
  const allele2 = normalized.substring(halfLength)

  return `${allele1} ${allele2}`
}

export function isMissingValue(genotype: string): boolean {
  const normalized = genotype.toUpperCase().trim()
  return normalized === '--' || normalized === '00'
}

export function isValidChromosome(
  chromosome: string,
  format: 'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna'
): boolean {
  const chr = chromosome.toUpperCase().trim()

  // Valid for both: 1-22, X, Y, MT, M, XY (PAR region)
  if (chr === 'X' || chr === 'Y' || chr === 'MT' || chr === 'M' || chr === 'XY') {
    return true
  }

  const num = parseInt(chr, 10)
  if (isNaN(num)) return false

  // Standard chromosomes: 1-22
  if (num >= 1 && num <= 22) return true

  // Ancestry format allows 23-26:
  // 23 = X, 24 = Y, 25 = PAR (Pseudoautosomal), 26 = MT
  if (format === 'ancestry' && num >= 23 && num <= 26) return true

  return false
}
