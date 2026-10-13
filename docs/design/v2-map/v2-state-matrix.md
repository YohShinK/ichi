# V2 Map State Matrix

Status: TASK-V2-16A Founder refinement.

| Client state | Map | Marker/card behavior | Recovery |
| --- | --- | --- | --- |
| `INITIAL_IDLE/LOADING` | primary surface | no selected card | automatic load |
| `LOADED` | current markers | pin opens one complete card | refresh/search/filter |
| `EMPTY` | empty map shell | no card | change query or refresh |
| `INITIAL_ERROR` | shell + error | no card | retry |
| `REFRESHING` | retained markers | selection stays only if valid | wait/retry |
| `PAGINATING/PAGINATION_ERROR` | retained markers | existing selection remains | retry pagination |
| `STALE_CACHE/RATE_LIMITED/SERVICE_UNAVAILABLE` | retained allowlisted cache when available | stale/relative-time disclosure | refresh later |
| `SCHEMA_UNSUPPORTED/UNAUTHORIZED` | safe unavailable state | no inferred/private fallback | retry after recovery |
| `CURSOR_RECOVERY` | retained root generation | TASK 14 invalidation rules | root reload |
| detail `LOADING/LOADED/ERROR/UNAVAILABLE` | selected pin | latest exact ID owns the single card | retry/close/select another |
| overlap fan-out | count display group | each child keeps distinct `publicLeadId` | choose child or close |

LIST, PREVIEW/EXPANDED presentation and report/owner browsing states are no longer user-visible product states. Dormant internal fields do not define the UI contract.
