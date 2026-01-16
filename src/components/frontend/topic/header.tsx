'use client'

import React from 'react'
import Link from 'next/link'
import type { User, Media } from '@/payload-types'
import { Badge } from '@/components/ui/badge'
import { Package, Clock, User as UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TopicHeaderProps {
  topic: {
    name: string
    display_name?: string | null
    updatedAt?: string
    authors?: (number | User)[] | null
  }
  productCount: number
}

/**
 * Enhanced Topic Header with product count and update info
 */
export function TopicHeader({ topic, productCount }: TopicHeaderProps) {
  const displayName = topic.display_name || topic.name
  const hasBestPrefix = /^best\b/i.test(displayName)

  // Format update date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const updateDate = formatDate(topic.updatedAt)

  // Resolve authors
  const resolvedAuthors = topic.authors
    ?.map((author) => {
      if (typeof author === 'object' && author !== null && 'name' in author) {
        const user = author as User
        return {
          name: user.name,
          slug: user.slug,
          avatar: user.avatar as Media | undefined,
        }
      }
      return null
    })
    .filter((a): a is { name: string; slug: string; avatar: Media | undefined } => a !== null)

  return (
    <div className="mb-10 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-gradient">
            {hasBestPrefix ? displayName : `Best ${displayName}`}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-4">
          Top {productCount} recommended products for &quot;{topic.name}&quot;
        </p>

        {/* Meta info badges */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            <Package className="w-3.5 h-3.5" />
            <span>{productCount} Products</span>
          </Badge>
          {updateDate && (
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {updateDate}</span>
            </Badge>
          )}
          {resolvedAuthors && resolvedAuthors.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
              <UserIcon className="w-3.5 h-3.5" />
              <span>By </span>
              {resolvedAuthors.map((author, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  {index > 0 && <span>, </span>}
                  <Link
                    href={`/author/${author.slug}`}
                    className="flex items-center gap-1.5 group/author"
                  >
                    <Avatar className="h-5 w-5 border border-background">
                      <AvatarImage src={author.avatar?.url || undefined} alt={author.name} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {author.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="group-hover/author:underline">{author.name}</span>
                  </Link>
                </div>
              ))}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
