import 'dotenv/config'
import { SearchItems } from '../services/amazon-paapi-edge'

async function main() {
  const accessKey = process.env.PAAPI_ACCESS_KEY
  const secretKey = process.env.PAAPI_SECRET_KEY
  const partnerTag = process.env.PAAPI_PARTNER_TAG

  if (!accessKey || !secretKey || !partnerTag) {
    console.error(
      'Error: Please set PAAPI_ACCESS_KEY, PAAPI_SECRET_KEY, and PAAPI_PARTNER_TAG in your .env file.',
    )
    // Attempt with mock data to just verify code paths if we entered this block?
    // No, SearchItems throws 'Missing Credentials' immediately if any are missing.
    // Let's call it anyway to show the error from the service itself.
    try {
      await SearchItems({ AccessKey: '', SecretKey: '', PartnerTag: '' }, { Keywords: 'Test' })
    } catch (e) {
      console.log(
        'Verified: Service correctly throws error on missing credentials:',
        e instanceof Error ? e.message : String(e),
      )
    }
    return
  }

  console.log('Credentials found. Testing SearchItems...')

  try {
    const result = await SearchItems(
      {
        AccessKey: accessKey,
        SecretKey: secretKey,
        PartnerTag: partnerTag,
        Marketplace: 'www.amazon.com',
      },
      {
        Keywords: 'Kindle',
        SearchIndex: 'All',
        ItemCount: 1,
        Resources: ['Images.Primary.Small', 'ItemInfo.Title', 'Offers.Listings.Price'],
      },
    )

    console.log('Search Result:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('Test Failed:', error instanceof Error ? error.message : String(error))
  }
}

main()
