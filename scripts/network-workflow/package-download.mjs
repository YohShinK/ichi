import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { check } from "./store.mjs";

const run = promisify(execFile);
// Read-only retries. Signed addresses and transport stderr never enter artifacts.
export const downloadPackage = async (getAddress, file) => {
  let cause;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const address = await getAddress();
      check(
        typeof address.Url === "string" &&
          new URL(address.Url).protocol === "https:",
        "HTTPS_PROVIDER_PACKAGE_ADDRESS_REQUIRED",
      );
      await run(
        "curl",
        [
          "--fail",
          "--silent",
          "--show-error",
          "--location",
          "--connect-timeout",
          "15",
          "--max-time",
          "45",
          "--output",
          file,
          address.Url,
        ],
        { timeout: 50000, maxBuffer: 4096 },
      );
      return file;
    } catch (error) {
      cause = error;
    }
  }
  throw Object.assign(new Error("PROVIDER_PACKAGE_DOWNLOAD_FAILED"), {
    code: "PROVIDER_PACKAGE_DOWNLOAD_FAILED",
    cause,
  });
};
