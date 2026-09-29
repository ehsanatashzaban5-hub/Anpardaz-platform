# White-box upload/path traversal/SSRF audit — 2026-09-29

Scope: security item 6 — file uploads, image decoding, filenames, path traversal, server-side URL fetching and SSRF.

## An Banner uploads
- Listing and chat media accept only JPEG, PNG and WebP.
- Raw payloads are limited to 8 MiB before image processing.
- Sharp performs actual image decoding and normalization; dimensions and pixel/input-channel limits are enforced.
- Normalized output is also size-limited.
- Database constraints independently enforce allowed MIME types, non-empty data and the 8 MiB maximum.
- Listing media is owned by the authenticated identity on delete and the listing ownership is checked before upload.
- Chat media is restricted to image messages and allowed image MIME types.
- User filenames are sanitized by replacing backslash, slash, CR, LF and NUL before persistence; downloads use Content-Disposition inline without using the filename as a filesystem path.

## Avatar handling
- Avatar uploads use the same MIME allowlist, size limit and Sharp normalization path.
- Avatar data is stored as binary data in PostgreSQL rather than written to a user-controlled filesystem path.
- The profile avatar URL is generated as a data URL from stored binary data.

## An Hoosh media
- Generated media is stored in PostgreSQL as binary data; no user-controlled local filesystem path is used.
- Generated filenames are server-generated.
- The content endpoint sets Content-Type from server-generated/provider-controlled metadata and uses an inline disposition.
- Gemini video retrieval follows a URI returned by the configured Gemini provider after the long-running operation completes. The URI is not supplied by the end user.

## Path traversal
Reviewed user-controlled filename/path handling and filesystem APIs in the relevant media paths. No user-controlled filesystem path construction or path traversal sink was identified.

## SSRF
- Provider URLs in the reviewed media implementation are fixed Gemini API endpoints or provider-returned media URIs; they are not accepted from the end user.
- Platform admin gateway upstream base URLs are environment configuration, not request parameters.
- User-provided profile avatarUrl is persisted as application data and is not fetched server-side by the reviewed backend, so it is not a backend SSRF sink.
- No confirmed user-controlled URL-to-server-fetch SSRF path was identified in the reviewed source snapshot.

## Findings
No confirmed exploitable unrestricted file upload, path traversal, or SSRF vulnerability was identified.
No application behavior patch was required for this item.

## Residual limitations
This is a white-box source review. Runtime testing with malicious image corpus, decompression-bomb samples, oversized payloads, malformed MIME/content combinations, and isolated network egress controls remains appropriate for the later fuzzing/runtime stage.

## Status
Item 6 — upload/path traversal/SSRF audit — complete.