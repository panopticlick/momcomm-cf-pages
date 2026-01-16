'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

type Node = {
  id: string
  node_id: string
  display_name: string
  parent?: string
}

export const NodeSelector: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string[]>({ path })
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        // Fetch root nodes where parent does not exist
        const res = await fetch('/api/nodes?where[parent][exists]=false&limit=300&depth=0')
        if (!res.ok) throw new Error('Failed to fetch nodes')
        const data = await res.json()
        setNodes(data.docs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchNodes()
  }, [])

  const handleChange = (nodeId: string, isChecked: boolean) => {
    const current = Array.isArray(value) ? value : []
    let newValue: string[]
    if (isChecked) {
      newValue = [...current, nodeId]
    } else {
      newValue = current.filter((id) => id !== nodeId)
    }
    setValue(newValue)
  }

  if (loading) return <div className="field-type">Loading nodes...</div>
  if (error)
    return (
      <div className="field-type" style={{ color: 'var(--theme-error-500)' }}>
        Error: {error}
      </div>
    )

  const currentValues = Array.isArray(value) ? value : []

  return (
    <div className="field-type">
      <label className="field-label" style={{ marginBottom: '10px', display: 'block' }}>
        Node IDs (Root Nodes)
      </label>
      <div
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
          padding: '10px',
          backgroundColor: 'var(--theme-elevation-50)',
        }}
      >
        {nodes.length === 0 && (
          <div style={{ color: 'var(--theme-elevation-400)' }}>No root nodes found.</div>
        )}
        {nodes.map((node) => (
          <div key={node.id} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id={`node-${node.node_id}`}
              checked={currentValues.includes(node.node_id)}
              onChange={(e) => handleChange(node.node_id, e.target.checked)}
              style={{
                marginRight: '8px',
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: 'var(--theme-primary-500)',
              }}
            />
            <label
              htmlFor={`node-${node.node_id}`}
              style={{
                fontSize: '14px',
                cursor: 'pointer',
                color: 'var(--theme-elevation-800)',
              }}
            >
              {node.display_name}{' '}
              <span style={{ color: 'var(--theme-elevation-400)', fontSize: '12px' }}>
                ({node.node_id})
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
