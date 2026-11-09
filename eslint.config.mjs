import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15 ships the older "eslintrc" format; FlatCompat turns it into flat config.
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // `const { dp: _dp, ...rest } = row` drops a field on purpose (e.g. the dealer price).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".data/**", ".claude/**", "public/**"]),
]);
