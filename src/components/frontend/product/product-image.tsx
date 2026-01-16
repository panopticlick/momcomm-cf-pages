'use client'

import React from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

interface ProductImageProps {
  imageUrl?: string
  title: string
}

export function ProductImage({ imageUrl, title }: ProductImageProps) {
  return (
    <div className="flex justify-center items-start animate-fade-in">
      <Card className="w-full max-w-lg overflow-hidden border-2">
        <CardContent className="p-6 md:p-8">
          {imageUrl ? (
            <div className="relative w-full aspect-square">
              <Image src={imageUrl} alt={title} fill className="object-contain" priority />
            </div>
          ) : (
            <div className="w-full aspect-square bg-secondary flex items-center justify-center text-muted-foreground rounded-lg">
              <div className="text-center">
                <p className="text-lg font-medium">No Image Available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
