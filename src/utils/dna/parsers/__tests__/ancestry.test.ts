import { describe, it, expect } from 'vitest'
import { parseAncestryFileAsync } from '../ancestry'
import { ANCESTRY_SAMPLE } from '../../__tests__/fixtures'

describe('parseAncestryFile', () => {
  it('should parse ancestry file asynchronously', async () => {
    const result = await parseAncestryFileAsync(ANCESTRY_SAMPLE, 1)

    expect(result.snps).toHaveLength(5)
    expect(result.errors).toHaveLength(0)
    expect(result.format).toBe('ancestry')
  })

  it('should handle large files with batching', async () => {
    // Create a large file with 10,000 SNPs
    const header = `#AncestryDNA raw data download
rsid	chromosome	position	allele1	allele2
`
    const snpLines = Array.from({ length: 10000 }, (_, i) => `rs${i}\t1\t${1000 + i}\tA\tT`).join(
      '\n'
    )
    const largeFile = header + snpLines

    const result = await parseAncestryFileAsync(largeFile, 1)

    expect(result.snps).toHaveLength(10000)
    expect(result.format).toBe('ancestry')
    expect(result.errors).toHaveLength(0)
  })

  it('should validate and report errors asynchronously', async () => {
    const invalidContent = `#AncestryDNA raw data download
rsid	chromosome	position	allele1	allele2
rs123	1	100	A	T
rs456	99	200	C	G
rs789	1	300	X	Y`

    const result = await parseAncestryFileAsync(invalidContent, 1)

    expect(result.snps).toHaveLength(1) // Only first SNP is valid
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].reason).toContain('Invalid chromosome')
    expect(result.errors[1].reason).toContain('Invalid genotype')
  })

  it('should handle different chromosomes asynchronously', async () => {
    const content = `#AncestryDNA raw data download
rsid	chromosome	position	allele1	allele2
rs1	1	100	A	T
rs2	X	200	C	G
rs3	Y	300	G	G
rs4	MT	400	T	T
rs5	23	500	A	A`

    const result = await parseAncestryFileAsync(content, 1)

    expect(result.snps).toHaveLength(5)
    expect(result.snps.map(s => s.chromosome)).toEqual(['1', 'X', 'Y', 'MT', '23'])
  })
})
