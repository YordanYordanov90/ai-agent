# Cody — Product Requirements Document

**Version**: 1.6
**Date**: April 15, 2026
**Status**: Active development
**Author**: Yordan Yordanov
**Companion to**: `TECHNICAL_.md`

---

## Project Overview

**Cody** is your personal AI coding + business action agent that lives inside your private Discord server. You chat with it (@Cody or slash commands) and it instantly:
- Writes production-ready Next.js / TypeScript / full-stack code
- Automatically creates a GitHub branch + Draft PR
- Analyzes real-time stocks & crypto prices, charts, and sentiment
- Handles marketing & business tasks (competitor research, campaign ideas, social post drafts, SEO)
- Always uses Human-in-the-Loop confirmation for every write or financial action

**Tagline**: “Chat once. Ship code. Take action.”

---

## Product Summary

A purpose-built Discord agent powered by Grok (xAI) + Vercel AI SDK. It combines conversational coding help with real-world execution (GitHub PRs, market data, marketing automation). Unlike generic chatbots, Cody is scoped to your Next.js stack, enforces best practices, and only acts after your explicit approval.

---

## Target Users

- You (Next.js developer & trader/entrepreneur)
- Solo founders who want a coding + business co-pilot
- Small dev teams that want a shared Discord agent

**Persona — “Yordan”**
- Next.js developer building side projects and trading tools
- Wants code + GitHub workflow without leaving Discord
- Needs fast market insights for crypto/stocks/marketing decisions

---

## Jobs To Be Done

- “Write a new auth page with rate limiting and create a PR”
- “Analyze BTC and ETH right now and suggest portfolio moves”
- “Draft 5 LinkedIn posts for my new SaaS launch”
- “Review this component and push improvements as a draft PR”
- “Research competitors in the AI coding agent space”

---

## Core Value Proposition

The fastest way to go from idea → production code → deployed feature, plus instant market & marketing intelligence — all inside Discord.

---

## Live Product Structure

| Route              | Purpose                                      | Status      |
|--------------------|----------------------------------------------|-------------|
| `/api/agent`       | Core Grok streaming endpoint + tools         | ✅ Done     |
| `/api/discord`     | Discord HTTP Interactions handler            | ✅ Done     |
| `/`                | Simple landing page + web demo (optional)    | Phase 1.5   |

---

## Key Technical Notes (verified April 15, 2026)

- Discord: **Hybrid architecture** using HTTP Interactions + Gateway worker
- Scheduling: **Cron jobs enabled** for recurring automations and maintenance tasks
- Execution model: **QStash async pipeline** for Discord commands and scheduled jobs
- UI: Tailwind CSS v4 + **shadcn/ui**
- State / Memory: Upstash Redis (free tier sufficient)
- Grok models: `grok-4.20-reasoning` (default) or `grok-4-1-fast-reasoning`
- Fully compatible with Vercel Hobby plan

---

## Phased Roadmap

### Phase 1 — Core Agent (Done)
- Discord HTTP Interactions
- Streaming Grok responses

### Phase 2 — Action Tools (Current)
- GitHub branch + Draft PR
- Crypto & stock tools
- Marketing web-search tool
- Upstash Redis for memory & rate limiting
- QStash delivery for deferred Discord execution

---

## Discord + Gateway + Cron + QStash Flow

To reliably run Cody inside Discord, all non-trivial work is processed asynchronously through QStash:

1. Discord sends interaction to `/api/discord`
2. Server verifies Discord signature and immediately returns a deferred ACK
3. Interaction payload is published to QStash
4. QStash calls worker route (e.g. `/api/discord/gateway`) for execution
5. Worker executes agent/tooling and posts final response back to Discord
6. Gateway listener handles realtime events when needed and can enqueue QStash tasks
7. Cron jobs enqueue scheduled tasks into QStash for delayed/repeating workflows

This guarantees Discord timing compliance, supports realtime Gateway workflows, and enables scheduled automations while keeping full agent capability (GitHub, market tools, marketing actions).

### Phase 3 — Polish & Memory
- Conversation memory (Upstash Redis)
- Slash commands
- Code review + RAG (upload your repo)

### Phase 4 — SaaS Version
- Multi-user support
- Billing (optional)
- Web dashboard

---

*This document is the single source of truth for product decisions on Cody.*