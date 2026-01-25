import type { ParseResult, SNP, SkippedEntry } from '../types'
import {
  isValidChromosome,
  validateGenotype,
  hasInvalidPosition,
  shouldKeepInvalidPosition,
} from '../validation'
import { yieldToMainThread } from './common'

export async function parseMyHeritageFileAsync(
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
  let headerFound = false
  let chip: string | undefined
  let version: string | undefined
  let reference: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      // Extract metadata from comments
      if (trimmedLine.startsWith('##chip=')) {
        const match = trimmedLine.match(/^##chip=(.+)$/i)
        if (match) {
          chip = match[1]
        }
      }
      if (trimmedLine.startsWith('##format=')) {
        const match = trimmedLine.match(/^##format=(.+)$/i)
        if (match) {
          version = match[1]
        }
      }
      if (trimmedLine.startsWith('##reference=')) {
        const match = trimmedLine.match(/^##reference=(.+)$/i)
        if (match) {
          reference = match[1]
        }
      }
      continue
    }

    if (!headerFound && trimmedLine.toUpperCase().includes('RSID')) {
      headerFound = true
      continue
    }

    const parts = trimmedLine.match(/"([^"]*)"|([^,]+)/g)
    if (!parts || parts.length < 4) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: 'Insufficient columns (expected 4)',
        sourceFile,
      })
      continue
    }

    const rsid = parts[0].replace(/"/g, '').trim()
    const chromosome = parts[1].replace(/"/g, '').trim()
    const position = parts[2].replace(/"/g, '').trim()
    const genotype = parts[3].replace(/"/g, '').trim()

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
        // Still validate genotype
        if (!validateGenotype(genotype)) {
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
    if (!isValidChromosome(chromosome, 'myheritage')) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: `Invalid chromosome: ${chromosome} (valid: 1-22, X, Y, MT)`,
        sourceFile,
      })
      continue
    }

    if (!validateGenotype(genotype)) {
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

  const metadata: { chip?: string; version?: string; reference?: string } | undefined =
    chip || version || reference ? { chip, version, reference } : undefined

  return { snps, errors, format: 'myheritage', metadata }
}
