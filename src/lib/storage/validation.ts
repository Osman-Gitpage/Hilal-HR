// ─── Server-Side File Validation ──────────────────────────────────────────────
// Validates files BEFORE uploading to B2.
// This runs on the server (inside Server Actions) — NOT client-only.
//
// Checks performed:
// 1. File size limit
// 2. MIME type allowlist
// 3. Magic bytes verification (file content matches declared MIME)
// 4. File name sanitization & path traversal prevention
// 5. Extension consistency

import { MAX_FILE_SIZE } from "./config";
import {
  isSupportedMime,
  isSupportedExtension,
  extractExtension,
  detectMimeFromBytes,
  mimeFromExtension,
} from "./mime";
import { sanitizeFileName } from "./object-key";
import {
  FileTooLargeError,
  UnsupportedMimeError,
  InvalidFileNameError,
  MagicByteMismatchError,
} from "./errors";
import type { ValidationOptions, ValidationResult } from "./types";

// ─── Main Validation Function ─────────────────────────────────────────────────

/**
 * Performs comprehensive server-side file validation.
 *
 * @param file - The File object from FormData
 * @param options - Optional overrides for max size, allowed MIMEs, etc.
 * @returns ValidationResult with sanitized name and detected MIME
 * @throws FileTooLargeError, UnsupportedMimeError, InvalidFileNameError, MagicByteMismatchError
 */
export async function validateFile(
  file: File,
  options?: ValidationOptions
): Promise<ValidationResult> {
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE;
  const checkMagicBytes = options?.checkMagicBytes ?? true;

  // 1. File size check
  if (file.size > maxSize) {
    throw new FileTooLargeError(file.size, maxSize);
  }

  if (file.size === 0) {
    throw new InvalidFileNameError(file.name, "Dosya boş (0 byte).");
  }

  // 2. Sanitize file name (also checks for empty/path traversal)
  const sanitizedName = sanitizeFileName(file.name);

  // 3. Extract and validate extension
  const extension = extractExtension(sanitizedName);
  if (!extension) {
    throw new InvalidFileNameError(
      file.name,
      "Dosya uzantısı bulunamadı."
    );
  }

  if (!isSupportedExtension(extension)) {
    throw new UnsupportedMimeError(
      `uzantı: .${extension}`
    );
  }

  // 4. MIME type check
  // Use the declared MIME type from the browser, but verify against allowlist
  let mimeType = file.type || mimeFromExtension(extension);

  // If custom allowed MIMEs are provided, check against those
  if (options?.allowedMimes) {
    if (!options.allowedMimes.includes(mimeType)) {
      throw new UnsupportedMimeError(mimeType);
    }
  } else {
    // Use default supported MIME list
    if (!isSupportedMime(mimeType)) {
      // Try to resolve from extension (browsers sometimes report wrong MIME)
      const extMime = mimeFromExtension(extension);
      if (isSupportedMime(extMime)) {
        mimeType = extMime;
      } else {
        throw new UnsupportedMimeError(mimeType);
      }
    }
  }

  // 5. Magic bytes verification (server-side content check)
  if (checkMagicBytes && file.size > 0) {
    // Read first 12 bytes for magic number detection
    const headerSize = Math.min(file.size, 12);
    const headerBuffer = await file.slice(0, headerSize).arrayBuffer();
    const detectedMime = detectMimeFromBytes(headerBuffer);

    if (detectedMime !== null) {
      // We detected a MIME from bytes — verify it's compatible
      // For ZIP-based formats (DOCX/XLSX), magic bytes are the same (PK header),
      // so we accept any Office format when PK is detected.
      const isZipBased =
        detectedMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        detectedMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const declaredIsZipBased =
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      // Allow if both are ZIP-based (DOCX ↔ XLSX share the same magic bytes)
      if (isZipBased && declaredIsZipBased) {
        // OK — same PK header family
      } else if (detectedMime !== mimeType) {
        // For image formats, JPEG and PNG must match exactly
        throw new MagicByteMismatchError(mimeType, detectedMime);
      }
    }
    // If detectedMime is null, it means no magic bytes match (e.g., text files)
    // This is OK — we rely on the declared MIME + extension check.
  }

  return {
    valid: true,
    sanitizedName,
    mimeType,
    extension,
  };
}

// ─── Client-Side Quick Validation ─────────────────────────────────────────────

/**
 * Quick client-side validation for immediate UI feedback.
 * This is NOT a security measure — server-side validation is always performed.
 *
 * @returns Error message string, or null if valid
 */
export function quickValidateFile(
  file: File,
  maxSize?: number
): string | null {
  const limit = maxSize ?? MAX_FILE_SIZE;

  if (file.size > limit) {
    const maxMB = (limit / (1024 * 1024)).toFixed(0);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return `Dosya boyutu çok büyük (${fileMB}MB). Maksimum ${maxMB}MB.`;
  }

  if (file.size === 0) {
    return "Dosya boş (0 byte).";
  }

  const ext = extractExtension(file.name);
  if (!ext || !isSupportedExtension(ext)) {
    return "Desteklenmeyen dosya formatı. PDF, DOCX, XLSX, PNG, JPG, WEBP, TXT veya CSV yükleyin.";
  }

  return null;
}
