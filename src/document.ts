/**
 * Zod schemas and inferred types for AEO Protocol v0.1 documents.
 *
 * Specification: https://github.com/mizcausevic-dev/aeo-protocol-spec
 */
import { z } from "zod";

export const PROTOCOL_VERSION = "0.1" as const;

export const entityTypeSchema = z.enum([
  "Person",
  "Organization",
  "Product",
  "Place",
  "Concept",
]);
export type EntityType = z.infer<typeof entityTypeSchema>;

export const verificationTypeSchema = z.enum([
  "domain",
  "dns",
  "github",
  "linkedin",
  "gpg",
  "well-known-uri",
]);
export type VerificationType = z.infer<typeof verificationTypeSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const auditModeSchema = z.enum(["none", "signature", "endpoint"]);
export type AuditMode = z.infer<typeof auditModeSchema>;

export const entitySchema = z
  .object({
    id: z.string().url(),
    type: entityTypeSchema,
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).optional(),
    canonical_url: z.string().url(),
  })
  .strict();
export type Entity = z.infer<typeof entitySchema>;

export const verificationSchema = z
  .object({
    type: verificationTypeSchema,
    value: z.string().min(1),
    proof_uri: z.string().url().optional(),
  })
  .strict();
export type Verification = z.infer<typeof verificationSchema>;

export const authoritySchema = z
  .object({
    primary_sources: z.array(z.string().url()).min(1),
    evidence_links: z.array(z.string().url()).optional(),
    verifications: z.array(verificationSchema).optional(),
  })
  .strict();
export type Authority = z.infer<typeof authoritySchema>;

export const claimSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
    predicate: z.string().min(1),
    value: z.unknown(),
    evidence: z.array(z.string().url()).optional(),
    valid_from: z.string().date().optional(),
    valid_until: z.union([z.string().date(), z.null()]).optional(),
    confidence: confidenceSchema.default("high"),
  })
  .strict();
export type Claim = z.infer<typeof claimSchema>;

export const citationPreferencesSchema = z
  .object({
    preferred_attribution: z.string().optional(),
    canonical_links: z.array(z.string().url()).optional(),
    do_not_cite: z.array(z.string().url()).optional(),
  })
  .strict();
export type CitationPreferences = z.infer<typeof citationPreferencesSchema>;

export const answerConstraintsSchema = z
  .object({
    must_include: z.array(z.string()).optional(),
    must_not_include: z.array(z.string()).optional(),
    freshness_window_days: z.number().int().min(1).optional(),
  })
  .strict();
export type AnswerConstraints = z.infer<typeof answerConstraintsSchema>;

export const auditSchema = z
  .object({
    mode: auditModeSchema,
    signing_key_uri: z.string().url().optional(),
    signature: z.string().optional(),
    endpoint_uri: z.string().url().optional(),
    endpoint_schema: z.string().url().optional(),
  })
  .strict();
export type Audit = z.infer<typeof auditSchema>;

export const documentSchema = z
  .object({
    aeo_version: z.literal("0.1"),
    entity: entitySchema,
    authority: authoritySchema,
    claims: z.array(claimSchema).min(1),
    citation_preferences: citationPreferencesSchema.optional(),
    answer_constraints: answerConstraintsSchema.optional(),
    audit: auditSchema.optional(),
  })
  .strict();
export type AeoDocument = z.infer<typeof documentSchema>;

/** Parse a JSON string into an AeoDocument. Throws ZodError on invalid input. */
export function parseDocument(raw: string): AeoDocument {
  const data = JSON.parse(raw);
  return documentSchema.parse(data);
}

/** Validate an unknown value as an AeoDocument. Returns a typed result. */
export function safeParseDocument(value: unknown) {
  if (typeof value === "string") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch (err) {
      return { success: false as const, error: err };
    }
    return documentSchema.safeParse(parsed);
  }
  return documentSchema.safeParse(value);
}

/** Serialize an AeoDocument to canonical JSON. */
export function serializeDocument(doc: AeoDocument, indent = 2): string {
  return JSON.stringify(doc, null, indent);
}

/** Return the IDs of all claims in a document. */
export function claimIds(doc: AeoDocument): string[] {
  return doc.claims.map((c) => c.id);
}

/** Find a claim by its ID, or undefined if not present. */
export function findClaim(doc: AeoDocument, id: string): Claim | undefined {
  return doc.claims.find((c) => c.id === id);
}
