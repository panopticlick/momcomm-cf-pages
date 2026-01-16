import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'

export default async function VenturesBuildInPublicPage() {
  const posts = await getSectionPosts({
    tags: ['ventures', 'build-in-public'],
    silo: 'ventures',
    contentType: 'build-in-public',
    limit: 24,
    fallbackLimit: 24,
  })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Build in Public"
          title="Transparent MomComm milestones"
          subtitle="Timelines, revenue experiments, and tactical lessons from building in the open."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/ventures/${post.slug}`}
              label="Journal"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
