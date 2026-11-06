# Web production deployment

The Web frontend is a static Vite SPA. Platform content/auth APIs are consumed through the same-origin /platform prefix; An Sarraf uses /ansarraf; An Banner uses /banner.

Platform remains a backend domain for Web content and identity/authentication. It is not a Mobile UI/product surface.

## An Banner production prerequisites

- The Banner API is the `banner` service in `infrastructure/production/platform.compose.yml`, bound only to `127.0.0.1:4005`.
- PostgreSQL has its own `banner-db` service and persistent volume in `databases/docker-compose.yml`; its host port is loopback-only (`127.0.0.1:5437`). Configure `DATABASE_URL` in `infrastructure/production/banner.env` to reach that database from the Banner container.
- Copy `infrastructure/production/banner.env.example` to `banner.env` and set real production values, including `IDENTITY_SERVICE_URL`, the Ed25519 public key, a strong internal token, the exact HTTPS web origin, and `TRUST_PROXY=true`. Do not use the example placeholders.
- Before applying migrations, take a verified database backup. From the repository root, load the protected runtime environment and apply the ordered, additive migrations with stop-on-error:

  ```sh
  set -a
  . infrastructure/production/banner.env
  set +a
  for migration in databases/banner/00*.sql; do
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  done
  ```

- Start and verify the Banner API:

  ```sh
  docker compose -f infrastructure/production/platform.compose.yml up -d --build banner
  curl -fsS http://127.0.0.1:4005/health
  curl -fsS http://127.0.0.1:4005/health/db
  ```

- The host HTTPS reverse proxy must route `/banner/` to `127.0.0.1:4005/`. Keep the database and backend ports off the public interface.

## Build and run

1. Create the runtime env files required by the backend compose files.
2. Start the Web container:

   ```sh
   docker compose -f infrastructure/production/web.compose.yml up -d --build
   ```

3. Verify the container health endpoint locally:

   ```sh
   curl -fsS http://127.0.0.1:8080/health
   ```

4. Put the host reverse proxy in front of port 8080 and route `/platform/`, `/ansarraf/`, and `/banner/` to the localhost-bound backend ports shown in reverse-proxy.conf.

5. Enable HTTPS at the host reverse proxy before exposing the service publicly.

No PostgreSQL port is exposed by the Web deployment. The application and backend service ports remain bound to loopback.
