import { describe, it, expect, vi } from 'vitest'
import { shadcnConverters } from '@/components/rich-text/converters'
import React from 'react'
import { render } from '@testing-library/react'

// Mock dependencies
vi.mock('@/components/frontend/shortcode/shortcode-renderer', () => ({
  ShortcodeRenderer: vi.fn(({ content }) => <div data-testid="shortcode-renderer">{content}</div>),
}))

describe('shadcnConverters', () => {
  it('should render shortcode when mixed with other nodes (e.g. linebreaks)', () => {
    // Setup
    const defaultConverters = {} // Mock if needed
    const converters = shadcnConverters({ defaultConverters } as any)

    // Mock nodesToJSX helper
    const nodesToJSX = vi.fn(({ nodes }) => {
      return nodes.map((node: any, i: number) => {
        if (node.type === 'linebreak') return <br key={i} data-testid="linebreak" />
        if (node.type === 'text')
          return (
            <span key={i} data-testid="text-node">
              {node.text}
            </span>
          )
        return null
      })
    })

    // Scenario: Paragraph with Shortcode + LineBreak + Shortcode
    const node = {
      tag: 'p',
      children: [
        {
          type: 'text',
          text: '{{ topics tags=["kids-golf-shoes"] }}',
        },
        {
          type: 'linebreak',
        },
        {
          type: 'text',
          text: '{{ posts tags=["kids-golf-shoes"] }}',
        },
      ],
    }

    // Execute
    if (!converters.paragraph || typeof converters.paragraph !== 'function') {
      throw new Error('Paragraph converter not found or not a function')
    }
    const result = converters.paragraph({ node, nodesToJSX } as any)

    // Render result to inspecting DOM structure
    const { getByText, getAllByTestId } = render(result)

    // Verify
    // 1. Should have called ShortcodeRenderer for the first text node
    expect(getAllByTestId('shortcode-renderer')).toHaveLength(2)
    expect(getByText('{{ topics tags=["kids-golf-shoes"] }}')).toBeDefined()
    expect(getByText('{{ posts tags=["kids-golf-shoes"] }}')).toBeDefined()

    // 2. Should have called nodesToJSX for the linebreak
    expect(nodesToJSX).toHaveBeenCalled()
    // Actually our implementation calls nodesToJSX for non-shortcode nodes.
    // Let's verify the linebreak is present in the output
    expect(getAllByTestId('linebreak')).toHaveLength(1)
  })

  it('should fall back to standard paragraph for normal text', () => {
    // Setup
    const defaultConverters = {}
    const converters = shadcnConverters({ defaultConverters } as any)

    const nodesToJSX = vi.fn(() => <span>Normal Text</span>)

    const node = {
      tag: 'p',
      children: [
        {
          type: 'text',
          text: 'Just some normal text.',
        },
      ],
    }

    // Execute
    if (!converters.paragraph || typeof converters.paragraph !== 'function') {
      throw new Error('Paragraph converter not found or not a function')
    }
    const result = converters.paragraph({ node, nodesToJSX } as any)

    // Verify
    // Should return a <p> tag, not our special <div> wrapper
    if (!React.isValidElement(result)) {
      throw new Error('Result is not a valid React element')
    }
    expect(result.type).toBe('p')
    expect(nodesToJSX).toHaveBeenCalled()
  })
})
