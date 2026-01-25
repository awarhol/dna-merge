import { describe, it, expect } from 'vitest'
import { validateGenotype, isMultibaseGenotype, splitMultibaseGenotype } from '../validation'

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
