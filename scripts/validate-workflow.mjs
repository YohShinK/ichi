import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "AGENTS.md",
  "PRD.md",
  "README.md",
  "memory-bank/design-document.md",
  "memory-bank/tech-stack.md",
  "memory-bank/implementation-plan.md",
  "memory-bank/progress.md",
  "memory-bank/architecture.md",
];

const errors = [];
for (const file of required) {
  const target = path.join(root, file);
  if (!fs.existsSync(target))
    errors.push(`Missing required workflow file: ${file}`);
  else if (!fs.readFileSync(target, "utf8").trim())
    errors.push(`Workflow file is empty: ${file}`);
}

if (fs.existsSync(path.join(root, "memory-bank/current.json"))) {
  errors.push(
    "Legacy memory-bank/current.json must not remain active; use progress.md.",
  );
}

const agents = fs.existsSync(path.join(root, "AGENTS.md"))
  ? fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")
  : "";
for (const name of [
  "architecture.md",
  "design-document.md",
  "implementation-plan.md",
  "progress.md",
]) {
  if (!agents.includes(name))
    errors.push(`AGENTS.md does not reference ${name}.`);
}

const plan = fs.existsSync(
  path.join(root, "memory-bank/implementation-plan.md"),
)
  ? fs.readFileSync(
      path.join(root, "memory-bank/implementation-plan.md"),
      "utf8",
    )
  : "";
for (const version of ["V1", "V2", "V3"]) {
  if (!plan.includes(`## ${version}`))
    errors.push(`Implementation plan is missing ${version}.`);
}

const blockHeadings = [...plan.matchAll(/^### (V[123]-[A-Z])｜/gm)];
const blockStatuses = new Map();
for (const [index, match] of blockHeadings.entries()) {
  const nextMatch = blockHeadings[index + 1];
  const section = plan.slice(match.index, nextMatch?.index ?? plan.length);
  const statusMatch = section.match(
    /> 区块状态：(LOCKED|READY|IN_PROGRESS|AWAITING_REVIEW|COMPLETED|BLOCKED)/,
  );
  if (!statusMatch) {
    errors.push(
      `Implementation plan block ${match[1]} is missing a valid block status.`,
    );
  } else {
    blockStatuses.set(match[1], statusMatch[1]);
  }
}

const progress = fs.existsSync(path.join(root, "memory-bank/progress.md"))
  ? fs.readFileSync(path.join(root, "memory-bank/progress.md"), "utf8")
  : "";
const activeBlockMatch = progress.match(/当前活动区块：\s*(V[123]-[A-Z])/);
const noActiveBlock = /当前活动区块：\s*无/.test(progress);
if (!activeBlockMatch && !noActiveBlock) {
  errors.push('progress.md must state an active block or "当前活动区块：无".');
} else if (activeBlockMatch) {
  const activeBlock = activeBlockMatch[1];
  const blockHeading = new RegExp(`^### ${activeBlock}｜`, "m");
  const headingMatch = blockHeading.exec(plan);
  if (!headingMatch) {
    errors.push(`Implementation plan is missing active block ${activeBlock}.`);
  } else {
    const blockStart = headingMatch.index;
    const remaining = plan.slice(blockStart + headingMatch[0].length);
    const nextSectionOffset = remaining.search(/^### |^## /m);
    const blockSection =
      nextSectionOffset === -1
        ? remaining
        : remaining.slice(0, nextSectionOffset);
    if (
      !/区块状态：(READY|IN_PROGRESS|AWAITING_REVIEW|BLOCKED)/.test(
        blockSection,
      )
    ) {
      errors.push(
        `Active block ${activeBlock} must have an active block status.`,
      );
    }
    const progressBlockStatus = progress.match(
      /区块状态：\s*`?(READY|IN_PROGRESS|AWAITING_REVIEW|BLOCKED)`?/,
    );
    const planBlockStatus = blockSection.match(
      /区块状态：(READY|IN_PROGRESS|AWAITING_REVIEW|BLOCKED)/,
    );
    if (
      progressBlockStatus &&
      planBlockStatus &&
      progressBlockStatus[1] !== planBlockStatus[1]
    ) {
      errors.push(
        `Active block ${activeBlock} status differs between progress and plan.`,
      );
    }
    if (/^\| V\d-[^|]+ \| LOCKED \|/m.test(blockSection)) {
      errors.push(`Active block ${activeBlock} contains a LOCKED step.`);
    }

    const linkedFiles = {
      "README.md": fs.readFileSync(path.join(root, "README.md"), "utf8"),
      "memory-bank/architecture.md": fs.readFileSync(
        path.join(root, "memory-bank/architecture.md"),
        "utf8",
      ),
    };
    for (const [file, content] of Object.entries(linkedFiles)) {
      if (!content.includes(activeBlock)) {
        errors.push(`${file} does not reference active block ${activeBlock}.`);
      }
    }
  }
} else {
  const unexpectedlyActiveBlocks = [...blockStatuses.entries()]
    .filter(([, status]) =>
      ["READY", "IN_PROGRESS", "AWAITING_REVIEW", "BLOCKED"].includes(status),
    )
    .map(([block]) => block);
  if (unexpectedlyActiveBlocks.length) {
    errors.push(
      `No active block is declared, but these blocks have active statuses: ${unexpectedlyActiveBlocks.join(
        ", ",
      )}.`,
    );
  }

  const linkedFiles = {
    "README.md": fs.readFileSync(path.join(root, "README.md"), "utf8"),
    "memory-bank/architecture.md": fs.readFileSync(
      path.join(root, "memory-bank/architecture.md"),
      "utf8",
    ),
  };
  if (!linkedFiles["README.md"].includes("当前活动区块：无")) {
    errors.push('README.md must state "当前活动区块：无".');
  }
  if (
    !linkedFiles["memory-bank/architecture.md"].includes("当前没有活动区块")
  ) {
    errors.push('memory-bank/architecture.md must state "当前没有活动区块".');
  }
  if (!progress.includes("下一候选区块：")) {
    errors.push("progress.md must identify the next candidate block.");
  }
}

if (!agents.includes("区块人工门禁")) {
  errors.push("AGENTS.md must define the project-level block acceptance gate.");
}
if (!plan.includes("区块解锁时，区块内所有未完成 step 一并转为 `READY`")) {
  errors.push("Implementation plan must define whole-block unlock behavior.");
}
const design = fs.readFileSync(
  path.join(root, "memory-bank/design-document.md"),
  "utf8",
);
if (!design.includes("用户是每个实施区块的默认验收门")) {
  errors.push("design-document.md must use block-level human acceptance.");
}
const techStack = fs.readFileSync(
  path.join(root, "memory-bank/tech-stack.md"),
  "utf8",
);
if (!techStack.includes("区块人工验收后的检查点提交")) {
  errors.push(
    "tech-stack.md must align checkpoint strategy with block acceptance.",
  );
}
const architecture = fs.readFileSync(
  path.join(root, "memory-bank/architecture.md"),
  "utf8",
);
if (!architecture.includes("文件权限按变更目的和活动区块判断")) {
  errors.push(
    "architecture.md must define block-linked file write permissions.",
  );
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Workflow validation passed (${required.length} required files).`);
