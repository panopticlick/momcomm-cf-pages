/**
 * Site configuration for SEO and metadata
 */
export const siteConfig = {
  name: 'MomComm',
  short_name: 'MomComm',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://momcomm.com',
  cronUrl: process.env.CRON_VERCEL_URL || 'http://localhost:3000',
  description:
    'MomComm is the operating system for the mom economy—gear reviews, software stacks, and venture playbooks built for high-leverage family life.',

  // Default meta templates
  titleTemplate: '%s | MomComm',
  defaultTitle: 'MomComm — The Mom Economy OS',

  // Open Graph
  ogImage: '/og-image',

  // Twitter
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE,

  // Amazon affiliate
  amazonAffiliateTag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'momcomm-20',
}

/**
 * Generate page title using template
 */
export function generatePageTitle(title: string): string {
  return siteConfig.titleTemplate.replace('%s', title)
}

/**
 * Get full URL for a path
 */
export function getFullUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}
