'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface ProductFeaturesProps {
  features: string[]
}

export function ProductFeatures({ features }: ProductFeaturesProps) {
  if (features.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-4">Product Features</h3>
        <ul className="space-y-3">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
