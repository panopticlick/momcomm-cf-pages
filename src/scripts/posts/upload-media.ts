import fs from 'fs'
import path from 'path'

// Note: In Node 18+ global fetch and FormData are available,
// but for file uploads from disk, sometimes we need 'fileFromSync' or specific handling.
// However, since we are using 'tsx', we likely have access to standard stuff.
// Let's try standard fetch and FormData if possible, but reading file into Blob is needed.

const args = process.argv.slice(2)
const [host, apiKey, filePath, altText] = args

if (!host || !apiKey || !filePath || !altText) {
  console.error(
    'Usage: npx tsx src/scripts/posts/upload-media.ts <HOST> <API_KEY> <FILE_PATH> <ALT_TEXT>',
  )
  process.exit(1)
}

async function uploadMedia() {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)

    // Use File instead of Blob for better compatibility with Node's FormData
    const mimeType = fileName.endsWith('.webp') ? 'image/webp' : 'image/png'
    const file = new File([fileBuffer], fileName, { type: mimeType })

    const formData = new FormData()
    // Payload CMS expects non-file fields to be passed as a JSON string in '_payload'
    // when using multipart/form-data, especially for required fields to be correctly validated.
    formData.append(
      '_payload',
      JSON.stringify({
        alt: altText,
        folder: 'posts',
      }),
    )
    formData.append('file', file)

    console.log(`Uploading ${fileName} with alt: "${altText}" to ${host}/api/media...`)
    console.log('Sending request...')

    const response = await fetch(`${host}/api/media`, {
      method: 'POST',
      headers: {
        Authorization: `users API-Key ${apiKey}`,
      },
      body: formData,
      duplex: 'half',
    } as RequestInit)
    console.log(`Response received: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        console.error(`Upload failed: ${response.status} ${response.statusText}`)
        console.error(JSON.stringify(json, null, 2))
      } catch {
        console.error(`Upload failed: ${response.status} ${response.statusText} - ${text}`)
      }
      process.exit(1)
    }

    const data = await response.json()
    console.log(JSON.stringify(data))

    // Save media info to cache for retry scenarios
    // Extract post_id from file path (e.g., tmp/post/3/slug.png -> 3)
    const pathParts = filePath.split(path.sep)
    const postIndex = pathParts.indexOf('post')
    if (postIndex !== -1 && pathParts.length > postIndex + 1) {
      const postId = pathParts[postIndex + 1]
      const cacheDir = path.dirname(filePath)
      const cacheFile = path.join(cacheDir, 'media.json')

      // Ensure directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      // Save cache with media_id and full response
      const cacheData = {
        media_id: data.doc?.id || data.id,
        uploaded_at: new Date().toISOString(),
        file_path: filePath,
        alt_text: altText,
        response: data,
      }

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2))
      console.log(`Cache saved to: ${cacheFile}`)
    }
  } catch (error) {
    console.error('Error uploading media:', error)
    process.exit(1)
  }
}

uploadMedia()
