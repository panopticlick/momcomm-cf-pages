'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import type { Post, Media, User } from '@/payload-types'

interface PostHeroProps {
  post: Post
  backHref?: string
  backLabel?: string
  tagBaseHref?: string
  authorBaseHref?: string
}

export function PostHero({
  post,
  backHref = '/blog',
  backLabel = 'Back to Blog',
  tagBaseHref = '/blog/tag',
  authorBaseHref = '/blog/author',
}: PostHeroProps) {
  const { title, featured_media, authors, published_at, tags } = post
  const media = featured_media as Media | undefined
  const coverImage = media?.url || null
  const author = authors && authors.length > 0 ? (authors[0] as User) : null

  return (
    <header className="relative w-full">
      <div className="container px-4 md:px-6 mx-auto pt-8 md:pt-12 pb-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back to Blog */}
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {backLabel}
            </Link>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags &&
              tags.map((tag: any) =>
                typeof tag === 'object' && tag?.id && tag?.slug ? (
                  <Link key={tag.id} href={`${tagBaseHref}/${tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ) : null,
              )}
            {!tags?.length && <Badge variant="secondary">Blog</Badge>}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-muted-foreground border-b border-border/40 pb-8">
            {author && (
              <div className="flex items-center gap-2">
                {author.avatar && typeof author.avatar === 'object' && (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border">
                    <Image
                      src={(author.avatar as Media).url!}
                      alt={author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="text-sm">
                  <span className="block font-medium text-foreground">
                    <Link href={`${authorBaseHref}/${author.slug}`} className="hover:underline">
                      {author.name}
                    </Link>
                  </span>
                  {author.job_title && <span className="text-xs">{author.job_title}</span>}
                </div>
              </div>
            )}
            {published_at && (
              <div className="text-sm border-l border-border/40 pl-4">
                {new Date(published_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {coverImage && (
        <div className="container px-4 md:px-6 mx-auto pb-12">
          <div className="relative aspect-video w-full max-w-5xl mx-auto overflow-hidden rounded-xl shadow-2xl border border-border/20">
            <Image
              src={coverImage}
              alt={media?.alt || title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </header>
  )
}
