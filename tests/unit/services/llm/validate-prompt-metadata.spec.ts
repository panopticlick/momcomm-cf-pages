import { describe, it, expect } from 'vitest'
import { validatePromptMetadata } from '../../../../src/services/llm/validate-prompt-metadata'
import { ZodError } from 'zod'

describe('validatePromptMetadata', () => {
  it('should validate a valid prompt metadata object', () => {
    const validData = {
      title: 'Best Coffee Makers',
      description: 'A comprehensive guide to the best coffee makers.',
      keywords: ['coffee', 'maker', 'reviews'],
      tags: ['Home', 'Kitchen'],
      introductory: '# Introduction\n\nCoffee is great.',
      excerpt: 'Find the best coffee maker for your daily brew.',
    }

    const result = validatePromptMetadata(validData)
    expect(result).toEqual(validData)
  })

  it('should validate valid data without optional tags', () => {
    const validDataNoTags = {
      title: 'Best Coffee Makers',
      description: 'A comprehensive guide to the best coffee makers.',
      keywords: ['coffee', 'maker'],
      introductory: '# Introduction',
      excerpt: 'Excerpt text.',
    }

    const result = validatePromptMetadata(validDataNoTags)
    expect(result.tags).toEqual([])
  })

  it('should throw an error if title is missing', () => {
    const invalidData = {
      description: 'Desc',
      keywords: ['key'],
      introductory: 'Intro',
      excerpt: 'Excerpt',
    }
    expect(() => validatePromptMetadata(invalidData)).toThrow(ZodError)
  })

  it('should throw an error if fields are of wrong type', () => {
    const invalidData = {
      title: 123, // Wrong type
      description: 'Desc',
      keywords: 'not an array', // Wrong type
      introductory: 'Intro',
      excerpt: 'Excerpt',
    }
    expect(() => validatePromptMetadata(invalidData)).toThrow(ZodError)
  })

  it('should throw an error if required strings are empty', () => {
    const invalidData = {
      title: '',
      description: '',
      keywords: [],
      introductory: '',
      excerpt: '',
    }
    expect(() => validatePromptMetadata(invalidData)).toThrow(ZodError)
  })
})
