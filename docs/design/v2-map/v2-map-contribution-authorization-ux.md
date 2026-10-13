# V2 Map Contribution Authorization UX

Status: `TASK-V2-15 / IMPLEMENTED LOCALLY / NOT_PRODUCTION_EVIDENCE`

## Frozen product semantics

Map browsing and map contribution authorization are independent. The existing V1 **地图** navigation continues to open `apps/client/miniprogram/pages/home/index` with `currentView === "map-preview"`; it never opens or checks the contribution prompt. Authorization only controls whether the trusted service may evaluate a player's eligible records and safe public attribution for the map publication chain.

The UI consumes `VERSIONED_MAP_CONTRIBUTION_AUTHORIZATION`. It is not per-record consent. The current service-issued presentation binds:

- `authorizationVersion`;
- `scopeDigest`;
- temporal scope: eligible `HISTORY` and `FUTURE` records;
- record types: eligible `DRAW_RECORD` and `UPLOAD_RECORD`;
- public location and eligible venue note;
- safe PLAYER nickname/avatar attribution.

An accepted version applies only where the domain's per-record applicability, Rights and eligibility checks also pass. Authorization does not copy Rights through a BoardInstance and does not itself make a record public.

## Placement and information hierarchy

The active entry is a low-fi authorization status card at the top of the existing **我的 → 我上传的版面** page. This is the natural owner surface because the user already expects to inspect and manage uploaded records there. The card is visible but never opens automatically. No auth route or second map page exists.

The prompt explains, in order:

1. this is contribution authorization, not login;
2. map browsing remains available;
3. eligible historical and future records may enter the public candidate chain;
4. only safe nickname/avatar attribution is shown;
5. account/openid/private fileID remain private;
6. withdrawal and deletion remain available and are different operations;
7. map information is non-real-time and is not a recommendation or guarantee.

Missing Profile data never blocks the flow. The service presentation supplies the frozen fallback `ICHI 玩家` and the ICHI default avatar. Phone binding and Profile completion are absent from the authorization request and UI gate.

## State machine

`PublicMapAuthorizationClient` owns one explicit state machine:

`UNKNOWN → NOT_ACCEPTED → PROMPT_ELIGIBLE → PROMPT_OPEN → ACCEPTING → ACCEPTED_CURRENT`

Alternative prompt exits are `DECLINED` and `DISMISSED`. They do not accept the scope, do not affect V1 features, and do not block map browsing. The same client instance preserves them while the page stack remains alive, so returning to My Uploads does not force a prompt. An explicit tap on the status card is the recovery path.

A service-issued version or digest mismatch becomes `REAUTH_REQUIRED`. The current scope is shown as a change to an existing authorization, and old acceptance is not treated as permission for the expanded scope. The user must explicitly accept the new version/digest.

Owner actions add `WITHDRAWING`, `WITHDRAWN`, `DELETE_CONFIRMING`, `DELETING`, `DELETED`, and recoverable `ACTION_ERROR`. These are deliberately different from `DECLINED`.

## Data and action binding

The client acceptance request contains only:

- `authorizationVersion` copied from the service presentation;
- `scopeDigest` copied from the service presentation;
- a stable idempotency key for that exact version/digest.

It cannot submit `ownerAccountId`, `isOwner`, a trusted role, replacement scope contents, or server authorization status. The synthetic service keeps its trusted owner private. This is a local contract simulator classified `NOT_PRODUCTION_EVIDENCE`; production ownership remains TASK-V2-19/22.

Repeated accept taps are suppressed while `ACCEPTING`; the service also treats the idempotency key as the same logical acknowledgement. Unauthorized identity produces an explicit trusted-account recovery state, never an anonymous fallback. Service unavailability produces a stable retry state.

## V1 inheritance and later visual freedom

The implementation reuses the V1 page stack, light-capsule cards, modal layer, action/ghost/text buttons, busy disabling, toast feedback, warning confirmation and back behavior. No new visual system, native map, final marker style or layout redesign is introduced.

TASK-V2-16/Gemini may refine typography, spacing and the information presentation inside the existing host. It may not redesign the V1 map entry, navigation semantics, authorization scope, state transitions, trusted boundary, or map-browsing independence.

