import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "AGENTS.md",
  "PRD.md",
  "memory-bank/design-document.md",
  "memory-bank/tech-stack.md",
  "memory-bank/implementation-plan.md",
  "memory-bank/progress.md",
  "memory-bank/architecture.md"
];

const errors = [];
for (const file of required) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) errors.push(`Missing required workflow file: ${file}`);
  else if (!fs.readFileSync(target, "utf8").trim()) errors.push(`Workflow file is empty: ${file}`);
}

if (fs.existsSync(path.join(root, "memory-bank/current.json"))) {
  errors.push("Legacy memory-bank/current.json must not remain active; use progress.md.");
}

const agents = fs.existsSync(path.join(root, "AGENTS.md"))
  ? fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")
  : "";
for (const name of ["architecture.md", "design-document.md", "implementation-plan.md", "progress.md"]) {
  if (!agents.includes(name)) errors.push(`AGENTS.md does not reference ${name}.`);
}

const plan = fs.existsSync(path.join(root, "memory-bank/implementation-plan.md"))
  ? fs.readFileSync(path.join(root, "memory-bank/implementation-plan.md"), "utf8")
  : "";
for (const version of ["V1", "V2", "V3"]) {
  if (!plan.includes(`## ${version}`)) errors.push(`Implementation plan is missing ${version}.`);
}

const progress = fs.existsSync(path.join(root, "memory-bank/progress.md"))
  ? fs.readFileSync(path.join(root, "memory-bank/progress.md"), "utf8")
  : "";
if (!progress.includes("当前活动步骤")) errors.push("progress.md must state the current active step.");

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Workflow validation passed (${required.length} required files).`);
