'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Repeat, Copyright } from 'lucide-react'

interface AlternativeProduct {
  asin: string
  title: string
  image: string | null
  brand?: {
    name: string
    slug: string
  } | null
  commonTopicCount: number
  score: number
}

interface AlternativeProductsProps {
  products: AlternativeProduct[]
  currentProductTitle: string
}

export function AlternativeProducts({ products, currentProductTitle }: AlternativeProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          <Repeat className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Alternative Products</h2>
          <p className="text-sm text-muted-foreground">Similar products that meet the same needs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Link key={product.asin} href={`/p/${product.asin}`}>
            <Card className="h-full hover:shadow-md transition-all duration-200 cursor-pointer group border hover:border-primary/30 overflow-hidden">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Image */}
                <div className="relative aspect-square bg-white dark:bg-slate-800">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No Image
                    </div>
                  )}

                  {/* Common topics badge */}
                  <Badge className="absolute top-3 left-3 bg-purple-600 hover:bg-purple-700 text-white">
                    {product.commonTopicCount} common{' '}
                    {product.commonTopicCount === 1 ? 'need' : 'needs'}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {product.title}
                  </h3>

                  {product.brand && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Copyright className="w-3 h-3" />
                      <span>{product.brand.name}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">View details</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
