import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from '@payloadcms/richtext-lexical/lexical'
import { ShortcodeArgs, getTopics, getPostsByTags } from '@/services/shortcode'
import type { TopicWithImage } from '@/components/frontend/node-topics'
import type { Post } from '@/payload-types'
import { randomUUID } from 'node:crypto'

export type ShortcodeType = 'topics' | 'posts'

export type ShortcodeDataItem = {
  type: ShortcodeType
  args: ShortcodeArgs
  data: TopicWithImage[] | Post[]
}

// Regex to capture: {{ type arg1="value" limit=5 }}
const SHORTCODE_REGEX = /\{\{\s*(topics|posts)\s+([^}]+)\s*\}\}/g

/**
 * Parse shortcode arguments from string
 */
function parseArgs(argsString: string): ShortcodeArgs {
  const args: ShortcodeArgs = {}

  // Parse tags=["v1", "v2"]
  const tagsMatch = argsString.match(/tags=\[([\s\S]*?)\]/)
  if (tagsMatch) {
    try {
      const content = tagsMatch[1]
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

  return args
}

/**
 * Traverse the Lexical JSON tree, identify shortcodes, fetch data,
 * and inject a unique ID into the shortcode text string.
 * Returns the mutated content and a map of ID -> Data.
 */
export async function processShortcodesWithId(
  content: SerializedEditorState | null | undefined,
  options?: { excludeSlug?: string },
): Promise<{
  content: SerializedEditorState | null | undefined
  dataMap: Record<string, ShortcodeDataItem>
}> {
  const dataMap: Record<string, ShortcodeDataItem> = {}

  if (!content?.root?.children) return { content, dataMap }

  const promises: Promise<void>[] = []

  // Helper to ensure we don't modify the same text node multiple times concurrently
  // (though traversing is sync, the fetching is async)
  // We'll process matching and ID generation synchronously, then fetch data asynchronously.

  function traverse(node: SerializedLexicalNode & { children?: SerializedLexicalNode[] }) {
    if (node.type === 'text' && typeof (node as any).text === 'string') {
      const text = (node as any).text as string
      // Quick check
      if (text.includes('{{') && text.includes('}}')) {
        processNode(node as any, text)
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  function processNode(node: SerializedLexicalNode & { text: string }, text: string) {
    const matches: {
      type: ShortcodeType
      args: ShortcodeArgs
      fullMatch: string
      index: number
    }[] = []
    let match

    // Reset regex index
    SHORTCODE_REGEX.lastIndex = 0

    while ((match = SHORTCODE_REGEX.exec(text)) !== null) {
      matches.push({
        type: match[1] as ShortcodeType,
        args: parseArgs(match[2]),
        fullMatch: match[0],
        index: match.index,
      })
    }

    if (matches.length > 0) {
      let newText = text
      // Process backwards to avoid messing up indices when replacing
      // Actually, we can just replace. But wait, if multiple shortcodes in one node?
      // Yes.

      // We will rebuild the text string.
      // But simple replace might replace the wrong one if duplicates exist.
      // We need to be careful.
      // Let's use a replacer function on the regex.

      newText = text.replace(SHORTCODE_REGEX, (fullMatch, type, argsStr) => {
        const id = 'sc_' + randomUUID().replace(/-/g, '').substring(0, 8)

        // Parse args again? We did above. But inside replace callback is easiest way to transform.
        const args = parseArgs(argsStr)
        if (options?.excludeSlug) {
          args.excludeSlug = options.excludeSlug
        }

        // Add promise to fetch data
        promises.push(
          (async () => {
            try {
              if (type === 'topics') {
                const data = await getTopics(args)
                dataMap[id] = { type: 'topics', args, data }
              } else if (type === 'posts') {
                const data = args.tags?.length
                  ? await getPostsByTags(args.tags, args.limit, args.excludeSlug)
                  : []
                dataMap[id] = { type: 'posts', args, data }
              }
            } catch (e) {
              console.error(`Error processing shortcode ${type} ${id}`, e)
              dataMap[id] = { type: type as ShortcodeType, args, data: [] }
            }
          })(),
        )

        // Insert ID into the shortcode string
        // {{ type args }} -> {{ type args _id="id" }}
        // We append it to the args string.
        return `{{ ${type} ${argsStr} _id="${id}" }}`
      })

      node.text = newText
    }
  }

  if (content.root && content.root.children) {
    content.root.children.forEach(traverse)
  }

  await Promise.all(promises)

  return { content, dataMap }
}

// Deprecated alias just in case, but better to force migration
export const enrichContentWithShortcodes = async (content: SerializedEditorState, opts: any) => {
  const { content: c } = await processShortcodesWithId(content, opts)
  return c
}
