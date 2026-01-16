'use client'

import React, { useState, useEffect } from 'react'
import AsyncSelect from 'react-select/async'
import { useField } from '@payloadcms/ui'

type NodeOption = {
  label: string
  value: string
}

export const NodeAjaxSelect: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<
    string | number | null | { id: string | number; display_name?: string; slug?: string }
  >({ path })

  // State to hold the selected option for display
  const [selectedOption, setSelectedOption] = useState<NodeOption | null>(null)

  // Fetch initial option if value exists
  useEffect(() => {
    if ((value || value === 0) && !selectedOption) {
      const id = typeof value === 'string' || typeof value === 'number' ? value : (value as any).id

      const fetchInitial = async () => {
        try {
          // If value is already an object with display_name, use it directly (if populated)
          if (typeof value === 'object' && (value as any).display_name) {
            setSelectedOption({
              label: `${(value as any).display_name} (${(value as any).slug})`,
              value: id,
            })
            return
          }

          const res = await fetch(`/api/nodes/${id}`)
          if (res.ok) {
            const data = await res.json()
            setSelectedOption({
              label: `${data.display_name} (${data.slug})`,
              value: data.id,
            })
          }
        } catch (e) {
          console.error('Error fetching initial node', e)
        }
      }
      fetchInitial()
    } else if ((value === null || value === undefined) && selectedOption) {
      setSelectedOption(null)
    }
  }, [value, selectedOption])

  const loadOptions = async (inputValue: string) => {
    if (!inputValue) return []
    try {
      const res = await fetch(`/api/nodes?where[display_name][like]=${inputValue}&limit=20&depth=0`)
      const data = await res.json()

      return data.docs.map((node: any) => ({
        label: `${node.display_name} (${node.slug})`,
        value: node.id,
      }))
    } catch (error) {
      console.error('Error loading nodes', error)
      return []
    }
  }

  const handleChange = (option: NodeOption | null) => {
    setValue(option ? option.value : null)
    setSelectedOption(option)
  }

  // Ensure component is mounted to avoid hydration mismatch with react-select
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="field-type">
        <label className="field-label">Node</label>
        <div
          className="react-select__control"
          style={{
            height: '38px',
            backgroundColor: 'var(--theme-input-bg)',
            borderColor: 'var(--theme-input-border)',
          }}
        >
          <div
            className="react-select__placeholder"
            style={{ padding: '0 10px', lineHeight: '38px', color: 'var(--theme-elevation-400)' }}
          >
            Loading...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="field-type">
      <label className="field-label">Node</label>
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        onChange={handleChange}
        value={selectedOption}
        placeholder="Search for a node..."
        isClearable
        className="react-select"
        classNamePrefix="react-select"
      />
    </div>
  )
}
