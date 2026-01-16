import Link from 'next/link'
import { SectionHeading } from '@/components/frontend/momcomm/section-heading'

const toolkitItems = [
  {
    title: 'MomComm Venture Readiness Checklist',
    description: 'Assess your time budget, runway, and support system before launching.',
    href: '/library/downloads',
  },
  {
    title: 'Offer Positioning Canvas',
    description: 'Clarify who you serve, the outcome, and your differentiator in one page.',
    href: '/library/downloads',
  },
  {
    title: '90-Day Launch Plan',
    description: 'Break down your first 90 days into weekly execution blocks.',
    href: '/library/downloads',
  },
]

export default function VenturesToolkitPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Toolkit"
          title="MomComm venture toolkit"
          subtitle="Downloadable assets to move from idea to revenue without guesswork."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {toolkitItems.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Open resource →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
