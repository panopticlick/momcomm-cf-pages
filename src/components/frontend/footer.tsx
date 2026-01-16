'use client'

import Link from 'next/link'
import { Instagram, Mail, Sparkles } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/60 bg-muted/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold">{siteConfig.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-4">
              The MomComm Brief is your weekly operating system for modern motherhood—curated gear,
              software stacks, and venture playbooks built to reclaim time and grow optionality.
            </p>
            <AffiliateDisclosure variant="inline" />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/gear"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Gear
                </Link>
              </li>
              <li>
                <Link
                  href="/stack"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Stack
                </Link>
              </li>
              <li>
                <Link
                  href="/ventures"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Ventures
                </Link>
              </li>
              <li>
                <Link
                  href="/library/newsletter"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-3 text-sm">Connect</h4>
            <div className="flex gap-3">
              <Link
                href="/library/newsletter"
                className="p-2 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Newsletter"
              >
                <Mail className="w-4 h-4" />
              </Link>
              <a
                href="https://www.instagram.com/"
                className="p-2 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            © {currentYear} <span className="font-semibold text-foreground">{siteConfig.name}</span>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/meta/about"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/meta/legal"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Legal
            </Link>
          </div>
        </div>

        {/* Amazon Affiliate Disclosure */}
        <div className="mt-6 pt-6 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <span className="font-semibold">Amazon Affiliate Disclosure:</span> As an Amazon
            Associate we earn from qualifying purchases. We may earn a commission when you use one
            of our coupons/links to make a purchase. This does not affect the price you pay.
          </p>
        </div>
      </div>
    </footer>
  )
}
