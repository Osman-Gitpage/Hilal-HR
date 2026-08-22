// ─── Storage Module Type Definitions ──────────────────────────────────────────
// All types used across the storage module.
// Domain types (Evrak, BelgeDosya, etc.) remain in their own type files.

// ─── Storage Module ───────────────────────────────────────────────────────────

/** Supported storage modules — determines the path segment in object keys */
export type StorageModule = "evrak" | "cari" | "tersane" | "sirket";

/** Object key generation parameters */
export interface ObjectKeyParams {
  /** Company UUID — always the first path segment for tenant isolation */
  companyId: string;
  /** Module that owns this file */
  module: StorageModule;
  /** Entity identifier (e.g., personelId, belgeId, sablonId) */
  entityId: string;
  /** Sub-category within the entity (e.g., kategoriId, "fatura", "template") */
  category: string;
  /** Original file name — used to extract the extension */
  fileName: string;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/** Upload request parameters for the server action */
export interface UploadParams {
  /** Module that owns this file */
  module: StorageModule;
  /** Entity identifier */
  entityId: string;
  /** Sub-category */
  category: string;
  /** The file to upload (from FormData) */
  file: File;
}

/** Successful upload result */
export interface UploadResult {
  /** Generated B2 object key (stored in DB) */
  objectKey: string;
  /** Sanitized file name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Detected MIME type */
  mimeType: string;
}

/** Client-side upload progress state */
export interface UploadProgress {
  status: "idle" | "validating" | "uploading" | "success" | "error";
  /** 0–100 percentage */
  percent: number;
  /** Error message if status === "error" */
  error?: string;
}

// ─── Download ─────────────────────────────────────────────────────────────────

/** Download request parameters */
export interface DownloadParams {
  /** B2 object key stored in DB */
  objectKey: string;
}

/** Successful download result */
export interface DownloadResult {
  /** Presigned GET URL (1 hour TTL by default) */
  url: string;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/** Delete request parameters */
export interface DeleteParams {
  /** B2 object key to delete */
  objectKey: string;
}

/** Successful delete result */
export interface DeleteResult {
  success: true;
}

// ─── Preview ──────────────────────────────────────────────────────────────────

/** How a file should be rendered for preview */
export type PreviewStrategy = "pdf" | "image" | "office" | "text" | "unsupported";

/** Preview resolution result */
export interface PreviewInfo {
  /** Recommended render strategy */
  strategy: PreviewStrategy;
  /** Presigned URL for the file */
  url: string;
  /** File name */
  fileName: string;
  /** File extension (lowercase, no dot) */
  extension: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** File validation options (all have sensible defaults) */
export interface ValidationOptions {
  /** Max file size in bytes. Default: from config */
  maxSize?: number;
  /** Allowed MIME types. Default: from config (all supported) */
  allowedMimes?: readonly string[];
  /** Whether to check magic bytes. Default: true */
  checkMagicBytes?: boolean;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  /** Sanitized file name (path traversal removed, special chars cleaned) */
  sanitizedName: string;
  /** Detected MIME type */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Error message if not valid */
  error?: string;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/** Log entry for storage operations */
export interface StorageLogEntry {
  /** Operation type */
  operation: "upload" | "download" | "delete" | "preview" | "validation" | "error";
  /** B2 object key (if applicable) */
  objectKey?: string;
  /** B2 bucket name */
  bucket?: string;
  /** User ID (Supabase auth) */
  userId?: string;
  /** Company ID */
  companyId?: string;
  /** Operation duration in milliseconds */
  latencyMs?: number;
  /** File size in bytes */
  fileSize?: number;
  /** Additional context */
  details?: Record<string, unknown>;
  /** Error info if operation failed */
  error?: {
    code: string;
    message: string;
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

/** B2/S3 storage configuration */
export interface StorageConfig {
  /** S3 endpoint URL (e.g., s3.eu-central-003.backblazeb2.com) */
  endpoint: string;
  /** S3 access key ID */
  keyId: string;
  /** S3 secret access key */
  appKey: string;
  /** Bucket name */
  bucketName: string;
  /** Region (e.g., eu-central-003) */
  region: string;
  /** Max file size in bytes */
  maxFileSize: number;
  /** Presigned upload URL expiry in seconds */
  uploadUrlExpiry: number;
  /** Presigned download URL expiry in seconds */
  downloadUrlExpiry: number;
  /** Optional custom storage class override */
  storageClass?: string;
  /** Force path style endpoint access (default: true) */
  forcePathStyle?: boolean;
}

// ─── Server Action Results ────────────────────────────────────────────────────

/** Standard server action success/error union */
export type ActionResult<T> =
  | ({ success: true } & T)
  | { success: false; error: string; code?: string };
