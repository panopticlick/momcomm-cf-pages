import { SectionHeading } from '@/components/frontend/momcomm/section-heading'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="About"
          title="Why MomComm exists"
          subtitle="A manifesto for modern moms who want leverage, not just hustle."
        />
        <div className="mt-10 space-y-6 text-base text-muted-foreground max-w-3xl">
          <p>
            MomComm is built for the moms building economies—inside the home and beyond it. We
            believe the modern mom deserves an operating system that blends gear intelligence,
            software leverage, and venture opportunity.
          </p>
          <p>
            Every review, workflow, and blueprint is designed to return time. We focus on the assets
            that compound: tools that save hours, systems that reduce mental load, and ventures that
            create optionality.
          </p>
          <p>
            MomComm is a community-first project. As we build in public, we invite moms to share
            their insights, swap playbooks, and co-create a new standard for the mom economy.
          </p>
        </div>
      </section>
    </div>
  )
}
