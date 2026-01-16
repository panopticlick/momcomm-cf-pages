'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { ArrowRight, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Post, Media, User } from '@/payload-types'

interface PostsRowProps {
  posts: Post[]
  title?: string
  subtitle?: string
  titleTag?: 'h2' | 'h3'
}

export function PostsRow({
  posts,
  title = 'Related Posts',
  subtitle,
  titleTag: TitleTag = 'h2',
}: PostsRowProps) {
  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <section className="mt-8">
      {(title || subtitle) && (
        <div className="mb-6">
          <TitleTag className="text-2xl font-bold tracking-tight">{title}</TitleTag>
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => {
          const {
            title: postTitle,
            slug,
            excerpt,
            featured_media,
            authors,
            published_at,
            tags,
          } = post
          const media = featured_media as Media | undefined
          const coverImage = media?.url || null
          const author = authors && authors.length > 0 ? (authors[0] as User) : null

          return (
            <div key={post.id} className="block group w-full">
              <Card className="flex border bg-card text-card-foreground shadow-xs hover:shadow-md transition-all duration-300 ring-1 ring-border group-hover:ring-primary/50 overflow-hidden relative">
                {/* Main Topic Link covering the card */}
                <Link href={`/post/${slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">View {postTitle}</span>
                </Link>

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                {/* Post Image - Seamless Left Side */}
                <div className="w-32 sm:w-64 shrink-0 relative bg-muted/50 flex flex-col items-stretch">
                  {/* We use flex-col items-stretch to ensure full height if the card grows */}
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={media?.alt || postTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 128px, 256px"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[100px] bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No Image</span>
                    </div>
                  )}
                </div>

                {/* Post Info Wrapper */}
                <div className="flex-1 p-4 flex items-center justify-between min-w-0">
                  <div className="flex-1 min-w-0 relative z-20 pointer-events-none pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      {tags && tags.length > 0 && typeof tags[0] === 'object' && tags[0]?.name && (
                        <span className="text-[10px] uppercase font-semibold text-primary/80 tracking-wider">
                          {tags[0].name}
                        </span>
                      )}
                      {published_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-tight">
                      {postTitle}
                    </h4>
                    {excerpt && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 hidden sm:block">
                        {excerpt}
                      </p>
                    )}

                    {author && (
                      <div className="flex items-center gap-1.5 pointer-events-auto mt-auto">
                        <Link
                          href={`/blog/author/${author.slug}`}
                          className="flex items-center gap-1.5 group/author relative z-30 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {author.avatar &&
                          typeof author.avatar === 'object' &&
                          author.avatar.url ? (
                            <Avatar className="h-5 w-5 border border-background">
                              <AvatarImage src={author.avatar.url} alt={author.name} />
                              <AvatarFallback className="text-[9px]">
                                {author.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : null}
                          <span className="text-xs font-medium text-muted-foreground group-hover/author:text-primary transition-colors">
                            {author.name}
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-primary pointer-events-none hidden sm:block shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </section>
  )
}
