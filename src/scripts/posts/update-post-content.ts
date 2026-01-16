import path from 'path'
import 'dotenv/config'
import config from '@payload-config'
import fs from 'fs/promises'
import { z } from 'zod'
import { convertMarkdownToRichText } from '@/services/llm/convert-markdown-to-richtext'
import {
  normalizeTagTokens,
  resolvePostContentType,
  resolvePostSilo,
} from '@/services/momcomm/post-routing'
import slugify from 'slugify'

// Schema now includes excerpt
const contentSchema = z.object({
  meta_title: z.string().min(1, 'Meta title is required'),
  meta_description: z.string().min(1, 'Meta description is required'),
  keywords: z.array(z.string()),
  tags: z.array(z.string()),
  excerpt: z.string().optional(),
  main_content: z.string().min(1, 'Main content is required'),
})

async function resolveTags(tagNames: string[], host: string, apiKey: string) {
  const headers = {
    Authorization: `users API-Key ${apiKey}`,
    'Content-Type': 'application/json',
  }
  const tagIds: string[] = []

  for (const rawName of tagNames) {
    // Format tag name: capitalize first letter of each word (Title Case) or just first letter?
    // User said "首字母大写" which usually means specific capitalization.
    // Simple implementation: Capitalize first letter of the string, or Capitalize Each Word.
    // Given "Baby Gear", it seems Capitalize Each Word is preferred.
    // We can use a regex replacer.
    const name = rawName.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    )

    try {
      // 1. Search for existing tag
      const searchParams = new URLSearchParams()
      searchParams.append('where[name][equals]', name)

      const searchUrl = `${host}/api/tags?${searchParams.toString()}`
      const searchRes = await fetch(searchUrl, { headers })

      if (!searchRes.ok) {
        console.warn(`Failed to search tag: ${name} (${searchRes.status})`)
        continue
      }

      const searchData = await searchRes.json()

      if (searchData.docs && searchData.docs.length > 0) {
        tagIds.push(searchData.docs[0].id)
      } else {
        // 2. Create new tag if not found
        const createRes = await fetch(`${host}/api/tags`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            slug: slugify(name, { lower: true, strict: true }),
          }),
        })

        if (createRes.ok) {
          const createData = await createRes.json()
          if (createData.doc && createData.doc.id) {
            tagIds.push(createData.doc.id)
          }
        } else {
          console.warn(`Failed to create tag: ${name} (${createRes.status})`)
          const errText = await createRes.text()
          console.warn('Error detail:', errText)
        }
      }
    } catch (err) {
      console.error(`Error resolving tag ${name}:`, err)
    }
  }
  return tagIds
}

const updatePostContent = async () => {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: tsx src/scripts/posts/update-post-content.ts <host> <apiKey> <post_id>')
    process.exit(1)
  }

  const [host, apiKey, postId, env = 'dev'] = args // Default env to 'dev'
  // Use tmp/{env}/post/<post_id>/ structure
  const inputFilePath = path.join(process.cwd(), 'tmp', env, 'post', postId, 'data.json')

  try {
    const fileContent = await fs.readFile(inputFilePath, 'utf-8')
    const json = JSON.parse(fileContent)
    const inputData = contentSchema.parse(json)

    const { meta_title, meta_description, keywords, tags, excerpt, main_content } = inputData

    // Use the decoupled service with config
    const resolvedConfig = await config
    const richText = await convertMarkdownToRichText(main_content || '', resolvedConfig)

    // Prepare payload
    // Note: keywords in Post collection is type 'text', so we join array from AI
    // tags is a relationship. If AI returns ID strings, this works. If names, it might fail if Payload expects IDs.
    // Given the context of "automation", we assume for now tags are handled or acceptable as is,
    // or we might need a separate lookup step if this fails in practice.
    const tagTokens = normalizeTagTokens(tags)
    const inferredContentType = resolvePostContentType({ content_type: null, tags: [] }, tagTokens)
    const inferredSilo = resolvePostSilo(
      { silo: null, content_type: inferredContentType, tags: [] },
      tagTokens,
    )

    const payload: Record<string, unknown> = {
      meta_title,
      meta_description,
      keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
      tags,
      excerpt: excerpt || '',
      content: richText,
      ai_status: 'content_completed',
    }

    if (tags && tags.length > 0) {
      payload.tags = await resolveTags(tags, host, apiKey)
    }

    if (inferredContentType) {
      payload.content_type = inferredContentType
    }

    if (inferredSilo) {
      payload.silo = inferredSilo
    }

    // Update the Post via API
    const response = await fetch(`${host}/api/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `users API-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error updating post: ${response.status} ${response.statusText}`, errorText)
      process.exit(1)
    }

    const updatedPost = await response.json()
    console.log(
      JSON.stringify({
        id: updatedPost.doc.id,
        title: updatedPost.doc.title.replace(/!/g, ''),
        slug: updatedPost.doc.slug,
        status: 'success',
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation failed for input JSON:')
      error.issues.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('Error converting/updating content:', error)
    }
    process.exit(1)
  }

  process.exit(0)
}

updatePostContent()
