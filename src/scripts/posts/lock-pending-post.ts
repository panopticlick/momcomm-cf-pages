import 'dotenv/config'

const lockPendingPost = async () => {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: tsx src/scripts/posts/lock-pending-post.ts <host> <apiKey>')
    process.exit(1)
  }

  const [host, apiKey] = args

  try {
    // 1. Fetch the oldest pending post
    const query = new URLSearchParams({
      'where[ai_status][equals]': 'pending',
      sort: 'createdAt',
      limit: '1',
    })

    const response = await fetch(`${host}/api/posts?${query.toString()}`, {
      headers: {
        Authorization: `users API-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Error fetching posts: ${response.status} ${response.statusText}`)
      process.exit(1)
    }

    const result = await response.json()

    if (result.docs.length === 0) {
      console.error('No pending posts found.')
      process.exit(1)
    }

    const post = result.docs[0]

    // 2. Lock the post by updating status
    const updateResponse = await fetch(`${host}/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `users API-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ai_status: 'processing_content',
        title: post.title.replace(/!/g, ''),
      }),
    })

    if (!updateResponse.ok) {
      console.error(`Error locking post: ${updateResponse.status} ${updateResponse.statusText}`)
      process.exit(1)
    }

    const updatedPost = await updateResponse.json()

    // Output JSON for the workflow to parse
    console.log(
      JSON.stringify({
        id: updatedPost.doc.id, // Payload API returns { doc: ... } on update
        title: updatedPost.doc.title.replace(/!/g, ''),
        slug: updatedPost.doc.slug,
      }),
    )

    process.exit(0)
  } catch (error) {
    console.error('Error locking pending post:', error)
    process.exit(1)
  }
}

lockPendingPost()
