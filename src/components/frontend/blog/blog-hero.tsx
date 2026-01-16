'use client'

import React from 'react'

export function BlogHero() {
  return (
    <section className="relative py-16 md:py-24 bg-linear-to-b from-muted/50 to-background border-b border-border/40">
      <div className="container px-4 md:px-6 mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
          Our Blog
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Discover the latest insights, expert advice, and trends in our curated collection of
          articles.
        </p>
      </div>
    </section>
  )
}
