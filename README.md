# Petory

Upload a photo, let it move into your computer.

**Website:** https://petory.chat

Petory is an AI desktop companion app. Users upload a photo, the app generates a desktop-ready pet, and the pet lives on screen with chat, pomodoro, reminders, and growth.

## What lives where

| Path | Role |
|------|------|
| `src/renderer/` | React UI |
| `src/shared/` | Shared constants, types, prompts, and copy |
| `electron/` | Main process, windows, updater, image pipeline |
| `server/` | Backend API and admin console |
| `website/` | Public site and download page |
| `docs/` | Product, version, and deployment docs |

## Quick start

```bash
npm install
cp .env.example .env
cp server/.env.example server/.env
npm run dev
```

If you are using the local backend:

```bash
npm run server:install
npm run server:db
npm run server:dev
```

The app expects `ARK_API_KEY` for Seedream image generation and `KIMI_API_KEY` for chat features.

## Common commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Electron + Vite |
| `npm run build` | Build production assets |
| `npm run typecheck` | TypeScript check |
| `npm run pack:mac` | Build macOS installer |
| `npm run pack:win` | Build Windows installer |
| `npm run release:prepare` | Refresh website release metadata |
| `npm run website:preview` | Preview the static website |
| `npm run server:dev` | Start the backend API |
| `npm run docker:up` | Start PostgreSQL + website in Docker |

## Deployment targets

- App releases: GitHub Releases
- Public website: Cloudflare Pages on `petory.chat`
- Update feed: `https://petory.chat/releases`
- Backend API and admin console: VPS Docker, exposed through Cloudflare Tunnel as `api.petory.chat`

## Release and deploy flow

- Client releases run through GitHub Actions `Release`; successful releases build macOS/Windows installers, publish GitHub Release assets, update the website release feed, and mirror `.dmg/.exe` files to the VPS download directory when deploy SSH secrets are configured.
- Server/admin deployments run through GitHub Actions `Deploy Server` or the local fallback `npm run deploy:server`.
- Manual download mirroring can be retried through GitHub Actions `Mirror Downloads` or `npm run deploy:downloads -- --from-github`.

## Documentation

- Start here: [docs/README.md](./docs/README.md)
- Docs: [docs/README.md](./docs/README.md)
- Product status: [docs/product/FEATURES.md](./docs/product/FEATURES.md)
- Server and admin: [docs/backend/README.md](./docs/backend/README.md)
- Local Docker: [docs/development/DOCKER-DEV.md](./docs/development/DOCKER-DEV.md)

## Maintenance notes

- Keep `src/shared/` as the source of truth for cross-process values.
- Keep `docs/` as the source of truth for product and deployment notes.
- Do not reintroduce generated output or runtime data into the tracked source layout.
