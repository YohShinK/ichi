# TASK-V2-19 Candidate Cloud Apply and Rehearsal

日期：2026-09-28  
环境：`cloud1-d7gxqfwv783a1f131 / ap-shanghai`  
结论：`APPLY_READBACK_PASS / REHEARSAL_BLOCKED_REAL_WX_CONTEXT_REQUIRED`

## Exact cloud actions

1. Created `v2ShadowCandidateUploads`, `v2ShadowContributionLedger`, and
   `v2ShadowMapContributionConsent`; ACL for each is `ADMINONLY`; all three counts are 0.
2. Created six explicit indexes:
   - CandidateUploads: `ownerSubjectDigest:1,dataOrigin:1`;
     `observationVersionId:1,ownerSubjectDigest:1,lifecycle:1,dataOrigin:1`.
   - ContributionLedger: `boardInstanceId:1,kind:1,dataOrigin:1`;
     `ownerSubjectDigest:1,kind:1,dataOrigin:1`.
   - MapContributionConsent: `ownerSubjectDigest:1,dataOrigin:1`;
     `acceptedTermsVersion:1,acceptedAt:-1`.
   All are normal, non-unique, non-TTL. Platform automatic `_id_`/`_openid_1` indexes are not counted as explicit actions.
3. Deployed/updated the seven functions in the v3 manifest with the following source SHA-256:

| Function | SHA-256 |
| --- | --- |
| `v2-shadow-submit-candidate-upload` | `f9424e56736eb49755e3062366982893b896776e8235d4ae580d393adcba50f8` |
| `v2-shadow-resolve-observation` | `75cb5f946f050c93c4fbd9fdba9492a936f301f7c308e8ba98557ed364c87229` |
| `v2-shadow-answer-assistance` | `1356ba91a2aeb4ec57cb9cd685c8102dac2feb4dc524b1c397eef8e03cb0eb3a` |
| `v2-shadow-get-my-assistance` | `4b635d9c2d16d7feb955097166f5c554ad4e3502d737ea58d5e9fd488bb30b22` |
| `v2-shadow-reconcile-projection` | `ef74a7671babd78c513ba1a4b24cc60554007e0f0dc3bffc87e9e1a6bd3ea098` |
| `v2-shadow-manage-contribution` | `e32b947155fc93b106c16475fbb0ae2f3e7ae80a0f9ee7aaace460b756e52a7c` |
| `v2-shadow-get-public-map-lead-detail` | `205f0244de750449cdba807f24013fe38eb2785484fa42e9c8b888cfc9dadab5` |

4. Generated/bound one new `ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY`; principal, rehearsal and
   cursor keys were reused by continuity. Secret values, digests and OpenIDs are not recorded.
5. Bound `synthetic_only`, candidate policy version/scope, all flags false and empty caller
   allowlists. No Storage, trigger, environment rule or V1 mutation.

## Read-back

All seven functions are `Active / Nodejs20.19 / index.main`, with dependency installation
enabled and zero triggers. Runtime downloads contain the expected index/runtime/package and
shared allowlisted source. Closed-state invocations load successfully and return fail-closed
responses. `PUBLIC=0`; `global:read-stop=true`; `global:ha-pause=true`; new consent/upload
collections remain empty. V1 structural read-back is `V1_DIFF=0`.

## Rehearsal gate

The final synthetic rehearsal was not claimed as complete. A CloudBase CLI/admin invocation
does not carry a real WeChat `getWXContext()`, and no real device session was available in this
execution to prove trusted caller consent, four HA answers, cross-account rejection, or public
query/detail through `wx.cloud.callFunction`. Local shadow tests cover the state machine, but
they cannot substitute for that remote identity boundary. No synthetic fixture was written in
this v3 apply; prior rehearsal evidence remains intact and was not cleaned up.

Stop state is safe: flags false, allowlist empty, public rows hidden, no cleanup/rollback, no
migration and no TASK-V2-20.

`TASK-V2-19 = IN_PROGRESS / CANDIDATE_REHEARSAL_BLOCKED`.
