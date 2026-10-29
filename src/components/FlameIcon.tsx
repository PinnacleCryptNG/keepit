import { useId } from 'react'

interface Props {
  size?: number
  lit?: boolean
  flicker?: boolean
  delay?: number
  className?: string
}

const OUTER =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'
const INNER =
  'M12 20.5c2.2 0 3.8-1.6 3.8-3.6 0-1.7-1.1-2.7-2-3.9-.5.9-1.1 1.5-1.8 2.1-.6-.5-.9-1.1-1-1.9-1.5 1-2.8 2.4-2.8 4.1 0 1.8 1.6 3.2 3.8 3.2z'

/** Animated streak flame. `lit={false}` renders a cold, flat flame. */
export function FlameIcon({ size = 24, lit = true, flicker = true, delay = 0, className = '' }: Props) {
  const gid = `flame-${useId().replace(/:/g, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${lit && flicker ? 'flame-flicker' : ''} ${className}`}
      style={{ animationDelay: `${delay}s`, filter: lit ? 'drop-shadow(0 2px 6px rgba(255,106,26,.45))' : undefined }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f0382b" />
          <stop offset="0.55" stopColor="#ff6a1a" />
          <stop offset="1" stopColor="#ffb020" />
        </linearGradient>
      </defs>
      <path d={OUTER} fill={lit ? `url(#${gid})` : 'currentColor'} opacity={lit ? 1 : 0.35} />
      {lit && <path d={INNER} fill="#fff1a8" opacity="0.92" />}
    </svg>
  )
}
