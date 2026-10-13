# V2 Client Public Cache Contract

> Status: `TASK-V2-14 / IMPLEMENTED`
>
> Implementation: `apps/client/miniprogram/platform/public-map-cache.ts`

## Storage model

TASK 14 uses an in-memory cache scoped to the current mini-program runtime. Snapshot keys are deterministic canonical query identities. The default TTL is 120 seconds.

Allowed snapshot values:

- canonical `queryIdentity`;
- public marker/list projection;
- public safe detail projection;
- server `asOf` and `schemaVersion`;
- `servedVersion`, public policy/projection versions, and server Freshness already present in the public serializer;
- client cache timestamp;
- opaque `nextCursor` only before the cache TTL expires.

Forbidden values:

- Account/owner/private lineage/internal BoardInstance IDs;
- Verification, Rights, moderation evidence, private source evidence;
- raw ObservationLocation or accuracy data outside the public location projection;
- private avatar `fileID`, secrets, trusted server context, cursor secrets;
- any private/internal object joined by the client.

## Defensive copying

Writes and reads use explicit allowlist clone functions for `PublicMarker` and `PublicDetail`. Runtime extra properties are discarded. A recursive forbidden-key check rejects forbidden keys after cloning as a defense-in-depth assertion.

## Stale and cursor rules

When TTL expires, public items and server Freshness facts remain readable as a stale snapshot, but `nextCursor` becomes `null`. A stale cursor is never long-term truth. A new first-page request must obtain the next valid snapshot/cursor.

`freshness` describes a server-evaluated observation (`observedAt`, `freshnessAsOf`, band and policy). `stale` describes client response age. Neither is derived from nor overwrites the other.
