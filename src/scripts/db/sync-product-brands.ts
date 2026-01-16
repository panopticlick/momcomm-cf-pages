import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { convertToSlug } from '../../utilities/convert-to-slug'

// npx tsx src/scripts/db/sync-product-brands.ts
async function syncProductBrands() {
  // Initialize Payload
  // Note: If you encounter DB errors like '42804', it might be due to schema mismatches.
  // Ensure migrations are applied or the DB schema matches the code.
  const payload = await getPayload({ config })

  console.log('Fetching products with PAAPI5 data to sync brands...')

  let page = 1
  const limit = 100
  let processed = 0
  let updated = 0
  let createdBrands = 0

  while (true) {
    const products = await payload.find({
      collection: 'products',
      where: {
        and: [
          {
            status: {
              equals: 'COMPLETED',
            },
          },
          {
            paapi5: {
              exists: true,
            },
          },
          // We iterate all COMPLETED products to ensure they have brands synced.
          // Note: We do NOT filter by brand: { exists: false } here because updating the records
          // while paginating causes items to be skipped (page n+1 of the shrinking set skips items).
          // Instead, we filter in memory.
        ],
      },
      limit,
      page,
      depth: 0,
    })

    if (products.docs.length === 0) {
      break
    }

    console.log(`Processing batch ${page}, found ${products.docs.length} products...`)

    for (const product of products.docs) {
      processed++
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itemData = product.paapi5 as any

      if (!itemData || !itemData.ItemInfo) {
        continue
      }

      const brandName =
        itemData.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ||
        itemData.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue

      if (!brandName) {
        console.log(`Skipping product ${product.asin}: No brand name found in PAAPI data`)
        continue
      }

      const brandSlug = convertToSlug(brandName)

      try {
        let brandId: string | number | null = null

        // Check if brand exists
        const existingBrand = await payload.find({
          collection: 'brands',
          where: {
            slug: {
              equals: brandSlug,
            },
          },
          limit: 1,
        })

        if (existingBrand.totalDocs > 0) {
          brandId = existingBrand.docs[0].id
        } else {
          // Create new brand
          // handle potential race conditions or duplicates if running multiple scripts
          try {
            const newBrand = await payload.create({
              collection: 'brands',
              data: {
                name: brandName,
                slug: brandSlug,
              },
            })
            brandId = newBrand.id
            createdBrands++
            console.log(`Created new brand: ${brandName}`)
          } catch (e) {
            // If create failed (e.g. duplicate slug race condition), try finding it again
            const retryFind = await payload.find({
              collection: 'brands',
              where: { slug: { equals: brandSlug } },
              limit: 1,
            })
            if (retryFind.totalDocs > 0) {
              brandId = retryFind.docs[0].id
            } else {
              console.error(`Failed to create brand ${brandName} and could not find it:`, e)
              continue
            }
          }
        }

        if (brandId) {
          // Optimization: Skip update if brand is already set correctly
          if (product.brand === brandId) {
            continue
          }

          await payload.update({
            collection: 'products',
            id: product.id,
            data: {
              brand: brandId,
            },
          })
          updated++
          // console.log(`Updated product ${product.asin} with brand ${brandName}`)
        }
      } catch (error) {
        console.error(`Error processing product ${product.asin}:`, error)
      }
    }

    page++
  }

  console.log(`Sync completed.`)
  console.log(`Processed: ${processed}`)
  console.log(`Updated Products: ${updated}`)
  console.log(`Created Brands: ${createdBrands}`)
  process.exit(0)
}

syncProductBrands()
