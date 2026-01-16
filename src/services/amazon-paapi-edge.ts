import { AwsClient } from 'aws4fetch'
import type {
  CommonParameters,
  SearchItemsParameters,
  GetItemsParameters,
  GetBrowseNodesParameters,
  GetVariationsParameters,
} from 'amazon-paapi'

const REGIONS: Record<string, { region: string; host: string }> = {
  'www.amazon.com': { region: 'us-east-1', host: 'webservices.amazon.com' },
  'www.amazon.co.uk': { region: 'eu-west-1', host: 'webservices.amazon.co.uk' },
  'www.amazon.de': { region: 'eu-west-1', host: 'webservices.amazon.de' },
  'www.amazon.fr': { region: 'eu-west-1', host: 'webservices.amazon.fr' },
  'www.amazon.jp': { region: 'us-west-2', host: 'webservices.amazon.co.jp' },
  'www.amazon.ca': { region: 'us-east-1', host: 'webservices.amazon.ca' },
  'www.amazon.it': { region: 'eu-west-1', host: 'webservices.amazon.it' },
  'www.amazon.es': { region: 'eu-west-1', host: 'webservices.amazon.es' },
  'www.amazon.in': { region: 'eu-west-1', host: 'webservices.amazon.in' },
  'www.amazon.com.br': {
    region: 'us-east-1',
    host: 'webservices.amazon.com.br',
  },
  'www.amazon.com.mx': {
    region: 'us-east-1',
    host: 'webservices.amazon.com.mx',
  },
  'www.amazon.com.au': {
    region: 'us-west-2',
    host: 'webservices.amazon.com.au',
  },
  'www.amazon.nl': { region: 'eu-west-1', host: 'webservices.amazon.nl' },
  'www.amazon.se': { region: 'eu-west-1', host: 'webservices.amazon.se' },
  'www.amazon.pl': { region: 'eu-west-1', host: 'webservices.amazon.pl' },
  'www.amazon.sg': { region: 'us-west-2', host: 'webservices.amazon.sg' },
  'www.amazon.ae': { region: 'eu-west-1', host: 'webservices.amazon.ae' },
  'www.amazon.sa': { region: 'eu-west-1', host: 'webservices.amazon.sa' },
  'www.amazon.be': { region: 'eu-west-1', host: 'webservices.amazon.com.be' },
  'www.amazon.eg': { region: 'eu-west-1', host: 'webservices.amazon.eg' },
}

const sendRequest = async (
  operation: string,
  commonParams: CommonParameters,
  requestParams: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  if (!commonParams.AccessKey || !commonParams.SecretKey || !commonParams.PartnerTag) {
    throw new Error('Missing Credentials')
  }

  const marketplace = commonParams.Marketplace || 'www.amazon.com'
  const config = REGIONS[marketplace] || REGIONS['www.amazon.com']
  const region = config.region
  const host = config.host

  const aws = new AwsClient({
    accessKeyId: commonParams.AccessKey,
    secretAccessKey: commonParams.SecretKey,
    region: region,
    service: 'ProductAdvertisingAPI',
  })

  const payload = {
    ...requestParams,
    PartnerTag: commonParams.PartnerTag,
    PartnerType: commonParams.PartnerType || 'Associates',
    Marketplace: marketplace,
  }

  const url = `https://${host}/paapi5/${operation.toLowerCase()}`

  try {
    const response = await aws.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`,
        'Content-Encoding': 'amz-1.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        if (json.Errors && json.Errors.length > 0) {
          throw new Error(JSON.stringify(json.Errors))
        }
      } catch (_ignore) {
        // ignore json parse error
      }
      throw new Error(`PAAPI request failed: ${response.status} ${response.statusText} - ${text}`)
    }

    return await response.json()
  } catch (error) {
    console.error('PAAPI Fetch Error:', error)
    throw error
  }
}

export const SearchItems = (commonParams: CommonParameters, requestParams: SearchItemsParameters) =>
  sendRequest('SearchItems', commonParams, requestParams)

export const GetItems = (commonParams: CommonParameters, requestParams: GetItemsParameters) =>
  sendRequest('GetItems', commonParams, requestParams)

export const GetBrowseNodes = (
  commonParams: CommonParameters,
  requestParams: GetBrowseNodesParameters,
) => sendRequest('GetBrowseNodes', commonParams, requestParams)

export const GetVariations = (
  commonParams: CommonParameters,
  requestParams: GetVariationsParameters,
) => sendRequest('GetVariations', commonParams, requestParams)

const amazonPaapi = {
  SearchItems,
  GetItems,
  GetBrowseNodes,
  GetVariations,
}

export default amazonPaapi
