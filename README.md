# aeo-sdk-typescript

TypeScript SDK for the [AEO Protocol v0.1](https://github.com/mizcausevic-dev/aeo-protocol-spec) — parse, build, validate, and fetch AEO declaration documents. Zero-runtime-cost types via [zod](https://github.com/colinhacks/zod).

## Install

```bash
npm install @mizcausevic-dev/aeo-protocol
```

## Quickstart

```typescript
import { fetchWellKnown, parseDocument, claimIds, findClaim } from "@mizcausevic-dev/aeo-protocol";

// Fetch and parse from a live well-known URL
const doc = await fetchWellKnown("https://mizcausevic-dev.github.io");
console.log(doc.entity.name);                          // "Miz Causevic"
console.log(claimIds(doc));                            // ['current-role', ...]
console.log(findClaim(doc, "years-experience")?.value); // 30

// Parse from a string
const docFromString = parseDocument('{"aeo_version":"0.1",...}');

// Validate safely
import { safeParseDocument } from "@mizcausevic-dev/aeo-protocol";
const result = safeParseDocument(maybeMalformed);
if (!result.success) console.error(result.error);
```

## What it does

- **Parse** — `parseDocument(raw)` and `safeParseDocument(value)` for strict and recoverable parsing
- **Build** — full zod schemas (`documentSchema`, `entitySchema`, etc.) and inferred TypeScript types (`AeoDocument`, `Entity`, `Claim`, ...)
- **Serialize** — `serializeDocument(doc, indent)` returns canonical JSON
- **Fetch** — `fetchWellKnown(origin, { timeoutMs })` discovers and parses against `/.well-known/aeo.json` with `Accept: application/aeo+json, application/json`
- **Query** — `claimIds(doc)` and `findClaim(doc, id)` for convenience

## Conformance

Supports the AEO Protocol at **conformance Level 1 (Declare)**. Signature verification (L2) and audit-endpoint posting (L3) deferred to v0.2.

## TypeScript types

Every model has both a zod schema and an inferred type. Import either:

```typescript
import { documentSchema, type AeoDocument } from "@mizcausevic-dev/aeo-protocol";

const validated: AeoDocument = documentSchema.parse(someUnknown);
```

## Dependencies

- [zod](https://github.com/colinhacks/zod) `^3.23` — runtime validation + type inference
- Native `fetch` (Node 18+, all modern browsers and runtimes)

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Specification

Full spec at [github.com/mizcausevic-dev/aeo-protocol-spec](https://github.com/mizcausevic-dev/aeo-protocol-spec).

## License

AGPL-3.0.

## Kinetic Gain Protocol Suite

| Spec | Implementation |
|---|---|
| [AEO Protocol](https://github.com/mizcausevic-dev/aeo-protocol-spec) | [aeo-sdk-python](https://github.com/mizcausevic-dev/aeo-sdk-python) · **aeo-sdk-typescript** (this) · [aeo-sdk-rust](https://github.com/mizcausevic-dev/aeo-sdk-rust) · [aeo-sdk-go](https://github.com/mizcausevic-dev/aeo-sdk-go) · [aeo-cli](https://github.com/mizcausevic-dev/aeo-cli) · [aeo-crawler](https://github.com/mizcausevic-dev/aeo-crawler) |
| [Prompt Provenance](https://github.com/mizcausevic-dev/prompt-provenance-spec) | — |
| [Agent Cards](https://github.com/mizcausevic-dev/agent-cards-spec) | — |
| [AI Evidence Format](https://github.com/mizcausevic-dev/ai-evidence-format-spec) | — |
| [MCP Tool Cards](https://github.com/mizcausevic-dev/mcp-tool-card-spec) | — |

---

**Connect:** [LinkedIn](https://www.linkedin.com/in/mirzacausevic/) · [Kinetic Gain](https://kineticgain.com) · [Medium](https://medium.com/@mizcausevic/) · [Skills](https://mizcausevic.com/skills/)
