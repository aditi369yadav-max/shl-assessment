import { useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  onStartChat: () => void
}

const LOGOS = [
  { name: 'Vortex', letter: 'V' },
  { name: 'Nimbus', letter: 'N' },
  { name: 'Prysma', letter: 'P' },
  { name: 'Cirrus', letter: 'C' },
  { name: 'Kynder', letter: 'K' },
  { name: 'Halcyn', letter: 'H' },
]

const LOGO_COLORS = [
  'rgba(99,102,241,0.15)',
  'rgba(168,85,247,0.15)',
  'rgba(6,182,212,0.15)',
  'rgba(16,185,129,0.15)',
  'rgba(245,158,11,0.15)',
  'rgba(239,68,68,0.15)',
]

export default function HeroPage({ onStartChat }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const animFrameRef = useRef<number>(0)

  // Custom JS-controlled fade loop exactly per spec
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let startTime: number | null = null
    let phase: 'fadein' | 'playing' | 'fadeout' = 'fadein'
    const FADE_DURATION = 500 // ms

    function tick(now: number) {
      if (!video) return

      if (phase === 'fadein') {
        if (startTime === null) startTime = now
        const elapsed = now - startTime
        video.style.opacity = String(Math.min(elapsed / FADE_DURATION, 1))
        if (elapsed >= FADE_DURATION) {
          video.style.opacity = '1'
          phase = 'playing'
          startTime = null
        }
      } else if (phase === 'playing') {
        const remaining = (video.duration - video.currentTime) * 1000
        if (remaining <= FADE_DURATION) {
          phase = 'fadeout'
          startTime = now
        }
      } else if (phase === 'fadeout') {
        if (startTime === null) startTime = now
        const elapsed = now - startTime
        video.style.opacity = String(Math.max(1 - elapsed / FADE_DURATION, 0))
        if (elapsed >= FADE_DURATION) {
          video.style.opacity = '0'
        }
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    function onEnded() {
      if (!video) return
      video.style.opacity = '0'
      phase = 'fadein'
      startTime = null
      setTimeout(() => {
        video.currentTime = 0
        video.play().catch(() => {})
      }, 100)
    }

    video.style.opacity = '0'
    video.addEventListener('ended', onEnded)
    animFrameRef.current = requestAnimationFrame(tick)
    video.play().catch(() => {})

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      video.removeEventListener('ended', onEnded)
    }
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'hsl(260, 87%, 3%)' }}
    >
      {/* ── Background video ──────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0,
          zIndex: 0,
        }}
      />

      {/* ── Hero content sits above video ─────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen" style={{ overflow: 'visible' }}>

        {/* ── Navbar ───────────────────────────────────────────────────────── */}
        <nav
          style={{
            width: '100%',
            padding: '20px 32px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="rgba(99,102,241,0.15)" />
              <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="rgba(255,255,255,0.12)" />
              <path d="M8 22L14 10L20 18L23 14L26 18" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="logoGrad" x1="8" y1="22" x2="26" y2="10" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/>
                  <stop offset="0.5" stopColor="#a855f7"/>
                  <stop offset="1" stopColor="#fcd34d"/>
                </linearGradient>
              </defs>
            </svg>
            <span style={{
              fontFamily: "'General Sans', sans-serif",
              fontWeight: 600,
              fontSize: 16,
              color: 'hsl(40,6%,95%)',
              letterSpacing: '-0.02em',
            }}>
              AssessAI
            </span>
          </div>

          {/* Center: Nav items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button className="nav-item">
              Features <ChevronDown size={13} />
            </button>
            <button className="nav-item">
              Solutions
            </button>
            <button className="nav-item">
              Plans
            </button>
            <button className="nav-item">
              Learning <ChevronDown size={13} />
            </button>
          </div>

          {/* Right: Sign Up */}
          <button
            className="btn-hero-secondary"
            style={{ borderRadius: 9999, padding: '8px 16px' }}
            onClick={onStartChat}
          >
            Sign Up
          </button>
        </nav>

        {/* Divider */}
        <div
          style={{
            marginTop: 3,
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />

        {/* ── Hero content ─────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* Blurred overlay shape per spec */}
          <div
            style={{
              position: 'absolute',
              width: 984,
              height: 527,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.9,
              background: 'rgb(3,7,18)',
              filter: 'blur(82px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Text content */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Eyebrow badge */}
            <div
              className="liquid-glass"
              style={{
                borderRadius: 100,
                padding: '5px 14px',
                marginBottom: 28,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Geist Sans', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.02em',
              }}>
                Powered by SHL's complete assessment catalog
              </span>
            </div>

            {/* Headline: "Power AI" at 220px */}
            <h1
              style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: '220px',
                fontWeight: 400,
                lineHeight: 1.02,
                letterSpacing: '-0.024em',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ color: 'hsl(40,6%,95%)' }}>Power </span>
              <span className="gradient-ai">AI</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                color: 'hsl(40,6%,82%)',
                fontSize: '1.125rem',
                lineHeight: 2,
                maxWidth: '28rem',
                marginTop: 9,
                opacity: 0.8,
                fontFamily: "'Geist Sans', sans-serif",
                fontWeight: 400,
              }}
            >
              The most powerful AI ever deployed
              <br />
              in talent acquisition
            </p>

            {/* CTA */}
            <button
              className="btn-hero-secondary"
              style={{
                borderRadius: 12,
                padding: '24px 29px',
                marginTop: 25,
                fontSize: '0.9375rem',
                fontWeight: 500,
              }}
              onClick={onStartChat}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                flexShrink: 0,
              }} />
              Schedule a Consult
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Logo marquee — pinned to bottom ───────────────────────────────── */}
        <div style={{ paddingBottom: 40 }}>
          <div
            style={{
              maxWidth: '64rem',
              margin: '0 auto',
              padding: '0 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 48,
            }}
          >
            {/* Static left text */}
            <div
              style={{
                flexShrink: 0,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
                fontFamily: "'Geist Sans', sans-serif",
                lineHeight: 1.5,
                whiteSpace: 'nowrap',
              }}
            >
              Relied on by brands
              <br />
              across the globe
            </div>

            {/* Marquee container */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {/* Fade edges */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 48,
                background: 'linear-gradient(to right, hsl(260,87%,3%), transparent)',
                zIndex: 2, pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 48,
                background: 'linear-gradient(to left, hsl(260,87%,3%), transparent)',
                zIndex: 2, pointerEvents: 'none',
              }} />

              <div
                className="marquee-track"
                style={{
                  display: 'flex',
                  gap: 64,
                  width: 'max-content',
                }}
              >
                {/* Duplicated for seamless loop */}
                {[...LOGOS, ...LOGOS].map((logo, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      className="liquid-glass"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: LOGO_COLORS[i % LOGO_COLORS.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.9)',
                        fontFamily: "'General Sans', sans-serif",
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {logo.letter}
                    </div>
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'hsl(40,6%,95%)',
                        fontFamily: "'Geist Sans', sans-serif",
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {logo.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
