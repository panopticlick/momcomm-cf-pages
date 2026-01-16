import type { AbaSearchTerm } from '@/payload-types'

// 评分范围常量
const SCORE_MAX = 10.0
const SCORE_MIN = 6.0
const SCORE_RANGE = SCORE_MAX - SCORE_MIN // 4.0

/**
 * 批量计算产品评分（基于排名百分位）
 *
 * 算法说明：
 * - 假设列表已按 weighted_score 降序排序
 * - 第1名得 10.0 分，最后一名得 6.0 分
 * - 中间按排名线性分布
 * - 评分范围：6.0 ~ 10.0
 *
 * @param items 产品列表（已排序），每个产品包含 abaSearchTerms
 * @returns Map<asin, score>
 */
export function calculateBatchScores<T extends { asin: string; abaSearchTerms: AbaSearchTerm[] }>(
  items: T[],
): Map<string, number> {
  const scoreMap = new Map<string, number>()
  const count = items.length

  if (count === 0) return scoreMap

  // 只有一个或两个产品时都给满分
  if (count <= 2) {
    items.forEach((item, i) => {
      scoreMap.set(item.asin, SCORE_MAX - i * 0.5) // 10.0, 9.5
    })
    return scoreMap
  }

  // 按排名计算分数
  // 排名 0 (第1名) → 分数 10.0
  // 排名 count-1 (最后) → 分数 6.0
  for (let i = 0; i < count; i++) {
    // 排名百分位：0 到 1
    const rankPercentile = i / (count - 1)

    // 映射到 10.0 到 6.0（逆序，排名越靠前分数越高）
    const score = SCORE_MAX - rankPercentile * SCORE_RANGE

    // 保留一位小数
    scoreMap.set(items[i].asin, Math.round(score * 10) / 10)
  }

  return scoreMap
}

/**
 * 单个产品评分（当只有一个产品时使用）
 * 基于对数归一化处理 weighted_score
 */
export function calculateProductScore(abaTerms: AbaSearchTerm[]): number {
  if (abaTerms.length === 0) return 8.0 // 默认中等评分

  const term = abaTerms[0]
  const weightedScore = term.weighted_score || 0

  // 使用对数归一化处理大数值
  const logScore = Math.log1p(weightedScore)

  // 假设合理的对数上限
  const LOG_MAX = Math.log1p(10000) // ~9.2

  const normalized = Math.min(logScore / LOG_MAX, 1)

  // 映射到 6-10
  const score = SCORE_MIN + normalized * SCORE_RANGE

  return Math.round(score * 10) / 10
}

/**
 * 获取评分标签颜色
 * @param score 评分 6-10
 * @returns Tailwind CSS 类名
 */
export function getScoreColor(score: number): string {
  if (score >= 9.0) return 'bg-green-500 text-white'
  if (score >= 8.0) return 'bg-emerald-500 text-white'
  if (score >= 7.0) return 'bg-yellow-500 text-white'
  return 'bg-orange-500 text-white'
}

/**
 * 获取评分标签文字
 * @param score 评分 6-10
 */
export function getScoreLabel(score: number): string {
  if (score >= 9.0) return 'Excellent'
  if (score >= 8.0) return 'Great'
  if (score >= 7.0) return 'Good'
  return 'Fair'
}
