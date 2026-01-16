'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure'
import type { ProductTopic } from '@/services/products/get-product-topics'

interface ProductListItemProps {
  asin: string
  title: string
  imageUrl?: string
  topics?: ProductTopic[]
}

export const ProductListItem: React.FC<ProductListItemProps> = ({
  asin,
  title,
  imageUrl,
  topics = [],
}) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow duration-200">
      {/* Product Image */}
      <Link
        href={`/p/${asin}`}
        rel="nofollow"
        className="shrink-0 relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-contain" sizes="80px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </Link>

      {/* Title & Topics */}
      <div className="flex-1 min-w-0">
        <Link href={`/p/${asin}`} rel="nofollow" title={title} className="hover:underline">
          <h3 className="text-base font-medium line-clamp-2 text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </Link>

        {/* Topics */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {topics.slice(0, 5).map((topic) => (
              <Link key={topic.id} href={`/gear/${topic.slug}`}>
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {topic.display_name || topic.name}
                </Badge>
              </Link>
            ))}
            {topics.length > 5 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{topics.length - 5}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Disclosure Badge */}
      <AffiliateDisclosure variant="compact" />

      {/* Action Button */}
      <a
        href={`/go/${asin}`}
        rel="nofollow"
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        View
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  )
}
