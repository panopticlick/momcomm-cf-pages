import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as crypto from 'crypto'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Parse IP whitelist from environment variable
const CRON_IP_WHITELIST = process.env.CRON_IP_WHITELIST
  ? process.env.CRON_IP_WHITELIST.split(',').map((ip) => ip.trim())
  : []

// Verify HMAC signature
function verifySignature(timestamp: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const payload = `${timestamp}`
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

// Check rate limit
function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Get client IP from request
function getClientIp(request: NextRequest): string | null {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return null
}

export function middleware(request: NextRequest) {
  // Only apply to cron endpoints
  if (!request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set')
    return new NextResponse('Server configuration error', { status: 500 })
  }

  // 1. Check IP whitelist if configured
  if (CRON_IP_WHITELIST.length > 0) {
    const clientIp = getClientIp(request)
    if (!clientIp || !CRON_IP_WHITELIST.includes(clientIp)) {
      console.warn(`Unauthorized cron access attempt from IP: ${clientIp}`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // 2. Check rate limit
  const clientIp = getClientIp(request) || 'unknown'
  if (!checkRateLimit(clientIp, 10, 60000)) {
    return new NextResponse('Too many requests', { status: 429 })
  }

  // 3. Check Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 4. Optional: Check HMAC signature if headers are present
  const timestamp = request.headers.get('x-cron-timestamp')
  const signature = request.headers.get('x-cron-signature')

  if (timestamp && signature) {
    // Check timestamp is within 5 minutes to prevent replay attacks
    const timestampNum = parseInt(timestamp, 10)
    const now = Date.now()
    if (isNaN(timestampNum) || Math.abs(now - timestampNum) > 300000) {
      return new NextResponse('Invalid timestamp', { status: 401 })
    }

    if (!verifySignature(timestamp, signature, cronSecret)) {
      return new NextResponse('Invalid signature', { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/cron/:path*',
}
