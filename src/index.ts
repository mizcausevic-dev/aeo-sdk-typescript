/**
 * TypeScript SDK for the AEO Protocol v0.1.
 *
 * Specification: https://github.com/mizcausevic-dev/aeo-protocol-spec
 */
export {
  PROTOCOL_VERSION,
  type AeoDocument,
  type AnswerConstraints,
  type Audit,
  type AuditMode,
  type Authority,
  type CitationPreferences,
  type Claim,
  type Confidence,
  type Entity,
  type EntityType,
  type Verification,
  type VerificationType,
  documentSchema,
  entitySchema,
  authoritySchema,
  claimSchema,
  verificationSchema,
  auditSchema,
  citationPreferencesSchema,
  answerConstraintsSchema,
  parseDocument,
  safeParseDocument,
  serializeDocument,
  claimIds,
  findClaim,
} from "./document.js";
export { fetchWellKnown, wellKnownUrl, type FetchOptions } from "./client.js";

export const SDK_VERSION = "0.1.0";
