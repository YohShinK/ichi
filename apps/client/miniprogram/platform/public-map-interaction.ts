export const PUBLIC_MAP_MIN_SCALE = 9;
export const PUBLIC_MAP_MAX_SCALE = 18;

export type PublicMapCameraPhase = "IDLE" | "GESTURE" | "ANIMATING";

export interface PublicMapInteractionSnapshot {
  readonly scale: number;
  readonly presentationProgress: number;
  readonly selectedClusterKey: string;
  readonly selectedMarkerId: string;
  readonly cameraPhase: PublicMapCameraPhase;
  readonly isTransitioning: boolean;
}

export const clamp = (
  value: number,
  minimum: number,
  maximum: number,
): number => Math.min(maximum, Math.max(minimum, value));

/** Continuous normalized camera progress. It deliberately has no level bands. */
export const scaleToProgress = (scale: number): number =>
  clamp(
    (Number(scale) - PUBLIC_MAP_MIN_SCALE) /
      (PUBLIC_MAP_MAX_SCALE - PUBLIC_MAP_MIN_SCALE),
    0,
    1,
  );

export const progressToScale = (progress: number): number =>
  PUBLIC_MAP_MIN_SCALE +
  clamp(Number(progress), 0, 1) * (PUBLIC_MAP_MAX_SCALE - PUBLIC_MAP_MIN_SCALE);

/** Smoothstep keeps both ends calm without introducing spring overshoot. */
export const easePresentationProgress = (progress: number): number => {
  const value = clamp(progress, 0, 1);
  return value * value * (3 - 2 * value);
};
