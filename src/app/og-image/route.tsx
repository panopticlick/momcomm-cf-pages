import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site-config'

export const runtime = 'edge'

const size = {
  width: 1200,
  height: 630,
}

export async function GET(request: Request) {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #f6efe6, #f0e4d7 50%, #f8f1ea)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#2b1b14',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 15% 20%, rgba(238, 137, 97, 0.2), transparent 55%), radial-gradient(circle at 80% 30%, rgba(78, 156, 150, 0.18), transparent 50%)',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40,
          filter: 'drop-shadow(0 10px 30px rgba(177, 106, 74, 0.35))',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${siteConfig.url}/favicon.png`} alt="Logo" width="128" height="128" />
      </div>

      <div
        style={{
          fontSize: 70,
          fontWeight: 800,
          color: '#c45933',
          marginTop: 0,
          marginBottom: 20,
          letterSpacing: -1,
          textShadow: '0 8px 20px rgba(196, 89, 51, 0.15)',
        }}
      >
        {siteConfig.name}
      </div>

      <div
        style={{
          fontSize: 32,
          color: '#4c2f24',
          textAlign: 'center',
          maxWidth: '80%',
          fontWeight: 500,
          letterSpacing: 0.5,
        }}
      >
        The Mom Economy OS — Gear, Stacks, and Ventures
      </div>

      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          gap: 16,
          opacity: 0.8,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              backgroundColor: i === 2 ? '#c45933' : '#4e9c96',
              opacity: 0.9,
            }}
          />
        ))}
      </div>
    </div>,
    {
      ...size,
    },
  )
}
