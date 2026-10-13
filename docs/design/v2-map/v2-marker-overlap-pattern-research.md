# V2 Marker Overlap Pattern Research

Status: `WEB_MARKER_PATTERN_RESEARCH = COMPLETE`

This note records the public UI-pattern research used by TASK-V2-16A. It is a low-fidelity interaction recommendation, not a production clustering design and not authorization to start TASK 17/18.

| Pattern | Used by | When it works | Tradeoff | Fit for ICHI | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Count cluster, then zoom/expand | [Apple MapKit JS](https://developer.apple.com/documentation/mapkitjs/clustering-annotations?changes=_5), [Google Maps](https://developers.google.com/maps/documentation/javascript/marker-clustering), [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/example/cluster/), [MapLibre](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/) | Many nearby markers at lower zoom | A count hides individual records until expanded | Strong for dense discovery | Use as the default future production pattern |
| Spiderfy / fan-out | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) | Same-coordinate or still-overlapping markers at maximum useful zoom | Temporarily adds radial geometry | Strong because ICHI can have distinct public leads at one venue | Use after count-cluster expansion can no longer separate records |
| Collision priority / hide | [Google Maps](https://developers.google.com/maps/documentation/javascript/examples/marker-collision-management) | Preserving a selected or high-priority marker in crowded space | Hidden markers become undiscoverable without a secondary affordance | Useful only as a supporting rule | Give the selected pin visual/z-order priority; do not use hiding as the sole overlap solution |

## ICHI recommendation

Use a hybrid: count clusters at lower zoom; tapping a cluster zooms or expands its bounds; at maximum useful zoom, identical coordinates fan out/spiderfy into individually tappable pins. The selected pin receives visual and z-order priority.

TASK-V2-16A implements only a deterministic synthetic count marker plus tap fan-out. Every fan-out child remains keyed by its own opaque `publicLeadId`. Display grouping is never identity merging: detail, authorization, lifecycle and future moderation continue to address a single public lead.

Production geospatial clustering, native map integration and tuning remain TASK 17/18 work.
