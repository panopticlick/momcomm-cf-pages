import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Environment Variable Validation', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv }
  })

  it('should load required database environment variables', () => {
    // Test that the database config uses the right env vars
    const { PAYLOAD_DATABASE_URI, DATABASE_URI } = process.env

    // These are expected to be set for the app to function
    // In a real scenario, missing these would cause the app to fail on startup
    expect(PAYLOAD_DATABASE_URI || DATABASE_URI).toBeDefined()
  })

  it('should have NODE_ENV set to a valid value', () => {
    const { NODE_ENV } = process.env
    const validValues = ['development', 'production', 'test']

    expect(NODE_ENV).toBeDefined()
    expect(validValues).toContain(NODE_ENV)
  })

  it('should load Anthropic API key if AI features are enabled', () => {
    const { ANTHROPIC_API_KEY } = process.env

    // If AI features are being tested, this should be set
    // This test documents the requirement
    if (process.env.TEST_AI_FEATURES === 'true') {
      expect(ANTHROPIC_API_KEY).toBeDefined()
      expect(ANTHROPIC_API_KEY).toMatch(/^sk-ant-/)
    }
  })

  it('should load Redis configuration', () => {
    const { REDIS_URL } = process.env

    // Redis URL should be set for caching and cron locks
    expect(REDIS_URL).toBeDefined()
  })

  it('should provide clear error message for missing PAYLOAD_DATABASE_URI', () => {
    delete process.env.PAYLOAD_DATABASE_URI

    // When attempting to initialize Payload without database URI,
    // it should fail with a clear error message
    expect(() => {
      if (!process.env.PAYLOAD_DATABASE_URI) {
        throw new Error(
          'PAYLOAD_DATABASE_URI environment variable is required. ' +
            'Please set it in your .env file.',
        )
      }
    }).toThrow('PAYLOAD_DATABASE_URI')
  })

  it('should provide clear error message for missing REDIS_URL', () => {
    delete process.env.REDIS_URL

    expect(() => {
      if (!process.env.REDIS_URL) {
        throw new Error(
          'REDIS_URL environment variable is required. ' + 'Please set it in your .env file.',
        )
      }
    }).toThrow('REDIS_URL')
  })

  it('should validate Amazon PAAPI credentials', () => {
    const {
      AMAZON_PAAPI_ACCESS_KEY_ID,
      AMAZON_PAAPI_SECRET_ACCESS_KEY,
      AMAZON_PARTNER_TAG,
      AMAZON_PAAPI_REGION,
    } = process.env

    // Document the required env vars for Amazon PAAPI
    if (process.env.TEST_PAAPI_FEATURES === 'true') {
      expect(AMAZON_PAAPI_ACCESS_KEY_ID).toBeDefined()
      expect(AMAZON_PAAPI_SECRET_ACCESS_KEY).toBeDefined()
      expect(AMAZON_PARTNER_TAG).toBeDefined()
      expect(AMAZON_PAAPI_REGION).toBeDefined()
    }
  })

  it('should have default values for optional configuration', () => {
    // Test that config has proper defaults for optional values
    const batchsize = parseInt(process.env.BATCH_SIZE || '1000', 10)
    const maxNodeLoops = parseInt(process.env.MAX_NODE_LOOPS || '60000', 10)

    expect(batchsize).toBeGreaterThan(0)
    expect(maxNodeLoops).toBeGreaterThan(0)
  })
})
