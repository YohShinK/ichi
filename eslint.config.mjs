import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "apps/web/.next/**",
      "apps/web/next-env.d.ts",
      "canvas/**",
      "product-atlas/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        App: "readonly",
        Page: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
);
