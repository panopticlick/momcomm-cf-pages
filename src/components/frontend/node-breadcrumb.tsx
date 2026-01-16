'use client'

import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'

interface NodeBreadcrumbProps {
  nodes: {
    display_name: string
    slug: string
  }[]
}

export function NodeBreadcrumb({ nodes }: NodeBreadcrumbProps) {
  return (
    <div className="mb-8 animate-slide-in">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1.5 hover:text-primary">
              <Home className="w-4 h-4" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          {nodes.map((node, index) => {
            const isLast = index === nodes.length - 1
            return (
              <React.Fragment key={node.slug}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-medium">{node.display_name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={`/n/${node.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {node.display_name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
