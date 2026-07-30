// ─── MIME Type Registry & Magic Bytes ─────────────────────────────────────────
// Central registry for supported file types, extensions, MIME types,
// and magic byte signatures for server-side content verification.
// To add a new file type: add one entry to SUPPORTED_FILE_TYPES.

// ─── Supported File Type Definition ───────────────────────────────────────────

export interface FileTypeDefinition {
  /** File extension (lowercase, no dot) */
  extension: string;
  /** MIME type */
  mimeType: string;
  /** Human-readable label */
  label: string;
  /** Magic byte signature (hex string). null = no magic byte check */
  magicBytes: number[] | null;
  /** Offset in bytes where magic bytes start */
  magicOffset: number;
  /** Lucide icon name for UI */
  icon: string;
}

// ─── File Type Registry ───────────────────────────────────────────────────────

/**
 * Central registry of all supported file types.
 * To add a new type: add one entry here. The rest of the system adapts automatically.
 */
export const SUPPORTED_FILE_TYPES: readonly FileTypeDefinition[] = [
  // Documents
  {
    extension: "pdf",
    mimeType: "application/pdf",
    label: "PDF",
    magicBytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    magicOffset: 0,
    icon: "FileText",
  },
  {
    extension: "docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word (DOCX)",
    magicBytes: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04 (ZIP header)
    magicOffset: 0,
    icon: "FileText",
  },
  {
    extension: "xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    label: "Excel (XLSX)",
    magicBytes: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04 (ZIP header)
    magicOffset: 0,
    icon: "FileSpreadsheet",
  },
  {
    extension: "txt",
    mimeType: "text/plain",
    label: "Metin (TXT)",
    magicBytes: null, // No reliable magic bytes for text files
    magicOffset: 0,
    icon: "FileText",
  },
  {
    extension: "csv",
    mimeType: "text/csv",
    label: "CSV",
    magicBytes: null, // No reliable magic bytes for CSV files
    magicOffset: 0,
    icon: "FileSpreadsheet",
  },

  // Images
  {
    extension: "png",
    mimeType: "image/png",
    label: "PNG",
    magicBytes: [0x89, 0x50, 0x4e, 0x47], // \x89PNG
    magicOffset: 0,
    icon: "Image",
  },
  {
    extension: "jpg",
    mimeType: "image/jpeg",
    label: "JPEG",
    magicBytes: [0xff, 0xd8, 0xff], // \xFF\xD8\xFF
    magicOffset: 0,
    icon: "Image",
  },
  {
    extension: "jpeg",
    mimeType: "image/jpeg",
    label: "JPEG",
    magicBytes: [0xff, 0xd8, 0xff],
    magicOffset: 0,
    icon: "Image",
  },
  {
    extension: "webp",
    mimeType: "image/webp",
    label: "WebP",
    magicBytes: [0x52, 0x49, 0x46, 0x46], // RIFF (followed by WEBP at offset 8)
    magicOffset: 0,
    icon: "Image",
  },
] as const;

// ─── Derived Lookup Tables (computed once) ────────────────────────────────────

/** Set of all supported MIME types */
export const SUPPORTED_MIME_TYPES: ReadonlySet<string> = new Set(
  SUPPORTED_FILE_TYPES.map((ft) => ft.mimeType)
);

/** Set of all supported extensions */
export const SUPPORTED_EXTENSIONS: ReadonlySet<string> = new Set(
  SUPPORTED_FILE_TYPES.map((ft) => ft.extension)
);

/** Extension → MIME type map */
export const EXTENSION_TO_MIME: ReadonlyMap<string, string> = new Map(
  SUPPORTED_FILE_TYPES.map((ft) => [ft.extension, ft.mimeType])
);

/** MIME type → FileTypeDefinition map (first match for duplicates like jpeg/jpg) */
export const MIME_TO_FILE_TYPE: ReadonlyMap<string, FileTypeDefinition> = new Map(
  SUPPORTED_FILE_TYPES.map((ft) => [ft.mimeType, ft])
);

/** Extension → FileTypeDefinition map */
export const EXTENSION_TO_FILE_TYPE: ReadonlyMap<string, FileTypeDefinition> = new Map(
  SUPPORTED_FILE_TYPES.map((ft) => [ft.extension, ft])
);

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Checks if a MIME type is supported.
 */
export function isSupportedMime(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.has(mimeType);
}

/**
 * Checks if a file extension is supported.
 * @param ext — lowercase extension without dot
 */
export function isSupportedExtension(ext: string): boolean {
  return SUPPORTED_EXTENSIONS.has(ext.toLowerCase());
}

/**
 * Extracts file extension from a filename (lowercase, no dot).
 * Returns empty string if no extension found.
 */
export function extractExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Gets the MIME type for a file extension.
 * Falls back to "application/octet-stream" for unknown extensions.
 */
export function mimeFromExtension(ext: string): string {
  return EXTENSION_TO_MIME.get(ext.toLowerCase()) ?? "application/octet-stream";
}

/**
 * Gets the Lucide icon name for a MIME type.
 * Falls back to "File" for unknown types.
 */
export function iconForMime(mimeType: string | null): string {
  if (!mimeType) return "File";
  return MIME_TO_FILE_TYPE.get(mimeType)?.icon ?? "File";
}

/**
 * Detects MIME type from magic bytes in a buffer.
 * Returns null if no match found (caller should fall back to declared MIME).
 */
export function detectMimeFromBytes(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  for (const ft of SUPPORTED_FILE_TYPES) {
    if (!ft.magicBytes) continue;

    const offset = ft.magicOffset;
    if (bytes.length < offset + ft.magicBytes.length) continue;

    let match = true;
    for (let i = 0; i < ft.magicBytes.length; i++) {
      if (bytes[offset + i] !== ft.magicBytes[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      // Special check for WEBP: after RIFF header, bytes 8-11 must be "WEBP"
      if (ft.extension === "webp") {
        if (
          bytes.length >= 12 &&
          bytes[8] === 0x57 && // W
          bytes[9] === 0x45 && // E
          bytes[10] === 0x42 && // B
          bytes[11] === 0x50 // P
        ) {
          return ft.mimeType;
        }
        continue; // RIFF but not WEBP → skip
      }

      return ft.mimeType;
    }
  }

  return null;
}

/**
 * Human-readable file size formatting.
 * @example formatFileSize(1048576) → "1.0 MB"
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
