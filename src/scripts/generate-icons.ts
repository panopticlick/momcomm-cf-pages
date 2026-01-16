import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicDir = path.resolve(__dirname, '../../public')

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const kIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4c1d95;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad1)" />
  <text x="50%" y="64%" font-family="Arial, sans-serif" font-weight="800" font-size="260" fill="#fbbf24" text-anchor="middle">M</text>
</svg>
`

const svgBuffer = Buffer.from(kIconSvg)

async function generateIcons() {
  console.log('Generating icons...')

  const tasks = [
    { name: 'favicon.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'og-image.png', size: 1200, height: 630 }, // Generate a static OG image too just in case
  ]

  for (const task of tasks) {
    const filePath = path.join(publicDir, task.name)

    if (task.name === 'og-image.png') {
      // Different SVG for OG Image
      const ogSvg = Buffer.from(`
            <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#1e1b4b;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#4c1d95;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
                </linearGradient>
                 <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="1200" height="630" fill="url(#grad2)" />
              
               <!-- Decoration stars -->
               <g transform="translate(536, 500)">
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" transform="translate(0,0) scale(2)"/>
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" transform="translate(40,0) scale(2)"/>
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" transform="translate(80,0) scale(2)"/>
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" transform="translate(-40,0) scale(2)"/>
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" transform="translate(-80,0) scale(2)"/>
               </g>

              <text x="50%" y="45%" font-family="Arial, sans-serif" font-weight="800" font-size="80" fill="url(#textGrad)" text-anchor="middle">MomComm</text>
              <text x="50%" y="58%" font-family="Arial, sans-serif" font-weight="500" font-size="32" fill="#e2e8f0" text-anchor="middle" letter-spacing="1">The Mom Economy OS</text>
            </svg>
        `)

      await sharp(ogSvg).png().toFile(filePath)
    } else {
      await sharp(svgBuffer).resize(task.size, task.size).png().toFile(filePath)
    }

    console.log(`Generated ${task.name}`)
  }

  // Also convert to ICO for fallback
  // sharp doesn't natively support .ico output directly in older versions easily or requires specific format settings,
  // but browsers satisfy with .png mostly.
  // For true .ico multiple sizes, we needs tools typically not in standard sharp usage without plugin.
  // We'll skip true .ico generation for now and rely on favicon.png which modern browsers use.
  // Actually, we can just save the 32x32 png as favicon.ico as a simple fallback, although not spec compliant it works in many cases.
  // Better: just stick to favicon.png in HTML.

  console.log('Done!')
}

generateIcons().catch(console.error)
