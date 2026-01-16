import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const [host, apiKey, dataPath] = args

if (!host || !apiKey || !dataPath) {
  console.error('Usage: npx tsx src/scripts/users/create.ts <HOST> <API_KEY> <DATA_JSON_PATH>')
  process.exit(1)
}

async function createUser() {
  try {
    if (!fs.existsSync(dataPath)) {
      console.error(`File not found: ${dataPath}`)
      process.exit(1)
    }

    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const userData = JSON.parse(fileContent)

    console.log(`Creating user ${userData.name} at ${host}/api/users...`)

    const response = await fetch(`${host}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${apiKey}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        console.error(`Creation failed: ${response.status} ${response.statusText}`)
        console.error(JSON.stringify(json, null, 2))
      } catch {
        console.error(`Creation failed: ${response.status} ${response.statusText} - ${text}`)
      }
      process.exit(1)
    }

    const data = await response.json()
    const doc = data.doc || data
    console.log(JSON.stringify({ id: doc.id, email: doc.email, name: doc.name, slug: doc.slug }))

    // Optional: Cache result back to data.json or a new file if needed,
    // but the workflow expects std output logic mostly.
  } catch (error) {
    console.error('Error creating user:', error)
    process.exit(1)
  }
}

createUser()
