# Web production deployment

The Web frontend is a static Vite SPA. Platform content/auth APIs are consumed through the same-origin /platform prefix; An Sarraf uses /ansarraf; An Banner uses /banner.

Platform remains a backend domain for Web content and identity/authentication. It is not a Mobile UI/product surface.

## Build and run

1. Create the runtime env files required by the backend compose files.
2. Start the Web container:

   docker compose -f infrastructure/production/web.compose.yml up -d --build

3. Verify the container health endpoint locally:

   curl -fsS http://127.0.0.1:8080/health

4. Put the host reverse proxy in front of port 8080 and route /platform/, /ansarraf/, and /banner/ to the localhost-bound backend ports shown in reverse-proxy.conf.

5. Enable HTTPS at the host reverse proxy before exposing the service publicly.

No PostgreSQL port is exposed by the Web deployment. The application and backend service ports remain bound to loopback.
