import { SectionHeading } from '@/components/frontend/momcomm/section-heading'
import { NewsletterForm, type NewsletterState } from '@/components/frontend/momcomm/newsletter-form'
import { getPayloadClient } from '@/lib/payload'

async function subscribe(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  'use server'

  const email = String(formData.get('email') || '').trim()

  if (!email) {
    return { status: 'error', message: 'Please enter a valid email.' }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'subscribers',
      data: {
        email,
        source: 'newsletter',
      },
    })
    return { status: 'success', message: 'Welcome to the Brief!' }
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    if (message.includes('unique') || message.includes('duplicate')) {
      return { status: 'success', message: 'You are already on the list.' }
    }
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl space-y-8">
          <SectionHeading
            kicker="Newsletter"
            title="The MomComm Brief"
            subtitle="A weekly briefing with the highest-ROI gear, stacks, and venture insights."
          />
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6">
            <NewsletterForm action={subscribe} />
            <p className="mt-4 text-xs text-muted-foreground">
              By subscribing you agree to receive MomComm emails. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
