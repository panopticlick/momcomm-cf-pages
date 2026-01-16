import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const [host, apiKey, filePath, altText] = args

if (!host || !apiKey || !filePath || !altText) {
  console.error(
    'Usage: npx tsx src/scripts/users/avatar-upload.ts <HOST> <API_KEY> <FILE_PATH> <ALT_TEXT>',
  )
  process.exit(1)
}

async function uploadAvatar() {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }

    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const mimeType = fileName.endsWith('.webp') ? 'image/webp' : 'image/png'
    const file = new File([fileBuffer], fileName, { type: mimeType })

    const formData = new FormData()
    formData.append(
      '_payload',
      JSON.stringify({
        alt: altText,
        folder: 'avatars',
      }),
    )
    formData.append('file', file)

    // console.log(`Uploading ${fileName} with alt: "${altText}" to ${host}/api/media...`)

    const response = await fetch(`${host}/api/media`, {
      method: 'POST',
      headers: {
        Authorization: `users API-Key ${apiKey}`,
      },
      body: formData,
      duplex: 'half',
    } as RequestInit)

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
    console.log(
      JSON.stringify({
        id: data.doc?.id || data.id,
        status: 'success',
      }),
    )

    // Cache logic for workflow
    const pathParts = filePath.split(path.sep)
    const usersIndex = pathParts.indexOf('users')

    if (usersIndex !== -1 && pathParts.length > usersIndex + 1) {
      const cacheDir = path.dirname(filePath)
      const cacheFile = path.join(cacheDir, 'media.json')

      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      const cacheData = {
        media_id: data.doc?.id || data.id,
        uploaded_at: new Date().toISOString(),
        file_path: filePath,
        alt_text: altText,
        response: data,
      }

      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2))
      // console.log(`Cache saved to: ${cacheFile}`)
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    process.exit(1)
  }
}

uploadAvatar()
