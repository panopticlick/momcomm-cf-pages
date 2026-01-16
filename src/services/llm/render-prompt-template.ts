/**
 * Simple prompt rendering utility that replaces {{ key }} with values from context.
 * This is used instead of a full template engine like Liquid to avoid conflicts
 * with shortcode syntax like {{ topics ... }} or {{ posts ... }} which should
 * be passed literal to the LLM.
 */
export function renderPromptTemplate(template: string, context: Record<string, any>): string {
  if (!template) return ''

  // Only replace simple keys that exist in context
  // Regex: matches {{ key }} where key is alphanumeric + underscore
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(context, key)) {
      const value = context[key]
      return value !== undefined && value !== null ? String(value) : match
    }
    return match
  })
}
