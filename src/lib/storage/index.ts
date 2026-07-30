// ─── Storage Module Public API ────────────────────────────────────────────────
// Barrel export — import everything from "@/lib/storage".
//
// Usage examples:
//   import { uploadToB2, getPresignedDownloadUrl, deleteFromB2 } from "@/lib/storage";
//   import { generateObjectKey, sanitizeFileName } from "@/lib/storage";
//   import { validateFile, quickValidateFile } from "@/lib/storage";
//   import { StorageError, UploadError, NoSuchKeyError } from "@/lib/storage";
//   import type { UploadResult, DownloadResult, StorageModule } from "@/lib/storage";

// ─── Core Operations ──────────────────────────────────────────────────────────

export { uploadToB2, uploadBufferToB2 } from "./upload";
export { getPresignedDownloadUrl, downloadToBuffer } from "./download";
export { deleteFromB2, bulkDeleteFromB2 } from "./delete";

// ─── Object Key ───────────────────────────────────────────────────────────────

export {
  generateObjectKey,
  sanitizeFileName,
  extractCompanyIdFromKey,
  keyBelongsToCompany,
} from "./object-key";

// ─── Validation ───────────────────────────────────────────────────────────────

export { validateFile, quickValidateFile } from "./validation";

// ─── MIME / File Types ────────────────────────────────────────────────────────

export {
  SUPPORTED_FILE_TYPES,
  SUPPORTED_MIME_TYPES,
  SUPPORTED_EXTENSIONS,
  isSupportedMime,
  isSupportedExtension,
  extractExtension,
  mimeFromExtension,
  iconForMime,
  detectMimeFromBytes,
  formatFileSize,
} from "./mime";

// ─── Preview ──────────────────────────────────────────────────────────────────

export {
  resolvePreviewStrategy,
  isPreviewable,
  isImageFile,
  isPdfFile,
  isOfficeFile,
} from "./preview";

// ─── Configuration ────────────────────────────────────────────────────────────

export {
  MAX_FILE_SIZE,
  UPLOAD_URL_EXPIRY,
  DOWNLOAD_URL_EXPIRY,
  MAX_VERSION_COUNT,
  EXPIRY_WARNING_DAYS,
} from "./config";

// ─── Client (server-only) ─────────────────────────────────────────────────────

export { getStorageClient, getBucketName, getStorageConfig } from "./client";

// ─── Errors ───────────────────────────────────────────────────────────────────

export {
  StorageError,
  UploadError,
  DownloadError,
  DeleteError,
  ValidationError,
  FileTooLargeError,
  UnsupportedMimeError,
  InvalidFileNameError,
  MagicByteMismatchError,
  AuthorizationError,
  NoSuchKeyError,
  ConfigurationError,
  DatabaseError,
} from "./errors";

// ─── Logger ───────────────────────────────────────────────────────────────────

export {
  logStorage,
  logUpload,
  logDownload,
  logDelete,
  logError,
  logUnauthorized,
  startTimer,
} from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type {
  StorageModule,
  ObjectKeyParams,
  UploadParams,
  UploadResult,
  UploadProgress,
  DownloadParams,
  DownloadResult,
  DeleteParams,
  DeleteResult,
  PreviewStrategy,
  PreviewInfo,
  ValidationOptions,
  ValidationResult,
  StorageLogEntry,
  StorageConfig,
  ActionResult,
} from "./types";

export type { FileTypeDefinition } from "./mime";
