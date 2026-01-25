import { describe, it, expect } from 'vitest'
import { generateMyHeritageCsv } from '../myheritage'

describe('generateMyHeritageCsv', () => {
  it('should generate valid MyHeritage CSV format', async () => {
    const snps = [
      { rsid: 'rs123', chromosome: '1', position: '100', genotype: 'AA', sourceFile: 1 as const },
    ]

    const result = generateMyHeritageCsv(snps)

    expect(result.csv).toContain('##fileformat=MyHeritage')
    expect(result.csv).toContain('RSID,CHROMOSOME,POSITION,RESULT')
    expect(result.csv).toContain('"rs123","1","100","AA"')
    expect(result.excludedPAR).toBe(0)
  })

  it('should exclude XY (Pseudoautosomal) chromosomes', async () => {
    const snps = [
      { rsid: 'rs1', chromosome: 'X', position: '100', genotype: 'AA', sourceFile: 1 as const },
      { rsid: 'rs2', chromosome: 'XY', position: '200', genotype: 'TT', sourceFile: 1 as const },
      { rsid: 'rs3', chromosome: '25', position: '300', genotype: 'CC', sourceFile: 1 as const }, // Ancestry PAR format
      { rsid: 'rs4', chromosome: 'Y', position: '400', genotype: 'GG', sourceFile: 1 as const },
    ]

    const result = generateMyHeritageCsv(snps)

    expect(result.csv).toContain('"rs1"')
    expect(result.csv).not.toContain('"rs2"')
    expect(result.csv).not.toContain('"rs3"')
    expect(result.csv).toContain('"rs4"')
    expect(result.excludedPAR).toBe(2)
  })

  it('should include timestamp in header', async () => {
    const result = generateMyHeritageCsv([])
    expect(result.csv).toMatch(/##timestamp=.*UTC/)
  })

  it('should handle single-character genotypes from 23andMe', async () => {
    const snps = [
      { rsid: 'rs1', chromosome: 'X', position: '100', genotype: 'A', sourceFile: 1 as const },
      { rsid: 'rs2', chromosome: 'Y', position: '200', genotype: 'T', sourceFile: 1 as const },
      { rsid: 'rs3', chromosome: 'MT', position: '300', genotype: 'C', sourceFile: 1 as const },
      { rsid: 'rs4', chromosome: 'X', position: '400', genotype: 'G', sourceFile: 1 as const },
    ]

    const result = generateMyHeritageCsv(snps)

    expect(result.csv).toContain('"rs1","X","100","AA"') // A → AA
    expect(result.csv).toContain('"rs2","Y","200","TT"') // T → TT
    expect(result.csv).toContain('"rs3","MT","300","CC"') // C → CC
    expect(result.csv).toContain('"rs4","X","400","GG"') // G → GG
    expect(result.excludedPAR).toBe(0)
  })
})
