import React from 'react'
import Link from 'next/link'
import { ArrowRight, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { SimilarBrand } from '@/services/brands/similarity'

interface SimilarBrandsProps {
  currentBrandName: string
  brands: SimilarBrand[]
}

export function SimilarBrands({ currentBrandName, brands }: SimilarBrandsProps) {
  if (brands.length === 0) return null

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          <Tag className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold">Similar Brands to {currentBrandName}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/brand/${brand.slug}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group hover:border-primary/50">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {brand.name}
                    </h3>
                    {brand.rank && (
                      <span
                        className="shrink-0 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded cursor-help border"
                        title="Brand Rank"
                      >
                        #{brand.rank}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="shrink-0 w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>

                <div className="mt-auto pt-2 border-t border-dashed">
                  {/* brand.rank moved to header */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Common Topics</span>
                    <span className="font-medium bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground text-xs">
                      {brand.commonTopicCount}
                    </span>
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
