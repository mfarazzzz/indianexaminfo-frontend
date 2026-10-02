// Minimal ESLint flat config for Next.js 15 + ESLint 9.
// Wraps the installed eslint-config-next (15.3.3, legacy shareable config) via
// FlatCompat so `next lint` runs non-interactively in CI instead of stopping at
// the "how do you want to configure?" prompt. Rules are the same two presets the
// repo has always intended: core-web-vitals (React/a11y) + typescript.
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "qa/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // 32 findings at first run (>25), so these are reported as warnings for a
    // later cleanup pass rather than fixed now. The list, with counts:
    //   @typescript-eslint/no-unused-vars      20
    //   @typescript-eslint/no-explicit-any      9
    //   @typescript-eslint/no-require-imports   2
    //   react/display-name                      1
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react/display-name": "warn",
    },
  },
];
