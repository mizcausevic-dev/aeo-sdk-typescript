# Changelog

All notable changes to this project are documented here.

## [0.1.1] - Unreleased

### Fixed
- Enforce HTTPS origin inputs, one same-origin redirect, response size limits, and abort cleanup in discovery fetches.
- Reject missing claim values, duplicate claim IDs, and incomplete signature or endpoint audit blocks.
- Clarify that JSON serialization is not a signing canonicalization.

## Documentation refresh - 2026-05-12

- Updated repository positioning and documentation. No 1.0.0 package release occurred.

## [0.1.0] - 2026-03-11

### Shipped
- Cut the first coherent internal version of **aeo-sdk-typescript** with stable domain objects, review surfaces, and decision outputs.
- Established the first reviewable version of the architecture described as: TypeScript SDK for the AEO Protocol v0.1. Parse, build, validate, and fetch AEO declaration documents. Zod schemas with inferred TypeScript types. ESM-only, Node 18+, zero non-zod runtime deps.
- Focused the repo around actionability instead of passive reporting.

## [Prototype] - 2025-02-20

### Built
- Built the first runnable prototype for the repo's main workflow and decision model.
- Validated the concept against pressure points such as answer-engine discoverability gaps, thin structured data, and inconsistent entity linking.
- Used the prototype phase to test whether the project could drive action, not just present information.

## [Design Phase] - 2022-11-14

### Designed
- Defined the system around operator-first and decision-legible outputs.
- Chose interfaces and examples that made sense for growth, search, content, and analytics teams.
- Avoided reducing the project to a generic dashboard, CRUD app, or fashionable wrapper around the stack.

## [Idea Origin] - 2022-03-14

### Observed
- The original idea surfaced while looking at how teams were handling weak semantic packaging, inconsistent structured data, and poor answer-system discoverability.
- The recurring pattern was that teams had data and tools, but still lacked a usable operating layer for the hardest decisions.

## [Background Signals] - 2022-08-09

### Context
- Earlier platform, governance, and operator-tooling work made one pattern hard to ignore: the systems that create the most drag are often the ones with partial controls and weak operational coherence, not the ones with no controls at all.
- That pattern shaped the thinking behind this repo well before the public version existed.
