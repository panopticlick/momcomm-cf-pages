import { Footer } from '@/components/frontend/footer'
import { Header } from '@/components/frontend/header'
import { BackToTop } from '@/components/frontend/back-to-top'
import NextTopLoader from 'nextjs-toploader'
import React from 'react'
import './styles.css'
import { GoogleAnalytics } from '@next/third-parties/google'

import { siteConfig } from '@/lib/site-config'
import { Fraunces, Space_Grotesk } from 'next/font/google'

// Force dynamic rendering for all pages (requires runtime database)
export const dynamic = 'force-dynamic'

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.defaultTitle,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  keywords: [
    'MomComm',
    'Mom economy',
    'Gear reviews',
    'Parenting tech',
    'Family systems',
    'Home operations',
    'Affiliate deals',
    'Workflows',
    'Side hustles',
  ],
  authors: [
    {
      name: siteConfig.name,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.defaultTitle,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: 'RSS Feed' }],
    },
  },
}

// Removed force-dynamic to enable ISR for better performance
// Individual routes can override with 'force-dynamic' if needed

import { GlobalJsonLd } from '@/components/frontend/global-json-ld'

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <GlobalJsonLd />
        <NextTopLoader showSpinner={false} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  )
}
