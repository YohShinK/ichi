# ICHI V1 Release Source Freeze

> Final publication closure：微信小程序 ICHI V1.0.0 已于 2026-08-30 审核通过并正式上线。以下冻结边界继续有效；线上产品源码以 `ONLINE_SOURCE_COMMIT` 为唯一准绳，后续 docs／tests／CI-only commit、merge commit 与 release metadata 均不改变该值。

- Version: `1.0.0`
- Release: `ICHI V1.0.0`
- WeChat publication: `PUBLISHED`
- Publication date: `2026-08-30`
- ONLINE_SOURCE_COMMIT: `03942f2067959a4b8b0eb6223c949e51e768587d`
- Required formal tag: `v1.0.0` must point directly to `03942f2067959a4b8b0eb6223c949e51e768587d`
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
- Client: `V1.0.0 published WeChat Mini Program`
- Manual acceptance: `PASS / CLOSED`
- CloudBase deployment in this freeze task: `NOT_PERFORMED`
- WeChat upload/review/release in this freeze task: `NOT_PERFORMED`
- Push: `NOT_PERFORMED`
- Formal release tag target: `v1.0.0 → 03942f2067959a4b8b0eb6223c949e51e768587d`

## Source boundary

The freeze commit contains the V1 runtime and release source, maintained tests and build source, required fixtures and protocol assets, and current release documentation. It excludes post-V1 work, generated or diagnostic output, unrelated side projects, secrets, and low-confidence unreferenced historical files. Excluded files remain untouched in the working tree.

The pre-freeze external safety snapshot and the complete machine-readable dirty-path classification are intentionally stored outside the repository under `/tmp/ichi-v1-freeze-backup-20260828-hCHZ7F/`; they are recovery evidence, not release source.
