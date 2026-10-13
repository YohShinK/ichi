import type { PublicMapPhase } from "./public-map-client.js";

export type NativeMapCameraScaleSource =
  | "INITIAL"
  | "CAMERA_COMMAND"
  | "REGION_CHANGE_BEGIN"
  | "REGION_CHANGE_END"
  | "GET_SCALE_SAMPLE"
  | "POST_END_SETTLE_SAMPLE"
  | "CAMERA_FALLBACK";

export interface NativeMapCameraScaleState {
  readonly targetScale: number | null;
  readonly observedScale: number | null;
  readonly settledScale: number;
  readonly presentationScale: number;
  readonly targetPresentationScale: number | null;
  readonly observedSource: NativeMapCameraScaleSource;
  readonly observedAt: number;
  readonly protectObservedUntil: number;
}

const validScale = (scale: number): boolean =>
  Number.isFinite(scale) && scale > 0;

export const createNativeMapCameraScaleState = (
  initialScale: number,
): NativeMapCameraScaleState => {
  const scale = validScale(initialScale) ? initialScale : 12;
  return {
    targetScale: null,
    observedScale: scale,
    settledScale: scale,
    presentationScale: scale,
    targetPresentationScale: null,
    observedSource: "INITIAL",
    observedAt: 0,
    protectObservedUntil: 0,
  };
};

export const withNativeMapTargetScale = (
  state: NativeMapCameraScaleState,
  scale: number,
): NativeMapCameraScaleState =>
  validScale(scale) ? { ...state, targetScale: scale } : state;

export const withNativeMapObservedScale = (
  state: NativeMapCameraScaleState,
  input: {
    readonly scale: number;
    readonly source: NativeMapCameraScaleSource;
    readonly at: number;
  },
): NativeMapCameraScaleState => {
  if (!validScale(input.scale)) return state;
  const potentiallyStaleNativeRead =
    input.source === "GET_SCALE_SAMPLE" ||
    input.source === "REGION_CHANGE_END" ||
    input.source === "POST_END_SETTLE_SAMPLE";
  const protectsFreshRegionScale =
    potentiallyStaleNativeRead &&
    input.at < state.protectObservedUntil &&
    Math.abs(input.scale - state.settledScale) < 0.01 &&
    state.observedScale !== null &&
    Math.abs(state.observedScale - state.settledScale) >= 0.01;
  if (protectsFreshRegionScale) return state;
  return {
    ...state,
    observedScale: input.scale,
    observedSource: input.source,
    observedAt: input.at,
    protectObservedUntil:
      input.source === "REGION_CHANGE_BEGIN"
        ? input.at + 240
        : state.protectObservedUntil,
  };
};

export const withNativeMapSettledScale = (
  state: NativeMapCameraScaleState,
  scale: number,
  at: number,
): NativeMapCameraScaleState => {
  if (!validScale(scale)) return state;
  return {
    ...state,
    targetScale: null,
    observedScale: scale,
    settledScale: scale,
    observedSource: "POST_END_SETTLE_SAMPLE",
    observedAt: at,
    protectObservedUntil: 0,
  };
};

export const resolveNativeMapPresentationScale = (
  state: NativeMapCameraScaleState,
  _interactionState?: string,
): number => {
  void _interactionState;
  return state.presentationScale;
};

export const resolveNativeMapObservedScale = (
  state: NativeMapCameraScaleState,
): number => state.observedScale ?? state.settledScale;

export const needsNativeMapPresentationReconcile = (
  state: NativeMapCameraScaleState,
  epsilon = 0.005,
): boolean =>
  Math.abs(resolveNativeMapObservedScale(state) - state.presentationScale) >
  Math.max(0, epsilon);

export const beginNativeMapPresentationReconcile = (
  state: NativeMapCameraScaleState,
  targetScale = resolveNativeMapObservedScale(state),
): NativeMapCameraScaleState =>
  validScale(targetScale)
    ? { ...state, targetPresentationScale: targetScale }
    : state;

export const withNativeMapPresentationScale = (
  state: NativeMapCameraScaleState,
  scale: number,
): NativeMapCameraScaleState =>
  validScale(scale) ? { ...state, presentationScale: scale } : state;

export const completeNativeMapPresentationReconcile = (
  state: NativeMapCameraScaleState,
): NativeMapCameraScaleState => {
  const scale = state.targetPresentationScale;
  return scale !== null && validScale(scale)
    ? {
        ...state,
        presentationScale: scale,
        targetPresentationScale: null,
      }
    : { ...state, targetPresentationScale: null };
};

export const cancelNativeMapPresentationReconcile = (
  state: NativeMapCameraScaleState,
  committedScale = state.presentationScale,
): NativeMapCameraScaleState => ({
  ...withNativeMapPresentationScale(state, committedScale),
  targetPresentationScale: null,
});

export const isPublicMapRevalidatingPhase = (phase: PublicMapPhase): boolean =>
  phase === "INITIAL_LOADING" ||
  phase === "REFRESHING" ||
  phase === "VIEWPORT_REFRESHING" ||
  phase === "CURSOR_RECOVERY";

export const retainStablePublicMapMarkers = <T>(input: {
  readonly phase: PublicMapPhase;
  readonly incoming: readonly T[];
  readonly stable: readonly T[];
}): readonly T[] =>
  isPublicMapRevalidatingPhase(input.phase) && input.incoming.length === 0
    ? input.stable
    : input.incoming;
