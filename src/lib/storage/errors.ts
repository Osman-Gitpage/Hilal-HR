// ─── Storage Error Classes ────────────────────────────────────────────────────
// Enterprise-grade typed error hierarchy for the storage module.
// Every storage operation throws a specific error subclass.
// Consumers can catch by class: `catch (e) { if (e instanceof UploadError) ... }`

/**
 * Base error for all storage operations.
 * All other storage errors extend this class.
 */
export class StorageError extends Error {
  /** Machine-readable error code for programmatic handling */
  readonly code: string;
  /** ISO 8601 timestamp when the error occurred */
  readonly timestamp: string;
  /** Optional context data for logging/debugging */
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Preserve prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Structured JSON representation for logging */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

// ─── Upload Errors ────────────────────────────────────────────────────────────

export class UploadError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "UPLOAD_ERROR", context);
    this.name = "UploadError";
  }
}

// ─── Download Errors ──────────────────────────────────────────────────────────

export class DownloadError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DOWNLOAD_ERROR", context);
    this.name = "DownloadError";
  }
}

// ─── Delete Errors ────────────────────────────────────────────────────────────

export class DeleteError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DELETE_ERROR", context);
    this.name = "DeleteError";
  }
}

// ─── Validation Errors ────────────────────────────────────────────────────────

export class ValidationError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", context);
    this.name = "ValidationError";
  }
}

export class FileTooLargeError extends ValidationError {
  /** Actual file size in bytes */
  readonly actualSize: number;
  /** Maximum allowed size in bytes */
  readonly maxSize: number;

  constructor(actualSize: number, maxSize: number) {
    const actualMB = (actualSize / (1024 * 1024)).toFixed(1);
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    super(`Dosya boyutu çok büyük (${actualMB}MB). Maksimum ${maxMB}MB.`, {
      actualSize,
      maxSize,
    });
    this.name = "FileTooLargeError";
    // code is set by super → ValidationError → StorageError
    this.actualSize = actualSize;
    this.maxSize = maxSize;
  }
}

export class UnsupportedMimeError extends ValidationError {
  /** The MIME type that was rejected */
  readonly mimeType: string;

  constructor(mimeType: string) {
    super(
      `Desteklenmeyen dosya formatı: ${mimeType}. PDF, DOCX, XLSX, PNG, JPG, WEBP, TXT veya CSV yükleyin.`,
      { mimeType }
    );
    this.name = "UnsupportedMimeError";
    this.mimeType = mimeType;
  }
}

export class InvalidFileNameError extends ValidationError {
  /** The original file name that was rejected */
  readonly fileName: string;

  constructor(fileName: string, reason: string) {
    super(`Geçersiz dosya adı: ${reason}`, { fileName });
    this.name = "InvalidFileNameError";
    this.fileName = fileName;
  }
}

export class MagicByteMismatchError extends ValidationError {
  /** Declared MIME type from the file header */
  readonly declaredMime: string;
  /** Detected MIME type from magic bytes */
  readonly detectedMime: string | null;

  constructor(declaredMime: string, detectedMime: string | null) {
    super(
      `Dosya içeriği beyan edilen tiple eşleşmiyor. Beyan: ${declaredMime}, Tespit: ${detectedMime ?? "bilinmeyen"}.`,
      { declaredMime, detectedMime }
    );
    this.name = "MagicByteMismatchError";
    this.declaredMime = declaredMime;
    this.detectedMime = detectedMime;
  }
}

// ─── Authorization Errors ─────────────────────────────────────────────────────

export class AuthorizationError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AUTHORIZATION_ERROR", context);
    this.name = "AuthorizationError";
  }
}

// ─── NoSuchKey Error ──────────────────────────────────────────────────────────

export class NoSuchKeyError extends StorageError {
  /** The object key that was not found */
  readonly objectKey: string;

  constructor(objectKey: string) {
    super(`Dosya bulunamadı: ${objectKey}`, "NO_SUCH_KEY", { objectKey });
    this.name = "NoSuchKeyError";
    this.objectKey = objectKey;
  }
}

// ─── Configuration Error ──────────────────────────────────────────────────────

export class ConfigurationError extends StorageError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

// ─── Database Error ───────────────────────────────────────────────────────────

export class DatabaseError extends StorageError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", context);
    this.name = "DatabaseError";
  }
}
