'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from '@payloadcms/ui'

interface NodeData {
  id: string
  node_id: string
  display_name: string
  context_free_name: string
  parent?: string
  topics_count?: number
  children?: NodeData[]
  hasChildren?: boolean // Indicator that children exist but not loaded yet
  slug?: string
}

interface TreeNodeProps {
  node: NodeData
  level: number
  onRefresh: () => void
  onExpand: (nodeId: string, nodeNodeId: string, force?: boolean) => Promise<void>
  isLoadingChildren?: boolean
  onDelete?: () => void
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onRefresh,
  onExpand,
  isLoadingChildren = false,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const hasChildren = (node.children && node.children.length > 0) || node.hasChildren
  const indent = level * 24

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个节点吗？')) return

    try {
      const res = await fetch(`/api/nodes/${node.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errJson = await res.json()
        toast.error(errJson.errors?.[0]?.message || errJson.error || '删除失败')
      } else {
        toast.success('节点删除成功')
        if (onDelete) onDelete()
      }
    } catch (err) {
      console.error(err)
      toast.error('删除节点时发生错误')
    }
  }

  const handleToggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // If we have children loaded but collapsed, just expand
    // If we don't have children loaded (but hasChildren is true), load them

    if (expanded) {
      setExpanded(false)
    } else {
      setExpanded(true)
      if (hasChildren) {
        await onExpand(node.id, node.node_id)
      }
    }
  }

  const handleAddChildren = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/nodes/${node.id}/add-children`, {
        method: 'POST',
      })

      if (!res.ok) {
        const errJson = await res.json()
        toast.error(`Error: ${errJson.error || 'Unknown error'}`)
      } else {
        const json = await res.json()
        const count = json.count
        const updated = json.updated
        const existing = json.existing
        toast.success(
          `Success: Added ${count} node${count !== 1 ? 's' : ''}, Updated ${updated} node${updated !== 1 ? 's' : ''}, Existing ${existing} node${existing !== 1 ? 's' : ''}`,
        )
        // Instead of full refresh, force reload current node's children
        await onExpand(node.id, node.node_id, true)
        if (!expanded) setExpanded(true)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to add child nodes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          paddingLeft: `${12 + indent}px`,
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: hovered ? '#f9fafb' : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Expand/Collapse Icon */}
        <div
          style={{
            width: '20px',
            marginRight: '8px',
            cursor: hasChildren ? 'pointer' : 'default',
            userSelect: 'none',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
          onClick={handleToggleExpand}
        >
          {hasChildren ? (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {isLoadingChildren ? '⏳' : expanded ? '▼' : '▶'}
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: '#d1d5db' }}>•</span>
          )}
        </div>

        {/* Node Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ marginRight: '12px' }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                marginBottom: '2px',
              }}
            >
              {node.display_name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <span>{node.context_free_name}</span>
            </div>
          </div>

          {/* Topics Badge */}
          {node.topics_count !== undefined && node.topics_count > 0 && (
            <span
              style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                alignSelf: 'flex-start',
                marginTop: '1px',
              }}
            >
              {node.topics_count}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: hovered ? 'auto' : 'none',
            alignItems: 'center',
          }}
        >
          {/* Add Children Button */}
          <button
            type="button"
            onClick={handleAddChildren}
            disabled={loading}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: loading ? '#e5e7eb' : 'transparent',
              border: '1px solid #10b981',
              borderRadius: '4px',
              color: '#10b981',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#10b981'
                e.currentTarget.style.color = 'white'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#10b981'
              }
            }}
          >
            {loading ? 'Adding...' : '+ Children'}
          </button>

          {/* Preview Button */}
          {node.slug && (
            <a
              href={`/n/${node.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'transparent',
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                color: '#3b82f6',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#3b82f6'
              }}
            >
              Preview ↗
            </a>
          )}

          {/* Delete Button */}
          {!hasChildren && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: 'transparent',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                color: '#ef4444',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ef4444'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#ef4444'
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Child Nodes */}
      {expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onRefresh={onRefresh}
              onExpand={onExpand}
              isLoadingChildren={isLoadingChildren}
              onDelete={() => onExpand(node.id, node.node_id, true)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const NodeTreeView: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tree state
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set())
  const [loadedNodes, setLoadedNodes] = useState<Set<string>>(new Set())

  // Check if a node has children
  const checkHasChildren = async (nodeId: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/nodes?where[parent][equals]=${encodeURIComponent(nodeId)}&limit=1&depth=0`,
      )
      if (!res.ok) return false
      const data = await res.json()
      return data.docs.length > 0
    } catch (err) {
      console.error(`Error checking children for ${nodeId}:`, err)
      return false
    }
  }

  // Load children for a specific parent node_id
  const loadChildrenForParent = async (parentNodeId: string): Promise<NodeData[]> => {
    const res = await fetch(
      `/api/nodes?where[parent][equals]=${encodeURIComponent(parentNodeId)}&limit=1000&depth=0`,
    )
    if (!res.ok) {
      throw new Error('Failed to fetch child nodes')
    }
    const data = await res.json()
    return data.docs
  }

  // Initial load: fetch root nodes and their direct children (1 level deep)
  const fetchInitialNodes = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load root nodes (no parent)
      const rootRes = await fetch('/api/nodes?where[parent][exists]=false&limit=1000&depth=0')
      if (!rootRes.ok) {
        throw new Error('Failed to fetch root nodes')
      }
      const rootData = await rootRes.json()
      const rootNodes: NodeData[] = rootData.docs

      // For each root node, load its direct children and check if they have children
      const nodesWithChildren = await Promise.all(
        rootNodes.map(async (rootNode) => {
          try {
            const children = await loadChildrenForParent(rootNode.node_id)
            // Mark that we've loaded children for this root node
            setLoadedNodes((prev) => new Set([...prev, rootNode.node_id]))

            // Check if each child has children
            const childrenWithStatus = await Promise.all(
              children.map(async (child) => {
                const hasChildren = await checkHasChildren(child.node_id)
                return {
                  ...child,
                  children: [],
                  hasChildren,
                }
              }),
            )

            return {
              ...rootNode,
              children: childrenWithStatus,
            }
          } catch (err) {
            console.error(`Error loading children for ${rootNode.node_id}:`, err)
            return { ...rootNode, children: [] }
          }
        }),
      )

      setNodes(nodesWithChildren)
    } catch (err) {
      console.error('Error fetching initial nodes:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Helper: find a node by ID in the tree
  const findNodeById = (nodes: NodeData[], id: string): NodeData | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Helper: update a node's children in the tree
  const updateNodeInTree = (
    nodes: NodeData[],
    nodeId: string,
    newChildren: NodeData[],
  ): NodeData[] => {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, children: newChildren }
      } else if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, newChildren),
        }
      }
      return node
    })
  }

  // Load next level children when a node is expanded
  const loadNextLevel = async (nodeId: string, nodeNodeId: string, force: boolean = false) => {
    // Skip if already loaded (and not forcing) or currently loading
    if ((loadedNodes.has(nodeNodeId) && !force) || loadingNodes.has(nodeNodeId)) {
      return
    }

    setLoadingNodes((prev) => new Set([...prev, nodeNodeId]))

    try {
      // Find the node being expanded
      const nodeToExpand = findNodeById(nodes, nodeId)
      if (nodeToExpand) {
        // Load this node's direct children
        const children = await loadChildrenForParent(nodeToExpand.node_id)

        // Check if each child has children
        const childrenWithStatus = await Promise.all(
          children.map(async (child) => {
            const hasChildren = await checkHasChildren(child.node_id)
            return {
              ...child,
              children: [],
              hasChildren,
              // If we are refreshing, we might lose sub-children state if the tree structure is dynamic.
              // However, since we are only updating "children" of the current node,
              // recursive children of *this* node's children are not yet loaded anyway unless explicitly loaded.
              // But if we had already expanded children's children, they would be lost here because we replace 'children'.
              // This is a trade-off. For "Add Children" usage, we usually add new direct children.
              // Preserving deeper nested state would require a smarter merge.
              // Given the requirement is just "reload current node", replacing children is acceptable behavior.
            }
          }),
        )

        // Update the tree with the loaded children
        // Update the tree with the loaded children
        setNodes((prevNodes) => updateNodeInTree(prevNodes, nodeId, childrenWithStatus))

        // Update loadedNodes
        setLoadedNodes((prev) => {
          const next = new Set(prev)
          // Add current node as loaded
          next.add(nodeNodeId)
          // Invalidate loaded state for all children we just refreshed,
          // because we effectively reset their children to [] in the tree state.
          childrenWithStatus.forEach((child) => {
            next.delete(child.node_id)
          })
          return next
        })
      } else {
        // If node not found in tree (rare), still mark as loaded to stop spinning?
        setLoadedNodes((prev) => new Set([...prev, nodeNodeId]))
      }
    } catch (err) {
      console.error(`Error loading next level for ${nodeNodeId}:`, err)
    } finally {
      setLoadingNodes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(nodeNodeId)
        return newSet
      })
    }
  }

  // Refresh entire tree
  const refreshTree = () => {
    setLoadedNodes(new Set())
    setLoadingNodes(new Set())
    fetchInitialNodes()
  }

  useEffect(() => {
    fetchInitialNodes()
  }, [])

  if (loading)
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
  if (error)
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>
    )

  if (nodes.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        No nodes available
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Node Tree
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            {nodes.length} root node{nodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/collections/nodes/create"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            backgroundColor: '#111827',
            borderRadius: '4px',
            textDecoration: 'none',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#111827'
          }}
        >
          Create New
        </Link>
      </div>
      <div>
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            onRefresh={refreshTree}
            onExpand={loadNextLevel}
            isLoadingChildren={loadingNodes.has(node.node_id)}
            onDelete={refreshTree}
          />
        ))}
      </div>
    </div>
  )
}
