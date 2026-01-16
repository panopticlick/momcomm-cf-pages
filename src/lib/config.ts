/**
 * Centralized configuration for the application
 * All magic numbers and environment-based values should be defined here
 */

export const config = {
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  database: {
    /**
     * Batch size for processing records in bulk operations
     * Used in task processor to split large jobs into manageable chunks
     */
    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),

    /**
     * Maximum number of loops for node traversal to prevent infinite loops
     */
    maxNodeTraversalLoops: parseInt(process.env.MAX_NODE_LOOPS || '60000', 10),
  },

  cron: {
    /**
     * Default lock duration for cron jobs in seconds
     * Shorter in dev for easier debugging
     */
    defaultLockDuration: process.env.NODE_ENV === 'development' ? 60 : 300,

    /**
     * Maximum duration for cron route handlers
     * Vercel/Edge functions have max limits
     */
    maxRouteDuration: 300, // 5 minutes
  },

  api: {
    /**
     * Default pagination limit for list queries
     */
    defaultLimit: 10,

    /**
     * Maximum pagination limit for list queries
     */
    maxLimit: 100,

    /**
     * Timeout for external API calls in milliseconds
     */
    timeout: 30000, // 30 seconds
  },

  anthropic: {
    /**
     * Maximum tokens for AI completion requests
     */
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '64000', 10),

    /**
     * Default model to use for AI requests
     */
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',

    /**
     * Temperature for AI responses (0-1)
     */
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
  },

  redis: {
    /**
     * Redis key prefixes for namespacing
     */
    keys: {
      cronLock: 'cron',
      cache: 'cache',
      rateLimit: 'ratelimit',
    },

    /**
     * Default TTL for cached values in seconds
     */
    defaultTTL: 3600, // 1 hour

    /**
     * TTL for click tracking data in seconds
     */
    clickTrackingTTL: 86400 * 30, // 30 days
  },

  logging: {
    /**
     * Log level: 'debug' | 'info' | 'warn' | 'error'
     */
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',

    /**
     * Enable request ID tracking
     */
    requestId: process.env.LOG_REQUEST_ID === 'true',

    /**
     * Enable performance tracking
     */
    performance: process.env.LOG_PERFORMANCE === 'true',
  },

  health: {
    /**
     * Timeout for health checks in milliseconds
     */
    timeout: 5000,

    /**
     * Critical services to check
     */
    checks: {
      database: true,
      redis: true,
      externalApis: false, // Optional, may timeout
    },
  },
} as const

export type Config = typeof config
