import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts } from '@/services/momcomm/sections'
import { Sparkles, LineChart, Compass } from 'lucide-react'

export default async function VenturesPage() {
  const [blueprints, buildNotes] = await Promise.all([
    getSectionPosts({
      tags: ['ventures', 'blueprint'],
      silo: 'ventures',
      contentType: 'blueprint',
      limit: 6,
      fallbackLimit: 6,
    }),
    getSectionPosts({
      tags: ['ventures', 'build-in-public'],
      silo: 'ventures',
      contentType: 'build-in-public',
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
              Mom Ventures
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Build income streams that flex with family life.
            </h1>
            <p className="text-lg text-muted-foreground">
              Blueprints, toolkits, and transparent progress notes for moms building in public.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/ventures/blueprints">Browse Blueprints</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/ventures/build-in-public">Build in Public</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <SectionHeading
          kicker="Blueprints"
          title="MomComm venture playbooks"
          subtitle="Step-by-step paths to launch profitable micro-ventures."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {blueprints.slice(0, 3).map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/ventures/${post.slug}`}
              label="Blueprint"
            />
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-primary">
          <Compass className="h-4 w-4" />
          <Link href="/ventures/blueprints" className="hover:underline">
            View all blueprints →
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <SectionHeading
          kicker="Build in Public"
          title="MomComm operator journal"
          subtitle="Transparent milestones, revenue updates, and lessons learned."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {buildNotes.slice(0, 3).map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/ventures/${post.slug}`}
              label="Journal"
            />
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-primary">
          <LineChart className="h-4 w-4" />
          <Link href="/ventures/build-in-public" className="hover:underline">
            Read the journal →
          </Link>
        </div>
      </section>
    </div>
  )
}
