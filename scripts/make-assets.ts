/**
 * Generates KeepIt's brand assets into public/: favicon, app icons, logo and the social share image.
 * Run with: bun run assets
 * Fonts are static instances of Bricolage Grotesque and Figtree stored in design/fonts.
 */
import { Resvg } from '@resvg/resvg-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const OUT = join(ROOT, 'public')
const FONTS = ['Bricolage-800.ttf', 'Bricolage-600.ttf', 'Figtree-500.ttf', 'Figtree-700.ttf'].map((f) => join(ROOT, 'design/fonts', f))
mkdirSync(OUT, { recursive: true })

const INK = '#1B1335'
const PAPER = '#FFF6E7'
const FLAME =
  'M33.5 3C35 13.5 49 19.5 49 38C49 49.5 41.5 58.5 32 58.5C22.5 58.5 15 49.5 15 38C15 30.5 19 25.5 23.5 21.5C23.2 27.5 26 31 29.8 31.5C27 22 29 10 33.5 3Z'
const INNER =
  'M32 33C34 39 41.5 42.5 41.5 49C41.5 53.5 37.5 56.5 32 56.5C26.5 56.5 22.5 53.5 22.5 49C22.5 45 25.5 42.5 27 39.5C28 41.5 29.5 42.5 30.5 42.5C29.5 40 30.5 36 32 33Z'
const CHECK = 'M24.5 40.5L30.5 46.5L41.5 33.5'
const CRACK = 'M33 14L29 27L36 33L30 42L35 52'

const defs = (id: string) => `
<linearGradient id="${id}" x1="0" y1="1" x2="0.2" y2="0"><stop offset="0" stop-color="#FF3D71"/><stop offset=".5" stop-color="#FF5A1F"/><stop offset="1" stop-color="#FFC233"/></linearGradient>
<mask id="${id}m"><rect width="64" height="64" fill="#fff"/><path d="${CHECK}" fill="none" stroke="#000" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/></mask>`

/** The KeepIt mark: a warm gradient tile with a cream flame and a check cut out of it. */
const tile = (id: string, opts: { rounded?: boolean; scale?: number } = {}) => {
  const { rounded = true, scale = 1 } = opts
  const t = (64 - 64 * scale) / 2
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB020"/><stop offset=".55" stop-color="#FF5A1F"/><stop offset="1" stop-color="#FF3D71"/></linearGradient>
<mask id="${id}m"><rect width="64" height="64" fill="#fff"/><path d="M24.5 40.5L30.5 46.5L41.5 33.5" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></mask></defs>
<rect width="64" height="64" ${rounded ? 'rx="17"' : ''} fill="url(#${id})"/>
<g transform="translate(${t} ${t}) scale(${scale})"><g mask="url(#${id}m)"><path d="${FLAME}" fill="${PAPER}" transform="translate(3.2 3.6) scale(.9)"/></g></g>`
}

const markSvg = (size: number, opts: { rounded?: boolean; scale?: number } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${tile('f', opts)}</svg>`

const png = (svg: string, width?: number) =>
  new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Figtree' },
  })
    .render()
    .asPng()

const write = (name: string, data: string | Uint8Array) => {
  writeFileSync(join(OUT, name), data)
  console.log('wrote', name)
}

// --- Icons ---------------------------------------------------------------
write('favicon.svg', markSvg(64))
write('logo.svg', markSvg(512))
write('favicon-32.png', png(markSvg(64), 32))
write('apple-touch-icon.png', png(markSvg(180, { rounded: false, scale: 0.86 }), 180))
write('icon-192.png', png(markSvg(192), 192))
write('icon-512.png', png(markSvg(512), 512))
write('icon-maskable-512.png', png(markSvg(512, { rounded: false, scale: 0.72 }), 512))

// favicon.ico: a single 32x32 PNG wrapped in an ICO container.
const ico32 = png(markSvg(64), 32)
const header = Buffer.alloc(22)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)
header.writeUInt8(32, 6)
header.writeUInt8(32, 7)
header.writeUInt16LE(1, 10)
header.writeUInt16LE(32, 12)
header.writeUInt32LE(ico32.length, 14)
header.writeUInt32LE(22, 18)
write('favicon.ico', Buffer.concat([header, ico32]))

write(
  'site.webmanifest',
  JSON.stringify(
    {
      name: 'KeepIt',
      short_name: 'KeepIt',
      description: 'Challenge friends to a daily habit and stake USDC on it. Keep the streak. Keep your money.',
      start_url: '/?app=keeps',
      display: 'standalone',
      background_color: PAPER,
      theme_color: INK,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ),
)

// --- Social share image (1200x630) -----------------------------------------
const tiles = [
  { k: 'kept' }, { k: 'kept' }, { k: 'kept' }, { k: 'missed' }, { k: 'kept' }, { k: 'kept' }, { k: 'today' },
] as const

const tileSvg = tiles
  .map((t, i) => {
    const x = 28 + i * 48
    const y = 372
    if (t.k === 'kept')
      return `<rect x="${x}" y="${y}" width="40" height="40" rx="10" fill="#FFC233" stroke="${INK}" stroke-width="3.5"/>
<g transform="translate(${x + 8} ${y + 7}) scale(.36)"><path d="${FLAME}" fill="url(#og)"/></g>`
    if (t.k === 'missed')
      return `<rect x="${x}" y="${y}" width="40" height="40" rx="10" fill="#FFF9F0" stroke="#8E88A8" stroke-width="3.5" stroke-dasharray="6 5"/>
<g transform="translate(${x + 8} ${y + 7}) scale(.36)"><path d="${FLAME}" fill="#8E88A8" opacity=".6"/><path d="${CRACK}" fill="none" stroke="#FFF9F0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`
    return `<rect x="${x}" y="${y}" width="40" height="40" rx="10" fill="#fff" stroke="#FF5A1F" stroke-width="4"/>
<text x="${x + 20}" y="${y + 28}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="20" fill="${INK}">7</text>`
  })
  .join('\n')

const dots = Array.from({ length: 28 }, (_, r) =>
  Array.from({ length: 54 }, (_, c) => `<circle cx="${c * 24 + 6}" cy="${r * 24 + 6}" r="1.6" fill="${INK}" opacity=".10"/>`).join(''),
).join('')

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>${defs('og')}
<linearGradient id="fire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB020"/><stop offset=".5" stop-color="#FF5A1F"/><stop offset="1" stop-color="#FF3D71"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF5A1F" stop-opacity=".45"/><stop offset="1" stop-color="#FF5A1F" stop-opacity="0"/></radialGradient>
<radialGradient id="glow2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFC233" stop-opacity=".5"/><stop offset="1" stop-color="#FFC233" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1200" height="630" fill="${PAPER}"/>
${dots}
<circle cx="150" cy="560" r="330" fill="url(#glow)"/>
<circle cx="960" cy="250" r="300" fill="url(#glow2)"/>
<rect x="14" y="14" width="1172" height="602" rx="34" fill="none" stroke="${INK}" stroke-width="5"/>

<!-- logo -->
<g transform="translate(64 62)">
  <g transform="scale(1.3125)">${tile('ogt')}</g>
  <text x="104" y="62" font-family="Bricolage Grotesque" font-weight="800" font-size="60" letter-spacing="-3" fill="${INK}">keep<tspan fill="#FF5A1F">it</tspan></text>
</g>

<!-- headline -->
<text x="64" y="318" font-family="Bricolage Grotesque" font-weight="800" font-size="88" letter-spacing="-4" fill="${INK}">Keep the streak.</text>
<text x="64" y="414" font-family="Bricolage Grotesque" font-weight="800" font-size="88" letter-spacing="-4" fill="url(#fire)">Keep your money.</text>
<path d="M66 436c26-14 48 10 78 0s48-14 78-2 48 14 78 2 48-14 78-2 48 12 78 0" fill="none" stroke="#FF5A1F" stroke-width="7" stroke-linecap="round"/>

<!-- subline -->
<text x="64" y="512" font-family="Figtree" font-weight="700" font-size="34" fill="#3A3057">Challenge friends. Split what quitters leave behind.</text>

<!-- sticker card -->
<g transform="translate(748 70) rotate(4 200 250)">
  <rect x="8" y="14" width="384" height="466" rx="40" fill="${INK}"/>
  <rect x="0" y="0" width="384" height="466" rx="40" fill="#fff" stroke="${INK}" stroke-width="5"/>
  <rect x="28" y="28" width="62" height="62" rx="16" fill="#FFC233" stroke="${INK}" stroke-width="4"/>
  <g transform="translate(36 34) scale(.78)"><path d="${FLAME}" fill="url(#og)"/><path d="${INNER}" fill="#FFF1A8" opacity=".9"/></g>
  <text x="108" y="56" font-family="Bricolage Grotesque" font-weight="800" font-size="32" fill="${INK}">Run 2km</text>
  <text x="108" y="82" font-family="Figtree" font-weight="500" font-size="20" fill="#655D82">Day 12 of 14 · $1/day</text>
  <g transform="translate(40 116) scale(2.1)">
    <path d="${FLAME}" fill="url(#og)"/>
    <path d="${INNER}" fill="#FFF1A8" opacity=".9"/>
  </g>
  <text x="196" y="262" font-family="Bricolage Grotesque" font-weight="800" font-size="150" letter-spacing="-8" fill="${INK}">12</text>
  <text x="200" y="308" font-family="Figtree" font-weight="700" font-size="22" letter-spacing="3" fill="#655D82">DAY STREAK</text>
  ${tileSvg}
  <rect x="28" y="430" width="150" height="0" fill="none"/>
</g>

<!-- money chip -->
<g transform="translate(880 522) rotate(-3)">
  <rect x="5" y="8" width="250" height="68" rx="22" fill="${INK}"/>
  <rect x="0" y="0" width="250" height="68" rx="22" fill="#3FE0A2" stroke="${INK}" stroke-width="4.5"/>
  <text x="26" y="30" font-family="Figtree" font-weight="700" font-size="17" letter-spacing="2" fill="${INK}">MONEY SAFE</text>
  <text x="26" y="58" font-family="Bricolage Grotesque" font-weight="800" font-size="34" fill="${INK}">$13.00 of $14</text>
</g>
</svg>`

write('og.png', png(ogSvg, 1200))
write('og.svg', ogSvg)
