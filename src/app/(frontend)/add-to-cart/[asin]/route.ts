import { siteConfig } from '@/lib/site-config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Amazon Add to Cart Route
 * Path: /add-to-cart/{asin}
 * Redirects to Amazon cart add URL with Affiliate Tag
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ asin: string }> }) {
  const { asin } = await params

  if (!asin || !/[A-Z0-9]*$/.test(asin)) {
    return NextResponse.json({ error: 'Invalid ASIN format' }, { status: 400 })
  }

  const affiliateTag = siteConfig.amazonAffiliateTag

  // Construct the Amazon Add to Cart URL
  // https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=cherryai-20&ASIN.1=B07JRBSPZ3&Quantity.1=1&add=add
  const baseUrl = 'https://www.amazon.com/gp/aws/cart/add.html'
  const paramsList = new URLSearchParams()

  if (affiliateTag) {
    paramsList.append('AssociateTag', affiliateTag)
  }

  paramsList.append('ASIN.1', asin)
  paramsList.append('Quantity.1', '1')
  paramsList.append('add', 'add')

  const amazonUrl = `${baseUrl}?${paramsList.toString()}`

  // 302 Found redirect
  return NextResponse.redirect(amazonUrl, 302)
}
