import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1, // 限制请求重试次数，避免构建卡死
    retryStrategy: (times) => {
      // 如果重试超过3次，不再重试（或者可以在构建时不重试）
      if (times > 3) {
        return null
      }
      return Math.min(times * 50, 2000)
    },
  })

// 防止 Redis 连接失败导致构建报错退出 (Unhandled error event)
redis.on('error', (error) => {
  console.warn('[Redis] Connection error (suppressed):', error.message)
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
