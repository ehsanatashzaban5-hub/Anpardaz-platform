# Admin Stage 6 — production credential and transport hardening

Date: 2026-09-29

## Completed
- Production Admin Backend now requires URLs and internal credentials for Platform, An Sarraf, An Pardaz, Banner and Accounting.
- Production internal service tokens must be at least 32 characters and may not contain CHANGE_ME placeholders.
- Production service URLs are validated as HTTP(S) URLs at process startup.
- Owning-service Admin Backend proxy requests disable HTTP redirects, preventing an authenticated server-side request from being transparently redirected to an unintended destination.
- Existing capability authorization, server-side service credentials, Iran-IP enforcement and no-PostgreSQL Admin Backend boundary remain unchanged.

## Why
A production Admin Backend must fail closed when an owning service credential is absent. Previously, some adapter credentials were only discovered when a request was made. Startup validation makes a partial/misconfigured production deployment fail immediately instead of exposing an apparently healthy but incomplete control plane.

## Verification scope
Static inspection of the Admin Backend, adapters and Admin Frontend boundary was completed. This stage does not claim CI success unless GitHub reports a workflow result.
