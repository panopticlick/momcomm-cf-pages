'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Copyright, Barcode, Package, Weight, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure'
import type { Product, ProductScraper, AbaSearchTerm } from '@/payload-types'

export interface MergedProduct {
  asin: string
  product?: Product
  scraper?: ProductScraper
  abaSearchTerms: AbaSearchTerm[]
  score: number
  relatedTopics?: Array<{ name: string; slug: string }>
}

interface ProductCardProps {
  item: MergedProduct
  rank: number
  currentTopic?: string // Option to make it backward compatible if needed, but we passed it
}

export function ProductCard({ item, rank, currentTopic: _currentTopic }: ProductCardProps) {
  const [showAllFeatures, setShowAllFeatures] = React.useState(false)
  const [showAllSpecs, setShowAllSpecs] = React.useState(false)
  const product = item.product
  const scraper = item.scraper
  const paapi = product?.paapi5 as
    | {
        ItemInfo?: {
          Title?: { DisplayValue?: string }
          ByLineInfo?: { Brand?: { DisplayValue?: string } }
          ExternalIds?: { EANs?: { DisplayValues?: string[] }; UPCs?: { DisplayValues?: string[] } }
          ContentInfo?: {
            ItemDimensions?: {
              Height?: { DisplayValue: number; Unit?: string }
              Length?: { DisplayValue: number; Unit?: string }
              Width?: { DisplayValue: number; Unit?: string }
              Weight?: { DisplayValue: number; Unit?: string }
            }
          }
          ProductInfo?: {
            ItemDimensions?: {
              Height?: { DisplayValue: number; Unit?: string }
              Length?: { DisplayValue: number; Unit?: string }
              Width?: { DisplayValue: number; Unit?: string }
              Weight?: { DisplayValue: number; Unit?: string }
            }
          }
          Features?: { DisplayValues?: string[] }
        }
        Images?: { Primary?: { Large?: { URL?: string }; Medium?: { URL?: string } } }
        Offers?: {
          Listings?: Array<{
            Price?: { DisplayAmount?: string }
          }>
        }
        CustomerReviews?: {
          Summary?: {
            AverageRating?: number
            ReviewCount?: number
          }
        }
      }
    | undefined
  const scraperMeta = scraper?.scraperMetadata as
    | {
        title?: string
        image?: string
        brand?: string
        features?: string[]
        overview?: Array<{ id: string; name: string; value: string }>
        product_information?: {
          type?: string
          details?: Array<{ name: string; value: string; type?: string }>
          warranty_and_support?: string
        }
        product_details?: Array<{ name: string; value: string }>
      }
    | undefined

  // Title & Image
  const title = paapi?.ItemInfo?.Title?.DisplayValue || scraperMeta?.title || `Product ${item.asin}`
  const image =
    paapi?.Images?.Primary?.Large?.URL ||
    paapi?.Images?.Primary?.Medium?.URL ||
    product?.image ||
    scraperMeta?.image ||
    null

  // Detailed Specs
  const brand = paapi?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || scraperMeta?.brand
  // Try to find UPC or EAN. PAAPI5 structure varies, checking common paths.
  const externalIds = paapi?.ItemInfo?.ExternalIds
  const ean =
    externalIds?.EANs?.DisplayValues?.[0] || externalIds?.UPCs?.DisplayValues?.[0] || 'N/A'

  const itemDimensions =
    paapi?.ItemInfo?.ContentInfo?.ItemDimensions || paapi?.ItemInfo?.ProductInfo?.ItemDimensions
  const height = itemDimensions?.Height
  const length = itemDimensions?.Length
  const width = itemDimensions?.Width
  const weight = itemDimensions?.Weight

  const dimensionsStr =
    length && width && height
      ? `${length.DisplayValue} x ${width.DisplayValue} x ${height.DisplayValue} ${length.Unit || 'Inches'}`
      : null

  const weightStr = weight ? `${weight.DisplayValue} ${weight.Unit || 'Pounds'}` : null

  // Keywords (Top 3 active related topics)
  const displayTopics = item.relatedTopics?.slice(0, 3) || []

  // Features (Try to get bullet points)
  const features = paapi?.ItemInfo?.Features?.DisplayValues || scraperMeta?.features || []
  const displayFeatures = Array.isArray(features) ? features : []
  const hasMoreFeatures = Array.isArray(features) && features.length > 3

  // Score & Ratings
  const score = item.score
  const amazonRating = paapi?.CustomerReviews?.Summary?.AverageRating
  const amazonReviewCount = paapi?.CustomerReviews?.Summary?.ReviewCount

  // Extract price from PAAPI5
  const price = paapi?.Offers?.Listings?.[0]?.Price?.DisplayAmount || undefined

  // Note: scoreLabel, isPrime, isFreeShipping not used in current UI

  return (
    <Card
      id={`top-${rank}`}
      className="scroll-mt-[80px] group overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row p-6 gap-6">
        {/* Left: Rank, Image, Thumbnails */}
        <div className="w-full sm:w-1/3 flex flex-col items-center gap-4">
          <div className="self-start flex flex-wrap gap-2">
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm font-semibold rounded-full">
              Top {rank}
            </Badge>
          </div>

          {/* Main Image */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <Link href={`/p/${item.asin}`} className="block w-full h-full">
              {image ? (
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-contain mix-blend-multiply"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
                  No Image
                </div>
              )}
            </Link>
          </div>

          {/* Thumbnails (Mock for now, or use variants if available) */}
          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Placeholder for thumbnails if we had them */}
          </div>
        </div>

        {/* Right: Content & Actions */}
        <div className="flex-1 flex flex-col">
          <Link href={`/p/${item.asin}`}>
            <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2 hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </Link>

          {/* Detailed Specs with Icons */}
          <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-y-2 gap-x-4 items-center">
            {brand && (
              <div className="flex items-center gap-1" title="Brand">
                <Copyright className="w-3.5 h-3.5" />
                <span>{brand}</span>
              </div>
            )}
            {ean !== 'N/A' && (
              <div className="flex items-center gap-1" title="EAN/UPC">
                <Barcode className="w-3.5 h-3.5" />
                <span className="font-mono">{ean}</span>
              </div>
            )}
            {dimensionsStr && (
              <div className="flex items-center gap-1" title="Dimensions">
                <Package className="w-3.5 h-3.5" />
                <span>{dimensionsStr}</span>
              </div>
            )}
            {weightStr && (
              <div className="flex items-center gap-1" title="Weight">
                <Weight className="w-3.5 h-3.5" />
                <span>{weightStr}</span>
              </div>
            )}
          </div>

          {/* Ratings / Score */}
          <div className="mb-4">
            <div className="flex flex-col items-center justify-center w-24 relative">
              {/* CPR Score Badge */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 border-2 border-blue-100 font-bold text-xl">
                {score.toFixed(1)}
              </div>
              <div className="mt-1">
                <StarRating
                  rating={amazonRating}
                  reviewCount={amazonReviewCount}
                  size="sm"
                  showCount={false}
                />
              </div>
            </div>
          </div>

          {/* Price Display */}
          {price && (
            <div className="mb-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{price}</div>
              <div className="text-xs text-muted-foreground">Amazon Price</div>
            </div>
          )}

          <AffiliateDisclosure variant="inline" className="mb-4" />

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6 mt-auto">
            <Button
              asChild
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <a
                href={`/go/${item.asin}`}
                rel="nofollow"
                target="_blank"
                className="flex items-center justify-center w-full h-full"
              >
                View on Amazon
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <a
                href={`/add-to-cart/${item.asin}`}
                rel="nofollow"
                target="_blank"
                className="flex items-center justify-center w-full h-full"
              >
                Add To Cart
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Full Width Details Section */}
      <div className="px-6 pb-6 border-t border-slate-100 pt-6">
        {/* Overview - Core Product Summary */}
        {scraperMeta?.overview && scraperMeta.overview.length > 0 && (
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 mb-3">Overview</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {scraperMeta.overview
                .filter((item) => !item.value.includes('function(')) // Filter out bad data
                .map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground shrink-0 w-[140px] md:w-[200px]">
                      {item.name}:
                    </span>
                    <span className="text-slate-700 font-medium wrap-break-word flex-1">
                      {item.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Specifications - Product Information or Product Details */}
        {(() => {
          const specs = scraperMeta?.product_information?.details || scraperMeta?.product_details
          if (!specs || specs.length === 0) return null

          return (
            <div className="mb-4">
              <button
                onClick={() => setShowAllSpecs(!showAllSpecs)}
                className="w-full flex items-center justify-between py-2 text-left group/btn"
              >
                <h4 className="font-bold text-slate-900">Specifications</h4>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 group-hover/btn:text-blue-500 transition-transform duration-200 ${showAllSpecs ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className={`bg-slate-50 rounded-lg p-4 mt-2 transition-all duration-200 ${showAllSpecs ? 'block animate-in slide-in-from-top-2' : 'hidden'}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {specs
                    .filter(
                      (spec) =>
                        spec?.name &&
                        !spec.name.includes('Customer Reviews') &&
                        !spec.name.includes('Best Sellers Rank'),
                    )
                    .map((spec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm py-1 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-muted-foreground shrink-0 min-w-[140px] w-[140px]">
                          {spec.name}
                        </span>
                        <span className="text-slate-700 flex-1 wrap-break-word">{spec.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Features List */}
        {displayFeatures.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="w-full flex items-center justify-between py-2 text-left group/btn"
            >
              <h4 className="font-bold text-slate-900">Features</h4>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 group-hover/btn:text-blue-500 transition-transform duration-200 ${showAllFeatures ? 'rotate-180' : ''}`}
              />
            </button>

            <div
              className={`mt-2 transition-all duration-200 ${showAllFeatures ? 'block animate-in slide-in-from-top-2' : 'hidden'}`}
            >
              <ul className="grid grid-cols-1 gap-2">
                {displayFeatures.map((feature: string, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-slate-700 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {hasMoreFeatures && !showAllFeatures && (
                <div className="text-xs text-muted-foreground mt-2 italic">
                  {features.length - 3} more features...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related Topics Links */}
        {displayTopics.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground mr-1">Related:</span>
              {displayTopics.map((topic, idx) => (
                <Link key={idx} href={`/gear/${topic.slug}`}>
                  <Badge
                    variant="outline"
                    className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-normal text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  >
                    {topic.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
