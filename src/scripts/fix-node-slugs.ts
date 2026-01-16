import dotenv from 'dotenv'

// Load .env from project root
dotenv.config()

import { convertToSlug } from '@/utilities/convert-to-slug'

type NodeDoc = {
  id: string
  node_id: string
  display_name: string
  parent?: string | null
  slug?: string
}

async function fixNodeSlugs() {
  console.log('Starting Node slug fix...')
  console.log('Environment check - PAYLOAD_SECRET present:', !!process.env.PAYLOAD_SECRET)
  console.log('Environment check - DATABASE_URI present:', !!process.env.DATABASE_URI)

  // Dynamic import to ensure env vars are loaded
  const { getPayloadClient } = await import('@/lib/payload')

  const payload = await getPayloadClient()

  let page = 1
  let hasMore = true
  const allNodes: NodeDoc[] = []

  // 1. Fetch all nodes
  while (hasMore) {
    const result = await payload.find({
      collection: 'nodes',
      limit: 1000,
      page,
      depth: 0,
    })

    allNodes.push(...(result.docs as unknown as NodeDoc[]))
    console.log(`Fetched ${allNodes.length} nodes...`)

    if (result.hasNextPage) {
      page++
    } else {
      hasMore = false
    }
  }

  // 2. Build Hierarchy
  const nodeMap = new Map<string, NodeDoc>()
  const childrenMap = new Map<string, NodeDoc[]>()
  const roots: NodeDoc[] = []

  // Initialize maps
  for (const node of allNodes) {
    nodeMap.set(node.node_id, node)
  }

  // Populate children and roots
  for (const node of allNodes) {
    if (node.parent && nodeMap.has(node.parent)) {
      if (!childrenMap.has(node.parent)) {
        childrenMap.set(node.parent, [])
      }
      childrenMap.get(node.parent)!.push(node)
    } else {
      roots.push(node)
    }
  }

  console.log(`Hierarchy built: ${roots.length} root nodes.`)

  // 3. Traverse and Fix Slugs
  let updatedCount = 0
  let processedCount = 0
  const mistakes: Array<{ name: string; old: string; new: string }> = []

  const processNode = async (node: NodeDoc, parentSlug: string | null) => {
    processedCount++
    if (processedCount % 100 === 0) process.stdout.write('.')

    const localSlug = convertToSlug(node.display_name)
    const expectedSlug = parentSlug ? `${parentSlug}/${localSlug}` : localSlug

    if (node.slug !== expectedSlug) {
      // console.log(`Fixing slug for ${node.display_name}: ${node.slug} -> ${expectedSlug}`)

      try {
        await payload.update({
          collection: 'nodes',
          id: node.id,
          data: {
            slug: expectedSlug,
          },
        })
        updatedCount++
        mistakes.push({
          name: node.display_name,
          old: node.slug || '',
          new: expectedSlug,
        })
      } catch (e) {
        console.error(`Failed to update node ${node.node_id}:`, e)
      }
    }

    const children = childrenMap.get(node.node_id) || []
    for (const child of children) {
      await processNode(child, expectedSlug)
    }
  }

  for (const root of roots) {
    await processNode(root, null)
  }

  console.log('\n\n--- Report ---')
  console.log(`Total Processed: ${processedCount}`)
  console.log(`Updated: ${updatedCount}`)
  if (mistakes.length > 0) {
    console.log('Sample fixes:')
    mistakes.slice(0, 5).forEach((m) => {
      console.log(`  ${m.name}: ${m.old} -> ${m.new}`)
    })
  }

  process.exit(0)
}

fixNodeSlugs().catch((err) => {
  console.error(err)
  process.exit(1)
})
