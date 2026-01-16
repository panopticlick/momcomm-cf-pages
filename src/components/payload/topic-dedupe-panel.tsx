'use client'

import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DuplicateTopicItem {
  id: number
  name: string
  conversion_share_sum: number
  active: boolean
  slug: string
  isMain: boolean
}

interface PreviewResponse {
  success: boolean
  message: string
  mode: string
  totalTopics: number
  totalDuplicates: number
  duplicateGroups: DuplicateTopicItem[][]
}

export const TopicDedupePanel: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [applied, setApplied] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null)

  // Initialize selectedIds when previewData changes
  // User Rule: Default unselected -> So we do NOT populate selectedIds here.
  // We just reset it to empty when new data arrives (already handled by setPreviewData(null) -> fetch -> state clear)
  // Actually we need to explicitly clear it if we re-fetch without unmounting, which we do in fetchPreview.

  const cancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setLoading(false)
      setStatus(null)
      setError('Operation cancelled by user')
    }
  }

  const fetchPreview = async (mode: 'code' | 'ai') => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    setError(null)
    setStatus(null)
    setPreviewData(null)
    setApplied(false)
    setSelectedIds(new Set())

    try {
      const res = await fetch(`/api/topics/dedupe-preview?mode=${mode}`, {
        signal: abortController.signal,
      })

      if (!res.ok) throw new Error('Network response was not ok')
      if (!res.body) throw new Error('Response body is null')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)

            if (data.type === 'status') {
              setStatus(data.message)
            } else if (data.type === 'result') {
              if (!data.success) throw new Error(data.message)
              setPreviewData(data)
              setStatus(null)
              if (data.duplicateGroups) {
                const allIndices = new Set<number>(
                  data.duplicateGroups.map((_: any, idx: number) => idx),
                )
                setExpanded(allIndices)
              }
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          } catch (e) {
            console.error('Failed to parse NDJSON line:', line, e)
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, error is already set in cancelFetch
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setStatus(null)
      abortControllerRef.current = null
    }
  }

  const applyDedupe = async () => {
    if (!previewData || previewData.duplicateGroups.length === 0) return

    // Filter duplicateGroups based on selection
    const filteredGroups = previewData.duplicateGroups
      .map((group) => {
        // Keep the main item and any SELECTED duplicates
        return group.filter((item) => item.isMain || selectedIds.has(item.id))
      })
      // Only keep groups that still have at least 1 duplicate (length >= 2)
      .filter((group) => group.length >= 2)

    if (filteredGroups.length === 0) {
      alert('No duplicates selected to apply!')
      return
    }

    if (
      !confirm(
        `Are you sure you want to apply ${filteredGroups.reduce((acc, g) => acc + g.length - 1, 0)} redirects?`,
      )
    ) {
      return
    }

    setApplying(true)
    setError(null)

    try {
      const res = await fetch('/api/topics/dedupe-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateGroups: filteredGroups }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to apply deduplication')
      }

      setApplied(true)
      // Refresh the page after a short delay to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApplying(false)
    }
  }

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpanded(newExpanded)
  }

  const toggleSelection = (id: number, shiftKey: boolean) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
    setLastSelectedId(id)
  }

  const toggleGroupSelection = (groupIndex: number, select: boolean) => {
    if (!previewData) return
    const group = previewData.duplicateGroups[groupIndex]
    const newSelected = new Set(selectedIds)

    group.forEach((item) => {
      if (!item.isMain) {
        if (select) {
          newSelected.add(item.id)
        } else {
          newSelected.delete(item.id)
        }
      }
    })

    setSelectedIds(newSelected)
  }

  const toggleSelectAll = (select: boolean) => {
    if (!previewData) return
    const newSelected = new Set<number>()
    if (select) {
      previewData.duplicateGroups.forEach((group) => {
        group.forEach((item) => {
          if (!item.isMain) newSelected.add(item.id)
        })
      })
    }
    setSelectedIds(newSelected)
  }

  const getSelectedCount = () => {
    if (!previewData) return 0
    return previewData.duplicateGroups.reduce((acc, group) => {
      const selectedInGroup = group.filter((item) => !item.isMain && selectedIds.has(item.id))
      return acc + selectedInGroup.length
    }, 0)
  }

  const closePreview = () => {
    setPreviewData(null)
    setApplied(false)
    setSelectedIds(new Set())
  }

  return (
    <>
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--theme-elevation-50)',
          borderRadius: '8px',
          border: '1px solid var(--theme-elevation-100)',
        }}
      >
        {/* Main Panel Header (Always Visible) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--theme-text)' }}>
              🔄 Topic Deduplication
            </span>
            <span style={{ fontSize: '12px', color: 'var(--theme-elevation-400)' }}>
              Preview and apply duplicate topic redirects
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fetchPreview('ai')}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (status ? `✨ ${status}` : 'Loading...') : '✨ AI Preview'}
            </button>
            {loading && (
              <button
                onClick={cancelFetch}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#d32f2f',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </div>

        {/* Status (Inline) */}
        {status && !error && (
          <div
            style={{
              padding: '12px',
              marginTop: '16px',
              background: 'var(--theme-elevation-100)',
              borderRadius: '4px',
              color: 'var(--theme-text)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="animate-spin">⏳</span> {status}
          </div>
        )}

        {/* Error (Inline) */}
        {error && (
          <div
            style={{
              padding: '12px',
              marginTop: '16px',
              background: '#ffebee',
              borderRadius: '4px',
              color: '#c62828',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Full Screen Modal Result */}
      {previewData &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: '#ffffff',
              zIndex: 2147483647, // Max z-index
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid var(--theme-elevation-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--theme-elevation-50)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                  Deduplication Preview ({previewData.mode})
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={badgeStyle}>Total: {previewData.totalTopics}</div>
                  <div style={badgeStyle}>
                    Selected: {getSelectedCount()} / {previewData.totalDuplicates}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => closePreview()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid var(--theme-elevation-200)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Close
                </button>
                {!applied && (
                  <button
                    onClick={applyDedupe}
                    disabled={applying || getSelectedCount() === 0}
                    style={{
                      padding: '8px 24px',
                      borderRadius: '4px',
                      border: 'none',
                      background: applying || getSelectedCount() === 0 ? '#9e9e9e' : '#d32f2f',
                      color: '#fff',
                      cursor: applying || getSelectedCount() === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {applying ? 'Applying...' : `Confirm & Apply (${getSelectedCount()})`}
                  </button>
                )}
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Global Actions */}
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      previewData.duplicateGroups.length > 0 &&
                      getSelectedCount() === previewData.totalDuplicates
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 600 }}>Select All Possible Duplicates</span>
                </label>
              </div>

              {/* Groups */}
              {previewData.duplicateGroups.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {previewData.duplicateGroups.map((group, idx) => {
                    const mainTopic = group.find((t) => t.isMain)
                    const duplicates = group.filter((t) => !t.isMain)
                    const isExpanded = expanded.has(idx)

                    const allSelected = duplicates.every((d) => selectedIds.has(d.id))
                    const someSelected = duplicates.some((d) => selectedIds.has(d.id))

                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid var(--theme-elevation-100)',
                          borderRadius: '8px',
                          background: 'var(--theme-elevation-0)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Group Header */}
                        <div
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--theme-elevation-50)',
                            borderBottom: isExpanded
                              ? '1px solid var(--theme-elevation-100)'
                              : 'none',
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleExpand(idx)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                color: 'var(--theme-elevation-400)',
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s',
                              }}
                            >
                              ▶
                            </span>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(input) => {
                                  if (input) {
                                    input.indeterminate = someSelected && !allSelected
                                  }
                                }}
                                onChange={(e) => toggleGroupSelection(idx, e.target.checked)}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                title="Select all in group"
                              />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: '16px',
                                  color: 'var(--theme-text)',
                                }}
                              >
                                {mainTopic?.name || 'Unknown'}
                              </span>
                              {mainTopic?.active && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    background: '#e8f5e9',
                                    color: '#2e7d32',
                                    borderRadius: '12px',
                                    fontWeight: 500,
                                  }}
                                >
                                  Main Active
                                </span>
                              )}
                              <span
                                style={{ fontSize: '13px', color: 'var(--theme-elevation-400)' }}
                              >
                                ({duplicates.length} duplicates found)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div style={{ padding: '0' }}>
                            {/* Main Item Info */}
                            <div
                              style={{
                                padding: '12px 16px',
                                borderBottom: '1px dashed var(--theme-elevation-100)',
                                background: 'var(--theme-elevation-50)',
                                fontSize: '13px',
                                color: 'var(--theme-elevation-500)',
                              }}
                            >
                              ℹ️ Target URL:{' '}
                              <code
                                style={{
                                  background: 'rgba(0,0,0,0.05)',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                }}
                              >
                                /gear/{mainTopic?.slug}
                              </code>
                            </div>

                            {/* Duplicates List */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {duplicates.map((dup) => (
                                <div
                                  key={dup.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid var(--theme-elevation-100)',
                                    background: selectedIds.has(dup.id)
                                      ? 'rgba(211, 47, 47, 0.02)'
                                      : 'transparent',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.has(dup.id)}
                                    onChange={(e) =>
                                      toggleSelection(
                                        dup.id,
                                        (e.nativeEvent as MouseEvent).shiftKey,
                                      )
                                    }
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                  />
                                  <div
                                    style={{
                                      flex: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      opacity: selectedIds.has(dup.id) ? 1 : 0.5,
                                    }}
                                  >
                                    <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>→</span>
                                    <span
                                      style={{
                                        color: 'var(--theme-text)',
                                        textDecoration: selectedIds.has(dup.id)
                                          ? 'none'
                                          : 'line-through',
                                        fontSize: '14px',
                                      }}
                                    >
                                      {dup.name}
                                    </span>
                                    {dup.active && (
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          padding: '2px 6px',
                                          background: '#fff3e0',
                                          color: '#ef6c00',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        CURRENTLY ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--theme-elevation-400)',
                                      fontFamily: 'monospace',
                                    }}
                                  >
                                    conv_share: {dup.conversion_share_sum || 0}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'var(--theme-elevation-400)',
                    fontSize: '18px',
                  }}
                >
                  🎉 No duplicates found!
                </div>
              )}

              {/* Applied Success Overlay/Message inside Modal */}
              {applied && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '32px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    textAlign: 'center',
                    zIndex: 20000,
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ margin: 0, marginBottom: '8px' }}>Success!</h3>
                  <p>Deduplication applied. Reloading page...</p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

const badgeStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  background: 'var(--theme-elevation-100)',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--theme-text)',
}
