# Git Workflow, Branching Strategy & Commit Conventions
## Dietitian Freelance Marketplace Platform ("Diety")

**Document Version:** 1.0.0  
**Specification Standards:** Conventional Commits v1.0.0 · Trunk-Based Feature Branching · Linear Git History  
**Scope:** Universal Source Code Management, Branch Lifecycles, Commit Hygiene, and Pull Request (PR) Quality Gates  
**Companion Documents:**
- [`DEVELOPMENT_PLAN.md`](file:///d:/FullStackProjects/Diety/docs/DEVELOPMENT_PLAN.md) (Implementation Roadmap)
- [`CODE_SPECIFICATION_AND_DEPENDENCIES.md`](file:///d:/FullStackProjects/Diety/docs/CODE_SPECIFICATION_AND_DEPENDENCIES.md) (Coding Standards)
- [`PROJECT_PROGRESS_REPORT.md`](file:///d:/FullStackProjects/Diety/docs/PROJECT_PROGRESS_REPORT.md) (Status Tracking)

---

## 1. Branching Strategy: Trunk-Based Development with Short-Lived Feature Branches

To guarantee high velocity, eliminate merge hell, and ensure continuous integration across the monorepo, the platform follows **Trunk-Based Development with Short-Lived Feature Branches**.

```
  main (Protected) ─────────────────────────────────────────────────────────────► (Production)
         ▲                           ▲                           ▲
         │ (Squash & Merge)          │ (Squash & Merge)          │ (Squash & Merge)
         │                           │                           │
  feat/identity-ai-exam       feat/escrow-ledger          fix/webrtc-timeout
  (Lifetime < 48h)            (Lifetime < 48h)            (Lifetime < 24h)
```

### 1.1 Branch Classification & Rules

| Branch Type | Target / Base | Naming Schema | Max Lifetime | Merge Gate |
| :--- | :--- | :--- | :--- | :--- |
| **Trunk / Production** | `main` | `main` | Permanent | **Protected:** Direct commits forbidden. Requires PR review and green CI checks. |
| **Feature Branch** | Branch from `main` | `feat/<scope>-<description>` | 48 hours | All unit/integration tests green, no lint errors, PR approved. |
| **Defect / Bugfix** | Branch from `main` | `fix/<scope>-<description>` | 24 hours | Regression test included proving the fix, PR approved. |
| **Refactoring** | Branch from `main` | `refactor/<scope>-<description>` | 48 hours | Behavior-preserving; all existing test suites remain green. |
| **Documentation** | Branch from `main` | `docs/<scope>-<description>` | 24 hours | Markdown lint and link checks pass. |
| **Tooling & Infra** | Branch from `main` | `chore/<scope>-<description>` | 24 hours | Builds clean, dependency audits pass. |
| **Performance** | Branch from `main` | `perf/<scope>-<description>` | 48 hours | Benchmark verification included. |

### 1.2 Mandatory Branch Naming Rules
1. **Lowercase with Hyphens:** All branch names must be lowercase with words separated by hyphens (kebab-case). No underscores, camelCase, or spaces.
2. **Explicit Scope Prefix:** Every branch must start with one of the standard category prefixes: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `test/`, or `perf/`.
3. **Intent-Revealing Suffix:** The description must concisely describe the feature or defect without cryptic abbreviations.

#### Examples of Valid Branch Names:
- `feat/identity-ollama-simulation-adapter`
- `feat/escrow-milestone-release-worker`
- `feat/web-client-intake-form`
- `feat/admin-tribunal-evidence-viewer`
- `feat/mobile-webrtc-consultation-room`
- `fix/escrow-double-disbursement-race`
- `docs/c4-architecture-diagrams`
- `chore/upgrade-node-26-lts`

#### Examples of Invalid Branch Names (Rejected):
- `feature_login` (Use `feat/auth-login`)
- `my-new-branch` (Missing category and scope)
- `fix_bug` (Too vague; missing scope)
- `John/dev-work` (Personal name branching is forbidden)

---

## 2. Conventional Commits Specification (v1.0.0)

Every commit in the repository must conform strictly to the **Conventional Commits v1.0.0** specification.

```
<type>(<scope>): <short imperative summary>

[optional detailed body explaining WHY the change was made]

[optional footer(s): BREAKING CHANGE:, Closes #123]
```

### 2.1 Commit Types

| Type | Purpose | Example |
| :--- | :--- | :--- |
| **`feat`** | Introduces a new feature or user story to the codebase. | `feat(escrow): implement 72h security clearing countdown worker` |
| **`fix`** | Patches a bug or resolves an unexpected defect. | `fix(auth): prevent timing attack during argon2 password comparison` |
| **`docs`** | Documentation additions, revisions, or architectural updates. | `docs(architecture): add C4 container and component diagrams` |
| **`refactor`** | Code changes that neither fix a bug nor add a feature (e.g. extract class). | `refactor(domain): extract money value object from contract aggregate` |
| **`perf`** | Code changes aimed strictly at improving execution performance or latency. | `perf(signaling): batch webrtc attendance pings in valkey pipeline` |
| **`test`** | Adding missing tests, correcting test regressions, or refactoring test suites. | `test(escrow): add unit tests for 75% calendar elapsed invariant` |
| **`chore`** | Updating build scripts, monorepo configs, dependency bumps, or toolchain settings. | `chore(deps): bump next from 15.5.29 to 16.4.6` |
| **`ci`** | Modifications to CI/CD workflows, GitHub Actions, or automated scripts. | `ci(github): add 7-day recurring dependency auditor workflow` |
| **`build`** | Changes that affect the build system or external dependencies (pnpm, turbo). | `build(turbo): add pipeline caching for mobile test targets` |

### 2.2 Standard Scopes
Scopes must accurately identify the Bounded Context, workspace application, or shared package affected:

```
[ Monorepo App Scopes ]
api       --> apps/api (NestJS backend)
web       --> apps/web (Client & Dietitian Next.js portal)
admin     --> apps/admin (Isolated Next.js administrative console)
mobile    --> apps/mobile (Expo / React Native cross-platform app)

[ Shared Package Scopes ]
types      --> packages/types
validation --> packages/validation (Zod schemas)
ui         --> packages/ui (Design system)
config     --> packages/tsconfig, eslint-config

[ Domain / Bounded Context Scopes ]
identity     --> Identity, credentialing & AI simulation
marketplace  --> Client intake, bidding & proposal limits
escrow       --> Double-entry ledger, escrow holds & disbursements
reputation   --> 60-day metrics, level ranking & strikes
clinical     --> Meal planner, nutrition engine & WebRTC signaling
tribunal     --> Dispute court, evidence vault & arbitration
```

### 2.3 Commit Formatting Rules
1. **Imperative Mood:** Use the imperative mood in the subject line ("add", "implement", "fix", "refactor" — NOT "added", "adds", "fixing").
2. **Character Limit:** The first line (header) must be $\le 72$ characters.
3. **No Trailing Period:** Do not end the subject line with a period.
4. **Lowercase Summary:** The summary following the colon must start with a lowercase letter.
5. **Separate Body with Blank Line:** The commit body should explain the *motivation* and *context* of the change, not merely repeat what lines changed.

#### Example of an Exemplary Commit:
```git
feat(escrow): enforce 75% calendar elapsed invariant before milestone release

Contracts cannot be disbursed to the dietitian unless at least 75% of
the contracted time has passed. This prevents premature payout claims
on multi-week meal plans.

- Added isEligibleForDisbursement() domain method on Contract entity
- Wired invariant check inside DisburseEscrowUseCase
- Added unit tests covering early attempt and valid time scenarios

Closes #42
```

---

## 3. Local Git Workflow & Branch Lifecycles

### 3.1 Starting Work on a Feature
Always ensure you branch from a clean, up-to-date `main`:

```bash
# 1. Switch to main and pull latest upstream commits
git checkout main
git pull --rebase origin main

# 2. Create your isolated feature branch
git checkout -b feat/identity-ai-simulation-portal

# (Optional: If using git worktrees for isolated workspace execution)
git worktree add ../diety-feat-ai-sim feat/identity-ai-simulation-portal
```

### 3.2 Committing Changes (Atomic TDD Cycles)
Make small, atomic commits following the TDD cycle:
```bash
# 1. Stage test and verify failure
git add apps/api/test/unit/domain/contract.spec.ts
git commit -m "test(escrow): add failing unit tests for calendar elapsed check"

# 2. Implement minimal code to pass test
git add apps/api/src/bounded-contexts/escrow/domain/entities/contract.entity.ts
git commit -m "feat(escrow): implement calendar elapsed invariant on contract entity"
```

### 3.3 Synchronizing Before Pull Request
Never merge `main` into your feature branch creating merge bubbles. Always **rebase**:
```bash
# Fetch and rebase on main
git fetch origin
git rebase origin/main

# If conflicts occur, resolve them and continue:
# git add <resolved-files>
# git rebase --continue
```

### 3.4 Merging into Main (Linear History)
All feature branches merge into `main` via **Squash and Merge** (or fast-forward **Rebase and Merge**). This ensures:
- The `main` branch maintains a clean, linear, bisectable commit log.
- Every commit on `main` represents a working, fully tested state.
- Intermediate "wip" or "fix typo" commits are squashed into a single well-documented feature commit.

---

## 4. Pull Request (PR) Quality Gates & Checklist

Every PR submitted to `main` must include the following verification evidence:

```markdown
### PR Title: `feat(scope): concise imperative description`

#### Summary of Changes:
- [Short bullet list of changes introduced]

#### Architectural Invariants Verified:
- [ ] Dependency Rule respected (Domain layer has zero IO/framework imports)
- [ ] Financial balance invariant verified ($\text{Total} \equiv \text{Fee} + \text{Net}$)
- [ ] Error contract matches RFC 7807 (`StandardErrorResponse`)

#### Quality & Test Evidence:
- [ ] Unit tests added / passing (`pnpm test:unit`)
- [ ] Integration tests passing (`pnpm test:integration`)
- [ ] Static type check passing (`pnpm typecheck`)
- [ ] Linter passing with zero warnings (`pnpm lint`)
- [ ] Documentation updated where relevant
```

---

## 5. Automated Git Hooks (Husky & Lint-Staged)

To prevent bad commits and unformatted code from entering the repository, the project will configure local Git hooks:

```json
// package.json (Husky & lint-staged configuration)
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

- **`commit-msg` Hook:** Validates that the commit message matches Conventional Commits regex. Commits like `"fixed bug"` or `"wip"` are automatically blocked.
- **`pre-commit` Hook:** Runs `lint-staged` on modified files to format code and catch lint errors before commit creation.
- **`pre-push` Hook:** Executes fast unit tests (`pnpm test:unit`) to ensure broken builds are never pushed to the remote repository.
