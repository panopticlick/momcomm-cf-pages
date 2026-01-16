import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'

export default async function StackWorkflowsPage() {
  const posts = await getSectionPosts({
    tags: ['stack', 'workflow'],
    silo: 'stack',
    contentType: 'workflow',
    limit: 24,
    fallbackLimit: 24,
  })

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Workflows"
          title="MomComm SOP library"
          subtitle="Detailed step-by-step workflows you can copy and run in a weekend."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/stack/${post.slug}`}
              label="Workflow"
            />
          ))}
        </div>
      </section>
    </div>
  )
}
