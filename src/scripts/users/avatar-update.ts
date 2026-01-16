const args = process.argv.slice(2)
const [host, apiKey, userId, mediaId] = args

if (!host || !apiKey || !userId || !mediaId) {
  console.error(
    'Usage: npx tsx src/scripts/users/avatar-update.ts <HOST> <API_KEY> <USER_ID> <MEDIA_ID>',
  )
  process.exit(1)
}

async function updateAvatar() {
  try {
    console.log(`Updating user ${userId} with avatar ${mediaId} at ${host}/api/users/${userId}...`)

    const response = await fetch(`${host}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `users API-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar: parseInt(mediaId, 10),
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        console.error(`Update failed: ${response.status} ${response.statusText}`)
        console.error(JSON.stringify(json, null, 2))
      } catch {
        console.error(`Update failed: ${response.status} ${response.statusText} - ${text}`)
      }
      process.exit(1)
    }

    const data = await response.json()

    // Verify avatar is linked
    const returnedAvatar = data.doc.avatar
    const returnedAvatarId =
      typeof returnedAvatar === 'object' && returnedAvatar !== null
        ? returnedAvatar.id
        : returnedAvatar

    // Loose equality check for string/number mismatch
    if (returnedAvatarId != mediaId) {
      console.error(`Error: avatar linkage failed. Expected ${mediaId}, got ${returnedAvatarId}`)
      console.error('Full doc:', JSON.stringify(data.doc, null, 2))
      process.exit(1)
    }

    console.log(
      JSON.stringify({
        message: 'User avatar updated successfully',
        id: data.doc.id,
        avatar: returnedAvatarId,
        status: 'success',
      }),
    )
  } catch (error) {
    console.error('Error updating user avatar:', error)
    process.exit(1)
  }
}

updateAvatar()
