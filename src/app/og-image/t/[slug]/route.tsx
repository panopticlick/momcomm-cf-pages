import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site-config'

export const runtime = 'edge'

const size = {
  width: 1200,
  height: 630,
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch topic data from our internal API
  let data
  try {
    // Note: We need to traverse up two levels from 't/[slug]' to get to root, or just build URL from host
    // The previous code worked because it constructed URL from protocol + host
    const res = await fetch(`${siteConfig.url}/api/og-data/t/${slug}`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      data = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch OG data', e)
  }

  // Fallback / Formatting
  const rawTitle = data?.title || slug
  let title = rawTitle
    .split(/[- ]+/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  if (title.length > 40) {
    title = title.substring(0, 40).trim() + '...'
  }

  const mainSubtitle = data?.subtitle || 'MomComm gear review & comparison'
  const brandList: string[] = data?.topBrands || []
  const topImages: string[] = data?.topImages || []
  const dateObj = new Date()
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#f6efe6',
        fontFamily: 'Georgia',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '100%',
          background: 'linear-gradient(270deg, #f2d6c6 0%, transparent 100%)',
          opacity: 0.5,
        }}
      />

      {/* Left Section: Text Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '55%',
          padding: '50px 20px 50px 60px', // Right padding to prevent text touching images
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        {/* Header Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#c45933',
            borderRadius: 50,
            padding: '10px 28px',
            alignSelf: 'flex-start',
            marginBottom: 40,
            boxShadow: '0 4px 12px rgba(196, 89, 51, 0.25)',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            MomComm Gear Review
          </span>
        </div>

        <h1
          style={{
            fontSize: 64, // Reduced from 72 to prevent overflow
            fontWeight: 900,
            color: '#2b1b14',
            lineHeight: 1.1,
            marginBottom: 30,
            letterSpacing: '-0.02em',
            textTransform: 'capitalize',
          }}
        >
          Best {title}
        </h1>

        <p
          style={{
            fontSize: 30,
            color: '#6b4c40',
            fontWeight: 500,
            marginTop: 30,
            marginBottom: 48,
            maxWidth: '95%',
            lineHeight: 1.4,
          }}
        >
          {mainSubtitle}
        </p>

        {/* Brand List (Horizontal) */}
        {brandList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
            {brandList.slice(0, 3).map((brand, i) => (
              // Limited to 3 to save space
              <span
                key={i}
                style={{
                  fontSize: 18,
                  color: '#334155',
                  background: 'white',
                  padding: '8px 20px',
                  borderRadius: 50,
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                }}
              >
                {brand}
              </span>
            ))}
          </div>
        )}

        {/* Footer Date/Brand */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${siteConfig.url}/favicon.png`}
            alt="Logo"
            width="32"
            height="32"
            style={{ borderRadius: 8 }}
          />
          <span style={{ fontSize: 22, color: '#0f172a', fontWeight: 700 }}>{siteConfig.name}</span>
          <span style={{ fontSize: 22, color: '#cbd5e1' }}>•</span>
          <span style={{ fontSize: 22, color: '#64748b', fontWeight: 500 }}>{dateStr}</span>
        </div>
      </div>

      {/* Right Section: Images */}
      <div
        style={{
          display: 'flex',
          width: '45%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          paddingRight: 40,
        }}
      >
        {/* Images Grid Layout */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          {/* Main Large Image */}
          {topImages.length > 0 ? (
            <>
              {topImages[0] && (
                <div
                  style={{
                    display: 'flex',
                    width: 260,
                    height: 340,
                    background: 'white',
                    borderRadius: 24,
                    padding: 20,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: '4px solid white',
                    marginRight: 32,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={topImages[0]}
                    alt=""
                    width="220"
                    height="280"
                    style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: '#fbbf24',
                      color: 'white',
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 18,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      zIndex: 10,
                    }}
                  >
                    #1
                  </div>
                </div>
              )}

              {/* Right Column with smaller images */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {topImages[1] && (
                  <div
                    style={{
                      display: 'flex',
                      width: 160,
                      height: 160,
                      background: 'white',
                      borderRadius: 20,
                      padding: 12,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 21,
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={topImages[1]}
                      alt=""
                      width="130"
                      height="130"
                      style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: '#94a3b8', // Silver
                        color: 'white',
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 14,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 10,
                      }}
                    >
                      #2
                    </div>
                  </div>
                )}
                {topImages[2] && (
                  <div
                    style={{
                      display: 'flex',
                      width: 160,
                      height: 160,
                      background: 'white',
                      borderRadius: 20,
                      padding: 12,
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={topImages[2]}
                      alt=""
                      width="130"
                      height="130"
                      style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: '#d97706', // Bronze
                        color: 'white',
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 14,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 10,
                      }}
                    >
                      #3
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Fallback visual
            <div
              style={{
                display: 'flex',
                width: 320,
                height: 320,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px dashed #cbd5e1',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <span style={{ fontSize: 24, color: '#94a3b8', fontWeight: 600 }}>Top Products</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  )
}
