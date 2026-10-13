# TASK-V2-09 Founder Review Packet

> Historical TASK-V2-09 approval snapshot. Any downstream `AWAITING_FOUNDER_FINAL_REVIEW` or V2-D locked state in this packet was superseded by the Founder's explicit 2026-09-13 V2-C approval and the V2-C→V2-D Knowledge Alignment Review.
>
> Review target: Query / Security / Resource / Migration Contract
>
> Status: `COMPLETE / HUMAN_APPROVED`
>
> Date: 2026-09-12

## Review outcome requested

Approve or adjust D09-01—13 in `docs/research/v2-c/v2-query-security-resource-migration-contract.md`. This review freezes the implementation contract only. It does not create resources or authorize TASK-V2-10.

## Recommended architecture at a glance

```text
private V2 facts
      ↓ TASK-V2-11 projector (future)
server-only materialized PublicMapLead core
      ↓ current visibility + bbox + allowlist
TASK-V2-13 service envelope (future)
      ↓ bounded marker/detail response
WeChat native <map>
```

- The materialized core contains only already-approved public fields.
- Freshness display and response metadata are generated reproducibly at request time.
- The database remains inaccessible to clients.
- Short-lived server snapshots make cursor paging deterministic without putting query facts into the cursor.
- Withdrawal/takedown is rechecked before every serialization, so paging cannot resurrect a removed lead.
- No shared server response cache is recommended for MVP.

## D09 decision checklist

| ID | Recommended decision | Founder result |
| --- | --- | --- |
| D09-01 | hybrid materialized public core + request-time envelope | `APPROVED` |
| D09-02 | Cloud Function query/detail + silent Account | `APPROVED` |
| D09-03 | public GCJ-02 geo index + exact bbox check | `APPROVED` |
| D09-04 | 120s server snapshot + opaque authenticated cursor | `APPROVED` |
| D09-05 | no server merge; distinct leads + bounded density metadata | `APPROVED` |
| D09-06 | server-only `publicMapLeads` and `publicMapQuerySnapshots` logical resources | `APPROVED` |
| D09-07 | pilot defaults: page 50, snapshot 500, TTL 120s | `APPROVED AS PILOT DEFAULT` |
| D09-08 | no shared response cache in MVP | `APPROVED` |
| D09-09 | account-bound rate limits + global cost stop | `APPROVED` |
| D09-10 | Public Location carrier frozen; numeric precision deferred | `APPROVED` |
| D09-11 | V2 incremental variable cost target ≤¥20/month | `APPROVED AS OPERATIONAL TARGET` |
| D09-12 | dry-run → synthetic → shadow → allowlisted pilot | `APPROVED` |
| D09-13 | rollback disables/hides/invalidates first; V1 unchanged | `APPROVED` |

## High-risk checks

| Risk | Contract control | Review result |
| --- | --- | --- |
| private collection exposed | no client DB access; service reads isolated projection | `PASS_FOR_REVIEW` |
| request-time private join leaks | materialize allowlisted public core | `PASS_FOR_REVIEW` |
| stale cursor resurrects takedown | visibility recheck before serialization | `PASS_FOR_REVIEW` |
| cursor enumerates IDs/query | random handle + MAC; facts live server-side | `PASS_FOR_REVIEW` |
| same-location records merged | server clustering cannot alter identity | `PASS_FOR_REVIEW` |
| public coordinate becomes more precise | service accepts only versioned Public Location projection | `PASS_FOR_REVIEW` |
| cost runaway | bounded limits, rate policy, global flag and ≤¥20 gate | `PASS_FOR_REVIEW` |
| migration bulk-publishes history | shadow and explicit allowlisted pilot; fail closed | `PASS_FOR_REVIEW` |
| rollback mutates V1 truth | V2 resources isolated; V1 retained | `PASS_FOR_REVIEW` |

## Resource diff review

Future candidates are two server-only collections, a geo index plus lookup/expiry indexes, query/detail functions and one fail-closed server flag. TASK-V2-09 created none of them. Existing `publicCollections=[]`, 13 `ADMINONLY` collections, Storage prefixes, deploy manifest and production configuration are unchanged.

## Evidence classification

- **Approved inherited fact**: all V2-B contracts and V2-A native-map/device evidence.
- **Official documentation fact**: CloudBase geo queries require a geo index; Cloud Function and database rules can restrict client access; resource-point database call pricing checked 2026-09-12.
- **Contract recommendation**: hybrid serving, snapshot cursor, pilot numeric defaults, rate policy, cache and migration design.
- **Not yet proven**: actual CloudBase index plan, latency, QPS, cursor storage behavior, measured bill, production permission read-back and rollback timing. These remain TASK-V2-18/19/21 evidence.

## Approval record

Founder accepted all recommendations through `TASK-V2-09_Accept_and_V2-C_Safe_Batch_Execution_Command.md` on 2026-09-12. D09-07 remains a pilot default and D09-11 remains an operational target; TASK-V2-18/21 must revalidate them without weakening correctness or security.

## Gate status

`TASK_V2_09 = COMPLETE / HUMAN_APPROVED`

`TASK_V2_10_TO_13 = IMPLEMENTATION_COMPLETE / AWAITING_FOUNDER_FINAL_REVIEW`

`V2_C_IMPLEMENTATION = STARTED / LOCAL_ONLY`

`V2_C = AWAITING_FOUNDER_FINAL_REVIEW`

`V2_IMPLEMENTATION_STARTED = YES`
