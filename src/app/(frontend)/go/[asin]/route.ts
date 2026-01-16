import { NextRequest, NextResponse } from 'next/server'
import { generateAmazonAffiliateLink } from '@/utilities/generate-amazon-affiliate-link'
import { trackClick } from '@/lib/db/clicks'

/**
 * Amazon 产品跳转路由
 * 路径: /go/{asin}
 * 重定向到 Amazon 产品页面（带 Affiliate Tag）
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ asin: string }> }) {
  const { asin } = await params

  if (!asin || !/[A-Z0-9]*$/.test(asin)) {
    return NextResponse.json({ error: 'Invalid ASIN format' }, { status: 400 })
  }

  // Track the click before redirecting
  const clickData = {
    asin,
    timestamp: new Date(),
    referrer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
  }

  // Fire and forget - don't await to not delay redirect
  trackClick(clickData).catch((err) => console.error('Click tracking failed:', err))

  // 使用 affiliate link 生成函数
  const amazonUrl = generateAmazonAffiliateLink(asin)

  // 302 临时重定向到 Amazon
  return NextResponse.redirect(amazonUrl, 302)
}
