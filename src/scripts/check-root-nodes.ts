import config from '@payload-config'
import { getPayload } from 'payload'

const checkNodes = async () => {
  const payload = await getPayload({ config })

  const totalNodes = await payload.count({
    collection: 'nodes',
  })

  const rootNodes = await payload.find({
    collection: 'nodes',
    where: {
      is_root: {
        equals: true,
      },
    },
  })

  console.log(`Total Nodes: ${totalNodes.totalDocs}`)
  console.log(`Root Nodes: ${rootNodes.totalDocs}`)

  if (rootNodes.docs.length > 0) {
    console.log('Sample Root Node:', rootNodes.docs[0])
  }

  process.exit(0)
}

checkNodes()
