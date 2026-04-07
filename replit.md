# PickSmart Academy + NOVA

## Overview

Full-stack warehouse training and assignment management platform combining a public training website with a role-based internal NOVA voice-directed picking system.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/picksmart-nova)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **State**: Zustand (role switcher)
- **Routing**: Wouter

## Roles & Navigation
- **selector**: Home, Training, Mistakes Guide, My Assignments, NOVA Voice
- **trainer**: + Assignment Control, Slot Master, Warehouse Reference, Voice Commands
- **supervisor**: + Live Tracking, Trainer Portal
- **owner**: + Pricing, Users & Access, System Settings

## Pages

### Public
- `/` — HomePage (hero, features)
- `/training` — Training modules grid
- `/training/:id` — Module detail
- `/mistakes` — Common mistakes guide
- `/progress` — Progress dashboard
- `/leaderboard` — Ranked leaderboard
- `/pricing` — Pricing tiers

### NOVA Internal
- `/nova` — My Assignments (selector view)
- `/nova/assignments/:id` — Assignment detail + stops table
- `/nova/voice/:id` — NOVA voice session simulation
- `/nova/control` — Assignment Control (trainer+)
- `/nova/warehouse` — Warehouse Reference (slots/doors/defaults)
- `/nova/slots` — Slot Master searchable table
- `/nova/voice-commands` — Voice commands reference
- `/nova/tracking` — Live tracking grid (supervisor+)

## Seeded Data
- **System Defaults**: Printer 307, Alpha Label 242, Bravo Label 578
- **Door Codes**: 355→641, 370→714, 340→581
- **Assignments**: 251735 (38 stops), 251736 (7 stops), 251737 (7 stops), 251738 (7 stops)
- **Training Modules**: 6 modules across Safety, Efficiency, NOVA, Quality, Delivery, Performance
- **Leaderboard**: 8 seeded selectors

## Database Schema
- `assignments` — assignment records
- `assignment_stops` — stop-by-stop picks per assignment
- `system_defaults` — printer/label defaults
- `door_codes` — door staging codes
- `slot_master` — slot reference data
- `training_modules` — training content
- `leaderboard` — performance rankings

## Key Commands
- `pnpm run typecheck` — full typecheck
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/picksmart-nova run dev` — run frontend

## NOVA Help AI Coach
- **Page**: `/nova-help` — Voice AI Coach section at top, Voice Commands reference, FAQ, Quick Reference cards
- **Backend**: `artifacts/api-server/src/routes/novaHelp.ts` — `POST /api/nova-help`
- **AI model**: `gpt-4o-mini` via Replit AI Integrations proxy (`@workspace/integrations-openai-ai-server`)
- **System prompt**: Warehouse-selecting coach, 1–4 sentence answers, practical trainer tone
- **Fallback**: `src/lib/novaHelpMatcher.ts` — keyword scorer over 20 local knowledge entries
- **Wake word**: "Hey NOVA" activates listening; "stop" silences
- **Voice engine**: `useVoiceEngine` (named export) — Web Speech API for listen/speak cycle

## Architecture Notes
- Frontend is pure Vite SPA, no SSR
- API is OpenAPI-first, codegen via Orval
- All data is persisted in PostgreSQL
- Role switching is client-side via Zustand store (for demo — no auth backend)
- NOVA voice session is simulated (button-click flow, no actual Web Speech API required)
- NOVA Help AI uses Replit-billed OpenAI credits (no user API key required)
