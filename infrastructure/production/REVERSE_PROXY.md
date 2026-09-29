# Production public API routing

The mobile web bundle uses stable same-origin prefixes. The reverse proxy must route them to the internal services so moving services between hosts does not require a frontend rebuild.

- `/` -> mobile frontend at `127.0.0.1:5175`
- `/api/v1/*` -> An Pardaz at `127.0.0.1:4001`
- `/platform/api/v1/*` -> Platform at `127.0.0.1:4003`, stripping `/platform`
- `/ansarraf/api/v1/*` -> An Sarraf at `127.0.0.1:4002`, stripping `/ansarraf`
- `/banner/api/v1/*` -> Banner at `127.0.0.1:4005`, stripping `/banner`

Do not expose PostgreSQL ports publicly.

For production, `TRUST_PROXY=true`, `IP_POLICY_ALLOW_PRIVATE_NETWORKS=false`, and a real `IP_GEOLOCATION_URL_TEMPLATE` are required. `CORS_ORIGIN` must contain the actual HTTPS origin serving the app. Identity keys and internal tokens belong in the runtime secret store, not Git.
