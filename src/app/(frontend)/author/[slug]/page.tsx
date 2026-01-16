import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { NodeTopics } from '@/components/frontend/node-topics'
import { Pagination } from '@/components/frontend/pagination'
import { attachImagesToTopics } from '@/components/lib/topic-utils'
import type { Topic, Media, User } from '@/payload-types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AuthorPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
  searchParams: _searchParams,
}: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'users',
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const user = result.docs[0] as User | undefined

  if (!user) {
    return {
      title: 'Author Not Found',
    }
  }

  return {
    title: `${user.name} - Author Profile`,
    description: user.bio || `Articles by ${user.name}`,
  }
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params
  const { page } = await searchParams
  const payload = await getPayloadClient()

  const currentPage = Number(page) || 1
  const pageSize = 24

  const userResult = await payload.find({
    collection: 'users',
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const user = userResult.docs[0] as User | undefined

  if (!user) {
    return notFound()
  }

  // Get author's topics with full details
  const topicsQuery = await payload.find({
    collection: 'topics',
    where: {
      authors: {
        contains: user.id,
      },
      active: {
        equals: true,
      },
    },
    depth: 2,
    limit: pageSize,
    page: currentPage,
    sort: '-updatedAt',
  })

  const topicsWithImages = await attachImagesToTopics(payload, topicsQuery.docs as Topic[])

  // Calculate author stats
  const totalArticles = topicsQuery.totalDocs
  // Use topic names as expertise areas (top 10 unique topic names)
  const expertiseAreas = Array.from(
    new Set(topicsQuery.docs.map((topic) => topic.display_name || topic.name).filter(Boolean)),
  ).slice(0, 10)

  // Generate JSON-LD schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.name,
    description: user.bio,
    jobTitle: user.job_title,
    image: (user.avatar as Media)?.url,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/author/${user.slug}`,
    worksFor: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', ''),
    },
    knowsAbout: expertiseAreas,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container px-4 md:px-6 py-12 md:py-20 mx-auto max-w-7xl animate-fade-in">
          <div className="mb-12 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-6 ring-4 ring-primary/20 shadow-xl">
              <AvatarImage src={(user.avatar as Media)?.url || undefined} alt={user.name} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {user.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            {user.job_title && (
              <p className="text-xl text-muted-foreground mb-4">{user.job_title}</p>
            )}
            {user.bio && (
              <p className="max-w-2xl mx-auto text-muted-foreground text-base leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="font-semibold text-foreground">{totalArticles}</span> articles
              </div>
            </div>

            {/* Expertise Areas */}
            {expertiseAreas.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Expertise:</span>
                {expertiseAreas.slice(0, 6).map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {expertiseAreas.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{expertiseAreas.length - 6} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {topicsWithImages.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold mb-6">Articles by {user.name}</h2>
              <NodeTopics topics={topicsWithImages} />
              <Pagination currentPage={currentPage} totalPages={topicsQuery.totalPages} />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-xl">No articles found for this author.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
