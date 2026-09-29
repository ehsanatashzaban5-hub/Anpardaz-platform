# Final security stage — attack-chain and regression hardening — 2026-09-29

## Scope

Stage 10 is the final repository-level security pass after items 1–9:

1. authentication/authorization
2. BOLA/IDOR
3. injection
4. financial business logic, replay, race and accounting integrity
5. internal/admin abuse
6. upload/path traversal/SSRF
7. rate limiting and abuse
8. secrets/supply chain
9. Docker/runtime hardening

Stage 10 re-audited the current `main` integration point and specifically closed concrete residual gaps left by those reviews rather than repeating their inventories.

## Current integration point

- Repository: `ehsanatashzaban5-hub/Anpardaz-platform`
- Base: `main`
- Base commit before this stage: `1b2fbe4372bb526ce84fef3bcbad9ba4aaf64171`
- Stage branch: `security/final-attack-chain-audit-2026-09-29`

The nine preceding security branches were compared against `main`. The corresponding nine audit changes are already represented in the current `main` history; the stage branches remain historical audit branches with their individual reports.

## Concrete findings closed in stage 10

### 1. Mobile runtime healthcheck used the wrong port

The production/mobile Nginx runtime listens on port 8080, but the Compose healthcheck still queried port 80.

Fixed:

- `apps/mobile/docker-compose.yml`
- healthcheck now queries `127.0.0.1:8080/health`

This prevents a false-unhealthy container state after the non-root Nginx hardening from stage 9.

### 2. Mobile Docker build still allowed dependency lifecycle scripts

The service Dockerfiles had already been hardened with `--ignore-scripts`, but the mobile Dockerfile still used a normal frozen install.

Fixed:

- `apps/mobile/Dockerfile`
- dependency installation now uses `--ignore-scripts`
- the required Vite/esbuild build dependency is rebuilt explicitly before the application source is copied

This makes the mobile image build consistent with the repository's supply-chain policy without enabling arbitrary package lifecycle scripts.

### 3. GitHub Actions were still mutable by tag

The stage-8 audit explicitly identified mutable GitHub Action tags as a residual supply-chain risk.

Fixed across the repository workflows:

- `actions/checkout` → immutable SHA for v6.0.2
- `actions/setup-node` → immutable SHA for v6.4.0
- `pnpm/action-setup` → immutable SHA for v4.3.0
- `actions/upload-artifact` → immutable SHA for v4.6.2
- `github/codeql-action` → immutable SHA for v3.38.1

A weekly Dependabot GitHub Actions update policy was also added at `.github/dependabot.yml`.

### 4. Added a permanent regression gate

Added `.github/workflows/security-policy.yml`.

It fails CI if:

- an external GitHub Action is not pinned to a full 40-character commit SHA;
- a repository environment file is accidentally tracked;
- production/database Compose files publish PostgreSQL on all interfaces;
- the mobile healthcheck and Nginx runtime port become inconsistent.

This converts the stage-10 fixes from one-time review findings into enforceable repository invariants.

### 5. Added runtime validation for the mobile container

The Docker runtime workflow now builds the mobile image and waits for its Docker healthcheck to become healthy. An unhealthy or never-ready container fails the workflow and emits container logs.

## Security assessment

No new confirmed Critical/High application vulnerability was established by the final repository-level pass.

The important result of stage 10 is not a claim that the system is invulnerable. It closes the concrete repository-level residuals found after items 1–9 and adds regression controls so those classes of mistakes are less likely to return.

## Remaining external boundary

A repository audit cannot verify the actual VPS/reverse-proxy/firewall/Docker-daemon state, production TLS configuration, secret rotation history, registry provenance, host-level intrusion detection, or provider sandbox behavior.

Those are deployment/runtime controls, not unresolved source-code findings.

## Status

**Stage 10 — complete for the repository-level security/intrusion-prevention program.**

The stage-10 changes are isolated on `security/final-attack-chain-audit-2026-09-29` and are ready for CI verification and review before merging to `main`.
