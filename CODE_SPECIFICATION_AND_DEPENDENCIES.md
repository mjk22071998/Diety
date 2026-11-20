# Code Specification & External Dependencies Catalog
## Dietitian Freelance Marketplace Platform ("Diety")

**Document Version:** 1.0.0  
**Status:** Approved Architectural Specification  
**Scope:** Universal Code Standards, Directory Topology, Coding Conventions, and Exhaustive Dependency Inventory across Monorepo Applications and Packages  
**Companion Documents:**
- [`SOFTWARE_REQUIREMENTS_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/SOFTWARE_REQUIREMENTS_SPECIFICATION.md) (SRS)
- [`SOFTWARE_DESIGN_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/SOFTWARE_DESIGN_SPECIFICATION.md) (SDS)
- [`DATABASE_SCHEMA.md`](file:///d:/FullStackProjects/Diety/DATABASE_SCHEMA.md) (3NF Database Specification)
- [`CODE_ARCHITECTURE_AND_PRINCIPLES.md`](file:///d:/FullStackProjects/Diety/CODE_ARCHITECTURE_AND_PRINCIPLES.md) (Hexagonal Architecture & DDD Design Principles)

---

## 1. Monorepo Topology & Project Structure

The project is structured as a **Turborepo** workspace powered by **pnpm** (v9+). It provides strong code-sharing between the client, dietitian, and admin interfaces while isolating runtime boundaries and preventing dependency leakage.

```
diety/
├── apps/
│   ├── api/                     # Subsystem 1 & 2: NestJS DDD/Hexagonal Backend API & WebSocket Signaling
│   ├── web/                     # Subsystem 3: Next.js 15 App Router Web App (Clients & Dietitians)
│   ├── admin/                   # Subsystem 4: Next.js 15 App Router Dedicated Admin Console (Tribunal & Audits)
│   └── mobile/                  # Subsystem 5: Expo / React Native Cross-Platform App (iOS & Android)
├── packages/
│   ├── types/                   # Shared TypeScript domain models, enums, DTO contracts, event payloads
│   ├── validation/              # Shared Zod validation schemas (isomorphic client/server validation)
│   ├── ui/                      # Shared design system primitives, tokens, and Tailwind configuration
│   └── tsconfig/                # Base TypeScript configurations (strict, node, react, react-native)
├── docker/
│   ├── docker-compose.yml       # Local $0 infrastructure (PostgreSQL, Redis, MinIO, Ollama)
│   └── Dockerfile.api           # Production multi-stage Docker build for NestJS backend
├── .env.example                 # Root environment variables template
├── package.json                 # Monorepo root scripts & pnpm workspace definitions
├── pnpm-workspace.yaml          # Workspace package globs
└── turbo.json                   # Turborepo task pipeline (build, test, lint, dev)
```

---

## 2. Universal Code Specification & Engineering Conventions

### 2.1 Language & Toolchain Versions
- **Language:** TypeScript 5.6+ with strict type checking enabled across all workspaces.
- **Node.js Runtime:** Node.js 26 Active LTS (`v26.13.1` "Lithium" or minimum supported `v24.22.3` "Krypton").
- **Package Manager:** `pnpm` v9.12.0+ (strictly enforced via `engines` field in `package.json`).
- **Build Orchestrator:** `turborepo` v2.2+.

### 2.2 Strict TypeScript Compiler Configuration
Every workspace package inherits from `@diety/tsconfig/base.json` with the following mandatory compiler flags:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

### 2.3 Naming & Structural Conventions

| Entity / Concern | Convention | Example | File Placement |
| :--- | :--- | :--- | :--- |
| **Domain Entities** | `PascalCase` | `DietitianApplication`, `Contract` | `domain/entities/<name>.entity.ts` |
| **Value Objects** | `PascalCase` | `Money`, `RatingScore`, `ProposalLimit` | `domain/value-objects/<name>.vo.ts` |
| **Domain Events** | `PascalCase` (Past Tense) | `ProposalAcceptedEvent`, `StrikeIssuedEvent` | `domain/events/<name>.event.ts` |
| **Use Cases / Commands** | `PascalCase` (Action Verb) | `AcceptProposalUseCase`, `IssueStrikeCommand`| `application/use-cases/<name>.use-case.ts` |
| **Repository Ports** | `I<PascalCase>Port` | `IContractRepositoryPort` | `application/ports/<name>-repository.port.ts` |
| **Repository Adapters** | `<PascalCase>Adapter` | `PrismaContractRepositoryAdapter` | `infrastructure/adapters/persistence/<name>.adapter.ts` |
| **Controllers** | `<PascalCase>Controller` | `EscrowController`, `DietitianController` | `presentation/controllers/<name>.controller.ts` |
| **DTOs & Schemas** | `<PascalCase>Dto` / `Schema` | `CreateBidDto`, `CreateBidSchema` | `packages/validation/src/schemas/<name>.schema.ts` |
| **React Components** | `PascalCase` | `AppointmentScheduler`, `DisputeCaseViewer` | `components/<category>/<Name>.tsx` |
| **Hooks / Utilities** | `camelCase` (prefix `use`) | `useWebRTCConnection`, `formatCurrency` | `hooks/use<Name>.ts`, `lib/<name>.ts` |
| **File Names** | `kebab-case` with dot suffix | `diet-plan.entity.ts`, `accept-proposal.use-case.ts` | Everywhere |
| **Database Tables** | `snake_case` (Plural) | `dietitian_applications`, `escrow_contracts` | PostgreSQL schema |
| **Database Columns** | `snake_case` | `platform_fee_cents`, `verification_status` | PostgreSQL columns |

### 2.4 Error Handling & Standard API Contract
All HTTP and WebSocket errors returned by `apps/api` must conform to the **RFC 7807 Problem Details** standard format:

```typescript
// Standard API Error Response Body
export interface StandardErrorResponse {
  type: string;             // URI identifier: "https://api.diety.org/errors/insufficient-escrow"
  title: string;            // Human-readable summary: "Insufficient Escrow Balance"
  status: number;           // HTTP Status: 400, 401, 403, 404, 409, 422, 500
  detail: string;           // Detailed failure message explaining specific invariant violated
  instance: string;         // Request correlation path: "/contracts/c123/disburse"
  code: string;             // Machine-readable internal error code: "ERR_ESCROW_FROZEN"
  timestamp: string;        // ISO 8601 UTC timestamp
  errors?: Array<{          // Field-level validation breakdown (for 422 / Zod errors)
    field: string;
    message: string;
  }>;
}
```

---

## 3. Subsystem Breakdown & Architecture Specifications

### 3.1 Backend Application (`apps/api` - NestJS Hexagonal Architecture)

The backend implements the 6 Bounded Contexts using **Hexagonal Architecture** (Ports and Adapters) as mandated in `CODE_ARCHITECTURE_AND_PRINCIPLES.md`.

```
apps/api/src/
├── bounded-contexts/
│   ├── identity/                    # 1. Identity & Credentialing Context
│   │   ├── domain/                  # Entities, Value Objects, Domain Exceptions
│   │   ├── application/             # Use Cases, Ports (IRepositoryPort, IAIEvaluatorPort)
│   │   ├── infrastructure/          # Prisma Repositories, Ollama AI Adapter, MinIO S3 Adapter
│   │   └── presentation/            # REST Controllers, Guards, Serializers
│   ├── marketplace/                 # 2. Marketplace & Bidding Context
│   ├── escrow/                      # 3. Escrow & Financial Ledger Context
│   ├── reputation/                  # 4. Reputation & Level Ranking Context
│   ├── clinical/                    # 5. Clinical Consultation & Meal Plan Context (WebRTC Gateway)
│   └── tribunal/                    # 6. Dispute & Disciplinary Tribunal Context
├── shared/
│   ├── filters/                     # Global RFC 7807 Exception Filter
│   ├── interceptors/                # Logging, Performance Timing, Correlation ID Interceptor
│   ├── guards/                      # JwtAuthGuard, RolesGuard, StrikeThrottleGuard
│   └── pipes/                       # ZodValidationPipe
└── main.ts                          # Bootstrap with CORS, Helmet, RateLimiter, CookieParser
```

#### Invariant Enforcement:
- **No Outer Leaks:** Code in `domain/` must have **zero imports** from `@nestjs/*`, `@prisma/client`, or any IO libraries.
- **Zod Validation Pipe:** Incoming DTOs are validated at the perimeter before use cases are invoked.
- **Unit of Work Transactions:** State changes spanning multiple tables (e.g., Accepting a Bid -> Creating a Contract -> Freezing Escrow) must execute within a Prisma interactive `$transaction` boundary.

---

### 3.2 Web Client Application (`apps/web` - Next.js 15 App Router)

The Web portal serves two primary end-user roles: **Clients** and **Dietitians**.

```
apps/web/src/
├── app/
│   ├── (auth)/                      # Login, Register, Password Reset routes
│   ├── (client)/                    # Client Workspace: Post Requirement, Review Bids, Escrow Checkout
│   │   ├── requirements/
│   │   ├── contracts/
│   │   └── consultations/[roomId]/  # In-browser WebRTC consultation room
│   ├── (dietitian)/                 # Dietitian Workspace: Direct Bid Feed, Verification Portal, Diet Builder
│   │   ├── bids/
│   │   ├── verification/            # License upload / AI Clinical Simulation Interface
│   │   ├── diet-plans/              # Interactive Macro & Meal Schedule Builder
│   │   └── wallet/                  # Escrow clearing countdown & withdrawal request
│   ├── api/                         # Next.js BFF (Backend-For-Frontend) route handlers (proxying cookies)
│   └── layout.tsx                   # Root theme, QueryClientProvider, WebSocketProvider
├── components/
│   ├── ui/                          # shadcn/ui components (Radix primitives + Tailwind)
│   ├── clinical/                    # Meal planner grid, Macro chart, Allergen alert badge
│   ├── consultation/                # Video feed, Audio toggle, Screen share, Attendance timer
│   └── marketplace/                 # Proposal card, Level badge, Escrow milestone stepper
├── hooks/                           # useWebRTC, useConsultationTimer, useEscrowBalance
└── stores/                          # Zustand client UI stores (active consultation state, audio device)
```

---

### 3.3 Dedicated Admin Console (`apps/admin` - Next.js 15 App Router)

A completely isolated console accessible only to authorized System Administrators, Disciplinary Arbitrators, and Clinical Board Auditors.

```
apps/admin/src/
├── app/
│   ├── (auth)/                      # Admin MFA login & Hardware Security Key verification
│   ├── dashboard/                   # Platform analytics: GMV, Escrow locked, Active contracts, Churn
│   ├── credentials/                 # Credential Audit Queue: Review uploaded degrees, licenses, AI transcripts
│   │   ├── [applicantId]/review/
│   ├── disputes/                    # Tribunal & Dispute Court: Evidence Vault, Chat replay, Escrow arbitration
│   │   ├── [caseId]/arbitrate/
│   ├── dietitians/                  # Strike Management, Level Overrides, Disciplinary Suspensions
│   └── financial/                   # Escrow ledger audit, Clearing timer overrides, Platform fee yield
├── components/
│   ├── tribunal/                    # Split-screen evidence reviewer, escrow division slider
│   ├── audit/                       # Document viewer with PDF annotation and license registry cross-check
│   └── analytics/                   # Real-time metrics charts (Recharts / Tremor)
```

---

### 3.4 Mobile Application (`apps/mobile` - Expo SDK 52+ / React Native)

The unified mobile app for Clients and Dietitians on Android and iOS, built with Expo Router for file-based routing and NativeWind for shared Tailwind styling.

```
apps/mobile/src/
├── app/
│   ├── (auth)/                      # Native Login, Biometric sign-in, Register
│   ├── (client)/                    # Client native tabs: Requirements, Active Care, Messages, Profile
│   ├── (dietitian)/                 # Dietitian native tabs: Marketplace Feed, Active Patients, Meal Plans, Wallet
│   ├── consultation/[roomId].tsx    # Native WebRTC video consultation room (React Native WebRTC)
│   └── _layout.tsx                  # Root navigation stack, SecureStore token hydration
├── components/
│   ├── ConsultationCall.tsx         # RTCView video streams, mic/camera controls, call duration
│   ├── MealPlanCard.tsx             # Interactive patient meal checklist with push reminders
│   └── LevelBadge.tsx               # Silver / Gold / Platinum rating indicator
├── hooks/
│   ├── useNativeWebRTC.ts           # PeerConnection lifecycle management with Android/iOS permissions
│   └── useBiometrics.ts             # LocalAuthentication (FaceID / Fingerprint)
└── lib/
    ├── secure-store.ts              # Encrypted JWT token storage in Keychain / Android Keystore
    └── socket-client.ts             # Socket.io client with background reconnect logic
```

---

## 4. Comprehensive External Dependencies Matrix & Official Documentation

The following tables catalog all production, development, and infrastructure dependencies required across the monorepo workspaces, comparing the **Recommended Stable Target** against the **Latest Live Release (as of Late 2026)**, along with direct links to official documentation.

### 4.1 Backend API (`apps/api`)

| Package Name | Category | Recommended Target | Latest Live Version | Official Documentation | Architectural Purpose & Justification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`@nestjs/core`** | Core Runtime | `^11.2.11` / `^12.6.0` | `12.6.0` | [docs.nestjs.com](https://docs.nestjs.com) | IoC container and modular lifecycle management. |
| **`@nestjs/common`** | Core Runtime | `^11.2.11` / `^12.6.0` | `12.6.0` | [docs.nestjs.com/first-steps](https://docs.nestjs.com/first-steps) | Decorators, pipes, guards, filters, and HTTP interfaces. |
| **`@nestjs/platform-express`**| Web Platform | `^11.2.11` / `^12.6.0` | `12.6.0` | [docs.nestjs.com/techniques/performance](https://docs.nestjs.com/techniques/performance) | HTTP server engine powering controllers and file uploads. |
| **`@nestjs/websockets`** | Real-Time | `^11.2.11` / `^12.6.0` | `12.6.0` | [docs.nestjs.com/websockets/gateways](https://docs.nestjs.com/websockets/gateways) | WebSocket gateway abstraction for real-time signaling. |
| **`@nestjs/platform-socket.io`**| Real-Time | `^11.2.11` / `^12.6.0` | `12.6.0` | [socket.io/docs/v4/](https://socket.io/docs/v4/) | Socket.io adapter supporting rooms, heartbeats, and reconnects. |
| **`@prisma/client`** | Persistence | `^6.19.3` / `^7.10.1` | `7.10.1` | [prisma.io/docs](https://www.prisma.io/docs) | Type-safe SQL query engine with ACID transactions. |
| **`prisma`** | Dev / Migration| `^6.19.3` / `^7.10.1` | `8.0.0-rc.34` | [prisma.io/docs/concepts/components/prisma-migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) | Schema migrations, database seeding, and code generator. |
| **`ioredis`** | Infrastructure | `^5.5.0` / `^6.0.0` | `6.0.0` | [github.com/redis/ioredis](https://github.com/redis/ioredis) | High-performance Redis client for token revocation & queues. |
| **`bullmq`** | Infrastructure | `^5.41.0` / `^6.7.8` | `6.7.8` | [bullmq.io](https://bullmq.io) | Distributed Redis message queue for 72h escrow clearing. |
| **`ollama`** | AI / Clinical | `^0.5.14` / `^0.6.4` | `0.6.4` | [github.com/ollama/ollama-js](https://github.com/ollama/ollama-js) | Official client for local Ollama models (Llama 3.2 & Qwen 2.5). |
| **`minio`** | Storage | `^8.0.4` | `8.0.4` | [min.io/docs/minio/linux/index.html](https://min.io/docs/minio/linux/index.html) | S3-compatible client for local degree & evidence storage. |
| **`argon2`** | Security | `^0.41.1` / `^0.45.2` | `0.45.2` | [github.com/ranisalt/node-argon2](https://github.com/ranisalt/node-argon2) | OWASP-recommended memory-hard password hashing. |
| **`@nestjs/jwt`** | Security | `^11.0.0` | `11.0.0` | [docs.nestjs.com/security/authentication](https://docs.nestjs.com/security/authentication) | Cryptographic JWT token issuance and validation. |
| **`zod`** | Validation | `^3.24.2` / `^4.6.7` | `4.6.7` | [zod.dev](https://zod.dev) | Isomorphic schema validation and TypeScript type inference. |

---

### 4.2 Web Portal & Admin Console (`apps/web` & `apps/admin`)

| Package Name | Category | Recommended Target | Latest Live Version | Official Documentation | Architectural Purpose & Justification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`next`** | Framework | `^15.5.29` / `^16.4.6`| `16.4.6` | [nextjs.org/docs](https://nextjs.org/docs) | App Router with React Server Components & Server Actions. |
| **`react`** | UI Core | `^19.0.0` / `^19.3.1`| `19.3.1` | [react.dev](https://react.dev) | Modern component rendering engine with async actions. |
| **`react-dom`** | UI Core | `^19.0.0` / `^19.3.1`| `19.3.1` | [react.dev/reference/react-dom](https://react.dev/reference/react-dom) | React DOM bindings for web viewports. |
| **`tailwindcss`** | Styling | `^3.4.19` (LTS) / `^4.3.5`| `4.3.5` | [tailwindcss.com/docs](https://tailwindcss.com/docs) | Utility-first CSS engine; v4 features new CSS `@theme` engine. |
| **`@tanstack/react-query`**| State Management| `^5.66.0` / `^5.108.2`| `5.108.2` | [tanstack.com/query/latest](https://tanstack.com/query/latest) | Server-state caching, deduping, and optimistic updates. |
| **`zustand`** | State Management| `^5.0.3` / `^5.1.0` | `5.1.0` | [docs.pmnd.rs/zustand](https://docs.pmnd.rs/zustand) | Lightweight client state for WebRTC UI & split-screen tabs. |
| **`@tanstack/react-table`**| Data Grid | `^8.21.2` | `8.21.2` | [tanstack.com/table/latest](https://tanstack.com/table/latest) | Headless data tables for audit and dispute tribunal queues. |
| **`lucide-react`** | Icons | `^0.475.0` / `^1.77.0`| `1.77.0` | [lucide.dev](https://lucide.dev) | Accessible SVG vector icon library. |
| **`recharts`** | Visualization | `^2.15.1` / `^3.11.0`| `3.11.0` | [recharts.org](https://recharts.org) | Interactive charts for dietitian earnings and admin metrics. |
| **`socket.io-client`** | Real-Time | `^4.8.1` / `^4.8.4` | `4.8.4` | [socket.io/docs/v4/client-api/](https://socket.io/docs/v4/client-api/) | WebRTC signaling channel and real-time event listener. |

---

### 4.3 Mobile Application (`apps/mobile` - Expo / React Native)

| Package Name | Category | Recommended Target | Latest Live Version | Official Documentation | Architectural Purpose & Justification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`expo`** | Framework | `~52.0.49` / `~58.0.26`| `58.0.26` | [docs.expo.dev](https://docs.expo.dev) | Cross-platform runtime and native module toolchain. |
| **`react-native`** | Mobile Core | `0.76.7` / `0.88.1` | `0.88.1` | [reactnative.dev](https://reactnative.dev) | Native mobile UI engine for Android and iOS. |
| **`expo-router`** | Navigation | `~4.0.17` / `~58.0.32`| `58.0.32` | [docs.expo.dev/router/introduction/](https://docs.expo.dev/router/introduction/) | Type-safe, file-based routing system. |
| **`react-native-webrtc`**| WebRTC Media | `^124.0.4` / `^155.0.1`| `155.0.1` | [github.com/react-native-webrtc/react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc) | Native WebRTC audio/video communication engine. |
| **`nativewind`** | Styling | `^4.1.23` / `^4.2.7` | `4.2.7` | [nativewind.dev](https://nativewind.dev) | Tailwind CSS compiler for React Native components. |
| **`turbo`** | Monorepo Tool | `^2.3.7` / `^2.11.13`| `2.11.13` | [turbo.build/repo/docs](https://turbo.build/repo/docs) | High-performance monorepo build pipeline and cache engine. |
| **`expo-secure-store`** | Security | `~14.0.1` | `14.0.1` | [docs.expo.dev/versions/latest/sdk/securestore/](https://docs.expo.dev/versions/latest/sdk/securestore/) | Encrypted storage for JWTs in iOS Keychain and Android Keystore. |
| **`expo-local-authentication`**| Security | `~15.0.2` | `15.0.2` | [docs.expo.dev/versions/latest/sdk/local-authentication/](https://docs.expo.dev/versions/latest/sdk/local-authentication/) | Biometric authentication (FaceID, TouchID, Android Biometrics). |
| **`expo-image-picker`** | Media | `~16.0.5` | `16.0.5` | [docs.expo.dev/versions/latest/sdk/imagepicker/](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Document and avatar camera capture and gallery selection. |
| **`expo-document-picker`**| Media | `~13.0.3` | `13.0.3` | [docs.expo.dev/versions/latest/sdk/document-picker/](https://docs.expo.dev/versions/latest/sdk/document-picker/) | Native file picker for PDF degrees and certification uploads. |
| **`expo-notifications`** | Notifications | `~0.29.13` | `0.29.13` | [docs.expo.dev/versions/latest/sdk/notifications/](https://docs.expo.dev/versions/latest/sdk/notifications/) | Push notification delivery for bid alerts, consultation reminders, and strikes. |
| **`lucide-react-native`** | Icons | `^0.475.0` / `^1.77.0`| `1.77.0` | [lucide.dev](https://lucide.dev) | Mobile SVG vector icons. |
| **`react-native-safe-area-context`**| Layout | `^5.2.0` | `5.2.0` | [github.com/th3rdwave/react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) | Handles screen notches, dynamic islands, and home indicators. |
| **`react-native-screens`** | Performance | `~4.4.0` | `4.4.0` | [github.com/software-mansion/react-native-screens](https://github.com/software-mansion/react-native-screens) | Native view hierarchy management for 60fps screen transitions. |

---

### 4.5 Shared Packages (`packages/*`)

| Package Directory | Key Dependencies | Exact Version | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **`packages/types`** | `typescript` | `^5.6.3` | Canonical TypeScript definitions for all Domain Entities, Enums, DTOs, and Events. Shared by all 4 applications. |
| **`packages/validation`**| `zod`, `@diety/types` | `^3.24.2` | Single source of truth for runtime validation schemas (Bid, Requirement, Dispute, DietPlan). |
| **`packages/ui`** | `react`, `tailwind-merge`, `clsx` | `*` | Reusable React design tokens, color scales, and typography definitions. |
| **`packages/tsconfig`**| `typescript` | `^5.6.3` | Standardized `base.json`, `nest.json`, `next.json`, and `react-native.json`. |

---

### 4.6 Development, Testing, and Tooling Dependencies

| Tool / Dependency | Category | Exact Version | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **`turbo`** | Monorepo Build | `^2.4.2` | Distributed build and task execution caching. |
| **`typescript`** | Compiler | `^5.6.3` | Static type analysis across all packages. |
| **`eslint`** | Linter | `^9.20.1` | Flat-config linter enforcing Clean Architecture boundary rules. |
| **`prettier`** | Formatter | `^3.5.1` | Opinionated code formatting. |
| **`vitest`** | Testing Engine | `^3.0.5` | Blazing-fast unit test execution for Domain Entities and Value Objects. |
| **`supertest`** | API Testing | `^7.0.0` | HTTP assertion library for integration testing of NestJS controllers. |
| **`testcontainers`** | Testing Infra | `^10.18.0` | Spins up ephemeral Dockerized PostgreSQL & Redis instances during CI test runs. |
| **`playwright`** | E2E Testing | `^1.50.1` | Cross-browser automated E2E tests for Web Portal and Admin Console. |
| **`tsx`** | TS Runner | `^4.19.2` | Zero-config TypeScript execution for database seed scripts and migrations. |

---

## 5. Local Infrastructure Stack ($0 Academic Budget)

The entire backend and AI verification pipeline runs locally using Docker Compose without requiring paid cloud subscriptions or third-party proprietary API keys.

```mermaid
flowchart TD
    subgraph LocalMachine["Local Developer Workstation ($0 Operating Budget)"]
        NestApp["NestJS Backend (:3001)"]
        WebApps["Next.js Portals (:3000, :3002)"]
        MobileApp["Expo Metro Bundler (:8081)"]
        
        subgraph DockerServices["Docker Compose Environment"]
            Postgres["PostgreSQL 16 (:5432)<br/>Relational 3NF Ledger"]
            Redis["Redis 7 (:6379)<br/>Escrow Timers, Revocations & Queues"]
            MinIO["MinIO S3 (:9000)<br/>Local Document & Evidence Vault"]
        end
        
        subgraph LocalAIService["Local AI Inference Engine"]
            Ollama["Ollama Daemon (:11434)<br/>Models: Llama 3.2 (3B) / Qwen 2.5 (7B)"]
        end
        
        subgraph FreeExternal["Zero-Cost External WebRTC STUN"]
            GoogleSTUN["Google Free STUN<br/>stun:stun.l.google.com:19302"]
        end
        
        NestApp -->|SQL Queries| Postgres
        NestApp -->|Timers / Queues| Redis
        NestApp -->|S3 Uploads| MinIO
        NestApp -->|Inference HTTP| Ollama
        WebApps -->|REST & WebSockets| NestApp
        MobileApp -->|REST & WebSockets| NestApp
        WebApps -.->|NAT Traversal| GoogleSTUN
        MobileApp -.->|NAT Traversal| GoogleSTUN
    end
```

### 5.1 Local Docker Compose Specification (`docker/docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres:
    # Recommended LTS: postgres:16-alpine | Latest Live: postgres:19-alpine
    image: postgres:16-alpine
    container_name: diety-postgres
    restart: always
    environment:
      POSTGRES_USER: diety_admin
      POSTGRES_PASSWORD: local_dev_secret_password
      POSTGRES_DB: diety_platform_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U diety_admin -d diety_platform_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    # Recommended LTS: redis:7-alpine | Latest Live: redis:8-alpine
    image: redis:7-alpine
    container_name: diety-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:RELEASE.2024-11-07T00-52-20Z
    container_name: diety-minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio_admin
      MINIO_ROOT_PASSWORD: minio_local_secret
    ports:
      - "9000:9000"   # S3 API Port
      - "9001:9001"   # Web Console Port
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 5.2 Local Ollama AI Setup Specification
To execute the AI Clinical Simulation Exam ($0 API cost), Ollama runs natively on the host:
```bash
# 1. Start Ollama
ollama serve

# 2. Pull Clinical Reasoning & Patient Simulation Models
ollama pull llama3.2:3b
ollama pull qwen2.5:7b

# 3. Verification of Local Endpoint
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Hello Doctor",
  "stream": false
}'
```

---

## 6. Testing, Quality Gates & Boundary Enforcement

### 6.1 Testing Hierarchy & Coverage Mandates

```
+-------------------------------------------------------------------------+
| Level 4: E2E Browser & Mobile Tests (Playwright / Maestro)             |
|          Validates complete user flows (Bid -> Escrow -> Call -> Done)  |
+-------------------------------------------------------------------------+
| Level 3: Integration Tests (NestJS Test + Docker Testcontainers)        |
|          Validates Prisma SQL Adapters, Redis Queues, & HTTP Routes     |
+-------------------------------------------------------------------------+
| Level 2: Application Use Case Tests (Vitest with In-Memory Mocks)       |
|          Validates orchestration, transaction bounds, and event firing  |
+-------------------------------------------------------------------------+
| Level 1: Domain Entity & Value Object Unit Tests (Pure Vitest)         |
|          Validates business invariants, financial sums, rating algorithms|
+-------------------------------------------------------------------------+
```

#### Coverage Thresholds:
- **Domain Layer (`domain/`):** Minimum **95% unit test coverage**. No dependencies allowed.
- **Application Layer (`application/`):** Minimum **85% test coverage** using in-memory mock ports.
- **Infrastructure Layer (`infrastructure/`):** Verified via integration tests against ephemeral PostgreSQL.

### 6.2 Architecture Boundary Enforcement (ESLint Rules)
To guarantee that outer layers never leak into inner domain layers, `@diety/eslint-config` enforces strict dependency boundaries:

```javascript
// .eslintrc.js (Sample Boundary Rule)
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@nestjs/*', '@prisma/*', 'ioredis', 'minio'],
            message: 'Domain layer files cannot import framework or infrastructure libraries.',
          },
        ],
      },
    ],
  },
};
```

---

## 7. Environment Configuration Catalog (`.env.example`)

```ini
# ==============================================================================
# BACKEND API CONFIGURATION (apps/api/.env)
# ==============================================================================
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# PostgreSQL Database Connection
DATABASE_URL=postgresql://diety_admin:local_dev_secret_password@localhost:5432/diety_platform_db?schema=public

# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379

# Cryptographic Tokens (Argon2 & JWT)
JWT_ACCESS_SECRET=local_super_secret_jwt_access_key_min_32_chars_long
JWT_REFRESH_SECRET=local_super_secret_jwt_refresh_key_min_32_chars_long
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Local Object Storage (MinIO S3)
S3_ENDPOINT=http://localhost:9000
S3_PORT=9000
S3_USE_SSL=false
S3_ACCESS_KEY=minio_admin
S3_SECRET_KEY=minio_local_secret
S3_BUCKET_DOCUMENTS=diety-documents
S3_BUCKET_EVIDENCE=diety-evidence

# Local AI Engine (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_SIMULATION_MODEL=llama3.2:3b
OLLAMA_GRADING_MODEL=qwen2.5:7b

# WebRTC STUN Server
WEBRTC_STUN_SERVER=stun:stun.l.google.com:19302

# ==============================================================================
# WEB APPLICATION CONFIGURATION (apps/web/.env.local)
# ==============================================================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_WEBRTC_STUN=stun:stun.l.google.com:19302

# ==============================================================================
# ADMIN CONSOLE CONFIGURATION (apps/admin/.env.local)
# ==============================================================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ADMIN_SESSION_COOKIE_SECRET=local_admin_cookie_secret_at_least_32_characters

# ==============================================================================
# MOBILE APPLICATION CONFIGURATION (apps/mobile/.env)
# ==============================================================================
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api/v1 # Android Emulator loopback
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:3001

---

## 8. 7-Day Continuous Dependency Recency & Audit Policy

To prevent dependency stagnation, maintain security patch hygiene, and leverage performance optimizations across modern runtimes, the platform enforces an automated **7-Day Dependency Recency Protocol**.

### 8.1 Automated Weekly Auditor Script
A turnkey audit script [`scripts/check-dependency-updates.mjs`](file:///d:/FullStackProjects/Diety/scripts/check-dependency-updates.mjs) scans all monorepo packages against the live npm registry:

```bash
# Run ad-hoc dependency recency audit:
node scripts/check-dependency-updates.mjs
```

### 8.2 GitHub Actions Scheduled Workflow
The CI pipeline in [`.github/workflows/weekly-dependency-check.yml`](file:///d:/FullStackProjects/Diety/.github/workflows/weekly-dependency-check.yml) triggers every 7 days (every Monday at 09:00 UTC):
- Queries current registry dist-tags across all 33 core packages.
- Differentiates between `PATCH_UPGRADE`, `MINOR_UPGRADE`, and `MAJOR_UPGRADE`.
- Uploads audit reports and flags breaking changes before integration.

### 8.3 Daemon Agent Recency Schedule
Within the AI assistant runtime, an automated background cron (`0 9 */7 * *`, Task 690) runs as a persistent daemon to proactively notify the development team of upstream releases across NestJS, Next.js, React, Expo, Prisma, Redis, PostgreSQL, and Ollama.

