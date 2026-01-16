'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import './prompt-preview.css'

const PromptPreviewSection: React.FC<{
  title: string
  roleContent: string
  fieldPath: string
  onSuccess?: (data: any) => void
  disabled?: boolean
  disabledReason?: string
  extraBody?: Record<string, any>
  dataLink?: string
}> = ({
  title,
  roleContent,
  fieldPath,
  onSuccess,
  disabled,
  disabledReason,
  extraBody,
  dataLink,
}) => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const [resultCopyStatus, setResultCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [validation, setValidation] = useState<{ valid: boolean; errors?: string[] } | null>(null)

  if (!roleContent) return null

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    setValidation(null)
    try {
      const response = await fetch('/api/ai-blocks/test-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: roleContent,
          type: fieldPath === 'prompt_metadata' ? 'metadata' : 'content',
          ...extraBody,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.result)
        if (fieldPath === 'prompt_metadata' && data.validation) {
          setValidation(data.validation)
          if (data.validation.valid && onSuccess) {
            onSuccess(data.result)
          }
        }
      } else {
        setError(data.error || 'Failed to generate content')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    setCopyStatus('copying')
    setError(null)
    try {
      const response = await fetch('/api/ai-blocks/render-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: roleContent }),
      })

      const data = await response.json()

      if (response.ok) {
        await navigator.clipboard.writeText(data.result)
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 2000)
      } else {
        setError(data.error || 'Failed to render prompt for copy')
        setCopyStatus('error')
        setTimeout(() => setCopyStatus('idle'), 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }

  const handleCopyResult = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!result) return

    try {
      await navigator.clipboard.writeText(result)
      setResultCopyStatus('copied')
      setTimeout(() => setResultCopyStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy result:', err)
      setResultCopyStatus('error')
      setTimeout(() => setResultCopyStatus('idle'), 2000)
    }
  }

  return (
    <div className={`prompt-preview-section ${disabled ? 'prompt-preview-section--disabled' : ''}`}>
      <div className="prompt-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>{title}</strong>
          {dataLink && (
            <a
              href={dataLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: '#2563eb',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Open API Data"
            >
              (API Data ↗)
            </a>
          )}
        </div>
        <div className="prompt-preview-actions">
          <button
            type="button"
            onClick={handleCopy}
            disabled={copyStatus === 'copying' || disabled}
            className="prompt-preview-btn prompt-preview-btn--secondary"
            title="Copy rendered prompt"
          >
            {copyStatus === 'copying'
              ? '...'
              : copyStatus === 'copied'
                ? 'Copied!'
                : copyStatus === 'error'
                  ? 'Error'
                  : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={loading || disabled}
            className="prompt-preview-btn prompt-preview-btn--primary"
            title={disabled ? disabledReason : 'Test Online'}
          >
            {loading ? 'Testing...' : 'Test Online'}
          </button>
        </div>
      </div>

      {disabled && disabledReason && (
        <div className="prompt-preview-warning">⚠️ {disabledReason}</div>
      )}

      {error && <div className="prompt-preview-error">{error}</div>}

      {result && (
        <React.Fragment>
          {validation && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '10px',
                borderRadius: '6px',
                backgroundColor: validation.valid ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${validation.valid ? '#a7f3d0' : '#fecaca'}`,
                color: validation.valid ? '#047857' : '#b91c1c',
                fontSize: '13px',
              }}
            >
              <strong>
                {validation.valid ? '✅ Valid JSON Response' : '❌ Invalid JSON Response'}
              </strong>
              {!validation.valid && validation.errors && (
                <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                  {validation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <details open className="prompt-preview-result">
            <summary style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Result</span>
              <button
                type="button"
                onClick={handleCopyResult}
                className="prompt-preview-btn prompt-preview-btn--neutral"
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  height: 'auto',
                  minWidth: 'auto',
                }}
                title="Copy Result"
              >
                {resultCopyStatus === 'copied'
                  ? 'Copied!'
                  : resultCopyStatus === 'error'
                    ? 'Error'
                    : 'Copy'}
              </button>
            </summary>
            <pre>{result}</pre>
          </details>
        </React.Fragment>
      )}
    </div>
  )
}

export const PromptPreview: React.FC = () => {
  const promptMetadata = useFormFields(([fields]) => fields.prompt_metadata)
  const promptContent = useFormFields(([fields]) => fields.prompt_content)

  const metadataValue = (promptMetadata?.value as string) || ''
  const contentValue = (promptContent?.value as string) || ''

  const [metadataResult, setMetadataResult] = useState<string | null>(null)
  const [topicId, setTopicId] = useState<number | null>(null)

  React.useEffect(() => {
    const fetchTopicId = async () => {
      try {
        const response = await fetch('/api/ai-blocks/preview-data')
        if (response.ok) {
          const data = await response.json()
          setTopicId(data.id)
        }
      } catch (err) {
        console.error('Error fetching preview topic id', err)
      }
    }

    fetchTopicId()
  }, [])

  if (!metadataValue && !contentValue) {
    return null
  }

  const handleMetadataSuccess = (result: string) => {
    // Attempt to extract JSON logic is handled in backend validation but raw string is returned
    // We can just pass the raw string to backend, it will parse it again or we can parse here.
    // The previous implementation returned raw response string.
    setMetadataResult(result)
  }

  return (
    <div className="prompt-preview-container">
      <div
        className="prompt-preview-main-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3>Online Prompt Test</h3>
      </div>

      <PromptPreviewSection
        title="1. Metadata Prompt"
        roleContent={metadataValue}
        fieldPath="prompt_metadata"
        onSuccess={handleMetadataSuccess}
        dataLink={topicId ? `/api/og-topic/simple/${topicId}` : undefined}
      />

      <PromptPreviewSection
        title="2. Content Prompt"
        roleContent={contentValue}
        fieldPath="prompt_content"
        disabled={!metadataResult}
        disabledReason="Please successfully test Metadata Prompt first to generate context."
        extraBody={metadataResult ? { metadata: metadataResult } : undefined}
        dataLink={topicId ? `/api/og-topic/${topicId}` : undefined}
      />
    </div>
  )
}
