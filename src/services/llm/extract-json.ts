/**
 * Extracts a JSON object from a string.
 * It handles raw JSON strings and Markdown code blocks (e.g., ```json ... ```).
 *
 * @param text The input string containing JSON.
 * @returns The parsed JSON object or null if extraction fails.
 */
export function extractJsonFromText<T = any>(text: string): T | null {
  if (!text) return null

  let jsonString = text.trim()

  // extensive search for JSON patterns
  // 1. Try to find the first '{' and the last '}'
  const firstOpenBrace = jsonString.indexOf('{')
  const lastCloseBrace = jsonString.lastIndexOf('}')

  if (firstOpenBrace !== -1 && lastCloseBrace !== -1 && lastCloseBrace > firstOpenBrace) {
    jsonString = jsonString.substring(firstOpenBrace, lastCloseBrace + 1)
    try {
      return JSON.parse(jsonString) as T
    } catch (e) {
      // If direct parsing fails, continue to other strategies
    }
  }

  // 2. Try to handle markdown code blocks if the above simple extraction failed or wasn't clean enough
  // const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  // if (markdownMatch) {
  //   try {
  //     return JSON.parse(markdownMatch[1]) as T
  //   } catch (e) {
  //     // ignore
  //   }
  // }

  return null
}
