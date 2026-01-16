import { getPayloadClient } from '@/lib/payload'

export interface MenuNode {
  id: string | number
  display_name: string
  slug: string
  children?: MenuNode[]
}

export async function getMenuNodes(): Promise<MenuNode[]> {
  const payload = await getPayloadClient()

  // Fetch ALL nodes to build the tree in memory
  // This is safe because categories are usually limited (< 1000)
  const allNodesQuery = await payload.find({
    collection: 'nodes',
    pagination: false,
    limit: 1000,
    sort: 'display_name',
  })

  const allNodes = allNodesQuery.docs
  const nodeMap = new Map<string, MenuNode>()
  const validNodeIds = new Set<string>()

  // 1. Create MenuNode objects and ID set
  allNodes.forEach((node) => {
    if (node.node_id) {
      validNodeIds.add(node.node_id)
      nodeMap.set(node.node_id, {
        id: node.id,
        display_name: node.display_name || 'Untitled',
        slug: node.slug,
        children: [],
      })
    }
  })

  const roots: MenuNode[] = []

  // 2. Build Tree
  allNodes.forEach((node) => {
    if (!node.node_id) return
    const menuNode = nodeMap.get(node.node_id)!

    // Check if it's a root
    // It is a root if:
    // - is_root is true
    // - OR parent is null/empty
    // - OR parent ID does not exist in our validNodeIds set (Orphaned root)
    const parentId = node.parent
    const isExplicitRoot = node.is_root === true
    const hasParent = parentId && validNodeIds.has(parentId)

    if (isExplicitRoot || !hasParent) {
      roots.push(menuNode)
    } else {
      // It has a valid parent, add to parent's children
      const parentNode = nodeMap.get(parentId!)
      if (parentNode) {
        parentNode.children?.push(menuNode)
      }
    }
  })

  return roots
}
