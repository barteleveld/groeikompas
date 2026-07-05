import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    // Supabase relation joins are normalized at runtime; generated DB types can
    // replace these boundary casts after the remote project exists.
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  globalIgnores([".next/**", "node_modules/**", ".npm-cache/**", "next-env.d.ts"]),
]);
