'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/components/lib/use-debounce'
import { searchTopics, type SearchResult } from '@/services/search/actions'

export function SearchBox() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Navigate to search page on submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  // Handle search logic
  React.useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const data = await searchTopics(debouncedQuery)
        setResults(data)
        setIsOpen(true)
      } catch (error) {
        console.error('Failed to search:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length > 0) setIsOpen(true)
            }}
            placeholder="Search MomComm..."
            className="w-full pl-9 pr-4 py-2 border rounded-full bg-secondary/50 border-input hover:bg-secondary/80 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-hidden"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || debouncedQuery) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/gear/${result.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col px-4 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {result.display_name || result.name}
                  </span>
                  {result.display_name && result.name !== result.display_name && (
                    <span className="text-xs text-muted-foreground">{result.name}</span>
                  )}
                </Link>
              ))}
              <div className="border-t border-border/50 mt-1">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-xs font-medium text-center text-primary hover:text-primary/80 hover:bg-accent/30 transition-colors"
                >
                  Show more results for &quot;{query}&quot;
                </Link>
              </div>
            </div>
          ) : (
            debouncedQuery &&
            !isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No topics found for &quot;{query}&quot;
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
