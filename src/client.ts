/**
 * HTTP client helpers for the AEO Protocol discovery convention.
 */
import { type AeoDocument, parseDocument } from "./document.js";

const WELL_KNOWN_PATH = "/.well-known/aeo.json";
const ACCEPT_HEADER = "application/aeo+json, application/json";
const DEFAULT_MAX_BYTES = 1_048_576;

function parseOrigin(origin: string): URL {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    throw new TypeError("AEO origin must be an absolute HTTPS origin URL");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !/^\/*$/.test(url.pathname) ||
    url.search ||
    url.hash
  ) {
    throw new TypeError("AEO origin must be an HTTPS origin without credentials, path, query, or fragment");
  }
  return url;
}

/** Build the canonical well-known URL for an origin. */
export function wellKnownUrl(origin: string): string {
  return parseOrigin(origin).origin + WELL_KNOWN_PATH;
}

export interface FetchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  maxBytes?: number;
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) throw new Error("AEO response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error("AEO response exceeds size limit");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }
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
  let url = wellKnownUrl(origin);
  const expectedOrigin = new URL(url).origin;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new RangeError("AEO timeoutMs and maxBytes must be positive finite numbers");
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();

  try {
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }

    for (let redirects = 0; redirects <= 1; redirects++) {
      const response = await fetch(url, {
        headers: { Accept: ACCEPT_HEADER },
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status === 301 || response.status === 302) {
        const location = response.headers.get("location");
        if (!location || redirects === 1) throw new Error("AEO redirect limit exceeded");
        const destination = new URL(location, url);
        if (destination.origin !== expectedOrigin) throw new Error("AEO cross-origin redirect refused");
        if (destination.username || destination.password) throw new Error("AEO redirect credentials refused");
        url = destination.href;
        continue;
      }

      if (!response.ok) {
        throw new Error(`AEO fetch failed: ${response.status} ${response.statusText} (${url})`);
      }
      return parseDocument(await readLimited(response, maxBytes));
    }
    throw new Error("AEO redirect limit exceeded");
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}
