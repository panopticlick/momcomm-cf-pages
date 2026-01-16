'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { shadcnConverters } from '@/components/rich-text/converters'
import { ShortcodeProvider } from '@/components/frontend/shortcode/shortcode-context'
import type { ShortcodeDataItem } from '@/services/shortcode/process'

interface PostContentProps {
  content: SerializedEditorState | null | undefined
  shortcodeData?: Record<string, ShortcodeDataItem>
}

export function PostContent({ content, shortcodeData = {} }: PostContentProps) {
  if (!content) return null

  return (
    <article className="container px-4 md:px-6 mx-auto py-12 max-w-5xl">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ShortcodeProvider data={shortcodeData}>
          <RichText data={content} converters={shadcnConverters} />
        </ShortcodeProvider>
      </div>
    </article>
  )
}
