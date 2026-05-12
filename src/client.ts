/**
 * HTTP client helpers for the AEO Protocol discovery convention.
 */
import { type AeoDocument, parseDocument } from "./document.js";

const WELL_KNOWN_PATH = "/.well-known/aeo.json";
const ACCEPT_HEADER = "application/aeo+json, application/json";

/** Build the canonical well-known URL for an origin. */
export function wellKnownUrl(origin: string): string {
  return origin.replace(/\/+$/, "") + WELL_KNOWN_PATH;
}

export interface FetchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Fetch and parse the AEO declaration at `origin`'s well-known URL.
 *
 * Throws on non-2xx responses or malformed documents.
 */
export async function fetchWellKnown(
  origin: string,
  options: FetchOptions = {},
): Promise<AeoDocument> {
  const url = wellKnownUrl(origin);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const externalSignal = options.signal;
    if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }

    const response = await fetch(url, {
      headers: { Accept: ACCEPT_HEADER },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `AEO fetch failed: ${response.status} ${response.statusText} (${url})`,
      );
    }

    const text = await response.text();
    return parseDocument(text);
  } finally {
    clearTimeout(timer);
  }
}
