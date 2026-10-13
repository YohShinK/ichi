# V2 Map Interaction Map

Status: TASK-V2-16A Founder refinement; supersedes earlier map/list and preview/expanded assumptions.

TASK-V2-19 candidate runtime decision (2026-09-28): retain the single-map/single-card flow. Positive opportunity chips are temporarily unavailable in the candidate normal path because their current labels derive from local synthetic leadId metadata. The chip transition below remains historical 16-A prototype behavior and is not a candidate positive path until a public-authority contract is approved. No LIST switch, independent expanded detail or actionable report UI is added.

- Enter existing 地图 tab → keep current route → load TASK 14 public-map client → show map.
- Search/viewport/filter change → canonical query identity changes → selection clears → generation/cursor rules remain TASK 14-owned.
- Tap a single pin → select its exact `publicLeadId` → load/open one complete info card.
- Tap a count marker → open synthetic fan-out → tap one child pin → select only that child ID → open the same card.
- Close → clear selection only; query, filters, markers and retained data remain.
- Toggle a chip → selected outline changes to ICHI magenta and the existing query adapter refreshes results.
- Refresh/retry/cursor recovery/stale cache retain their existing TASK 14 meanings.
- Report icon → no action in 16-A. Owner controls remain only in “我的上传”.

There is no LIST transition, “查看完整”, expanded detail, report modal or map contribution-management flow in the browsing UI.
