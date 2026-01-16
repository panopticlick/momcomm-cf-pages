import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { TopicWithImage } from '@/components/frontend/node-topics'

interface TopicPreviewCardProps {
  topic: TopicWithImage
  href: string
}

export function TopicPreviewCard({ topic, href }: TopicPreviewCardProps) {
  return (
    <Card className="group flex h-full flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 transition-all hover:-translate-y-1 hover:shadow-xl">
      <Link href={href} className="space-y-4">
        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted/40">
          {topic.imageUrl ? (
            <Image
              src={topic.imageUrl}
              alt={topic.display_name || topic.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Tag className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground line-clamp-2">
            {topic.display_name || topic.name}
          </h3>
          {topic.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">{topic.excerpt}</p>
          )}
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
          <Tag className="h-3 w-3" />
          {topic.productCount.toLocaleString()} picks
        </span>
        <span className="font-semibold text-primary">Read review</span>
      </div>
    </Card>
  )
}
