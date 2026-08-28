import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";

const ROOT = process.cwd();
const outputDir = path.resolve(
  process.argv[2] || "artifacts/evidence-primitive-experiment/2026-08-26",
);
const require = createRequire(
  path.join(ROOT, "services/cloudbase/functions/recognize-board/package.json"),
);
const h0 = require(
  path.join(ROOT, "experiments/hybrid-semantic/hybrid-semantic-experiment.js"),
);
const h1 = require(
  path.join(
    ROOT,
    "experiments/evidence-primitive/evidence-primitive-experiment.js",
  ),
);
const results = JSON.parse(
  fs.readFileSync(path.join(outputDir, "h0-h1-results.json"), "utf8"),
);

const averageMs = (iterations, callback) => {
  const startedAt = performance.now();
  for (let index = 0; index < iterations; index += 1) callback();
  return (performance.now() - startedAt) / iterations;
};
const timings = results.boards.map((board) => ({
  caseId: board.caseId,
  h0: {
    ajvAverageMs: averageMs(1000, () =>
      h0.validateProvider(board.h0[0].parsedProvider),
    ),
    resolverNormalizeAverageMs: averageMs(100, () =>
      h0.normalizeHybridProvider(board.h0[0].parsedProvider, {
        requestId: "timing-h0",
        width: board.groundTruth.width,
        height: board.groundTruth.height,
      }),
    ),
  },
  h1: {
    ajvAverageMs: averageMs(1000, () =>
      h1.validateProvider(board.h1[0].parsedProvider),
    ),
    resolverNormalizeAverageMs: averageMs(100, () =>
      h1.normalizeEvidenceProvider(board.h1[0].parsedProvider, {
        requestId: "timing-h1",
        width: board.groundTruth.width,
        height: board.groundTruth.height,
      }),
    ),
  },
}));
const output = {
  methodology:
    "Local replay of saved Provider JSON; AJV 1000 iterations and resolver+normalize+RecognitionContract 100 iterations per board. No Provider calls.",
  timings,
  average: Object.fromEntries(
    ["h0", "h1"].map((kind) => [
      kind,
      {
        ajvMs:
          timings.reduce((sum, item) => sum + item[kind].ajvAverageMs, 0) /
          timings.length,
        resolverNormalizeMs:
          timings.reduce(
            (sum, item) => sum + item[kind].resolverNormalizeAverageMs,
            0,
          ) / timings.length,
      },
    ]),
  ),
};
fs.writeFileSync(
  path.join(outputDir, "processing-timings.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify(output, null, 2));
