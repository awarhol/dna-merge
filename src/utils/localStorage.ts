const STORAGE_KEYS = {
  OUTPUT_FORMAT: 'dna-output-format',
} as const

export type OutputFormat = 'ancestry' | 'myheritage'

export const localStorageLib = {
  getOutputFormat(): OutputFormat {
    const saved = localStorage.getItem(STORAGE_KEYS.OUTPUT_FORMAT)
    return saved === 'ancestry' || saved === 'myheritage' ? saved : 'myheritage'
  },

  setOutputFormat(format: OutputFormat): void {
    localStorage.setItem(STORAGE_KEYS.OUTPUT_FORMAT, format)
  },
}
