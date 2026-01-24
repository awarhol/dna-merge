import type { SNP } from '../types'

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
