# 主题去重服务

本目录包含用于主题去重的两种实现方式。

## 文件说明

### 1. `dedupe-topics.ts` - 基于代码的去重实现

**特点：**

- ✅ 确定性算法：相同输入始终产生相同结果
- ✅ 快速高效：无需调用外部 API
- ✅ 无需费用：不消耗 AI token
- ✅ 可预测：基于明确的规则和字典

**工作原理：**

- 使用 `CANONICAL_WORD_MAP` 进行词汇规范化
- 使用 `STOP_WORDS` 过滤无意义词汇
- 使用 `CONTEXT_DEPENDENT_STOP_WORDS` 进行上下文感知去重
- 使用双键策略：词袋（Bag-of-Words）+ 无空格键（Spaceless）
- 通过图连通性分析合并重复组

**主要函数：**

```typescript
// 主去重函数（使用代码实现）
deduplicateTopics(payload: Payload): Promise<{
  totalTopics: number
  duplicateGroups: DuplicateTopicItem[][]
  totalDuplicates: number
}>

// 查找重复项（核心算法）
findDuplicatesByWordSet(names: string[]): string[][]
```

### 2. `ai-dedupe-topics.ts` - 基于 AI 的去重实现

**特点：**

- 🤖 AI 驱动：使用 Anthropic Claude 进行语义分析
- 🎯 灵活智能：可以识别复杂的语义变体
- 💰 有成本：需要消耗 AI API token
- 🐌 较慢：需要等待 AI 响应

**工作原理：**

- 分批处理主题（默认每批 500 个）
- 使用精心设计的 prompt 引导 AI 识别字面变体
- AI 分析并返回 JSON 格式的重复组
- 自动处理错误并继续处理后续批次

**主要函数：**

```typescript
// AI 版本的主去重函数
deduplicateTopicsWithAI(
  payload: Payload,
  anthropicClient: AnthropicClient,
  batchSize?: number
): Promise<{
  totalTopics: number
  duplicateGroups: DuplicateTopicItem[][]
  totalDuplicates: number
}>

// AI 识别重复项
findDuplicateTopicsWithAI(
  anthropicClient: AnthropicClient,
  names: string[],
  batchSize?: number
): Promise<string[][]>
```

## 使用建议

### 推荐使用代码版本 (`dedupe-topics.ts`)

适用场景：

- ✅ 常规去重任务
- ✅ 需要快速响应
- ✅ 预算有限
- ✅ 需要可预测的结果

### 考虑使用 AI 版本 (`ai-dedupe-topics.ts`)

适用场景：

- 🔍 需要更智能的语义理解
- 🧪 测试和验证代码版本的准确性
- 📊 对比两种方法的差异
- 🎛️ 需要更灵活的规则（可通过调整 prompt）

## 使用示例

### 代码版本

```typescript
import { deduplicateTopics, applyDuplicateRedirects } from '@/services/topics/dedupe-topics'

// 查找重复主题
const result = await deduplicateTopics(payload)

console.log(`总主题数: ${result.totalTopics}`)
console.log(`重复组数: ${result.duplicateGroups.length}`)
console.log(`重复项数: ${result.totalDuplicates}`)

// 应用重定向
if (result.duplicateGroups.length > 0) {
  const applyResult = await applyDuplicateRedirects(payload, result.duplicateGroups)
  console.log(`已更新 ${applyResult.totalUpdated} 个主题`)
}
```

### AI 版本

```typescript
import {
  deduplicateTopicsWithAI,
  applyDuplicateRedirects,
} from '@/services/topics/ai-dedupe-topics'
import { AnthropicClient } from '@/services/AnthropicClient'

const anthropicClient = new AnthropicClient()

// 使用 AI 查找重复主题
const result = await deduplicateTopicsWithAI(payload, anthropicClient, 500)

console.log(`总主题数: ${result.totalTopics}`)
console.log(`重复组数: ${result.duplicateGroups.length}`)
console.log(`重复项数: ${result.totalDuplicates}`)

// 应用重定向（与代码版本相同）
if (result.duplicateGroups.length > 0) {
  const applyResult = await applyDuplicateRedirects(payload, result.duplicateGroups)
  console.log(`已更新 ${applyResult.totalUpdated} 个主题`)
}
```

## 性能对比

| 特性     | 代码版本        | AI 版本            |
| -------- | --------------- | ------------------ |
| 速度     | 🚀 极快（秒级） | 🐌 较慢（分钟级）  |
| 成本     | 💚 免费         | 💰 有成本          |
| 准确性   | 📊 基于规则     | 🎯 基于语义        |
| 可预测性 | ✅ 高           | ⚠️ 中等            |
| 维护成本 | 🔧 需要维护字典 | 📝 需要优化 prompt |

## 配置文件

两个版本都使用 `topic-dedupe-dictionaries.ts` 中的字典：

- `CANONICAL_WORD_MAP`: 词汇规范化映射（同义词、不规则复数等）
- `STOP_WORDS`: 停用词集合
- `CONTEXT_DEPENDENT_STOP_WORDS`: 上下文相关的停用词
- `PLURAL_PATTERNS`: 复数规则模式

## 常见问题

**Q: 两个版本可以同时使用吗？**
A: 可以。建议先用代码版本快速处理，然后用 AI 版本验证结果。

**Q: AI 版本会替代代码版本吗？**
A: 不会。代码版本更快、更稳定、无成本，适合生产环境。AI 版本适合辅助和验证。

**Q: 如何提高代码版本的准确性？**
A: 持续更新 `topic-dedupe-dictionaries.ts` 中的字典，添加新的同义词和规则。

**Q: AI 版本的 prompt 可以修改吗？**
A: 可以。在 `findDuplicateTopicsWithAI` 函数中修改 prompt 来调整 AI 的行为。
