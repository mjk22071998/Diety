# Diety - Specialized Dietitian & Clinical Nutrition Freelance Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-26_Active_LTS_(Lithium)-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-v2.11+-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/repo)
[![pnpm](https://img.shields.io/badge/pnpm-v9.12+-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![NestJS](https://img.shields.io/badge/NestJS-v12+-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-v16+-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Expo](https://img.shields.io/badge/Expo-SDK_58+-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React](https://img.shields.io/badge/React-v19+-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-v7+-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F19-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Valkey](https://img.shields.io/badge/Valkey-8-FF5722?logo=valkey&logoColor=white)](https://valkey.io)
[![Ollama](https://img.shields.io/badge/Ollama-Local_AI-000000?logo=ollama&logoColor=white)](https://ollama.ai)
[![Conventional Commits](https://img.shields.io/badge/Conventional_Commits-v1.0.0-FE5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org)

**Diety** is an enterprise-grade freelance marketplace platform connecting individuals seeking clinical nutrition guidance with verified dietitians. Built specifically to eliminate the credentialing barriers of conventional freelance platforms, Diety enforces clinical safety through a **dual-pathway verification engine**, protects transactions with an **immutable double-entry escrow ledger**, conducts encrypted **peer-to-peer WebRTC video consultations**, and arbitrates disputes through a **three-strike disciplinary tribunal**.

The entire platform is engineered to run on a **$0 academic operating budget**, replacing costly cloud APIs with containerized local services (PostgreSQL 16/19, Valkey 8, MinIO S3), local host LLMs (Ollama with Llama 3.2 3B and Qwen 2.5 7B), and zero-cost public Google STUN for WebRTC NAT traversal.

---

## 1. Core Architectural Pillars

- **Hexagonal Architecture (Ports & Adapters):** Core domain business logic is strictly decoupled from framework and infrastructure details (*Clean Architecture*). The `domain/` layer contains **zero imports** from NestJS, Prisma, or external IO drivers.
- **Dual-Pathway Practitioner Verification:**
  - *Pathway A (Licensed Dietitians):* Official government practice license upload verified against public medical registries.
  - *Pathway B (Nutrition Degree Graduates):* Accredited university degree audit paired with an **Automated AI Clinical Case Simulation Exam** run locally via Ollama. Candidates must achieve $\ge 75\%$ on objective clinical rubrics with zero allergen safety violations.
- **Double-Entry Financial Ledger:**
  $$\text{TotalUSD} \equiv \text{PlatformFeeUSD} + \text{NetEarningsUSD}$$
  All funds are managed in integer cents. Client refunds are guaranteed in the **exact local fiat units originally paid**.
- **Triple-Check Escrow Release Protocol:** Contracts release funds only when: (1) Client approves or 72h auto-release timer expires, (2) $\ge 75\%$ of calendar time has elapsed, (3) digital meal plans are delivered for each contracted week, and (4) all consultations have verified server attendance records ($\ge 15$ min mutual presence).
- **Three-Strike Disciplinary Tribunal:** Opening a dispute immediately freezes escrow disbursements and halts clearing countdowns. Strike 2 and Strike 3 trigger automated level demotions and bidding suspensions.
- **7-Day Continuous Dependency Recency Policy:** Automated CI and local scripts continuously scan the live npm registry and GitHub releases to keep all dependencies on modern, secure releases.

---

## 2. Monorepo Topology

Managed with **Turborepo** and **pnpm** workspaces:

```
diety/
├── apps/
│   ├── api/                     # NestJS 12 Hexagonal Backend API & WebSocket Signaling (:3001)
│   ├── web/                     # Next.js 16 App Router Client & Dietitian Web Portal (:3000)
│   ├── admin/                   # Next.js 16 App Router Isolated Admin & Tribunal Console (:3002)
│   └── mobile/                  # Expo SDK 58 / React Native 0.88 Cross-Platform Mobile App (:8081)
├── packages/
│   ├── types/                   # @diety/types: Domain Enums, Interfaces, DTOs, Event Payloads
│   ├── validation/              # @diety/validation: Isomorphic Zod Validation Schemas (37+ Unit Tests)
│   ├── ui/                      # @diety/ui: Shared Tailwind CSS 4 Design Tokens & Radix Components
│   └── tsconfig/                # @diety/tsconfig: Strict TypeScript Configurations (base, nest, next, react-native)
├── docker/
│   └── docker-compose.yml       # Local $0 Stack: PostgreSQL 16/19, Valkey 8, MinIO S3
├── docs/                        # Complete Architecture, Specifications, Schema & C4 Diagrams
├── scripts/
│   └── check-dependency-updates.mjs # 7-day recurring dependency recency auditor
└── .github/
    └── workflows/
        └── weekly-dependency-check.yml # Weekly scheduled CI dependency auditor
```

---

## 3. Technology Stack & Live Verified Versions

| Layer / Subsystem | Primary Technologies | Pinned Version | Documentation |
| :--- | :--- | :--- | :--- |
| **Runtime & Toolchain** | Node.js (Active LTS), TypeScript, pnpm, Turborepo | Node `26.13+`, TS `7.0+`, pnpm `9.12+`, Turbo `2.11+` | [nodejs.org](https://nodejs.org) · [turbo.build](https://turbo.build) |
| **Backend API (`apps/api`)** | NestJS, Prisma ORM, BullMQ, ioredis, Socket.io, Argon2 | NestJS `12.6+`, Prisma `7.10+`, BullMQ `6.7+`, ioredis `6.0+` | [docs.nestjs.com](https://docs.nestjs.com) · [prisma.io](https://prisma.io) |
| **Web Portal (`apps/web`)** | Next.js (App Router), React, Tailwind CSS, TanStack Query | Next.js `16.4+`, React `19.3+`, Tailwind `4.3+`, Query `5.108+`| [nextjs.org](https://nextjs.org) · [react.dev](https://react.dev) |
| **Admin Console (`apps/admin`)**| Next.js, TanStack Table, Recharts, Radix UI | Next.js `16.4+`, Table `9.3+`, Recharts `3.11+` | [tanstack.com/table](https://tanstack.com/table) |
| **Mobile App (`apps/mobile`)** | Expo, React Native, Expo Router, React Native WebRTC | Expo `58.0+`, RN `0.88+`, Router `58.0+`, WebRTC `155.0+` | [docs.expo.dev](https://docs.expo.dev) |
| **Local Infrastructure ($0)** | PostgreSQL 16/19, Valkey 8, MinIO S3, Ollama (Llama 3.2 & Qwen 2.5) | Docker Compose Services, Ollama `v0.40+` | [postgresql.org](https://postgresql.org) · [valkey.io](https://valkey.io) · [ollama.ai](https://ollama.ai) |

---

## 4. Quick Start & Developer Guide

### 4.1 Prerequisites
- **Node.js**: `v26.13.0` Active LTS or higher (`node -v`)
- **pnpm**: `v9.12.0` or higher (`npm install -g pnpm`)
- **Docker & Docker Compose**: For local PostgreSQL, Valkey, and MinIO
- **Ollama**: For local AI clinical case simulation ([Download Ollama](https://ollama.ai))

### 4.2 Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/diety.git
cd diety

# 2. Install monorepo dependencies
pnpm install

# 3. Initialize local environment variables
cp .env.example .env

# 4. Launch local infrastructure containers ($0 budget)
docker compose -f docker/docker-compose.yml up -d

# 5. Download local Ollama AI simulation models
ollama pull llama3.2:3b
ollama pull qwen2.5:7b
```

### 4.3 Running the Monorepo

```bash
# Run all applications simultaneously (API, Web, Admin, Mobile Metro)
pnpm dev

# Build all applications and packages with Turborepo caching
pnpm build

# Run unit and validation test suites across all workspaces
pnpm test

# Run strict TypeScript typecheck across all workspaces
pnpm typecheck

# Run 7-day automated dependency recency audit
pnpm deps:check # or: node scripts/check-dependency-updates.mjs
```

---

## 5. Comprehensive Documentation Index

All architectural specifications, database schemas, coding principles, and diagrams are maintained in the [`docs/`](file:///d:/FullStackProjects/Diety/docs/) directory:

| Document | File Link | Focus Area & Description |
| :--- | :--- | :--- |
| **Software Requirements (SRS)** | [`docs/SOFTWARE_REQUIREMENTS_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/docs/SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | 12 Functional requirements, user roles, verification rules, mathematical invariants. |
| **Software Design (SDS)** | [`docs/SOFTWARE_DESIGN_SPECIFICATION.md`](file:///d:/FullStackProjects/Diety/docs/SOFTWARE_DESIGN_SPECIFICATION.md) | Subsystem boundaries, 8 sequence diagrams, 4 state machine charts, WebRTC specs. |
| **3NF Database Schema** | [`docs/DATABASE_SCHEMA.md`](file:///d:/FullStackProjects/Diety/docs/DATABASE_SCHEMA.md) | 32 Normalized relational tables, foreign keys, compound indexes, double-entry ledger. |
| **Code Architecture & Principles** | [`docs/CODE_ARCHITECTURE_AND_PRINCIPLES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_ARCHITECTURE_AND_PRINCIPLES.md) | 14 Classic software books principle matrix, Hexagonal layers, Deep Module design. |
| **Code Spec & Dependencies** | [`docs/CODE_SPECIFICATION_AND_DEPENDENCIES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_SPECIFICATION_AND_DEPENDENCIES.md) | TypeScript strict rules, RFC 7807 error contract, 33-package live version catalog. |
| **C4 Architecture Diagrams** | [`docs/ARCHITECTURE_C4_DIAGRAMS.md`](file:///d:/FullStackProjects/Diety/docs/ARCHITECTURE_C4_DIAGRAMS.md) | C4 Levels 1 to 4 in GitHub-compatible Mermaid (Context, Containers, Components, Workflows). |
| **Implementation Plan** | [`docs/DEVELOPMENT_PLAN.md`](file:///d:/FullStackProjects/Diety/docs/DEVELOPMENT_PLAN.md) | 8-Phase stepwise TDD roadmap with interfaces, file maps, and review focus scenarios. |
| **Progress Report** | [`docs/PROJECT_PROGRESS_REPORT.md`](file:///d:/FullStackProjects/Diety/docs/PROJECT_PROGRESS_REPORT.md) | Executive tracking report, deliverables completion matrix, and risk register. |
| **Context Dump** | [`docs/PROJECT_CONTEXT_DUMP.md`](file:///d:/FullStackProjects/Diety/docs/PROJECT_CONTEXT_DUMP.md) | Complete persistent knowledge vault for zero-loss agentic and developer continuity. |
| **Git Workflow & Conventions** | [`docs/GIT_WORKFLOW_AND_CONVENTIONS.md`](file:///d:/FullStackProjects/Diety/docs/GIT_WORKFLOW_AND_CONVENTIONS.md) | Trunk-based development, branch naming, Conventional Commits v1.0, Husky hooks. |

---

## 6. Git Workflow & Contribution Guidelines

The project enforces **Trunk-Based Development with Short-Lived Feature Branches** and **Conventional Commits v1.0.0**:

- **Protected Main Branch:** Direct commits to `main` are forbidden. All changes land via Pull Request.
- **Short Branch Lifetimes:** Feature branches live $\le 48\text{ hours}$ to prevent merge conflicts.
- **Standard Branch Naming:** `<type>/<scope>-<description>` (e.g. `feat/identity-ai-simulation-portal`, `fix/escrow-clearing-timer`, `docs/update-readme`).
- **Commit Format:** `<type>(<scope>): <short imperative summary>` (e.g. `feat(escrow): implement 72h clearing worker`).
- **Linear History:** Rebase before merging (`git pull --rebase origin main`). Merges to `main` use **Squash & Merge**.

---

## 7. License & Academic Research Notice

This project is developed as an academic software engineering and healthcare informatics research implementation. Designed for $0 operational budget feasibility and open-source accessibility.
