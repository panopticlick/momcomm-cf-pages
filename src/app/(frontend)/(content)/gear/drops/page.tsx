import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { DealCard } from '@/components/frontend/momcomm/deal-card'
import { getTopProducts } from '@/services/momcomm/products'

export default async function GearDropsPage() {
  const deals = await getTopProducts(12)

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="MomComm Drops"
          title="Daily deal intelligence"
          subtitle="A rotating feed of high-impact items with real savings potential."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((item) => (
            <DealCard key={item.asin} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
