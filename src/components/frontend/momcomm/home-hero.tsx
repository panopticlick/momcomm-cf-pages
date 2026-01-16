'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 pattern-grid opacity-25" />
      <div className="absolute inset-0 ambient-glow" />
      <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-40 left-0 h-[380px] w-[380px] rounded-full bg-accent/15 blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            MomComm Briefing
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]">
              The operating system for the mom economy.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              We curate high-ROI gear, modern software stacks, and venture playbooks so modern moms
              can reclaim time, grow optionality, and build generational momentum.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full px-7 shadow-lg shadow-primary/30">
              <Link href="/library/newsletter">
                Join the Brief <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full px-7 border-foreground/20"
            >
              <Link href="/gear">Explore Gear</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 pt-6 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-4 shadow-sm">
              <p className="text-foreground font-semibold text-lg">Gear Intel</p>
              <p>Hands-on reviews that surface true ROI.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-4 shadow-sm">
              <p className="text-foreground font-semibold text-lg">Stack Playbooks</p>
              <p>Tools + workflows to reduce household load.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-4 shadow-sm">
              <p className="text-foreground font-semibold text-lg">Mom Ventures</p>
              <p>Blueprints to turn skills into income.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
