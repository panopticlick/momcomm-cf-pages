import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'
import { Sparkles, Workflow, Laptop } from 'lucide-react'

export default async function StackPage() {
  const [directoryPosts, workflowPosts] = await Promise.all([
    getSectionPosts({
      tags: ['stack', 'directory'],
      silo: 'stack',
      contentType: 'directory',
      limit: 6,
      fallbackLimit: 6,
    }),
    getSectionPosts({
      tags: ['stack', 'workflow'],
      silo: 'stack',
      contentType: 'workflow',
      limit: 6,
      fallbackLimit: 6,
    }),
  ])

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 pattern-grid opacity-20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              The Mom Stack
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Software, automation, and workflows that lift the mental load.
            </h1>
            <p className="text-lg text-muted-foreground">
              The Stack is your guide to modern tools, from AI copilots to family finance systems.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/stack/directory">Open Directory</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/stack/workflows">View Workflows</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <SectionHeading
          kicker="Directory"
          title="The MomComm software shelf"
          subtitle="Curated tools to run your home like a startup."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {directoryPosts.slice(0, 3).map((post) => (
            <PostPreviewCard key={post.id} post={post} href={`/stack/${post.slug}`} label="Tool" />
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-primary">
          <Laptop className="h-4 w-4" />
          <Link href="/stack/directory" className="hover:underline">
            Browse the directory →
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <SectionHeading
          kicker="Workflows"
          title="Step-by-step SOPs"
          subtitle="Repeatable playbooks to automate the tasks that drain your time."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {workflowPosts.slice(0, 3).map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/stack/${post.slug}`}
              label="Workflow"
            />
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-primary">
          <Workflow className="h-4 w-4" />
          <Link href="/stack/workflows" className="hover:underline">
            Explore workflows →
          </Link>
        </div>
      </section>
    </div>
  )
}
