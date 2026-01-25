import type { ParseResult, SNP, SkippedEntry } from '../types'
import { isValidChromosome, validateGenotype } from '../validation'
import { normalizeChromosome, yieldToMainThread } from './common'

export async function parseAncestryFileAsync(
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
  let chip: string | undefined
  let arrayVersion: string | undefined
  let converterVersion: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      // Extract metadata from comments
      if (trimmedLine.toLowerCase().includes('data was collected using')) {
        const chipMatch = trimmedLine.match(/data was collected using\s+([^\s]+)\s+array version:/i)
        if (chipMatch) {
          chip = chipMatch[1]
        }
        const versionMatch = trimmedLine.match(/array\s+version:\s*([^\s]+)/i)
        if (versionMatch) {
          arrayVersion = versionMatch[1]
        }
      }
      if (trimmedLine.toLowerCase().includes('converter version:')) {
        const match = trimmedLine.match(/converter\s+version:\s*([^\s]+)/i)
        if (match) {
          converterVersion = match[1]
        }
      }
      continue
    }

    if (!headerFound && trimmedLine.toLowerCase().includes('rsid')) {
      headerFound = true
      continue
    }

    const parts = trimmedLine.split('\t')

    if (parts.length < 5) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: 'Insufficient columns (expected 5)',
        sourceFile,
      })
      continue
    }

    const rsid = parts[0].trim()
    const chromosome = parts[1].trim()
    const position = parts[2].trim()
    const allele1 = parts[3].trim()
    const allele2 = parts[4].trim()
    const genotype = allele1 + allele2

    if (!rsid || !chromosome || !position) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: 'Missing required fields',
        sourceFile,
      })
      continue
    }

    if (!isValidChromosome(chromosome, 'ancestry')) {
      errors.push({
        lineNumber: i + 1,
        content: trimmedLine,
        reason: `Invalid chromosome: ${chromosome} (valid: 1-26, X, Y, MT)`,
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

    // Yield to main thread every BATCH_SIZE lines
    if (i > 0 && i % BATCH_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.min(Math.round((i / lines.length) * 100), 99))
      }
      await yieldToMainThread()
    }
  }

  // Build version string
  let version: string | undefined
  if (arrayVersion && converterVersion) {
    version = `Array: ${arrayVersion}, Converter: ${converterVersion}`
  } else if (arrayVersion) {
    version = `Array: ${arrayVersion}`
  } else if (converterVersion) {
    version = `Converter: ${converterVersion}`
  }

  const metadata: { chip?: string; version?: string; reference?: string } | undefined =
    chip || version ? { chip, version, reference: undefined } : undefined

  return { snps, errors, format: 'ancestry', metadata }
}
