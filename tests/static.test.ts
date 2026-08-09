import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Static analysis of the presentation layer.
 *
 * The sandbox this project was authored in has no network egress, so neither
 * `next build` nor `tsc --noEmit` can be executed here. These tests exist to
 * recover as much of that safety net as possible by parsing the source
 * directly: unresolvable imports, missing exports, missing "use client",
 * un-awaited async params and dead internal links are all build-breaking or
 * runtime-breaking faults that a regular expression can find.
 *
 * This is not a substitute for the compiler. It is a floor beneath it.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const srcDir = path.join(root, "src");
const appDir = path.join(srcDir, "app");
const componentsDir = path.join(srcDir, "components");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allSourceFiles = walk(srcDir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
const presentationFiles = allSourceFiles.filter(
  (f) => f.startsWith(appDir) || f.startsWith(componentsDir),
);

function read(file: string): string {
  return readFileSync(file, "utf8");
}

function rel(file: string): string {
  return path.relative(root, file);
}

/** Resolve a `@/x/y` specifier to a real file on disk, or null. */
function resolveAlias(specifier: string): string | null {
  if (!specifier.startsWith("@/")) return null;
  const base = path.join(srcDir, specifier.slice(2));
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // not this one
    }
  }
  return null;
}

/** Resolve a relative specifier from an importing file. */
function resolveRelative(fromFile: string, specifier: string): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // not this one
    }
  }
  return null;
}

interface ImportRecord {
  file: string;
  specifier: string;
  named: string[];
  isTypeOnly: boolean;
  hasDefault: boolean;
}

const IMPORT_RE = /import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;

function parseImports(file: string): ImportRecord[] {
  const source = read(file);
  const records: ImportRecord[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    const isTypeOnly = Boolean(match[1]);
    const clause = match[2] ?? "";
    const specifier = match[3] ?? "";
    // A side-effect import such as `import "./globals.css";` has no `from`, so
    // the lazy match runs past it into the next statement. Anything containing
    // a quote, a semicolon or a second `import` is that artefact, not a clause.
    if (/["';]/.test(clause) || /\bimport\b/.test(clause)) continue;
    const braced = /\{([\s\S]*?)\}/.exec(clause);
    const named = braced
      ? braced[1]!
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => part.replace(/^type\s+/, "").split(/\s+as\s+/)[0]!.trim())
          .filter(Boolean)
      : [];
    const beforeBrace = clause.split("{")[0]!.trim().replace(/,$/, "").trim();
    records.push({
      file,
      specifier,
      named,
      isTypeOnly,
      hasDefault: beforeBrace.length > 0 && !beforeBrace.startsWith("*"),
    });
  }
  return records;
}

/** Collect exported names from a module by regex. */
function exportedNames(file: string): Set<string> {
  const source = read(file);
  const names = new Set<string>();

  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g,
    /export\s+class\s+([A-Za-z0-9_$]+)/g,
    /export\s+(?:type|interface)\s+([A-Za-z0-9_$]+)/g,
    /export\s+enum\s+([A-Za-z0-9_$]+)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) names.add(match[1]!);
  }

  // export { a, b as c }
  for (const match of source.matchAll(/export\s+(?:type\s+)?\{([\s\S]*?)\}/g)) {
    for (const part of match[1]!.split(",")) {
      const trimmed = part.trim().replace(/^type\s+/, "");
      if (!trimmed) continue;
      const asMatch = /\s+as\s+([A-Za-z0-9_$]+)$/.exec(trimmed);
      names.add(asMatch ? asMatch[1]! : trimmed);
    }
  }

  if (/export\s+default/.test(source)) names.add("default");
  return names;
}

/* -------------------------------------------------------------------------- */

describe("static analysis: module graph", () => {
  it("every aliased import resolves to a real file", () => {
    const failures: string[] = [];
    for (const file of allSourceFiles) {
      for (const record of parseImports(file)) {
        if (!record.specifier.startsWith("@/")) continue;
        if (!resolveAlias(record.specifier)) {
          failures.push(`${rel(file)} imports ${record.specifier}, which does not exist`);
        }
      }
    }
    assert.deepEqual(failures, []);
  });

  it("every relative import inside src resolves to a real file", () => {
    const failures: string[] = [];
    for (const file of allSourceFiles) {
      for (const record of parseImports(file)) {
        if (!record.specifier.startsWith(".")) continue;
        if (!resolveRelative(file, record.specifier)) {
          failures.push(`${rel(file)} imports ${record.specifier}, which does not exist`);
        }
      }
    }
    assert.deepEqual(failures, []);
  });

  it("every named import exists as an export of its target module", () => {
    const cache = new Map<string, Set<string>>();
    const failures: string[] = [];

    for (const file of allSourceFiles) {
      for (const record of parseImports(file)) {
        const target = record.specifier.startsWith("@/")
          ? resolveAlias(record.specifier)
          : record.specifier.startsWith(".")
            ? resolveRelative(file, record.specifier)
            : null;
        if (!target) continue;

        let names = cache.get(target);
        if (!names) {
          names = exportedNames(target);
          cache.set(target, names);
        }

        for (const name of record.named) {
          if (!names.has(name)) {
            failures.push(`${rel(file)} imports { ${name} } from ${record.specifier}, not exported`);
          }
        }
        if (record.hasDefault && !names.has("default")) {
          failures.push(`${rel(file)} imports a default from ${record.specifier}, which has none`);
        }
      }
    }

    assert.deepEqual(failures, []);
  });

  it("library and content modules never import from next or react", () => {
    const failures: string[] = [];
    const frameworkFree = allSourceFiles.filter(
      (f) => f.includes(`${path.sep}lib${path.sep}`) || f.includes(`${path.sep}content${path.sep}`),
    );
    for (const file of frameworkFree) {
      for (const record of parseImports(file)) {
        if (/^(next|react)(\/|$)/.test(record.specifier)) {
          failures.push(`${rel(file)} imports ${record.specifier}`);
        }
      }
    }
    // This is what keeps the domain logic testable without a build step.
    assert.deepEqual(failures, []);
  });
});

/* -------------------------------------------------------------------------- */

const CLIENT_ONLY = [
  "useState",
  "useEffect",
  "useRef",
  "useId",
  "useCallback",
  "useMemo",
  "useReducer",
  "useLayoutEffect",
  "usePathname",
  "useRouter",
  "useSearchParams",
];

describe("static analysis: server and client boundaries", () => {
  it("any file using client-only hooks declares \"use client\"", () => {
    const failures: string[] = [];
    for (const file of presentationFiles) {
      const source = read(file);
      const used = CLIENT_ONLY.filter((hook) => new RegExp(`\\b${hook}\\s*\\(`).test(source));
      if (used.length === 0) continue;
      if (!/^\s*["']use client["'];?/m.test(source.split("\n").slice(0, 3).join("\n"))) {
        failures.push(`${rel(file)} uses ${used.join(", ")} without a "use client" directive`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("any file with an inline event handler declares \"use client\"", () => {
    const failures: string[] = [];
    for (const file of presentationFiles) {
      const source = read(file);
      if (!/\son(Click|Change|Submit|Input|KeyDown|KeyUp|Pointer\w+)=\{/.test(source)) continue;
      if (!/^\s*["']use client["'];?/m.test(source.split("\n").slice(0, 3).join("\n"))) {
        failures.push(`${rel(file)} attaches an event handler without "use client"`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("no client component imports the entries module directly", () => {
    // Client components must receive content as props. Importing the whole
    // catalogue would ship every entry body to the browser.
    const failures: string[] = [];
    for (const file of presentationFiles) {
      const source = read(file);
      if (!/^\s*["']use client["']/m.test(source.split("\n").slice(0, 3).join("\n"))) continue;
      if (/from\s+["']@\/content\/entries["']/.test(source)) {
        failures.push(`${rel(file)} is a client component importing the whole catalogue`);
      }
    }
    assert.deepEqual(failures, []);
  });
});

/* -------------------------------------------------------------------------- */

describe("static analysis: Next.js 15 async APIs", () => {
  const pageFiles = presentationFiles.filter(
    (f) => path.basename(f) === "page.tsx" || path.basename(f) === "route.ts",
  );

  it("params and searchParams are typed as Promises wherever they are used", () => {
    const failures: string[] = [];
    for (const file of pageFiles) {
      const source = read(file);
      // Next 14 typed these as plain objects. That form is now a build error,
      // so the object literal shape is what we hunt for.
      if (/\bparams\s*:\s*\{/.test(source)) {
        failures.push(`${rel(file)} declares params as a plain object, not a Promise`);
      }
      if (/\bsearchParams\s*:\s*\{/.test(source)) {
        failures.push(`${rel(file)} declares searchParams as a plain object, not a Promise`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("every use of params or searchParams is awaited", () => {
    const failures: string[] = [];
    for (const file of pageFiles) {
      const source = read(file);
      // Route handlers reach them through a context object, pages through a
      // destructured prop, so allow an optional qualifier before the name.
      if (/[^h]params\s*:\s*Promise</.test(source) && !/await\s+[\w.]*\bparams\b/.test(source)) {
        failures.push(`${rel(file)} never awaits params`);
      }
      if (/searchParams\s*:\s*Promise</.test(source) && !/await\s+[\w.]*\bsearchParams\b/.test(source)) {
        failures.push(`${rel(file)} never awaits searchParams`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("every dynamic route segment has generateStaticParams", () => {
    const dynamicPages = pageFiles.filter(
      (f) => /\[[^\]]+\]/.test(f) && path.basename(f) === "page.tsx",
    );
    assert.ok(dynamicPages.length >= 2, "expected at least two dynamic page routes");
    for (const file of dynamicPages) {
      assert.match(
        read(file),
        /export\s+(?:async\s+)?function\s+generateStaticParams/,
        `${rel(file)} has no generateStaticParams`,
      );
    }
  });

  it("every dynamic page exports generateMetadata", () => {
    const dynamicPages = pageFiles.filter(
      (f) => /\[[^\]]+\]/.test(f) && path.basename(f) === "page.tsx",
    );
    for (const file of dynamicPages) {
      assert.match(
        read(file),
        /export\s+async\s+function\s+generateMetadata/,
        `${rel(file)} has no generateMetadata`,
      );
    }
  });
});

/* -------------------------------------------------------------------------- */

describe("static analysis: routes and links", () => {
  function routeSet(): Set<string> {
    const routes = new Set<string>(["/"]);
    for (const file of walk(appDir)) {
      const base = path.basename(file);
      if (base !== "page.tsx" && base !== "route.ts") continue;
      const dir = path.relative(appDir, path.dirname(file));
      const url = `/${dir.split(path.sep).filter(Boolean).join("/")}`;
      routes.add(url === "/" ? "/" : url);
    }
    return routes;
  }

  const routes = routeSet();

  it("the archive exposes at least eight distinct page routes", () => {
    const pages = [...routes].filter((r) => !r.startsWith("/api"));
    assert.ok(pages.length >= 8, `expected at least 8 page routes, found ${pages.length}: ${pages.join(", ")}`);
  });

  it("every required API route exists", () => {
    for (const required of [
      "/api/health",
      "/api/content",
      "/api/content/[slug]",
      "/api/categories",
      "/api/search",
      "/api/contact",
      "/api/site-config",
    ]) {
      assert.ok(routes.has(required), `missing API route ${required}`);
    }
  });

  it("every internal href points at a route that exists", () => {
    const failures: string[] = [];
    // Matches href="/x" and href={`/x/${...}`}
    const literal = /href=["'](\/[^"'#?]*)/g;

    for (const file of presentationFiles) {
      const source = read(file);
      for (const match of source.matchAll(literal)) {
        const href = match[1]!.replace(/\/$/, "") || "/";
        if (href.startsWith("//")) continue;
        // Metadata-owned endpoints that have no page.tsx or route.ts.
        if (["/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/icon"].includes(href)) {
          continue;
        }
        if (routes.has(href)) continue;
        // Try matching against a dynamic segment.
        const matchedDynamic = [...routes].some((route) => {
          const pattern = new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
          return pattern.test(href);
        });
        if (!matchedDynamic) failures.push(`${rel(file)} links to ${href}, which has no route`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("template-literal hrefs only target routes with a matching dynamic segment", () => {
    const failures: string[] = [];
    const templated = /href=\{`(\/[^`]*)`\}/g;
    for (const file of presentationFiles) {
      for (const match of read(file).matchAll(templated)) {
        const raw = match[1]!;
        // Replace interpolations with a placeholder segment.
        const normalised = raw
          .replace(/\$\{[^}]*\}/g, "X")
          .split("?")[0]!
          .split("#")[0]!
          .replace(/\/$/, "");
        const matched = [...routes].some((route) => {
          const pattern = new RegExp(`^${route.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
          return pattern.test(normalised);
        });
        if (!matched) failures.push(`${rel(file)} links to ${raw}, which has no route`);
      }
    }
    assert.deepEqual(failures, []);
  });
});

/* -------------------------------------------------------------------------- */

describe("static analysis: accessibility and hygiene", () => {
  it("no presentation file contains an em dash or en dash", () => {
    const failures: string[] = [];
    for (const file of allSourceFiles) {
      const source = read(file);
      const lines = source.split("\n");
      lines.forEach((line, index) => {
        if (line.includes("\u2014") || line.includes("\u2013")) {
          failures.push(`${rel(file)}:${index + 1}`);
        }
      });
    }
    assert.deepEqual(failures, []);
  });

  it("no placeholder text survives anywhere in the source", () => {
    const banned = ["lorem ipsum", "TODO:", "FIXME", "placeholder text", "coming soon", "dolor sit amet"];
    const failures: string[] = [];
    for (const file of allSourceFiles) {
      const lower = read(file).toLowerCase();
      for (const term of banned) {
        if (lower.includes(term.toLowerCase())) failures.push(`${rel(file)} contains ${term}`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("every page exports metadata or generateMetadata", () => {
    const failures: string[] = [];
    for (const file of walk(appDir)) {
      if (path.basename(file) !== "page.tsx") continue;
      const source = read(file);
      const hasMetadata =
        /export\s+const\s+metadata\s*:/.test(source) ||
        /export\s+async\s+function\s+generateMetadata/.test(source);
      if (!hasMetadata) failures.push(rel(file));
    }
    assert.deepEqual(failures, []);
  });

  it("no image element is rendered without alt text", () => {
    const failures: string[] = [];
    for (const file of presentationFiles) {
      const source = read(file);
      for (const match of source.matchAll(/<img\b([^>]*)>/g)) {
        if (!/\balt=/.test(match[1]!)) failures.push(`${rel(file)} has an img without alt`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("every dangerouslySetInnerHTML use is either JSON-LD or a pre-escaped highlight", () => {
    const failures: string[] = [];
    for (const file of presentationFiles) {
      const source = read(file);
      for (const match of source.matchAll(/dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]+)\}\}/g)) {
        const expression = match[1]!.trim();
        const safe =
          expression.startsWith("JSON.stringify") ||
          expression.includes("highlight") ||
          expression === "script";
        if (!safe) failures.push(`${rel(file)} injects ${expression}`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("no secret-looking literal appears in any source file", () => {
    const failures: string[] = [];
    const suspicious = [
      /vcp_[A-Za-z0-9]{16,}/,
      /sk-[A-Za-z0-9]{20,}/,
      /ghp_[A-Za-z0-9]{20,}/,
      /AKIA[0-9A-Z]{16}/,
    ];
    for (const file of allSourceFiles) {
      const source = read(file);
      for (const pattern of suspicious) {
        if (pattern.test(source)) failures.push(`${rel(file)} matches ${pattern}`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("client code never reads a non-public environment variable", () => {
    const failures: string[] = [];
    for (const file of presentationFiles) {
      const source = read(file);
      if (!/^\s*["']use client["']/m.test(source.split("\n").slice(0, 3).join("\n"))) continue;
      for (const match of source.matchAll(/process\.env\.([A-Za-z0-9_]+)/g)) {
        const name = match[1]!;
        if (!name.startsWith("NEXT_PUBLIC_") && name !== "NODE_ENV") {
          failures.push(`${rel(file)} reads ${name} in client code`);
        }
      }
    }
    assert.deepEqual(failures, []);
  });
});

/* -------------------------------------------------------------------------- */

describe("static analysis: required state and structure files", () => {
  const required = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/not-found.tsx",
    "src/app/error.tsx",
    "src/app/loading.tsx",
    "src/app/sitemap.ts",
    "src/app/robots.ts",
    "src/app/manifest.ts",
    "src/app/feed.xml/route.ts",
    "src/app/globals.css",
  ];

  for (const file of required) {
    it(`${file} exists`, () => {
      assert.ok(statSync(path.join(root, file)).isFile());
    });
  }

  it("globals.css defines all five deliberate breakpoints", () => {
    const css = read(path.join(root, "src/app/globals.css"));
    const queries = [...css.matchAll(/@media[^{]+/g)].map((m) => m[0]);
    const joined = queries.join(" ");
    assert.match(joined, /min-width:\s*1600px/, "no large desktop breakpoint");
    assert.match(joined, /1024px/, "no small desktop breakpoint");
    assert.match(joined, /768px/, "no tablet breakpoint");
    assert.match(joined, /767px/, "no mobile portrait breakpoint");
    assert.match(joined, /orientation:\s*landscape/, "no landscape treatment");
  });

  it("globals.css honours prefers-reduced-motion", () => {
    const css = read(path.join(root, "src/app/globals.css"));
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
  });

  it("every className used in the presentation layer is defined in globals.css", () => {
    const css = read(path.join(root, "src/app/globals.css"));
    const used = new Set<string>();
    for (const file of presentationFiles) {
      for (const match of read(file).matchAll(/className=["']([^"']+)["']/g)) {
        for (const name of match[1]!.split(/\s+/)) {
          if (name) used.add(name);
        }
      }
    }
    const missing = [...used].filter(
      (name) => !new RegExp(`\\.${name.replace(/[-]/g, "\\-")}(?![\\w-])`).test(css),
    );
    assert.deepEqual(missing, [], `undefined CSS classes: ${missing.join(", ")}`);
  });

  it("globals.css defines a visible focus style", () => {
    const css = read(path.join(root, "src/app/globals.css"));
    assert.match(css, /:focus-visible/);
    assert.match(css, /outline/);
  });
});
