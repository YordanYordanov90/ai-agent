# Cody Agent Architecture – How It Works (April 2026)

**Repository**: https://github.com/YordanYordanov90/ai-agent  
**Live Demo**: https://ai-agent-rouge-sigma.vercel.app/  
**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Vercel AI SDK v6 + xAI Grok-4-1-fast-reasoning + Clerk + Upstash Redis/QStash + Discord + GitHub

This document explains **exactly** how Cody works under the hood — from a user typing `@Cody` in Discord or using the public web demo, down to every file and how they talk to each other.  
It is written in the same style as the Rust `simplest-coder` demo you studied: clear separation between **input → LLM → tools → execution**.

---

## 1. High-Level Architecture (the “Rust-style” loop)

Cody follows the exact same minimal agent pattern as `jeremychone/rust-genai-demos/simplest-coder`:

1. **Input** → validated & sanitized
2. **Context + System Prompt** → built (routing labels + demo guardrails)
3. **LLM call** (`streamText` + tools) → Grok decides what to do
4. **Tools** → executed (GitHub PRs, market data, marketing)
5. **Stream response** back to Discord or web terminal
6. **State** persisted in Redis (memory + chat history)

No heavy frameworks — just clean Next.js API routes + lib/ helpers.

---

## 2. User Flows

### Flow A – Public Web Demo (no login)
1. User opens https://ai-agent-rouge-sigma.vercel.app/
2. Types in the embedded terminal (simulates Discord)
3. Frontend POSTs to `POST /api/agent`
4. `demoMode = true` → limited tools (no GitHub writes)
5. Response streams back into the terminal UI

### Flow B – Full Discord Production Agent
1. User mentions `@Cody` in a connected Discord channel
2. Discord sends webhook → `POST /api/discord/...` (exact file not shown in tree but exists under `app/api/discord/`)
3. Discord adapters (`lib/discord-chat.ts`, `lib/discord-chat-state.ts`, `lib/discord-target-channel.ts`) parse message + load conversation context from Redis
4. Calls `createCodyAgent(...)` with `demoMode = false`
5. Full tools enabled (GitHub branch/PR creation, etc.)
6. Human-in-the-loop: Cody always asks for “YES” before creating Draft PRs

---

## 3. File-by-File Communication Map
User / Discord
│
▼
app/api/agent/route.ts                  ← Entry point (you pasted this)
│
├── RequestSchema (Zod) + sanitizeRoutingLabel
├── Demo-mode guard (max 3 messages)
│
▼
lib/agent.ts  ← createCodyAgent()      ← HEART OF THE AGENT
│
├── buildSystemPrompt()             ← lib/agent-context.ts
│   ├── adds current date
│   ├── injects userId / channelId (sanitized)
│   └── adds DEMO_MODE_GUARDRAIL when needed
│
├── tools = demoMode ? limited : full
│   ├── githubTools               → lib/tools/github.ts
│   ├── getCryptoData             → lib/tools/crypto.ts
│   ├── getStockPrice             → lib/tools/stocks.ts
│   └── webSearchMarketing        → lib/tools/marketing.ts
│
▼
Vercel AI SDK streamText()
│
├── model: xai("grok-4-1-fast-reasoning")
├── system prompt (from above)
├── messages (history)
├── tools (auto-called by Grok)
└── stopWhen: stepCountIs(12)     ← allows multi-tool chains
│
▼
Tool Execution (side-effects)
├── GitHub SDK (@github-tools/sdk) → creates branch + Draft PR
├── Upstash Redis (@upstash/redis) → via lib/redis.ts + lib/memory.ts
├── QStash (@upstash/qstash)       → via lib/qstash.ts (background jobs)
└── Rate limiting                  → lib/rate-limit.ts
│
▼
Stream back to client
├── Discord (via @chat-adapter/discord)
└── Web terminal (landing page)
text### Most Important Files & Their Exact Role

| File | Role | How it talks to others |
|------|------|------------------------|
| `app/api/agent/route.ts` | Public API controller (web demo + internal calls) | Parses JSON → calls `createCodyAgent` → returns `toTextStreamResponse()` |
| `lib/agent.ts` | Core agent factory | Imports tools + `sanitizeRoutingLabel` → builds prompt → `streamText` with xAI |
| `lib/agent-context.ts` | Security & routing | Only `sanitizeRoutingLabel()` – strips injection chars for userId/channelId |
| `lib/tools/github.ts` | GitHub actions | Called by Grok via Vercel AI tools → uses `@github-tools/sdk` to create branch + Draft PR |
| `lib/tools/crypto.ts` / `stocks.ts` / `marketing.ts` | Market & SEO tools | Pure functions that Grok can call (read-only in demo mode) |
| `lib/discord*.ts` | Discord glue | `discord-chat.ts` + `discord-chat-state.ts` manage conversation state and trigger agent |
| `lib/redis.ts` + `lib/memory.ts` | Persistent memory | Stores conversation history and runtime context (used by every agent call) |
| `lib/qstash.ts` | Async/background | Queues long-running jobs (e.g. heavy scraping) |
| `lib/rate-limit.ts` | Protection | Prevents abuse on both web demo and Discord |

---

## 4. Key Design Patterns (Rust-inspired)

- **Strict input validation** – Zod everywhere (exactly like Rust’s Serde + type safety)
- **Clear separation** – Controller (`route.ts`) → Agent (`lib/agent.ts`) → Tools → Executor
- **Demo guardrails** – Same idea as the Rust `udiffx` strict output format: the system prompt forces safe behavior
- **Human-in-the-loop** – GitHub tools never merge; always Draft PR
- **Streaming** – Vercel AI `streamText` mirrors the Rust CLI’s clean output handling

---

## 5. Tech Stack Summary (from package.json)

- **Frontend** – Next.js 16 + React 19 + Tailwind v4 + shadcn/ui
- **AI** – `@ai-sdk/xai` + `ai` v6 + Grok-4-1-fast-reasoning
- **Auth** – Clerk (`@clerk/nextjs`)
- **Discord** – `@chat-adapter/discord`
- **State** – Upstash Redis + QStash
- **GitHub** – `@github-tools/sdk`
- **Validation** – Zod

---

## 6. How to Extend Cody (next steps you can do today)

1. Add a new tool → create `lib/tools/new-tool.ts` and import it in `lib/agent.ts`
2. Improve memory → extend `lib/memory.ts`
3. Add WASM Rust core (your learning goal) → call the `simplest-coder` logic via WASM for ultra-fast parsing

Would you like me to generate the full `lib/tools/github.ts` example or a WASM bridge next?

---

**This architecture is production-grade and hireable.**  
Recruiters in 2026 love seeing “Discord-native AI agent with strict tool separation, human-in-the-loop, and Rust-inspired design” on a résumé + public repo.