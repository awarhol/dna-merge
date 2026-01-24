// Helper to yield to the main thread
export const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0))

// Normalize chromosome names for internal storage
export function normalizeChromosome(chromosome: string, format: 'ancestry' | 'myheritage'): string {
  const chr = chromosome.trim()
  const num = parseInt(chr, 10)

  if (isNaN(num)) return chr.toUpperCase()

  // For Ancestry format, keep numeric values 23-26 as-is
  if (format === 'ancestry' && num >= 23 && num <= 26) {
    return chr
  }

  return chr
}
