'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { shadcnConverters } from '@/components/rich-text/converters'
import { ShortcodeProvider } from '@/components/frontend/shortcode/shortcode-context'
import type { ShortcodeDataItem } from '@/services/shortcode/process'

interface TopicIntroductoryProps {
  introductory?: SerializedEditorState | null
  shortcodeData?: Record<string, ShortcodeDataItem>
}

/**
 * Topic Introductory Section - Displays above product list
 */
export function TopicIntroductory({ introductory, shortcodeData = {} }: TopicIntroductoryProps) {
  const hasIntroductory = !!(introductory?.root?.children && introductory.root.children.length > 0)

  if (!hasIntroductory || !introductory) {
    return null
  }

  return (
    <div className="mb-8 animate-slide-up">
      <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-background/50 p-6 md:p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
        {/* Decoration background */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />

        <div className="relative">
          {/* We define global styles for bold text here because converters for text nodes are more complex */}
          <div className="[&_strong]:font-extrabold [&_strong]:text-foreground">
            <ShortcodeProvider data={shortcodeData}>
              <RichText data={introductory} converters={shadcnConverters} />
            </ShortcodeProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TopicMainContentProps {
  content?: SerializedEditorState | null
  shortcodeData?: Record<string, ShortcodeDataItem>
}

/**
 * Topic Main Content Section - Displays below product list
 */
export function TopicMainContent({ content, shortcodeData = {} }: TopicMainContentProps) {
  const hasContent = !!(content?.root?.children && content.root.children.length > 0)

  if (!hasContent || !content) {
    return null
  }

  return (
    <div className="mt-12 animate-slide-up">
      <div className="bg-card/30 p-6 md:p-10 rounded-2xl border border-border/40">
        {/* We define global styles for bold text here because converters for text nodes are more complex */}
        <div className="[&_strong]:font-extrabold [&_strong]:text-foreground">
          <ShortcodeProvider data={shortcodeData}>
            <RichText data={content} converters={shadcnConverters} />
          </ShortcodeProvider>
        </div>
      </div>
    </div>
  )
}
