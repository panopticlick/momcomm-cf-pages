import Link from 'next/link'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { TopicPreviewCard } from '@/components/frontend/momcomm/topic-preview-card'
import { getSectionTopics } from '@/services/momcomm/sections'

// Force dynamic rendering (requires runtime database connection)
export const dynamic = 'force-dynamic'
export const revalidate = 1800 // 30 minutes

const filters = [
  { label: 'All', value: 'gear' },
  { label: 'Sleep', value: 'sleep' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Feeding', value: 'feeding' },
  { label: 'Home Ops', value: 'home-ops' },
]

export default async function GearReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const tag = typeof params.tag === 'string' ? params.tag : undefined
  const tags = tag ? [tag] : ['gear', 'reviews']

  const topics = await getSectionTopics({ tags, limit: 24, fallbackLimit: 24 })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Gear Reviews"
          title="The MomComm review library"
          subtitle="Filter by category to jump straight to the products that matter most."
        />

        <div className="mt-6 flex flex-wrap gap-3">
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === 'gear' ? '/gear/reviews' : `/gear/${filter.value}`}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                (tag ?? 'gear') === filter.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {topics.map((topic) => (
            <TopicPreviewCard key={topic.id} topic={topic} href={`/gear/${topic.slug}`} />
          ))}
        </div>
      </section>
    </div>
  )
}
