# Cody — Technical Reference

**Version**: 1.6
**Date**: April 15, 2026
**Companion to**: `PRD_.md`

This file is the single source of truth for all implementation decisions — file structure, types, schemas, API contracts, and component-level detail. Hand this file to Cursor / Roo Code alongside `PRD_.md` for full context.

---

## 1. Project Structure
app/
├── api/
│   ├── agent/
│   │   └── route.ts                    # Core Grok streaming + tools
│   └── discord/
│       ├── route.ts                    # Discord interaction verify + deferred ACK + QStash publish
│       └── gateway/
│           └── route.ts                # QStash worker: execute agent and send Discord follow-up
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

## 2. Tech Stack (verified April 15, 2026)

| Layer              | Technology                                      | Notes |
|--------------------|-------------------------------------------------|-------|
| Framework          | Next.js 16 (App Router)                         | - |
| Language           | TypeScript 5                                    | - |
| AI                 | Vercel AI SDK + @ai-sdk/xai                     | - |
| Discord            | Chat SDK (`chat` + `@chat-adapter/discord`)     | Hybrid: HTTP Interactions + Gateway events |
| GitHub             | @github-tools/sdk                               | - |
| Styling / UI       | Tailwind CSS v4 + **shadcn/ui**                 | Copy-paste components |
| State              | Upstash Redis                                   | Free tier OK |
| Queue / Async      | Upstash QStash                                  | Required for deferred + scheduled execution |
| Scheduling         | Vercel Cron + QStash                            | Repeating tasks enqueue async jobs |
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

# Upstash QStash
QSTASH_URL=...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
DISCORD_INTERACTIONS_ENDPOINT=https://your-domain.vercel.app/api/discord
DISCORD_WORKER_ENDPOINT=https://your-domain.vercel.app/api/discord/gateway
```

---

## 4. Discord Integration

Public Discord interactions route: `/api/discord`
- Configure this as the **Interactions Endpoint URL** in Discord Developer Portal.
- Keep this route fast: verify and ACK, then enqueue work.
- Gateway event handling is supported via dedicated worker/runtime flow.

Flow:
1. Verify Discord request signature (`X-Signature-Ed25519`, `X-Signature-Timestamp`)
2. Handle ping with immediate pong
3. For commands/messages, return deferred response immediately
4. Publish payload to QStash (target: `/api/discord/gateway`)
5. Worker route validates QStash signature and processes agent logic
6. Worker sends follow-up response to Discord
7. Cron routes publish recurring jobs to QStash for scheduled tasks

Security requirements:
- Enforce both Discord signature validation and QStash signature validation.
- Reject stale timestamps and replayed requests.
- Never expose bot/GitHub tokens in responses or logs.

---

## 5. Grok Models (current)

`grok-4.20-reasoning` → default (best quality)  
`grok-4-1-fast-reasoning` → fast mode

---

## 6. Safety Rules

- All write tools are Draft PRs only
- Every GitHub / financial action requires explicit user “YES”
- Keys only in Vercel env
- Zod validation on every input

This file is the implementation companion to `PRD_.md`. Between the two files, nothing about Cody should be undocumented.