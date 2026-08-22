// ─── Storage Configuration ────────────────────────────────────────────────────
// Single source of truth for all B2/S3 storage configuration.
// All values are read from environment variables with strict validation.

import { ConfigurationError } from "./errors";
import type { StorageConfig } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum file size: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Presigned upload URL expiry: 10 minutes */
export const UPLOAD_URL_EXPIRY = 600;

/** Presigned download URL expiry: 1 hour */
export const DOWNLOAD_URL_EXPIRY = 3600;

/** Maximum version count per document */
export const MAX_VERSION_COUNT = 2;

/** Document expiry warning threshold (days) */
export const EXPIRY_WARNING_DAYS = 30;

// ─── Environment Variable Loader ──────────────────────────────────────────────

/**
 * Loads and validates all B2 storage configuration from environment variables.
 * Throws ConfigurationError if any required variable is missing.
 *
 * This function is called lazily — only when a storage operation is performed.
 * It is NOT called at module load time to avoid breaking builds when env vars
 * are not available (e.g., during `next build` on CI).
 */
export function loadStorageConfig(): StorageConfig {
  const endpoint = process.env.B2_ENDPOINT;
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const bucketName = process.env.B2_BUCKET_NAME;
  const region = process.env.B2_BUCKET_REGION;

  const missing: string[] = [];
  if (!endpoint) missing.push("B2_ENDPOINT");
  if (!keyId) missing.push("B2_KEY_ID");
  if (!appKey) missing.push("B2_APP_KEY");
  if (!bucketName) missing.push("B2_BUCKET_NAME");
  if (!region) missing.push("B2_BUCKET_REGION");

  if (missing.length > 0) {
    throw new ConfigurationError(
      `B2 yapılandırması eksik: ${missing.join(", ")} ortam değişkenleri gerekli.`
    );
  }

  const storageClass = process.env.B2_STORAGE_CLASS || process.env.S3_STORAGE_CLASS || undefined;
  const forcePathStyle = process.env.B2_FORCE_PATH_STYLE !== "false";

  return {
    endpoint: endpoint!,
    keyId: keyId!,
    appKey: appKey!,
    bucketName: bucketName!,
    region: region!,
    maxFileSize: MAX_FILE_SIZE,
    uploadUrlExpiry: UPLOAD_URL_EXPIRY,
    downloadUrlExpiry: DOWNLOAD_URL_EXPIRY,
    storageClass,
    forcePathStyle,
  };
}
