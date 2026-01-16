'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, TrendingUp, ArrowRight } from 'lucide-react'

interface ProductTopic {
  id: number
  name: string
  slug: string
  display_name?: string | null
  weighted_score_sum?: number | null
}

interface RelatedTopicsProps {
  topics: ProductTopic[]
}

export function RelatedTopics({ topics }: RelatedTopicsProps) {
  if (topics.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Related Shopping Needs</h2>
          <p className="text-sm text-muted-foreground">
            This product appears in these popular searches
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/gear/${topic.slug}`}>
            <Card className="h-full hover:shadow-md transition-all duration-200 cursor-pointer group border hover:border-primary/30">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {topic.display_name || topic.name}
                  </h3>
                  <ArrowRight className="shrink-0 w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all mt-1" />
                </div>

                {topic.weighted_score_sum && topic.weighted_score_sum > 0 && (
                  <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Popularity Score: {Math.round(topic.weighted_score_sum)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
