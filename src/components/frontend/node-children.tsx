'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, FolderOpen } from 'lucide-react'

interface NodeChildrenProps {
  childrenNodes: Array<{
    id: string | number
    slug: string
    display_name: string
  }>
}

export function NodeChildren({ childrenNodes }: NodeChildrenProps) {
  if (!childrenNodes || childrenNodes.length === 0) {
    return null
  }

  return (
    <section className="animate-slide-up relative">
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <FolderOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subcategories</h2>
          <p className="text-muted-foreground text-lg">Quickly navigate to specific categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {childrenNodes.map((child, index) => (
          <Link
            key={child.id}
            href={`/n/${child.slug}`}
            className="group"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <Card className="h-full border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-primary/50">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-4 h-32 md:h-40 relative group-hover:bg-linear-to-br from-primary/5 to-transparent">
                {/* Decorative background blob */}
                <div className="absolute w-16 h-16 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <h3 className="font-bold text-lg group-hover:text-primary transition-colors z-10">
                  {child.display_name}
                </h3>

                <div className="flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors z-10">
                  <span>Browse</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
