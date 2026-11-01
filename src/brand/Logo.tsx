import { useId } from 'react'
import { FLAME_PATH } from './Flame'

/** The KeepIt mark: a warm gradient tile with a cream flame and a check cut out of it. */
export function LogoMark({ size = 40, className = '', outlined = false }: { size?: number; className?: string; outlined?: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="KeepIt"
      style={outlined ? { borderRadius: size * 0.27, boxShadow: `0 0 0 2px var(--line), 0 3px 0 2px var(--line)` } : undefined}
    >
      <defs>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFB020" />
          <stop offset="0.55" stopColor="#FF5A1F" />
          <stop offset="1" stopColor="#FF3D71" />
        </linearGradient>
        <mask id={`m${id}`}>
          <rect width="64" height="64" fill="#fff" />
          <path d="M24.5 40.5L30.5 46.5L41.5 33.5" fill="none" stroke="#000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <rect width="64" height="64" rx="17" fill={`url(#t${id})`} />
      <g mask={`url(#m${id})`}>
        <path d={FLAME_PATH} fill="#FFF6E7" transform="translate(3.2 3.6) scale(.9)" />
      </g>
    </svg>
  )
}

/** Mark + wordmark. The wordmark is live text in the display face. */
export function Logo({ size = 40, className = '', hideWordmark = false }: { size?: number; className?: string; hideWordmark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {!hideWordmark && (
        <span className="display font-extrabold leading-none" style={{ fontSize: size * 0.7, letterSpacing: '-0.045em' }}>
          keep<span style={{ color: 'var(--ember)' }}>it</span>
        </span>
      )}
    </span>
  )
}
