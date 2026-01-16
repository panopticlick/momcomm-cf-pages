import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getMenuNodes } from '@/utilities/get-menu-nodes'

async function debug() {
  console.log('--- Starting Debug ---')
  try {
    const nodes = await getMenuNodes()
    console.log('Menu Nodes Found:', JSON.stringify(nodes, null, 2))

    const payload = await getPayload({ config })
    const count = await payload.count({
      collection: 'nodes',
      where: { is_root: { equals: true } },
    })
    console.log('Total is_root nodes in DB:', count.totalDocs)

    const total = await payload.count({
      collection: 'nodes',
    })
    console.log('Total nodes in DB:', total.totalDocs)

    const allNodes = await payload.find({
      collection: 'nodes',
      limit: 10,
    })
    console.log('Sample Nodes:', JSON.stringify(allNodes.docs, null, 2))
  } catch (e) {
    console.error('Error:', e)
  }
  process.exit(0)
}

debug()
