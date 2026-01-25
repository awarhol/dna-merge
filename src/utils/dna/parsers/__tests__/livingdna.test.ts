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

  describe('includeInvalidPositions option', () => {
    it('should skip invalid positions by default', async () => {
      const content = `# Living DNA
# rsid	chromosome	position	genotype
rs1	1	100	AT
rs2	0	0	CG
rs3	1	0	GG
rs4	0	200	TT
rs5	22	300	AA`

      const result = await parseLivingDNAFileAsync(content, 1, undefined, false, false)

      expect(result.snps).toHaveLength(2)
      expect(result.snps[0].rsid).toBe('rs1')
      expect(result.snps[1].rsid).toBe('rs5')
      expect(result.errors).toHaveLength(3)
    })

    it('should keep standard rsIDs with invalid positions when option enabled', async () => {
      const content = `# Living DNA
# rsid	chromosome	position	genotype
rs1	1	100	AT
rs2	0	0	CG
rs3	1	0	GG
rs4	0	200	TT
rs5	22	300	AA`

      const result = await parseLivingDNAFileAsync(content, 1, undefined, false, true)

      expect(result.snps).toHaveLength(5)
      expect(result.snps[1].rsid).toBe('rs2')
      expect(result.snps[1].chromosome).toBe('0')
      expect(result.snps[1].position).toBe('0')
      expect(result.snps[1].genotype).toBe('CG')
      expect(result.errors).toHaveLength(0)
    })

    it('should handle multi-base genotypes with invalid positions when both options enabled', async () => {
      const content = `# Living DNA
# rsid	chromosome	position	genotype
rs1	1	100	TAAGTGTAAGTG
rs2	0	0	ATATCGATCG
rs3	1	0	AGA
i3000001	0	100	CGCG`

      const result = await parseLivingDNAFileAsync(content, 1, undefined, true, true)

      expect(result.snps).toHaveLength(4)
      expect(result.snps[0].genotype).toBe('TAAGTG TAAGTG')
      expect(result.snps[1].genotype).toBe('ATATC GATCG')
      expect(result.snps[1].chromosome).toBe('0')
      expect(result.snps[2].genotype).toBe('A GA')
      expect(result.snps[3].genotype).toBe('CG CG')
      expect(result.errors).toHaveLength(0)
    })

    it('should skip multi-base genotypes with invalid positions when parseMultibaseGenotypes is disabled', async () => {
      const content = `# Living DNA
# rsid	chromosome	position	genotype
rs1	1	100	AT
rs2	0	0	ATATCGATCG
rs3	1	0	AGA`

      const result = await parseLivingDNAFileAsync(content, 1, undefined, false, true)

      expect(result.snps).toHaveLength(1)
      expect(result.snps[0].rsid).toBe('rs1')
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].reason).toContain('multi-base genotype')
      expect(result.errors[1].reason).toContain('multi-base genotype')
    })

    it('should skip non-standard IDs with missing genotypes even when option enabled', async () => {
      const content = `# Living DNA
# rsid	chromosome	position	genotype
i3000001	0	0	--
exm-rs123	1	0	00
custom_snp	0	100	--
rs12345	0	0	--`

      const result = await parseLivingDNAFileAsync(content, 1, undefined, false, true)

      expect(result.snps).toHaveLength(1)
      expect(result.snps[0].rsid).toBe('rs12345') // Standard rsID kept even with --
      expect(result.errors).toHaveLength(3)
    })
  })
})
