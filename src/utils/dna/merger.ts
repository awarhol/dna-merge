import type { SNP, MergeResult, ConflictEntry, SkippedEntry, MergeOptions } from './types'
import { isMissingValue } from './validation'
import { chromosomeToSortKey, normalizeGenotypeForComparison } from './formatters/common'

// Helper to yield to the main thread
const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0))

export async function mergeSnpsAsync(
  file1: { snps: SNP[]; metadata?: { chip?: string; version?: string; reference?: string } },
  file2: { snps: SNP[]; metadata?: { chip?: string; version?: string; reference?: string } },
  options: MergeOptions,
  onProgress?: (progress: number) => void
): Promise<MergeResult> {
  const BATCH_SIZE = 5000
  const { preferredFile, fillMissing } = options
  const conflicts: ConflictEntry[] = []
  const skippedRows: SkippedEntry[] = []
  const snpMap = new Map<string, SNP>()

  const file1Snps = file1.snps
  const file2Snps = file2.snps

  // Helper to get file name
  const getFormatName = (fileNum: 1 | 2) => {
    return `File ${fileNum}`
  }

  // Phase 1: Add all file1 SNPs to map (0-40%)
  for (let i = 0; i < file1Snps.length; i++) {
    snpMap.set(file1Snps[i].rsid, file1Snps[i])

    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.min(Math.round((i / file1Snps.length) * 40), 39))
      }
      await yieldToMainThread()
    }
  }

  if (onProgress) {
    onProgress(40)
  }

  // Phase 2: Process file2 SNPs and detect conflicts (40-80%)
  for (let i = 0; i < file2Snps.length; i++) {
    const snp = file2Snps[i]
    const existing = snpMap.get(snp.rsid)

    if (existing) {
      // Normalize genotypes for comparison (handles A vs AA from 23andMe)
      const existingNormalized = normalizeGenotypeForComparison(existing.genotype)
      const snpNormalized = normalizeGenotypeForComparison(snp.genotype)

      if (existingNormalized !== snpNormalized) {
        let chosenGenotype = existing.genotype
        let resolutionReason = `Preferred ${getFormatName(1)}`

        // Priority 1: Fill missing if enabled
        if (fillMissing) {
          const file1Missing = isMissingValue(existing.genotype)
          const file2Missing = isMissingValue(snp.genotype)

          if (file1Missing && !file2Missing) {
            chosenGenotype = snp.genotype
            resolutionReason = `Filled Missing from ${getFormatName(2)}`
            snpMap.set(snp.rsid, { ...snp, sourceFile: 2 })
          } else if (file2Missing && !file1Missing) {
            resolutionReason = `Filled Missing from ${getFormatName(1)}`
          } else if (!file1Missing && !file2Missing) {
            // Both have values, use preferred file
            chosenGenotype = preferredFile === 2 ? snp.genotype : existing.genotype
            resolutionReason = `Preferred ${getFormatName(preferredFile)}`
            if (preferredFile === 2) {
              snpMap.set(snp.rsid, { ...snp, sourceFile: 2 })
            }
          }
        } else {
          // Fill missing disabled, use preferred file
          chosenGenotype = preferredFile === 2 ? snp.genotype : existing.genotype
          resolutionReason = `Preferred ${getFormatName(preferredFile)}`
          if (preferredFile === 2) {
            snpMap.set(snp.rsid, { ...snp, sourceFile: 2 })
          }
        }

        conflicts.push({
          rsid: snp.rsid,
          chromosome: snp.chromosome,
          position: snp.position,
          file1Genotype: existing.genotype,
          file2Genotype: snp.genotype,
          chosenGenotype,
          resolutionReason,
        })
      }
    } else {
      snpMap.set(snp.rsid, snp)
    }

    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.min(40 + Math.round((i / file2Snps.length) * 40), 79))
      }
      await yieldToMainThread()
    }
  }

  if (onProgress) {
    onProgress(80)
  }

  // Phase 3: Sort merged SNPs (80-100%)
  const mergedSnps = Array.from(snpMap.values()).sort((a, b) => {
    const chrA = chromosomeToSortKey(a.chromosome)
    const chrB = chromosomeToSortKey(b.chromosome)

    if (chrA !== chrB) {
      return chrA - chrB
    }

    const posA = parseInt(a.position, 10)
    const posB = parseInt(b.position, 10)
    return posA - posB
  })

  if (onProgress) {
    onProgress(100)
  }

  return {
    mergedSnps,
    conflicts,
    skippedRows,
    file1Metadata: file1.metadata,
    file2Metadata: file2.metadata,
  }
}
