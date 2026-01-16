'use client'

import React, { useState, useEffect, DragEvent, ChangeEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { importPosts } from '@/services/posts/import-posts'

export const PostImportCSV: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; error: number; errors: string[] } | null>(
    null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setResult(null)
      }
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const triggerFileInput = () => {
    inputRef.current?.click()
  }

  const handleUpload = async (e: MouseEvent) => {
    e.stopPropagation()
    if (!file) return

    setUploading(true)
    setResult(null)

    try {
      const text = await file.text()
      const response = await importPosts(text)
      setResult(response)
      if (response.success > 0) {
        router.refresh()
        // Optional: close modal on success after a delay?
        // For now, keep open to show results.
      }
    } catch (error: any) {
      setResult({ success: 0, error: 1, errors: [error.message] })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (e: MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setResult(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const closeModal = () => {
    setIsOpen(false)
    setFile(null)
    setResult(null)
    setIsDragging(false)
  }

  const Modal = () => {
    if (!mounted) return null
    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999, // Ensure it's on top of Payload admin UI
        }}
        onClick={closeModal}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '600px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative',
          }}
        >
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: 1,
              color: '#666',
            }}
          >
            &times;
          </button>

          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 600 }}>
            Import Posts via CSV
          </h3>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            style={{
              border: isDragging ? '2px dashed #999' : '2px dashed #e1e7f0',
              borderRadius: '8px',
              backgroundColor: isDragging ? '#f0f0f0' : '#fafafa',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '220px',
              marginBottom: '20px',
            }}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={inputRef}
            />

            {!file ? (
              <div style={{ textAlign: 'center', color: '#666' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 500 }}>
                  {isDragging ? 'Drop file here' : 'Click or Drag file to upload'}
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>Only .csv files</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '15px',
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 18px',
                    backgroundColor: '#fff',
                    border: '1px solid #e1e7f0',
                    borderRadius: '6px',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '300px',
                    }}
                  >
                    {file.name}
                  </span>
                  <button
                    onClick={removeFile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '0.9rem',
                    }}
                  >
                    Remove
                  </button>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  type="button"
                  className="btn btn--style-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: uploading ? '#ccc' : '',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {uploading ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            )}
          </div>

          {result && (
            <div
              style={{
                marginTop: '20px',
                padding: '15px',
                borderRadius: '6px',
                backgroundColor: result.error > 0 ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${result.error > 0 ? '#fecaca' : '#bbf7d0'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: result.errors.length > 0 ? '10px' : '0',
                }}
              >
                <strong style={{ color: result.error > 0 ? '#dc2626' : '#16a34a' }}>
                  Import {result.error > 0 ? 'Completed with Errors' : 'Successful'}
                </strong>
                <span style={{ color: '#4b5563' }}>
                  ({result.success} created, {result.error} failed)
                </span>
              </div>

              {result.errors.length > 0 && (
                <div
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #fecaca',
                  }}
                >
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '20px',
                      color: '#dc2626',
                      fontSize: '0.9rem',
                    }}
                  >
                    {result.errors.map((err, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div
            style={{ marginTop: '20px', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}
          >
            <p style={{ margin: 0 }}>
              <strong>Required Column:</strong> <code>title</code>. <strong>Optional:</strong>{' '}
              <code>slug</code>.
            </p>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn--style-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import CSV
      </button>
      {isOpen && <Modal />}
    </>
  )
}
