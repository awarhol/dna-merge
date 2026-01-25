import type { ParseResult, SNP, SkippedEntry } from '../types'
import {
  isValidChromosome,
  validateGenotype,
  hasInvalidPosition,
  shouldKeepInvalidPosition,
} from '../validation'
import { yieldToMainThread } from './common'

export async function parse23andMeFileAsync(
  content: string,
  sourceFile: number = 0,
  onProgress?: (progress: number) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parseMultibaseGenotypes = false,
  includeInvalidPositions = false
): Promise<ParseResult> {
  const BATCH_SIZE = 5000
  const lines = content.split('\n')
  const snps: SNP[] = []
  const errors: SkippedEntry[] = []
  let fileId: string | undefined
  let signature: string | undefined
  let timestamp: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Skip empty lines
    if (trimmedLine === '') {
      continue
    }

    // Extract metadata from comment lines
    if (trimmedLine.startsWith('#')) {
      // Extract file_id
      if (trimmedLine.includes('file_id:')) {
        const match = trimmedLine.match(/file_id:\s*(.+)$/i)
        if (match) {
          fileId = match[1].trim()
        }
      }
      // Extract signature
      if (trimmedLine.includes('signature:')) {
        const match = trimmedLine.match(/signature:\s*(.+)$/i)
        if (match) {
          signature = match[1].trim()
        }
      }
      // Extract timestamp
      if (trimmedLine.includes('timestamp:')) {
        const match = trimmedLine.match(/timestamp:\s*(.+)$/i)
        if (match) {
          timestamp = match[1].trim()
        }
      }
      // Skip all comment lines (including column header)
      continue
    }

    // Parse tab-separated data
    const parts = trimmedLine.split('\t')
    if (parts.length < 4) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: 'Insufficient columns (expected 4: rsid, chromosome, position, genotype)',
        sourceFile,
      })
      continue
    }

    const rsid = parts[0].trim()
    const chromosome = parts[1].trim()
    const position = parts[2].trim()
    const genotype = parts[3].trim()

    if (!rsid || !chromosome || !position || !genotype) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: 'Missing required fields',
        sourceFile,
      })
      continue
    }

    // Check if this row has invalid position (chromosome OR position = 0)
    if (hasInvalidPosition(chromosome, position)) {
      // Special handling for invalid positions
      if (shouldKeepInvalidPosition(rsid, genotype, includeInvalidPositions)) {
        // Keep this SNP even though position is invalid
        // Still validate genotype - allow single-character genotypes for hemizygous regions
        if (!validateGenotype(genotype, true)) {
          errors.push({
            lineNumber: i + 1,
            content: trimmedLine,
            reason: `Invalid genotype: ${genotype}`,
            sourceFile,
          })
          continue
        }

        // Add to SNPs with invalid position preserved
        snps.push({
          rsid,
          chromosome: chromosome.toUpperCase(),
          position,
          genotype,
          sourceFile,
        })
        continue
      } else {
        // Skip this row
        errors.push({
          lineNumber: i + 1,
          content: trimmedLine,
          reason: `Invalid position: chromosome=${chromosome}, position=${position}`,
          sourceFile,
        })
        continue
      }
    }

    // Normal validation for valid positions
    // Validate chromosome (1-22, X, Y, MT)
    if (!isValidChromosome(chromosome, '23andme')) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: `Invalid chromosome: ${chromosome} (valid: 1-22, X, Y, MT)`,
        sourceFile,
      })
      continue
    }

    // Validate genotype - allow single-character genotypes for hemizygous regions
    if (!validateGenotype(genotype, true)) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: `Invalid genotype: ${genotype}`,
        sourceFile,
      })
      continue
    }

    snps.push({
      rsid,
      chromosome: chromosome.toUpperCase(),
      position,
      genotype,
      sourceFile,
    })

    // Yield to main thread every BATCH_SIZE lines
    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.min(Math.round((i / lines.length) * 100), 99))
      }
      await yieldToMainThread()
    }
  }

  // Build metadata object
  const metadata:
    | {
        fileId?: string
        signature?: string
        timestamp?: string
      }
    | undefined = fileId || signature || timestamp ? { fileId, signature, timestamp } : undefined

  return { snps, errors, format: '23andme', metadata }
}
