export type SessionErrorCode =
  | "INVALID_SESSION"
  | "INVALID_TRANSITION"
  | "PRIZE_NOT_FOUND"
  | "PRIZE_UNAVAILABLE"
  | "TARGET_NOT_FOUND"
  | "DUPLICATE_ID"
  | "NO_DRAFT"
  | "DRAFT_MUST_BE_CLEARED"
  | "NO_CONFIRMED_ROUND"
  | "ROUND_ALREADY_UNDONE"
  | "BASELINE_CHANGED"
  | "EMPTY_POOL";

export interface SessionError {
  readonly code: SessionErrorCode;
  readonly message: string;
  readonly field?: string;
}

export const sessionError = (
  code: SessionErrorCode,
  message: string,
  field?: string,
): SessionError =>
  field === undefined ? { code, message } : { code, message, field };
