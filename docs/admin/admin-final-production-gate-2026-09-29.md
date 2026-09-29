# Admin Final Production Gate — 2026-09-29

The repository-level Admin hardening stages are complete through this gate.

## Enforced invariants
- Browser access terminates at Admin Frontend → Admin Backend; no browser-to-PostgreSQL path.
- Admin Backend authenticates the identity through Platform before privileged proxying.
- Server-side permissions are checked before forwarding.
- Owning-service adapters use server-side service credentials and trusted gateway identity.
- Banner mutation attribution is bound to `x-admin-identity`, not body/query actor fields.
- Multipart is restricted to the video endpoint and requires `content.write`.
- Production secrets fail closed when missing or left as `CHANGE_ME`.
- Production service ports checked here are loopback-bound.
- Owning-service redirects are disabled.

## Runtime boundary
This static gate is not a substitute for live VPS testing. Live production verification still requires real secrets, HTTPS/reverse proxy, database backup/restore validation, and runtime penetration tests for direct internal-port access, IDOR, privilege escalation, token replay, identity spoofing, and upload abuse. Provider credentials must also be configured and tested before real An Sarraf execution is enabled.

