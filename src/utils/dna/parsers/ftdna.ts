import type { ParseResult, SNP, SkippedEntry } from '../types'
import { isValidChromosome, validateGenotype } from '../validation'
import { yieldToMainThread } from './common'

export async function parseFTDNAFileAsync(
  content: string,
  sourceFile: 1 | 2 = 1,
  onProgress?: (progress: number) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parseMultibaseGenotypes = false
): Promise<ParseResult> {
  const BATCH_SIZE = 5000
  const lines = content.split('\n')
  const snps: SNP[] = []
  const errors: SkippedEntry[] = []
  let headerFound = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue
    }

    if (!headerFound && trimmedLine.toUpperCase().includes('RSID')) {
      headerFound = true
      continue
    }

    // Handle both quoted and unquoted CSV formats
    const parts = trimmedLine.includes('"')
      ? trimmedLine.match(/"([^"]*)"|([^,]+)/g) // Quoted CSV
      : trimmedLine.split(',') // Unquoted CSV

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

    if (!isValidChromosome(chromosome, 'ftdna')) {
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

  return { snps, errors, format: 'ftdna' }
}
