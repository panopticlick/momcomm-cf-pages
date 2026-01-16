import type { Payload } from 'payload'
import { AnthropicClient } from '@/services/anthropic-client'

/**
 * Topic data structure for deduplication
 */
export interface TopicForDedupe {
  id: number
  name: string
  conversion_share_sum: number
  active: boolean
  slug: string
}

/**
 * Duplicate topic item in result
 */
export interface DuplicateTopicItem {
  id: number
  name: string
  conversion_share_sum: number
  active: boolean
  slug: string
  isMain: boolean
}

/**
 * Get topics for deduplication analysis
 * @param payload Payload client
 * @returns Array of topics with id and name
 */
export async function getTopicsForDeduplication(payload: Payload): Promise<TopicForDedupe[]> {
  const result = await payload.find({
    collection: 'topics',
    where: {
      redirect: {
        equals: false,
      },
    },
    select: {
      id: true,
      name: true,
      conversion_share_sum: true,
      active: true,
      slug: true,
    },
    sort: 'name',
    limit: 50000,
    pagination: false,
  })

  return result.docs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    conversion_share_sum: doc.conversion_share_sum ?? 0,
    active: doc.active ?? false,
    slug: doc.slug,
  }))
}

/**
 * Stop words to ignore when comparing keywords
 */
import {
  CONTEXT_DEPENDENT_STOP_WORDS,
  PLURAL_PATTERNS,
  REGEX_REPLACEMENTS,
  STOP_WORDS,
  CANONICAL_WORD_MAP,
} from './topic-dedupe-dictionaries'

/**
 * Normalize a word: lowercase, remove hyphens, handle singular/plural
 */
export function normalizeWord(word: string): string {
  let normalized = word.toLowerCase().replace(/[-']/g, '')

  // Check aliases / irregular plurals / exceptions first
  if (CANONICAL_WORD_MAP[normalized]) {
    return CANONICAL_WORD_MAP[normalized]
  }

  // Try to singularize using patterns
  for (const { pattern, replacement } of PLURAL_PATTERNS) {
    if (pattern.test(normalized) && normalized.length > 3) {
      const singular = normalized.replace(pattern, replacement)
      // Only use singular if it's a meaningful word (at least 2 chars)
      if (singular.length >= 2) {
        normalized = singular
        break
      }
    }
  }

  return normalized
}

/**
 * Extract and normalize word set from a keyword, excluding stop words
 */
export function getWordSet(keyword: string): Set<string> {
  // 0. Apply regex replacements (e.g., "12v" -> "12 volt")
  let processed = keyword
  for (const { pattern, replacement } of REGEX_REPLACEMENTS) {
    processed = processed.replace(pattern, replacement)
  }

  // 1. Lowercase and replace hyphens with spaces
  processed = processed.toLowerCase().replace(/[-_]/g, ' ')

  const words = processed
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => {
      // Check aliases (pre-normalization)
      return CANONICAL_WORD_MAP[w] || w
    })
    .filter((w) => !STOP_WORDS.has(w))
    .map(normalizeWord)
    // Check aliases again (post-normalization, e.g. "smartphones" -> "smartphone" -> "phone")
    .map((w) => CANONICAL_WORD_MAP[w] || w)
    .filter((w) => !STOP_WORDS.has(w))
    .map(normalizeWord)

  const finalWords = new Set(words)

  // Context-aware deduplication
  for (const [trigger, wordsToRemove] of Object.entries(CONTEXT_DEPENDENT_STOP_WORDS)) {
    if (finalWords.has(trigger)) {
      for (const word of wordsToRemove) {
        finalWords.delete(word)
      }
    }
  }

  return finalWords
}
// ... (rest of file)

/**
 * Generate a sorted string key from the word set
 * Example: "computer for kids" -> "child|computer" (sorted)
 */
export function getWordSetKey(keyword: string): string {
  const wordSet = getWordSet(keyword)
  return Array.from(wordSet).sort().join('|')
}

/**
 * Get "spaceless" key for compound word matching
 * Example: "smart watch" -> "smartwatch"
 */
export function getSpacelessKey(keyword: string): string {
  // 1. Get filtered words (normalized, no stop words)
  const wordSet = getWordSet(keyword)
  // 2. Sort them to ignore order (optional, but good for "watch smart" vs "smartwatch")
  // Actually, for "smartwatch" vs "smart watch", we want to join them.
  // "smart watch" -> {smart, watch} -> "smartwatch"
  // "smartwatch" -> {smartwatch} -> "smartwatch"

  // NOTE: If we use the normalized set, "smart watchs" -> "smart watch" -> "smartwatch"
  return Array.from(wordSet).join('')
}

/**
 * Find duplicate topics using Dual Key Strategy (Bag-of-Words + Spaceless)
 * @param names Array of topic names
 * @returns Array of duplicate groups, each group is an array of topic names
 */
export function findDuplicatesByWordSet(names: string[]): string[][] {
  // Map 1: BagOfWords Key -> names[]
  // Key: "child|computer"
  const byWordSet = new Map<string, string[]>()

  // Map 2: Spaceless Key -> names[]
  // Key: "childcomputer"
  const bySpaceless = new Map<string, string[]>()

  for (const name of names) {
    const wordKey = getWordSetKey(name)
    if (!wordKey) continue

    if (!byWordSet.has(wordKey)) byWordSet.set(wordKey, [])
    byWordSet.get(wordKey)!.push(name)

    const spacelessKey = getSpacelessKey(name)
    if (spacelessKey && spacelessKey.length > 3) {
      // Avoid joining very short things
      if (!bySpaceless.has(spacelessKey)) bySpaceless.set(spacelessKey, [])
      bySpaceless.get(spacelessKey)!.push(name)
    }
  }

  // Union-Find / Transitive Closure to merge groups
  // We have a list of items (names). We want to group them if they share a key in EITHER map.

  // Adjacency list: name -> Set<name> (neighbors)
  const adj = new Map<string, Set<string>>()
  const addEdge = (u: string, v: string) => {
    if (!adj.has(u)) adj.set(u, new Set())
    if (!adj.has(v)) adj.set(v, new Set())
    adj.get(u)!.add(v)
    adj.get(v)!.add(u)
  }

  // Add edges from WordSet groups
  for (const group of byWordSet.values()) {
    for (let i = 0; i < group.length - 1; i++) {
      addEdge(group[i], group[i + 1])
    }
  }

  // Add edges from Spaceless groups
  for (const group of bySpaceless.values()) {
    for (let i = 0; i < group.length - 1; i++) {
      addEdge(group[i], group[i + 1])
    }
  }

  // Find connected components
  const visited = new Set<string>()
  const result: string[][] = []

  // Ensure all valid names are considered (some might be singletons in maps but only have edges if >1 in group)
  // We only care about groups size >= 2
  // So we can just iterate over the adjacency list, which only contains nodes that are part of some relationship.

  for (const node of adj.keys()) {
    if (visited.has(node)) continue

    const component: string[] = []
    const queue = [node]
    visited.add(node)

    while (queue.length > 0) {
      const curr = queue.shift()!
      component.push(curr)

      const neighbors = adj.get(curr)
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        }
      }
    }

    if (component.length >= 2) {
      result.push(component)
    }
  }

  return result
}

/**
 * Map duplicate name groups to topic objects with id and name
 * @param topics Original topics array
 * @param duplicateNameGroups Groups of duplicate names
 * @returns Groups of DuplicateTopicItem
 */
export function mapDuplicateGroupsToTopics(
  topics: TopicForDedupe[],
  duplicateNameGroups: string[][],
): DuplicateTopicItem[][] {
  // Create name to topic map for fast lookup
  const nameToTopic = new Map<string, TopicForDedupe>()
  for (const topic of topics) {
    nameToTopic.set(topic.name, topic)
  }

  return duplicateNameGroups
    .map((group) => {
      // First pass: collect topic items with basic info
      const items = group
        .map((name) => {
          const topic = nameToTopic.get(name)
          if (topic) {
            return {
              id: topic.id,
              name: topic.name,
              conversion_share_sum: topic.conversion_share_sum ?? 0,
              active: topic.active ?? false,
              slug: topic.slug,
            }
          }
          return null
        })
        .filter((item): item is Omit<DuplicateTopicItem, 'isMain'> => item !== null)

      if (items.length < 2) {
        return []
      }

      // Find the main item in the group
      // Priority: 1. active: true first, 2. if multiple active: true, choose the one with max conversion_share_sum
      const activeItems = items.filter((item) => item.active === true)

      let mainItem: (typeof items)[0]
      if (activeItems.length > 0) {
        // Choose from active items, pick the one with max conversion_share_sum
        mainItem = activeItems.reduce((max, item) =>
          item.conversion_share_sum > max.conversion_share_sum ? item : max,
        )
      } else {
        // No active items, choose the one with max conversion_share_sum
        mainItem = items.reduce((max, item) =>
          item.conversion_share_sum > max.conversion_share_sum ? item : max,
        )
      }

      // Add isMain field: only the mainItem gets true
      return items.map((item) => ({
        ...item,
        isMain: item.id === mainItem.id,
      }))
    })
    .filter((group) => group.length >= 2) // Keep only groups with at least 2 valid items
}

/**
 * Main deduplication function - orchestrates the full process
 * @param payload Payload client
 * @param anthropicClient Anthropic client (deprecated, not used in new logic)
 * @returns Object containing duplicate groups and statistics
 */
export async function deduplicateTopics(
  payload: Payload,
  anthropicClient?: AnthropicClient,
): Promise<{
  totalTopics: number
  duplicateGroups: DuplicateTopicItem[][]
  totalDuplicates: number
}> {
  // Get topics
  const topics = await getTopicsForDeduplication(payload)

  if (topics.length === 0) {
    return {
      totalTopics: 0,
      duplicateGroups: [],
      totalDuplicates: 0,
    }
  }

  // Extract names
  const names = topics.map((t) => t.name)

  // Find duplicates using deterministic word set matching logic
  const duplicateNameGroups = findDuplicatesByWordSet(names)

  // Map name groups to topic objects with id
  const duplicateGroups = mapDuplicateGroupsToTopics(topics, duplicateNameGroups)

  // Calculate total duplicates (sum of all group sizes - number of groups = extra items)
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0)

  return {
    totalTopics: topics.length,
    duplicateGroups,
    totalDuplicates,
  }
}

/**
 * Result of applying redirects
 */
export interface ApplyRedirectsResult {
  totalUpdated: number
}

/**
 * Apply redirects to duplicate topics using batch SQL update
 * For each group:
 * - isMain: true topic remains unchanged (kept as the main topic)
 * - isMain: false topics get: redirect_to = main topic id, redirect = true, active = false
 * @param payload Payload client
 * @param duplicateGroups Groups of duplicate topics with isMain flag
 * @returns Result with count of updated topics
 */
export async function applyDuplicateRedirects(
  payload: Payload,
  duplicateGroups: DuplicateTopicItem[][],
): Promise<ApplyRedirectsResult> {
  // Collect all updates: { duplicateId, redirectTo (slug path) }
  const updates: Array<{ duplicateId: number; redirectTo: string }> = []

  for (const group of duplicateGroups) {
    const mainTopic = group.find((item) => item.isMain)
    if (!mainTopic) {
      console.warn(
        'No main topic found in group:',
        group.map((g) => g.name),
      )
      continue
    }

    const duplicates = group.filter((item) => !item.isMain)
    for (const duplicate of duplicates) {
      updates.push({ duplicateId: duplicate.id, redirectTo: `/gear/${mainTopic.slug}` })
    }
  }

  if (updates.length === 0) {
    return { totalUpdated: 0 }
  }

  // Build batch SQL update using CASE WHEN
  const { sql } = await import('@payloadcms/db-postgres')
  const db = payload.db.drizzle

  // Build the CASE WHEN clause for redirect_to (slug path)
  const caseWhenParts = updates
    .map((u) => `WHEN id = ${u.duplicateId} THEN '${u.redirectTo}'`)
    .join(' ')
  const duplicateIds = updates.map((u) => u.duplicateId).join(', ')

  const query = sql.raw(`
    UPDATE topics
    SET 
      redirect_to = CASE ${caseWhenParts} END,
      redirect = true,
      active = false,
      updated_at = NOW()
    WHERE id IN (${duplicateIds})
  `)

  await db.execute(query)

  return {
    totalUpdated: updates.length,
  }
}

// ----------------------------------------------------------------------
// DEPRECATED AI FUNCTIONS (Kept for reference or future complex matching)
// ----------------------------------------------------------------------

/**
 * @deprecated Use formatTopicNames inline or simple map
 */
export function formatTopicNames(topics: TopicForDedupe[]): string[] {
  return topics.map((t) => t.name)
}

/**
 * @deprecated Use findDuplicatesByWordSet instead
 */
export async function findDuplicateTopics(
  anthropicClient: AnthropicClient,
  names: string[],
): Promise<string[][]> {
  // Keep empty implementation just to satisfy type checker if imported elsewhere
  // But functionality is essentially disabled/deprecated
  return []
}
