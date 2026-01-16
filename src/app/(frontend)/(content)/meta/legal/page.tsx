import { SectionHeading } from '@/components/frontend/momcomm/section-heading'

export default function LegalPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-16">
        <SectionHeading
          kicker="Legal"
          title="Privacy, terms, and disclosures"
          subtitle="Transparent policies for the MomComm community."
        />
        <div className="mt-10 space-y-10 text-sm text-muted-foreground max-w-3xl">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Privacy Policy</h3>
            <p>
              We collect only the information needed to operate MomComm (such as email
              subscriptions). We never sell your data. You may unsubscribe or request deletion at
              any time.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Terms of Use</h3>
            <p>
              MomComm content is provided for educational purposes. We do not guarantee outcomes,
              and you are responsible for decisions made based on the information provided.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Affiliate Disclosure</h3>
            <p>
              Some links on MomComm may be affiliate links. If you purchase through them, we may
              earn a commission at no extra cost to you. We only recommend products we believe
              provide real value.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
