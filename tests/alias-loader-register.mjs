import { register } from "node:module";
import { pathToFileURL } from "node:url";

/**
 * Registers the "@/*" path alias resolver for the test runner.
 * Used via: node --import ./tests/alias-loader-register.mjs --test ...
 */
register("./alias-loader.mjs", pathToFileURL(import.meta.filename));
