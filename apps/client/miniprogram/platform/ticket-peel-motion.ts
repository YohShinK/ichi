export interface PeelSpringOptions {
  readonly from: number;
  readonly to: number;
  readonly velocity?: number;
  readonly durationMs?: number;
  readonly frameMs?: number;
  readonly stiffness?: number;
  readonly damping?: number;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export const projectPeelDistance = (
  distancePx: number,
  velocityPxPerMs: number,
): number => {
  const velocityFactor = clamp(velocityPxPerMs / 1.2, 0, 1);
  return Math.max(0, distancePx) * (1 + velocityFactor);
};

export const createPeelSpringFrames = ({
  from,
  to,
  velocity = 0,
  durationMs = 320,
  frameMs = 16,
  stiffness = 170,
  damping = 26,
}: PeelSpringOptions): number[] => {
  const frameCount = Math.max(1, Math.ceil(durationMs / frameMs));
  const omega0 = Math.sqrt(stiffness);
  const dampingRatio = clamp(damping / (2 * omega0), 0.001, 0.999);
  const omegaD = omega0 * Math.sqrt(1 - dampingRatio * dampingRatio);
  const displacement = from - to;
  const sineCoefficient =
    (velocity + dampingRatio * omega0 * displacement) / omegaD;

  return Array.from({ length: frameCount }, (_, index) => {
    if (index === frameCount - 1) return to;
    const seconds = ((index + 1) * frameMs) / 1000;
    const decay = Math.exp(-dampingRatio * omega0 * seconds);
    const position =
      to +
      decay *
        (displacement * Math.cos(omegaD * seconds) +
          sineCoefficient * Math.sin(omegaD * seconds));
    return Math.max(0, position);
  });
};
