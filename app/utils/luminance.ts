const SAMPLE_SIZE = 36
const LIGHT_THRESHOLD = 0.62

export async function analyzeImageLuminance(url: string): Promise<number | null> {
  if (!import.meta.client || !url) return null
  const img = await loadImage(url)
  if (!img) return null

  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  let pixels: Uint8ClampedArray
  try {
    pixels = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data
  } catch {
    return null
  }

  let total = 0
  let weightSum = 0
  for (let y = 0; y < SAMPLE_SIZE; y++) {
    const weight = 1 + y / SAMPLE_SIZE
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const i = (y * SAMPLE_SIZE + x) * 4
      const r = pixels[i]! / 255
      const g = pixels[i + 1]! / 255
      const b = pixels[i + 2]! / 255
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      total += lum * weight
      weightSum += weight
    }
  }
  return weightSum > 0 ? total / weightSum : null
}

export function isLightLuminance(luminance: number): boolean {
  return luminance > LIGHT_THRESHOLD
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}
