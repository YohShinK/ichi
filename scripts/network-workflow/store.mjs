import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import os from "node:os";

export const canonical = (x) =>
  Array.isArray(x)
    ? x.map(canonical)
    : x && typeof x === "object"
      ? Object.fromEntries(
          Object.keys(x)
            .sort()
            .map((k) => [k, canonical(x[k])]),
        )
      : x;
export const digest = (x) =>
  createHash("sha256")
    .update(
      typeof x === "string" || Buffer.isBuffer(x)
        ? x
        : JSON.stringify(canonical(x)),
    )
    .digest("hex");
export const check = (ok, code) => {
  if (!ok) throw Object.assign(new Error(code), { code });
};
export const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export const atomic = (file, value) => {
  const temp = `${file}.${randomUUID()}.tmp`;
  const fd = fs.openSync(temp, "wx", 0o600);
  try {
    fs.writeFileSync(fd, JSON.stringify(value, null, 2) + "\n");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(temp, file);
};

export class BatchStore {
  constructor(directory) {
    this.dir = path.resolve(directory);
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    this.dir = fs.realpathSync(this.dir);
    this.lock = path.join(this.dir, ".lock");
    this.head = path.join(this.dir, "HEAD.json");
  }
  async exclusive(work) {
    try {
      fs.mkdirSync(this.lock, { mode: 0o700 });
    } catch (e) {
      if (e.code === "EEXIST")
        check(false, "BATCH_LOCKED_RECOVER_ONLY_AFTER_PROCESS_EXIT");
      throw e;
    }
    atomic(path.join(this.lock, "owner.json"), {
      pid: process.pid,
      host: os.hostname(),
    });
    try {
      return await work();
    } finally {
      fs.rmSync(this.lock, { recursive: true });
    }
  }
  recoverLock() {
    const owner = json(path.join(this.lock, "owner.json"));
    check(owner.host === os.hostname(), "FOREIGN_HOST_LOCK");
    check(
      Number.isSafeInteger(owner.pid) && owner.pid > 0,
      "INVALID_LOCK_OWNER",
    );
    try {
      process.kill(owner.pid, 0);
      check(false, "LOCK_OWNER_STILL_RUNNING");
    } catch (e) {
      check(e.code === "ESRCH", "LOCK_OWNER_NOT_PROVEN_DEAD");
    }
    fs.rmSync(this.lock, { recursive: true });
  }
  read() {
    if (!fs.existsSync(this.head))
      return {
        schemaVersion: "ichi-network-batch-v1",
        revision: 0,
        candidates: {},
        searches: [],
        audit: [],
      };
    const head = json(this.head);
    check(
      /^snapshots\/[a-f0-9]{64}\.json$/u.test(head.file),
      "INVALID_BATCH_HEAD",
    );
    const bytes = fs.readFileSync(this.inside(head.file));
    check(digest(bytes) === head.sha256, "BATCH_SNAPSHOT_DRIFT");
    const state = JSON.parse(bytes);
    check(
      state.schemaVersion === "ichi-network-batch-v1",
      "INVALID_BATCH_SCHEMA",
    );
    let previous = null;
    for (const event of state.audit) {
      const { hash, ...body } = event;
      check(
        body.previous === previous && digest(body) === hash,
        "AUDIT_CHAIN_DRIFT",
      );
      previous = hash;
    }
    return state;
  }
  save(state, operation, detail) {
    state.revision += 1;
    const body = {
      revision: state.revision,
      at: new Date().toISOString(),
      operation,
      detail,
      previous: state.audit.at(-1)?.hash ?? null,
    };
    state.audit.push({ ...body, hash: digest(body) });
    const bytes = Buffer.from(JSON.stringify(state, null, 2) + "\n");
    const sha256 = digest(bytes),
      file = `snapshots/${sha256}.json`;
    fs.mkdirSync(path.join(this.dir, "snapshots"), {
      recursive: true,
      mode: 0o700,
    });
    if (!fs.existsSync(path.join(this.dir, file))) {
      const fd = fs.openSync(path.join(this.dir, file), "wx", 0o600);
      try {
        fs.writeFileSync(fd, bytes);
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
    }
    atomic(this.head, { file, sha256 });
  }
  inside(relative) {
    check(
      typeof relative === "string" && !path.isAbsolute(relative),
      "INVALID_EVIDENCE_PATH",
    );
    const target = fs.realpathSync(path.resolve(this.dir, relative));
    check(target.startsWith(this.dir + path.sep), "EVIDENCE_PATH_ESCAPE");
    return target;
  }
  importEvidence(input, base) {
    const bytes = fs.readFileSync(path.resolve(base, input.path));
    check(input.sha256 === digest(bytes), "EVIDENCE_SHA_MISMATCH");
    const ext = path.extname(input.path).toLowerCase();
    check(
      [".json", ".png", ".jpg", ".jpeg", ".webp"].includes(ext),
      "UNSUPPORTED_EVIDENCE_TYPE",
    );
    if (
      input.kind === "PHOTO" ||
      input.kind === "VIDEO_FRAME" ||
      input.kind === "SCREENSHOT"
    ) {
      const image =
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        (bytes[0] === 255 && bytes[1] === 216) ||
        (bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP");
      check(image, "EVIDENCE_NOT_AN_IMAGE");
    }
    const relative = `evidence/${input.sha256}${ext}`;
    fs.mkdirSync(path.join(this.dir, "evidence"), {
      recursive: true,
      mode: 0o700,
    });
    if (!fs.existsSync(path.join(this.dir, relative)))
      fs.writeFileSync(path.join(this.dir, relative), bytes, {
        flag: "wx",
        mode: 0o600,
      });
    check(
      digest(fs.readFileSync(this.inside(relative))) === input.sha256,
      "LOCAL_EVIDENCE_DRIFT",
    );
    return {
      ...input,
      originalFile: input.originalFile ?? path.basename(input.path),
      path: relative,
    };
  }
  verify(candidate) {
    for (const evidence of candidate.evidence)
      check(
        digest(fs.readFileSync(this.inside(evidence.path))) === evidence.sha256,
        "LOCAL_EVIDENCE_DRIFT",
      );
  }
}
