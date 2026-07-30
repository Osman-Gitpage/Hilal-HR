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
    _client = new S3Client({
      endpoint: `https://${config.endpoint}`,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.appKey,
      },
      forcePathStyle: true,
    });
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
