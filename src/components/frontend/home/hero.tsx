'use client'

import React from 'react'

export function Hero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-accent/5 to-background"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center space-y-6 text-center max-w-4xl mx-auto">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Discover
              <span className="text-gradient ml-3">Top Picks</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl leading-relaxed animate-slide-up">
              Explore our carefully curated product categories and find the quality items you love.
              From trending categories to niche selections, we have it all.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
