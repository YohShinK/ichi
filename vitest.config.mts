import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      "apps/web/tests/**",
      "artifacts/**",
      "exports/**",
      "services/cloudbase/.deploy/**",
      "tmp/**",
      // This experiment uses node:test and is run by the root test script.
      "experiments/remaining-observation-r0/remaining-observation-resolver.test.js",
    ],
  },
});
