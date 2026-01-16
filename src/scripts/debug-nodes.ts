import 'dotenv/config'
import { GetBrowseNodes } from '../services/amazon-paapi-edge'

async function main() {
  const accessKey = process.env.PAAPI_ACCESS_KEY
  const secretKey = process.env.PAAPI_SECRET_KEY
  const partnerTag = process.env.PAAPI_PARTNER_TAG

  if (!accessKey || !secretKey || !partnerTag) {
    console.error('Error: Missing credentials.')
    return
  }

  try {
    console.log('Fetching BrowseNode 565098...')
    const response = await GetBrowseNodes(
      {
        AccessKey: accessKey,
        SecretKey: secretKey,
        PartnerTag: partnerTag,
        Marketplace: 'www.amazon.com',
      },
      {
        BrowseNodeIds: ['565098'],
        Resources: ['BrowseNodes.Children'],
      },
    )

    console.log('Raw Response:', JSON.stringify(response, null, 2))
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    if (error && typeof error === 'object' && 'response' in error) {
      console.error(
        'Response body:',
        await (error as { response: { text: () => Promise<string> } }).response.text(),
      )
    }
  }
}

main()
