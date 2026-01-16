import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'

export default async function LibraryDownloadsPage() {
  const posts = await getSectionPosts({
    tags: ['library', 'download'],
    silo: 'library',
    contentType: 'download',
    limit: 24,
    fallbackLimit: 12,
  })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Downloads"
          title="Templates and checklists"
          subtitle="Instant resources you can put to work today."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/library/${post.slug}`}
              label="Download"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
