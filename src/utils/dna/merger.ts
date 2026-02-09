import type {
  SNP,
  SkippedEntry,
  MergeResultN,
  ConflictEntryN,
  MergeOptionsN,
  ParseResult,
} from './types'
import { isMissingValue } from './validation'
import { chromosomeToSortKey, normalizeGenotypeForComparison } from './formatters/common'

// Helper to yield to the main thread
const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0))

// Consensus resolution helper function
function resolveByConsensus(
  fileGenotypes: (string | null)[],
  normalizedGenotypes: (string | null)[]
): {
  chosenGenotype: string
  chosenFromFile: number
  resolutionReason: string
} {
  // Count occurrences of each non-null genotype
  const genotypeCounts = new Map<string, { count: number; fileIndices: number[] }>()

  normalizedGenotypes.forEach((genotype, index) => {
    if (genotype !== null && !isMissingValue(genotype)) {
      if (!genotypeCounts.has(genotype)) {
        genotypeCounts.set(genotype, { count: 0, fileIndices: [] })
      }
      const existing = genotypeCounts.get(genotype)!
      existing.count++
      existing.fileIndices.push(index)
    }
  })

  if (genotypeCounts.size === 0) {
    // All values are missing
    return {
      chosenGenotype: '--',
      chosenFromFile: 0,
      resolutionReason: 'Consensus: All files missing, used File 1 placeholder',
    }
  }

  // Find the genotype with the highest count
  let maxCount = 0
  let winnerGenotype = ''
  let winnerFileIndices: number[] = []

  for (const [genotype, data] of genotypeCounts.entries()) {
    if (data.count > maxCount) {
      maxCount = data.count
      winnerGenotype = genotype
      winnerFileIndices = data.fileIndices
    }
  }

  // Check for ties
  const tiedGenotypes = Array.from(genotypeCounts.entries())
    .filter(([, data]) => data.count === maxCount)
    .map(([genotype]) => genotype)

  let chosenFromFile = winnerFileIndices[0]
  let resolutionReason: string
  let chosenGenotype = ''

  if (tiedGenotypes.length === 1) {
    // Clear consensus
    resolutionReason = `Consensus: ${winnerGenotype} (${maxCount}/${fileGenotypes.length} files)`
  } else {
    // Tie - fall back to priority order (lowest file index)
    const tieGenotypes = tiedGenotypes
      .map(genotype => ({
        genotype,
        fileIndex: genotypeCounts.get(genotype)!.fileIndices[0],
      }))
      .sort((a, b) => a.fileIndex - b.fileIndex)

    winnerGenotype = tieGenotypes[0].genotype
    chosenFromFile = tieGenotypes[0].fileIndex
    resolutionReason = `Consensus: Tie between ${tiedGenotypes.join(', ')}, used ${winnerGenotype} from File ${chosenFromFile + 1} (priority)`
  }

  // Get the original genotype from the chosen file
  chosenGenotype = fileGenotypes[chosenFromFile] || '--'

  return {
    chosenGenotype,
    chosenFromFile,
    resolutionReason,
  }
}

// N-way merge function supporting 1-10 files
export async function mergeSnpsAsyncN(
  files: ParseResult[],
  options: MergeOptionsN,
  onProgress?: (progress: number) => void
): Promise<MergeResultN> {
  const BATCH_SIZE = 5000
  const { fillMissing } = options
  const conflicts: ConflictEntryN[] = []
  const allSkippedRows: SkippedEntry[] = []

  // Track genotypes from all files for each RSID
  const snpMap = new Map<
    string,
    {
      snp: SNP
      fileGenotypes: (string | null)[] // Track genotype from each file
    }
  >()

  // Phase 1: Parse and index all files (0-60%)
  const totalSnps = files.reduce((sum, file) => sum + file.snps.length, 0)
  let processedSnps = 0

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex]

    // Collect skipped rows from each file
    allSkippedRows.push(
      ...file.errors.map(error => ({
        ...error,
        sourceFile: fileIndex,
      }))
    )

    for (let i = 0; i < file.snps.length; i++) {
      const snp = file.snps[i]
      const existing = snpMap.get(snp.rsid)

      if (existing) {
        // SNP exists from a previous file - track this file's genotype
        existing.fileGenotypes[fileIndex] = snp.genotype
      } else {
        // New SNP - initialize genotype tracking
        const fileGenotypes = new Array(files.length).fill(null)
        fileGenotypes[fileIndex] = snp.genotype
        snpMap.set(snp.rsid, {
          snp: { ...snp, sourceFile: fileIndex },
          fileGenotypes,
        })
      }

      processedSnps++
      if (i > 0 && i % BATCH_SIZE === 0) {
        if (onProgress) {
          onProgress(Math.min(Math.round((processedSnps / totalSnps) * 60), 59))
        }
        await yieldToMainThread()
      }
    }
  }

  if (onProgress) {
    onProgress(60)
  }

  // Phase 2: Resolve conflicts (60-90%)
  const entries = Array.from(snpMap.entries())
  for (let i = 0; i < entries.length; i++) {
    const [rsid, { snp, fileGenotypes }] = entries[i]

    // Check if there are any conflicts (different non-null values)
    const normalizedGenotypes = fileGenotypes.map(g =>
      g !== null ? normalizeGenotypeForComparison(g) : null
    )
    const uniqueNonNull = new Set(normalizedGenotypes.filter(g => g !== null))

    if (uniqueNonNull.size > 1) {
      // Conflict detected - resolve it
      let chosenGenotype: string
      let chosenFromFile: number
      let resolutionReason: string

      if (options.conflictResolution === 'consensus' && fileGenotypes.length > 2) {
        // Use consensus resolution for 3+ files
        const consensusResult = resolveByConsensus(fileGenotypes, normalizedGenotypes)
        chosenGenotype = consensusResult.chosenGenotype
        chosenFromFile = consensusResult.chosenFromFile
        resolutionReason = consensusResult.resolutionReason
      } else {
        // Priority-based resolution (existing logic)
        if (fillMissing) {
          // Scan files 0→N for first non-missing value
          let foundIndex = -1
          for (let j = 0; j < fileGenotypes.length; j++) {
            const genotype = fileGenotypes[j]
            if (genotype !== null && !isMissingValue(genotype)) {
              foundIndex = j
              break
            }
          }

          if (foundIndex >= 0) {
            chosenGenotype = fileGenotypes[foundIndex]!
            chosenFromFile = foundIndex
            resolutionReason = `Filled missing from File ${foundIndex + 1} (highest priority non-missing)`
          } else {
            // All missing - use first file
            chosenGenotype = fileGenotypes[0] || '--'
            chosenFromFile = 0
            resolutionReason = 'All files missing, used File 1 placeholder'
          }
        } else {
          // No fill missing - always use File[0]
          chosenGenotype = fileGenotypes[0] || '--'
          chosenFromFile = 0
          resolutionReason = 'Used File 1 (highest priority)'
        }
      }

      conflicts.push({
        rsid,
        chromosome: snp.chromosome,
        position: snp.position,
        fileGenotypes,
        chosenGenotype,
        chosenFromFile,
        resolutionReason,
      })

      // Update the SNP with the chosen value
      snpMap.set(rsid, {
        snp: { ...snp, genotype: chosenGenotype, sourceFile: chosenFromFile },
        fileGenotypes,
      })
    }

    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.min(60 + Math.round((i / entries.length) * 30), 89))
      }
      await yieldToMainThread()
    }
  }

  if (onProgress) {
    onProgress(90)
  }

  // Phase 3: Sort merged SNPs (90-100%)
  const mergedSnps = Array.from(snpMap.values())
    .map(({ snp }) => snp)
    .sort((a, b) => {
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
    skippedRows: allSkippedRows,
    filesMetadata: files.map(f => f.metadata || {}),
  }
}
