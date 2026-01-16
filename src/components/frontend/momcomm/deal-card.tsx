import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { MergedProduct } from '@/components/frontend/topic/product-card'

interface DealCardProps {
  item: MergedProduct
}

export function DealCard({ item }: DealCardProps) {
  const paapi = item.product?.paapi5 as any
  const scraper = item.scraper?.scraperMetadata as any
  const title = paapi?.ItemInfo?.Title?.DisplayValue || scraper?.title || item.asin
  const image =
    paapi?.Images?.Primary?.Large?.URL ||
    paapi?.Images?.Primary?.Medium?.URL ||
    item.product?.image ||
    scraper?.image
  const price = paapi?.Offers?.Listings?.[0]?.Price?.DisplayAmount || scraper?.price

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
      <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted/40">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {price ? `Current: ${price}` : 'Check live price'}
        </p>
      </div>
      <Link
        href={`/go/${item.asin}`}
        target="_blank"
        rel="nofollow"
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
      >
        View deal <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}
