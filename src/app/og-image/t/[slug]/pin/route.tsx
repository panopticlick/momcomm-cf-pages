import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site-config'
// import { getTopicOgData } from '@/services/topics/get-topic-og-data' // Disabled for Edge runtime

export const runtime = 'edge'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch topic data from our internal API (since we're in Edge runtime)
  let data
  try {
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

  if (title.length > 50) {
    title = title.substring(0, 50).trim() + '...'
  }

  const mainSubtitle = data?.subtitle || 'MomComm gear review & comparison'
  const brandList: string[] = data?.topBrands || []
  const topImages: string[] = data?.topImages || []
  // Format date as "December 2025"
  const dateObj = new Date()
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f6efe6',
        fontFamily: 'Georgia',
        position: 'relative',
      }}
    >
      {/* Background Gradients */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '40%',
          background: 'linear-gradient(180deg, #f2d6c6 0%, transparent 100%)',
          opacity: 0.5,
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 60px',
          flex: 1,
          position: 'relative',
          zIndex: 10,
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Header Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#c45933',
            borderRadius: 50,
            padding: '12px 32px',
            marginBottom: 50,
            boxShadow: '0 8px 20px rgba(196, 89, 51, 0.25)',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 22,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            MomComm Gear Review
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: '#2b1b14',
            lineHeight: 1.05,
            marginBottom: 30,
            letterSpacing: '-0.03em',
            textTransform: 'capitalize', // Ensure capitalization visually
            maxWidth: '90%',
          }}
        >
          Best {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 34,
            color: '#6b4c40',
            fontWeight: 500,
            marginTop: 0,
            marginBottom: 80,
            maxWidth: '80%',
          }}
        >
          {mainSubtitle} • {dateStr}
        </p>

        {/* Product Images Grid */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            width: '100%',
            justifyContent: 'center',
            marginBottom: 80,
          }}
        >
          {topImages.length > 0 ? (
            topImages.map((img, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  width: 280,
                  height: 360, // Taller cards
                  background: 'white',
                  borderRadius: 24,
                  padding: 24,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.02)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.8)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: i === 0 ? '#fbbf24' : '#e2e8f0',
                    color: i === 0 ? '#fff' : '#64748b',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  #{i + 1}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  width="240"
                  height="240" // Contain within card
                  style={{
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </div>
            ))
          ) : (
            // Fallback placeholders if no images
            <div
              style={{
                display: 'flex',
                width: '80%',
                height: 360,
                background: 'white',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ fontSize: 32, color: '#94a3b8', fontWeight: 600 }}>
                Top Products Analyzed
              </span>
            </div>
          )}
        </div>

        {/* Brand List */}
        {brandList.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              marginTop: 'auto',
            }}
          >
            <span
              style={{
                fontSize: 20,
                textTransform: 'uppercase',
                color: '#94a3b8',
                letterSpacing: '0.15em',
                fontWeight: 700,
              }}
            >
              Featuring Top Brands
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
              {brandList.map((brand, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 24,
                    color: '#334155',
                    background: 'white',
                    padding: '12px 28px',
                    borderRadius: 50,
                    fontWeight: 600,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <div
        style={{
          height: 100,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 60px',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${siteConfig.url}/favicon.png`}
            alt="Logo"
            width="48"
            height="48"
            style={{ borderRadius: 12 }}
          />
          <span
            style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}
          >
            {siteConfig.name}
          </span>
        </div>
        <span style={{ fontSize: 24, color: '#64748b', fontWeight: 500 }}>vbestreviews.com</span>
      </div>
    </div>,
    {
      width: 1000,
      height: 1500,
    },
  )
}
