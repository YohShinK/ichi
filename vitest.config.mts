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
    ],
  },
});
