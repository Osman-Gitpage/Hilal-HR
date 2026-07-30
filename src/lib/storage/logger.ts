// ─── Storage Logger ───────────────────────────────────────────────────────────
// Structured logging for all storage operations.
// Every upload, download, delete, preview, and error is logged with
// consistent context: user, company, object key, latency, etc.
//
// Currently outputs to console.log/console.error in structured JSON.
// Can be replaced with a centralized logging service (e.g., Datadog, Axiom)
// without changing any consumer code.

import type { StorageLogEntry } from "./types";

// ─── Log Level ────────────────────────────────────────────────────────────────

type LogLevel = "info" | "warn" | "error";

// ─── Core Logger ──────────────────────────────────────────────────────────────

function formatEntry(level: LogLevel, entry: StorageLogEntry): string {
  const parts: string[] = [
    `[STORAGE:${entry.operation.toUpperCase()}]`,
  ];

  if (entry.objectKey) parts.push(`key=${entry.objectKey}`);
  if (entry.bucket) parts.push(`bucket=${entry.bucket}`);
  if (entry.userId) parts.push(`user=${entry.userId}`);
  if (entry.companyId) parts.push(`company=${entry.companyId}`);
  if (entry.fileSize !== undefined) parts.push(`size=${entry.fileSize}`);
  if (entry.latencyMs !== undefined) parts.push(`latency=${entry.latencyMs}ms`);

  if (entry.error) {
    parts.push(`error_code=${entry.error.code}`);
    parts.push(`error_msg=${entry.error.message}`);
  }

  if (entry.details) {
    const detailStr = Object.entries(entry.details)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");
    if (detailStr) parts.push(detailStr);
  }

  return parts.join(" ");
}

function log(level: LogLevel, entry: StorageLogEntry): void {
  const message = formatEntry(level, entry);

  switch (level) {
    case "error":
      console.error(message);
      break;
    case "warn":
      console.warn(message);
      break;
    default:
      console.log(message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Log a successful storage operation */
export function logStorage(entry: StorageLogEntry): void {
  log(entry.error ? "error" : "info", entry);
}

/** Log an upload operation */
export function logUpload(
  objectKey: string,
  userId: string | undefined,
  companyId: string | undefined,
  fileSize: number,
  latencyMs: number,
  bucket?: string
): void {
  logStorage({
    operation: "upload",
    objectKey,
    userId,
    companyId,
    fileSize,
    latencyMs,
    bucket,
  });
}

/** Log a download operation */
export function logDownload(
  objectKey: string,
  userId: string | undefined,
  companyId: string | undefined,
  latencyMs: number,
  bucket?: string
): void {
  logStorage({
    operation: "download",
    objectKey,
    userId,
    companyId,
    latencyMs,
    bucket,
  });
}

/** Log a delete operation */
export function logDelete(
  objectKey: string,
  userId: string | undefined,
  companyId: string | undefined,
  latencyMs: number,
  bucket?: string
): void {
  logStorage({
    operation: "delete",
    objectKey,
    userId,
    companyId,
    latencyMs,
    bucket,
  });
}

/** Log a storage error */
export function logError(
  operation: StorageLogEntry["operation"],
  errorCode: string,
  errorMessage: string,
  objectKey?: string,
  userId?: string,
  companyId?: string
): void {
  logStorage({
    operation,
    objectKey,
    userId,
    companyId,
    error: { code: errorCode, message: errorMessage },
  });
}

/** Log an unauthorized access attempt */
export function logUnauthorized(
  operation: StorageLogEntry["operation"],
  userId: string | undefined,
  companyId: string | undefined,
  objectKey?: string,
  details?: Record<string, unknown>
): void {
  logStorage({
    operation,
    objectKey,
    userId,
    companyId,
    error: { code: "UNAUTHORIZED", message: "Yetkisiz erişim girişimi" },
    details,
  });
}

/**
 * Timer utility for measuring operation latency.
 * @example
 * const timer = startTimer();
 * await doSomething();
 * const ms = timer(); // elapsed ms
 */
export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}
