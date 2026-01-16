import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import React from 'react'
import { ShortcodeRenderer } from '@/components/frontend/shortcode/shortcode-renderer'

export const shadcnConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    const children = nodesToJSX({ nodes: node.children })

    switch (Tag) {
      case 'h1':
        return (
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-12 mb-6 first:mt-0">
            {children}
          </h1>
        )
      case 'h2':
        return (
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-12 mb-6">
            {children}
          </h2>
        )
      case 'h3':
        return (
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4">
            {children}
          </h3>
        )
      case 'h4':
        return (
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">{children}</h4>
        )
      default:
        return <Tag className="font-semibold tracking-tight mt-4 mb-2">{children}</Tag>
    }
  },
  paragraph: ({ node, nodesToJSX }) => {
    // Only attempt to process simple text nodes for shortcodes to avoid breaking complex structures
    // If the paragraph contains complex children (links etc), nodesToJSX handles them, but our shortcode is simple text.
    // However, the shortcode might be split across multiple text nodes or mixed.
    // For simplicity, let's render the children to string if possible, or just let React handle it.
    // But ShortcodeRenderer expects a string input.
    //
    // If we simply use nodesToJSX, we get React Nodes. We can't regex search React Nodes easily.
    //
    // Strategy:
    // 1. If the paragraph has only one child and it's a text node, we can check for shortcode.
    // 2. If it has multiple, it's harder.
    //
    // Let's stick to the simple case: The user writes the shortcode as a single block of text.
    // It's likely parsed as a single TextNode.

    // Check if any child is a text node containing a shortcode
    const hasShortcode = node.children.some(
      (child) =>
        child.type === 'text' &&
        (child as any).text.includes('{{') &&
        (child as any).text.includes('}}'),
    )

    if (hasShortcode) {
      return (
        <div className="leading-7 not-first:mt-6 text-foreground">
          {node.children.map((child, index) => {
            if (
              child.type === 'text' &&
              (child as any).text.includes('{{') &&
              (child as any).text.includes('}}')
            ) {
              return <ShortcodeRenderer key={index} content={(child as any).text} />
            }
            // For non-shortcode nodes (like linebreaks or other text), render them normally using nodesToJSX
            return <React.Fragment key={index}>{nodesToJSX({ nodes: [child] })}</React.Fragment>
          })}
        </div>
      )
    }

    const children = nodesToJSX({ nodes: node.children })
    return <p className="leading-7 not-first:mt-6 text-foreground">{children}</p>
  },
  list: ({ node, nodesToJSX }) => {
    const Tag = node.tag as 'ul' | 'ol'
    const children = nodesToJSX({ nodes: node.children })
    const className = Tag === 'ul' ? 'my-6 ml-6 list-disc' : 'my-6 ml-6 list-decimal'
    return <Tag className={className}>{children}</Tag>
  },
  listitem: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return <li className="mt-2 text-foreground">{children}</li>
  },
  quote: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return (
      <blockquote className="mt-6 border-l-2 pl-6 italic text-muted-foreground">
        {children}
      </blockquote>
    )
  },
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    let url = node.fields.url

    // Defense against double-encoded anchors (e.g. %2523 -> %23 -> #)
    if (url && url.includes('%2523')) {
      url = '#'
    }

    const isAffiliate = url && url.startsWith('/go/')
    const isNewTab = node.fields.newTab || isAffiliate

    const rels: string[] = []
    if (isNewTab) {
      rels.push('noopener', 'noreferrer')
    }
    if (isAffiliate) {
      rels.push('nofollow')
    }

    return (
      <a
        href={url}
        className="font-medium text-primary underline underline-offset-4"
        target={isNewTab ? '_blank' : undefined}
        rel={rels.length > 0 ? rels.join(' ') : undefined}
      >
        {children}
      </a>
    )
  },
})
