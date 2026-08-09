import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * A minimal resolver hook that teaches plain Node the "@/*" path alias declared
 * in tsconfig.json, and appends the ".ts" extension that a bundler would infer.
 *
 * This exists so the real Next.js route handlers in src/app/api can be imported
 * and executed by the test runner without Next.js being installed. The handlers
 * under test are the exact files that ship, not copies.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

function resolveExtension(absolutePath) {
  if (existsSync(absolutePath) && path.extname(absolutePath)) return absolutePath;
  for (const candidate of [
    `${absolutePath}.ts`,
    `${absolutePath}.tsx`,
    path.join(absolutePath, "index.ts"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return absolutePath;
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = resolveExtension(path.join(SRC, specifier.slice(2)));
    // The format is deliberately left undefined so Node applies its own
    // detection, which is what enables TypeScript type stripping for .ts files.
    return { url: pathToFileURL(target).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
