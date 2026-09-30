import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  parseDocument,
  safeParseDocument,
  serializeDocument,
  claimIds,
  findClaim,
  wellKnownUrl,
  fetchWellKnown,
} from "../src/index.js";

afterEach(() => vi.restoreAllMocks());

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

  it("rejects claims without values or with duplicate IDs", () => {
    const missingValue = JSON.parse(FIXTURE) as { claims: Array<Record<string, unknown>> };
    delete missingValue.claims[0]!.value;
    expect(() => parseDocument(JSON.stringify(missingValue))).toThrow();

    const duplicate = JSON.parse(FIXTURE) as { claims: Array<Record<string, unknown>> };
    duplicate.claims[1]!.id = duplicate.claims[0]!.id;
    expect(() => parseDocument(JSON.stringify(duplicate))).toThrow();
  });

  it("rejects unsigned signature and endpoint audit modes", () => {
    for (const mode of ["signature", "endpoint"]) {
      const data = JSON.parse(FIXTURE) as Record<string, unknown>;
      data.audit = mode === "endpoint"
        ? { mode, endpoint_uri: "https://example.com/audit" }
        : { mode };
      expect(() => parseDocument(JSON.stringify(data))).toThrow();
    }
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

  it("rejects non-origin and non-HTTPS inputs", () => {
    for (const origin of [
      "http://example.com",
      "https://user:pass@example.com",
      "https://example.com/path",
      "https://example.com/?q=1",
      "https://example.com/#fragment",
      "file:///etc/passwd",
    ]) {
      expect(() => wellKnownUrl(origin)).toThrow();
    }
  });
});

describe("fetchWellKnown", () => {
  it("parses a bounded HTTPS response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(FIXTURE));
    const doc = await fetchWellKnown("https://example.com");
    expect(doc.entity.type).toBe("Person");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/.well-known/aeo.json",
      expect.objectContaining({ redirect: "manual" }),
    );
  });

  it("allows one same-origin redirect", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: "/canonical.json" },
      }))
      .mockResolvedValueOnce(new Response(FIXTURE));
    await fetchWellKnown("https://example.com");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://example.com/canonical.json");
  });

  it("refuses cross-origin and repeated redirects", async () => {
    const redirect = new Response(null, {
      status: 301,
      headers: { location: "https://other.example/aeo.json" },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(redirect);
    await expect(fetchWellKnown("https://example.com")).rejects.toThrow("cross-origin");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockReset().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: "/again" },
    }));
    await expect(fetchWellKnown("https://example.com")).rejects.toThrow("redirect limit");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuses credentials introduced by a redirect", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: "https://user:pass@example.com/aeo.json" },
    }));
    await expect(fetchWellKnown("https://example.com")).rejects.toThrow("credentials refused");
  });

  it("rejects oversized responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(FIXTURE));
    await expect(fetchWellKnown("https://example.com", { maxBytes: 16 }))
      .rejects.toThrow("size limit");
  });
});
