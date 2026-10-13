import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fixtureUrl = new URL(
  "../../docs/research/v2-a/verified-board-opportunity-scenarios.json",
  import.meta.url,
);
const fixtureText = readFileSync(fixtureUrl, "utf8");
const fixture = JSON.parse(fixtureText);
const levels = new Set(["HIGH", "MEDIUM", "LOW", "INSUFFICIENT"]);
const forbiddenCopy = ["建议去", "建议抽", "建议包套", "容易中奖", "价格极低"];

if (fixture.scenarios.length < 8)
  throw new Error("at least 8 scenarios required");
if (!fixture.disclosure.includes("不是实时库存"))
  throw new Error("realtime disclosure missing");
if (!fixture.disclosure.includes("消费建议"))
  throw new Error("recommendation disclosure missing");

for (const scenario of fixture.scenarios) {
  if (!levels.has(scenario.opportunityLevel))
    throw new Error(`invalid level: ${scenario.id}`);
  if (
    !Array.isArray(scenario.reasonCodes) ||
    scenario.reasonCodes.length === 0
  ) {
    throw new Error(`reason trace missing: ${scenario.id}`);
  }
  if (
    scenario.grandRemaining === null &&
    scenario.opportunityLevel !== "INSUFFICIENT"
  ) {
    throw new Error(`null grand semantics violated: ${scenario.id}`);
  }
  if (
    scenario.totalRemaining === 0 &&
    !scenario.reasonCodes.includes("TOTAL_REMAINING_ZERO")
  ) {
    throw new Error(`confirmed zero semantics violated: ${scenario.id}`);
  }
  const serialized = JSON.stringify(scenario);
  for (const phrase of forbiddenCopy) {
    if (serialized.includes(phrase))
      throw new Error(`prohibited copy '${phrase}': ${scenario.id}`);
  }
}

const shanghai = { minLat: 30.95, maxLat: 31.45, minLng: 121.1, maxLng: 121.9 };
const viewport = {
  minLat: 31.15,
  maxLat: 31.3,
  minLng: 121.35,
  maxLng: 121.62,
};
const pageLimit = 50;

function seededPoint(index, count) {
  const x = (Math.imul(index + count, 2654435761) >>> 0) / 4294967295;
  const y = (Math.imul(index + count * 3, 2246822519) >>> 0) / 4294967295;
  return {
    id: `synthetic-${count}-${index}`,
    lat: Number(
      (shanghai.minLat + y * (shanghai.maxLat - shanghai.minLat)).toFixed(6),
    ),
    lng: Number(
      (shanghai.minLng + x * (shanghai.maxLng - shanghai.minLng)).toFixed(6),
    ),
    level: ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT"][index % 4],
  };
}

function benchmarkCount(count) {
  const points = Array.from({ length: count }, (_, index) =>
    seededPoint(index + 1, count),
  );
  const bounded = points.filter(
    (point) =>
      point.lat >= viewport.minLat &&
      point.lat <= viewport.maxLat &&
      point.lng >= viewport.minLng &&
      point.lng <= viewport.maxLng,
  );
  const page = bounded.slice(0, pageLimit);
  return {
    generated: count,
    viewportMatches: bounded.length,
    returned: page.length,
    truncated: bounded.length > pageLimit,
    pagesAtLimit: Math.ceil(bounded.length / pageLimit),
    responseBytes: Buffer.byteLength(
      JSON.stringify({ asOf: fixture.asOf, points: page }),
    ),
  };
}

const benchmark = [30, 1000, 10000].map(benchmarkCount);
for (const row of benchmark) {
  if (row.returned > pageLimit)
    throw new Error("bounded result limit violated");
}

process.stdout.write(
  `${JSON.stringify(
    {
      status: "PASS",
      fixtureSha256: createHash("sha256").update(fixtureText).digest("hex"),
      scenarioCount: fixture.scenarios.length,
      levels: [...levels],
      pageLimit,
      benchmark,
      fixturePath: fileURLToPath(fixtureUrl),
    },
    null,
    2,
  )}\n`,
);
