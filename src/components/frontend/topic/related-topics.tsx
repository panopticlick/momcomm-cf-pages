'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Tag, ArrowRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { TopicWithImage } from '@/components/frontend/node-topics'

interface RelatedTopicsProps {
  topics: TopicWithImage[]
  title?: string
  subtitle?: string
  titleTag?: 'h2' | 'h3'
}

export function RelatedTopics({
  topics,
  title = 'Related Topics',
  subtitle = 'More guides you might find helpful',
  titleTag: TitleTag = 'h3',
}: RelatedTopicsProps) {
  if (topics.length === 0) {
    return null
  }

  return (
    <section className="mt-12 pt-8 border-t">
      <div className="mb-6 flex items-center gap-3">
        <div>
          <TitleTag className="text-2xl font-bold tracking-tight">{title}</TitleTag>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {topics.map((topic) => (
          <div key={topic.id} className="block group h-full">
            <Card className="flex items-center gap-4 p-4 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-primary/50 overflow-hidden relative h-full">
              {/* Main Topic Link covering the card */}
              <Link href={`/gear/${topic.slug}`} className="absolute inset-0 z-10">
                <span className="sr-only">View {topic.display_name || topic.name}</span>
              </Link>

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500 pointer-events-none" />

              {/* Product Image */}
              <div className="w-20 h-20 shrink-0 relative bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-inner flex items-center justify-center pointer-events-none">
                {topic.imageUrl ? (
                  <Image
                    src={topic.imageUrl}
                    alt={topic.display_name || topic.name}
                    fill
                    className="object-contain p-1.5 group-hover:scale-110 transition-transform duration-500"
                    sizes="80px"
                  />
                ) : (
                  <Tag className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>

              {/* Topic Info */}
              <div className="flex-1 min-w-0 relative z-20 pointer-events-none">
                <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {topic.display_name || topic.name}
                </h4>
                {topic.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                    {topic.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {topic.productCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {topic.productCount.toLocaleString()} products
                    </span>
                  )}
                  {topic.authors && topic.authors.length > 0 && (
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      <span className="text-xs text-muted-foreground">By</span>
                      {topic.authors.slice(0, 1).map((author) => (
                        <Link
                          key={author.id}
                          href={`/author/${author.slug}`}
                          className="flex items-center gap-1 group/author relative z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Avatar className="h-4 w-4 border border-background">
                            <AvatarImage src={author.avatarUrl || undefined} alt={author.name} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {author.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-foreground group-hover/author:text-primary transition-colors">
                            {author.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-3 group-hover:translate-x-0 transition-all duration-300 text-primary pointer-events-none z-20">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Card>
          </div>
        ))}
      </div>
    </section>
  )
}
