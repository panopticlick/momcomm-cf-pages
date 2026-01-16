'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@payloadcms/ui'

export const CreateChildrenBtn: React.FC<{ rowData: { id: string | number } }> = ({ rowData }) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/nodes/${rowData.id}/add-children`, {
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
          `Success: Added ${count} node${count !== 1 ? 's' : ''}, Updated ${updated} node${updated !== 1 ? 's' : ''}, Existing ${existing} node${existing !== 1 ? 's' : ''}.`,
        )
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to add children nodes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '4px 8px',
        fontSize: '12px',
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        color: '#374151',
      }}
    >
      {loading ? 'Adding...' : 'Add Children'}
    </button>
  )
}
