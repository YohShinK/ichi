import { describe, expect, it } from "vitest";

import {
  createPeelSpringFrames,
  projectPeelDistance,
} from "./ticket-peel-motion.js";

describe("ticket peel motion", () => {
  it("projects a faster flick farther without changing a stationary drag", () => {
    expect(projectPeelDistance(48, 0)).toBe(48);
    expect(projectPeelDistance(48, 0.6)).toBe(72);
    expect(projectPeelDistance(48, -0.6)).toBe(48);
    expect(projectPeelDistance(48, 3)).toBe(96);
  });

  it("produces damped spring frames and lands exactly on the target", () => {
    const exit = createPeelSpringFrames({
      from: 62,
      to: 145,
      velocity: 180,
    });
    const reset = createPeelSpringFrames({ from: 42, to: 0 });

    expect(exit).toHaveLength(20);
    expect(exit[0]).toBeGreaterThan(62);
    expect(exit.at(-1)).toBe(145);
    expect(reset[0]).toBeLessThan(42);
    expect(reset.at(-1)).toBe(0);
  });

  it("uses the React Spring default tension and friction when omitted", () => {
    expect(createPeelSpringFrames({ from: 40, to: 0 })).toEqual(
      createPeelSpringFrames({
        from: 40,
        to: 0,
        stiffness: 170,
        damping: 26,
      }),
    );
  });
});
