export const RECOGNITION_CONTRACT_VERSION = "1.0.0" as const;

export type RecognitionStatus =
  | "ready_for_confirmation"
  | "needs_user_input"
  | "retake_required"
  | "service_error";
