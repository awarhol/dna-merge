import { describe, it, expect } from 'vitest'
import { mergeSnpsAsyncN } from '../merger'
import { parseAncestryFileAsync } from '../parsers/ancestry'
import { parseMyHeritageFileAsync } from '../parsers/myheritage'
import { ANCESTRY_SAMPLE, MYHERITAGE_SAMPLE } from './fixtures'
import type { ParseResult, SNP, SkippedEntry } from '../types'

const createMockParseResult = (snps: SNP[], errors: SkippedEntry[] = []): ParseResult => ({
  snps,
  errors,
  format: 'ancestry',
  metadata: {},
})

describe('mergeSnpsAsyncN - 2 file compatibility', () => {
  it('should merge SNPs from two files without duplicates', async () => {
    const file1 = await parseAncestryFileAsync(ANCESTRY_SAMPLE, 0)
    const file2 = await parseMyHeritageFileAsync(MYHERITAGE_SAMPLE, 1)

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.mergedSnps.length).toBeGreaterThan(0)
    expect(result.mergedSnps.length).toBeLessThanOrEqual(file1.snps.length + file2.snps.length)
  })

  it('should detect conflicts when same RSID has different genotypes', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].fileGenotypes).toEqual(['AA', 'AC'])
    expect(result.conflicts[0].chosenGenotype).toBe('AA')
    expect(result.conflicts[0].chosenFromFile).toBe(0)
  })

  it('should prioritize first file when fillMissing is false', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: false,
      conflictResolution: 'priority',
    })

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('AA')
    expect(result.conflicts[0].chosenFromFile).toBe(0)
  })

  it('should respect file array order for priority', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file2, file1], {
      fillMissing: false,
      conflictResolution: 'priority',
    })

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('AC')
  })

  it('should fill missing values when fillMissing is true', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: '--', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('AC')
    expect(result.conflicts[0].chosenFromFile).toBe(1)
  })

  it('should not fill missing values when fillMissing is false', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: '--', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: false,
      conflictResolution: 'priority',
    })

    const mergedSnp = result.mergedSnps.find(s => s.rsid === 'rs123')
    expect(mergedSnp?.genotype).toBe('--')
  })

  it('should sort by chromosome and position', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs2', chromosome: '2', position: '200', genotype: 'AA', sourceFile: 0 },
      { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'TT', sourceFile: 0 },
    ])

    const result = await mergeSnpsAsyncN([file1], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.mergedSnps[0].rsid).toBe('rs1')
    expect(result.mergedSnps[1].rsid).toBe('rs2')
  })

  it('should not create conflict when single char matches double char', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: 'X', position: '100', genotype: 'A', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: 'X', position: '100', genotype: 'AA', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.conflicts).toHaveLength(0)
    expect(result.mergedSnps).toHaveLength(1)
  })

  it('should not create conflict for all single-character nucleotides', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs1', chromosome: 'X', position: '100', genotype: 'A', sourceFile: 0 },
      { rsid: 'rs2', chromosome: 'Y', position: '200', genotype: 'T', sourceFile: 0 },
      { rsid: 'rs3', chromosome: 'MT', position: '300', genotype: 'C', sourceFile: 0 },
      { rsid: 'rs4', chromosome: 'X', position: '400', genotype: 'G', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs1', chromosome: 'X', position: '100', genotype: 'AA', sourceFile: 1 },
      { rsid: 'rs2', chromosome: 'Y', position: '200', genotype: 'TT', sourceFile: 1 },
      { rsid: 'rs3', chromosome: 'MT', position: '300', genotype: 'CC', sourceFile: 1 },
      { rsid: 'rs4', chromosome: 'X', position: '400', genotype: 'GG', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.conflicts).toHaveLength(0)
    expect(result.mergedSnps).toHaveLength(4)
  })

  it('should still detect real conflicts with single-character support', async () => {
    const file1 = createMockParseResult([
      { rsid: 'rs123', chromosome: 'X', position: '100', genotype: 'A', sourceFile: 0 },
    ])
    const file2 = createMockParseResult([
      { rsid: 'rs123', chromosome: 'X', position: '100', genotype: 'CC', sourceFile: 1 },
    ])

    const result = await mergeSnpsAsyncN([file1, file2], {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].fileGenotypes).toEqual(['A', 'CC'])
  })
})

describe('mergeSnpsAsyncN - N-way merge', () => {
  it('should merge 3 files with priority-based resolution', async () => {
    const files = [
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 2 },
      ]),
    ]

    const result = await mergeSnpsAsyncN(files, {
      fillMissing: false,
      conflictResolution: 'priority',
    })

    expect(result.mergedSnps[0].genotype).toBe('AA')
    expect(result.conflicts[0].chosenFromFile).toBe(0)
  })

  it('should fill missing values from first non-missing file', async () => {
    const files = [
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: '--', sourceFile: 0 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: '--', sourceFile: 1 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 2 },
      ]),
    ]

    const result = await mergeSnpsAsyncN(files, {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.mergedSnps[0].genotype).toBe('AC')
    expect(result.conflicts[0].chosenFromFile).toBe(2)
  })

  it('should handle 10 files', async () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      createMockParseResult([
        {
          rsid: 'rs1',
          chromosome: '1',
          position: '100',
          genotype: i === 5 ? 'AA' : '--',
          sourceFile: i,
        },
      ])
    )

    const result = await mergeSnpsAsyncN(files, {
      fillMissing: true,
      conflictResolution: 'priority',
    })

    expect(result.mergedSnps[0].genotype).toBe('AA')
    expect(result.conflicts[0].chosenFromFile).toBe(5)
  })

  it('should track all file genotypes in conflicts', async () => {
    const files = [
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AC', sourceFile: 1 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 2 },
      ]),
    ]

    const result = await mergeSnpsAsyncN(files, {
      fillMissing: false,
      conflictResolution: 'priority',
    })

    expect(result.conflicts[0].fileGenotypes).toEqual(['AA', 'AC', 'CC'])
  })

  it('should use first file when fillMissing is false', async () => {
    const files = [
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
      ]),
      createMockParseResult([
        { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 1 },
      ]),
    ]

    const result = await mergeSnpsAsyncN(files, {
      fillMissing: false,
      conflictResolution: 'priority',
    })

    expect(result.mergedSnps[0].genotype).toBe('AA')
  })

  describe('Consensus Resolution', () => {
    it('should select majority genotype with consensus resolution', async () => {
      const files = [
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
          { rsid: 'rs2', chromosome: '1', position: '200', genotype: 'CC', sourceFile: 0 }, // This one should lose
        ]),
        createMockParseResult([
          { rsid: 'rs2', chromosome: '1', position: '200', genotype: 'CT', sourceFile: 1 }, // Majority
          { rsid: 'rs3', chromosome: '1', position: '300', genotype: 'GG', sourceFile: 1 },
        ]),
        createMockParseResult([
          { rsid: 'rs2', chromosome: '1', position: '200', genotype: 'CT', sourceFile: 2 }, // Majority
          { rsid: 'rs4', chromosome: '1', position: '400', genotype: 'TT', sourceFile: 2 },
        ]),
      ]

      const result = await mergeSnpsAsyncN(files, {
        fillMissing: true,
        conflictResolution: 'consensus',
      })

      expect(result.mergedSnps).toHaveLength(4)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].rsid).toBe('rs2')
      expect(result.conflicts[0].chosenGenotype).toBe('CT')
      expect(result.conflicts[0].resolutionReason).toContain('Consensus: CT (2/3 files)')
    })

    it('should handle ties in consensus resolution with priority fallback', async () => {
      const files = [
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 }, // Should win by priority
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 1 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'TT', sourceFile: 2 },
        ]),
      ]

      const result = await mergeSnpsAsyncN(files, {
        fillMissing: true,
        conflictResolution: 'consensus',
      })

      expect(result.mergedSnps).toHaveLength(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].chosenGenotype).toBe('AA')
      expect(result.conflicts[0].chosenFromFile).toBe(0)
      expect(result.conflicts[0].resolutionReason).toContain('Tie between AA, CC, TT')
      expect(result.conflicts[0].resolutionReason).toContain('used AA from File 1 (priority)')
    })

    it('should ignore missing values in consensus calculation', async () => {
      const files = [
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: '--', sourceFile: 0 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CT', sourceFile: 1 }, // Should win
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CT', sourceFile: 2 }, // Should win
        ]),
      ]

      const result = await mergeSnpsAsyncN(files, {
        fillMissing: true,
        conflictResolution: 'consensus',
      })

      expect(result.mergedSnps).toHaveLength(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].chosenGenotype).toBe('CT')
      expect(result.conflicts[0].resolutionReason).toContain('Consensus: CT (2/3 files)')
    })

    it('should handle consensus with all missing values', async () => {
      const files = [
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: '--', sourceFile: 0 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: '00', sourceFile: 1 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: '--', sourceFile: 2 },
        ]),
      ]

      const result = await mergeSnpsAsyncN(files, {
        fillMissing: true,
        conflictResolution: 'consensus',
      })

      expect(result.mergedSnps).toHaveLength(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].chosenGenotype).toBe('--')
      expect(result.conflicts[0].resolutionReason).toContain('Consensus: All files missing')
    })

    it('should fall back to priority resolution for 2 files with consensus selected', async () => {
      const files = [
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 1 },
        ]),
      ]

      const result = await mergeSnpsAsyncN(files, {
        fillMissing: true,
        conflictResolution: 'consensus',
      })

      expect(result.mergedSnps).toHaveLength(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].chosenGenotype).toBe('AA')
      expect(result.conflicts[0].resolutionReason).toContain('highest priority non-missing')
    })

    it('should handle complex consensus scenarios with many files', async () => {
      const files = [
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 0 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 1 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 2 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'CC', sourceFile: 3 },
        ]),
        createMockParseResult([
          { rsid: 'rs1', chromosome: '1', position: '100', genotype: 'GG', sourceFile: 4 },
        ]),
      ]

      const result = await mergeSnpsAsyncN(files, {
        fillMissing: true,
        conflictResolution: 'consensus',
      })

      expect(result.mergedSnps).toHaveLength(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].chosenGenotype).toBe('CC')
      expect(result.conflicts[0].resolutionReason).toContain('Consensus: CC (3/5 files)')
    })
  })
})
