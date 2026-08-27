# ICHI V1 Release Source Freeze

- Release: `ICHI V1 release candidate`
- Freeze date: `2026-08-28`
- Source branch: `release/v1-freeze-20260828`
- Parent HEAD: `f3bcbe2d0fc490f705e87b65ff64d39e1810bbf3`
- Freeze revision: the Git commit containing this manifest
- CloudBase environment: `cloud1-d7gxqfwv783a1f131`
- Backend: `19/19 action-specific production aligned`
- Backend runtime/status: `Nodejs20.19 / Deployment completed`
- Storage Closure: `PASS`
- Storage security rule: `CUSTOM`
- `profile-avatars/`: owner client read/write; excluded from lifecycle
- `recognition-temp/`: client no-read; owner write/delete
- Unknown Storage paths: client deny
- `recognition-temp/` lifecycle: `Expiration.Days=1`
- R2 mode: `r2_direct_remaining`
- H0 fallback: `hybrid_semantic`
- Frozen R2 Prompt SHA-256: `c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462`
- Frozen R2 Provider Schema SHA-256: `178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722`
- Frozen R2 Resolver SHA-256: `46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8`
- Client: `V1 release candidate; not uploaded, reviewed, or published`
- Manual acceptance: `PENDING`
- CloudBase deployment in this freeze task: `NOT_PERFORMED`
- WeChat upload/review/release in this freeze task: `NOT_PERFORMED`
- Push: `NOT_PERFORMED`
- Formal release tag: `NOT_CREATED`

## Source boundary

The freeze commit contains the V1 runtime and release source, maintained tests and build source, required fixtures and protocol assets, and current release documentation. It excludes post-V1 work, generated or diagnostic output, unrelated side projects, secrets, and low-confidence unreferenced historical files. Excluded files remain untouched in the working tree.

The pre-freeze external safety snapshot and the complete machine-readable dirty-path classification are intentionally stored outside the repository under `/tmp/ichi-v1-freeze-backup-20260828-hCHZ7F/`; they are recovery evidence, not release source.
