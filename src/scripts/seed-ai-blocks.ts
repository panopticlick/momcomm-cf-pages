import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)
const env = args[0] || 'dev'

const envFile = path.resolve(__dirname, `../../.agent/workflows/.env.${env}`)

if (!fs.existsSync(envFile)) {
  console.error(`Environment file not found: ${envFile}`)
  process.exit(1)
}

const envConfig = fs.readFileSync(envFile, 'utf-8')
const envVars = envConfig.split('\n').reduce(
  (acc, line) => {
    const [key, value] = line.split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  },
  {} as Record<string, string>,
)

const { HOST, USER_API_KEY } = envVars

if (!HOST || !USER_API_KEY) {
  console.error('Missing HOST or USER_API_KEY in environment file')
  process.exit(1)
}

const seedAiBlocks = async () => {
  try {
    console.log(`--- Seeding AI Blocks (${env}) ---`)
    console.log(`Host: ${HOST}`)

    const headers = {
      Authorization: `users API-Key ${USER_API_KEY}`,
      'Content-Type': 'application/json',
    }

    // 1. Fetch Users (Limit 50)
    const usersResponse = await fetch(`${HOST}/api/users?limit=50`, {
      method: 'GET',
      headers,
    })

    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.statusText}`)
    }

    const usersData = await usersResponse.json()
    const users = usersData.docs || []

    console.log(`Found ${users.length} users`)

    // 2. Check for existing AiBlock
    const existingBlockResponse = await fetch(
      `${HOST}/api/ai-blocks?where[title][equals]=Default AI Settings&limit=1`,
      {
        method: 'GET',
        headers,
      },
    )

    if (!existingBlockResponse.ok) {
      throw new Error(`Failed to fetch AI Blocks: ${existingBlockResponse.statusText}`)
    }

    const existingBlockData = await existingBlockResponse.json()
    const existingAiBlock = existingBlockData.docs?.[0]

    const promptMetadata = `You are an expert SEO Strategist and Content Editor.
Analyze the provided topic data JSON (search terms, product details, weighted scores).

Goal: 
Generate high-conversion SEO metadata and an authoritative "Introductory" section for the article "Best {{ name }}".

Requirements:
1. **Title**: Catchy, includes "Best {{ name }}".
2. **Description**: Click-worthy summary, mentions top brands or key benefits. Do NOT include the year (e.g., 2024 or current year) unless it is explicitly present in "{{ name }}".
3. **Keywords**: Mix of high-volume and long-tail keywords.
4. **Tags**: Relevant product categories.
5. **Excerpt**: A concise summary of the article (1-2 sentences) for preview cards.
6. **Introductory Section (Markdown)**:
   - **Hook**: Immediately address the user's search intent (finding the best {{ name }}).
   - **Authority**: State that we analyzed market data (sales, reviews, features) to find the top picks.
   - **Scope**: Briefly mention what the guide covers (Top rated options, budget picks, buying content).
   - **Tone**: Professional, unbiased, and helpful. Keep it under 200 words.
   - **Tags**: No H1 tags
   
Output MUST be a valid JSON object:
{
  "title": "string",
  "description": "string",
  "excerpt": "string",
  "keywords": ["string"],
  "tags": ["string"],
  "introductory": "markdown string"
}

Do not include any explanation or text outside of the JSON block.`

    const promptContent = `You are a Senior Product Reviewer and SEO Content Specialist.
The page ALREADY contains:
1. An "Introduction" section.
2. A "Top {{ name }} Products" visual list.

Your task: Generate the "Main Content" (Deep Dive Reviews), "Buying Guide", "FAQ", and "Conclusion".

SEO Content Strategy:
1. **Assign Superlatives**: For each of the top 3-5 products, assign a specific "Best For" tag (e.g., "Best Overall", "Best Value", "Best for Beginners").
2. **Focus on Benefits**: Explain *how* features help the user. Use **bold text** to highlight key specifications and unique selling points for better skimmability.
3. **Cross-Product Comparisons**: Within reviews, occasionally compare products to one another (e.g., "While the [Product A](/go/asinA) offers more power, this model is significantly more portable").
4. **Brand Linking**: When a product has a \`brandSlug\` in its data, link the brand name to its page on first mention using \`[Brand Name](/brand/{brandSlug})\`. If \`brandSlug\` is missing, do NOT link. Only link each brand once per section.
5. **Structure**: Use clear H2/H3 headers. Group related information logically.
6. **Shortcodes**: Use tags that are highly relevant to the current niche.
   - **Topics**: Use \`{{ topics tags=["Tag Name 1", "Tag Name 2"] limit=3 h3="Related Buying Guides" subtitle="More guides you might find helpful" }}\` to link to **"Best XXX" themed topic collections**.
  - **Important**: Tags MUST be **Title Case** (e.g., "Toddler Sleep Sacks", "Convertible Strollers"), NOT slugs (e.g., "toddler-sleep-sacks").
   - **Posts**: Use \`{{ posts tags=["Tag Name 1"] limit=3 h3="Related Articles" subtitle="More articles you might find helpful" }}\` to link to **individual blog posts**.
   - **CRITICAL**: Do NOT use shortcodes in the "Introduction" or "Conclusion" sections. Place them strategically between content blocks.

Task Requirements:
12. **Detailed Reviews**:
   - **Section Header (H2)**: Use a variation based on these templates or create a similar high-impact header:
     - "## Detailed Reviews of the Best {{ name }}"
     - "## In-Depth Analysis: The Top Performers"
     - "## Expert Picks: {{ name }} Reviews"
     - "## Comparison: Finding the Right {{ name }} for You"
     - "## Ranking the Best {{ name }} Currently on the Market"
     - "## Comprehensive Reviews: {{ name }} That Deliver"
     - "## Our Top Picks: Evaluating the Best {{ name }}"
     - "## The Definitive Guide to {{ name }}: In-Depth Reviews"
     - "## Best {{ name }} of [Year]: Our Top Selects"
     - "## Performance Review: The Top {{ name }} Tested"
   - **H3**: [Product Name] - [Superlative]
   - **Verdict**: A 1-2 sentence summary of why this is a top pick.
   - **Buy Link**: Include \`[Check Price on Amazon](/go/{asin})\` (replacing \`{asin}\` with the actual ASIN).
   - **Why We Like It**: Deep analysis. **Bold** the most important pros.
   - **Pros**: Bullet points.
   - **Cons**: Bullet points.

3. **Buying Guide & Selection Criteria**:
   - **Section Header (H2)**: Use a variation based on these templates:
     - "## How to Choose the Best {{ name }}"
     - "## Buying Guide & Selection Criteria"
     - "## What to Look for in a Quality {{ name }}"
     - "## Essential Features of a Reliable {{ name }}"
     - "## Buyer's Checklist: Selecting Your Next {{ name }}"
     - "## Decoding the Specs: Your {{ name }} Purchase Guide"
     - "## Pro Tips for Choosing the Perfect {{ name }}"
     - "## From Novice to Pro: Picking the Right {{ name }}"
     - "## Factors to Consider Before Buying your {{ name }}"
     - "## The Ultimate {{ name }} Selection Guide"
   - **Our Process**: Briefly mention 2-3 criteria used to select these products (e.g., durability tests, user rating analysis, specification comparisons) to build trust.
   - **Key Factors**: Discuss 3-4 critical factors specific to this category.

4. **FAQ**:
   - **Section Header (H2)**: Use a variation:
     - "## Frequently Asked Questions"
     - "## People Also Ask About {{ name }}"
     - "## Key Questions Answered: {{ name }}"
     - "## Common Concerns and Expert Answers"
     - "## Everything You Need to Know: {{ name }} FAQ"
     - "## Troubleshooting and Tips for {{ name }}"
     - "## Understanding {{ name }}: Frequently Asked Questions"
     - "## Expert Insights: Your {{ name }} Questions, Answered"
   - Include 3-5 niche-specific questions and helpful answers.

5. **Conclusion**:
   - **Section Header (H2)**: Use a variation:
     - "## Final Verdict"
     - "## Which {{ name }} Should You Choose?"
     - "## Wrapping Up: Making the Right Selection"
     - "## Summary: Finding Your Perfect {{ name }}"
     - "## Closing Thoughts: Evaluating the Best {{ name }}"
     - "## The Bottom Line on {{ name }}"
     - "## Choosing Your Next {{ name }}: Final Recommendations"
     - "## Final Assessment of the Top {{ name }}"
   - Final recommendation based on different user needs.

Format:
- Use Markdown.
- No H1 tag.
- No new Introduction.
- Do NOT generate a Table of Contents.
- Do NOT use internal anchor links (e.g., [Section](#section)).`

    const authorIds = users.map((user: any) => ({
      relationTo: 'users',
      value: user.id,
    }))

    const payloadData = {
      prompt_metadata: promptMetadata,
      prompt_content: promptContent,
      authors: authorIds,
    }

    if (existingAiBlock) {
      console.log('AiBlock "Default AI Settings" already exists. Updating prompts...')
      const updateResponse = await fetch(`${HOST}/api/ai-blocks/${existingAiBlock.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payloadData),
      })

      if (!updateResponse.ok) {
        throw new Error(`Failed to update AiBlock: ${updateResponse.statusText}`)
      }
      console.log(`Successfully updated AiBlock: ${existingAiBlock.title}`)
    } else {
      console.log('Creating "Default AI Settings" AiBlock...')
      const createResponse = await fetch(`${HOST}/api/ai-blocks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Default AI Settings',
          ...payloadData,
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create AiBlock: ${createResponse.statusText}`)
      }
      const newBlock = await createResponse.json()
      console.log(`Successfully created AiBlock: ${newBlock.doc.title}`)
    }
  } catch (error) {
    console.error('Error seeding AiBlocks:', error)
    process.exit(1)
  }

  console.log('--- Seeding Complete ---')
  process.exit(0)
}

seedAiBlocks()
