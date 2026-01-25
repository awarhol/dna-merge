import { describe, it, expect } from 'vitest'
import { parseFTDNAFileAsync } from '../ftdna'
import { FTDNA_SAMPLE } from '../../__tests__/fixtures'

describe('parseFTDNAFile', () => {
  it('should parse FTDNA file asynchronously', async () => {
    const result = await parseFTDNAFileAsync(FTDNA_SAMPLE, 1)

    expect(result.snps).toHaveLength(8)
    expect(result.errors).toHaveLength(0)
    expect(result.format).toBe('ftdna')
  })

  it('should handle distinctive FTDNA RSID patterns', async () => {
    const result = await parseFTDNAFileAsync(FTDNA_SAMPLE, 1)

    const rsids = result.snps.map(s => s.rsid)
    expect(rsids).toContain('2010-08-Y-1221')
    expect(rsids).toContain('GSA-1:120044893')
    expect(rsids).toContain('2010-09-X-2345')
    expect(rsids).toContain('GSA-2:220044893')
  })

  it('should handle large files with batching', async () => {
    // Create a large file with 10,000 SNPs
    const header = `RSID,CHROMOSOME,POSITION,RESULT
`
    const snpLines = Array.from({ length: 10000 }, (_, i) => `rs${i},1,${1000 + i},AT`).join('\n')
    const largeFile = header + snpLines

    const result = await parseFTDNAFileAsync(largeFile, 1)

    expect(result.snps).toHaveLength(10000)
    expect(result.format).toBe('ftdna')
    expect(result.errors).toHaveLength(0)
  })

  it('should validate and report errors asynchronously', async () => {
    const invalidContent = `RSID,CHROMOSOME,POSITION,RESULT
rs123,1,100,AT
rs456,99,200,CG
rs789,1,300,XY`

    const result = await parseFTDNAFileAsync(invalidContent, 1)

    expect(result.snps).toHaveLength(1) // Only first SNP is valid
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].reason).toContain('Invalid chromosome')
    expect(result.errors[1].reason).toContain('Invalid genotype')
  })

  it('should handle different chromosomes asynchronously', async () => {
    const content = `RSID,CHROMOSOME,POSITION,RESULT
rs1,1,100,AT
rs2,X,200,CG
rs3,Y,300,GG
rs4,MT,400,TT
rs5,22,500,AA`

    const result = await parseFTDNAFileAsync(content, 1)

    expect(result.snps).toHaveLength(5)
    expect(result.snps.map(s => s.chromosome)).toEqual(['1', 'X', 'Y', 'MT', '22'])
  })

  it('should handle unquoted CSV fields asynchronously', async () => {
    const content = `RSID,CHROMOSOME,POSITION,RESULT
rs3131972,1,752721,GG
rs114525117,1,759036,GG`

    const result = await parseFTDNAFileAsync(content, 1)

    expect(result.snps).toHaveLength(2)
    expect(result.snps[0].rsid).toBe('rs3131972')
    expect(result.snps[0].genotype).toBe('GG')
  })

  it('should handle quoted CSV fields asynchronously', async () => {
    const content = `RSID,CHROMOSOME,POSITION,RESULT
"rs3131972","1","752721","GG"
"rs114525117","1","759036","AG"`

    const result = await parseFTDNAFileAsync(content, 1)

    expect(result.snps).toHaveLength(2)
    expect(result.snps[0].rsid).toBe('rs3131972')
    expect(result.snps[0].genotype).toBe('GG')
    expect(result.snps[1].genotype).toBe('AG')
  })

  it('should handle missing values', async () => {
    const content = `RSID,CHROMOSOME,POSITION,RESULT
rs1,1,100,--
rs2,1,200,00
rs3,1,300,AT`

    const result = await parseFTDNAFileAsync(content, 1)

    expect(result.snps).toHaveLength(3)
    expect(result.snps[0].genotype).toBe('--')
    expect(result.snps[1].genotype).toBe('00')
    expect(result.snps[2].genotype).toBe('AT')
  })

  it('should skip comment lines without extracting metadata', async () => {
    const content = `# Family Tree DNA
# Some random comment
RSID,CHROMOSOME,POSITION,RESULT
rs1,1,100,AT
rs2,2,200,GG`

    const result = await parseFTDNAFileAsync(content, 1)

    expect(result.snps).toHaveLength(2)
    expect(result.metadata).toBeUndefined()
  })

  it('should call progress callback during parsing', async () => {
    const header = `RSID,CHROMOSOME,POSITION,RESULT
`
    const snpLines = Array.from({ length: 10000 }, (_, i) => `rs${i},1,${1000 + i},AT`).join('\n')
    const largeFile = header + snpLines

    const progressUpdates: number[] = []
    await parseFTDNAFileAsync(largeFile, 1, progress => {
      progressUpdates.push(progress)
    })

    expect(progressUpdates.length).toBeGreaterThan(0)
    expect(progressUpdates.some(p => p > 0)).toBe(true)
  })
})
