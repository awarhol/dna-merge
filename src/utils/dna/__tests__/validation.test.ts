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
