# Vault — Credit Card Advisor (RAG)

A premium web app that tells you **which of your credit cards to use** for any
purchase — with the math shown.

- **Stack:** Next.js 15 (App Router) · TypeScript strict · Tailwind · Supabase
  (Postgres + Auth + `pgvector`) · Ollama (`llama3.1:8b` + `nomic-embed-text`).
- **Three ways to add cards:** manual form, fetch-from-web by card name, or
  upload a terms PDF.
- **Advisor:** natural-language query → intent extraction → merchant→category
  lookup → semantic card ranking → streamed answer with the math.

## Quickstart

```bash
cp .env.example .env.local       # fill creds (see comments)
pnpm install
# Apply db/migrations/001_init.sql in the Supabase SQL editor
pnpm seed:merchants              # requires Ollama
pnpm dev
```

Visit http://localhost:3000.

## Scripts

| script                | what it does                              |
| --------------------- | ----------------------------------------- |
| `pnpm dev`            | Next.js dev server                        |
| `pnpm build`          | Production build                          |
| `pnpm typecheck`      | `tsc --noEmit`                            |
| `pnpm lint`           | next lint                                 |
| `pnpm test`           | Vitest unit tests                         |
| `pnpm test:e2e`       | Playwright (desktop + mobile)             |
| `pnpm evals`          | Eval harness on the deterministic ranker  |
| `pnpm seed:merchants` | Embed & insert ~100 merchants             |

See `CLAUDE.md` for the development workflow rules.
