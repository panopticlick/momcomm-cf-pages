import 'dotenv/config'

const finalizePost = async () => {
  const args = process.argv.slice(2)

  if (args.length < 4) {
    console.error(
      'Usage: tsx src/scripts/posts/finalize-post.ts <host> <apiKey> <postId> <mediaId>',
    )
    process.exit(1)
  }

  const [host, apiKey, postId, mediaId] = args

  // Payload expects numeric IDs for Postgres
  const featuredMediaId = !isNaN(Number(mediaId)) ? Number(mediaId) : mediaId

  try {
    const response = await fetch(`${host}/api/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `users API-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        featured_media: featuredMediaId,
        ai_status: 'completed',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error finalizing post: ${response.status} ${response.statusText}`)
      console.error(errorText)
      process.exit(1)
    }

    const result = await response.json()

    // Verify featured_media is linked
    const returnedMedia = result.doc.featured_media
    const returnedMediaId =
      typeof returnedMedia === 'object' && returnedMedia !== null ? returnedMedia.id : returnedMedia

    // Loose equality check for string/number mismatch
    if (returnedMediaId != featuredMediaId) {
      console.error(
        `Error: featured_media linkage failed. Expected ${featuredMediaId}, got ${returnedMediaId}`,
      )
      console.error('Full doc:', JSON.stringify(result.doc, null, 2))
      process.exit(1)
    }

    console.log(
      JSON.stringify({
        message: 'Post finalized successfully',
        id: result.doc.id,
        featured_media: returnedMediaId,
        status: 'success',
      }),
    )
    process.exit(0)
  } catch (error) {
    console.error('Error finalizing post:', error)
    process.exit(1)
  }
}

finalizePost()
