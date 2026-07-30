// ─── Preview Strategy Resolver ────────────────────────────────────────────────
// Determines how a file should be rendered for preview based on its type.
// Used by DosyaGoruntule and other preview components.

import { extractExtension } from "./mime";
import type { PreviewStrategy } from "./types";

// ─── Extension-based Strategy Maps ────────────────────────────────────────────

const PDF_EXTENSIONS = new Set(["pdf"]);

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg",
]);

const OFFICE_EXTENSIONS = new Set([
  "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx",
]);

const TEXT_EXTENSIONS = new Set([
  "txt", "csv", "md", "json", "xml", "html", "log",
]);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Determines the best preview strategy for a file based on its name/extension.
 *
 * Strategies:
 * - "pdf": Render in iframe with PDF toolbar
 * - "image": Render in <img> tag
 * - "office": Show download button + Office Online link
 * - "text": Show in <pre> or text viewer
 * - "unsupported": Show download-only fallback
 *
 * @param fileName - File name with extension
 * @returns PreviewStrategy enum value
 */
export function resolvePreviewStrategy(fileName: string): PreviewStrategy {
  const ext = extractExtension(fileName);
  if (!ext) return "unsupported";

  if (PDF_EXTENSIONS.has(ext)) return "pdf";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (OFFICE_EXTENSIONS.has(ext)) return "office";
  if (TEXT_EXTENSIONS.has(ext)) return "text";

  return "unsupported";
}

/**
 * Checks if a file can be previewed in the browser (without downloading).
 */
export function isPreviewable(fileName: string): boolean {
  const strategy = resolvePreviewStrategy(fileName);
  return strategy !== "unsupported";
}

/**
 * Checks if a file is an image that can be rendered in an <img> tag.
 */
export function isImageFile(fileName: string): boolean {
  return resolvePreviewStrategy(fileName) === "image";
}

/**
 * Checks if a file is a PDF.
 */
export function isPdfFile(fileName: string): boolean {
  return resolvePreviewStrategy(fileName) === "pdf";
}

/**
 * Checks if a file is an Office document.
 */
export function isOfficeFile(fileName: string): boolean {
  return resolvePreviewStrategy(fileName) === "office";
}
