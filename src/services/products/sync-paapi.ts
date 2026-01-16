import { BasePayload } from 'payload'
import { GetItems } from '@/services/amazon-paapi-edge'
import { convertToSlug } from '@/utilities/convert-to-slug'

export type SyncResult = {
  processed: number
  success: number
  errors: number
  message?: string
}

export async function syncProductsWithPaapi(
  payload: BasePayload,
  limit: number = 10,
): Promise<SyncResult> {
  // 1. Find PENDING products
  const products = await payload.find({
    collection: 'products',
    where: {
      status: { equals: 'PENDING' },
    },
    limit,
    sort: 'createdAt',
  })

  if (products.totalDocs === 0) {
    return { processed: 0, success: 0, errors: 0, message: 'No pending products found' }
  }

  console.log(`Processing ${products.docs.length} products...`)

  // 2. Mark them as PROCESSING
  const productIds = products.docs.map((p) => p.id)
  await payload.update({
    collection: 'products',
    where: {
      id: { in: productIds },
    },
    data: {
      status: 'PROCESSING',
    },
  })

  // Filter valid ASINs
  const asins = products.docs.map((p) => p.asin).filter((asin): asin is string => !!asin)

  if (asins.length === 0) {
    // Mark all as error? Or just return?
    // If they have no ASIN, they are invalid 'products' for this purpose.
    // The query 'products.docs' maps to ids. We should probably mark them as error if they lack ASIN.
    // But for now, existing logic just returned. Let's stick closer to existing logic but improve it if possible.
    // Actually, type definition says asin is required.
    return {
      processed: productIds.length,
      success: 0,
      errors: productIds.length,
      message: 'No valid ASINs found in batch',
    }
  }

  // 3. Call PAAPI5
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let errors: any[] = []

  try {
    const commonParams = {
      AccessKey: process.env.PAAPI_ACCESS_KEY || '',
      SecretKey: process.env.PAAPI_SECRET_KEY || '',
      PartnerTag: process.env.PAAPI_PARTNER_TAG || '',
      Marketplace: 'www.amazon.com',
    }

    const requestParams = {
      ItemIds: asins,
      Resources: [
        'BrowseNodeInfo.WebsiteSalesRank',
        'BrowseNodeInfo.BrowseNodes',
        'Images.Primary.Large',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ContentInfo',
        'ItemInfo.ExternalIds',
        'ItemInfo.Features',
        'ItemInfo.ManufactureInfo',
        'ItemInfo.ProductInfo',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.Title',
        'ItemInfo.TradeInInfo',
        'Offers.Listings.Condition',
        'Offers.Listings.MerchantInfo',
        'Offers.Listings.Price',
      ],
    }

    const response = await GetItems(commonParams, requestParams)
    items = response?.ItemsResult?.Items || []
    errors = [...(response?.ItemsResult?.Errors || []), ...(response?.Errors || [])]
  } catch (err) {
    console.error('PAAPI Batch Request Error:', err)
    // Revert status to ERROR
    await payload.update({
      collection: 'products',
      where: {
        id: { in: productIds },
      },
      data: {
        status: 'ERROR',
        message: err instanceof Error ? err.message : 'Unknown PAAPI error',
      },
    })
    return {
      processed: productIds.length,
      success: 0,
      errors: productIds.length,
      message: `PAAPI Request Failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }
  }

  const itemsMap = new Map()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items.forEach((item: any) => {
    itemsMap.set(item.ASIN, item)
  })

  const errorsMap = new Map()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors.forEach((err: any) => {
    let asin = err.ASIN

    // Try to extract ASIN from message if not present
    if (!asin && err.Code === 'InvalidParameterValue' && err.Message) {
      const match = err.Message.match(/.*ItemIds? (.*) provided.*/)
      if (match) asin = match[1]
    } else if (!asin && err.Code === 'ItemNotAccessible' && err.Message) {
      const match = err.Message.match(/.*ItemIds? (.*) is not accessible.*/)
      if (match) asin = match[1]
    }

    if (asin) {
      errorsMap.set(asin, err)
    }
  })

  let successCount = 0
  let errorCount = 0

  // 4. Update products with results
  for (const product of products.docs) {
    const itemCode = product.asin
    const itemData = itemsMap.get(itemCode)
    const errorData = errorsMap.get(itemCode)

    if (itemData) {
      let brandId = product.brand
      if (brandId && typeof brandId === 'object' && 'id' in brandId) {
        brandId = brandId.id
      }

      const brandName =
        itemData.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ||
        itemData.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue

      if (brandName) {
        // 通过 name 作为唯一标识查找品牌
        const existingBrand = await payload.find({
          collection: 'brands',
          where: {
            name: {
              equals: brandName,
            },
          },
          limit: 1,
        })

        if (existingBrand.totalDocs > 0) {
          brandId = existingBrand.docs[0].id
        } else {
          try {
            // 生成唯一的 slug，如果重复则添加数字后缀
            let brandSlug = convertToSlug(brandName)
            let slugSuffix = 0

            // 检查 slug 是否已存在，最多尝试 100 次
            const MAX_SLUG_ATTEMPTS = 100
            while (slugSuffix < MAX_SLUG_ATTEMPTS) {
              const slugToCheck = slugSuffix === 0 ? brandSlug : `${brandSlug}-${slugSuffix}`
              const existingSlug = await payload.find({
                collection: 'brands',
                where: {
                  slug: {
                    equals: slugToCheck,
                  },
                },
                limit: 1,
              })

              if (existingSlug.totalDocs === 0) {
                brandSlug = slugToCheck
                break
              }
              slugSuffix++
            }

            const newBrand = await payload.create({
              collection: 'brands',
              data: {
                name: brandName,
                slug: brandSlug,
              },
            })
            brandId = newBrand.id
          } catch (error) {
            console.warn(`Failed to create brand: ${brandName}`, error)
          }
        }
      }

      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          status: 'COMPLETED',
          active: true,
          paapi5: itemData,
          brand: brandId,
          message: 'Successfully fetched from PAAPI5',
          completed_at: new Date().toISOString(),
          image: itemData.Images?.Primary?.Large?.URL || product.image,
        },
      })
      successCount++
    } else if (errorData) {
      console.log(errorData)
      let status: 'COMPLETED' | 'ERROR' | 'NOT_FOUND' = 'COMPLETED'
      let active = false
      let message = `PAAPI Error: ${errorData.Message} (${errorData.Code})`

      if (errorData.Code === 'InvalidParameterValue') {
        // Product not found
        console.warn(`Product not found: ${itemCode}`)
        status = 'NOT_FOUND'
        active = false
        message = 'Product not found'
      } else if (errorData.Code === 'ItemNotAccessible') {
        // Item not accessible
        console.warn(`Product not accessible: ${itemCode}`)
        status = 'ERROR'
        active = false
        message = 'Product not accessible'
        errorCount++
      } else {
        // Other errors
        console.warn(`PAAPI Error for ${itemCode}: ${errorData.Code} ${errorData.Message}`)
        status = 'ERROR'
        active = false // Default to inactive on error? Or keep as is? Original used false.
        errorCount++
      }

      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          status,
          active,
          message,
          completed_at: new Date().toISOString(),
        },
      })
    } else {
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          status: 'ERROR',
          message: 'ASIN not returned in PAAPI response',
          active: false,
        },
      })
      errorCount++
    }
  }

  return {
    processed: products.docs.length,
    success: successCount,
    errors: errorCount + errors.length, // Rough count
    message: 'Batch processing completed',
  }
}
