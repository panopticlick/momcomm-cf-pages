import { ComparisonTable } from '@/components/frontend/topic/comparison-table'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { getMergedProductsByAsins, getTopProducts } from '@/services/momcomm/products'

function normalizeAsins(value: string | string[] | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((entry) => entry.split(',')).filter(Boolean)
  return value.split(',').filter(Boolean)
}

export default async function GearMatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const selectedAsins = normalizeAsins(params.asins).slice(0, 5)

  const availableProducts = await getTopProducts(12)
  const fallbackAsins =
    selectedAsins.length > 0
      ? selectedAsins
      : availableProducts.slice(0, 4).map((product) => product.asin)

  const comparisonProducts = await getMergedProductsByAsins(fallbackAsins)

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Gear Matrix"
          title="Compare the top gear side-by-side"
          subtitle="Select up to five products. We surface the key specs and differences that matter most."
        />

        <form method="GET" className="mt-8 rounded-3xl border border-border/60 bg-card/80 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableProducts.map((product) => {
              const title =
                (product.product?.paapi5 as any)?.ItemInfo?.Title?.DisplayValue ||
                (product.scraper?.scraperMetadata as any)?.title ||
                product.asin

              return (
                <label
                  key={product.asin}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name="asins"
                    value={product.asin}
                    defaultChecked={fallbackAsins.includes(product.asin)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                  />
                  <span className="line-clamp-2">{title}</span>
                </label>
              )
            })}
          </div>
          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
          >
            Update Comparison
          </button>
        </form>

        <div className="mt-10">
          <ComparisonTable products={comparisonProducts} />
        </div>
      </section>
    </div>
  )
}
