### Quick Wins (Low/No Risk)

_Scope: universal-nextjs-scanner pass — 2026-04-15._

**Quick Win #1: Make navbar brand a real home link**
- File: `components/landing/LandingNavbar.tsx:32-38`
- Time: ~10 minutes
- Risk: None
- Benefit: Keyboard and screen-reader users can focus the logo and return to `/`; matches common site patterns.
- Suggested change: wrap the brand `div` (icon + “Cody_”) in `<Link href="/" className="...">` and preserve styles.

**Quick Win #2: Tighten QStash `channelId` / `messageId` with Discord-safe patterns**
- File: `lib/qstash.ts:6-21`
- Time: ~15 minutes
- Risk: None (if regex matches IDs you already emit from Discord flows)
- Benefit: Defense in depth so worker URLs only receive numeric snowflakes, even if a future publisher changes.
- Suggested change: e.g. `z.string().regex(/^\d{5,32}$/)` for `channelId` and `messageId` on the `agent` branch (keep `keepalive` loose if needed).

**Quick Win #3: Validate `POLYGON_REST_BASE_URL` against an allowlist**
- File: `lib/tools/stocks.ts:12-15`
- Time: ~15 minutes
- Risk: Low (breaks only if someone uses a nonstandard Polygon-compatible host without updating the allowlist)
- Benefit: Eliminates accidental SSRF-class misuse if the env var is ever mistyped or pointed at an internal URL.
- Suggested change: allow only `https://api.polygon.io` and `https://api.massive.com` (or your documented list), else fall back to `DEFAULT_REST_BASE_URL`.

---

### Quick wins — completed (earlier session)

1. **External links** — `rel="noopener noreferrer"` on `LandingNavbar.tsx`, `app/page.tsx`, and `LandingHero.tsx`.
2. **Metadata** — Product `title` / `description` in `app/layout.tsx`.
3. **`zod` direct dependency** — Declared in `package.json`.
4. **Agent payload limits** — `app/api/agent/route.ts`: max 40 messages, 12k chars per message, optional `userId`/`channelId` max 256 chars.
5. **Web demo a11y** — `aria-label` / `id` on textarea in `WebDemoModal.tsx`.

---

### High-priority operational — completed (`high-priority_fixes` plan)

1. **Discord gateway QStash worker** (`app/api/discord/gateway/route.ts`):
   - Redis **claim** `NX` + 300s TTL and **done** key 24h; release claim on failure; structured `[QStash]` logs.
   - Pruned **in-memory** fallback only when Redis is missing (with one-time `console.warn`).
   - Host normalization for keepalive **inlined** (no duplicate top-level helper).
2. **Validation responses** — `app/api/agent/route.ts` and gateway: **production** returns generic `{ error: "…" }` on Zod failure; **development** still includes `details: flatten()`; full Zod error **always** `console.error` server-side.

---

### Medium (scanner) — completed (this session)

| Item | What changed |
|------|----------------|
| **System prompt date** | `lib/agent.ts`: `SYSTEM_PROMPT_BASE` + `buildSystemPrompt()` so **current ISO date is computed per `createCodyAgent` call**. |
| **Route error UI** | `app/error.tsx` — branded segment error + reset + home link; dev-only message preview. |
| **Root error UI** | `app/global-error.tsx` — minimal html/body + `globals.css`, retry, dev message. |
| **Marketing `fetch` timeout** | `lib/tools/marketing.ts`: `AbortSignal.timeout(12_000)` + catch timeout/network. |
| **Polygon key not in URL** | `lib/tools/stocks.ts`: `Authorization: Bearer <key>` for last-trade and prev aggregates (no `apiKey` query param). |
| **Copy vs runtime** | `app/page.tsx` (workflow + Market Intel + PR copy), `LandingFaq.tsx` (model FAQ), `LandingHero.tsx` (badge) aligned with **`grok-4-1-fast-reasoning`** and softer claims (no “automated trading”, Draft PRs explicit). |
| **Navbar scroll bar** | `LandingNavbar.tsx`: **`--scroll-pct` CSS variable** on wrapper + `w-(--scroll-pct)` on bar (no inline `width`). |

---

### Low — intentionally deferred

- **`lib/tools/github.ts`** — `createBranchAndPR` stub / no-op; you asked to leave GitHub integration for later.

---

### Explicitly out of scope (unchanged)

- Rate limiting, Clerk auth, payments — handle later when you choose.

---

### Verify after changes

- `npm run build` — **passing** (last run after Medium batch).
- Optional: hit an invalid `POST` to `/api/agent` in dev vs prod build to confirm Zod `details` gating.
