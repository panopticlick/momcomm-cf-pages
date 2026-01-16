import { z } from 'zod'

export const PromptMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  tags: z.array(z.string()).optional().default([]),
  introductory: z.string().min(1, 'Introductory content is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
})

export type PromptMetadata = z.infer<typeof PromptMetadataSchema>

/**
 * Validates the parsed JSON object against the PromptMetadata schema.
 * @param json The parsed JSON object.
 * @returns The validated PromptMetadata object.
 * @throws ZodError if validation fails.
 */
export function validatePromptMetadata(json: any): PromptMetadata {
  return PromptMetadataSchema.parse(json)
}
