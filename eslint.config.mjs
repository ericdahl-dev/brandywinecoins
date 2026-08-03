import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Source comps and the design tool's runtime. Reference material kept for
    // provenance, not application code.
    "design/**",
    // Written by `payload migrate:create`, `generate:types` and
    // `generate:importmap`. Editing them to satisfy a linter would be undone by
    // the next generate, and the warnings are in Payload's own signatures.
    "cms/migrations/**",
    "cms/payload-types.ts",
    "app/(payload)/admin/importMap.js",
  ]),
]);

export default eslintConfig;
