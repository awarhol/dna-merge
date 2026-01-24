import { describe, it, expect } from 'vitest'
import { validateGenotype } from '../validation'

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
})
