export { parseAncestryFileAsync } from './ancestry'
export { parseMyHeritageFileAsync } from './myheritage'
export { parseLivingDNAFileAsync } from './livingdna'
export { parse23andMeFileAsync } from './23andme'
export { parseFTDNAFileAsync } from './ftdna'

// Parser mapping for dynamic format selection
import { parseAncestryFileAsync } from './ancestry'
import { parseMyHeritageFileAsync } from './myheritage'
import { parseLivingDNAFileAsync } from './livingdna'
import { parse23andMeFileAsync } from './23andme'
import { parseFTDNAFileAsync } from './ftdna'

export const formatParsers: Record<
  'ancestry' | 'myheritage' | 'livingdna' | '23andme' | 'ftdna',
  typeof parseAncestryFileAsync
> = {
  ancestry: parseAncestryFileAsync,
  myheritage: parseMyHeritageFileAsync,
  livingdna: parseLivingDNAFileAsync,
  '23andme': parse23andMeFileAsync,
  ftdna: parseFTDNAFileAsync,
}
