import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { TopicPreviewCard } from '@/components/frontend/momcomm/topic-preview-card'
import { getSectionTopics } from '@/services/momcomm/sections'
import { Boxes, Sparkles, Zap } from 'lucide-react'

export default async function GearPage() {
  const topics = await getSectionTopics({ tags: ['gear', 'reviews'], limit: 6, fallbackLimit: 6 })

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 pattern-grid opacity-20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Gear Intelligence
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              High-ROI gear for modern motherhood.
            </h1>
            <p className="text-lg text-muted-foreground">
              We review the assets that compound time, sleep, and sanity—then map the best picks so
              you can buy once and move on.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/gear/reviews">Browse Reviews</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/gear/matrix">Open the Matrix</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <SectionHeading
          kicker="Reviews"
          title="Latest field tests"
          subtitle="Hands-on comparisons across sleep, mobility, feeding, and home operations."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {topics.slice(0, 3).map((topic) => (
            <TopicPreviewCard key={topic.id} topic={topic} href={`/gear/${topic.slug}`} />
          ))}
        </div>
        <div className="mt-6">
          <Link href="/gear/reviews" className="text-sm font-semibold text-primary hover:underline">
            Explore all reviews →
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <SectionHeading
          kicker="Decision Tools"
          title="Compare & capture deals"
          subtitle="Use the matrix to compare specs, then watch the drops for time-sensitive wins."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6">
            <div className="flex items-center gap-3 text-foreground">
              <Boxes className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Gear Matrix</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Compare the top products side-by-side with the specs that actually matter.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link href="/gear/matrix">Open Matrix</Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6">
            <div className="flex items-center gap-3 text-foreground">
              <Zap className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">MomComm Drops</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Daily deal intelligence and limited-time alerts for the most requested items.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link href="/gear/drops">See Drops</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
