# THRENODY

**An atlas of sounds that no longer exist.**

An acoustic archaeology archive. Fourteen entries, each one a sound that has left
the world, and each one graded by how much of what you hear is evidence and how
much is inference.

The grade is the whole idea. Anyone can synthesise a plausible noise and call it
a thylacine. THRENODY refuses to do that without saying, in the first thing you
see, exactly how much of it we actually know.

---

## Deploying this

The project was authored in a sandbox with no outbound network access, so
dependencies were never installed there and `next build` was never executed
there. Everything else was executed: the domain logic, the API handlers and the
static analysis all run offline under Node's type stripping, and all 173 tests
pass.

Two commands:

```bash
npm install
npx vercel --prod
```

`npx vercel` will prompt once to link the directory to a project. Accept the
defaults; no environment variables are required, because the entire catalogue is
compiled into the bundle rather than fetched from an external service.

To check it locally first:

```bash
npm install
npm run verify   # typecheck, lint, tests, production build
npm run dev
```

---

## The concept

Six mechanisms of loss, not six subjects:

| Category | Mechanism |
| --- | --- |
| Extinct voices | The animal died |
| Silenced places | The place was altered |
| Obsolete machines | The machine became unnecessary |
| Vanished rituals | The practice was abandoned |
| Lost instruments | The technique was never written down |
| Atmospheric ghosts | The medium itself changed |

Four fidelity grades, in descending order of certainty:

1. **Field recording.** An authentic recording survives.
2. **Restored.** A damaged original survives and has been repaired.
3. **Reconstructed.** No usable recording. Rebuilt by physical modelling.
4. **Speculative.** No primary audio and none likely. An argument, not a record.

The grade drives the visual language. Border style, accent colour and grain
density all change with it, so after a few minutes you can read an entry's
reliability before you read its title.

---

## Routes

### Pages

| Route | What it is |
| --- | --- |
| `/` | Landing. Hero, the fidelity scale, featured entry, categories, timeline preview |
| `/atlas` | Browse with filtering by category, tag and grade, plus five sort orders |
| `/timeline` | Every entry placed on the year its sound was last reliably heard |
| `/categories` | The six mechanisms of loss |
| `/categories/[slug]` | One category, filterable, six of these |
| `/entries/[slug]` | Full entry. Twelve of these |
| `/search` | Search with match explanation and highlight |
| `/method` | How evidence is separated from inference |
| `/contributors` | Who is answerable for each reconstruction |
| `/contact` | Corrections and enquiries |
| `/api-docs` | The API, documented |

Plus `not-found`, `error`, `loading`, `sitemap.xml`, `robots.txt`,
`manifest.webmanifest`, `feed.xml`, `icon` and generated Open Graph images.

### API

| Method | Route |
| --- | --- |
| GET | `/api/health` |
| GET | `/api/content` |
| GET | `/api/content/[slug]` |
| GET | `/api/categories` |
| GET | `/api/search` |
| POST | `/api/contact` |
| GET | `/api/site-config` |
| GET | `/api/timeline` |

Every response uses one envelope:

```json
{ "ok": true,  "data": {}, "meta": {} }
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "" } }
```

Error codes: `BAD_REQUEST`, `VALIDATION`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`,
`PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `INTERNAL`. No message ever contains a
stack trace, a file path or an environment value.

---

## Architecture

```
src/
  content/      entries.ts, categories.ts        the catalogue, data only
  lib/          types, repository, validation,   framework-free domain logic
                signature, api-core, respond,    imports nothing from next
                site                             or react
  components/   13 components                    presentation
  app/          routes                           thin adapters over lib/
tests/          17 suites, 173 tests
```

The important decision is that **nothing in `src/lib/` or `src/content/`
imports from `next` or `react`**, enforced by a test. That is what allows the
entire domain layer, including all eight API handlers, to be executed and tested
without a build step or a single installed dependency.

### Visuals without assets

There are no image files in this repository. Every waveform, spectrogram, social
card and favicon is generated at request time from each entry's `SoundSignature`
using a seeded PRNG, so nothing can 404, nothing needs licensing, and server and
client markup match exactly.

### Audio

`ReconstructionPlayer` synthesises each sound in the browser with WebAudio from
six published parameters: fundamental, partials, attack, decay, noise and
duration. Those six numbers appear on every entry page, so a reader who
disagrees with our reading of the evidence can see precisely which numbers to
argue with. It never autoplays, it is fully keyboard operable, and it has a
written alternative for anyone who cannot or does not want to hear it.

---

## Testing

```bash
npm test
```

173 tests across 17 suites, all runnable with zero dependencies installed:

- **Content**: model invariants, slugs, dates, ordering, draft isolation
- **Repository**: filtering, sorting, related content, neighbours, timeline
- **Search**: diacritic folding, prefix matching, highlighting, escaping
- **Validation**: every field rule, honeypot, rate limiter
- **API**: all eight handlers executed directly, success and every error path
- **Routes**: the real route handler files executed through an alias loader
- **Editorial**: no placeholders, no em or en dashes, sources present on every entry
- **Static analysis**: import resolution, missing exports, `"use client"`
  correctness, Next 15 async params, dead internal links, undefined CSS classes,
  secret patterns

The static analysis suite exists because `tsc` could not be run in the authoring
environment. It is a floor beneath the compiler, not a replacement for it.

---

## Accessibility

- Semantic landmarks, one `h1` per page, no heading level skipped
- Skip link to `main`, which is focusable
- Visible focus ring on every interactive element, never removed
- Navigation is a disclosure with `aria-expanded`, Escape closes it and returns
  focus to the trigger
- Filtering is entirely links, so it works with JavaScript disabled and every
  filtered view is shareable
- Form errors are announced once as a complete list, focus moves to the summary,
  and each field carries `aria-invalid` and `aria-describedby`
- `prefers-reduced-motion` removes every transition and animation
- `prefers-contrast` and `forced-colors` are both handled
- Colour is never the only carrier of meaning; every fidelity grade is labelled
  in text

---

## Known limitations

- The catalogue is compiled into the bundle rather than held in a database.
  Deliberate: it makes every page statically renderable and the whole archive
  survives any backend outage. Contact submissions are validated, rate limited
  and logged, but not persisted.
- Rate limiting is in-process, so it resets on cold start and is per-instance.
  Adequate for a honeypot-backed contact form, not a substitute for a shared
  store at scale.
- Two of the fourteen entries are drafts and are excluded from every public
  surface, which is itself covered by a test.
- Internationalisation is declared in site config but only English content
  exists.
