# V2 Map UI Structure Blueprint

Status: TASK-V2-16A Founder refinement. This supersedes earlier map/list and preview/expanded UI assumptions.

The existing V1 `pages/home/index` route and `currentView === "map-preview"` remain the sole host.

```text
map-preview
├── existing top safe area
├── header: V1 round-glasses mascot + ICHI wordmark + 44px search
├── horizontal 28px filters: LAST 机会 / 大厂存量足 / 大赏占比高
└── remaining-height map stage
    ├── synthetic map surface
    ├── pointed pins / count cluster / overlap fan-out
    ├── locate and refresh controls
    ├── retained-data/status banner
    └── one complete selected-lead info card
```

There is no user-visible LIST mode, map/list toggle, preview-to-expanded transition, report modal, owner action or map-contribution-management CTA. TASK 14 state/cache/race behavior and TASK 15 owner behavior in “我的上传” remain unchanged.
