import Anthropic from '@anthropic-ai/sdk'

export class AnthropicClient {
  private client: Anthropic
  private defaultModel: string

  constructor(
    apiKey?: string,
    defaultModel: string = 'claude-sonnet-4-5-20250929',
    baseURL?: string,
  ) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY
    const url = baseURL || process.env.ANTHROPIC_BASE_URL

    if (!key) {
      console.warn('AnthropicClient: ANTHROPIC_API_KEY is not set')
    }
    this.client = new Anthropic({
      apiKey: key || '', // Pass empty string if undefined to let SDK throw or handle, but we warned already
      baseURL: url,
      ...(process.env.ANTHROPIC_ALLOW_BROWSER === 'true' ? { dangerouslyAllowBrowser: true } : {}),
    })
    this.defaultModel = defaultModel
  }

  async generate(
    messages: Anthropic.MessageParam[],
    system?: string,
    maxTokens: number = 64000,
    model?: string,
  ): Promise<string> {
    try {
      let fullText = ''
      for await (const chunk of this.generateStream(messages, system, maxTokens, model)) {
        fullText += chunk
      }
      return fullText
    } catch (error) {
      console.error('AnthropicClient generate Error:', error)
      throw error
    }
  }

  async *generateStream(
    messages: Anthropic.MessageParam[],
    system?: string,
    maxTokens: number = 64000,
    model?: string,
  ): AsyncGenerator<string> {
    try {
      const stream = await this.client.messages.create({
        model: model || this.defaultModel,
        max_tokens: maxTokens,
        system: system,
        messages: messages,
        stream: true,
      })

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text
        }
      }
    } catch (error) {
      console.error('AnthropicClient generateStream Error:', error)
      throw error
    }
  }

  async generateText(
    prompt: string,
    system?: string,
    maxTokens: number = 64000,
    model?: string,
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]
    return this.generate(messages, system, maxTokens, model)
  }

  getClient(): Anthropic {
    return this.client
  }
}
