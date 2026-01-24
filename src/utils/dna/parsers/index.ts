export { parseAncestryFileAsync } from './ancestry'
export { parseMyHeritageFileAsync } from './myheritage'
export { parseLivingDNAFileAsync } from './livingdna'

// Parser mapping for dynamic format selection
import { parseAncestryFileAsync } from './ancestry'
import { parseMyHeritageFileAsync } from './myheritage'
import { parseLivingDNAFileAsync } from './livingdna'

export const formatParsers: Record<
  'ancestry' | 'myheritage' | 'livingdna',
  typeof parseAncestryFileAsync
> = {
  ancestry: parseAncestryFileAsync,
  myheritage: parseMyHeritageFileAsync,
  livingdna: parseLivingDNAFileAsync,
}
