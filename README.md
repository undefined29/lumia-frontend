<p align="center">
  <img src="https://github.com/Amirust/lumia-frontend/blob/main/readme_files/readme_cover.webp?raw=true" alt="Lumia" />
</p>

# Lumia

This is a hobby project.

**Note:** this frontend was not written by me — it was fully AI-generated.

I hate frontend development and wanted to focus only on backend, so AVE BACKEND.

Backend lives here: https://github.com/Amirust/lumia-backend

This repository is the frontend.

---

Lumia is an anime image gallery with a focus on fast browsing, rich tagging, and
AI-assisted organization. This repository contains the web client; it talks to the
[Lumia backend](https://github.com/Amirust/lumia-backend) over a REST API.

It is a single-page application built with Nuxt 4 and Vue 3, fully typed, themeable,
and localized in English, Russian, and German.

## Features

- **Gallery** — browse images in masonry or uniform layouts with adjustable
  density and infinite (keyset) scrolling. Filter by tags (including booru-style
  `-tag` negation), character, anime / season / episode, author, favorites, and
  untagged or unlinked images. Sort by date or in-episode timecode.
- **Library** — organize anime as series → seasons → episodes, with cover images
  and ongoing / finished status. Import titles and seasons directly from Shikimori.
- **Upload** — drag-and-drop single or bulk uploads, optionally attached to an
  episode. Live, SSE-driven status (queued → uploading → analyzing → done) with
  AI auto-tagging, duplicate detection, and timecode extraction from mpv
  screenshot filenames.
- **Image view** — tags grouped by category, favorites, download, source type,
  episode assignment, timecode, and content hash.
- **Settings** — manage users and their permission bitmask (admin only), tags,
  and characters. Customize appearance with dark / light / OLED themes and a
  custom or preset accent color.
- **Auth** — Discord OAuth2 via better-auth (bearer token), with passkey sign-in
  planned.
- **Internationalization** — English, Russian (with correct CLDR pluralization),
  and German.

## Tech stack

- [Nuxt 4](https://nuxt.com) (SPA mode, no SSR) + [Vue 3](https://vuejs.org)
- [Pinia](https://pinia.vuejs.org) for state, Vue Router for navigation
- [@nuxtjs/i18n](https://i18n.nuxtjs.org) for localization
- [@nuxt/image](https://image.nuxt.com) (WebP) and [@nuxt/fonts](https://fonts.nuxt.com) (Geist)
- TypeScript (strict), ESLint (flat config) + Prettier, Husky + lint-staged

## Getting started

Requirements: [Bun](https://bun.sh) and a running [Lumia backend](https://github.com/Amirust/lumia-backend).

```bash
# Install dependencies
bun install

# Configure the backend / CDN endpoints
cp .env.example .env
# edit .env to point at your backend and CDN

# Start the dev server (http://localhost:3000)
bun run dev
```

### Build

```bash
bun run build      # production build
bun run preview    # preview the build locally
bun run generate   # static generation
```

## Configuration

Runtime configuration is read from environment variables (see `.env.example`):

| Variable                    | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE_URL`  | REST API root of the backend.                             |
| `NUXT_PUBLIC_AUTH_BASE_URL` | better-auth mount point (usually `${API}/api/auth`).      |
| `NUXT_PUBLIC_BASE_CDN_URL`  | Public CDN base for uploaded images (S3-compatible / R2). |

## Project structure

```
app/
  components/   UI atoms (L-prefixed) and feature components (gallery, library, image, settings)
  composables/  Reusable logic — API client, auth, infinite lists, theming, uploads
  pages/        Routed views (gallery, library, image, upload, settings, login)
  stores/       Pinia stores (user, theme, accent, locale)
  types/        API DTOs and view-model types
  utils/        Pure helpers (adapters, formatting, color, masonry)
  assets/css/   Design tokens, base styles, transitions
i18n/           Locale messages (en, ru, de) and plural rules
```

## Scripts

| Script              | Description                  |
| ------------------- | ---------------------------- |
| `bun run dev`       | Start the development server |
| `bun run build`     | Production build             |
| `bun run preview`   | Preview the production build |
| `bun run typecheck` | Run `nuxi typecheck`         |
| `bun run lint`      | Lint with ESLint             |
| `bun run lint:fix`  | Lint and auto-fix            |
| `bun run format`    | Format with Prettier         |

## Related

- [Lumia backend](https://github.com/Amirust/lumia-backend) — NestJS API, auth, storage, and ML integration.
