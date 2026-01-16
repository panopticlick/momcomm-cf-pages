'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { SearchBox } from '@/components/frontend/search-box'
import { siteConfig } from '@/lib/site-config'

const navLinks = [
  { href: '/gear', label: 'Gear' },
  { href: '/stack', label: 'Stack' },
  { href: '/ventures', label: 'Ventures' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <div className="hidden lg:block">
              <SearchBox />
            </div>
            <Link
              href="/library/newsletter"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Join the Brief
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/60 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border/50 py-4 animate-slide-up">
            <div className="flex flex-col gap-4">
              <SearchBox />
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/library/newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
              >
                Join the Brief
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
