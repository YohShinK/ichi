import { PublicMapService } from "../../../src/public-api.js";
import { readDoc } from "../shared/db.mjs";
import {
  currentPublicRow,
  preparePublicRead,
  publicCore,
} from "../shared/public-read.mjs";

const fail = (code) => ({ ok: false, code });
const freshnessPolicy = {
  policyVersion: "v2-19-synthetic-freshness",
  recentMaxAgeMs: 3_600_000,
  agingMaxAgeMs: 86_400_000,
};

const createUnsafeMain =
  ({ cloud, env, now = Date.now }) =>
  async (event = {}) => {
    const prepared = await preparePublicRead({
      cloud,
      env,
      kind: "detail",
      nowMs: now(),
    });
    if (!prepared.ok) return prepared;
    if (
      typeof event.publicLeadId !== "string" ||
      !/^[a-f0-9]{32}$/u.test(event.publicLeadId)
    )
      return fail("LEAD_UNAVAILABLE");
    const { db, callerDigest, epoch } = prepared;
    const row = await currentPublicRow(db, event.publicLeadId);
    const core = publicCore(row, prepared.opportunityPolicyVersion);
    const service = new PublicMapService(
      {
        listVisibleWithin: () => [],
        getVersion: () => null,
        getCurrent: (id) => (id === event.publicLeadId ? core : null),
      },
      { save: () => {}, get: () => null, invalidate: () => {} },
      freshnessPolicy,
      {
        account: { currentAccount: () => ({ accountId: callerDigest }) },
        readControl: { readState: () => "ENABLED" },
        rateLimit: { consume: () => "ALLOWED" },
        cursorSecret: {
          currentSecret: () => env.ICHI_V2_SHADOW_CURSOR_HMAC_KEY,
        },
      },
      undefined,
      now,
    );
    const response = service.detail(event);
    if (!response.ok) return response;
    const [stop, after] = await Promise.all([
      readDoc(db.collection("v2ShadowControlState"), "global:read-stop"),
      readDoc(db.collection("v2ShadowControlState"), "global:read-epoch"),
    ]);
    if (stop?.stopped !== false || after?.epoch !== epoch)
      return fail("SERVICE_UNAVAILABLE");
    return response;
  };

export const createMain =
  (dependencies) =>
  async (event = {}) => {
    try {
      return await createUnsafeMain(dependencies)(event);
    } catch {
      return fail("SERVICE_UNAVAILABLE");
    }
  };
