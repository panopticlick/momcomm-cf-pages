import type { Post } from '@/payload-types'

export type MomcommSilo = 'gear' | 'stack' | 'ventures' | 'library'
export type MomcommContentType =
  | 'article'
  | 'directory'
  | 'workflow'
  | 'blueprint'
  | 'build-in-public'
  | 'download'
  | 'update'

const CONTENT_TYPE_TO_SILO: Partial<Record<MomcommContentType, MomcommSilo>> = {
  directory: 'stack',
  workflow: 'stack',
  blueprint: 'ventures',
  'build-in-public': 'ventures',
  download: 'library',
}

const TAG_TO_SILO: Record<string, MomcommSilo> = {
  stack: 'stack',
  workflow: 'stack',
  directory: 'stack',
  ventures: 'ventures',
  blueprint: 'ventures',
  'build-in-public': 'ventures',
  library: 'library',
  download: 'library',
}

const TAG_TO_CONTENT_TYPE: Record<string, MomcommContentType> = {
  article: 'article',
  directory: 'directory',
  workflow: 'workflow',
  blueprint: 'blueprint',
  'build-in-public': 'build-in-public',
  download: 'download',
  update: 'update',
}

const SILO_PATHS: Record<'stack' | 'ventures' | 'library', string> = {
  stack: '/stack',
  ventures: '/ventures',
  library: '/library',
}

const normalizeToken = (value: string) => value.trim().toLowerCase()

const pushTagTokens = (tokens: string[], raw: string) => {
  const normalized = normalizeToken(raw)
  if (!normalized) return
  tokens.push(normalized)
  tokens.push(normalized.replace(/\s+/g, '-'))
}

export function normalizeTagTokens(tags?: Array<unknown> | null): string[] {
  if (!tags || !Array.isArray(tags)) return []

  const tokens: string[] = []

  for (const tag of tags) {
    if (!tag) continue

    if (typeof tag === 'string') {
      pushTagTokens(tokens, tag)
      continue
    }

    if (typeof tag === 'number') {
      continue
    }

    if (typeof tag === 'object') {
      if ('slug' in tag && typeof tag.slug === 'string') {
        pushTagTokens(tokens, tag.slug)
      }
      if ('name' in tag && typeof tag.name === 'string') {
        pushTagTokens(tokens, tag.name)
      }
    }
  }

  return Array.from(new Set(tokens))
}

export function resolvePostContentType(
  post: Pick<Post, 'content_type' | 'tags'>,
  tagTokens?: string[],
): MomcommContentType | null {
  if (post.content_type) {
    return post.content_type as MomcommContentType
  }

  const tokens = tagTokens && tagTokens.length > 0 ? tagTokens : normalizeTagTokens(post.tags)

  for (const token of tokens) {
    const mapped = TAG_TO_CONTENT_TYPE[token]
    if (mapped) return mapped
  }

  return null
}

export function resolvePostSilo(
  post: Pick<Post, 'silo' | 'content_type' | 'tags'>,
  tagTokens?: string[],
): MomcommSilo | null {
  if (post.silo) {
    return post.silo as MomcommSilo
  }

  const resolvedContentType = resolvePostContentType(
    { content_type: post.content_type, tags: post.tags },
    tagTokens,
  )

  if (resolvedContentType && CONTENT_TYPE_TO_SILO[resolvedContentType]) {
    return CONTENT_TYPE_TO_SILO[resolvedContentType] || null
  }

  const tokens = tagTokens && tagTokens.length > 0 ? tagTokens : normalizeTagTokens(post.tags)

  for (const token of tokens) {
    const mapped = TAG_TO_SILO[token]
    if (mapped) return mapped
  }

  return null
}

export function getPostSiloPath(silo: MomcommSilo | null | undefined, slug: string): string | null {
  if (!silo) return null
  if (!(silo in SILO_PATHS)) return null
  return `${SILO_PATHS[silo as keyof typeof SILO_PATHS]}/${slug}`
}
