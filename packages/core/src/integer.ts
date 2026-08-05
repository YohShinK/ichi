import { coreError, type CoreError } from "./errors.js";
import { err, ok, type Result } from "./result.js";
import type { IntegerLike } from "./types.js";

export const toBigInt = (
  value: IntegerLike,
  field: string,
): Result<bigint, CoreError> => {
  if (typeof value === "bigint") return ok(value);
  if (!Number.isInteger(value)) {
    return err(
      coreError("NON_INTEGER_INPUT", `${field} must be an integer.`, field),
    );
  }
  if (!Number.isSafeInteger(value)) {
    return err(
      coreError(
        "UNSAFE_INTEGER_INPUT",
        `${field} must be a safe integer or bigint.`,
        field,
      ),
    );
  }
  return ok(BigInt(value));
};

export const validateCount = (
  value: number,
  field: string,
  negativeCode: CoreError["code"],
): Result<number, CoreError> => {
  if (!Number.isInteger(value)) {
    return err(
      coreError("NON_INTEGER_INPUT", `${field} must be an integer.`, field),
    );
  }
  if (!Number.isSafeInteger(value)) {
    return err(
      coreError(
        "UNSAFE_INTEGER_INPUT",
        `${field} must be a safe integer.`,
        field,
      ),
    );
  }
  if (value < 0) {
    return err(
      coreError(negativeCode, `${field} must not be negative.`, field),
    );
  }
  return ok(value);
};
