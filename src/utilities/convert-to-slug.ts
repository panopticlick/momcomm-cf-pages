import slugify from 'slugify'

export const convertToSlug = (text: string): string => {
  return slugify(text, { lower: true, strict: true })
}
