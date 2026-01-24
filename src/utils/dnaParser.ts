// Helper to yield to the main thread
const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0))

export interface SNP {
  rsid: string
  chromosome: string
  position: string
  genotype: string
  sourceFile: 1 | 2
}

export interface ParseResult {
  snps: SNP[]
  errors: SkippedEntry[]
  format: 'ancestry' | 'myheritage'
}

export interface MergeResult {
  mergedSnps: SNP[]
  conflicts: ConflictEntry[]
  skippedRows: SkippedEntry[]
}

export interface ConflictEntry {
  rsid: string
  chromosome: string
  position: string
  file1Genotype: string
  file2Genotype: string
  chosenGenotype: string
  resolutionReason: string
}

export interface SkippedEntry {
  lineNumber: number
  content: string
  reason: string
  sourceFile: 1 | 2
}

export function getOppositeFormat(format: 'ancestry' | 'myheritage'): 'ancestry' | 'myheritage' {
  return format === 'ancestry' ? 'myheritage' : 'ancestry'
}

export function normalizeGenotypeForFormat(
  genotype: string,
  targetFormat: 'ancestry' | 'myheritage'
): string {
  const normalized = genotype.trim()

  if (targetFormat === 'myheritage') {
    // When converting to MyHeritage: "0 0" or "00" -> "--"
    if (normalized === '0 0' || normalized === '00') {
      return '--'
    }
  } else if (targetFormat === 'ancestry') {
    // When converting to Ancestry: "--" -> "0 0"
    if (normalized === '--') {
      return '00'
    }
  }

  return normalized
}

export function detectFormat(content: string): 'ancestry' | 'myheritage' | 'unknown' {
  const lines = content.split('\n')

  for (const line of lines) {
    if (line.trim() === '') continue

    if (line.startsWith('#') || line.startsWith('##')) {
      if (line.toLowerCase().includes('ancestrydna')) {
        return 'ancestry'
      }
      if (line.toLowerCase().includes('myheritage')) {
        return 'myheritage'
      }
      continue
    }

    if (line.includes('\t') && !line.includes(',')) {
      if (line.toLowerCase().includes('rsid') && line.toLowerCase().includes('allele')) {
        return 'ancestry'
      }
    }

    if (line.includes(',') && line.includes('"')) {
      if (line.toUpperCase().includes('RSID') && line.toUpperCase().includes('RESULT')) {
        return 'myheritage'
      }
    }
  }

  return 'unknown'
}

export function validateGenotype(genotype: string): boolean {
  const normalized = genotype.toUpperCase().trim()

  const validNucleotides = [
    'AA',
    'AT',
    'AC',
    'AG',
    'TA',
    'TT',
    'TC',
    'TG',
    'CA',
    'CT',
    'CC',
    'CG',
    'GA',
    'GT',
    'GC',
    'GG',
  ]
  const validSpecial = ['--', '00', 'DD', 'II', 'DI', 'ID']

  return validNucleotides.includes(normalized) || validSpecial.includes(normalized)
}

function isMissingValue(genotype: string): boolean {
  const normalized = genotype.toUpperCase().trim()
  return normalized === '--' || normalized === '00'
}

function isValidChromosome(chromosome: string, format: 'ancestry' | 'myheritage'): boolean {
  const chr = chromosome.toUpperCase().trim()

  // Valid for both: 1-22, X, Y, MT, M, XY (PAR region)
  if (chr === 'X' || chr === 'Y' || chr === 'MT' || chr === 'M' || chr === 'XY') {
    return true
  }

  const num = parseInt(chr, 10)
  if (isNaN(num)) return false

  // Standard chromosomes: 1-22
  if (num >= 1 && num <= 22) return true

  // Ancestry format allows 23-26:
  // 23 = X, 24 = Y, 25 = PAR (Pseudoautosomal), 26 = MT
  if (format === 'ancestry' && num >= 23 && num <= 26) return true

  return false
}

// Normalize chromosome names for internal storage
function normalizeChromosome(chromosome: string, format: 'ancestry' | 'myheritage'): string {
  const chr = chromosome.trim()
  const num = parseInt(chr, 10)

  if (isNaN(num)) return chr.toUpperCase()

  // For Ancestry format, keep numeric values 23-26 as-is
  if (format === 'ancestry' && num >= 23 && num <= 26) {
    return chr
  }

  return chr
}

export function parseAncestryFile(content: string, sourceFile: 1 | 2 = 1): ParseResult {
  const lines = content.split('\n')
  const snps: SNP[] = []
  const errors: SkippedEntry[] = []
  let headerFound = false

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      return
    }

    if (!headerFound && trimmedLine.toLowerCase().includes('rsid')) {
      headerFound = true
      return
    }

    const parts = trimmedLine.split('\t')

    if (parts.length < 5) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: 'Insufficient columns (expected 5)',
        sourceFile,
      })
      return
    }

    const rsid = parts[0].trim()
    const chromosome = parts[1].trim()
    const position = parts[2].trim()
    const allele1 = parts[3].trim()
    const allele2 = parts[4].trim()
    const genotype = allele1 + allele2

    if (!rsid || !chromosome || !position) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: 'Missing required fields',
        sourceFile,
      })
      return
    }

    if (!isValidChromosome(chromosome, 'ancestry')) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: `Invalid chromosome: ${chromosome} (valid: 1-26, X, Y, MT)`,
        sourceFile,
      })
      return
    }

    if (!validateGenotype(genotype)) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: `Invalid genotype: ${genotype}`,
        sourceFile,
      })
      return
    }

    // Keep Ancestry numeric chromosomes as-is (23, 24, 25, 26)
    const normalizedChromosome = normalizeChromosome(chromosome, 'ancestry')

    snps.push({
      rsid,
      chromosome: normalizedChromosome,
      position,
      genotype,
      sourceFile,
    })
  })

  return { snps, errors, format: 'ancestry' }
}

// Async version that yields to main thread every BATCH_SIZE lines
export async function parseAncestryFileAsync(
  content: string,
  sourceFile: 1 | 2 = 1,
  onProgress?: (progress: number) => void
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

  return { snps, errors, format: 'ancestry' }
}

export function parseMyHeritageFile(content: string, sourceFile: 1 | 2 = 1): ParseResult {
  const lines = content.split('\n')
  const snps: SNP[] = []
  const errors: SkippedEntry[] = []
  let headerFound = false

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      return
    }

    if (!headerFound && trimmedLine.toUpperCase().includes('RSID')) {
      headerFound = true
      return
    }

    const parts = trimmedLine.match(/"([^"]*)"|([^,]+)/g)
    if (!parts || parts.length < 4) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: 'Insufficient columns (expected 4)',
        sourceFile,
      })
      return
    }

    const rsid = parts[0].replace(/"/g, '').trim()
    const chromosome = parts[1].replace(/"/g, '').trim()
    const position = parts[2].replace(/"/g, '').trim()
    const genotype = parts[3].replace(/"/g, '').trim()

    if (!rsid || !chromosome || !position || !genotype) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: 'Missing required fields',
        sourceFile,
      })
      return
    }

    if (!isValidChromosome(chromosome, 'myheritage')) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: `Invalid chromosome: ${chromosome} (valid: 1-22, X, Y, MT)`,
        sourceFile,
      })
      return
    }

    if (!validateGenotype(genotype)) {
      errors.push({
        lineNumber: index + 1,
        content: trimmedLine,
        reason: `Invalid genotype: ${genotype}`,
        sourceFile,
      })
      return
    }

    snps.push({
      rsid,
      chromosome: chromosome.toUpperCase(),
      position,
      genotype,
      sourceFile,
    })
  })

  return { snps, errors, format: 'myheritage' }
}

// Async version that yields to main thread every BATCH_SIZE lines
export async function parseMyHeritageFileAsync(
  content: string,
  sourceFile: 1 | 2 = 1,
  onProgress?: (progress: number) => void
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

  return { snps, errors, format: 'myheritage' }
}

function chromosomeToSortKey(chr: string): number {
  const upper = chr.toUpperCase()
  // Handle letter chromosomes (from MyHeritage format)
  if (upper === 'X') return 23
  if (upper === 'Y') return 24
  if (upper === 'XY') return 25 // PAR region
  if (upper === 'MT' || upper === 'M') return 26
  const num = parseInt(chr, 10)
  return isNaN(num) ? 999 : num
}

export interface MergeOptions {
  preferredFile: 1 | 2
  fillMissing: boolean
}

export interface FormatInfo {
  format1: 'ancestry' | 'myheritage'
  format2: 'ancestry' | 'myheritage'
  preferredFormat: 'ancestry' | 'myheritage'
}

export function mergeSnps(file1Snps: SNP[], file2Snps: SNP[], options: MergeOptions): MergeResult {
  const { preferredFile, fillMissing } = options
  const conflicts: ConflictEntry[] = []
  const skippedRows: SkippedEntry[] = []
  const snpMap = new Map<string, SNP>()

  // Helper to get file name
  const getFormatName = (fileNum: 1 | 2) => {
    return `File ${fileNum}`
  }

  file1Snps.forEach(snp => {
    snpMap.set(snp.rsid, snp)
  })

  file2Snps.forEach(snp => {
    const existing = snpMap.get(snp.rsid)

    if (existing) {
      if (existing.genotype.toUpperCase() !== snp.genotype.toUpperCase()) {
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
  })

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

  return { mergedSnps, conflicts, skippedRows }
}

// Async version of mergeSnps
export async function mergeSnpsAsync(
  file1Snps: SNP[],
  file2Snps: SNP[],
  options: MergeOptions,
  onProgress?: (progress: number) => void
): Promise<MergeResult> {
  const BATCH_SIZE = 5000
  const { preferredFile, fillMissing } = options
  const conflicts: ConflictEntry[] = []
  const skippedRows: SkippedEntry[] = []
  const snpMap = new Map<string, SNP>()

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
      if (existing.genotype.toUpperCase() !== snp.genotype.toUpperCase()) {
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

  return { mergedSnps, conflicts, skippedRows }
}

export function generateMyHeritageCsv(snps: SNP[]): { csv: string; excludedPAR: number } {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

  let csv = `##fileformat=MyHeritage
##format=MHv1.0
##source=MergeDNA
##timestamp=${timestamp}
##merged_files=2
#
# Merged DNA raw data.
# For each SNP, we provide the identifier, chromosome number, base pair position and genotype.
# THIS INFORMATION IS FOR YOUR PERSONAL USE AND IS INTENDED FOR GENEALOGICAL RESEARCH ONLY.
RSID,CHROMOSOME,POSITION,RESULT
`

  let excludedPAR = 0

  snps.forEach(snp => {
    // MyHeritage doesn't support Pseudoautosomal regions (25 or XY)
    if (snp.chromosome === 'XY' || snp.chromosome === '25') {
      excludedPAR++
      return
    }

    // Convert Ancestry numeric format to MyHeritage letter format
    let chromosome = snp.chromosome
    if (chromosome === '23') chromosome = 'X'
    else if (chromosome === '24') chromosome = 'Y'
    else if (chromosome === '26') chromosome = 'MT'

    csv += `"${snp.rsid}","${chromosome}","${snp.position}","${snp.genotype}"\n`
  })

  return { csv, excludedPAR }
}

export function generateAncestryTsv(snps: SNP[]): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

  let tsv = `#AncestryDNA merged data
#Generated by MergeDNA at: ${timestamp}
#Merged from 2 files
#THIS INFORMATION IS FOR YOUR PERSONAL USE AND IS INTENDED FOR GENEALOGICAL RESEARCH ONLY.
rsid\tchromosome\tposition\tallele1\tallele2
`

  snps.forEach(snp => {
    // Convert MyHeritage letter format to Ancestry numeric format
    let chromosome = snp.chromosome
    if (chromosome === 'X') chromosome = '23'
    else if (chromosome === 'Y') chromosome = '24'
    else if (chromosome === 'XY') chromosome = '25'
    else if (chromosome === 'MT') chromosome = '26'

    const allele1 = snp.genotype[0] || ''
    const allele2 = snp.genotype[1] || ''
    tsv += `${snp.rsid}\t${chromosome}\t${snp.position}\t${allele1}\t${allele2}\n`
  })

  return tsv
}

export function generateLogFile(
  conflicts: ConflictEntry[],
  skipped: SkippedEntry[],
  excludedPAR?: number,
  fileNames?: { file1?: string; file2?: string }
): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

  let log = `DNA Merge Log
Generated: ${timestamp}

=== FILES ===
File 1: ${fileNames?.file1 || 'N/A'}
File 2: ${fileNames?.file2 || 'N/A'}

=== SUMMARY ===
Conflicts detected: ${conflicts.length}
Invalid rows skipped: ${skipped.length}
${excludedPAR !== undefined && excludedPAR > 0 ? `Pseudoautosomal region (PAR) SNPs excluded for MyHeritage format: ${excludedPAR}\n` : ''}
`

  if (conflicts.length > 0) {
    log += `=== CONFLICTS (Same RSID, Different Genotypes) ===
RSID              | Chr | Position  | File 1 | File 2 | Chosen | Resolution Reason
------------------|-----|-----------|--------|--------|--------|---------------------------
`
    conflicts.forEach(conflict => {
      const rsid = conflict.rsid.padEnd(17)
      const chr = conflict.chromosome.padEnd(3)
      const pos = conflict.position.padEnd(9)
      const f1 = conflict.file1Genotype.padEnd(6)
      const f2 = conflict.file2Genotype.padEnd(6)
      const chosen = conflict.chosenGenotype.padEnd(6)
      log += `${rsid} | ${chr} | ${pos} | ${f1} | ${f2} | ${chosen} | ${conflict.resolutionReason}\n`
    })
    log += '\n'
  }

  if (skipped.length > 0) {
    log += `=== SKIPPED ROWS (Invalid Data) ===
File | Line | Content                                    | Reason
-----|------|--------------------------------------------|-----------------------
`
    skipped.forEach(entry => {
      const file = entry.sourceFile.toString().padEnd(4)
      const line = entry.lineNumber.toString().padEnd(4)
      const content = entry.content.substring(0, 42).padEnd(42)
      log += `${file} | ${line} | ${content} | ${entry.reason}\n`
    })
  }

  return log
}
