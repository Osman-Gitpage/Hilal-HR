"use client";

// ─── useFileUpload Hook ──────────────────────────────────────────────────────
// Centralized client-side upload hook.
// All upload UI components MUST use this hook.
//
// Features:
// - Client-side pre-validation (for immediate UX feedback)
// - Server-side upload via storageUpload action (full validation there too)
// - Progress tracking
// - Reset and cancel

import { useState, useCallback } from "react";
import { storageUpload } from "@/app/actions/storage";
import { quickValidateFile } from "@/lib/storage/validation";
import type { StorageModule, UploadResult } from "@/lib/storage/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UploadStatus = "idle" | "validating" | "uploading" | "success" | "error";

export interface FileUploadProgress {
  status: UploadStatus;
  percent: number;
  error?: string;
}

interface UseFileUploadOptions {
  /** Storage module (evrak, cari, tersane) */
  module: StorageModule;
  /** Entity identifier (personelId, belgeId, etc.) */
  entityId: string;
  /** Sub-category (kategoriId, "fatura", etc.) */
  category: string;
  /** Called on successful upload */
  onSuccess?: (result: UploadResult) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  /** Upload a file — returns the UploadResult or null on error */
  upload: (file: File) => Promise<UploadResult | null>;
  /** Current upload progress state */
  progress: FileUploadProgress;
  /** Cancel the current upload */
  cancel: () => void;
  /** Reset progress to idle */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { module, entityId, category, onSuccess, onError } = options;

  const [progress, setProgress] = useState<FileUploadProgress>({
    status: "idle",
    percent: 0,
  });

  const reset = useCallback(() => {
    setProgress({ status: "idle", percent: 0 });
  }, []);

  const cancel = useCallback(() => {
    reset();
  }, [reset]);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      // 1. Client-side quick validation (UX only — server validates too)
      setProgress({ status: "validating", percent: 10 });

      const quickError = quickValidateFile(file);
      if (quickError) {
        setProgress({ status: "error", percent: 0, error: quickError });
        onError?.(quickError);
        return null;
      }

      try {
        setProgress({ status: "uploading", percent: 30 });

        // 2. Build FormData for server action
        const formData = new FormData();
        formData.append("file", file);
        formData.append("module", module);
        formData.append("entityId", entityId);
        formData.append("category", category);

        setProgress({ status: "uploading", percent: 60 });

        // 3. Server action handles: auth → validation → key generation → B2 upload → logging
        const result = await storageUpload(formData);

        if (!result.success) {
          throw new Error(result.error);
        }

        // 4. Success
        setProgress({ status: "success", percent: 100 });
        onSuccess?.(result.data);

        return result.data;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Bilinmeyen hata oluştu.";
        setProgress({ status: "error", percent: 0, error });
        onError?.(error);
        return null;
      }
    },
    [module, entityId, category, onSuccess, onError]
  );

  return { upload, progress, cancel, reset };
}
