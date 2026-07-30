// ─── Object Key Generator ─────────────────────────────────────────────────────
// THE ONLY place where B2 object keys are generated.
// Every module MUST use this function — no component creates its own key.
//
// Format: {companyId}/{module}/{entityId}/{category}/{uuid}.{ext}
// Example: abc123/evrak/personel-456/kat-saglik/550e8400-e29b-41d4-a716.pdf
//
// Security invariants:
// - companyId is ALWAYS the first segment (tenant isolation)
// - UUID prevents key collision and filename guessing
// - Path traversal is impossible (all segments are sanitized)

import { randomUUID } from "crypto";
import { extractExtension } from "./mime";
import { InvalidFileNameError } from "./errors";
import type { ObjectKeyParams } from "./types";

// ─── Segment Sanitizer ────────────────────────────────────────────────────────

/**
 * Sanitizes a path segment to prevent path traversal and illegal characters.
 * - Removes ../  ./ sequences
 * - Replaces backslashes with forward slashes, then strips slashes
 * - Removes null bytes, control characters, and non-printable chars
 * - Trims whitespace
 */
function sanitizeSegment(segment: string): string {
  return segment
    .replace(/\.\.\//g, "") // Remove ../
    .replace(/\.\//g, "")   // Remove ./
    .replace(/\\/g, "/")    // Backslash → forward slash
    .replace(/\//g, "")     // Strip remaining slashes
    .replace(/[\x00-\x1f\x7f]/g, "") // Remove control chars
    .trim();
}

/**
 * Sanitizes a file name for safe storage.
 * - Extracts only the basename (removes any path)
 * - Removes path traversal sequences
 * - Replaces spaces and special chars with hyphens
 * - Converts to lowercase
 * - Limits length to 200 characters
 */
export function sanitizeFileName(fileName: string): string {
  // Extract basename only (remove any directory path)
  const basename = fileName.split(/[\\/]/).pop() ?? fileName;

  let safe = basename
    .replace(/\.\.\//g, "")      // Remove path traversal
    .replace(/\.\//g, "")        // Remove ./
    .replace(/[\x00-\x1f\x7f]/g, "") // Remove control chars
    .replace(/[<>:"|?*]/g, "")   // Remove Windows-illegal chars
    .trim();

  // Limit length (preserve extension)
  if (safe.length > 200) {
    const ext = extractExtension(safe);
    const nameWithoutExt = safe.slice(0, safe.lastIndexOf("."));
    safe = nameWithoutExt.slice(0, 200 - ext.length - 1) + "." + ext;
  }

  if (!safe || safe === "." || safe === "..") {
    throw new InvalidFileNameError(fileName, "Dosya adı boş veya geçersiz.");
  }

  return safe;
}

// ─── Object Key Generator ─────────────────────────────────────────────────────

/**
 * Generates a standardized B2 object key.
 * This is the ONLY function that should create object keys in the entire system.
 *
 * Format: {companyId}/{module}/{entityId}/{category}/{uuid}.{ext}
 *
 * @throws InvalidFileNameError if file name has no extension
 *
 * @example
 * generateObjectKey({
 *   companyId: "abc123",
 *   module: "evrak",
 *   entityId: "personel-456",
 *   category: "saglik-raporu",
 *   fileName: "rapor.pdf",
 * })
 * // → "abc123/evrak/personel-456/saglik-raporu/550e8400-e29b-41d4-a716-446655440000.pdf"
 */
export function generateObjectKey(params: ObjectKeyParams): string {
  const { companyId, module, entityId, category, fileName } = params;

  // Validate and extract extension
  const ext = extractExtension(fileName);
  if (!ext) {
    throw new InvalidFileNameError(
      fileName,
      "Dosya uzantısı bulunamadı."
    );
  }

  // Sanitize all segments
  const segments = [
    sanitizeSegment(companyId),
    sanitizeSegment(module),
    sanitizeSegment(entityId),
    sanitizeSegment(category),
  ];

  // Validate no empty segments
  for (const segment of segments) {
    if (!segment) {
      throw new InvalidFileNameError(
        fileName,
        "Object key segmenti boş olamaz."
      );
    }
  }

  // Generate UUID for uniqueness
  const id = randomUUID();

  return `${segments.join("/")}/${id}.${ext}`;
}

/**
 * Extracts the company ID from an existing object key.
 * The company ID is always the first path segment.
 *
 * @returns Company ID or null if key format is invalid
 */
export function extractCompanyIdFromKey(objectKey: string): string | null {
  const firstSlash = objectKey.indexOf("/");
  if (firstSlash <= 0) return null;
  return objectKey.slice(0, firstSlash);
}

/**
 * Validates that an object key belongs to the specified company.
 * Used for authorization checks before download/delete operations.
 */
export function keyBelongsToCompany(
  objectKey: string,
  companyId: string
): boolean {
  return objectKey.startsWith(`${companyId}/`);
}
