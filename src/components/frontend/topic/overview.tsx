import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MergedProduct } from '@/components/frontend/topic/product-card'
import { generateTopicSummary } from '@/components/lib/generate-topic-summary'
import { Sparkles } from 'lucide-react'

interface TopicOverviewProps {
  topicName: string
  products: MergedProduct[]
  className?: string
}

export function TopicOverview({ topicName, products, className }: TopicOverviewProps) {
  const summary = generateTopicSummary(products, topicName)

  return (
    <Card className={`mb-8 border-none shadow-sm bg-secondary/10 ${className}`}>
      <CardHeader className="pb-2 flex flex-row items-center space-y-0 gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <CardTitle className="text-xl">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  )
}
