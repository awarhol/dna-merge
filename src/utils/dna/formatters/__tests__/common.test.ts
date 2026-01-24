import { describe, it, expect } from 'vitest'
import { normalizeGenotypeForFormat } from '../common'

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
})
