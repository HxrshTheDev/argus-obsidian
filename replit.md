# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: ARGUS OBSIDIAN

A privacy-first AI data protection tool that detects, masks, and restores PII in text before it reaches AI/LLM systems.

**Live app**: `artifacts/argus-obsidian/` (frontend, served at `/`)
**API**: `artifacts/api-server/` (Express backend, served at `/api`)

### Features
- Real-time client-side PII detection as user types (10 categories: API keys, tokens, passwords, credit cards, URLs with credentials, emails, phones, addresses, IDs, names)
- Server-side masking via POST `/api/process`
- Animated hero with letter-by-letter reveal
- Terminal-style demo UI with risk bar and threat index
- Dark theme with cyan (#99f7ff) and purple (#ac89ff) accents

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS v4)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (provisioned but not used by current app)
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Key Files

- `artifacts/argus-obsidian/src/pages/Home.tsx` — main page with all sections
- `artifacts/argus-obsidian/src/index.css` — global styles and animations
- `artifacts/argus-obsidian/index.html` — loads Google Fonts (Manrope, Inter, Space Grotesk) and Material Symbols
- `artifacts/api-server/src/routes/process.ts` — POST /api/process PII masking route
- `lib/api-spec/openapi.yaml` — OpenAPI spec

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
