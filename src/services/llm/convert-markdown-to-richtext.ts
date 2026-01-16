import { SanitizedConfig } from 'payload'
import {
  convertMarkdownToLexical,
  editorConfigFactory,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'

let cachedEditorConfig: Awaited<ReturnType<typeof editorConfigFactory.fromFeatures>> | null = null

/**
 * 获取或创建编辑器配置（使用缓存）
 * 注意：需要与 payload.config.ts 中的 lexicalEditor features 保持一致
 */
async function getEditorConfig(config: SanitizedConfig) {
  if (cachedEditorConfig) {
    return cachedEditorConfig
  }
  // 使用 fromFeatures 并添加 TableFeature 以支持表格转换
  cachedEditorConfig = await editorConfigFactory.fromFeatures({
    config,
    features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()],
  })
  return cachedEditorConfig
}

/**
 * 将 Markdown 文本转换为 Lexical RichText 格式
 * @param markdown Markdown 格式的文本
 * @param config Payload 配置对象
 * @returns Lexical EditorState
 */
export async function convertMarkdownToRichText(markdown: string, config: SanitizedConfig) {
  const editorConfig = await getEditorConfig(config)

  // 1. 统一换行符
  const normalizedMarkdown = markdown.replace(/\r\n/g, '\n')

  // 2. 预处理 Markdown：使用占位符保护段落内换行
  // 核心逻辑：只有当前行和下一行都是“普通属性”行时，才将换行转为 [[BR]]
  // 普通属性行定义：不以 #, >, -, *, +, 1. 等块级标记开始，且非空。
  const lines = normalizedMarkdown.split('\n')
  const processedLines = lines.map((line, i) => {
    const nextLine = lines[i + 1]
    if (nextLine === undefined) return line // 最后一行保持原样

    const lineTrimmed = line.trim()
    const nextLineTrimmed = nextLine.trim()

    // 定义块级标记的正则 (注意：列表标记 - * + 必须跟随空格才是列表)
    const blockMarkerRegex = /^[ \t]*(?:[\#\>\`]|[\-\*\+](?:\s)|(?:\d+\.\s))/
    const isHeader = /^[ \t]*\#/.test(line)

    const isCurrentBlock = blockMarkerRegex.test(line)
    const isNextBlock = nextLineTrimmed === '' || blockMarkerRegex.test(nextLine)

    // 1. 如果当前是标题行，为了确保后面起新段落 (p)，强制添加双换行
    if (isHeader && nextLineTrimmed !== '') {
      return line + '\n'
    }

    // 2. 如果当前行和下一行都是普通文本 (p)，则使用占位符实现紧凑换行 (br)
    if (!isCurrentBlock && lineTrimmed !== '' && !isNextBlock) {
      return line + ' [[BR]] '
    }
    return line
  })

  const processedMarkdown = processedLines.join('\n')

  const lexicalJson = await convertMarkdownToLexical({
    editorConfig,
    markdown: processedMarkdown,
  })

  // 3. 后处理：递归遍历 Lexical JSON，将占位符替换为 linebreak 节点
  if (lexicalJson && typeof lexicalJson === 'object') {
    processLexicalNodes(lexicalJson)
  }

  return lexicalJson
}

/**
 * 递归处理 Lexical 节点，将文本中的 [[BR]] 占位符转换为真实的 linebreak 节点
 */
function processLexicalNodes(node: any) {
  if (!node || typeof node !== 'object') return

  // 如果是数组，遍历处理每个元素
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      processLexicalNodes(node[i])
    }
    return
  }

  // 如果是节点对象，检查 children
  if (Array.isArray(node.children)) {
    const newChildren: any[] = []

    for (const child of node.children) {
      if (
        child.type === 'text' &&
        typeof child.text === 'string' &&
        child.text.includes('[[BR]]')
      ) {
        const parts = child.text.split('[[BR]]')
        parts.forEach((part: string, index: number) => {
          if (part.length > 0) {
            newChildren.push({
              ...child,
              text: part,
            })
          }
          if (index < parts.length - 1) {
            newChildren.push({
              type: 'linebreak',
              version: 1,
            })
          }
        })
      } else {
        // 递归处理子节点
        processLexicalNodes(child)
        newChildren.push(child)
      }
    }
    node.children = newChildren
  } else {
    // 递归处理对象的所有属性（用于支持嵌套结构）
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key) && typeof node[key] === 'object') {
        processLexicalNodes(node[key])
      }
    }
  }
}

// Lexical RichText 节点类型定义
// 添加索引签名以兼容 Payload 生成的类型
interface LexicalTextNode {
  [key: string]: unknown
  type: 'text'
  detail: number
  format: number
  mode: 'normal'
  style: string
  text: string
  version: number
}

interface LexicalParagraphNode {
  [key: string]: unknown
  type: 'paragraph'
  format: ''
  indent: number
  version: number
  direction: null
  textFormat: number
  children: LexicalNode[]
}

interface LexicalRootNode {
  [key: string]: unknown
  type: 'root'
  format: ''
  indent: number
  version: number
  direction: null
  children: LexicalParagraphNode[]
}

interface LexicalEditorState {
  [key: string]: unknown
  root: LexicalRootNode
}

/**
 * 将纯文本转换为 Lexical RichText 格式（按段落分割，并处理内部换行）
 * @param text 纯文本
 * @returns Lexical EditorState
 */
export function convertTextToRichText(text: string): LexicalEditorState {
  // 按双换行符分割为段落，过滤空段落
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: paragraphs.map((paragraph) => {
        // 在段落内部按单换行符分割
        const lines = paragraph.split('\n')
        const children: LexicalNode[] = []

        lines.forEach((line, index) => {
          // 添加文本节点
          children.push({
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal' as const,
            style: '',
            text: line,
            version: 1,
          })

          // 如果不是最后一行，添加换行符节点
          if (index < lines.length - 1) {
            children.push({
              type: 'linebreak',
              version: 1,
            })
          }
        })

        return {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: null,
          textFormat: 0,
          children,
        }
      }),
    },
  }
}

// 通用的 Lexical 节点类型，用于支持 linebreak
type LexicalNode = LexicalTextNode | { type: 'linebreak'; version: number }
