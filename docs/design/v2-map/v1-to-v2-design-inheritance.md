# V1 → V2 Design Inheritance Matrix

> Status: `TASK-V2-14 / LOW-FI STRUCTURAL DECISION`
>
> Classification: `REUSE` means use the V1 pattern as-is; `ADAPT` means preserve the V1 language while changing structure for map semantics; `NEW_REQUIRED` means V1 has no adequate equivalent and TASK 14 may create only a neutral placeholder.

| V2 element | Class | V1 source | TASK 14 treatment | Constraint / later owner |
|---|---|---|---|---|
| Page header | ADAPT | `index.wxml/.wxss` `.flow-header`, `.subpage-header` | Compact title + refresh affordance inside existing map view | Final hierarchy belongs to TASK 16-C. |
| City/location selector shell | NEW_REQUIRED | Map-pin icon exists; no selector component | Static city shell, no permission or picker | Real location belongs to TASK 17. |
| Filter capsule | ADAPT | `.ghost-button`, `.light-capsule`, pill buttons | Horizontal, 34px low-fi opportunity filters | Final chip visuals deferred. |
| Primary button | REUSE | `.action-button` | Available for future primary action; not invented anew | V1 dimensions/disabled semantics remain. |
| Secondary button | REUSE | `.ghost-button` | Retry and load-more | Scoped width/height only. |
| Destructive button | REUSE | `.swipe-delete`, existing confirm modal | Not rendered in TASK 14 | Owner controls belong to TASK 15. |
| Card | REUSE | `.light-capsule` | Toolbar, row, status and detail surfaces | Do not create final map-card styling. |
| Bottom sheet shell | NEW_REQUIRED | No map sheet equivalent | Low-fi anchored detail shell | Gesture/visual completion belongs to TASK 16/17. |
| Marker placeholder | NEW_REQUIRED | `map-placeholder.svg` is only surface art | Synthetic pill markers | No final marker artwork. |
| Selected marker placeholder | NEW_REQUIRED | No V1 equivalent | Outline-only selected state | Final selected marker deferred. |
| Overlap indicator placeholder | NEW_REQUIRED | No V1 equivalent | `×N` text inside synthetic marker | Clustering/scale belongs to TASK 18. |
| Freshness badge | NEW_REQUIRED | No semantic V1 badge | Text value in list/detail | Final badge system deferred. |
| Opportunity badge | NEW_REQUIRED | No equivalent public opportunity semantic | Text/pill placeholder | Client never recomputes opportunity. |
| RecordType badge/label | ADAPT | Existing record-state labels/cards | Public `DRAW_RECORD`/`UPLOAD_RECORD` label | Uses serializer value only. |
| Contributor avatar/name | ADAPT | `.profile-avatar`, `.profile-copy`; default avatar asset | Detail text now; avatar pattern reserved | No private avatar `fileID`; no Profile gate. |
| Loading | ADAPT | recognizing/state-page loading patterns | First-load overlay; pagination line state | Refresh/paging preserve visible data. |
| Empty | REUSE/ADAPT | `.records-empty`, `.state-card` | Map-surface empty message + refresh | Never used for service errors. |
| Initial error | ADAPT | `.exception-card`, `.state-actions` | Blocking surface feedback + retry | Error code remains distinguishable in client state. |
| Pagination error | NEW_REQUIRED | No V1 retained-list paging failure | Inline retry below retained rows | Must not clear existing items. |
| Stale state | NEW_REQUIRED | No public map cache disclosure | Persistent banner + refresh | Separate from server Freshness. |
| Retry | REUSE | `.ghost-button`, existing retry handlers | Root, pagination and detail retry paths | Recovery action depends on stable error mapping. |
| Modal | REUSE | `.modal-layer`, `.modal-card` | Not needed for core TASK 14 states | Consent/destructive use belongs to TASK 15. |
| Toast | REUSE | `wx.showToast`, `.draw-toast` | Reserved for transient action feedback | Errors remain persistent, not toast-only. |
| Detail shell | NEW_REQUIRED | V1 modal/card are not map selection surfaces | Anchored low-fi selected-lead preview | Full information architecture belongs to TASK 16. |
| List row | ADAPT | `record-row`, `.record-row-card` | Public-only row with label/freshness/opportunity | No private/local record identity. |
| Map/list switch placeholder | NEW_REQUIRED | No V1 equivalent | Structural slot documented, not activated | Mode interaction belongs to TASK 16/17. |
| Refresh affordance | ADAPT | records refresher + refresh icon | Explicit 44px header button | Pull/region refresh coordination deferred to TASK 17. |
| Service unavailable | ADAPT | V1 exception pattern | Distinct state/banner + retry | Never treated as empty. |
| Rate limited | NEW_REQUIRED | No stable V1 rate-limited page state | Distinct state with retry-after semantics | Low-fi copy only. |
| Avatar fallback | REUSE | `ichi-avatar.png`, `DEFAULT_ACCOUNT_AVATAR` | Public fallback asset only | Signed URL expiry behavior belongs to TASK 18. |

## Reuse boundary

The existing `pages/home/index` host and its **地图** navigation are `REUSE`, not a new route classification. The V2 implementation is an internal replacement of the existing `map-preview` placeholder. No new `app.json` page, native TabBar item, hidden route, dev route, release redirect, or production navigation mutation is part of TASK 14.
