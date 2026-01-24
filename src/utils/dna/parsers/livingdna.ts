import type { ParseResult, SNP, SkippedEntry } from '../types'
import { isValidChromosome, validateGenotype } from '../validation'
import { normalizeChromosome, yieldToMainThread } from './common'

export async function parseLivingDNAFileAsync(
  content: string,
  sourceFile: 1 | 2 = 1,
  onProgress?: (progress: number) => void
): Promise<ParseResult> {
  const BATCH_SIZE = 5000
  const lines = content.split('\n')
  const snps: SNP[] = []
  const errors: SkippedEntry[] = []
  let headerFound = false
  let chip: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      // Extract chip format from comments
      if (trimmedLine.toLowerCase().includes('genotype chip:')) {
        const match = trimmedLine.match(/genotype chip:\s*(\S+)/i)
        if (match) {
          chip = match[1]
        }
      }
      continue
    }

    if (!headerFound && trimmedLine.toLowerCase().includes('rsid')) {
      headerFound = true
      continue
    }

    // Split on any whitespace (tabs or spaces)
    const parts = trimmedLine.split(/\s+/)

    if (parts.length < 4) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: 'Insufficient columns (expected 4)',
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

    if (!isValidChromosome(chromosome, 'livingdna')) {
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

    const normalizedChromosome = normalizeChromosome(chromosome, 'ancestry')

    snps.push({
      rsid,
      chromosome: normalizedChromosome,
      position,
      genotype,
      sourceFile,
    })

    // Report progress and yield to main thread every BATCH_SIZE lines
    if (i % BATCH_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.min(Math.round((i / lines.length) * 100), 99))
      }
      await yieldToMainThread()
    }
  }

  return { snps, errors, format: 'livingdna', chip }
}
