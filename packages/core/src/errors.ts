export type CoreErrorCode =
  | "NON_INTEGER_INPUT"
  | "UNSAFE_INTEGER_INPUT"
  | "INVALID_COMBINATION_PARAMETERS"
  | "NEGATIVE_REMAINING_TICKETS"
  | "NEGATIVE_TARGET_TICKETS"
  | "TARGET_EXCEEDS_REMAINING"
  | "NEGATIVE_PLANNED_DRAWS"
  | "DRAWS_EXCEED_REMAINING"
  | "EMPTY_POOL"
  | "TARGET_UNAVAILABLE"
  | "NEGATIVE_MONEY"
  | "SPENT_EXCEEDS_BUDGET"
  | "DUPLICATE_TARGET_ID"
  | "TARGET_REQUIREMENT_EXCEEDS_AVAILABLE"
  | "TARGETS_EXCEED_REMAINING"
  | "INVALID_PROBABILITY_THRESHOLD";

export interface CoreError {
  readonly code: CoreErrorCode;
  readonly field?: string;
  readonly message: string;
}

export const coreError = (
  code: CoreErrorCode,
  message: string,
  field?: string,
): CoreError =>
  field === undefined ? { code, message } : { code, message, field };
