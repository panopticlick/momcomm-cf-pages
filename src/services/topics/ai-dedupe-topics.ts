import type { Payload } from 'payload'
import { AnthropicClient } from '@/services/anthropic-client'
import { findDuplicatesByWordSet } from './dedupe-topics'

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

// DEPRECATED AI FUNCTIONS REMOVED
// This file now only contains the AI-powered deduplication logic.
// For code-based deduplication, see src/services/topics/dedupe-topics.ts

/**
 * Find duplicate topics using AI (Anthropic Claude)
 * This function analyzes topic names and groups duplicates based on semantic similarity
 * @param anthropicClient Anthropic client instance
 * @param names Array of topic names to analyze
 * @param batchSize Number of names to process per batch (default: 500)
 * @returns Array of duplicate groups, each group is an array of topic names
 */
export async function findDuplicateTopicsWithAI(
  anthropicClient: AnthropicClient,
  names: string[],
  onStatus?: (message: string) => void,
): Promise<string[][]> {
  const log = (msg: string) => {
    console.log(msg)
    onStatus?.(msg)
  }

  if (names.length === 0) {
    return []
  }

  const allDuplicateGroups: string[][] = []

  // 1. Run deterministic code-based deduplication first
  log('Running code-based pre-deduplication...')
  const codeBasedGroups = findDuplicatesByWordSet(names)
  log(`Found ${codeBasedGroups.length} groups using code-based deduplication`)

  allDuplicateGroups.push(...codeBasedGroups)

  // 2. Filter out names that have already been grouped
  const groupedNames = new Set<string>()
  for (const group of codeBasedGroups) {
    for (const name of group) {
      groupedNames.add(name)
    }
  }

  const remainingNames = names.filter((name) => !groupedNames.has(name))
  log(`Remaining topics for AI analysis: ${remainingNames.length} (out of ${names.length})`)

  if (remainingNames.length < 2) {
    return allDuplicateGroups
  }

  // 3. Process remaining names with AI in a single batch
  // User requested to process all at once to avoid missing duplicates across batches
  log(`Processing ${remainingNames.length} topics with AI in a single request...`)

  const prompt = `你是一个专业的关键词去重专家。请分析以下关键词列表，找出所有重复的关键词组。

【词类型定义】
在分析之前，先识别每个关键词中的词类型：
1. **产品词**：核心产品类型，如 laptop, desktop, tablet, computer, monitor, keyboard
2. **属性词**：描述产品特性，如 gaming, educational, mini, wireless, cheap, premium
3. **场景词**：使用场景或目标，如 "for kids", "for office", "black friday deals"
4. **品牌词**：品牌名称，如 dell, hp, apple, tanoshi, lenovo
5. **年龄词**：年龄限定，如 "10-12", "ages 5-7", "8 year old"

【去重规则 - 极其严格】
**只有同时满足以下所有条件才认为是重复：**
1. ✅ 包含**完全相同**的产品词
2. ✅ 包含**完全相同**的属性词（或都不包含属性词）
3. ✅ 包含**完全相同**的品牌词（或都不包含品牌词）
4. ✅ 包含**完全相同**的年龄词（或都不包含年龄词）
5. ✅ 核心场景词相同（如 "for kids" 和 "kids" 算相同场景）
6. ✅ 仅在词序、连字符、单复数、停用词等**表达方式**上有差异

【认为是重复的案例】
- "computer for kids" ↔ "kids computer" ↔ "computer kids" （仅词序不同）
- "laptop cheap" ↔ "cheap laptop" （仅词序不同）
- "tablet on sale" ↔ "tablets on sale" （仅单复数不同）
- "smart-watch" ↔ "smart watch" ↔ "smartwatch" （仅连字符不同）

【不要认为是重复的案例 - 非常重要】
- "computer for kids" ≠ "laptop for kids" （产品词不同：computer vs laptop）
- "computer for kids" ≠ "gaming computer for kids" （属性词不同：无 vs gaming）
- "computer for kids" ≠ "educational computer for kids" （属性词不同：无 vs educational）
- "computer for kids 8-12" ≠ "computer for kids 10-12" （年龄词不同：8-12 vs 10-12）
- "computer for kids" ≠ "dell computer for kids" （品牌词不同：无 vs dell）
- "mini computer" ≠ "computer" （属性词不同：mini vs 无）
- "kids laptop computer" ≠ "computer kids" （产品词不同：laptop computer vs computer）

【分析步骤】
1. 先提取每个关键词的：产品词、属性词、品牌词、年龄词、场景词
2. 只有在这些词完全一致时，才考虑是否为重复
3. 如果核心词一致，仅在表达方式（词序、连字符等）上有差异，则认为是重复

关键词列表：
${remainingNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}

请返回 JSON 格式的重复组数组。每个组是一个数组，包含重复的关键词。
只返回有 2 个或更多关键词的组。

返回格式示例：
\`\`\`json
[
  ["computer for kids", "kids computer", "computer kids"],
  ["laptop cheap", "cheap laptop"]
]
\`\`\`

注意：只返回 JSON，不要包含其他解释文字。`

  try {
    const response = await anthropicClient.generateText(
      prompt,
      '你是一个专业的关键词去重助手，专注于识别字面变体而非语义相似性。',
      4096, // Max output tokens
    )

    // Parse AI response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const batchGroups = JSON.parse(jsonStr) as string[][]

      // Validate and filter groups
      const validGroups = batchGroups.filter(
        (group) =>
          Array.isArray(group) &&
          group.length >= 2 &&
          group.every((item) => typeof item === 'string'),
      )

      allDuplicateGroups.push(...validGroups)
    } else {
      console.warn('Failed to parse AI response')
    }
  } catch (error) {
    console.error('Error processing AI request:', error)
  }

  return allDuplicateGroups
}

/**
 * @deprecated Use findDuplicatesByWordSet or findDuplicateTopicsWithAI instead
 */
export async function findDuplicateTopics(
  anthropicClient: AnthropicClient,
  names: string[],
): Promise<string[][]> {
  // Keep for backward compatibility - delegates to new AI function
  return findDuplicateTopicsWithAI(anthropicClient, names)
}
