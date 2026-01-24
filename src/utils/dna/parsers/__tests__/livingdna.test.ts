import { describe, it, expect } from 'vitest'
import { parseLivingDNAFileAsync } from '../livingdna'
import { LIVINGDNA_SAMPLE } from '../../__tests__/fixtures'

describe('parseLivingDNAFile', () => {
  it('should parse LivingDNA file asynchronously', async () => {
    const result = await parseLivingDNAFileAsync(LIVINGDNA_SAMPLE, 1)

    expect(result.snps).toHaveLength(5)
    expect(result.format).toBe('livingdna')
    expect(result.metadata?.chip).toBe('Sirius')
    expect(result.errors).toHaveLength(0)
  })

  it('should report progress with large dataset', async () => {
    // Create a large sample with 10000 lines to trigger progress reporting
    const largeLines = ['# Living DNA\n# rsid chromosome position genotype']
    for (let i = 0; i < 10000; i++) {
      largeLines.push(`rs${i} 1 ${i * 100} AT`)
    }
    const largeSample = largeLines.join('\n')

    const progressValues: number[] = []
    await parseLivingDNAFileAsync(largeSample, 1, p => progressValues.push(p))

    expect(progressValues.length).toBeGreaterThan(0)
  })
})
