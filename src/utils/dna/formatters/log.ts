import type { ConflictEntry, SkippedEntry, ConflictEntryN } from '../types'

export function generateLogFile(
  conflicts: ConflictEntry[],
  skipped: SkippedEntry[],
  excludedPAR?: number,
  fileNames?: { file1?: string; file2?: string },
  file1Metadata?: {
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  },
  file2Metadata?: {
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  }
): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

  // Helper to format metadata
  const formatMetadata = (metadata?: {
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  }): string => {
    if (!metadata) return ''
    let result = ''
    if (metadata.chip) result += `  Chip: ${metadata.chip}\n`
    if (metadata.version) result += `  Version: ${metadata.version}\n`
    if (metadata.reference) result += `  Reference: ${metadata.reference}\n`
    if (metadata.fileId) result += `  File ID: ${metadata.fileId}\n`
    if (metadata.signature) result += `  Signature: ${metadata.signature}\n`
    if (metadata.timestamp) result += `  Timestamp: ${metadata.timestamp}\n`
    return result
  }

  let log = `DNA Merge Log
Generated: ${timestamp}

=== FILES ===
File 1: ${fileNames?.file1 || 'N/A'}
${formatMetadata(file1Metadata)}File 2: ${fileNames?.file2 || 'N/A'}
${formatMetadata(file2Metadata)}
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

// N-way merge log generation
export function generateLogFileN(
  conflicts: ConflictEntryN[],
  skipped: SkippedEntry[],
  fileNames: string[],
  filesMetadata: Array<{
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  }>,
  excludedPAR?: number
): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'

  // Helper to format metadata
  const formatMetadata = (metadata?: {
    chip?: string
    version?: string
    reference?: string
    fileId?: string
    signature?: string
    timestamp?: string
  }): string => {
    if (!metadata) return ''
    let result = ''
    if (metadata.chip) result += `  Chip: ${metadata.chip}\n`
    if (metadata.version) result += `  Version: ${metadata.version}\n`
    if (metadata.reference) result += `  Reference: ${metadata.reference}\n`
    if (metadata.fileId) result += `  File ID: ${metadata.fileId}\n`
    if (metadata.signature) result += `  Signature: ${metadata.signature}\n`
    if (metadata.timestamp) result += `  Timestamp: ${metadata.timestamp}\n`
    return result
  }

  let log = `DNA Merge Log
Generated: ${timestamp}

=== FILES ===
`

  // List all files with metadata
  fileNames.forEach((name, index) => {
    log += `File ${index + 1}: ${name}\n`
    log += formatMetadata(filesMetadata[index])
  })

  log += `
=== SUMMARY ===
Files merged: ${fileNames.length}
Conflicts detected: ${conflicts.length}
Invalid rows skipped: ${skipped.length}
${excludedPAR !== undefined && excludedPAR > 0 ? `Pseudoautosomal region (PAR) SNPs excluded for MyHeritage format: ${excludedPAR}\n` : ''}
`

  if (conflicts.length > 0) {
    log += `\n=== CONFLICTS (Same RSID, Different Genotypes) ===\n`

    // First 20 conflicts: show all file columns
    const detailedConflicts = conflicts.slice(0, 20)
    const compactConflicts = conflicts.slice(20)

    if (detailedConflicts.length > 0) {
      // Build header dynamically based on number of files
      let header = 'RSID              | Chr | Position  '
      let separator = '------------------|-----|-----------|'

      for (let i = 0; i < fileNames.length; i++) {
        header += `| F${i + 1}     `
        separator += '--------|'
      }

      header += '| Chosen | From   | Resolution Reason\n'
      separator += '--------|--------|---------------------------\n'

      log += header + separator

      // Add detailed conflict rows
      detailedConflicts.forEach(conflict => {
        const rsid = conflict.rsid.padEnd(17)
        const chr = conflict.chromosome.padEnd(3)
        const pos = conflict.position.padEnd(9)

        let row = `${rsid} | ${chr} | ${pos} `

        // Add all file genotypes
        conflict.fileGenotypes.forEach(genotype => {
          const g = (genotype || '--').padEnd(6)
          row += `| ${g} `
        })

        const chosen = conflict.chosenGenotype.padEnd(6)
        const from = `File ${conflict.chosenFromFile + 1}`.padEnd(6)
        row += `| ${chosen} | ${from} | ${conflict.resolutionReason}\n`

        log += row
      })
    }

    // Remaining conflicts: compact mode (only show differing files)
    if (compactConflicts.length > 0) {
      log += `\n... ${compactConflicts.length} more conflicts (compact view) ...\n\n`
      log +=
        'RSID              | Chr | Position  | Differing Files                           | Chosen | From   | Resolution Reason\n'
      log +=
        '------------------|-----|-----------|-------------------------------------------|--------|--------|---------------------------\n'

      compactConflicts.forEach(conflict => {
        const rsid = conflict.rsid.padEnd(17)
        const chr = conflict.chromosome.padEnd(3)
        const pos = conflict.position.padEnd(9)

        // Show only files with different values
        const differingFiles: string[] = []
        conflict.fileGenotypes.forEach((genotype, index) => {
          if (genotype !== null && genotype !== conflict.chosenGenotype) {
            differingFiles.push(`F${index + 1}:${genotype}`)
          }
        })
        const differing = differingFiles.join(', ').substring(0, 41).padEnd(41)

        const chosen = conflict.chosenGenotype.padEnd(6)
        const from = `File ${conflict.chosenFromFile + 1}`.padEnd(6)

        log += `${rsid} | ${chr} | ${pos} | ${differing} | ${chosen} | ${from} | ${conflict.resolutionReason}\n`
      })
    }

    log += '\n'
  }

  if (skipped.length > 0) {
    log += `=== SKIPPED ROWS (Invalid Data) ===
File | Line | Content                                    | Reason
-----|------|--------------------------------------------|-----------------------
`
    skipped.forEach(entry => {
      const file = `${entry.sourceFile + 1}`.padEnd(4)
      const line = entry.lineNumber.toString().padEnd(4)
      const content = entry.content.substring(0, 42).padEnd(42)
      log += `${file} | ${line} | ${content} | ${entry.reason}\n`
    })
  }

  return log
}
