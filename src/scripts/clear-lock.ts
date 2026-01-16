import Redis from 'ioredis'

async function clearLock() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  const lockKey = 'cron:products:scraper:lock'

  const result = await redis.del(lockKey)
  console.log(`Cleared lock '${lockKey}'. Result: ${result}`)

  await redis.quit()
}

clearLock()
