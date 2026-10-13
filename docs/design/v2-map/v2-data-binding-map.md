# V2 Map Data Binding Map

Status: TASK-V2-16A Founder refinement.

TASK-V2-19 candidate runtime decision (2026-09-28): the synthetic primary tag and leadId-derived positive chips are disabled in the normal candidate path pending a public-authority field/rule decision. Search may only use already-public label text; synthetic search aliases are excluded. The historical synthetic rows below remain test evidence, not candidate runtime data.

| UI | Public/synthetic source | Rule |
| --- | --- | --- |
| pin | public position + `publicLeadId` | pointed visual; ID remains opaque |
| count cluster | synthetic coordinate grouping | display metadata, never identity merge |
| fan-out child | one grouped marker | keyed/selected by own `publicLeadId` |
| title | public detail IP/theme label | largest card text |
| total | public total remaining | `剩余 N 抽`; no private inference |
| primary tag | synthetic display adapter | deterministic priority; gap documented |
| player note | allowlisted `venueNote` | only when non-empty |
| tiers | public detail tiers | two columns; zero hidden; null `未知` |
| LAST cost | canonical public `fullPackCost` | `LAST 还需 ¥X`; never client-calculated |
| time | allowlisted observation/publication time | relative label |
| report icon | no source/action | nonfunctional 16-A placeholder |

The browsing card binds no rights, owner, contributor, internal provenance or moderation facts. TASK 15 control remains in its existing owner surface.
