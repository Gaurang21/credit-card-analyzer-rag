# CLAUDE.md — Credit Card Advisor

Workflow rules for this repo. Re-read at the start of every session. The kickoff
prompt has the product spec, schema, and setup details — this file is just the
rules. If anything here conflicts with a one-off user request, ask before
deviating.

---

## 1. Git workflow

### First commit
- Build the **entire initial app** end-to-end and commit directly to the
  designated initial branch (currently `claude/sleepy-rubin-v2krN`).
- This is the only time the initial branch receives a giant scaffold commit.

### All subsequent work
- Every feature, fix, or change goes on `feature/<short-kebab-name>`.
  - Examples: `feature/add-amex-detection`, `feature/fix-pwa-icon`
- One branch = one logical change.
- Open a PR-style summary in chat when ready: what changed, why, how to test, screenshots.
- Never force-push, never rebase shared branches, never commit to `main` without explicit approval.

### Commit messages
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`
- Imperative mood, ≤72 chars on the subject.

---

## 2. Definition of Done

1. Code written and saved
2. `pnpm typecheck` passes
3. `pnpm lint` passes
4. `pnpm test` passes (vitest)
5. `pnpm build` passes
6. `pnpm test:e2e` passes for new/changed features
7. At least one Playwright screenshot for new features shared in chat
8. Mobile viewport (375×667) screenshot for any UI change
9. Short summary posted: built / tested / how to try

---

## 3. Testing

- **Unit (Vitest)**: every utility, API route handler, and prompt builder.
- **E2E (Playwright)** in `e2e/`, screenshots saved to `e2e/screenshots/<feature>-<viewport>.png`.
- Two viewports: desktop (1280×720) and mobile iPhone-SE (375×667).
- `page.screenshot({ path, fullPage: true })`.

---

## 4. LLM rules

- All LLM calls go through `lib/ollama/`. Never `fetch` from components.
- Every prompt is a named exported constant in `lib/ollama/prompts.ts`.
- Send `Authorization: Bearer ${process.env.OLLAMA_API_TOKEN}` on every request (handled in `lib/ollama/client.ts`).
- Validate LLM output with Zod before saving (`lib/cards/schema.ts`).
- Show parsed JSON to the user for confirmation before writing card data to the DB.
- Stream advisor responses to the UI (`/api/advisor` returns SSE).

---

## 5. Database rules

- Schema changes go in `db/migrations/NNN_description.sql`.
- Show the SQL before applying it.
- Enable RLS on every user-owned table.
- Verify RLS with a second test account before claiming auth is done.
- Regenerate types after schema changes:
  `pnpm dlx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts`

---

## 6. Mobile compatibility

- Mobile-first; default styles target 375px, scale up with `md:` / `lg:`.
- Tap targets ≥ 44×44px.
- Every UI change screenshotted on both viewports.

---

## 7. Security & privacy

- `SUPABASE_SERVICE_ROLE_KEY` is **server-side only** — never in a client component.
- Don't store full card numbers. Metadata only.
- Validate every API route input with Zod.
- Sanitize fetched HTML before passing to the LLM (`htmlToCleanText`).

---

## 8. Communication

- Plan first. Wait for "go."
- Show SQL before running migrations.
- Show prompts before wiring new LLM calls.
- Ambiguous? Ask. Max two guess-attempts before stopping.

---

## 9. Local dev quickstart

```bash
cp .env.example .env.local   # fill in Supabase + Ollama creds
pnpm install
pnpm dev                     # http://localhost:3000
```

Run the SQL migration in the Supabase SQL editor:
`db/migrations/001_init.sql`.

Then seed merchant categories (requires Ollama running):
```bash
pnpm seed:merchants
```
