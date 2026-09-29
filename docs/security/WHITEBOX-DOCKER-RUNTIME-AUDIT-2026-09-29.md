# White-box Docker / Runtime Security Audit — 2026-09-29

## Scope

Reviewed production containerization and runtime isolation for Platform, An Pardaz, An Sarraf, Banner, Accounting, database containers, and the mobile web frontend.

## Findings

### Confirmed hardening gaps fixed

1. Production database ports were bound to all host interfaces.
   - Fixed to loopback-only bindings (127.0.0.1) for PostgreSQL services.
   - This prevents direct remote database exposure through Docker port publishing.

2. Production service Docker build contexts were inconsistent with the Dockerfiles.
   - The service Dockerfiles require the repository workspace root, while several Compose files supplied a service-directory build context.
   - Production Compose files now use the repository root as build context and the service Dockerfile path explicitly.

3. Production service build installs could execute dependency lifecycle scripts.
   - Build-stage installs now use --ignore-scripts.
   - Runtime images remain minimal and run as the non-root node user.

4. Mobile web production Nginx ran as root.
   - Switched to the unprivileged Nginx image and port 8080.
   - Production Compose binds the frontend to localhost and applies read-only filesystem, no-new-privileges, and dropped capabilities.

5. Docker build contexts had no repository-level exclusion for environment files and host artifacts.
   - Added root .dockerignore excluding .env*, .git, node_modules, dist, coverage, and logs.

6. Production service containers now have explicit process/memory containment.
   - pids_limit: 256
   - mem_limit: 512m
   - Existing read_only, tmpfs /tmp, no-new-privileges, and cap_drop: ALL controls retained.

## Existing controls confirmed

- Production application services bind published ports to 127.0.0.1.
- Production application containers run non-root.
- Production application containers use read-only root filesystems.
- Linux capabilities are dropped.
- no-new-privileges is enabled.
- Temporary writable storage is restricted to /tmp.
- Healthchecks use loopback endpoints.
- Database passwords are required through environment variables rather than repository literals.
- No host Docker socket mount was found in the reviewed production Compose files.

## Residual risks / production follow-up

- Final VPS/container network policy, reverse-proxy TLS termination, firewall rules, Docker daemon exposure, image provenance/signing, registry authentication, and runtime monitoring must still be validated on the actual production host.
- Database containers intentionally remain writable because PostgreSQL requires persistent database storage; their data volumes are the required writable boundary.
- Resource limits should be tuned from real production load rather than treated as final capacity values.

## Result

No confirmed container-escape or direct application-container privilege-escalation path was found in the reviewed repository configuration. The concrete runtime exposure and build-context issues identified above were hardened in this item.
