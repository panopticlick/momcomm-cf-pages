import { AnthropicClient } from '../../services/anthropic-client'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// npx tsx src/scripts/test/test-anthropic-config.ts
async function testAnthropicConfig() {
  console.log('Testing AnthropicClient configuration...')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set in .env')
    return
  }

  const client = new AnthropicClient()

  // User requested: claude-sonnet-4-5-20250929
  // But wait, the user's request is "Test AnthropicClient... claude-sonnet-4-5-20250929... maxTokens 64_000... if it works".
  // So I must test that specific model.
  const targetModel = 'claude-sonnet-4-5-20250929'
  const maxTokens = 64000

  console.log(`Model: ${targetModel}`)
  console.log(`Max Tokens: ${maxTokens}`)

  try {
    const response = await client.generateText(
      'Please reply with "Config Test OK" if you receive this.',
      'You are a test assistant.',
      maxTokens,
      targetModel,
    )
    console.log('Response received:')
    console.log(response)
    console.log('Test PASSED')
  } catch (error: any) {
    console.error('Test FAILED')
    console.error(error.message || error)
  }
}

testAnthropicConfig()
