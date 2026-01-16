'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface TopicBreadcrumbProps {
  topicName: string
  root?: {
    label: string
    href: string
  }
  nodes?: {
    name: string
    slug: string
  }[]
}

/**
 * Breadcrumb navigation for Topic page
 */
export function TopicBreadcrumb({ topicName, root, nodes = [] }: TopicBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 animate-fade-in">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-foreground transition-colors whitespace-nowrap"
          >
            <Home className="w-4 h-4 mr-1" />
            <span>Home</span>
          </Link>
        </li>
        {root && (
          <li className="flex items-center whitespace-nowrap">
            <ChevronRight className="w-4 h-4 mx-1" />
            <Link href={root.href} className="hover:text-foreground transition-colors">
              {root.label}
            </Link>
          </li>
        )}
        {nodes.map((node) => (
          <li key={node.slug} className="flex items-center whitespace-nowrap">
            <ChevronRight className="w-4 h-4 mx-1" />
            <Link href={`/n/${node.slug}`} className="hover:text-foreground transition-colors">
              {node.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center whitespace-nowrap">
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="text-foreground font-medium">{topicName}</span>
        </li>
      </ol>
    </nav>
  )
}
