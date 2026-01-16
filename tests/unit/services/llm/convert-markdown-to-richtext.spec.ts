import { describe, it, expect } from 'vitest'
import { convertTextToRichText } from '@/services/llm/convert-markdown-to-richtext'

describe('convert-markdown-to-richtext newline handling', () => {
  it('should handle single newlines in convertTextToRichText', () => {
    const input =
      'Q: How often should I clean my golf clubs?\nA: Ideally, you should wipe them down after every shot and do a deep clean every few rounds or once a month, depending on how often you play.\n\n'
    const result = convertTextToRichText(input)

    // Check if both Q and A are in the children as separate nodes
    const paragraph = result.root.children[0]
    expect(paragraph.type).toBe('paragraph')
    expect(paragraph.children).toHaveLength(3) // ["Q:...", linebreak, "A:..."]
    expect(paragraph.children[0].type).toBe('text')
    expect((paragraph.children[0] as any).text).toContain('Q:')
    expect(paragraph.children[1].type).toBe('linebreak')
    expect(paragraph.children[2].type).toBe('text')
    expect((paragraph.children[2] as any).text).toContain('A:')
  })

  // Since convertMarkdownToRichText requires SanitizedConfig (which is hard to mock here without full payload setup),
  // we focus on what we can easily fix or what might be the culprit.
})
