# V2 Single Marker Info Card — Founder Baseline

Status: `TASK-V2-16A / FOUNDER_UI_REFINEMENT`

Marker tap opens one complete public information card directly. There is no preview-to-expanded step and no “查看完整/公开详情” action.

Information order:

1. IP/theme title (largest text)
2. total remaining (`剩余 N 抽`)
3. one deterministic synthetic primary discovery tag
4. relative observed/published time
5. optional player venue note
6. two-column tier grid
7. canonical full-pack cost when present (`LAST 还需 ¥X`)
8. public-data disclaimer and an icon-only, nonfunctional report placeholder

Tier rules: numeric zero is hidden; `null` is displayed as `未知`; no inference converts unknown to zero. The card contains no owner-control or map-contribution-management CTA. Those actions remain in the existing “我的上传” owner surface.

Primary-tag priority is currently a synthetic UI adapter decision. `PRIMARY_DISCOVERY_TAG_PRIORITY_GAP` remains open until the public contract supplies an approved ordering or canonical primary tag.
