import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'

// Force dynamic rendering (requires runtime database connection)
export const dynamic = 'force-dynamic'
export const revalidate = 1800 // 30 minutes

export default async function StackDirectoryPage() {
  const posts = await getSectionPosts({
    tags: ['stack', 'directory'],
    silo: 'stack',
    contentType: 'directory',
    limit: 24,
    fallbackLimit: 24,
  })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Directory"
          title="MomComm software directory"
          subtitle="A vetted list of apps, platforms, and systems that actually save time."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <PostPreviewCard key={post.id} post={post} href={`/stack/${post.slug}`} label="Tool" />
          ))}
        </div>
      </section>
    </div>
  )
}
