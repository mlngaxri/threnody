import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "out/**", "tests/**"],
  },
  {
    rules: {
      // The archive renders three pieces of pre-escaped HTML: search
      // highlights and JSON-LD. Both are escaped in the repository layer
      // before they are ever handed to React, and both are covered by tests.
      "react/no-danger": "off",
    },
  },
];

export default config;
