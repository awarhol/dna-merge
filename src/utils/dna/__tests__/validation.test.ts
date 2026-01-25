import { describe, it, expect } from 'vitest'
import {
  validateGenotype,
  isMultibaseGenotype,
  splitMultibaseGenotype,
  isStandardRsId,
  isValidPosition,
  hasInvalidPosition,
  shouldKeepInvalidPosition,
} from '../validation'

describe('validateGenotype', () => {
  it('should validate standard nucleotide pairs', async () => {
    expect(validateGenotype('AA')).toBe(true)
    expect(validateGenotype('AT')).toBe(true)
    expect(validateGenotype('CG')).toBe(true)
    expect(validateGenotype('TT')).toBe(true)
  })

  it('should validate special markers (lenient mode)', async () => {
    expect(validateGenotype('--')).toBe(true)
    expect(validateGenotype('00')).toBe(true)
    expect(validateGenotype('DD')).toBe(true)
    expect(validateGenotype('II')).toBe(true)
  })

  it('should reject invalid genotypes', async () => {
    expect(validateGenotype('XY')).toBe(false)
    expect(validateGenotype('ZZ')).toBe(false)
    expect(validateGenotype('12')).toBe(false)
    expect(validateGenotype('A')).toBe(false)
  })

  it('should be case insensitive', async () => {
    expect(validateGenotype('aa')).toBe(true)
    expect(validateGenotype('Tc')).toBe(true)
  })

  it('should validate DI and ID genotypes', async () => {
    expect(validateGenotype('DI')).toBe(true)
    expect(validateGenotype('ID')).toBe(true)
    expect(validateGenotype('di')).toBe(true)
    expect(validateGenotype('id')).toBe(true)
  })

  it('should validate single-character genotypes when allowSingleChar is true', async () => {
    expect(validateGenotype('A', true)).toBe(true)
    expect(validateGenotype('T', true)).toBe(true)
    expect(validateGenotype('C', true)).toBe(true)
    expect(validateGenotype('G', true)).toBe(true)
    expect(validateGenotype('-', true)).toBe(true)
    expect(validateGenotype('0', true)).toBe(true)
    expect(validateGenotype('D', true)).toBe(true)
    expect(validateGenotype('I', true)).toBe(true)
  })

  it('should reject single-character genotypes when allowSingleChar is false', async () => {
    expect(validateGenotype('A', false)).toBe(false)
    expect(validateGenotype('T', false)).toBe(false)
    expect(validateGenotype('C', false)).toBe(false)
    expect(validateGenotype('G', false)).toBe(false)
    expect(validateGenotype('-', false)).toBe(false)
    expect(validateGenotype('0', false)).toBe(false)
    expect(validateGenotype('D', false)).toBe(false)
    expect(validateGenotype('I', false)).toBe(false)
  })

  it('should reject single-character genotypes by default', async () => {
    expect(validateGenotype('A')).toBe(false)
    expect(validateGenotype('T')).toBe(false)
    expect(validateGenotype('C')).toBe(false)
    expect(validateGenotype('G')).toBe(false)
  })

  it('should be case insensitive for single-character genotypes', async () => {
    expect(validateGenotype('a', true)).toBe(true)
    expect(validateGenotype('t', true)).toBe(true)
    expect(validateGenotype('c', true)).toBe(true)
    expect(validateGenotype('g', true)).toBe(true)
    expect(validateGenotype('d', true)).toBe(true)
    expect(validateGenotype('i', true)).toBe(true)
  })

  it('should reject invalid single-character genotypes', async () => {
    expect(validateGenotype('X', true)).toBe(false)
    expect(validateGenotype('Y', true)).toBe(false)
    expect(validateGenotype('Z', true)).toBe(false)
    expect(validateGenotype('1', true)).toBe(false)
  })
})

describe('isMultibaseGenotype', () => {
  it('should identify valid multi-base genotypes (Indels)', async () => {
    expect(isMultibaseGenotype('TAAGTGTAAGTG')).toBe(true)
    expect(isMultibaseGenotype('ATATCGATCG')).toBe(true)
    expect(isMultibaseGenotype('ATAT')).toBe(true)
    expect(isMultibaseGenotype('CGCG')).toBe(true)
  })

  it('should reject standard two-character genotypes', async () => {
    expect(isMultibaseGenotype('AT')).toBe(false)
    expect(isMultibaseGenotype('CG')).toBe(false)
    expect(isMultibaseGenotype('AA')).toBe(false)
  })

  it('should accept odd-length strings with valid nucleotides', async () => {
    expect(isMultibaseGenotype('ATA')).toBe(true)
    expect(isMultibaseGenotype('ATCGA')).toBe(true)
    expect(isMultibaseGenotype('TAAGTGT')).toBe(true)
    expect(isMultibaseGenotype('AGA')).toBe(true)
  })

  it('should reject strings with invalid characters', async () => {
    expect(isMultibaseGenotype('ATAT--')).toBe(false)
    expect(isMultibaseGenotype('ATATXX')).toBe(false)
    expect(isMultibaseGenotype('12ATCG')).toBe(false)
  })

  it('should be case insensitive', async () => {
    expect(isMultibaseGenotype('taagtgtaagtg')).toBe(true)
    expect(isMultibaseGenotype('AtAtCgAtCg')).toBe(true)
  })

  it('should reject special markers', async () => {
    expect(isMultibaseGenotype('----')).toBe(false)
    expect(isMultibaseGenotype('0000')).toBe(false)
    expect(isMultibaseGenotype('DDDD')).toBe(false)
    expect(isMultibaseGenotype('IIII')).toBe(false)
  })
})

describe('splitMultibaseGenotype', () => {
  it('should split even-length multi-base genotypes correctly', async () => {
    expect(splitMultibaseGenotype('TAAGTGTAAGTG')).toBe('TAAGTG TAAGTG')
    expect(splitMultibaseGenotype('ATATCGATCG')).toBe('ATATC GATCG')
    expect(splitMultibaseGenotype('ATAT')).toBe('AT AT')
    expect(splitMultibaseGenotype('CGCG')).toBe('CG CG')
  })

  it('should split odd-length multi-base genotypes with smaller allele first', async () => {
    expect(splitMultibaseGenotype('AGA')).toBe('A GA')
    expect(splitMultibaseGenotype('ATA')).toBe('A TA')
    expect(splitMultibaseGenotype('ATCGA')).toBe('AT CGA')
    expect(splitMultibaseGenotype('TAAGTGT')).toBe('TAA GTGT')
    expect(splitMultibaseGenotype('CGATC')).toBe('CG ATC')
  })

  it('should return original genotype if not a multi-base genotype', async () => {
    expect(splitMultibaseGenotype('AT')).toBe('AT')
    expect(splitMultibaseGenotype('CG')).toBe('CG')
    expect(splitMultibaseGenotype('--')).toBe('--')
  })

  it('should be case insensitive', async () => {
    expect(splitMultibaseGenotype('taagtgtaagtg')).toBe('TAAGTG TAAGTG')
    expect(splitMultibaseGenotype('AtAtCgAtCg')).toBe('ATATC GATCG')
    expect(splitMultibaseGenotype('aga')).toBe('A GA')
    expect(splitMultibaseGenotype('AtCgA')).toBe('AT CGA')
  })

  it('should handle whitespace', async () => {
    expect(splitMultibaseGenotype(' TAAGTGTAAGTG ')).toBe('TAAGTG TAAGTG')
    expect(splitMultibaseGenotype(' AGA ')).toBe('A GA')
  })
})

describe('isStandardRsId', () => {
  it('should identify standard rsIDs', async () => {
    expect(isStandardRsId('rs377726663')).toBe(true)
    expect(isStandardRsId('rs12345')).toBe(true)
    expect(isStandardRsId('rs1')).toBe(true)
    expect(isStandardRsId('RS12345')).toBe(true) // Case insensitive
  })

  it('should reject non-standard rsIDs', async () => {
    expect(isStandardRsId('i3000001')).toBe(false)
    expect(isStandardRsId('exm-rs123')).toBe(false)
    expect(isStandardRsId('custom_snp')).toBe(false)
    expect(isStandardRsId('rs')).toBe(false) // No number
    expect(isStandardRsId('rs12abc')).toBe(false) // Contains letters
  })

  it('should handle whitespace', async () => {
    expect(isStandardRsId(' rs12345 ')).toBe(true)
    expect(isStandardRsId('  RS999  ')).toBe(true)
  })
})

describe('isValidPosition', () => {
  it('should accept non-zero positions', async () => {
    expect(isValidPosition('12345')).toBe(true)
    expect(isValidPosition('1')).toBe(true)
    expect(isValidPosition('999999')).toBe(true)
  })

  it('should reject zero positions', async () => {
    expect(isValidPosition('0')).toBe(false)
  })

  it('should handle whitespace', async () => {
    expect(isValidPosition(' 12345 ')).toBe(true)
    expect(isValidPosition(' 0 ')).toBe(false)
  })
})

describe('hasInvalidPosition', () => {
  it('should detect invalid chromosomes', async () => {
    expect(hasInvalidPosition('0', '12345')).toBe(true)
    expect(hasInvalidPosition('0', '0')).toBe(true)
  })

  it('should detect invalid positions', async () => {
    expect(hasInvalidPosition('1', '0')).toBe(true)
    expect(hasInvalidPosition('X', '0')).toBe(true)
  })

  it('should accept valid chromosome and position', async () => {
    expect(hasInvalidPosition('1', '12345')).toBe(false)
    expect(hasInvalidPosition('X', '54321')).toBe(false)
    expect(hasInvalidPosition('MT', '16569')).toBe(false)
  })
})

describe('shouldKeepInvalidPosition', () => {
  describe('when option is disabled', () => {
    it('should skip all invalid positions', async () => {
      expect(shouldKeepInvalidPosition('rs12345', 'AT', false)).toBe(false)
      expect(shouldKeepInvalidPosition('i3000001', 'CG', false)).toBe(false)
      expect(shouldKeepInvalidPosition('rs12345', '--', false)).toBe(false)
      expect(shouldKeepInvalidPosition('custom_snp', '--', false)).toBe(false)
    })
  })

  describe('when option is enabled', () => {
    it('should keep standard rsIDs regardless of genotype', async () => {
      expect(shouldKeepInvalidPosition('rs12345', 'AT', true)).toBe(true)
      expect(shouldKeepInvalidPosition('rs12345', '--', true)).toBe(true)
      expect(shouldKeepInvalidPosition('rs12345', '00', true)).toBe(true)
      expect(shouldKeepInvalidPosition('RS999', 'CG', true)).toBe(true)
    })

    it('should keep non-standard IDs with valid genotypes', async () => {
      expect(shouldKeepInvalidPosition('i3000001', 'AT', true)).toBe(true)
      expect(shouldKeepInvalidPosition('exm-rs123', 'CG', true)).toBe(true)
      expect(shouldKeepInvalidPosition('custom_snp', 'TT', true)).toBe(true)
    })

    it('should skip non-standard IDs with missing genotypes', async () => {
      expect(shouldKeepInvalidPosition('i3000001', '--', true)).toBe(false)
      expect(shouldKeepInvalidPosition('exm-rs123', '00', true)).toBe(false)
      expect(shouldKeepInvalidPosition('custom_snp', '--', true)).toBe(false)
      expect(shouldKeepInvalidPosition('custom_snp', '00', true)).toBe(false)
    })

    it('should keep non-standard IDs with DD/II genotypes (not considered missing)', async () => {
      // DD and II are valid special markers, not missing values
      expect(shouldKeepInvalidPosition('custom_snp', 'DD', true)).toBe(true)
      expect(shouldKeepInvalidPosition('custom_snp', 'II', true)).toBe(true)
      expect(shouldKeepInvalidPosition('i3000001', 'DI', true)).toBe(true)
      expect(shouldKeepInvalidPosition('exm-rs123', 'ID', true)).toBe(true)
    })

    it('should handle edge cases', async () => {
      // Standard rsID with missing genotype - should keep
      expect(shouldKeepInvalidPosition('rs12345', 'DD', true)).toBe(true)
      // Custom name with valid genotype - should keep
      expect(shouldKeepInvalidPosition('my_custom', 'AT', true)).toBe(true)
      // Custom name with empty genotype - should skip
      expect(shouldKeepInvalidPosition('my_custom', '--', true)).toBe(false)
    })
  })
})
