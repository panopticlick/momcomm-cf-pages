import { withPayload } from '@payloadcms/next/withPayload'

const r2PublicUrl = process.env.R2_PUBLIC_URL
const imageRemotePatterns = [
  {
    protocol: 'https',
    hostname: 'm.media-amazon.com',
  },
]

if (r2PublicUrl) {
  try {
    const { hostname } = new URL(r2PublicUrl)
    if (hostname) {
      imageRemotePatterns.push({
        protocol: 'https',
        hostname,
      })
    }
  } catch (error) {
    console.warn('Invalid R2_PUBLIC_URL provided for image domains.', error)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
  output: 'standalone',
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false, autoGenImportMap: false })
