import { ShortcodeArgs } from '@/services/shortcode'

export type ShortcodeType = 'topics' | 'posts'

export interface ShortcodeMatch {
  fullMatch: string
  type: ShortcodeType
  args: ShortcodeArgs
  index: number
}

// Regex to capture: {{ type arg1="value" arg2=["v1","v2"] }}
// This is a simplified regex.
// Pattern breakdown:
// {{ \s* (topics|posts) \s+ ([^}]+) \s* }}
const SHORTCODE_REGEX = /{{\s*(topics|posts)\s+([^}]+)\s*}}/g

// Parser for arguments like: tags=["a", "b"] search="keyword"
function parseArgs(argsString: string): ShortcodeArgs {
  const args: ShortcodeArgs = {}

  // Parse tags=["v1", "v2"]
  const tagsMatch = argsString.match(/tags=\[([\s\S]*?)\]/)
  if (tagsMatch) {
    try {
      // Adding brackets back to make it a valid JSON array string component if matches internal content
      // But simple string split might be safer if quotes are consistent
      // Let's assume tags are double quoted: "tag1", "tag2"
      const content = tagsMatch[1]
      // Split by comma, strip quotes and whitespace
      args.tags = content
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } catch (e) {
      console.error('Failed to parse tags arg:', tagsMatch[0], e)
    }
  }

  // Parse search="keyword"
  const searchMatch = argsString.match(/search=["']([^"']+)["']/)
  if (searchMatch) {
    args.search = searchMatch[1]
  }

  // Parse limit=10
  const limitMatch = argsString.match(/limit=(\d+)/)
  if (limitMatch) {
    args.limit = parseInt(limitMatch[1], 10)
  }

  // Parse h2="Title"
  const h2Match = argsString.match(/h2=["']([^"']+)["']/)
  if (h2Match) {
    args.h2 = h2Match[1]
  }

  // Parse h3="Title"
  const h3Match = argsString.match(/h3=["']([^"']+)["']/)
  if (h3Match) {
    args.h3 = h3Match[1]
  }

  // Parse subtitle="Desc"
  const subtitleMatch = argsString.match(/subtitle=["']([^"']+)["']/)
  if (subtitleMatch) {
    args.subtitle = subtitleMatch[1]
  }

  // Parse _id="sc_123" (Internal Use)
  const idMatch = argsString.match(/_id=["']([^"']+)["']/)
  if (idMatch) {
    args._id = idMatch[1]
  }

  return args
}

export function findShortcodes(text: string): ShortcodeMatch[] {
  const matches: ShortcodeMatch[] = []
  let match

  // Reset lastIndex because regex is global
  SHORTCODE_REGEX.lastIndex = 0

  while ((match = SHORTCODE_REGEX.exec(text)) !== null) {
    const type = match[1] as ShortcodeType
    const argsString = match[2]

    matches.push({
      fullMatch: match[0],
      type,
      args: parseArgs(argsString),
      index: match.index,
    })
  }

  return matches
}

/**
 * Splits text into parts, separating shortcodes from normal text.
 * Useful for rendering components interleaved with text.
 */
export function splitByShortcode(text: string): Array<string | ShortcodeMatch> {
  const parts: Array<string | ShortcodeMatch> = []
  const matches = findShortcodes(text)

  if (matches.length === 0) {
    return [text]
  }

  let lastIndex = 0
  matches.forEach((match) => {
    // Push preceding text if any
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    // Push the match object
    parts.push(match)
    // Update last index
    lastIndex = match.index + match.fullMatch.length
  })

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
}
