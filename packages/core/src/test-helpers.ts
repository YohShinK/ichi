import type { Result } from "./result.js";

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (!result.ok)
    throw new Error(`Expected success, received ${String(result.error)}`);
  return result.value;
};
