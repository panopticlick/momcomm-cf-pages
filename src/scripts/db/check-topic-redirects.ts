import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import {
  getTopicsForDeduplication,
  findDuplicatesByWordSet,
  mapDuplicateGroupsToTopics,
} from '../../services/topics/dedupe-topics'

async function checkRedirects() {
  const payload = await getPayload({ config })

  console.log('Fetching topics...')
  const topics = await payload.find({
    collection: 'topics',
    limit: 1000,
    pagination: false,
    sort: 'name',
  })

  console.log(`Total topics: ${topics.docs.length}`)

  const redirectedTopics = topics.docs.filter((t) => t.redirect === true)
  const activeTopics = topics.docs.filter((t) => t.active === true)
  const topicMap = new Map(topics.docs.map((t) => [t.id, t]))

  console.log(`\n=== 🔀 Redirected Topics (${redirectedTopics.length}) ===`)
  for (const t of redirectedTopics) {
    console.log(`[${t.id}] "${t.name}" -> ${t.redirect_to} (Active: ${t.active})`)
  }

  // Check for remaining duplicates that SHOULD have been merged
  // We re-run the dedupe logic on the CURRENT state (excluding already redirected ones essentially, or just checking consistency)
  // Let's look at non-redirected topics to see if any duplicates remain.
  const nonRedirected = topics.docs.filter((t) => !t.redirect)
  const nonRedirectedForDedupe = nonRedirected.map((doc) => ({
    id: doc.id,
    name: doc.name,
    conversion_share_sum: doc.conversion_share_sum ?? 0,
    active: doc.active ?? false,
    slug: doc.slug,
  }))

  const duplicateGroupsName = findDuplicatesByWordSet(nonRedirectedForDedupe.map((t) => t.name))

  if (duplicateGroupsName.length > 0) {
    console.log(`\n=== ⚠️ Potential REMAINING Duplicates (Not Redirected) ===`)
    const groups = mapDuplicateGroupsToTopics(nonRedirectedForDedupe, duplicateGroupsName)
    for (const group of groups) {
      console.log('--- Group ---')
      for (const item of group) {
        console.log(`  [${item.id}] "${item.name}" (Slug: ${item.slug}, Active: ${item.active})`)
      }
    }
  } else {
    console.log(`\n✅ No remaining duplicates found among non-redirected topics.`)
  }

  process.exit(0)
}

checkRedirects()
