'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Post, Media, User } from '@/payload-types'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { title, slug, excerpt, featured_media, authors, published_at, tags } = post

  const media = featured_media as Media | undefined
  const coverImage = media?.url || null
  const author = authors && authors.length > 0 ? (authors[0] as User) : null

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 overflow-hidden border-border/40 bg-card">
      {/* Image Section */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Link href={`/post/${slug}`} className="block w-full h-full relative group">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={media?.alt || title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
              <span className="text-sm">No Image</span>
            </div>
          )}
        </Link>
      </div>

      {/* Content Section */}
      <CardHeader className="p-5 pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags &&
            tags.length > 0 &&
            tags.slice(0, 3).map((tag: any) =>
              typeof tag === 'object' && tag?.id && tag?.slug ? (
                <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal hover:bg-secondary/80 transition-colors"
                  >
                    {tag.name || 'Blog'}
                  </Badge>
                </Link>
              ) : null,
            )}
          {!tags?.length && (
            <Badge variant="secondary" className="text-xs font-normal">
              Blog
            </Badge>
          )}
        </div>

        <Link href={`/post/${slug}`} className="hover:text-primary transition-colors">
          <CardTitle className="text-xl font-bold line-clamp-2 leading-tight">{title}</CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="p-5 pt-1 flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-3">{excerpt}</p>
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {author && author.name && (
            <Link
              href={`/blog/author/${author.slug || '#'}`}
              className="hover:underline flex items-center gap-2 font-medium"
            >
              {author.avatar && typeof author.avatar === 'object' && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden">
                  <Image src={author.avatar.url!} alt={author.name} fill className="object-cover" />
                </div>
              )}
              {author.name}
            </Link>
          )}
        </div>
        <div>
          {published_at &&
            new Date(published_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
        </div>
      </CardFooter>
    </Card>
  )
}
