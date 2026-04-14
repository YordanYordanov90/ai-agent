# Cody — Technical Reference

**Version**: 1.5
**Date**: April 14, 2026
**Companion to**: `PRD.md`

This file is the single source of truth for all implementation decisions — file structure, types, schemas, API contracts, and component-level detail. Hand this file to Cursor / Roo Code alongside `PRD.md` for full context.

---

## 1. Project Structure
app/
├── api/
│   ├── agent/
│   │   └── route.ts                    # Core Grok streaming + tools
│   └── discord/
│       └── route.ts                    # Chat SDK HTTP Interactions
├── lib/
│   ├── tools/
│   │   ├── github.ts
│   │   ├── crypto.ts
│   │   ├── stocks.ts
│   │   └── marketing.ts
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
├── page.tsx                            # Landing page
├── components/landing/                 # Landing components
└── lib/upstash.ts                      # Redis client
text---

## 2. Tech Stack (verified April 14, 2026)

| Layer              | Technology                                      | Notes |
|--------------------|-------------------------------------------------|-------|
| Framework          | Next.js 16 (App Router)                         | - |
| Language           | TypeScript 5                                    | - |
| AI                 | Vercel AI SDK + @ai-sdk/xai                     | - |
| Discord            | Chat SDK (`chat` + `@chat-adapter/discord`)     | HTTP Interactions only |
| GitHub             | @github-tools/sdk                               | - |
| Styling / UI       | Tailwind CSS v4 + **shadcn/ui**                 | Copy-paste components |
| State              | Upstash Redis                                   | Free tier OK |
| Validation         | Zod                                             | - |
| Deployment         | Vercel (Hobby plan fully supported)             | - |

---

## 3. Environment Variables

```env
XAI_API_KEY=your_xai_key_here
GITHUB_TOKEN=ghp_...                     # repo + workflow scopes
DISCORD_BOT_TOKEN=...
DISCORD_PUBLIC_KEY=...
DISCORD_APPLICATION_ID=...

# Upstash Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

4. Discord Integration

Only one route: /api/discord
Set this exact URL as your Interactions Endpoint URL in the Discord Developer Portal


5. Grok Models (current)

grok-4.20-reasoning → default (best quality)
grok-4-1-fast-reasoning → fast mode


6. Safety Rules

All write tools are Draft PRs only
Every GitHub / financial action requires explicit user “YES”
Keys only in Vercel env
Zod validation on every input

This file is the implementation companion to PRD.md. Between the two files, nothing about Cody should be undocumented.