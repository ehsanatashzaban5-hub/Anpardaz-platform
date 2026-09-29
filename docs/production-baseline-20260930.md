# Production Baseline — 2026-09-30

Baseline main commit: 4cb0257003e6fe43e67774ab7b86581d6a3c8824
Backup branch: backup/production-baseline-20260930
Verification branch: production/final-verification-20260930

Mobile boundary:
- Mobile is not connected to Platform content.
- Comparison 97f7d71ec34bbff30d33c1fe6bdee49397fd9c9b...4cb0257003e6fe43e67774ab7b86581d6a3c8824 changes only Web production files.
- Mobile remains outside the Platform Web content boundary.

Web boundary:
- Platform content is Web-only at /api/v1/*.
- An Pardaz is namespaced at /anpardaz/api/v1/*.
- An Sarraf is namespaced at /ansarraf/api/v1/*.
- An Banner is namespaced at /banner/api/v1/*.
