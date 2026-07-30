"use server";

// ─── Centralized Storage Server Actions ───────────────────────────────────────
// THE ONLY server actions for file upload/download/delete.
// Every component MUST use these actions — no direct B2 calls from components.
//
// Auth check + company isolation + audit logging built in.

import { getAuthContext } from "@/lib/auth/context";
import {
  uploadToB2,
  getPresignedDownloadUrl,
  deleteFromB2,
  keyBelongsToCompany,
} from "@/lib/storage";
import type { StorageModule, UploadResult } from "@/lib/storage";
import { logUnauthorized } from "@/lib/storage";

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Authenticated file upload.
 * Validates file, generates object key, uploads to B2, and returns the key.
 *
 * Usage from client:
 *   const formData = new FormData();
 *   formData.append("file", file);
 *   formData.append("module", "evrak");
 *   formData.append("entityId", "personel-123");
 *   formData.append("category", "saglik-raporu");
 *   const result = await storageUpload(formData);
 */
export async function storageUpload(
  formData: FormData
): Promise<
  | { success: true; data: UploadResult }
  | { success: false; error: string }
> {
  try {
    const { user, sirketId } = await getAuthContext();

    // Extract form data
    const file = formData.get("file") as File;
    const storageModule = formData.get("module") as StorageModule;
    const entityId = formData.get("entityId") as string;
    const category = formData.get("category") as string;

    if (!file) {
      return { success: false, error: "Dosya eksik." };
    }
    if (!storageModule || !entityId || !category) {
      return {
        success: false,
        error: "Eksik parametreler: module, entityId ve category gerekli.",
      };
    }

    // Upload with full validation
    const result = await uploadToB2({
      file,
      module: storageModule,
      entityId,
      category,
      companyId: sirketId,
      userId: user.id,
    });

    return { success: true, data: result };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Dosya yüklenirken hata oluştu.";
    console.error("[storageUpload]", message, err);
    return { success: false, error: message };
  }
}

// ─── Download URL ─────────────────────────────────────────────────────────────

/**
 * Authenticated presigned download URL generation.
 * Verifies the object key belongs to the user's company before generating URL.
 */
export async function storageGetDownloadUrl(params: {
  objectKey: string;
}): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const { user, sirketId } = await getAuthContext();

    // Authorization: verify object key belongs to this company
    if (!keyBelongsToCompany(params.objectKey, sirketId)) {
      logUnauthorized("download", user.id, sirketId, params.objectKey);
      return {
        success: false,
        error: "Bu dosyaya erişim yetkiniz yok.",
      };
    }

    const url = await getPresignedDownloadUrl({
      objectKey: params.objectKey,
      userId: user.id,
      companyId: sirketId,
    });

    return { success: true, url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "İndirme bağlantısı oluşturulamadı.";
    console.error("[storageGetDownloadUrl]", message, err);
    return { success: false, error: message };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Authenticated file deletion.
 * Verifies the object key belongs to the user's company before deleting.
 */
export async function storageDelete(params: {
  objectKey: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { user, sirketId } = await getAuthContext();

    // Authorization: verify object key belongs to this company
    if (!keyBelongsToCompany(params.objectKey, sirketId)) {
      logUnauthorized("delete", user.id, sirketId, params.objectKey);
      return {
        success: false,
        error: "Bu dosyayı silme yetkiniz yok.",
      };
    }

    await deleteFromB2({
      objectKey: params.objectKey,
      userId: user.id,
      companyId: sirketId,
    });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Dosya silinirken hata oluştu.";
    console.error("[storageDelete]", message, err);
    return { success: false, error: message };
  }
}
