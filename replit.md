# PickSmart Academy + NOVA

## Overview

Full-stack **multi-warehouse SaaS** training and operations platform. Each warehouse account is a private, isolated tenant. NOVA Trainer (ES3 voice workflow) is exclusive to ES3-type warehouses. Standard warehouses get all other features. Owner (`draogo96`) bypasses all feature and subscription checks.

## Multi-Warehouse Architecture
- **Warehouse model**: `src/data/warehouses.ts` — Warehouse type, ES3 vs Standard feature sets
- **Warehouse store**: `src/lib/warehouseStore.ts` — Zustand store (persisted); `useWarehouse()` hook
- **Access control**: `src/lib/accessControl.ts` — `canAccessFeature(feature, warehouse, role)`
- **Warehouse entry routes**: `/w/:slug` — branded entry page showing warehouse features
- **Feature gating**: NOVA Trainer shown only for ES3 warehouses OR owner role
- **DB schema**: `lib/db/src/schema/warehouses.ts` — `warehouses` + `warehouse_users` tables
- **Invite tokens**: Include `warehouseId`/`warehouseSlug` — users tied to warehouse on accept
- **Data isolation**: Each user has optional `warehouseId` + `warehouseSlug` on their account

## ES3 Features (8 total)
training, nova-help, nova-trainer, common-mistakes, leaderboard, selector-breaking-news, trainer-dashboard, supervisor-dashboard

## Standard Features (7 total — no nova-trainer)
training, nova-help, common-mistakes, leaderboard, selector-breaking-news, trainer-dashboard, supervisor-dashboard

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
- **State**: Zustand (role switcher, session store)
- **Routing**: Wouter

## Roles & Navigation
- **selector**: Home, Training, Mistakes Guide, My Assignments, NOVA Voice
- **trainer**: + Assignment Control, Slot Master, Warehouse Reference, Voice Commands, Trainer Dashboard
- **supervisor**: + Live Tracking, Supervisor Dashboard
- **owner**: everything + Control Center, Users & Access (both owner-only)

## Subscription Plans (AuthAccount.subscriptionPlan)
- `"owner"` — master account only, full access
- `"company"` — selector/trainer/supervisor role pages; never owner/users-access
- `"personal"` — selector-only pages
- `null` — no subscription yet

## Access Control
- `/owner` and `/users-access` → owner-only (ProtectedRoute requiredRole="owner")
- `/pricing`, `/choose-plan`, `/checkout/personal`, `/checkout/company` → public
- All other feature pages → require login + matching role

## Pages

### Public (no login required)
- `/` — HomePage (hero, features)
- `/pricing` — Pricing page: Personal vs Company plan cards + FAQ + CTA
- `/choose-plan` — Choose Your Access Plan: Personal or Company selection
- `/checkout/personal` — Personal Plan Checkout (sets subscriptionPlan="personal", isSubscribed=true)
- `/checkout/company` — Company Plan Checkout (sets subscriptionPlan="company", isSubscribed=true)

### Training & Tools
- `/training` — Training modules grid
- `/training/:id` — Module detail (with video player)
- `/training/lesson/:id` — NOVA-guided lesson session (with video player)
- `/mistakes` — Common mistakes guide
- `/progress` — Progress dashboard
- `/leaderboard` — Ranked leaderboard

### NOVA Internal
- `/nova-help` — NOVA Help AI voice coach (Whisper STT + gpt-4o-mini)
- `/nova-trainer` — NOVA Trainer ES3 Script Mode (NOVA ID gate → WebSocket-driven server state machine)
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

## Bilingual Support (i18n)
- **Library**: `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Config**: `src/i18n.ts` — default namespace `common`, browser language detection via localStorage
- **Locales**: `src/locales/en/common.json` + `src/locales/es/common.json`
- **Switcher**: `src/components/layout/LanguageSwitcher.tsx` — 🇪🇸/🇺🇸 flag toggle in header
- **Coverage**: All pages (Hero, Training, Mistakes, Progress, Leaderboard, Supervisor, Trainer, Users)
- **NOVA Trainer**: Safety items array + all voice prompts fully translated (EN/ES)
- **NOVA Help**: Wake words "Hey NOVA"/"Hola NOVA", stop words "stop"/"parar"
- **API**: NOVA Help backend sends Spanish system prompt when `language.startsWith("es")`

## NOVA Help AI Coach
- **Page**: `/nova-help` — Wake word flow, auto-listen loop, session log, hints panels
- **Backend**: `artifacts/api-server/src/routes/novaHelp.ts` — `POST /api/nova-help`
- **Transcription**: `POST /api/transcribe` → `gpt-4o-mini-transcribe` via `speechToText()` audio helper + ffmpeg WAV conversion
- **AI model**: `gpt-4o-mini` via Replit AI Integrations proxy (`@workspace/integrations-openai-ai-server`)
- **System prompt**: Warehouse-selecting coach, 1–4 sentence answers, practical trainer tone (EN + ES)
- **Language param**: `{ question, language }` — API returns Spanish when `language.startsWith("es")`
- **Fallback**: `src/lib/novaHelpMatcher.ts` — keyword scorer over 20 local knowledge entries
- **Wake word detection**: "Hey NOVA"/"Hola NOVA" captured in Whisper transcript triggers greeting
- **Stop word detection**: "stop"/"parar" → returns to wake listening mode
- **Auto-listen loop**: After each answer, automatically starts recording next question
- **Browser compatibility**: Shows fallback message when MediaRecorder not supported

## NOVA Mode Router
- **File**: `src/lib/novaModeRouter.ts`
- **`routeNovaInput(input)`**: Classifies text as "workflow" (exact command/pattern match) or "help" (question/AI)
- **`detectWakeWord(transcript)`**: Returns "en" | "es" | null for "Hey NOVA" / "Hola NOVA"
- **`detectStopWord(transcript)`**: Returns true for "stop" / "parar"

## NOVA Warehouse Tools
- **File**: `src/lib/novaWarehouseTools.ts`
- **`findSelectorByNovaId(novaId)`**: Looks up a selector by NOVA ID
- **`getAssignmentsForSelector(userId)`**: Filters ASSIGNMENTS by userId
- **`getAssignmentStops(assignmentId)`**: Returns stops for an assignment
- **`getSlotByCode(checkCode)`**: Looks up slot by check code
- **`getDoorInfo(doorNumber)`**: Looks up door staging code
- **`getWarehouseDefaults()`**: Returns printer/label defaults
- **`buildSessionContext(opts)`**: Builds AI-injectable context string

## NOVA Session Persistence
- **Zustand store**: `src/store/novaSessionStore.ts` — `useNovaSessionStore` (persisted to localStorage via `nova-session-v1`)
- **Storage helpers**: `src/lib/novaSessionStorage.ts` — `saveNovaSession()`, `loadNovaSession()`, `clearNovaSession()`, `hasResumableSession()`
- **Saved fields**: selectorId, novaId, selectorName, language, equipmentId, maxPalletCount, safetyIndex, currentAssignmentId, currentStopIndex, currentPhase
- **Resume button**: NOVA Trainer entry screen shows "Resume Session" banner when saved session found
- **Clear**: resetSession() clears the store; entry screen has "Clear" button next to resume

## NOVA Voice Status Component
- **File**: `src/components/nova/NovaVoiceStatus.tsx`
- **`NovaVoiceStatus`**: Colored badge showing current voice state (idle / wake_listening / active_listening / recording / transcribing / thinking / speaking / stopped / error)

## Soft Paywall System
- **Components**: `src/components/paywall/LockedAction.tsx` + `src/components/paywall/SubscribePromptModal.tsx`
- **Approach**: Content pages are publicly viewable; premium *actions* are gated
- **`LockedAction`**: Wraps any clickable area; uses `onClickCapture` to intercept child button clicks before they fire when locked; owner always bypasses; `onAllowedClick` navigates when allowed
- **`SubscribePromptModal`**: Dark navy modal with "View Plans" / "Subscribe Now" / "Continue Browsing" buttons
- **Gated actions**: Start Lesson (modules), Start Coaching (mistakes), Begin Session (NOVA Trainer), Start Session (NOVA Help), reactions/comments/post (Selector Breaking News)
- **All content pages** (`/training`, `/mistakes`, `/nova-help`, `/nova-trainer`, `/leaderboard`, `/selector-breaking-news`, `/selector-nation`) are publicly accessible — no SubscriptionRoute wrapper
- **Protected pages**: Trainer Portal, Supervisor Dashboard, Owner, Users & Access remain role-gated via SubscriptionRoute

## NOVA Trainer
- **Page**: `/nova-trainer` — NOVA ID gate → full ES3 script session
- **Voice**: `useVoiceEngine` hook — Web Speech API (webkitSpeechRecognition) with exponential backoff
- **Note**: Chrome webkitSpeechRecognition gets "aborted" errors in Replit environment — session still works via quick-command buttons and text input
- **Session store**: Syncs phase/equipment/assignment state to `novaSessionStore` on every change
- **Resume**: Detects saved sessions on mount, restores phase and all key fields

## Training Video System
- **Data**: `src/data/lessonVideoMap.ts` — `youtubeId` per module (fill in to enable videos)
- **Component**: `src/components/training/LessonVideoPlayer.tsx` — shows embedded player or placeholder + YouTube search link
- **Integration**: Lesson session welcome screen + module detail expandable rows

## Architecture Notes
- Frontend is pure Vite SPA, no SSR
- API is OpenAPI-first, codegen via Orval
- All data is persisted in PostgreSQL
- Authentication: username/password via `authStore.ts` (Zustand + localStorage)
- Master credentials: `draogo96` / `Draogo1996#` (owner role)
- NOVA Help AI uses Replit-billed OpenAI credits (no user API key required)
- Whisper replaced by `gpt-4o-mini-transcribe` (whisper-1 not available on Azure-backed proxy)
