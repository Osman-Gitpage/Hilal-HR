// ─── S3 Client Singleton ──────────────────────────────────────────────────────
// Lazy-initialized S3Client configured for Backblaze B2.
// The client is created once and reused across all requests (connection pooling).
// Server-side only — never import this on the client.

import { S3Client } from "@aws-sdk/client-s3";
import { loadStorageConfig } from "./config";
import type { StorageConfig } from "./types";

// ─── Singleton State ──────────────────────────────────────────────────────────

let _client: S3Client | null = null;
let _config: StorageConfig | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the singleton S3Client instance configured for Backblaze B2.
 * Creates the client on first call (lazy initialization).
 *
 * @throws ConfigurationError if required env vars are missing
 */
export function getStorageClient(): S3Client {
  if (!_client) {
    const config = getStorageConfig();
    const endpointUrl =
      config.endpoint.startsWith("http://") || config.endpoint.startsWith("https://")
        ? config.endpoint
        : `https://${config.endpoint}`;

    _client = new S3Client({
      endpoint: endpointUrl,
      region: config.region || "auto",
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.appKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    // Strip x-amz-storage-class header for S3-compatible clusters (Garage, Supabase, etc.)
    // unless explicitly configured via B2_STORAGE_CLASS or S3_STORAGE_CLASS.
    _client.middlewareStack.add(
      (next) => async (args: any) => {
        const request = args.request;
        if (request?.headers) {
          const customClass = process.env.B2_STORAGE_CLASS || process.env.S3_STORAGE_CLASS;
          if (customClass) {
            request.headers["x-amz-storage-class"] = customClass;
          } else {
            delete request.headers["x-amz-storage-class"];
            delete request.headers["X-Amz-Storage-Class"];
            delete request.headers["x-amz-storage-class".toLowerCase()];
          }
        }
        return next(args);
      },
      {
        step: "build",
        name: "handleStorageClassHeader",
        priority: "high",
      }
    );
  }
  return _client;
}

/**
 * Returns the validated storage configuration.
 * Loaded once and cached for subsequent calls.
 *
 * @throws ConfigurationError if required env vars are missing
 */
export function getStorageConfig(): StorageConfig {
  if (!_config) {
    _config = loadStorageConfig();
  }
  return _config;
}

/**
 * Returns the configured bucket name.
 * Convenience shortcut for getStorageConfig().bucketName.
 */
export function getBucketName(): string {
  return getStorageConfig().bucketName;
}

/**
 * Resets the cached client and config.
 * Only used for testing — never call in production.
 */
export function _resetStorageClient(): void {
  if (_client) {
    _client.destroy();
  }
  _client = null;
  _config = null;
}
