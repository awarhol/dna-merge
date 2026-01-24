import { describe, it, expect } from 'vitest'
import { detectFormat } from '../format-detector'
import { ANCESTRY_SAMPLE, MYHERITAGE_SAMPLE, LIVINGDNA_SAMPLE } from './fixtures'

describe('detectFormat', () => {
  it('should detect Ancestry format from sample file', async () => {
    expect(detectFormat(ANCESTRY_SAMPLE)).toBe('ancestry')
  })

  it('should detect MyHeritage format from sample file', async () => {
    expect(detectFormat(MYHERITAGE_SAMPLE)).toBe('myheritage')
  })

  it('should detect LivingDNA format from sample file', async () => {
    expect(detectFormat(LIVINGDNA_SAMPLE)).toBe('livingdna')
  })

  it('should return unknown for empty content', async () => {
    expect(detectFormat('')).toBe('unknown')
  })

  it('should return unknown for invalid format', async () => {
    expect(detectFormat('random text\nno valid format')).toBe('unknown')
  })
})
