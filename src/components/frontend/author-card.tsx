'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { User, Media } from '@/payload-types'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface AuthorCardProps {
  author: User
}

export const AuthorCard: React.FC<AuthorCardProps> = ({ author }) => {
  const avatarUrl =
    author.avatar && typeof author.avatar === 'object' && 'url' in author.avatar
      ? (author.avatar as Media).url
      : null

  const initials = author.name
    ? author.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <Card className="overflow-hidden border-none bg-muted/30 hover:bg-muted/50 transition-colors mt-12 mb-8">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={author.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/author/${author.slug}`}
                className="text-2xl font-bold hover:text-primary transition-colors"
              >
                {author.name}
              </Link>
              {author.job_title && (
                <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                  {author.job_title}
                </Badge>
              )}
            </div>

            {author.bio && (
              <p className="text-muted-foreground leading-relaxed max-w-2xl text-base italic">
                &quot;{author.bio}&quot;
              </p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <Link
                href={`/author/${author.slug}`}
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group"
              >
                View Profile
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
