# V2 Shadow Candidate Functions

These six directories are the local B2-R1 replacement candidate sources for
`cloud1-d7gxqfwv783a1f131`. The remote six functions still run the earlier
B1 read-only skeletons. These replacements have not been deployed and are
not included in the V1 deploy manifest.

Every entry point is Node.js 20.19 compatible, uses only literal
`v2Shadow...` collection names, and fails closed unless the function-specific
feature flag, synthetic boundary, caller allowlist, and required secret state
are present. No entry point calls another function or accesses Cloud Storage.

`scripts/build-v2-shadow-artifacts.mjs` deterministically compiles the approved
reference implementation and produces six local zip files. The current hashes
are recorded in `cloudbase-shadow-function-artifacts-b2-r1.json`. The original
`cloudbase-shadow-function-artifacts.json` is a historical Phase A hash ledger,
not the hash list for B2-R1 deployment. Generation does not deploy or write to
CloudBase. R2 requires separate Founder approval and exact SHA-256 matching.
