import { coreError, type CoreError } from "./errors.js";
import { err, ok, type Result } from "./result.js";
import { validateCount } from "./integer.js";

export const combination = (
  n: number,
  k: number,
): Result<bigint, CoreError> => {
  const validN = validateCount(n, "n", "INVALID_COMBINATION_PARAMETERS");
  if (!validN.ok) return validN;
  const validK = validateCount(k, "k", "INVALID_COMBINATION_PARAMETERS");
  if (!validK.ok) return validK;
  if (k > n) {
    return err(
      coreError("INVALID_COMBINATION_PARAMETERS", "k must not exceed n.", "k"),
    );
  }

  const symmetricK = Math.min(k, n - k);
  let result = 1n;
  for (let index = 1; index <= symmetricK; index += 1) {
    result = (result * BigInt(n - symmetricK + index)) / BigInt(index);
  }
  return ok(result);
};

export const combinationOrZero = (n: number, k: number): bigint => {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
    return 0n;
  }
  const result = combination(n, k);
  return result.ok ? result.value : 0n;
};
