import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  parseDocument,
  safeParseDocument,
  serializeDocument,
  claimIds,
  findClaim,
  wellKnownUrl,
} from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = readFileSync(
  join(__dirname, "fixtures", "aeo-person.json"),
  "utf-8",
);

describe("parseDocument", () => {
  it("parses the canonical Person example", () => {
    const doc = parseDocument(FIXTURE);
    expect(doc.aeo_version).toBe("0.1");
    expect(doc.entity.type).toBe("Person");
    expect(doc.entity.name).toBe("Miz Causevic");
    expect(doc.claims).toHaveLength(6);
  });

  it("rejects an unknown top-level field", () => {
    const data = JSON.parse(FIXTURE) as Record<string, unknown>;
    data.unexpected_field = "should not parse";
    expect(() => parseDocument(JSON.stringify(data))).toThrow();
  });
});

describe("safeParseDocument", () => {
  it("returns success=true for a valid document string", () => {
    const result = safeParseDocument(FIXTURE);
    expect(result.success).toBe(true);
  });

  it("returns success=false on malformed JSON", () => {
    const result = safeParseDocument("{ not json");
    expect(result.success).toBe(false);
  });
});

describe("claim utilities", () => {
  it("claimIds returns all six claim IDs", () => {
    const doc = parseDocument(FIXTURE);
    expect(claimIds(doc).sort()).toEqual([
      "authored-spec",
      "current-role",
      "live-products",
      "location",
      "primary-stack",
      "years-experience",
    ]);
  });

  it("findClaim locates a claim by ID", () => {
    const doc = parseDocument(FIXTURE);
    const claim = findClaim(doc, "years-experience");
    expect(claim).toBeDefined();
    expect(claim?.predicate).toBe("aeo:yearsOfExperience");
    expect(claim?.value).toBe(30);
  });

  it("findClaim returns undefined for an unknown ID", () => {
    const doc = parseDocument(FIXTURE);
    expect(findClaim(doc, "does-not-exist")).toBeUndefined();
  });
});

describe("round-trip serialization", () => {
  it("preserves entity, claims, and authority", () => {
    const doc = parseDocument(FIXTURE);
    const reSerialized = serializeDocument(doc);
    const reParsed = parseDocument(reSerialized);
    expect(reParsed.entity.name).toBe(doc.entity.name);
    expect(claimIds(reParsed)).toEqual(claimIds(doc));
    expect(reParsed.authority.primary_sources).toEqual(
      doc.authority.primary_sources,
    );
  });
});

describe("wellKnownUrl", () => {
  it("appends the well-known path", () => {
    expect(wellKnownUrl("https://example.com")).toBe(
      "https://example.com/.well-known/aeo.json",
    );
  });

  it("strips trailing slashes", () => {
    expect(wellKnownUrl("https://example.com/")).toBe(
      "https://example.com/.well-known/aeo.json",
    );
    expect(wellKnownUrl("https://example.com////")).toBe(
      "https://example.com/.well-known/aeo.json",
    );
  });
});
