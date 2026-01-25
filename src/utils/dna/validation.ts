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
    const validSingleChar = ['A', 'T', 'C', 'G', '-', '0']
    return validSingleChar.includes(normalized)
  }

  return false
}

export function isMissingValue(genotype: string): boolean {
  const normalized = genotype.toUpperCase().trim()
  return normalized === '--' || normalized === '00'
}

export function isValidChromosome(
  chromosome: string,
  format: 'ancestry' | 'myheritage' | 'livingdna' | '23andme'
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
