// Per-image Open Graph injection for /image/:id, run as a Cloudflare Pages
// Function. The app ships as a static SPA (ssr: false), so link-preview crawlers
// (Discord, Telegram, X) that don't execute JS would only ever see the site-wide
// default tags. Here we rewrite the SPA shell's <head> with the actual screenshot
// for the requested image, while real users still get the normal SPA.
//
// Two cache layers keep this near-free: the backend /images/:id/og endpoint is
// edge-cached (immutable metadata), and the rewritten HTML itself is stored in
// caches.default keyed by URL — so each image is "rendered" once, then served
// from the edge without touching the API again.

/* global HTMLRewriter */

const HTML_CACHE_TTL = 86400 // seconds the rewritten shell lives at the edge
const OG_API_CACHE_TTL = 86400

function trimSlash(value) {
  return (value || '').replace(/\/$/, '')
}

function escapeAttr(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

class AttrSetter {
  constructor(value) {
    this.value = value
  }
  element(el) {
    el.setAttribute('content', this.value)
  }
}

class TitleSetter {
  constructor(value) {
    this.value = value
  }
  element(el) {
    el.setInnerContent(this.value)
  }
}

// og:url is dropped from the static shell (it has no build-time value), so we
// append it here per request — appending avoids any duplicate-tag ambiguity.
class HeadAppender {
  constructor(html) {
    this.html = html
  }
  element(el) {
    el.append(this.html, { html: true })
  }
}

async function fetchOgMeta(env, id) {
  const apiBase = trimSlash(env.NUXT_PUBLIC_API_BASE_URL || env.OG_API_BASE_URL)
  if (!apiBase) return null
  try {
    const res = await fetch(`${apiBase}/images/${encodeURIComponent(id)}/og`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: OG_API_CACHE_TTL, cacheEverything: true },
    })
    if (!res.ok) return null
    const body = await res.json()
    return body && body.ok ? body.result : null
  } catch {
    return null
  }
}

function buildPreview(meta, env, pageUrl) {
  const cdnBase = trimSlash(env.NUXT_PUBLIC_BASE_CDN_URL || env.OG_CDN_BASE_URL)
  if (!meta || !meta.storageKey || !cdnBase) return null

  const imageUrl = `${cdnBase}/${meta.storageKey}`

  const parts = []
  if (meta.title) parts.push(meta.title)
  if (meta.season && meta.season.number) parts.push(`S${meta.season.number}`)
  if (meta.episode && meta.episode.number) {
    parts.push(`E${String(meta.episode.number).padStart(2, '0')}`)
  }
  const title = parts.length ? parts.join(' · ') : 'Lumia'
  const description = (meta.episode && meta.episode.title) || 'View on Lumia'

  return {
    imageUrl,
    title,
    description,
    width: meta.width != null ? String(meta.width) : '',
    height: meta.height != null ? String(meta.height) : '',
    pageUrl,
  }
}

export async function renderImageOg(context, id) {
  const { request, env, waitUntil } = context

  // Only meaningful for GET; let anything else fall through to the SPA.
  if (request.method !== 'GET') return context.next()

  const cache = caches.default
  const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' })

  const hit = await cache.match(cacheKey)
  if (hit) return hit

  const origin = new URL(request.url).origin
  const shell = await env.ASSETS.fetch(new Request(`${origin}/index.html`, { method: 'GET' }))
  if (!shell.ok) return shell

  const meta = await fetchOgMeta(env, id)
  const preview = meta ? buildPreview(meta, env, request.url) : null

  if (!preview) return shell

  const transformed = new HTMLRewriter()
    .on('meta[property="og:type"]', new AttrSetter('article'))
    .on('meta[property="og:title"]', new AttrSetter(preview.title))
    .on('meta[property="og:description"]', new AttrSetter(preview.description))
    .on('meta[property="og:image"]', new AttrSetter(preview.imageUrl))
    .on('meta[property="og:image:width"]', new AttrSetter(preview.width))
    .on('meta[property="og:image:height"]', new AttrSetter(preview.height))
    .on(
      'head',
      new HeadAppender(`<meta property="og:url" content="${escapeAttr(preview.pageUrl)}">`),
    )
    .on('meta[name="twitter:card"]', new AttrSetter('summary_large_image'))
    .on('meta[name="twitter:title"]', new AttrSetter(preview.title))
    .on('meta[name="twitter:description"]', new AttrSetter(preview.description))
    .on('meta[name="twitter:image"]', new AttrSetter(preview.imageUrl))
    .on('title', new TitleSetter(`${preview.title} — Lumia`))
    .transform(shell)

  const response = new Response(transformed.body, transformed)
  response.headers.set('Cache-Control', `public, max-age=300, s-maxage=${HTML_CACHE_TTL}`)
  response.headers.set('x-lumia-og', 'image')

  waitUntil(cache.put(cacheKey, response.clone()))
  return response
}
