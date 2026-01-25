import { describe, it, expect } from 'vitest'
import { normalizeGenotypeForFormat, normalizeGenotypeForComparison } from '../common'

describe('normalizeGenotypeForFormat', () => {
  describe('converting to MyHeritage format', () => {
    it('should convert "0 0" to "--"', async () => {
      expect(normalizeGenotypeForFormat('0 0', 'myheritage')).toBe('--')
    })

    it('should convert "00" to "--"', async () => {
      expect(normalizeGenotypeForFormat('00', 'myheritage')).toBe('--')
    })

    it('should handle whitespace around "0 0"', async () => {
      expect(normalizeGenotypeForFormat(' 0 0 ', 'myheritage')).toBe('--')
    })

    it('should handle whitespace around "00"', async () => {
      expect(normalizeGenotypeForFormat(' 00 ', 'myheritage')).toBe('--')
    })

    it('should leave other genotypes unchanged', async () => {
      expect(normalizeGenotypeForFormat('AA', 'myheritage')).toBe('AA')
      expect(normalizeGenotypeForFormat('AT', 'myheritage')).toBe('AT')
      expect(normalizeGenotypeForFormat('CG', 'myheritage')).toBe('CG')
      expect(normalizeGenotypeForFormat('--', 'myheritage')).toBe('--')
      expect(normalizeGenotypeForFormat('DD', 'myheritage')).toBe('DD')
      expect(normalizeGenotypeForFormat('II', 'myheritage')).toBe('II')
    })
  })

  describe('converting to Ancestry format', () => {
    it('should convert "--" to "00"', async () => {
      expect(normalizeGenotypeForFormat('--', 'ancestry')).toBe('00')
    })

    it('should handle whitespace around "--"', async () => {
      expect(normalizeGenotypeForFormat(' -- ', 'ancestry')).toBe('00')
    })

    it('should leave other genotypes unchanged', async () => {
      expect(normalizeGenotypeForFormat('AA', 'ancestry')).toBe('AA')
      expect(normalizeGenotypeForFormat('AT', 'ancestry')).toBe('AT')
      expect(normalizeGenotypeForFormat('CG', 'ancestry')).toBe('CG')
      expect(normalizeGenotypeForFormat('00', 'ancestry')).toBe('00')
      expect(normalizeGenotypeForFormat('0 0', 'ancestry')).toBe('0 0')
      expect(normalizeGenotypeForFormat('DD', 'ancestry')).toBe('DD')
      expect(normalizeGenotypeForFormat('II', 'ancestry')).toBe('II')
    })
  })

  describe('handling single-character genotypes from 23andMe', () => {
    it('should double single nucleotides for MyHeritage format', async () => {
      expect(normalizeGenotypeForFormat('A', 'myheritage')).toBe('AA')
      expect(normalizeGenotypeForFormat('T', 'myheritage')).toBe('TT')
      expect(normalizeGenotypeForFormat('C', 'myheritage')).toBe('CC')
      expect(normalizeGenotypeForFormat('G', 'myheritage')).toBe('GG')
    })

    it('should double single nucleotides for Ancestry format', async () => {
      expect(normalizeGenotypeForFormat('A', 'ancestry')).toBe('AA')
      expect(normalizeGenotypeForFormat('T', 'ancestry')).toBe('TT')
      expect(normalizeGenotypeForFormat('C', 'ancestry')).toBe('CC')
      expect(normalizeGenotypeForFormat('G', 'ancestry')).toBe('GG')
    })

    it('should convert single dash to double dash', async () => {
      expect(normalizeGenotypeForFormat('-', 'myheritage')).toBe('--')
      expect(normalizeGenotypeForFormat('-', 'ancestry')).toBe('00')
    })

    it('should convert single zero to double zero', async () => {
      expect(normalizeGenotypeForFormat('0', 'myheritage')).toBe('--')
      expect(normalizeGenotypeForFormat('0', 'ancestry')).toBe('00')
    })

    it('should handle lowercase single nucleotides', async () => {
      expect(normalizeGenotypeForFormat('a', 'ancestry')).toBe('AA')
      expect(normalizeGenotypeForFormat('t', 'myheritage')).toBe('TT')
    })
  })
})

describe('normalizeGenotypeForComparison', () => {
  it('should double single-character nucleotides', async () => {
    expect(normalizeGenotypeForComparison('A')).toBe('AA')
    expect(normalizeGenotypeForComparison('T')).toBe('TT')
    expect(normalizeGenotypeForComparison('C')).toBe('CC')
    expect(normalizeGenotypeForComparison('G')).toBe('GG')
  })

  it('should convert single dash to double dash', async () => {
    expect(normalizeGenotypeForComparison('-')).toBe('--')
  })

  it('should convert single zero to double zero', async () => {
    expect(normalizeGenotypeForComparison('0')).toBe('00')
  })

  it('should handle lowercase and normalize to uppercase', async () => {
    expect(normalizeGenotypeForComparison('a')).toBe('AA')
    expect(normalizeGenotypeForComparison('t')).toBe('TT')
    expect(normalizeGenotypeForComparison('at')).toBe('AT')
  })

  it('should leave two-character genotypes unchanged (uppercase)', async () => {
    expect(normalizeGenotypeForComparison('AA')).toBe('AA')
    expect(normalizeGenotypeForComparison('AT')).toBe('AT')
    expect(normalizeGenotypeForComparison('CG')).toBe('CG')
    expect(normalizeGenotypeForComparison('--')).toBe('--')
    expect(normalizeGenotypeForComparison('00')).toBe('00')
  })

  it('should consider A and AA equal after normalization', async () => {
    expect(normalizeGenotypeForComparison('A')).toBe(normalizeGenotypeForComparison('AA'))
    expect(normalizeGenotypeForComparison('T')).toBe(normalizeGenotypeForComparison('TT'))
    expect(normalizeGenotypeForComparison('C')).toBe(normalizeGenotypeForComparison('CC'))
    expect(normalizeGenotypeForComparison('G')).toBe(normalizeGenotypeForComparison('GG'))
  })
})
