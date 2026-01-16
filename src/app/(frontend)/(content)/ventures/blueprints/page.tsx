import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'

export default async function VenturesBlueprintsPage() {
  const posts = await getSectionPosts({
    tags: ['ventures', 'blueprint'],
    silo: 'ventures',
    contentType: 'blueprint',
    limit: 24,
    fallbackLimit: 24,
  })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Blueprints"
          title="Ventures built for moms"
          subtitle="Low-capital, high-leverage paths to build income with flexibility."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/ventures/${post.slug}`}
              label="Blueprint"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
