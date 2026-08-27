import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
}

const cleanBefore = run("corepack", ["pnpm", "quality"]);
if (cleanBefore.status !== 0) process.exit(cleanBefore.status ?? 1);

const temporaryDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "ichi-quality-proof-"),
);
const invalidFile = path.join(temporaryDirectory, "intentional-error.ts");
const temporaryConfig = path.join(temporaryDirectory, "tsconfig.json");

try {
  fs.writeFileSync(
    invalidFile,
    "const expectedString: string = 42;\nvoid expectedString;\n",
  );
  fs.writeFileSync(
    temporaryConfig,
    `${JSON.stringify({ extends: path.join(root, "tsconfig.base.json"), include: [invalidFile] }, null, 2)}\n`,
  );

  const injectedFailure = run(
    "corepack",
    ["pnpm", "exec", "tsc", "-p", temporaryConfig, "--pretty", "false"],
    { capture: true },
  );
  if (injectedFailure.status === 0) {
    console.error(
      "Quality-gate proof failed: intentional TypeScript error was accepted.",
    );
    process.exitCode = 1;
  } else {
    console.log(
      "Quality-gate proof: intentional TypeScript error was rejected as expected.",
    );
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

if (process.exitCode) process.exit(process.exitCode);

const cleanAfter = run("corepack", ["pnpm", "quality"]);
if (cleanAfter.status !== 0) process.exit(cleanAfter.status ?? 1);

console.log(
  "Quality-gate proof passed: clean workspace passes before and after fault injection.",
);
