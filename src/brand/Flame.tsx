import { useId } from 'react'

/** The KeepIt flame. Same silhouette as the logo. */
export const FLAME_PATH =
  'M33.5 3C35 13.5 49 19.5 49 38C49 49.5 41.5 58.5 32 58.5C22.5 58.5 15 49.5 15 38C15 30.5 19 25.5 23.5 21.5C23.2 27.5 26 31 29.8 31.5C27 22 29 10 33.5 3Z'
export const CHECK_PATH = 'M24.5 40.5L30.5 46.5L41.5 33.5'
const CRACK_PATH = 'M33 14L29 27L36 33L30 42L35 52'

interface FlameProps {
  size?: number
  /** Lit flames glow with the ember gradient. Unlit flames go cold. */
  lit?: boolean
  /** Cut a check mark out of the flame (the logo treatment). */
  check?: boolean
  /** Draw a crack through a cold flame (a missed day). */
  cracked?: boolean
  flicker?: boolean
  delay?: number
  className?: string
}

export function Flame({ size = 24, lit = true, check = false, cracked = false, flicker = true, delay = 0, className = '' }: FlameProps) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`${lit && flicker ? 'flame-flicker' : ''} ${className}`}
      style={{ animationDelay: `${delay}s`, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="1" x2="0.2" y2="0">
          <stop offset="0" stopColor="#FF3D71" />
          <stop offset="0.5" stopColor="#FF5A1F" />
          <stop offset="1" stopColor="#FFC233" />
        </linearGradient>
        {check && (
          <mask id={`m${id}`}>
            <rect width="64" height="64" fill="#fff" />
            <path d={CHECK_PATH} fill="none" stroke="#000" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        )}
      </defs>
      <g mask={check ? `url(#m${id})` : undefined}>
        <path d={FLAME_PATH} fill={lit ? `url(#g${id})` : 'var(--crack)'} opacity={lit ? 1 : 0.55} />
      </g>
      {lit && !check && <path d="M32 33C34 39 41.5 42.5 41.5 49C41.5 53.5 37.5 56.5 32 56.5C26.5 56.5 22.5 53.5 22.5 49C22.5 45 25.5 42.5 27 39.5C28 41.5 29.5 42.5 30.5 42.5C29.5 40 30.5 36 32 33Z" fill="#FFF1A8" opacity="0.9" />}
      {cracked && <path d={CRACK_PATH} fill="none" stroke="var(--card)" strokeWidth="3.200" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

/** A handful of rising embers for hero flames. */
export function Embers({ count = 7 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="ember-spark"
          style={
            {
              left: `${28 + ((i * 53) % 44)}%`,
              animationDelay: `${(i * 0.37) % 2.4}s`,
              animationDuration: `${2 + (i % 3) * 0.5}s`,
              '--dx': `${(i % 2 ? 1 : -1) * (6 + (i % 4) * 5)}px`,
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              background: i % 2 ? 'var(--sun)' : 'var(--ember)',
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}
