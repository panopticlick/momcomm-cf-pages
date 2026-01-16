import 'dotenv/config'
import { CANONICAL_WORD_MAP } from '../../services/topics/topic-dedupe-dictionaries'

import { CANDIDATE_COMPOUND_MAPPINGS, CANDIDATE_IRREGULAR_PLURALS } from './candidates'

const API_BASE = 'https://fastapi.amzapi.io/api/v2/keywords/suggestions'

async function getKeywordsSuggestions(query: string): Promise<string[]> {
  const apiKey = process.env.AMZ_API_KEY
  if (!apiKey) {
    throw new Error('AMZ_API_KEY is not set in environment variable')
  }

  const url = `${API_BASE}?query=${encodeURIComponent(query)}&limit=100`
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      console.warn(`Failed to fetch suggestions for "${query}": ${response.statusText}`)
      return []
    }
    const data = (await response.json()) as string[]
    return data
  } catch (error) {
    console.error(`Error fetching suggestions for "${query}":`, error)
    return []
  }
}

async function verifyWord(word: string): Promise<{ valid: boolean; suggestions: string[] }> {
  // Small delay to avoid hammering the API if many candidates
  await new Promise((resolve) => setTimeout(resolve, 200))

  const suggestions = await getKeywordsSuggestions(word)
  // Check if the word appears as a whole word in any of the suggestions
  const regex = new RegExp(`\\b${word}\\b`, 'i')
  const valid = suggestions.some((s) => regex.test(s))
  return { valid, suggestions }
}

async function processCandidates(
  type: 'COMPOUND' | 'IRREGULAR',
  candidates: Record<string, string>,
  existing: Record<string, string> | Set<string>,
) {
  const candidateKeys = Object.keys(candidates)
  if (candidateKeys.length === 0) {
    console.log(`No candidates for ${type}.`)
    return
  }

  console.log(`\nProcessing ${candidateKeys.length} items for ${type}...`)

  const toVerify: string[] = []
  const skipped: string[] = []

  // Check for duplicates
  for (const key of candidateKeys) {
    let exists = false
    if (existing instanceof Set) {
      exists = existing.has(key)
    } else {
      exists = Object.prototype.hasOwnProperty.call(existing, key)
    }

    if (exists) {
      skipped.push(key)
    } else {
      toVerify.push(key)
    }
  }

  if (skipped.length > 0) {
    console.log(`⚠️ Skipped ${skipped.length} words already in dictionary: ${skipped.join(', ')}`)
  }

  if (toVerify.length === 0) {
    console.log(`No new words to verify for ${type}.`)
    return
  }

  console.log(`Verifying ${toVerify.length} new words...`)

  const verified: string[] = []
  const failed: string[] = []

  for (const word of toVerify) {
    process.stdout.write(`Checking "${word}"... `)
    const { valid } = await verifyWord(word)
    if (valid) {
      console.log('✅ OK')
      verified.push(word)
    } else {
      console.log('❌ Failed (no strict match in suggestions)')
      failed.push(word)
    }
  }

  if (verified.length > 0) {
    console.log(`\n=== ✅ Valid verified ${type} candidates ===`)
    console.log('Copy and paste these into your dictionary:')
    console.log('{')
    verified.forEach((key) => {
      const val = candidates[key]
      console.log(`  ${key}: '${val}',`)
    })
    console.log('}')
  }

  if (failed.length > 0) {
    console.log(`\n=== ❌ Failed ${type} candidates ===`)
    failed.forEach((key) => console.log(`  - ${key}`))
  }
}

async function runVerification() {
  console.log('Starting verification workflow...')

  await processCandidates('COMPOUND', CANDIDATE_COMPOUND_MAPPINGS, CANONICAL_WORD_MAP)
  await processCandidates('IRREGULAR', CANDIDATE_IRREGULAR_PLURALS, CANONICAL_WORD_MAP)

  console.log('\nDone.')
}

runVerification()
