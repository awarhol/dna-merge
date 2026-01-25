export interface SNP {
  rsid: string
  chromosome: string
  position: string
  genotype: string
  sourceFile: number // Index in the files array (0-based)
}

export interface ParseResult {
  snps: SNP[]
  errors: SkippedEntry[]
  format: 'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna'
  metadata?: {
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  }
}

export interface MergeResult {
  mergedSnps: SNP[]
  conflicts: ConflictEntry[]
  skippedRows: SkippedEntry[]
  file1Metadata?: { chip?: string; version?: string; reference?: string }
  file2Metadata?: { chip?: string; version?: string; reference?: string }
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
  sourceFile: number // Index in the files array (0-based)
}

export interface MergeOptions {
  preferredFile: 1 | 2
  fillMissing: boolean
  parseMultibaseGenotypes?: boolean
  includeInvalidPositions?: boolean // Include SNPs with 0,0 positions
}

export interface FormatInfo {
  format1: 'ancestry' | 'myheritage'
  format2: 'ancestry' | 'myheritage'
  preferredFormat: 'ancestry' | 'myheritage'
}

export type DNAFormat = 'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna' | 'unknown'

// N-way merge types (supporting 1-10 files)
export interface ConflictEntryN {
  rsid: string
  chromosome: string
  position: string
  fileGenotypes: (string | null)[] // Genotypes from each file (null if missing)
  chosenGenotype: string
  chosenFromFile: number // Index of file that provided the chosen value
  resolutionReason: string
}

export interface MergeOptionsN {
  fillMissing: boolean
  parseMultibaseGenotypes?: boolean
  includeInvalidPositions?: boolean // Include SNPs with 0,0 positions
}

export interface MergeResultN {
  mergedSnps: SNP[]
  conflicts: ConflictEntryN[]
  skippedRows: SkippedEntry[]
  filesMetadata: Array<{
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  }>
}
