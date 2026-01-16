'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure'

interface ProductCardProps {
  asin: string
  title: string
  imageUrl?: string
  price?: string
  rating?: number | null
  reviewCount?: number | null
}

export const ProductCard: React.FC<ProductCardProps> = ({
  asin,
  title,
  imageUrl,
  price,
  rating,
  reviewCount,
}) => {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <div className="relative pt-4 px-4 h-48 w-full">
        <Link href={`/p/${asin}`} rel="nofollow" className="block relative w-full h-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm rounded-md">
              No Image
            </div>
          )}
        </Link>
      </div>
      <CardHeader className="p-4 pb-2">
        <Link href={`/p/${asin}`} rel="nofollow" title={title} className="hover:underline">
          <CardTitle className="text-base font-medium line-clamp-2 leading-snug min-h-[2.5rem]">
            {title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="mb-2">
          <StarRating rating={rating} reviewCount={reviewCount} />
        </div>
        <div className="font-bold text-lg text-slate-900 mt-auto">
          {price || <span className="text-sm font-normal text-muted-foreground">See Price</span>}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <AffiliateDisclosure variant="compact" />
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <Link href={`/go/${asin}`} rel="nofollow">
            View on Amazon
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
