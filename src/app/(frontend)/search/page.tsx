import { searchTopicsWithImages } from '@/services/search/actions'
import { Metadata } from 'next'
import { NodeTopics } from '@/components/frontend/node-topics'
import { Tag } from 'lucide-react'
import { Pagination } from '@/components/frontend/pagination'
import { siteConfig } from '@/lib/site-config'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
  const page = typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : '1'

  if (!query) {
    return {
      title: `Search Topics | ${siteConfig.name}`,
      description: 'Search MomComm reviews, workflows, and venture playbooks.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  return {
    title: `Search results for "${query}" - Page ${page} | ${siteConfig.name}`,
    description: `Browse MomComm insights related to "${query}" on ${siteConfig.name}.`,
    robots: {
      index: false, // Generally good practice to noindex internal search results
      follow: true,
    },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
  const page = Number(resolvedSearchParams.page) || 1
  const pageSize = 24

  const searchResponse = query
    ? await searchTopicsWithImages(query, pageSize, page)
    : { docs: [], totalDocs: 0, totalPages: 0 }

  const results = searchResponse.docs
  const totalDocs = searchResponse.totalDocs
  const totalPages = searchResponse.totalPages

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/20">
      <div className="absolute inset-0 pattern-grid opacity-15" />

      <div className="container relative z-10 px-4 md:px-6 py-12 md:py-20 mx-auto max-w-7xl animate-fade-in">
        <div className="flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 border-b border-border/40 pb-8">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Tag className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Search Results</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
              Results for{' '}
              <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                &quot;{query}&quot;
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-2xl">
              Found {totalDocs} {totalDocs === 1 ? 'result' : 'results'} matching your search.
            </p>
          </div>

          {/* Results Grid */}
          <div>
            {results.length > 0 ? (
              <>
                <NodeTopics topics={results} />
                <Pagination currentPage={page} totalPages={totalPages} />
              </>
            ) : (
              <div className="text-center py-20 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-dashed border-muted-foreground/30 backdrop-blur-sm">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-4">
                  <Tag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No topics found</h2>
                <p className="text-muted-foreground">
                  We couldn&apos;t find any topics matching &quot;{query}&quot;. Try searching for
                  something else.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
