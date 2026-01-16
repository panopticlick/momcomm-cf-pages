'use client'

import React, { useEffect } from 'react'
import { useField, useFormFields, useDocumentInfo, TextInput } from '@payloadcms/ui'
import { convertToSlug } from '@/utilities/convert-to-slug'

type Props = {
  path: string
  field: {
    label?: string | Record<string, string>
    required?: boolean
    [key: string]: any
  }
}

export const SlugComponent: React.FC<Props> = ({ path, field }) => {
  const { value, setValue } = useField<string>({ path })
  const { id } = useDocumentInfo()
  const titleField = useFormFields(([fields]) => fields.title)
  const title = (titleField?.value as string) || ''

  useEffect(() => {
    // Only auto-generate on Create (no ID)
    if (!id) {
      const formattedSlug = convertToSlug(title)
      // Avoid infinite loops or unnecessary updates, though setValue is usually stable.
      // Only update if changes.
      // Note: if title is empty, formattedSlug is empty.
      if (value !== formattedSlug) {
        setValue(formattedSlug)
      }
    }
  }, [title, id, setValue, value])

  return (
    <div className="field-type text">
      <label className="field-label" htmlFor={path}>
        {typeof field.label === 'string' ? field.label : 'Slug'}
        {field.required && <span className="required">*</span>}
      </label>
      <TextInput
        path={path}
        value={value || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
      />
    </div>
  )
}
