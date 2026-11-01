/** Small, reusable illustration pieces. All SVG, all themed through CSS variables. */

export function Coin({ size = 40, className = '', style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} style={style} aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="#FFC233" stroke="var(--line)" strokeWidth="3" />
      <circle cx="24" cy="24" r="14.500" fill="none" stroke="#1B1335" strokeOpacity="0.28" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M24 13v22M29 18.500c-1-1.700-3-2.500-5-2.500-3 0-5 1.500-5 3.700 0 5.300 10 2.700 10 8 0 2.300-2.200 3.800-5 3.800-2.300 0-4.300-.9-5.300-2.700" fill="none" stroke="#1B1335" strokeWidth="2.800" strokeLinecap="round" />
    </svg>
  )
}

export function Sparkle({ size = 20, className = '', color = 'var(--sun)', style }: { size?: number; className?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <path d="M12 1.500c.9 6.200 3.300 8.600 9.500 9.500-6.200.9-8.600 3.300-9.500 9.500-.9-6.200-3.300-8.600-9.500-9.500C8.700 10.100 11.100 7.700 12 1.500z" fill={color} stroke="var(--line)" strokeWidth="1.400" strokeLinejoin="round" />
    </svg>
  )
}

/** Stacked coins that bounce in. Used in step illustrations. */
export function CoinStack({ count = 4, size = 44 }: { count?: number; size?: number }) {
  return (
    <div className="relative" style={{ width: size * 1.4, height: size * 0.5 * count + size * 0.6 }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute left-1/2 pop-in"
          style={{ bottom: i * size * 0.28, transform: `translateX(${i % 2 ? '-46%' : '-54%'})`, animationDelay: `${i * 90}ms`, zIndex: i }}
        >
          <svg width={size} height={size * 0.68} viewBox="0 0 48 32">
            <ellipse cx="24" cy="22" rx="20" ry="8.500" fill="#D99A12" stroke="var(--line)" strokeWidth="2.600" />
            <rect x="4" y="12" width="40" height="10" fill="#E8AA1C" />
            <path d="M4 12v10" stroke="var(--line)" strokeWidth="2.600" />
            <path d="M44 12v10" stroke="var(--line)" strokeWidth="2.600" />
            <ellipse cx="24" cy="12" rx="20" ry="8.500" fill="#FFC233" stroke="var(--line)" strokeWidth="2.600" />
            <ellipse cx="24" cy="12" rx="11" ry="4" fill="none" stroke="#1B1335" strokeOpacity="0.25" strokeWidth="1.600" />
          </svg>
        </div>
      ))}
    </div>
  )
}

/** A hand-drawn style squiggle underline for headlines. */
export function Squiggle({ className = '', color = 'var(--ember)' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 220 14" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 9c12-8 22 6 36 0s22-8 36-1 22 8 36 1 22-8 36-1 22 8 36 1 22-6 34-1" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
