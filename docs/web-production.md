# Web Production Boundary

The Web frontend is independently deployable and consumes Platform content APIs. Platform is not a Mobile product.

Public API paths:
- /api/v1/* -> Platform (:4003)
- /anpardaz/api/v1/* -> An Pardaz (:4001)
- /ansarraf/api/v1/* -> An Sarraf (:4002)
- /banner/api/v1/* -> An Banner (:4005)

This removes the /api/v1 collision between Web Platform content and An Pardaz banking APIs.

Deployment:
1. Copy infrastructure/production/web.env.example to the protected build environment as web.env.
2. Build/start infrastructure/production/web.compose.yml.
3. Install infrastructure/production/web.nginx.example with the real HTTPS domain/TLS configuration.
4. Keep backend ports loopback-only and never publish PostgreSQL.
5. Verify the Web container /health and each public API path over HTTPS.

The Web container contains only the compiled frontend and never connects to PostgreSQL.
