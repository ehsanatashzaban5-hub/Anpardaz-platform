# An Pardaz Production VPS Runbook — 2026-09-30

This is the final repository-side deployment runbook for the first VPS deployment.

## Product boundary

- Mobile remains unchanged by this production runbook.
- Platform content is Web-only.
- Web routes Platform at `/api/v1/*`.
- Web routes An Pardaz at `/anpardaz/api/v1/*`.
- Web routes An Sarraf at `/ansarraf/api/v1/*`.
- Web routes Banner at `/banner/api/v1/*`.
- PostgreSQL is never public.
- Admin is a separate browser application and uses Admin Backend (:4006).

## VPS topology

For the first deployment, one VPS may host:

- Host Nginx + TLS
- Web :5173
- An Pardaz :4001
- An Sarraf :4002
- Platform :4003
- Accounting :4004
- Banner :4005
- Admin Backend :4006
- PostgreSQL instances :5433–5437 (loopback only)

The existing production compose files intentionally bind application/database ports to 127.0.0.1.

## DNS

Use the real domain you control.

Minimum:

- `A @ -> VPS_PUBLIC_IPV4`
- `A www -> VPS_PUBLIC_IPV4` (only if www is desired)
- `A admin -> VPS_PUBLIC_IPV4` (for the separate Admin UI)

Do not create public DNS records for PostgreSQL or internal service ports.

## Host prerequisites

Install:

- Docker Engine
- Docker Compose v2
- Nginx
- Certbot (or another ACME client)
- Git
- curl

Configure the firewall to allow only:

- TCP 22 (SSH), preferably restricted to your administration IP/network
- TCP 80
- TCP 443

Do not allow 4001–4006 or 5433–5437 from the Internet.

## Repository deployment

Clone the exact production commit, not an arbitrary moving branch:

`a4f07b94ffccb4cb2f7d2fbfb48ca791253dff32`

Create protected runtime environment files from the corresponding examples:

- `infrastructure/production/anpardaz.env.example`
- `infrastructure/production/ansarraf.env.example`
- `infrastructure/production/platform.env.example`
- `infrastructure/production/accounting.env.example`
- `infrastructure/production/banner.env.example`
- `infrastructure/production/admin.env.example`
- `infrastructure/production/web.env.example`

Never commit the populated files.

## Required production secrets/configuration

Replace every placeholder before startup.

At minimum:

- Platform Ed25519 private identity key
- Platform guest secret
- Platform OTP hash secret
- Kavenegar OTP credentials if phone OTP is enabled
- Database passwords
- Internal service tokens (minimum 32 random characters where enforced)
- Accounting internal token
- An Pardaz identity/accounting/provider credentials
- An Sarraf identity/accounting credentials
- An Sarraf KYC encryption key
- Real WALLEX credentials before enabling live execution
- Real geolocation provider URL/credentials where required by production policy
- Real HTTPS origins
- An Pardaz WebAuthn RP ID/origin matching the production domain

Provider execution must remain disabled until the real provider credentials and operational reconciliation path have been verified.

## Database initialization

Start PostgreSQL only after protected passwords are installed.

Run the repository migration runner from the corresponding database/network:

`bash databases/migrate.sh`

The Platform migration `073_phone_otp_auth` must be applied before enabling phone OTP login.

Verify each intended database with:

- `GET /health/db` where the service exposes it
- migration output
- database health checks

Do not expose database ports publicly.

## Application startup

Start the production compose groups from `infrastructure/production/`:

- `anpardaz.compose.yml`
- `ansarraf.compose.yml`
- `platform.compose.yml`
- `accounting.compose.yml`
- `admin.compose.yml`
- `web.compose.yml`

Platform workers in `platform.compose.yml` must be started only with the production worker configuration appropriate to the enabled features.

## Host Nginx

Install the repository template `infrastructure/production/nginx.example`, replacing:

- `YOUR_WEB_DOMAIN`
- `YOUR_ADMIN_DOMAIN`
- certificate paths

The public Web API boundary is:

- `/api/v1/*` -> Platform
- `/anpardaz/api/v1/*` -> An Pardaz
- `/ansarraf/api/v1/*` -> An Sarraf
- `/banner/api/v1/*` -> Banner

The Admin UI/API is intentionally separate from the public Web content API.

## Verification order

1. Docker containers are healthy.
2. Host ports are loopback-only.
3. `curl http://127.0.0.1:4001/health`
4. `curl http://127.0.0.1:4002/health`
5. `curl http://127.0.0.1:4003/health`
6. `curl http://127.0.0.1:4004/health`
7. `curl http://127.0.0.1:4005/health`
8. `curl http://127.0.0.1:4006/health`
9. `curl http://127.0.0.1:5173/health`
10. Verify HTTPS Web routes through the real domain.
11. Verify Admin login through the admin domain.
12. Verify Web content is loaded from Platform and no Web screen uses localhost URLs.
13. Verify Mobile is not part of this Web/Platform deployment boundary.
14. Verify no financial balance, receipt, quote, provider success, or transaction state is synthesized by the production UI.

## Rollback

Keep the previous known-good commit and database backups.

For an application rollback:

1. stop the affected compose service;
2. checkout the previous known-good commit;
3. rebuild only the affected image;
4. restart it;
5. verify its health endpoint;
6. verify the public route;
7. do not roll back database migrations blindly.

Financial/accounting migrations require a forward-compatible rollback plan or a corrective migration.

## Production gate

This repository-side gate is complete only when:

- CI/security/release checks for the frozen baseline are green;
- the VPS is reachable;
- TLS is valid;
- all intended health checks are green;
- migrations are applied;
- real production secrets are installed;
- provider credentials are verified where a live provider is enabled;
- Web public routes work;
- Admin works;
- Mobile remains untouched by the Web Platform deployment.

The VPS/DNS/TLS and provider credentials cannot be completed from GitHub; those are runtime deployment actions on the user's infrastructure.
