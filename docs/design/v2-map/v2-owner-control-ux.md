# V2 Map Owner-Control UX

Status: `TASK-V2-15 / IMPLEMENTED LOCALLY / NOT_PRODUCTION_EVIDENCE`

## Trusted owner boundary

Owner capability is returned by the injected trusted owner-control service. The client never infers ownership from nickname, avatar, `publicLeadId`, local `boardId`, or UI state. Its command contains only `publicLeadId`, `commandId`, and `WITHDRAW` or `DELETE`; trusted owner identity and authorization are service context.

This local adapter mirrors the approved TASK-V2-10 command semantics and is explicitly synthetic. It does not prove a production endpoint, deployment, persistence or CloudBase integration.

## Withdraw

Withdraw means “stop this contribution's public applicability.” It is not account deletion, local-board deletion, or hard deletion. While the command is pending the row is disabled. Once the service returns hide intent, the client immediately removes the public lead from marker/list/detail/cache and shows “公开可见性已停止”. A failed request keeps the capability and exposes retry with the same command ID.

The canonical domain determines whether a later authorization can make a withdrawn contribution applicable again. TASK 15 does not invent a restore command.

## Delete

Delete is a stronger map-publication lifecycle action and requires a separate second-confirmation modal. The copy states that the public item cannot be restored by old cache or late responses and that the V1 local board is not deleted. `DELETING` disables repeat submission. The idempotent service command returns hide intent plus `noResurrection: true`; only then does the client show final `DELETED`.

This action is not the existing V1 “删除本地版面” or cloud-record deletion handler. The implementations and event handlers remain separate.

## Hide-first and client continuity

Both successful commands call the existing TASK 14 map state engine through `PublicMapVisibilityPort.suppressPublicLead`:

- remove the marker/list item from current state;
- close the selected detail as unavailable;
- remove marker snapshots and detail from the public-only memory cache;
- filter the lead from later root and pagination responses;
- discard any in-flight detail response for the suppressed lead.

Delete additionally records a client-local tombstone in `deletedPublicLeadIds`. This is a stale-response guard, not server truth. The server remains responsible for durable hide/delete/no-resurrection.

Root query identity, pagination cursor, retained data and other selected-lead state remain under the single TASK 14 `PublicMapClient`; TASK 15 does not create a second map state architecture. Removing one lead does not reset the query or clear unrelated map data.

## Error and confirmation rules

- `SERVICE_UNAVAILABLE`: keep capability and retry the same idempotent command.
- `UNAUTHORIZED`: show trusted identity recovery; never fall back to anonymous ownership.
- `ACTION_NOT_ALLOWED`: show a stable non-retryable message.
- modal close/cancel: no command, no visibility change and no map reset.
- repeated withdraw/delete taps: ignored while a command is active.

Visual treatment reuses V1 modal, warning, buttons, toast and disabled/loading patterns. TASK-V2-16 may polish those components in the existing page, but cannot merge withdraw/delete or weaken confirmation/no-resurrection semantics.

