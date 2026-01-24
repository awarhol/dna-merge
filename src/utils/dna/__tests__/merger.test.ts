import { describe, it, expect } from 'vitest'
import { mergeSnpsAsync } from '../merger'
import { parseAncestryFileAsync } from '../parsers/ancestry'
import { parseMyHeritageFileAsync } from '../parsers/myheritage'
import { ANCESTRY_SAMPLE, MYHERITAGE_SAMPLE } from './fixtures'

describe('mergeSnps', () => {
  const defaultOptions = { preferredFile: 1 as const, fillMissing: true }

  it('should merge SNPs from two files without duplicates', async () => {
    const file1 = await parseAncestryFileAsync(ANCESTRY_SAMPLE, 1)
    const file2 = await parseMyHeritageFileAsync(MYHERITAGE_SAMPLE, 2)

    const result = await mergeSnpsAsync(file1, file2, defaultOptions)

    expect(result.mergedSnps.length).toBeGreaterThan(0)
    expect(result.mergedSnps.length).toBeLessThanOrEqual(file1.snps.length + file2.snps.length)
  })

  it('should detect conflicts when same RSID has different genotypes', async () => {
    const file1Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 1 as const },
    ]
    const file2Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 2 as const },
    ]

    const result = await mergeSnpsAsync({ snps: file1Snps }, { snps: file2Snps }, defaultOptions)

    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].file1Genotype).toBe('AA')
    expect(result.conflicts[0].file2Genotype).toBe('AC')
    expect(result.conflicts[0].chosenGenotype).toBe('AA')
    expect(result.conflicts[0].resolutionReason).toBe('Preferred File 1')
  })

  it('should prioritize Ancestry when preferred', async () => {
    const file1Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 1 as const },
    ]
    const file2Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 2 as const },
    ]

    const result = await mergeSnpsAsync(
      { snps: file1Snps },
      { snps: file2Snps },
      {
        preferredFile: 1,
        fillMissing: false,
      }
    )

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('AA')
    expect(result.conflicts[0].resolutionReason).toBe('Preferred File 1')
  })

  it('should prioritize MyHeritage when preferred', async () => {
    const file1Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 1 as const },
    ]
    const file2Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 2 as const },
    ]

    const result = await mergeSnpsAsync(
      { snps: file1Snps },
      { snps: file2Snps },
      {
        preferredFile: 2,
        fillMissing: false,
      }
    )

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('AC')
    expect(result.conflicts[0].resolutionReason).toBe('Preferred File 2')
  })

  it('should fill missing values when fillMissing is true', async () => {
    const file1Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: '--', sourceFile: 1 as const },
    ]
    const file2Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 2 as const },
    ]

    const result = await mergeSnpsAsync(
      { snps: file1Snps },
      { snps: file2Snps },
      {
        preferredFile: 1,
        fillMissing: true,
      }
    )

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('AC')
    expect(result.conflicts[0].resolutionReason).toBe('Filled Missing from File 2')
  })

  it('should not fill missing values when fillMissing is false', async () => {
    const file1Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: '--', sourceFile: 1 as const },
    ]
    const file2Snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 2 as const },
    ]

    const result = await mergeSnpsAsync(
      { snps: file1Snps },
      { snps: file2Snps },
      {
        preferredFile: 1,
        fillMissing: false,
      }
    )

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('--')
    expect(result.conflicts[0].resolutionReason).toBe('Preferred File 1')
  })

  it('should sort by chromosome and position', async () => {
    const file1Snps = [
      { rsid: 'rs2', chromosome: '2', position: '200', genotype: 'AA', sourceFile: 1 as const },
      { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'TT', sourceFile: 1 as const },
    ]

    const result = await mergeSnpsAsync({ snps: file1Snps }, { snps: [] }, defaultOptions)

    expect(result.mergedSnps[0].rsid).toBe('rs1')
    expect(result.mergedSnps[1].rsid).toBe('rs2')
  })
})
