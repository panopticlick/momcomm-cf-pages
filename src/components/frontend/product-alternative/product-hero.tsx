'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure'
import { ExternalLink, ShoppingCart, Copyright } from 'lucide-react'

interface ProductHeroProps {
  asin: string
  title: string
  image: string | null
  brand?: {
    name: string
    slug: string
  } | null
  paapi5?: any
  scraperMetadata?: any
}

export function ProductHero({
  asin,
  title,
  image,
  brand,
  paapi5,
  scraperMetadata,
}: ProductHeroProps) {
  // Extract features from paapi5 or scraper
  const features = paapi5?.ItemInfo?.Features?.DisplayValues || scraperMetadata?.features || []
  const displayFeatures = Array.isArray(features) ? features.slice(0, 3) : []

  // Extract price from PAAPI5
  const price = paapi5?.Offers?.Listings?.[0]?.Price?.DisplayAmount || undefined

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
        {/* Left: Image */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-[400px] aspect-square bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-center space-y-6">
          <div>
            {brand && (
              <Link
                href={`/brand/${brand.slug}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
              >
                <Copyright className="w-3.5 h-3.5" />
                <span>{brand.name}</span>
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {title}
            </h1>
          </div>

          {/* Features preview */}
          {displayFeatures.length > 0 && (
            <ul className="space-y-2">
              {displayFeatures.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span className="line-clamp-2">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Price Display */}
          {price && (
            <div>
              <div className="text-3xl font-bold text-slate-900">{price}</div>
              <div className="text-sm text-muted-foreground">Amazon Price</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700">
              <a
                href={`/go/${asin}`}
                rel="nofollow"
                target="_blank"
                className="flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on Amazon
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 min-w-[140px] border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <a
                href={`/add-to-cart/${asin}`}
                rel="nofollow"
                target="_blank"
                className="flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </a>
            </Button>
          </div>

          {/* Affiliate Disclosure */}
          <AffiliateDisclosure variant="compact" />
        </div>
      </div>
    </Card>
  )
}
