'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Folder } from 'lucide-react'

interface CategoryNode {
  id: string | number
  slug: string
  display_name: string
  context_free_name?: string
}

function getNodeName(node: CategoryNode) {
  return node.context_free_name || node.display_name
}

interface CategoryGroup {
  root: CategoryNode
  children: CategoryNode[]
}

interface CategoriesProps {
  groups: CategoryGroup[]
}

export function Categories({ groups }: CategoriesProps) {
  return (
    <section className="container px-4 md:px-6 py-12 md:py-20 mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-3">Browse Categories</h2>
        <p className="text-muted-foreground">Choose your area of interest and start exploring</p>
      </div>

      <div className="space-y-16">
        {groups.map((group) => (
          <div key={group.root.id} className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b">
              <Folder className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold tracking-tight">{getNodeName(group.root)}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {group.children.map((node, index) => (
                <Link
                  key={node.id}
                  href={`/n/${node.slug}`}
                  className="group h-full"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Card className="h-full transition-all duration-300 hover-lift border-2 hover:border-primary/50 bg-card/50 backdrop-blur-sm overflow-hidden shine">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Folder className="w-5 h-5" />
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {getNodeName(node)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {node.display_name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {group.children.length === 0 && (
              <p className="text-muted-foreground italic">No subcategories available.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
