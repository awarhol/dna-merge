import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const isGAEnabled = GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX'

/**
 * Initialize Google Analytics
 * Only initializes if a measurement ID is configured
 */
export const initGA = () => {
  if (isGAEnabled) {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        anonymizeIp: true, // Privacy-friendly option
      },
    })
    return true
  }
  return false
}

/**
 * Track a page view
 */
export const trackPageView = (path: string) => {
  if (isGAEnabled) {
    ReactGA.send({ hitType: 'pageview', page: path })
  }
}

/**
 * Track custom events
 */
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (isGAEnabled) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    })
  }
}

/**
 * DNA-specific event tracking helpers
 */
export const analytics = {
  // File upload events
  fileUploaded: (format: string, fileNumber: 1 | 2) => {
    trackEvent('DNA File', 'File Uploaded', `${format} - File ${fileNumber}`)
  },

  // Format conversion events
  formatConverted: (fromFormat: string, toFormat: string) => {
    trackEvent('DNA Processing', 'Format Converted', `${fromFormat} to ${toFormat}`)
  },

  // Merge events
  filesMerged: (format1: string, format2: string, snpCount: number) => {
    trackEvent('DNA Processing', 'Files Merged', `${format1} + ${format2}`, snpCount)
  },

  // Download events
  fileDownloaded: (fileType: 'merged' | 'log' | 'converted', format: string) => {
    trackEvent('DNA File', 'File Downloaded', `${fileType} - ${format}`)
  },

  // Error events
  errorOccurred: (errorType: string, errorMessage?: string) => {
    trackEvent('Error', errorType, errorMessage)
  },

  // Language change
  languageChanged: (language: string) => {
    trackEvent('User Preference', 'Language Changed', language)
  },
}
