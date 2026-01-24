import type { ConflictEntry, SkippedEntry } from '../types'

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
