/**
 * Site configuration
 * Values are loaded from environment variables (see .env file)
 * Falls back to defaults if env vars are not set
 */

// Full site URL for SEO and canonical links
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://YOUR_USERNAME.github.io/dna-merge'

// GitHub repository URL
export const GITHUB_REPO =
  import.meta.env.VITE_GITHUB_REPO || 'https://github.com/YOUR_USERNAME/dna-merge'
