import { describe, it, expect } from 'vitest'
import { generateLogFile } from '../log'

describe('generateLogFile', () => {
  it('should generate log with conflicts and resolution reasons', async () => {
    const conflicts = [
      {
        rsid: 'rs123',
        chromosome: '1',
        position: '100',
        file1Genotype: 'AA',
        file2Genotype: 'AC',
        chosenGenotype: 'AA',
        resolutionReason: 'Preferred Ancestry',
      },
    ]

    const log = generateLogFile(conflicts, [])

    expect(log).toContain('DNA Merge Log')
    expect(log).toContain('CONFLICTS')
    expect(log).toContain('rs123')
    expect(log).toContain('Preferred Ancestry')
    expect(log).toContain('Resolution Reason')
  })

  it('should generate log with skipped rows', async () => {
    const skipped = [
      {
        lineNumber: 10,
        content: 'invalid line',
        reason: 'Invalid genotype',
        sourceFile: 1 as const,
      },
    ]

    const log = generateLogFile([], skipped)

    expect(log).toContain('SKIPPED ROWS')
    expect(log).toContain('invalid line')
    expect(log).toContain('Invalid genotype')
  })

  it('should include summary counts', async () => {
    const conflicts = [
      {
        rsid: 'rs1',
        chromosome: '1',
        position: '100',
        file1Genotype: 'AA',
        file2Genotype: 'AC',
        chosenGenotype: 'AA',
        resolutionReason: 'Preferred Ancestry',
      },
    ]
    const skipped = [{ lineNumber: 1, content: 'bad', reason: 'error', sourceFile: 1 as const }]

    const log = generateLogFile(conflicts, skipped)

    expect(log).toContain('Conflicts detected: 1')
    expect(log).toContain('Invalid rows skipped: 1')
  })

  it('should include 23andMe metadata in log', async () => {
    const file1Metadata = {
      fileId: '1234567890abcdef',
      signature: 'abc123def456',
      timestamp: '2026-01-25T08:00:00Z',
    }

    const file2Metadata = {
      chip: 'GSA',
      version: 'MHv1.0',
    }

    const log = generateLogFile(
      [],
      [],
      undefined,
      { file1: '23andme.txt', file2: 'myheritage.csv' },
      file1Metadata,
      file2Metadata
    )

    expect(log).toContain('File ID: 1234567890abcdef')
    expect(log).toContain('Signature: abc123def456')
    expect(log).toContain('Timestamp: 2026-01-25T08:00:00Z')
    expect(log).toContain('Chip: GSA')
    expect(log).toContain('Version: MHv1.0')
  })
})
