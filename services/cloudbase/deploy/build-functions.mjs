import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const deployDir = path.dirname(fileURLToPath(import.meta.url));
const cloudbaseDir = path.resolve(deployDir, "..");
const outputRoot = path.join(cloudbaseDir, ".deploy", "functions");
const manifest = JSON.parse(
  await readFile(path.join(deployDir, "manifest.json"), "utf8"),
);
const dependencyLayer = manifest.dependencyLayer;
if (!dependencyLayer?.name || !Number.isInteger(dependencyLayer.version))
  throw new Error("CloudBase dependency layer is not declared");

const packageFor = (name) => ({
  name: `@ichi/cloud-function-${name}`,
  version: "0.0.0",
  private: true,
  main: "index.js",
  engines: { node: ">=20.19.0 <21" },
  dependencies: {},
  cloudbaseDependencyLayer: dependencyLayer,
});

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const name of manifest.functions) {
  const destination = path.join(outputRoot, name);
  await mkdir(destination, { recursive: true });
  await cp(
    path.join(cloudbaseDir, "shared"),
    path.join(destination, "shared"),
    { recursive: true, filter: (source) => !source.endsWith(".test.ts") },
  );
  await writeFile(
    path.join(destination, "index.js"),
    `"use strict";\nconst { createHandler } = require("./shared/runtime");\nexports.main = createHandler(${JSON.stringify(name)});\n`,
  );
  await writeFile(
    path.join(destination, "package.json"),
    `${JSON.stringify(packageFor(name), null, 2)}\n`,
  );
  const openapi = manifest.openApiPermissions?.[name];
  if (Array.isArray(openapi) && openapi.length > 0)
    await writeFile(
      path.join(destination, "config.json"),
      `${JSON.stringify({ permissions: { openapi } }, null, 2)}\n`,
    );
}

for (const name of manifest.existingFunctions ?? []) {
  const destination = path.join(outputRoot, name);
  const sourceName =
    name === "recognize-draw-tickets" ? "verify-prize-tickets" : name;
  await cp(path.join(cloudbaseDir, "functions", sourceName), destination, {
    recursive: true,
    filter: (source) =>
      !source.endsWith(".DS_Store") &&
      !source.includes(`${path.sep}node_modules`) &&
      !source.endsWith(".test.ts") &&
      !source.endsWith(".env.example"),
  });
  const contractRoot = path.resolve(
    cloudbaseDir,
    "../../data/recognition-contract",
  );
  const contractDestination = path.join(destination, "recognition-contract");
  const promptName =
    name === "recognize-draw-tickets"
      ? "prize-ticket-verification-v2.txt"
      : "ichi-board-vlm-r1-visible-evidence-1.1.0.txt";
  const schemaName =
    name === "recognize-draw-tickets"
      ? "prize-ticket-verification-provider-v2.schema.json"
      : "board-provider-r1-visible-evidence-1.1.0.schema.json";
  const sourceRoot =
    name === "recognize-draw-tickets"
      ? path.resolve(cloudbaseDir, "../../data/prize-ticket-verification")
      : contractRoot;
  await mkdir(path.join(contractDestination, "prompt"), { recursive: true });
  await mkdir(path.join(contractDestination, "schema"), { recursive: true });
  await cp(
    path.join(sourceRoot, "prompt", promptName),
    path.join(contractDestination, "prompt", promptName),
  );
  await cp(
    path.join(sourceRoot, "schema", schemaName),
    path.join(contractDestination, "schema", schemaName),
  );
  if (name === "recognize-board") {
    await cp(
      path.join(
        contractRoot,
        "prompt",
        "ichi-board-vlm-r2-direct-remaining-1.0.0.txt",
      ),
      path.join(
        contractDestination,
        "prompt",
        "ichi-board-vlm-r2-direct-remaining-1.0.0.txt",
      ),
    );
    await cp(
      path.join(
        contractRoot,
        "schema",
        "board-provider-r2-direct-remaining-1.0.0.schema.json",
      ),
      path.join(
        contractDestination,
        "schema",
        "board-provider-r2-direct-remaining-1.0.0.schema.json",
      ),
    );
    await cp(
      path.join(
        contractRoot,
        "prompt",
        "ichi-board-vlm-hybrid-semantic-1.0.0.txt",
      ),
      path.join(
        contractDestination,
        "prompt",
        "ichi-board-vlm-hybrid-semantic-1.0.0.txt",
      ),
    );
    await cp(
      path.join(
        contractRoot,
        "schema",
        "board-provider-hybrid-semantic-1.0.0.schema.json",
      ),
      path.join(
        contractDestination,
        "schema",
        "board-provider-hybrid-semantic-1.0.0.schema.json",
      ),
    );
    await mkdir(path.join(contractDestination, "policy"), { recursive: true });
    await cp(
      path.join(contractRoot, "policy", "board-vlm-policy-1.0.0-rc1.json"),
      path.join(
        contractDestination,
        "policy",
        "board-vlm-policy-1.0.0-rc1.json",
      ),
    );
  }
  await cp(
    path.join(cloudbaseDir, "shared"),
    path.join(destination, "shared"),
    { recursive: true, filter: (source) => !source.endsWith(".test.ts") },
  );
  await writeFile(
    path.join(destination, "package.json"),
    `${JSON.stringify(packageFor(name), null, 2)}\n`,
  );
}

console.log(
  `Prepared ${manifest.functions.length} generated and ${(manifest.existingFunctions ?? []).length} standalone CloudBase event functions in ${outputRoot}`,
);
