'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, ExternalLink } from 'lucide-react'

interface ProductInfoProps {
  asin: string
  title: string
  detailUrl: string
}

export function ProductInfo({ asin, title, detailUrl }: ProductInfoProps) {
  return (
    <>
      <div>
        <Badge variant="secondary" className="mb-3">
          ASIN: {asin}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {title}
        </h1>
      </div>

      <Separator />

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          size="lg"
          className="flex-1 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg h-12 shine"
        >
          <Link href={detailUrl} target="_blank" rel="noopener noreferrer">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Buy on Amazon
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12">
          <Link href={detailUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-5 h-5 mr-2" />
            View Details
          </Link>
        </Button>
      </div>
    </>
  )
}
