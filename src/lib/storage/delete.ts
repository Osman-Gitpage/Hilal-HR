// ─── B2 Delete ────────────────────────────────────────────────────────────────
// THE ONLY delete functions in the entire system.
// Every module MUST use these for file deletion.
//
// Delete order (enforced):
// 1. Delete from B2
// 2. Delete from Database (caller's responsibility)
// 3. Clear cache (caller's responsibility)
// 4. Log operation

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getStorageClient, getBucketName } from "./client";
import { DeleteError } from "./errors";
import { logDelete, logError, startTimer } from "./logger";

// ─── Single File Delete ───────────────────────────────────────────────────────

/**
 * Deletes a single file from B2.
 * This is the ONLY delete entry point — no other code should call DeleteObjectCommand.
 *
 * IMPORTANT: Call this BEFORE deleting the database record.
 * If B2 deletion fails, the DB record should remain so retries are possible.
 *
 * @param objectKey - The B2 object key to delete
 * @param userId - Current user ID (for logging)
 * @param companyId - Current company ID (for logging)
 *
 * @throws DeleteError if B2 deletion fails
 */
export async function deleteFromB2(params: {
  objectKey: string;
  userId?: string;
  companyId?: string;
}): Promise<void> {
  const { objectKey, userId, companyId } = params;
  const timer = startTimer();

  if (!objectKey || objectKey.trim() === "") {
    throw new DeleteError("Object key boş olamaz.", { objectKey });
  }

  try {
    const client = getStorageClient();
    const bucket = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    await client.send(command);

    // Log success
    const latency = timer();
    logDelete(objectKey, userId, companyId, latency, bucket);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Dosya silinirken bilinmeyen hata oluştu.";

    logError("delete", "DELETE_FAILED", message, objectKey, userId, companyId);

    throw new DeleteError(message, {
      objectKey,
      companyId,
      originalError: String(error),
    });
  }
}

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

/**
 * Deletes multiple files from B2.
 * Attempts to delete all files — failed deletions are logged but don't stop others.
 *
 * @param objectKeys - Array of B2 object keys to delete
 * @param userId - Current user ID (for logging)
 * @param companyId - Current company ID (for logging)
 *
 * @returns Object with counts of successful and failed deletions, plus failed keys
 */
export async function bulkDeleteFromB2(params: {
  objectKeys: string[];
  userId?: string;
  companyId?: string;
}): Promise<{
  succeeded: number;
  failed: number;
  failedKeys: string[];
}> {
  const { objectKeys, userId, companyId } = params;

  let succeeded = 0;
  let failed = 0;
  const failedKeys: string[] = [];

  for (const key of objectKeys) {
    try {
      await deleteFromB2({ objectKey: key, userId, companyId });
      succeeded++;
    } catch {
      failed++;
      failedKeys.push(key);
      // Error is already logged inside deleteFromB2
    }
  }

  return { succeeded, failed, failedKeys };
}
