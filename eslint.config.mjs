import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
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
