# Diety Freelance Marketplace Platform - Complete Project Context Dump

**Document Version:** 1.0.0  
**Capture Timestamp:** 2026-11-21T00:55:00+05:00  
**Purpose:** Exhaustive, persistent context capture recording every architectural decision, functional requirement, database table, mathematical invariant, dependency specification, and operational procedure established for the Diety Platform. This document allows any agent, developer, or stakeholder to resume work with 100% fidelity without context loss.

---

## 1. Project Overview & Foundational Premise

### 1.1 The Core Mission
**Diety** is a specialized freelance healthcare marketplace platform connecting clients/patients seeking personalized nutritional care with verified freelance dietitians. Unlike generalist freelance platforms (e.g., Upwork, Fiverr), Diety enforces clinical safety, medical integrity, and objective credential verification.

### 1.2 The Core Freelance Problem & Solution
- **The Problem:** In nutritional science, many qualified individuals graduate with accredited Bachelor's/Master's degrees in Dietetics or Human Nutrition but face long jurisdictional waiting times or localized regulatory hurdles to obtain formal private practice licenses. Conversely, unvetted practitioners pose severe clinical risks (e.g., prescribing high-glycemic plans to diabetics or allergens to sensitized individuals).
- **The Solution:** A **Dual-Pathway Verification Engine**:
  - **Pathway A (Licensed Dietitian):** Direct upload of official government practice license verified by administrative audit against public registries.
  - **Pathway B (Degree Graduate / Candidate):** Accredited university degree/transcript upload coupled with an **Automated AI Clinical Case Simulation Exam**. Candidates must pass an interactive multi-turn clinical diagnostic simulation scoring $\ge 75\%$ with zero allergen safety violations.

### 1.3 The Academic $0-Budget Operating Constraint
The project is developed under an academic research budget ($0 operating cost). No paid commercial cloud APIs (OpenAI, Anthropic, Stripe, Twilio) are required:
- **Local AI Inference:** Ollama running open-source models natively on the host workstation (`llama3.2:3b` for patient simulation dialogue, `qwen2.5:7b` for rubric grading).
- **Local Relational Ledger:** PostgreSQL 16/19 containerized via Docker.
- **Local Cache & Timers:** Redis 8 / BullMQ containerized via Docker.
- **Local Object Storage:** MinIO S3 containerized via Docker for storing degree PDFs and dispute evidence.
- **Zero-Cost Video Calling:** WebRTC peer-to-peer media transport utilizing free public Google STUN (`stun:stun.l.google.com:19302`).

---

## 2. Platform Personas & Role Matrix

| Persona | Access Interfaces | Permissions & Core Capabilities |
| :--- | :--- | :--- |
| **Client / Patient** | Web App (`:3000`) & Mobile App | Posts dynamic dietary requirements, reviews proposals, funds milestone escrow, attends encrypted WebRTC consultations, tracks daily meal plans, files dispute tickets. |
| **Dietitian / Freelancer**| Web App (`:3000`) & Mobile App | Submits credentials, takes AI clinical simulation exam, bids on requirements within tier limits (25/35/50/75), builds digital meal plans, conducts video calls, withdraws cleared earnings. |
| **Administrator** | Dedicated Admin Console (`:3002`) | Audits credential verification queues, inspects financial ledgers, manages platform fee settings, monitors system health and analytics. |
| **Disciplinary Arbitrator**| Dedicated Admin Console (`:3002`) | Accesses confidential evidence vault, reviews consultation chat/video attendance logs, issues disciplinary strikes, arbitrates pro-rata escrow splits. |

---

## 3. Core Functional Requirements & Business Invariants

### 3.1 Functional Requirements Summary (FR-1 to FR-12)
1. **FR-1: Identity & Role-Based Authentication:** Secure email/password registration with Argon2id hashing, dual-token JWT auth, and HTTP-only cookies.
2. **FR-2: Dual-Pathway Practitioner Verification:** Mandatory verification before bidding or directory listing.
3. **FR-3: Dynamic Client Intake & Requirement Posting:** Structured medical history, biometric data, BMI calculation, caloric baseline, and allergen exclusion tags.
4. **FR-4: Marketplace Bidding & Tier-Based Proposal Caps:** Dynamic active proposal limits determined by level: New Dietitian (25), Level 1 Silver (35), Level 2 Gold (50), Top Rated Platinum (75).
5. **FR-5: Single-Hire Lock & Atomic Contract Creation:** Accepting a proposal locks the requirement, marks competing bids as rejected, and creates the contract inside an atomic database transaction.
6. **FR-6: Milestone Escrow & Double-Entry Financial Ledger:** All funds locked in escrow upon hire. Platform fee is 10% standard (8% for Top Rated).
7. **FR-7: Digital Meal Planner & Macronutrient Engine:** Interactive weekly meal schedule builder enforcing caloric targets and flagging allergen conflicts.
8. **FR-8: Encrypted WebRTC Video Consultations:** In-browser and mobile P2P video calls with server attendance heartbeats and 15-minute minimum attendance validation.
9. **FR-9: Triple-Check Escrow Release Protocol:** Release requires (1) client approval or 72h auto-release, (2) elapsed calendar time $\ge 75\%$, (3) digital meal plan delivered, and (4) verified consultation attendance.
10. **FR-10: 72-Hour Security Clearing Period:** Approved funds enter a mandatory clearing hold (72h New, 48h Silver, 24h Gold/Platinum) before becoming available for withdrawal.
11. **FR-11: Reputation & 60-Day Rolling Level Evaluation:** Daily automated recalculation of completion rate ($\ge 90\%$), rating ($\ge 4.80$), and completed orders.
12. **FR-12: Three-Strike Disciplinary Tribunal:** Opening a dispute halts clearing timers and freezes escrow. Strike 1 = Warning; Strike 2 = 14-day bidding freeze + demotion; Strike 3 = Permanent platform ban.

### 3.2 Inviolable Mathematical & Architectural Invariants
- **Financial Balance Invariant:**
  $$\text{TotalUSD} \equiv \text{PlatformFeeUSD} + \text{NetEarningsUSD}$$
  No floating-point numbers are permitted for financial storage; all values are stored in integer cents.
- **Exact Local Fiat Refund Invariant:**
  $$\text{RefundFiatAmount} = \text{DepositFiatAmount}$$
  Clients are refunded the exact fiat amount originally charged, shielding them from currency slippage.
- **Calendar Time Invariant:**
  $$\text{CurrentTimestamp} \ge \text{ContractStartedAt} + (\text{TotalDurationSeconds} \times 0.75)$$
  A contract cannot be released if less than 75% of the calendar duration has elapsed.
- **Consultation Attendance Invariant:**
  $$\text{MutualPresenceMinutes} \ge 15\text{ minutes}$$
  Video consultations missing verified server attendance records fail the release criteria.

---

## 4. Software Architecture & Design Principles

### 4.1 The 14 Classic Books Principle Matrix
The codebase is structured according to 14 foundational software engineering texts:
- *Clean Architecture* (Martin): Strict Dependency Rule (Outer layers depend on Inner layers; Domain knows zero technology details).
- *A Philosophy of Software Design* (Ousterhout): Deep modules (clean narrow interfaces hiding rich complexity; no pass-through layers).
- *Domain-Driven Design* (Evans & Vernon): 6 Bounded Contexts, Ubiquitous Language, Aggregates, and immutable Value Objects.
- *Designing Data-Intensive Applications* (Kleppmann): Authoritative relational ledger, idempotency keys, and transaction boundaries.
- *Release It!* (Nygard): Circuit breakers, timeouts, bulkheads, fail-fast verification on all IO.
- *Clean Code* & *Code Complete* (Martin / McConnell): Single-responsibility functions, intention-revealing names.
- *The Pragmatic Programmer* (Hunt & Thomas): DRY, orthogonality, tracer-bullet execution.
- *Refactoring* & *Working Effectively with Legacy Code* (Fowler / Feathers): Behavior-preserving structural moves, characterization tests.

### 4.2 Layered Hexagonal Structure (Ports & Adapters)
```
[ 1. Presentation Layer (Outer) ]   --> REST Controllers, WebSocket Handlers, DTO Validation Pipes, Guards
[ 2. Infrastructure Layer (Outer) ]  --> Prisma SQL Adapters, Ollama AI Adapter, BullMQ Queue, MinIO S3
[ 3. Application Layer (Middle) ]    --> Use Cases (Commands/Queries), Port Interfaces (IRepositoryPort)
[ 4. Core Domain Layer (Innermost) ] --> Domain Entities, Value Objects, Domain Events (Zero External Imports)
```

### 4.3 The 6 Bounded Contexts
1. **Identity & Credentialing Context:** Applicant profiles, degree audits, AI clinical simulation exam.
2. **Marketplace & Bidding Context:** Client intake requirements, proposals, dynamic proposal caps.
3. **Escrow & Financial Ledger Context:** Contracts, double-entry ledger, 72h clearing worker, currency invariants.
4. **Reputation & Level Ranking Context:** 60-day rolling metrics, Silver/Gold/Platinum tiers, strike demotions.
5. **Clinical Consultation & Meal Plan Context:** Digital meal planner, macro calculator, WebRTC signaling gateway.
6. **Dispute & Disciplinary Tribunal Context:** Dispute tickets, confidential evidence vault, arbitration engine.

---

## 5. Complete Relational Database Schema (3NF)

The database schema is fully normalized into Third Normal Form (3NF) across **32 tables**:

```
1. Identity & Auth (5 tables):
   - users (id, email, password_hash, role, status, created_at)
   - user_profiles (user_id, full_name, avatar_url, phone, bio, timezone)
   - dietitian_profiles (user_id, practitioner_type, license_number, verification_status, level_tier)
   - practitioner_types (id, code, display_name, requires_state_license)
   - refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)

2. Credential Verification & AI Exam (5 tables):
   - verification_documents (id, dietitian_id, document_type, s3_key, status, audited_by)
   - clinical_scenarios (id, disease_state, primary_complaint, allergen_profile, rubric_schema)
   - ai_assessments (id, dietitian_id, scenario_id, total_score, allergen_safe, status, raw_transcript)
   - ai_assessment_turns (id, assessment_id, turn_number, role, message_content, timestamp)
   - ai_rubric_scores (id, assessment_id, criteria_name, points_awarded, max_points, feedback)

3. Marketplace & Bidding (5 tables):
   - requirements (id, client_id, title, health_goal, caloric_target, status, locked_at)
   - requirement_allergens (requirement_id, allergen_name)
   - bids (id, requirement_id, dietitian_id, proposed_amount_cents, duration_weeks, status)
   - bid_milestone_proposals (id, bid_id, milestone_number, title, amount_cents)
   - proposal_limits (dietitian_id, active_bid_count, max_active_bids, updated_at)

4. Escrow & Financial Ledger (6 tables):
   - contracts (id, requirement_id, bid_id, client_id, dietitian_id, status, total_cents, platform_fee_cents)
   - contract_milestones (id, contract_id, milestone_number, amount_cents, status)
   - escrow_transactions (id, contract_id, type, amount_cents, currency, idempotency_key, created_at)
   - wallets (id, user_id, available_cents, pending_clearing_cents, currency)
   - wallet_transactions (id, wallet_id, type, amount_cents, balance_after_cents, reference_id)
   - clearing_schedules (id, contract_id, dietitian_id, amount_cents, releases_at, status)

5. Clinical Care & Video Consultations (5 tables):
   - diet_plans (id, contract_id, week_number, daily_calorie_target, status, delivered_at)
   - diet_plan_meals (id, plan_id, day_of_week, meal_slot, recipe_name, protein_g, carbs_g, fat_g)
   - diet_plan_meal_allergens (meal_id, allergen_name)
   - consultations (id, contract_id, scheduled_start, scheduled_end, status, room_token)
   - consultation_attendance_logs (id, consultation_id, user_id, ping_timestamp, elapsed_minutes)

6. Dispute Tribunal & Disciplinary Actions (6 tables):
   - dispute_tickets (id, contract_id, filed_by, reason, status, arbitrator_id, created_at)
   - dispute_evidence (id, ticket_id, uploaded_by, s3_key, file_type, description)
   - dispute_arbitrations (id, ticket_id, client_refund_cents, dietitian_payout_cents, justification)
   - disciplinary_strikes (id, dietitian_id, strike_number, ticket_id, justification, expires_at)
   - level_profiles (dietitian_id, rolling_completed_orders, completion_rate, rating, current_level)
   - platform_audit_logs (id, actor_id, action, target_entity, target_id, changes_json, ip_address)
```

---

## 6. Monorepo Topology & Project Structure

```
diety/
├── apps/
│   ├── api/                     # Subsystem 1 & 2: NestJS 12 Hexagonal Backend API & WebSocket Gateway (:3001)
│   ├── web/                     # Subsystem 3: Next.js 16 App Router Client & Dietitian Portal (:3000)
│   ├── admin/                   # Subsystem 4: Next.js 16 App Router Dedicated Admin Console (:3002)
│   └── mobile/                  # Subsystem 5: Expo SDK 58 / React Native 0.88 Mobile Application (:8081)
├── packages/
│   ├── types/                   # Shared TypeScript Domain Entities, Enums, DTO Contracts, Events
│   ├── validation/              # Shared Isomorphic Zod Validation Schemas
│   ├── ui/                      # Shared Tailwind CSS 4 Design Tokens & Radix UI Component Primitives
│   └── tsconfig/                # Strict Shared TypeScript Configurations (base, nest, next, react-native)
├── docker/
│   └── docker-compose.yml       # Local $0 Stack: PostgreSQL 16/19, Redis 8, MinIO S3
├── scripts/
│   └── check-dependency-updates.mjs # Turnkey 7-day automated dependency recency auditor
└── .github/
    └── workflows/
        └── weekly-dependency-check.yml # Weekly Monday 09:00 UTC CI dependency recency workflow
```

---

## 7. Exhaustive 33-Package Live Dependencies Catalog

The platform enforces the latest verified releases as of late 2026:

### 7.1 Backend API (`apps/api`)
- `@nestjs/core`: `^12.6.0` - [docs.nestjs.com](https://docs.nestjs.com)
- `@nestjs/common`: `^12.6.0` - [docs.nestjs.com/first-steps](https://docs.nestjs.com/first-steps)
- `@nestjs/platform-express`: `^12.6.0` - [docs.nestjs.com/techniques/performance](https://docs.nestjs.com/techniques/performance)
- `@nestjs/websockets`: `^12.6.0` - [docs.nestjs.com/websockets/gateways](https://docs.nestjs.com/websockets/gateways)
- `@nestjs/platform-socket.io`: `^12.6.0` - [socket.io/docs/v4/](https://socket.io/docs/v4/)
- `@prisma/client`: `^7.10.1` - [prisma.io/docs](https://www.prisma.io/docs)
- `prisma`: `^7.10.1` (`8.0.0-rc.34`) - [prisma.io/docs/concepts/components/prisma-migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- `ioredis`: `^6.0.0` - [github.com/redis/ioredis](https://github.com/redis/ioredis)
- `bullmq`: `^6.7.8` - [bullmq.io](https://bullmq.io)
- `ollama`: `^0.6.4` - [github.com/ollama/ollama-js](https://github.com/ollama/ollama-js)
- `minio`: `^8.0.7` - [min.io/docs](https://min.io/docs/minio/linux/index.html)
- `argon2`: `^0.45.2` - [github.com/ranisalt/node-argon2](https://github.com/ranisalt/node-argon2)
- `zod`: `^4.6.7` - [zod.dev](https://zod.dev)
- `socket.io`: `^4.8.4` - [socket.io](https://socket.io)

### 7.2 Web Portal & Admin Console (`apps/web` & `apps/admin`)
- `next`: `^16.4.6` - [nextjs.org/docs](https://nextjs.org/docs)
- `react`: `^19.3.1` - [react.dev](https://react.dev)
- `react-dom`: `^19.3.1` - [react.dev/reference/react-dom](https://react.dev/reference/react-dom)
- `tailwindcss`: `^4.3.5` - [tailwindcss.com/docs](https://tailwindcss.com/docs)
- `@tanstack/react-query`: `^5.108.2` - [tanstack.com/query/latest](https://tanstack.com/query/latest)
- `zustand`: `^5.1.0` - [docs.pmnd.rs/zustand](https://docs.pmnd.rs/zustand)
- `@tanstack/react-table`: `^9.3.1` - [tanstack.com/table/latest](https://tanstack.com/table/latest)
- `recharts`: `^3.11.0` - [recharts.org](https://recharts.org)
- `lucide-react`: `^1.77.0` - [lucide.dev](https://lucide.dev)

### 7.3 Mobile Application (`apps/mobile`)
- `expo`: `~58.0.26` - [docs.expo.dev](https://docs.expo.dev)
- `react-native`: `0.88.1` - [reactnative.dev](https://reactnative.dev)
- `expo-router`: `~58.0.32` - [docs.expo.dev/router](https://docs.expo.dev/router/introduction/)
- `react-native-webrtc`: `^155.0.1` - [github.com/react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)
- `nativewind`: `^4.2.7` - [nativewind.dev](https://nativewind.dev)
- `expo-secure-store`: `~14.0.1` - [docs.expo.dev/securestore](https://docs.expo.dev/versions/latest/sdk/securestore/)

### 7.4 Monorepo & Toolchain
- `turbo`: `^2.11.13` - [turbo.build/repo/docs](https://turbo.build/repo/docs)
- `typescript`: `^7.0.2` - [typescriptlang.org](https://www.typescriptlang.org)
- `vitest`: `^5.1.1` - [vitest.dev](https://vitest.dev)
- `eslint`: `^10.15.0` - [eslint.org](https://eslint.org)
- `prettier`: `^3.10.1` - [prettier.io](https://prettier.io)
- Node Runtime: **Node.js 26 Active LTS ("Lithium" `v26.13.1`)** - [nodejs.org](https://nodejs.org)

---

## 8. Automated 7-Day Continuous Recency Infrastructure

1. **Standalone Auditor Script:** [`scripts/check-dependency-updates.mjs`](file:///d:/FullStackProjects/Diety/scripts/check-dependency-updates.mjs) runs on Node.js to scan live npm dist-tags and print categorized upgrade warnings.
2. **GitHub Actions Scheduled CI:** [`.github/workflows/weekly-dependency-check.yml`](file:///d:/FullStackProjects/Diety/.github/workflows/weekly-dependency-check.yml) triggers every 7 days (Monday 09:00 UTC) on Node.js 26 to automate dependency scans.
3. **Agent Background Daemon Schedule:** Task `task-690` registered in the assistant environment (`0 9 */7 * *`) to proactively alert developers on upstream releases.

---

## 9. Master Document Cross-Reference Map

All files are located in `d:\FullStackProjects\Diety\`:

1. [`SOFTWARE_REQUIREMENTS_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/docs/SOFTWARE_REQUIREMENTS_SPECIFICATION.md) - Formal SRS document.
2. [`SOFTWARE_DESIGN_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/docs/SOFTWARE_DESIGN_SPECIFICATION.md) - Formal SDS document with Sequence & State Machine diagrams.
3. [`DATABASE_SCHEMA.md`](file:///d:/FullStackProjects/Diety/docs/DATABASE_SCHEMA.md) - 3NF database schema with 32 tables.
4. [`CODE_ARCHITECTURE_AND_PRINCIPLES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_ARCHITECTURE_AND_PRINCIPLES.md) - 14-Book architecture principles & Hexagonal rules.
5. [`CODE_SPECIFICATION_AND_DEPENDENCIES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_SPECIFICATION_AND_DEPENDENCIES.md) - Monorepo conventions, TypeScript strict rules, dependencies & docs.
6. [`ARCHITECTURE_C4_DIAGRAMS.md`](file:///d:/FullStackProjects/Diety/docs/ARCHITECTURE_C4_DIAGRAMS.md) - Complete C4 model structural diagrams (Levels 1-4).
7. [`DEVELOPMENT_PLAN.md`](file:///d:/FullStackProjects/Diety/docs/DEVELOPMENT_PLAN.md) - Stepwise TDD implementation roadmap across 8 phases.
8. [`PROJECT_PROGRESS_REPORT.md`](file:///d:/FullStackProjects/Diety/docs/PROJECT_PROGRESS_REPORT.md) - Milestone status, completion matrix, and risk register.
9. [`PROJECT_CONTEXT_DUMP.md`](file:///d:/FullStackProjects/Diety/docs/PROJECT_CONTEXT_DUMP.md) - This document: complete memory and context dump.
