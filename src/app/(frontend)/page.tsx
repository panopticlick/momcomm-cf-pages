import type { Metadata } from 'next'
import Link from 'next/link'
import { HomeHero } from '@/components/frontend/momcomm/home-hero'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { PillarCard } from '@/components/frontend/momcomm/pillar-card'
import { TopicPreviewCard } from '@/components/frontend/momcomm/topic-preview-card'
import { PostPreviewCard } from '@/components/frontend/momcomm/post-preview-card'
import { getSectionPosts, getSectionTopics } from '@/services/momcomm/sections'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: siteConfig.defaultTitle,
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
}

export default async function HomePage() {
  const [gearTopics, stackPosts, venturePosts] = await Promise.all([
    getSectionTopics({ tags: ['gear', 'reviews'], limit: 6, fallbackLimit: 6 }),
    getSectionPosts({
      tags: ['stack', 'workflow'],
      silo: 'stack',
      contentType: 'workflow',
      limit: 6,
      fallbackLimit: 6,
    }),
    getSectionPosts({
      tags: ['ventures', 'blueprint'],
      silo: 'ventures',
      contentType: 'blueprint',
      limit: 6,
      fallbackLimit: 6,
    }),
  ])

  return (
    <div className="min-h-screen">
      <HomeHero />

      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Three Pillars"
          title="A modern operating system for family life"
          subtitle="MomComm keeps the chaos organized across gear, software, and ventures."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PillarCard
            title="Gear"
            tone="gear"
            href="/gear"
            description="High-ROI physical assets for home, health, and mobility."
            highlights={['Field-tested reviews', 'Smart comparison matrix', 'Daily drops']}
          />
          <PillarCard
            title="Stack"
            tone="stack"
            href="/stack"
            description="Digital tools and workflows that make the household run lighter."
            highlights={['Software directory', 'SOP playbooks', 'Automation tips']}
          />
          <PillarCard
            title="Ventures"
            tone="ventures"
            href="/ventures"
            description="Income blueprints and transparent build-in-public notes."
            highlights={['Side-hustle paths', 'Toolkits', 'Founder journals']}
          />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <SectionHeading
          kicker="Gear Intel"
          title="Latest gear reviews"
          subtitle="Curated recommendations focused on time saved, sleep reclaimed, and peace of mind."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {gearTopics.slice(0, 3).map((topic) => (
            <TopicPreviewCard key={topic.id} topic={topic} href={`/gear/${topic.slug}`} />
          ))}
        </div>
        <div className="mt-6">
          <Link href="/gear/reviews" className="text-sm font-semibold text-primary hover:underline">
            Explore the full review library →
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <SectionHeading
          kicker="Stack Playbooks"
          title="Workflows and software stacks"
          subtitle="Modern systems to automate, delegate, and streamline the day-to-day."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {stackPosts.slice(0, 3).map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/stack/${post.slug}`}
              label="Workflow"
            />
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/stack/workflows"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Browse workflows →
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <SectionHeading
          kicker="Ventures"
          title="Blueprints for the mom economy"
          subtitle="From side projects to scalable income streams, built transparently."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {venturePosts.slice(0, 3).map((post) => (
            <PostPreviewCard
              key={post.id}
              post={post}
              href={`/ventures/${post.slug}`}
              label="Blueprint"
            />
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/ventures/blueprints"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View venture playbooks →
          </Link>
        </div>
      </section>
    </div>
  )
}
