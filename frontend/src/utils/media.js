function encodeSvg(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const LOCAL_SCENIC_POOL = [
  '/images/scenic/photos/417074.jpg',
  '/images/scenic/photos/15846957.jpg',
  '/images/scenic/photos/1526713.jpg',
  '/images/scenic/photos/9693235.jpg',
  '/images/scenic/photos/12705385.jpg',
  '/images/scenic/photos/7520282.jpg',
  '/images/scenic/photos/66997.jpg',
  '/images/scenic/photos/8920813.jpg',
  '/images/scenic/photos/2876520.jpg',
]

const LOCAL_SCENIC_MAP = {
  'login-bg': LOCAL_SCENIC_POOL[0],
  about: LOCAL_SCENIC_POOL[1],
  'banner-1': LOCAL_SCENIC_POOL[2],
  'banner-2': LOCAL_SCENIC_POOL[3],
  'banner-3': LOCAL_SCENIC_POOL[4],
  'sky-lake': LOCAL_SCENIC_POOL[5],
  'green-valley': LOCAL_SCENIC_POOL[6],
  'sunset-ridge': LOCAL_SCENIC_POOL[7],
  'ancient-path': LOCAL_SCENIC_POOL[8],
  'stay-1': LOCAL_SCENIC_POOL[2],
  'stay-2': LOCAL_SCENIC_POOL[3],
  'stay-3': LOCAL_SCENIC_POOL[4],
  'guide-1': LOCAL_SCENIC_POOL[6],
  'guide-2': LOCAL_SCENIC_POOL[7],
}

function galleryIndexForKey(key) {
  const match = String(key).match(/^spot-(\d+)$/)
  if (!match) return null
  const idx = Number(match[1])
  if (!Number.isFinite(idx)) return null
  return idx % LOCAL_SCENIC_POOL.length
}

function poolIndexForSeed(seed) {
  const hash = Array.from(String(seed)).reduce((acc, ch) => (acc + ch.charCodeAt(0) * 17) % 997, 0)
  return hash % LOCAL_SCENIC_POOL.length
}

export function scenicImage(key, options = {}) {
  const { width = 1200, height = 700, title = '悦行山海', subtitle = '', seed = key, forceSvg = false } = options

  if (!forceSvg && key !== 'qr') {
    const mapped = LOCAL_SCENIC_MAP[String(key)]
    if (mapped) return mapped
    const galleryIndex = galleryIndexForKey(key)
    if (galleryIndex !== null) return LOCAL_SCENIC_POOL[galleryIndex]
    return LOCAL_SCENIC_POOL[poolIndexForSeed(seed)]
  }

  const hue = Math.abs(
    Array.from(String(seed)).reduce((acc, ch) => acc + ch.charCodeAt(0) * 17, 0) % 360,
  )

  const a = `hsl(${hue} 78% 58%)`
  const b = `hsl(${(hue + 40) % 360} 70% 62%)`
  const c = `hsl(${(hue + 90) % 360} 72% 70%)`
  const text = subtitle ? `${title} · ${subtitle}` : title

  const cardY = height * 0.36
  const cardH = height * 0.28
  const titleY = cardY + cardH * 0.43
  const subY = cardY + cardH * 0.7

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${a}"/>
        <stop offset="0.55" stop-color="${b}"/>
        <stop offset="1" stop-color="${c}"/>
      </linearGradient>
      <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="rgba(0,0,0,0.18)"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <path d="M0 ${height * 0.7} C ${width * 0.22} ${height * 0.58}, ${width * 0.45} ${height * 0.82}, ${width} ${height * 0.62} L ${width} ${height} L 0 ${height} Z" fill="rgba(255,255,255,0.18)"/>
    <path d="M0 ${height * 0.78} C ${width * 0.3} ${height * 0.7}, ${width * 0.62} ${height * 0.95}, ${width} ${height * 0.72} L ${width} ${height} L 0 ${height} Z" fill="rgba(245,247,250,0.45)"/>
    <g filter="url(#s)">
      <rect x="${width * 0.08}" y="${cardY}" width="${width * 0.84}" height="${cardH}" rx="18" fill="rgba(255,255,255,0.35)"/>
      <text x="${width * 0.1}" y="${titleY}" font-size="${Math.round(
    height * 0.06,
  )}" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fill="rgba(12,35,64,0.95)">
        ${text}
      </text>
      <text x="${width * 0.1}" y="${subY}" font-size="${Math.round(
    height * 0.035,
  )}" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fill="rgba(12,35,64,0.75)">
        旅途从这里开始 · 清新自然的景区体验
      </text>
    </g>
  </svg>`

  return encodeSvg(svg)
}

export function smallCover(key, title) {
  return scenicImage(key, { width: 800, height: 520, subtitle: title })
}
