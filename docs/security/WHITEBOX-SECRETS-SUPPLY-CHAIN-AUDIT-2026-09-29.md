# White-box Secrets & Supply-Chain Security Audit — 2026-09-29

## Scope

Repository: `ehsanatashzaban5-hub/Anpardaz-platform`

Reviewed committed secrets and secret-handling patterns, environment files, Git-history indicators, dependency manifests/lockfiles, package lifecycle scripts, GitHub Actions permissions/install behavior, and obvious remote-script execution patterns.

## Results

### Committed secrets

No confirmed live credential, API key, private key, password, or bearer token was found in the current repository contents. The repository ignores local `.env` files and database-local environment files while retaining only `.env.example` templates. Reviewed examples contain placeholders/local-development values rather than production credentials.

### Git history

Commit-message searches for password, API key, private key, credentials, and secret-related changes found security-hardening/configuration commits, but no evidence that a live secret was committed was established from the accessible repository history/search surface. No secret value is reproduced here.

### Dependencies and install scripts

Service dependency manifests use explicit versions; browser application manifests contain semver ranges with committed pnpm lockfiles. No package lifecycle script such as `postinstall` or `preinstall`, and no obvious remote shell bootstrap such as `curl | sh` or `wget` execution, was found in the reviewed manifests/workflows.

### Confirmed supply-chain/reproducibility weakness and remediation

The main CI workflow previously installed mobile and web with `--no-frozen-lockfile` despite committed lockfiles. The An Sarraf integration workflow had the same issue for mobile/web. This allowed CI dependency resolution to change without a lockfile change.

The branch changes lockfile-backed installs to `pnpm install --frozen-lockfile --ignore-scripts`, and uses `--ignore-scripts` for components without committed lockfiles. This reduces dependency-resolution drift and prevents dependency lifecycle scripts from executing during CI installation.

### GitHub Actions trust boundary

Workflow permissions are read-only at workflow level except CodeQL's required `security-events: write`. No workflow was found to expose application secrets to pull-request code.

Workflows still use mutable action tags such as `actions/checkout@v4/v6`, `actions/setup-node@v4/v6`, `pnpm/action-setup@v4`, and `actions/upload-artifact@v4`. Immutable SHA pinning is a follow-up hardening item, not a confirmed compromise.

### Conclusion

No confirmed committed-secret exposure or malicious dependency was found. One concrete CI supply-chain/reproducibility weakness was fixed in this branch: lockfile-backed installs now require the committed lockfile and dependency lifecycle scripts are disabled during CI installation.

Follow-up hardening: pin third-party GitHub Actions to immutable commit SHAs and extend dependency-audit coverage to mobile/web lockfiles.
