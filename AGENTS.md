# Petory — Agent Guide

## What We're Building

**Petory** (always use this English name, never a Chinese product name) is an AI desktop companion app. Users upload a photo; Petory **generates** a personalized desktop pet — not a cutout of the original image. The pet lives on screen, chats, runs pomodoros, sends sedentary reminders, and grows over time.

**Tagline:** Upload a photo — let it move into your computer.

## Image Processing = AI Pet Generation

This is **not** a background-removal tool. It is **AI desktop pet generation**.

- User uploads one image → Petory auto-generates a desktop-ready pet
- No manual editing, cropping, pose pick, or style pick in MVP
- **MiniMax** generates the pet image (Petory Style, 3/4 sitting pose)
- **rembg** removes background on the generated result (backend only, never shown to user)
- Final output: transparent PNG for the desktop window

## MVP Priority (strict order)

1. Upload → MiniMax generate → rembg → transparent desktop pet
2. Desktop presence (transparent, draggable, always-on-top window)
3. AI companion chat (personality-driven, short replies)
4. Pomodoro + growth system
5. **Multi-style selection** (Pixel, Sticker, Plush, Clay, Cyber Pet, etc.) — later version
6. Multi-pose state images / Voice / Live2D — later version

**No fallback to original-image cutout.** Generation or rembg failure → Regenerate or Upload Another Photo.

## User Creation Flow (3 steps)

1. Upload image
2. Wait for generation
3. Use pet

Result page buttons only: **Use This Pet** | **Regenerate** | **Upload Another Photo**

Never expose in MVP: original cutout, rembg steps, manual edit tools, pose picker, style picker.

Style selection is **planned for a later version** — do not remove style-related schema or roadmap from docs/code.

## Platform Strategy

- **Product plan:** macOS + Windows (Electron)
- **Dev order:** One platform MVP first, then cross-platform
- **Out of scope for v1:** Mobile, browser extension, account, cloud sync, multi-pet on screen, Live2D, multi-pose images
- **Deferred to later versions:** Style picker and additional styles (see Style Roadmap below)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Shell | Electron + electron-builder |
| UI | React + TypeScript + Vite + Tailwind CSS |
| State | Zustand or Redux Toolkit |
| Storage | SQLite preferred; paths in DB, files on disk |
| Pet generation | **MiniMax** image-to-image |
| Background removal | **rembg** (post-generation, local) |
| Chat AI | **MiniMax** |
| Animations | CSS / Canvas only — states via animation, not multi-pose assets |

## Generation Pipeline

```
upload → validate format/size → compress (max edge 1280px)
  → MiniMax (Petory Style, 3/4 sitting pose) → save minimax_raw.png
  → rembg → save pet.png (transparent PNG)
  → result page → user confirms → create pet
```

## Default Pose (MVP, fixed)

**Front-facing 3/4 sitting pose** — single subject, full body sitting, slight 3/4 turn, face toward viewer. No stand, lie, walk, back-facing, side profile, or cropped body.

## Style Strategy

### MVP (v1)

**Petory Style** only — cute, clean, complete chibi desktop pet. Fixed default; no style picker UI.

### Later Versions (keep in roadmap, do not delete)

| Style | Description |
|-------|-------------|
| **Petory Style** | Default chibi desktop pet (MVP) |
| **Pixel** | Retro pixel-art pet |
| **Sticker** | Flat sticker-like pet |
| **Plush** | Soft plush doll look |
| **Clay** | Clay / 3D craft look |
| **Cyber Pet** | Sci-fi / neon cyber pet |

- Reserve `styleType` on `Pet` from day one (MVP default: `'petory'`)
- Style picker UI and per-style MiniMax prompts ship in a **later version**, not MVP
- Commercialization can gate extra styles behind Pro / per-generation unlock

## File Layout per Pet

```
appData/pets/{petId}/source/original.{ext}
appData/pets/{petId}/source/compressed.{ext}
appData/pets/{petId}/generated/minimax_raw.png
appData/pets/{petId}/generated/pet.png   ← final desktop asset
```

## Version Roadmap

详细版本文档见 **[docs/versions/](./docs/versions/README.md)**（每版独立：目标、范围、任务、验收）。

| Version | Goal | Doc |
|---------|------|-----|
| V0.1 | Transparent window, fixed PNG, drag, bubble, right-click menu | [v0.1.md](./docs/versions/v0.1.md) |
| V0.2 | Upload, compress, MiniMax generate, rembg, save pet data, result page | [v0.2.md](./docs/versions/v0.2.md) |
| V0.3 | Chat panel, MiniMax AI, personality prompts | [v0.3.md](./docs/versions/v0.3.md) |
| V0.4 | Pomodoro, sedentary reminder, XP/levels | [v0.4.md](./docs/versions/v0.4.md) |
| V0.5 | Dual-platform packaging, settings, error handling | [v0.5.md](./docs/versions/v0.5.md) |
| V1.0 | Website, auto-update, accounts, Pro features | [v1.0.md](./docs/versions/v1.0.md) |
| V1.1+ | Multi-style, multi-pose, multi-pet, voice, etc. | [v1.1-plus.md](./docs/versions/v1.1-plus.md) |

## Core Data Models

- `Pet` — id, name, source paths, generated paths, personality, level, exp, isActive, timestamps
- `UserSettings` — launch, alwaysOnTop, petSize, opacity, reminders, pomodoro, API keys
- `InteractionLog` — petId, type, content, createdAt
- `FocusSession` — petId, start/end, duration, status, expReward

MVP: **one active pet**; schema may support multi-pet later.

## Pet States (animation only in MVP)

idle (float) · happy (sway) · focus (breath) · sleep (fade + Zzz) · remind (bounce) · angry (shake)

Do not generate separate pose images per state until post-MVP.

## Content & Privacy

- Encourage own pets, OC, owned avatars; discourage celebrity/IP uploads
- Original + compressed images local; MiniMax receives compressed input for generation
- Disclose cloud generation to user
- AI speaks as the pet; no medical/legal/investment advice

## MVP Acceptance (pet generation)

- [ ] Upload PNG/JPG/JPEG/WEBP ≤ 10MB; auto-compress to 1280px max edge
- [ ] MiniMax outputs single-subject 3/4 sitting pet facing viewer
- [ ] rembg produces transparent PNG suitable for 160–220px desktop display
- [ ] Result page: Use / Regenerate / Upload Another — no cutout, edit, pose, or style picker (MVP)
- [ ] Failure paths: Try Again + Upload Another — no original-image fallback

## UI Design

- **App interface:** [docs/UI-DESIGN.md](./docs/UI-DESIGN.md) — colors, typography, components, pages, desktop overlay
- **Pet image style:** Petory Style (AI-generated chibi) — not the same as app UI; see `image-processing.mdc`
- Cursor rule: `.cursor/rules/ui-design.mdc` (applies to `*.tsx`, `*.css`)

## When Implementing

- Read `.cursor/rules/*.mdc` for file-specific conventions
- Match version milestone (V0.x); minimize scope per task
- Do not add pose picker, style picker UI, manual editor, or 原图版 in MVP unless explicitly requested
- Keep `styleType` field and later-version style definitions in schema/docs — styles are deferred, not removed
