'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Tag, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TopicWithImage } from '@/components/frontend/node-topics'

interface TopicsRowProps {
  topics: TopicWithImage[]
  title?: string
  subtitle?: string
  titleTag?: 'h2' | 'h3'
}

export function TopicsRow({
  topics,
  title = 'Related Topics',
  subtitle = 'More guides you might find helpful',
  titleTag: TitleTag = 'h3',
}: TopicsRowProps) {
  if (!topics || topics.length === 0) {
    return null
  }

  return (
    <section className="mt-8">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <TitleTag className="text-2xl font-bold tracking-tight">{title}</TitleTag>}
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {topics.map((topic) => (
          <div key={topic.id} className="block group w-full">
            <Card className="flex items-center gap-4 p-4 border bg-card text-card-foreground shadow-xs hover:shadow-md transition-all duration-300 ring-1 ring-border group-hover:ring-primary/50 overflow-hidden relative">
              {/* Main Topic Link covering the card */}
              <Link href={`/gear/${topic.slug}`} className="absolute inset-0 z-10">
                <span className="sr-only">View {topic.display_name || topic.name}</span>
              </Link>

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500 pointer-events-none" />

              {/* Product Image */}
              <div className="w-16 h-16 shrink-0 relative bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center pointer-events-none">
                {topic.imageUrl ? (
                  <Image
                    src={topic.imageUrl}
                    alt={topic.display_name || topic.name}
                    fill
                    className="object-contain p-1 group-hover:scale-110 transition-transform duration-500"
                    sizes="64px"
                  />
                ) : (
                  <Tag className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>

              {/* Topic Info */}
              <div className="flex-1 min-w-0 relative z-20 pointer-events-none">
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {topic.display_name || topic.name}
                </h4>
                {topic.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">
                    {topic.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {topic.productCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-primary">{topic.productCount}</span>
                      <span>products</span>
                    </div>
                  )}

                  {topic.authors && topic.authors.length > 0 && (
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      <span>•</span>
                      <span>By</span>
                      {topic.authors.slice(0, 1).map((author) => (
                        <Link
                          key={author.id}
                          href={`/author/${author.slug}`}
                          className="flex items-center gap-1 group/author relative z-30 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {author.avatarUrl && (
                            <Avatar className="h-4 w-4 border border-background">
                              <AvatarImage src={author.avatarUrl} alt={author.name} />
                              <AvatarFallback className="text-[8px]">
                                {author.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="font-medium text-foreground group-hover/author:text-primary transition-colors">
                            {author.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-2 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-primary pointer-events-none">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}
