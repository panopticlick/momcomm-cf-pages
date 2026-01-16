'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Tag, ArrowRight, Sparkles } from 'lucide-react'
import { TopicWithImage } from '@/components/frontend/node-topics'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface LatestTopicsProps {
  topics: TopicWithImage[]
}

export function LatestTopics({ topics }: LatestTopicsProps) {
  return (
    <section className="container px-4 md:px-6 py-12 mx-auto">
      <div className="mb-10 flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Latest Topics</h2>
          <p className="text-muted-foreground text-lg">Newest guides and product analysis</p>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-12 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-dashed border-muted-foreground/30 backdrop-blur-sm">
          <p className="text-muted-foreground text-xl">No topics found yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="block group h-full"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Card className="flex items-center gap-5 p-5 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-purple-500/50 overflow-hidden relative h-full">
                {/* Main Topic Link covering the card */}
                <Link href={`/gear/${topic.slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">View {topic.display_name || topic.name}</span>
                </Link>

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-linear-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                {/* Product Image */}
                <div className="w-24 h-24 shrink-0 relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center pointer-events-none">
                  {topic.imageUrl ? (
                    <Image
                      src={topic.imageUrl}
                      alt={topic.display_name || topic.name}
                      fill
                      className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                      sizes="96px"
                    />
                  ) : (
                    <Tag className="w-10 h-10 text-muted-foreground/50" />
                  )}
                </div>
                {/* Topic Info */}
                <div className="flex-1 min-w-0 relative z-20 pointer-events-none">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                    {topic.display_name || topic.name}
                  </h3>
                  {topic.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {topic.excerpt}
                    </p>
                  )}
                  {topic.productCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-semibold">
                        {topic.productCount.toLocaleString()} products
                      </span>
                      <span className="text-sm text-muted-foreground">reviewed</span>
                    </div>
                  )}
                  {topic.authors && topic.authors.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 pointer-events-auto">
                      <span className="text-xs text-muted-foreground">By</span>
                      {topic.authors.map((author, index) => (
                        <React.Fragment key={author.id}>
                          {index > 0 && (
                            <span className="text-xs text-muted-foreground mr-1">,</span>
                          )}
                          <Link
                            href={`/author/${author.slug}`}
                            className="flex items-center gap-1.5 group/author relative z-30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Avatar className="h-5 w-5 border border-background">
                              <AvatarImage src={author.avatarUrl || undefined} alt={author.name} />
                              <AvatarFallback className="text-[10px] bg-purple-500/10 text-purple-600">
                                {author.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground group-hover/author:text-purple-600 transition-colors">
                              {author.name}
                            </span>
                          </Link>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                <div className="absolute right-5 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-purple-500 pointer-events-none">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
