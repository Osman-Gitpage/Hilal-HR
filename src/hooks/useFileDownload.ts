"use client";

// ─── useFileDownload Hook ────────────────────────────────────────────────────
// Centralized client-side download/preview hook.
// All file viewing/downloading UI components MUST use this hook.
//
// Features:
// - Presigned URL generation via storageGetDownloadUrl action
// - Direct download via anchor element
// - Preview URL generation for iframe/img embedding
// - Loading state management

import { useState, useCallback } from "react";
import { storageGetDownloadUrl } from "@/app/actions/storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DownloadStatus = "idle" | "loading" | "ready" | "error";

export interface FileDownloadState {
  status: DownloadStatus;
  url: string | null;
  error?: string;
}

interface UseFileDownloadReturn {
  /** Get a presigned URL for viewing/embedding */
  getUrl: (objectKey: string) => Promise<string | null>;
  /** Trigger a browser download for the file */
  download: (objectKey: string, fileName: string) => Promise<void>;
  /** Current state */
  state: FileDownloadState;
  /** Reset state */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFileDownload(): UseFileDownloadReturn {
  const [state, setState] = useState<FileDownloadState>({
    status: "idle",
    url: null,
  });

  const reset = useCallback(() => {
    setState({ status: "idle", url: null });
  }, []);

  /**
   * Fetches a presigned download URL for viewing or embedding.
   * Returns the URL string or null on error.
   */
  const getUrl = useCallback(
    async (objectKey: string): Promise<string | null> => {
      setState({ status: "loading", url: null });

      try {
        const result = await storageGetDownloadUrl({ objectKey });

        if (!result.success) {
          setState({ status: "error", url: null, error: result.error });
          return null;
        }

        setState({ status: "ready", url: result.url });
        return result.url;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "URL alınamadı.";
        setState({ status: "error", url: null, error });
        return null;
      }
    },
    []
  );

  /**
   * Triggers a browser download for the given object key.
   * Creates a temporary anchor element to initiate the download.
   */
  const download = useCallback(
    async (objectKey: string, fileName: string): Promise<void> => {
      setState({ status: "loading", url: null });

      try {
        const result = await storageGetDownloadUrl({ objectKey });

        if (!result.success) {
          setState({ status: "error", url: null, error: result.error });
          return;
        }

        // Trigger browser download via hidden anchor
        const link = document.createElement("a");
        link.href = result.url;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setState({ status: "ready", url: result.url });
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "İndirme başlatılamadı.";
        setState({ status: "error", url: null, error });
      }
    },
    []
  );

  return { getUrl, download, state, reset };
}
