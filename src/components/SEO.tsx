import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SITE_URL } from '@/config/site'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
}

export function SEO({ title, description, keywords, ogImage }: SEOProps) {
  const { t, i18n } = useTranslation('common')

  const defaultTitle = t('seo.title', 'Merge DNA Files - Privacy-First DNA File Merger')
  const defaultDescription = t(
    'seo.description',
    'Free online tool to merge and convert DNA test files from AncestryDNA, 23andMe, MyHeritage, and LivingDNA. All processing happens in your browser - your genetic data never leaves your computer.'
  )
  const defaultKeywords = t(
    'seo.keywords',
    'DNA merge, DNA file converter, AncestryDNA, 23andMe, MyHeritage, LivingDNA, genetic data, genealogy, privacy, client-side processing'
  )

  const siteUrl = SITE_URL
  const pageTitle = title || defaultTitle
  const pageDescription = description || defaultDescription
  const pageKeywords = keywords || defaultKeywords

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />
      <link rel="canonical" href={siteUrl} />

      {/* Language */}
      <html lang={i18n.language} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content={i18n.language === 'uk' ? 'uk_UA' : 'en_US'} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={siteUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      {ogImage && <meta property="twitter:image" content={ogImage} />}

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content={i18n.language} />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="DNA Merge Tool" />

      {/* Structured Data - JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'DNA File Merger',
          applicationCategory: 'UtilityApplication',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          description: pageDescription,
          operatingSystem: 'Web Browser',
          permissions: 'Client-side only - no data uploaded',
        })}
      </script>
    </Helmet>
  )
}
