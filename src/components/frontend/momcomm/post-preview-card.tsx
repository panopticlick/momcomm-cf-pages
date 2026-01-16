import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Post, Media } from '@/payload-types'

interface PostPreviewCardProps {
  post: Post
  href: string
  label?: string
}

export function PostPreviewCard({ post, href, label }: PostPreviewCardProps) {
  const media = post.featured_media as Media | undefined
  const coverImage = media?.url || null

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-40 w-full bg-muted/40">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={media?.alt || post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-xs uppercase tracking-[0.3em]">MomComm</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Badge
          variant="secondary"
          className="w-fit text-xs font-semibold uppercase tracking-[0.2em]"
        >
          {label || 'Insight'}
        </Badge>
        <h3 className="text-lg font-bold text-foreground line-clamp-2">{post.title}</h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
        )}
        <span className="mt-auto text-xs font-semibold text-primary">Read more</span>
      </div>
    </Link>
  )
}
