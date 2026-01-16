'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { convertToSlug } from '@/utilities/convert-to-slug'

export async function importPosts(csvText: string) {
  const payload = await getPayload({ config: configPromise })
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '')

  if (lines.length < 2) {
    return { success: 0, error: 0, errors: ['CSV file is empty or missing headers'] }
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''))
  const titleIndex = headers.indexOf('title')
  const slugIndex = headers.indexOf('slug')

  if (titleIndex === -1) {
    return { success: 0, error: 0, errors: ['Missing "title" column in CSV'] }
  }

  let success = 0
  let errorCount = 0
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Split by comma, respecting quotes
    const columns = line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((c) => c.trim().replace(/^"|"$/g, ''))

    const title = columns[titleIndex]

    if (!title) {
      continue
    }

    let slug = slugIndex !== -1 ? columns[slugIndex] : ''
    if (!slug) {
      slug = convertToSlug(title)
    }

    try {
      await payload.create({
        collection: 'posts',
        data: {
          title,
          slug,
          status: 'draft',
        },
      })
      success++
    } catch (e: any) {
      errorCount++
      errors.push(`Row ${i + 1}: ${e.message}`)
    }
  }

  return { success, error: errorCount, errors }
}
