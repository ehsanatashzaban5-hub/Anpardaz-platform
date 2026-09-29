# An Pardaz Admin Service

Independent browser-facing Admin Backend.

The Admin Frontend talks only to this service. It never connects to PostgreSQL and never receives domain-service internal tokens.

Responsibilities:
- authenticate and authorize admin requests through Platform identity/control-plane APIs;
- provide the single /api/v1/admin/* browser API boundary;
- proxy operations to the owning service APIs through the existing internal Platform control-plane adapter;
- preserve the authenticated identity token for downstream authorization;
- keep domain logic and domain databases in their owning services.

Independently deployable on port 4006.
