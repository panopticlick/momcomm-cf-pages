import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.short_name,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f6efe6',
    theme_color: '#c45933',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
