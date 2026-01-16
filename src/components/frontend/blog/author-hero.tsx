'use client'

import React from 'react'
import Image from 'next/image'
import type { User, Media } from '@/payload-types'

interface AuthorHeroProps {
  author: User
}

export function AuthorHero({ author }: AuthorHeroProps) {
  const { name, bio, avatar, job_title } = author
  const avatarUrl =
    avatar && typeof avatar === 'object' && (avatar as Media).url ? (avatar as Media).url! : null

  return (
    <section className="relative py-16 md:py-24 bg-muted/20 border-b border-border/40">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-4xl mx-auto">
          <div className="shrink-0">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-xl">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name || 'Author'} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold">
                  {name ? name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
            </div>
          </div>

          <div className="text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{name}</h1>
              {job_title && <p className="text-primary font-medium text-lg">{job_title}</p>}
            </div>

            {bio && (
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">{bio}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
