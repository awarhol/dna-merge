import { describe, it, expect } from 'vitest'
import { parseMyHeritageFileAsync } from '../myheritage'
import { MYHERITAGE_SAMPLE } from '../../__tests__/fixtures'

describe('parseMyHeritageFile', () => {
  it('should parse MyHeritage file asynchronously', async () => {
    const result = await parseMyHeritageFileAsync(MYHERITAGE_SAMPLE, 1)

    expect(result.snps).toHaveLength(5)
    expect(result.errors).toHaveLength(0)
    expect(result.format).toBe('myheritage')
  })

  it('should handle large files with batching', async () => {
    // Create a large file with 10,000 SNPs
    const header = `##fileformat=MyHeritage
##format=MHv1.0
RSID,CHROMOSOME,POSITION,RESULT
`
    const snpLines = Array.from(
      { length: 10000 },
      (_, i) => `"rs${i}","1","${1000 + i}","AT"`
    ).join('\n')
    const largeFile = header + snpLines

    const result = await parseMyHeritageFileAsync(largeFile, 1)

    expect(result.snps).toHaveLength(10000)
    expect(result.format).toBe('myheritage')
    expect(result.errors).toHaveLength(0)
  })

  it('should validate and report errors asynchronously', async () => {
    const invalidContent = `##fileformat=MyHeritage
RSID,CHROMOSOME,POSITION,RESULT
"rs123","1","100","AT"
"rs456","99","200","CG"
"rs789","1","300","XY"`

    const result = await parseMyHeritageFileAsync(invalidContent, 1)

    expect(result.snps).toHaveLength(1) // Only first SNP is valid
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].reason).toContain('Invalid chromosome')
    expect(result.errors[1].reason).toContain('Invalid genotype')
  })

  it('should handle different chromosomes asynchronously', async () => {
    const content = `##fileformat=MyHeritage
RSID,CHROMOSOME,POSITION,RESULT
"rs1","1","100","AT"
"rs2","X","200","CG"
"rs3","Y","300","GG"
"rs4","MT","400","TT"`

    const result = await parseMyHeritageFileAsync(content, 1)

    expect(result.snps).toHaveLength(4)
    expect(result.snps.map(s => s.chromosome)).toEqual(['1', 'X', 'Y', 'MT'])
  })

  it('should handle quoted CSV fields asynchronously', async () => {
    const content = `##fileformat=MyHeritage
RSID,CHROMOSOME,POSITION,RESULT
"rs3131972","1","752721","GG"
"rs114525117","1","759036","GG"`

    const result = await parseMyHeritageFileAsync(content, 1)

    expect(result.snps).toHaveLength(2)
    expect(result.snps[0].rsid).toBe('rs3131972')
    expect(result.snps[0].genotype).toBe('GG')
  })
})
