// ─── B2 Download ──────────────────────────────────────────────────────────────
// THE ONLY download function in the entire system.
// Generates presigned GET URLs for file viewing/downloading.
//
// Flow:
// 1. Validate object key format
// 2. Generate presigned GET URL via GetObjectCommand
// 3. Log operation
// 4. Return { url }
//
// The presigned URL is NEVER stored in the database.
// It is generated on-demand and expires after the configured TTL.

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageClient, getBucketName, getStorageConfig } from "./client";
import { DownloadError, NoSuchKeyError } from "./errors";
import { logDownload, logError, startTimer } from "./logger";

// ─── Main Download Function ───────────────────────────────────────────────────

/**
 * Generates a presigned GET URL for downloading/viewing a file from B2.
 * This is the ONLY download entry point — no other code should call GetObjectCommand.
 *
 * The URL is valid for the configured TTL (default: 1 hour).
 * NEVER store this URL in the database — always regenerate on demand.
 *
 * @param objectKey - The B2 object key stored in the database
 * @param userId - Current user ID (for logging)
 * @param companyId - Current company ID (for logging)
 * @param expiresIn - Override URL TTL in seconds (default: from config)
 *
 * @returns Presigned GET URL string
 * @throws DownloadError if URL generation fails
 * @throws NoSuchKeyError if the object doesn't exist (when B2 returns 404)
 */
export async function getPresignedDownloadUrl(params: {
  objectKey: string;
  userId?: string;
  companyId?: string;
  expiresIn?: number;
}): Promise<string> {
  const { objectKey, userId, companyId } = params;
  const timer = startTimer();

  if (!objectKey || objectKey.trim() === "") {
    throw new DownloadError("Object key boş olamaz.", { objectKey });
  }

  try {
    const client = getStorageClient();
    const bucket = getBucketName();
    const config = getStorageConfig();
    const expiresIn = params.expiresIn ?? config.downloadUrlExpiry;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const url = await getSignedUrl(client, command, { expiresIn });

    // Log success
    const latency = timer();
    logDownload(objectKey, userId, companyId, latency, bucket);

    return url;
  } catch (error) {
    const latency = timer();

    // Check for NoSuchKey specifically
    if (
      error instanceof Error &&
      (error.name === "NoSuchKey" ||
        error.message.includes("NoSuchKey") ||
        error.message.includes("The specified key does not exist"))
    ) {
      logError("download", "NO_SUCH_KEY", `Dosya bulunamadı: ${objectKey}`, objectKey, userId, companyId);
      throw new NoSuchKeyError(objectKey);
    }

    // Wrap other errors
    const message =
      error instanceof Error
        ? error.message
        : "İndirme bağlantısı oluşturulurken bilinmeyen hata oluştu.";

    logError("download", "DOWNLOAD_FAILED", message, objectKey, userId, companyId);

    throw new DownloadError(message, {
      objectKey,
      companyId,
      latencyMs: latency,
      originalError: String(error),
    });
  }
}

// ─── Download File to Buffer (Internal) ───────────────────────────────────────

/**
 * Downloads a file from B2 as a Buffer. Used internally by template generators
 * (e.g., ozluk-generator.ts) that need to read files for processing.
 *
 * @param objectKey - The B2 object key
 * @returns File contents as Buffer
 * @throws DownloadError if download fails
 * @throws NoSuchKeyError if the object doesn't exist
 */
export async function downloadToBuffer(params: {
  objectKey: string;
  userId?: string;
  companyId?: string;
}): Promise<Buffer> {
  const { objectKey, userId, companyId } = params;
  const timer = startTimer();

  try {
    const client = getStorageClient();
    const bucket = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw new DownloadError("Dosya içeriği boş.", { objectKey });
    }

    // Convert ReadableStream to Buffer
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);

    const latency = timer();
    logDownload(objectKey, userId, companyId, latency, bucket);

    return buffer;
  } catch (error) {
    if (error instanceof DownloadError || error instanceof NoSuchKeyError) {
      throw error;
    }

    if (
      error instanceof Error &&
      (error.name === "NoSuchKey" ||
        error.message.includes("NoSuchKey"))
    ) {
      logError("download", "NO_SUCH_KEY", `Dosya bulunamadı: ${objectKey}`, objectKey, userId, companyId);
      throw new NoSuchKeyError(objectKey);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Dosya indirilirken bilinmeyen hata oluştu.";

    logError("download", "DOWNLOAD_TO_BUFFER_FAILED", message, objectKey, userId, companyId);

    throw new DownloadError(message, {
      objectKey,
      companyId,
      originalError: String(error),
    });
  }
}
