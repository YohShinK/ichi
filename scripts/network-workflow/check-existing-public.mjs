import "./source-loader.mjs";
import fs from "node:fs";
import { check, json, digest, atomic } from "./store.mjs";

const config = json(process.argv[2]),
  outputFile = process.argv[3];
const output = process.stdout.write.bind(process.stdout);
for (const key of ["log", "warn", "info", "error", "debug"])
  console[key] = () => {};
process.stdout.write = () => true;
process.stderr.write = () => true;
const report = {
  at: new Date().toISOString(),
  status: "IN_PROGRESS",
  kind: "REAL_TRUSTED_WECHAT_SDK_QUERY_AND_DETAIL",
  physicalPhone: false,
  businessDataWrites: 0,
  operationalPublicReadCountersExpected: true,
  details: [],
};
let reader;
try {
  check(
    !fs.existsSync(outputFile),
    "READBACK_ALREADY_ATTEMPTED_USE_NEW_OUTPUT",
  );
  const originalFile =
    "artifacts/task22/phase4/collection50-20261008/batches/final-human-four/public-after.json";
  const original = json(originalFile),
    catalog = json(
      "artifacts/task22/phase4/collection50-20261008/completed-50-boards.json",
    );
  report.originalReadbackSha256 = digest(fs.readFileSync(originalFile));
  check(
    report.originalReadbackSha256 === catalog.publicReadSha256 &&
      original.details.length === 52 &&
      catalog.count === 50,
    "ORIGINAL_PUBLIC_EVIDENCE_DRIFT",
  );
  const { createCloudBaseAdapter } = await import("./cloudbase.mjs");
  const adapter = await createCloudBaseAdapter(config),
    before = await adapter.snapshot();
  await adapter.assertSafe(before.digest);
  report.inventoryBefore = await adapter.readInventory();
  const { createReader } = await import("./wechat-public-reader.mjs");
  reader = await createReader(config);
  report.query = await reader.query({
    west: 121.25,
    east: 121.65,
    south: 31.05,
    north: 31.4,
  });
  const visibleIds = report.query.items.map((item) => item.publicLeadId);
  const expectedIds = catalog.records.map((item) => item.publicLeadId);
  check(
    digest([...visibleIds].sort()) === digest([...expectedIds].sort()) &&
      new Set(visibleIds).size === 50,
    "ORIGINAL_50_QUERY_ID_DRIFT",
  );
  const forbidden =
    /"(?:accuracyMeters|venueReference|providerUrl|evidenceRef|sourceId|sourceUrl|boardEvidenceKey|curatorAuthorityId|takedownOwnerId|ownerAccountId|privateLineageId|sourceVersion|contentDigest|rights|openid|_openid)"\s*:/u;
  check(
    !forbidden.test(JSON.stringify(report.query)),
    "QUERY_PRIVATE_FIELD_LEAK",
  );
  for (const entry of original.details) {
    const prior = entry.result.item,
      actual = await reader.detail(prior.publicLeadId);
    for (const field of [
      "publicLeadId",
      "servedVersion",
      "projectionVersion",
      "policyVersion",
      "board",
      "recordType",
      "contributor",
      "contributors",
      "publicLocation",
      "venueNote",
      "sourceIcon",
      "sourceLabel",
      "publicUntil",
      "uploadedAt",
      "networkPolicyVersion",
      "disclosures",
    ])
      check(
        digest(actual[field] ?? null) === digest(prior[field] ?? null),
        `ORIGINAL_PUBLIC_${field.toUpperCase()}_DRIFT`,
      );
    check(
      actual.freshness.observedAt === prior.freshness.observedAt,
      "ORIGINAL_OBSERVATION_CLOCK_DRIFT",
    );
    check(
      digest(actual.opportunity) === digest(prior.opportunity),
      "ORIGINAL_OPPORTUNITY_DRIFT",
    );
    check(!forbidden.test(JSON.stringify(actual)), "DETAIL_PRIVATE_FIELD_LEAK");
    if (actual.sourceIcon === "OFFICIAL_NETWORK") {
      const total = actual.board.tiers.reduce(
        (sum, tier) => sum + tier.remainingTickets,
        0,
      );
      const grand = actual.board.tiers
        .filter((tier) => tier.isGrandPrize)
        .reduce((sum, tier) => sum + tier.remainingTickets, 0);
      check(
        actual.board.totalRemaining === total &&
          actual.board.grandPrizeRemaining === grand &&
          actual.board.fullPackCostMinor ===
            (actual.board.pricePerDrawMinor === null
              ? null
              : total * actual.board.pricePerDrawMinor),
        "DERIVED_BOARD_FACT_DRIFT",
      );
      check(
        Date.parse(actual.publicUntil) -
          Date.parse(actual.freshness.observedAt) ===
          2592000000,
        "ORIGINAL_30_DAY_DEADLINE_DRIFT",
      );
    }
    report.details.push({
      publicLeadId: prior.publicLeadId,
      status: "PASS",
      item: actual,
    });
  }
  report.inventoryAfter = await adapter.readInventory();
  const sortHeads = (items) =>
    [...items].sort((a, b) => a.publicLeadId.localeCompare(b.publicLeadId));
  check(
    report.inventoryAfter.networkCount === 50 &&
      digest(sortHeads(report.inventoryBefore.publicHeads)) ===
        digest(sortHeads(report.inventoryAfter.publicHeads)),
    "PUBLIC_HEAD_OR_COUNT_DRIFT",
  );
  await adapter.closeAndVerify();
  report.status = "ALL_50_NETWORK_AND_2_PLAYER_REAL_PUBLIC_READ_PASS_SAFE_STOP";
  report.networkDetails = report.details.filter(
    (item) => item.item.sourceIcon === "OFFICIAL_NETWORK",
  ).length;
  report.playerDetails = report.details.length - report.networkDetails;
  check(
    report.networkDetails === 50 && report.playerDetails === 2,
    "PUBLIC_DETAIL_COUNTS_DRIFT",
  );
  report.privateFieldsFound = 0;
  report.finishedAt = new Date().toISOString();
  atomic(outputFile, report);
  output(
    JSON.stringify({
      status: report.status,
      network: 50,
      player: 2,
      privateFieldsFound: 0,
      businessDataWrites: 0,
    }) + "\n",
  );
} catch (error) {
  report.status = "PUBLIC_READBACK_STOPPED";
  report.errorCode = /^[A-Z0-9_:-]+$/u.test(error.code ?? "")
    ? error.code
    : "PUBLIC_READBACK_FAILED";
  if (!fs.existsSync(outputFile)) atomic(outputFile, report);
  output(
    JSON.stringify({
      status: report.status,
      code: report.errorCode,
      completed: report.details.length,
    }) + "\n",
  );
  process.exitCode = 1;
} finally {
  if (reader) await reader.close();
}
