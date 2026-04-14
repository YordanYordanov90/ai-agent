# Cody — Product Requirements Document

**Version**: 1.5
**Date**: April 14, 2026
**Status**: Active development
**Author**: Yordan Yordanov
**Companion to**: `TECHNICAL.md`

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

## Key Technical Notes (verified April 14, 2026)

- Discord: **HTTP Interactions only** (no Gateway, no cron jobs)
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