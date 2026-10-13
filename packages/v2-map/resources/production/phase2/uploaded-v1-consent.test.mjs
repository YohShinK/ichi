import { it, expect } from "vitest";
import { setup, NOW } from "./fixtures.test-support.mjs";
import { createMain } from "../functions/manage-map-contribution-consent/runtime.mjs";
import { signedRequest } from "./security.mjs";
import { hash } from "../shared/security.mjs";

const prepared = () => {
  const s = setup();
  Object.assign(s.policy.terms, {
    uploadSharingScope: "UPLOADED_V1_RECORDS",
    rightsAttestationIncluded: true,
  });
  const accept = createMain({ cloud: s.cloud, env: s.env, now: () => NOW });
  return {
    ...s,
    consent: accept,
  };
};
const acceptCurrent = (s) =>
  s.consent({
    command: "ACCEPT",
    termsVersion: s.policy.terms.version,
    scopeDigest: s.policy.terms.scopeDigest,
    actionId: "uploaded-v1-confirm-1",
  });

it("current explicit account terms admit a prior completed upload without a per-record field or device queue", async () => {
  const s = prepared(),
    id = s.record();
  expect((await acceptCurrent(s)).ok).toBe(true);
  const e = await s.enqueue(id);
  expect(await s.process(e.eventId)).toMatchObject({
    ok: true,
    admitted: true,
    status: "APPLIED",
  });
  expect(
    s.table("observationCandidates").get(id).uploadSharingAuthorization,
  ).toBeUndefined();
  expect(
    [...s.table("mapPlayerSourcePermissions").values()][0].authorizationBasis,
  ).toBe("UPLOADED_V1_AND_EXPLICIT_ACCOUNT_CONSENT");
  expect(s.heads().filter((x) => x.lifecycleState === "PUBLIC")).toHaveLength(
    1,
  );
});

it("legacy acceptance is not silently upgraded to the new all-uploaded scope", async () => {
  const s = prepared(),
    id = s.record();
  expect(await s.consent({ command: "GET" })).toMatchObject({
    ok: true,
    accepted: false,
  });
  expect(await s.process((await s.enqueue(id)).eventId)).toMatchObject({
    admitted: false,
  });
  expect(s.table("boardObservations").size).toBe(0);
});

it("account consent scans three completed uploads without legacy fields and skips private and pending records", async () => {
  const s = prepared();
  const ids = ["1", "2", "3"].map((n) => s.record(n));
  const privateId = s.record("4");
  s.table("observationCandidates").get(privateId).status = "private_saved";
  const pending = s.record("5", { draw: true });
  s
    .table("drawSubmissions")
    .get([...s.table("drawSubmissions").keys()][0]).status = "PENDING";
  expect((await acceptCurrent(s)).ok).toBe(true);
  const wake = [...s.table("mapSourceOutbox").values()].find(
    (r) => r.kind === "CONSENT_EVENT",
  );
  for (let i = 0; i < 3; i++) {
    s.setTime(NOW + i * 2000);
    expect(
      (
        await s.worker(
          signedRequest(
            s.env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
            "PROCESS",
            wake.eventId,
            NOW + i * 2000,
          ),
        )
      ).ok,
    ).toBe(true);
  }
  const jobs = [...s.table("mapSourceOutbox").values()].filter(
    (r) => r.kind === "SOURCE_EVENT",
  );
  expect(jobs.map((r) => r.recordId).sort()).toEqual(ids.sort());
  expect(jobs.some((r) => [privateId, pending].includes(r.recordId))).toBe(
    false,
  );
});

it("scope confirmation never authorizes another account or resurrects a deleted upload", async () => {
  const s = prepared();
  await acceptCurrent(s);
  const other = s.record("2", { owner: "b" }),
    deleted = s.record("3");
  s.table("deletionJobs").set(`record:${deleted}`, { status: "queued" });
  for (const id of [other, deleted])
    expect(await s.process((await s.enqueue(id)).eventId)).toMatchObject({
      admitted: false,
    });
  expect(s.table("boardObservations").size).toBe(0);
});

it("the new explicit all-uploaded acceptance replaces an obsolete per-record choice", async () => {
  const s = prepared(),
    id = s.record();
  s.table("mapPlayerSourcePermissions").set(hash("player-source-phase2", id), {
    recordId: id,
    ownerAccountId: "account_a",
    shareIntent: "DO_NOT_SHARE",
  });
  await acceptCurrent(s);
  expect(await s.process((await s.enqueue(id)).eventId)).toMatchObject({
    admitted: true,
  });
});
