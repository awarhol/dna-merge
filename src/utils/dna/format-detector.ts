import type { DNAFormat } from './types'

export function detectFormat(content: string): DNAFormat {
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
      if (line.toLowerCase().includes('living dna')) {
        return 'livingdna'
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
