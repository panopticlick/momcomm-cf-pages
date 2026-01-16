import Link from 'next/link'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { Button } from '@/components/ui/button'

export default function LibraryPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Library"
          title="MomComm resource vault"
          subtitle="Downloadable checklists, templates, and the weekly brief."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6">
            <h3 className="text-xl font-bold text-foreground">Downloads</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Checklists, worksheets, and templates designed to shorten your execution loop.
            </p>
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link href="/library/downloads">View downloads</Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6">
            <h3 className="text-xl font-bold text-foreground">The MomComm Brief</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              A weekly email with the best gear, stacks, and venture updates.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link href="/library/newsletter">Join the Brief</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
