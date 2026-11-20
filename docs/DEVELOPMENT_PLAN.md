# Diety Freelance Marketplace Platform - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, and integrate the full-stack Diety freelance dietitian marketplace platform across backend API, web portal, dedicated admin console, and cross-platform mobile app, strictly adhering to Hexagonal Architecture, Domain-Driven Design (DDD), and $0-budget local infrastructure.

**Architecture:** Monorepo architecture managed via Turborepo and pnpm workspaces. The core business rules and 6 Bounded Contexts are isolated inside a NestJS 12 Hexagonal backend with pure domain entities. Delivery applications (Next.js 16 Web, Next.js 16 Admin, Expo 58 Mobile) interact via validated REST DTOs and Socket.io WebRTC signaling. Data is persisted in PostgreSQL 16/19 via Prisma 7 with an immutable double-entry escrow ledger, Redis 8 BullMQ queues, MinIO S3 document storage, and local Ollama AI simulation models.

**Tech Stack:** 
- Runtime: Node.js 26 Active LTS ("Lithium")
- Language: TypeScript 7.0+ (Strict mode)
- Backend: NestJS 12, Prisma ORM 7, BullMQ 6, ioredis 6, Socket.io 4, Argon2, Zod 4
- Web & Admin: Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI, TanStack Query 5, TanStack Table 9, Recharts 3, simple-peer
- Mobile: Expo SDK 58, React Native 0.88, NativeWind 4, React Native WebRTC, Expo SecureStore
- Local Services ($0 Budget): PostgreSQL 16/19, Redis 8, MinIO S3, Ollama (Llama 3.2 3B & Qwen 2.5 7B), Google STUN

**Specs & Foundations:**
- [`SOFTWARE_REQUIREMENTS_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/docs/SOFTWARE_REQUIREMENTS_SPECIFICATION.md)
- [`SOFTWARE_DESIGN_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/docs/SOFTWARE_DESIGN_SPECIFICATION.md)
- [`DATABASE_SCHEMA.md`](file:///d:/FullStackProjects/Diety/docs/DATABASE_SCHEMA.md)
- [`CODE_ARCHITECTURE_AND_PRINCIPLES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_ARCHITECTURE_AND_PRINCIPLES.md)
- [`CODE_SPECIFICATION_AND_DEPENDENCIES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_SPECIFICATION_AND_DEPENDENCIES.md)
- [`ARCHITECTURE_C4_DIAGRAMS.md`](file:///d:/FullStackProjects/Diety/docs/ARCHITECTURE_C4_DIAGRAMS.md)

---

## Global Constraints

- **Dependency Inversion Invariant:** Domain layer files (`domain/`) must NEVER import from `@nestjs/*`, `@prisma/*`, `ioredis`, `minio`, or any external IO libraries.
- **Financial Balance Invariant:** $\text{TotalUSD} \equiv \text{PlatformFeeUSD} + \text{NetEarningsUSD}$ must hold on every contract and ledger transaction with zero floating point drift (stored in integer cents).
- **Exact Fiat Refund Invariant:** Client refunds must return the exact local currency fiat units originally paid regardless of exchange rate movements.
- **Single-Hire Lock Invariant:** Once a proposal on a requirement is accepted, the requirement immediately locks and all competing proposals are rejected.
- **Attendance Safety Invariant:** A video consultation only qualifies as completed if server logs record $\ge 15$ minutes of mutual cryptographic room presence.
- **Escrow Release Invariant:** A contract can only be disbursed if $\ge 75\%$ of calendar time has elapsed, all weekly meal plans exist, and all consultations have attendance proof.
- **Disciplinary Three-Strike Invariant:** Strike 2/3 causes immediate transactional level demotion to New Dietitian tier and cancels active grace periods.
- **Error Response Contract:** All API errors must conform to RFC 7807 Problem Details (`StandardErrorResponse`).

---

## Review Focus

1. **Escrow Double Disbursement Race:** Concurrent HTTP requests to disburse or release milestone funds could trigger duplicate payouts if not guarded by row-level locking or Prisma transactional isolation.
2. **AI Simulation Exam JSON Hallucination:** Ollama LLM clinical grading output could return invalid or malformed JSON that fails schema parsing, causing the applicant's exam session to hang.
3. **WebRTC Token Spoofing:** A malicious user generating fake cryptographic attendance tokens to simulate 15-minute consultation attendance without conducting the video call.
4. **Bidding Over-Cap Race Condition:** A dietitian with a cap of 25 active proposals submitting multiple proposals in parallel to exceed their tier limit.
5. **Foreign Exchange Slippage on Dispute Refunds:** Converting currencies twice on escrow refunds, causing the client to receive less or more fiat than originally deposited.

---

## Stepwise Phased Implementation Roadmap

```
+-------------------------------------------------------------------------------------------------------+
| Phase 1: Monorepo Scaffolding, Shared Contracts, & Docker Infrastructure                             |
| Phase 2: Core Domain Entities, Value Objects, & Business Invariants (TDD)                            |
| Phase 3: Infrastructure Adapters (Prisma 7 3NF Ledger, Redis BullMQ, MinIO S3, Ollama AI)             |
| Phase 4: Application Use Cases & NestJS 12 API / WebRTC Signaling Gateway                            |
| Phase 5: Client & Dietitian Web Application (Next.js 16 App Router & Video Consultations)            |
| Phase 6: Dedicated Admin & Disciplinary Tribunal Console (Next.js 16, Table v9, Recharts)             |
| Phase 7: Cross-Platform Mobile Application (Expo SDK 58, React Native 0.88, Native WebRTC)           |
| Phase 8: End-to-End Integration, Security Audit, & Verification Gate                                  |
+-------------------------------------------------------------------------------------------------------+
```

---

### Phase 1: Monorepo Scaffolding, Shared Contracts, & Docker Infrastructure
> **Git Work Branch:** `feat/monorepo-scaffolding-shared-contracts` (Branch from `main`)

#### Task 1.1: Turborepo & pnpm Workspace Scaffolding
**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`
- Create: `packages/tsconfig/base.json`, `packages/tsconfig/nest.json`, `packages/tsconfig/next.json`
- Test: `pnpm install && pnpm build`

**Interfaces:**
- Consumes: Node.js 26 LTS, pnpm v9+
- Produces: Monorepo workspace configuration, cache pipelines (`build`, `test`, `lint`, `dev`)

- [ ] **Step 1: Write root `package.json` with workspace packages and engines**
- [ ] **Step 2: Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*`**
- [ ] **Step 3: Create `turbo.json` with pipeline dependency chains**
- [ ] **Step 4: Create `@diety/tsconfig` packages with strict TypeScript compiler options**
- [ ] **Step 5: Verify workspace resolution via `pnpm install`**
- [ ] **Step 6: Commit:** `git commit -m "chore: scaffold turborepo pnpm monorepo workspace"`

#### Task 1.2: Shared Domain Types & Zod Validation Schemas
**Files:**
- Create: `packages/types/src/index.ts`, `packages/types/package.json`
- Create: `packages/validation/src/index.ts`, `packages/validation/package.json`
- Test: `packages/validation/test/schemas.test.ts`

**Interfaces:**
- Consumes: `@diety/types`
- Produces: Isomorphic Zod schemas for `RegisterUserSchema`, `CreateRequirementSchema`, `SubmitBidSchema`, `ClinicalSimulationTurnSchema`, `FileDisputeSchema`

- [ ] **Step 1: Write failing tests for validation schemas**
- [ ] **Step 2: Verify test fails with missing schemas**
- [ ] **Step 3: Implement TypeScript enums (`UserRole`, `VerificationStatus`, `ContractStatus`, `DisputeStatus`)**
- [ ] **Step 4: Implement Zod validation schemas enforcing platform rules**
- [ ] **Step 5: Run tests to verify all validation rules pass**
- [ ] **Step 6: Commit:** `git commit -m "feat(shared): implement domain types and isomorphic zod validation schemas"`

#### Task 1.3: Local Docker Compose Environment ($0 Budget Stack)
**Files:**
- Create: `docker/docker-compose.yml`, `.env.example`
- Test: `docker compose -f docker/docker-compose.yml up -d`

**Interfaces:**
- Consumes: Docker Engine
- Produces: PostgreSQL 16/19 container (`:5432`), Redis 8 container (`:6379`), MinIO S3 container (`:9000/:9001`)

- [ ] **Step 1: Write `docker-compose.yml` with healthchecks for PostgreSQL, Redis, and MinIO**
- [ ] **Step 2: Create root `.env.example` with local connection strings**
- [ ] **Step 3: Execute `docker compose up -d` and verify all containers reach healthy state**
- [ ] **Step 4: Verify PostgreSQL connection via `pg_isready` and Redis via `redis-cli ping`**
- [ ] **Step 5: Commit:** `git commit -m "chore(infra): configure local docker-compose environment"`

---

### Phase 2: Core Domain Entities, Value Objects, & Invariants (Pure TDD)
> **Git Work Branch:** `feat/domain-entities-and-invariants` (Branch from `main`)

#### Task 2.1: Domain Value Objects
**Files:**
- Create: `apps/api/src/bounded-contexts/shared/domain/value-objects/money.vo.ts`
- Create: `apps/api/src/bounded-contexts/shared/domain/value-objects/rating-score.vo.ts`
- Create: `apps/api/src/bounded-contexts/marketplace/domain/value-objects/proposal-limit.vo.ts`
- Test: `apps/api/test/unit/domain/value-objects.spec.ts`

**Interfaces:**
- Consumes: Pure TypeScript (Zero external framework imports)
- Produces: Immutable `Money`, `RatingScore`, `ProposalLimit` Value Objects with self-validation

- [ ] **Step 1: Write failing unit tests for `Money`, `RatingScore`, and `ProposalLimit`**
- [ ] **Step 2: Verify tests fail with missing classes**
- [ ] **Step 3: Implement `Money` (integer cents, currency code, exact arithmetic, negative value rejection)**
- [ ] **Step 4: Implement `RatingScore` (validates $1.0 \le \text{score} \le 5.0$)**
- [ ] **Step 5: Implement `ProposalLimit` (validates active bids $\le$ tier maximum: 25/35/50/75)**
- [ ] **Step 6: Run tests and verify 100% pass rate**
- [ ] **Step 7: Commit:** `git commit -m "feat(domain): implement core value objects with strict invariants"`

#### Task 2.2: Escrow & Contract Aggregate Root
**Files:**
- Create: `apps/api/src/bounded-contexts/escrow/domain/entities/contract.entity.ts`
- Create: `apps/api/src/bounded-contexts/escrow/domain/entities/escrow-transaction.entity.ts`
- Test: `apps/api/test/unit/domain/contract-aggregate.spec.ts`

**Interfaces:**
- Consumes: `Money` Value Object
- Produces: `Contract` aggregate root enforcing fee calculation ($\text{Total} \equiv \text{Fee} + \text{Net}$) and state machine transitions

- [ ] **Step 1: Write failing tests for Contract creation, fee calculation, and transition invariants**
- [ ] **Step 2: Verify tests fail with missing aggregate**
- [ ] **Step 3: Implement `Contract` entity with methods: `create()`, `lockEscrow()`, `requestRelease()`, `clearSecurityHold()`, `freezeForDispute()`**
- [ ] **Step 4: Implement 75% calendar elapsed invariant check: `isEligibleForDisbursement(currentTime)`**
- [ ] **Step 5: Run tests and verify all invariants hold**
- [ ] **Step 6: Commit:** `git commit -m "feat(domain): implement contract and escrow aggregate root"`

#### Task 2.3: Reputation & Level Ranking Aggregate
**Files:**
- Create: `apps/api/src/bounded-contexts/reputation/domain/entities/dietitian-level.entity.ts`
- Test: `apps/api/test/unit/domain/reputation-aggregate.spec.ts`

**Interfaces:**
- Consumes: `RatingScore`, Domain Events
- Produces: `DietitianLevelProfile` aggregate with rolling 60-day metric evaluation and 3-strike demotion logic

- [ ] **Step 1: Write failing tests for level evaluation (Silver, Gold, Platinum criteria) and strike demotions**
- [ ] **Step 2: Verify tests fail**
- [ ] **Step 3: Implement `DietitianLevelProfile` entity: `evaluateTier()`, `applyStrike()`, `resetGracePeriod()`**
- [ ] **Step 4: Verify Strike 2 and Strike 3 trigger immediate demotion to New Dietitian tier**
- [ ] **Step 5: Run tests and verify pass**
- [ ] **Step 6: Commit:** `git commit -m "feat(domain): implement reputation and level ranking aggregate"`

---

### Phase 3: Infrastructure Adapters & Persistence Layer
> **Git Work Branch:** `feat/infra-persistence-adapters` (Branch from `main`)

#### Task 3.1: Prisma 7 Relational Database Schema & Migrations
**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Test: `npx prisma migrate dev && npx prisma db seed`

**Interfaces:**
- Consumes: PostgreSQL 16/19 connection string
- Produces: 3NF tables across 6 Bounded Contexts, Prisma Client types, initial seed data

- [ ] **Step 1: Write `schema.prisma` defining all 32 tables from `DATABASE_SCHEMA.md`**
- [ ] **Step 2: Configure compound unique constraints, indexes, and foreign keys**
- [ ] **Step 3: Run `npx prisma migrate dev --name init_3nf_schema`**
- [ ] **Step 4: Write `prisma/seed.ts` with test users, admin, categories, and clinical scenarios**
- [ ] **Step 5: Execute seed script and verify database population**
- [ ] **Step 6: Commit:** `git commit -m "feat(infra): configure prisma 7 schema and 3nf database migrations"`

#### Task 3.2: Ollama Local AI Clinical Simulation Adapter
**Files:**
- Create: `apps/api/src/bounded-contexts/identity/infrastructure/adapters/ollama-ai.adapter.ts`
- Create: `apps/api/src/bounded-contexts/identity/application/ports/ai-simulator.port.ts`
- Test: `apps/api/test/integration/ollama-adapter.spec.ts`

**Interfaces:**
- Consumes: `ollama` SDK (`0.6.4`), Local Ollama Daemon (`:11434`)
- Produces: `IAISimulatorPort` implementation for patient dialogue (`llama3.2:3b`) and structured JSON rubric grading (`qwen2.5:7b`)

- [ ] **Step 1: Define `IAISimulatorPort` interface in application layer**
- [ ] **Step 2: Write integration test with mock and live Ollama fallback**
- [ ] **Step 3: Implement `OllamaAIAdapter` using `ollama.chat()` with `format: 'json'`**
- [ ] **Step 4: Implement resilience wrapper (timeout, retries, JSON validation against Zod schema)**
- [ ] **Step 5: Run integration test and verify structured evaluation response**
- [ ] **Step 6: Commit:** `git commit -m "feat(infra): implement local ollama ai clinical simulation adapter"`

#### Task 3.3: Redis BullMQ Queue & Timers Adapter
**Files:**
- Create: `apps/api/src/bounded-contexts/shared/infrastructure/queue/bullmq.adapter.ts`
- Create: `apps/api/src/bounded-contexts/escrow/infrastructure/workers/escrow-clearing.worker.ts`
- Test: `apps/api/test/integration/bullmq-queue.spec.ts`

**Interfaces:**
- Consumes: `ioredis` (`6.0.0`), `bullmq` (`6.7.8`)
- Produces: Scheduled delay queue for 72h/48h/24h security clearing and 15-minute consultation no-show worker

- [ ] **Step 1: Implement BullMQ queue provider with connection to local Redis container**
- [ ] **Step 2: Implement `EscrowClearingWorker` to process `clear-contract` jobs upon delay expiration**
- [ ] **Step 3: Implement job cancellation hook for when a dispute is opened**
- [ ] **Step 4: Write integration test verifying job scheduling and cancellation**
- [ ] **Step 5: Run tests and verify**
- [ ] **Step 6: Commit:** `git commit -m "feat(infra): implement bullmq escrow clearing queue and workers"`

---

### Phase 4: Application Use Cases & NestJS 12 API / Signaling Gateway
> **Git Work Branch:** `feat/api-signaling-gateway` (Branch from `main`)

#### Task 4.1: Authentication & RBAC Security Engine
**Files:**
- Create: `apps/api/src/bounded-contexts/identity/presentation/controllers/auth.controller.ts`
- Create: `apps/api/src/bounded-contexts/identity/application/use-cases/login.use-case.ts`
- Create: `apps/api/src/shared/guards/jwt-auth.guard.ts`, `apps/api/src/shared/guards/roles.guard.ts`
- Test: `apps/api/test/e2e/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `@nestjs/jwt`, `argon2`, `passport-jwt`
- Produces: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, HTTP-only cookie management

- [ ] **Step 1: Write failing E2E tests for registration, login, and protected routes**
- [ ] **Step 2: Implement `LoginUseCase` with Argon2 password verification and dual-token generation**
- [ ] **Step 3: Implement `JwtAuthGuard` and `RolesGuard` (`CLIENT`, `DIETITIAN`, `ADMIN`, `ARBITRATOR`)**
- [ ] **Step 4: Configure HTTP-only cookie serialization for refresh tokens**
- [ ] **Step 5: Run tests and verify 200 OK on valid credentials and 401/403 on invalid tokens**
- [ ] **Step 6: Commit:** `git commit -m "feat(api): implement jwt auth controller and rbac perimeter guards"`

#### Task 4.2: Marketplace Bidding & Contract Creation Use Cases
**Files:**
- Create: `apps/api/src/bounded-contexts/marketplace/presentation/controllers/marketplace.controller.ts`
- Create: `apps/api/src/bounded-contexts/marketplace/application/use-cases/submit-bid.use-case.ts`
- Create: `apps/api/src/bounded-contexts/escrow/application/use-cases/accept-proposal.use-case.ts`
- Test: `apps/api/test/e2e/marketplace.e2e-spec.ts`

**Interfaces:**
- Consumes: Prisma `$transaction`, `@diety/validation`
- Produces: REST endpoints for requirements, proposals, and atomic bid acceptance

- [ ] **Step 1: Write failing E2E tests for posting requirements, bidding, and proposal acceptance**
- [ ] **Step 2: Implement `SubmitBidUseCase` enforcing dietitian level proposal caps (25/35/50/75)**
- [ ] **Step 3: Implement `AcceptProposalUseCase` inside Prisma `$transaction` (lock single-hire, reject other bids, create contract, deposit escrow)**
- [ ] **Step 4: Run E2E tests to verify concurrency safety**
- [ ] **Step 5: Commit:** `git commit -m "feat(api): implement marketplace bidding and transactional contract creation"`

#### Task 4.3: WebRTC Signaling Gateway & Consultation Attendance Logger
**Files:**
- Create: `apps/api/src/bounded-contexts/clinical/presentation/gateways/signaling.gateway.ts`
- Create: `apps/api/src/bounded-contexts/clinical/application/use-cases/record-attendance.use-case.ts`
- Test: `apps/api/test/integration/signaling-gateway.spec.ts`

**Interfaces:**
- Consumes: `@nestjs/websockets`, `socket.io`
- Produces: Real-time room joining, SDP offer/answer relay, ICE candidate exchange, 60s attendance heartbeats

- [ ] **Step 1: Write integration tests for Socket.io signaling events (`join-room`, `signal`, `attendance-ping`)**
- [ ] **Step 2: Implement `SignalingGateway` with room authentication via JWT handshake**
- [ ] **Step 3: Implement `RecordAttendanceUseCase` tracking mutual attendance minutes in Redis**
- [ ] **Step 4: Trigger consultation verified record when cumulative attendance $\ge 15$ minutes**
- [ ] **Step 5: Run integration tests and verify peer connectivity**
- [ ] **Step 6: Commit:** `git commit -m "feat(api): implement webrtc signaling gateway and attendance verification"`

#### Task 4.4: Dispute Tribunal & Arbitration Engine
**Files:**
- Create: `apps/api/src/bounded-contexts/tribunal/presentation/controllers/tribunal.controller.ts`
- Create: `apps/api/src/bounded-contexts/tribunal/application/use-cases/arbitrate-dispute.use-case.ts`
- Test: `apps/api/test/e2e/tribunal.e2e-spec.ts`

**Interfaces:**
- Consumes: Prisma Unit of Work, MinIO S3 SDK
- Produces: `/api/v1/tribunal/disputes`, evidence file uploads, administrative strike issuance, pro-rata escrow splits

- [ ] **Step 1: Write failing E2E tests for filing disputes, freezing escrow, and arbitrator decisions**
- [ ] **Step 2: Implement `FileDisputeUseCase` that cancels BullMQ clearing jobs and updates contract status to `DISPUTED`**
- [ ] **Step 3: Implement `ArbitrateDisputeUseCase` with pro-rata split formula and strike recording**
- [ ] **Step 4: Verify strike application automatically triggers level demotion if strike threshold reached**
- [ ] **Step 5: Run E2E tests and verify pass**
- [ ] **Step 6: Commit:** `git commit -m "feat(api): implement dispute tribunal and escrow arbitration engine"`

---

### Phase 5: Client & Dietitian Web Application (Next.js 16 App Router)
> **Git Work Branch:** `feat/web-client-dietitian-portal` (Branch from `main`)

#### Task 5.1: Next.js 16 App Scaffolding & Design System
**Files:**
- Create: `apps/web/package.json`, `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`
- Create: `apps/web/tailwind.config.ts`, `apps/web/components/ui/*`
- Test: `pnpm --filter @diety/web build`

**Interfaces:**
- Consumes: Next.js 16, React 19, Tailwind CSS 4, Radix UI primitives
- Produces: Accessible shared component library, theme provider, QueryClientProvider

- [ ] **Step 1: Scaffold Next.js 16 App Router project with Turbopack**
- [ ] **Step 2: Configure Tailwind CSS 4 and import shadcn/ui primitives**
- [ ] **Step 3: Configure TanStack Query v5 provider with hydration boundary**
- [ ] **Step 4: Build navigation headers and responsive layouts for Client and Dietitian roles**
- [ ] **Step 5: Verify build succeeds**
- [ ] **Step 6: Commit:** `git commit -m "feat(web): scaffold next.js 16 app router and design system"`

#### Task 5.2: Client Marketplace & Escrow Checkout Flow
**Files:**
- Create: `apps/web/app/(client)/requirements/new/page.tsx`
- Create: `apps/web/app/(client)/contracts/[id]/page.tsx`
- Create: `apps/web/components/marketplace/ProposalCard.tsx`
- Test: `apps/web/test/requirements-flow.spec.tsx`

**Interfaces:**
- Consumes: TanStack Query, `@diety/validation`, Backend API REST
- Produces: Intake form with calorie/macro targets, proposal evaluation cards, escrow payment simulator

- [ ] **Step 1: Build multi-step client health intake form with React Hook Form and Zod**
- [ ] **Step 2: Build Proposal comparison dashboard displaying Dietitian level badges and ratings**
- [ ] **Step 3: Build Escrow checkout milestone breakdown card**
- [ ] **Step 4: Connect mutations to Backend API `/api/v1/marketplace`**
- [ ] **Step 5: Verify component rendering and form validation in tests**
- [ ] **Step 6: Commit:** `git commit -m "feat(web): implement client intake form and proposal review flow"`

#### Task 5.3: Dietitian Verification Portal & AI Simulation Interface
**Files:**
- Create: `apps/web/app/(dietitian)/verification/page.tsx`
- Create: `apps/web/app/(dietitian)/verification/simulation/page.tsx`
- Create: `apps/web/components/clinical/PatientDialogueBox.tsx`
- Test: `apps/web/test/ai-simulation.spec.tsx`

**Interfaces:**
- Consumes: Backend AI Simulation API endpoints
- Produces: Document upload zone (PDF degrees/licenses) and interactive AI patient chat session

- [ ] **Step 1: Build credential upload form with drag-and-drop PDF preview**
- [ ] **Step 2: Build interactive AI patient simulation chat console with turn counter**
- [ ] **Step 3: Connect real-time streaming dialogue to Backend `/api/v1/identity/simulation`**
- [ ] **Step 4: Build final assessment submission form with live rubric feedback display**
- [ ] **Step 5: Commit:** `git commit -m "feat(web): implement dietitian verification portal and ai simulation exam"`

#### Task 5.4: In-Browser WebRTC Consultation Room
**Files:**
- Create: `apps/web/app/consultations/[roomId]/page.tsx`
- Create: `apps/web/hooks/useWebRTC.ts`
- Create: `apps/web/components/consultation/VideoGrid.tsx`

**Interfaces:**
- Consumes: `simple-peer`, `socket.io-client`, Google STUN
- Produces: Split-screen video feed, audio/video toggle controls, 15-minute attendance timer

- [ ] **Step 1: Implement `useWebRTC` hook managing PeerConnection, media streams, and ICE candidates**
- [ ] **Step 2: Build responsive video grid with picture-in-picture local preview**
- [ ] **Step 3: Implement 60-second attendance pinging to backend signaling gateway**
- [ ] **Step 4: Build consultation completion card with digital signature trigger**
- [ ] **Step 5: Commit:** `git commit -m "feat(web): implement in-browser webrtc video consultation room"`

---

### Phase 6: Dedicated Admin & Disciplinary Tribunal Console (Next.js 16)
> **Git Work Branch:** `feat/admin-tribunal-console` (Branch from `main`)

#### Task 6.1: Admin Console Scaffolding & Security Perimeter
**Files:**
- Create: `apps/admin/package.json`, `apps/admin/app/layout.tsx`, `apps/admin/app/page.tsx`
- Create: `apps/admin/middleware.ts`
- Test: `pnpm --filter @diety/admin build`

**Interfaces:**
- Consumes: Next.js 16, `@tanstack/react-table`, Recharts 3
- Produces: Isolated admin portal with MFA guards and administrative layout

- [ ] **Step 1: Scaffold dedicated Admin Next.js 16 application on port 3002**
- [ ] **Step 2: Implement edge middleware enforcing `ADMIN` or `ARBITRATOR` roles**
- [ ] **Step 3: Build platform overview dashboard with Recharts financial KPIs (GMV, Escrow locked)**
- [ ] **Step 4: Verify build succeeds**
- [ ] **Step 5: Commit:** `git commit -m "feat(admin): scaffold isolated admin console and analytics dashboard"`

#### Task 6.2: Credential Audit Queue & Dispute Tribunal Court
**Files:**
- Create: `apps/admin/app/credentials/page.tsx`
- Create: `apps/admin/app/disputes/[caseId]/page.tsx`
- Create: `apps/admin/components/tribunal/EvidenceViewer.tsx`
- Test: `apps/admin/test/dispute-arbitration.spec.tsx`

**Interfaces:**
- Consumes: TanStack Table 9, Backend Tribunal API
- Produces: Filterable verification queue with PDF viewer and split-screen dispute arbitration slider

- [ ] **Step 1: Build virtualized credential table with status filters (PENDING, APPROVED, REJECTED)**
- [ ] **Step 2: Build split-screen dispute tribunal view: Client Evidence vs Dietitian Evidence**
- [ ] **Step 3: Build interactive pro-rata escrow slider (0% to 100% split)**
- [ ] **Step 4: Build Disciplinary Strike trigger with mandatory arbitrator justification notes**
- [ ] **Step 5: Connect arbitration decision submission to Backend API**
- [ ] **Step 6: Commit:** `git commit -m "feat(admin): implement credential audit queue and dispute arbitration console"`

---

### Phase 7: Cross-Platform Mobile Application (Expo SDK 58 / React Native)
> **Git Work Branch:** `feat/mobile-webrtc-expo-app` (Branch from `main`)

#### Task 7.1: Expo SDK 58 App Scaffolding & SecureStore Authentication
**Files:**
- Create: `apps/mobile/package.json`, `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/lib/secure-store.ts`, `apps/mobile/hooks/useBiometrics.ts`
- Test: `pnpm --filter @diety/mobile test`

**Interfaces:**
- Consumes: Expo SDK 58, React Native 0.88, NativeWind 4
- Produces: Cross-platform mobile shell with biometric login and token hydration

- [ ] **Step 1: Scaffold Expo SDK 58 project with Expo Router v58**
- [ ] **Step 2: Configure NativeWind v4 styling and install Lucide mobile icons**
- [ ] **Step 3: Implement encrypted JWT token storage using `expo-secure-store`**
- [ ] **Step 4: Implement biometric sign-in hook via `expo-local-authentication`**
- [ ] **Step 5: Build mobile native tabs for Client and Dietitian roles**
- [ ] **Step 6: Commit:** `git commit -m "feat(mobile): scaffold expo 58 mobile app with securestore biometrics"`

#### Task 7.2: Native WebRTC Consultation Screen
**Files:**
- Create: `apps/mobile/app/consultation/[roomId].tsx`
- Create: `apps/mobile/components/ConsultationCall.tsx`
- Create: `apps/mobile/hooks/useNativeWebRTC.ts`

**Interfaces:**
- Consumes: `react-native-webrtc` (`155.0.1`), `socket.io-client`
- Produces: Native RTCView video streams, camera flip/mute controls, background audio handling

- [ ] **Step 1: Configure iOS and Android native permissions for Camera and Microphone**
- [ ] **Step 2: Implement `useNativeWebRTC` managing native RTCView streams and signaling events**
- [ ] **Step 3: Build `ConsultationCall` component with call duration indicator and attendance pings**
- [ ] **Step 4: Test call establishment between Mobile and Web in development build**
- [ ] **Step 5: Commit:** `git commit -m "feat(mobile): implement native webrtc video consultation screen"`

---

### Phase 8: End-to-End Integration, Security Audit, & Verification Gate
> **Git Work Branch:** `test/e2e-integration-audit` (Branch from `main`)

#### Task 8.1: Full User Journey E2E Test Suite (Playwright)
**Files:**
- Create: `tests/e2e/full-platform-flow.spec.ts`, `playwright.config.ts`
- Test: `npx playwright test`

**Interfaces:**
- Consumes: Web Portal (:3000), Admin Console (:3002), Backend API (:3001)
- Produces: Automated proof of the end-to-end user lifecycle

- [ ] **Step 1: Configure Playwright multi-browser test harness**
- [ ] **Step 2: Test Flow A: Dietitian registration $\rightarrow$ AI clinical exam passing $\rightarrow$ Level assignment**
- [ ] **Step 3: Test Flow B: Client posts requirement $\rightarrow$ Dietitian bids $\rightarrow$ Escrow payment funded**
- [ ] **Step 4: Test Flow C: WebRTC call conducted $\rightarrow$ Meal plan delivered $\rightarrow$ 72h clearing release**
- [ ] **Step 5: Test Flow D: Dispute raised $\rightarrow$ Escrow frozen $\rightarrow$ Arbitrator splits funds and issues strike**
- [ ] **Step 6: Run full Playwright test suite and verify 100% pass**
- [ ] **Step 7: Commit:** `git commit -m "test(e2e): implement comprehensive multi-role playwright e2e test suite"`

---

## Execution Handoff

Plan complete and saved to [`DEVELOPMENT_PLAN.md`](file:///d:/FullStackProjects/Diety/docs/DEVELOPMENT_PLAN.md).

Which execution approach would you prefer?
- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. (Recommended due to the clear module boundaries across 4 apps).
- **Native** - I implement every task myself in this session.
