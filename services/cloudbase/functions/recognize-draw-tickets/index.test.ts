import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("recognize-draw-tickets production identity", () => {
  it("exports the frozen Prize Ticket Verification handler and contract", () => {
    const productionEntry = require("./index.js") as {
      main: unknown;
      __test: unknown;
    };
    const verificationImplementation =
      require("../verify-prize-tickets/index.js") as {
        main: unknown;
        __test: unknown;
      };

    expect(productionEntry.main).toBe(verificationImplementation.main);
    expect(productionEntry.__test).toBe(verificationImplementation.__test);
  });
});
