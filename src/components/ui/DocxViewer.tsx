"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, FileWarning } from "lucide-react";

export interface DocxViewerProps {
  /** ArrayBuffer, Blob, File or URL string of the DOCX file */
  file: ArrayBuffer | Blob | File | string | null;
  /** Zoom percentage e.g. 100, 125, 80 */
  zoom?: number;
  /** Custom class name for wrapper */
  className?: string;
  /** Render options for docx-preview */
  options?: {
    breakPages?: boolean;
    ignoreWidth?: boolean;
    ignoreHeight?: boolean;
    experimental?: boolean;
    renderHeaders?: boolean;
    renderFooters?: boolean;
    renderFootnotes?: boolean;
    renderEndnotes?: boolean;
    useBase64URL?: boolean;
    className?: string;
  };
  /** Callback when loading starts */
  onLoadingChange?: (loading: boolean) => void;
  /** Callback when render succeeds */
  onSuccess?: () => void;
  /** Callback when render fails */
  onError?: (err: Error) => void;
}

export function DocxViewer({
  file,
  zoom = 100,
  className = "",
  options = {},
  onLoadingChange,
  onSuccess,
  onError,
}: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDocx() {
      if (!file) {
        if (containerRef.current) containerRef.current.innerHTML = "";
        setError(null);
        setLoading(false);
        onLoadingChange?.(false);
        return;
      }

      setLoading(true);
      onLoadingChange?.(true);
      setError(null);

      try {
        let buffer: ArrayBuffer | Blob;

        if (typeof file === "string") {
          // Fetch file from URL or base64
          const res = await fetch(file);
          if (!res.ok) {
            throw new Error(`Dosya indirilemedi: ${res.statusText} (${res.status})`);
          }
          buffer = await res.arrayBuffer();
        } else if (file instanceof Blob || file instanceof File || file instanceof ArrayBuffer) {
          buffer = file;
        } else {
          throw new Error("Geçersiz dosya formatı.");
        }

        // Dynamically import docx-preview to avoid any SSR issues
        const docxPreview = await import("docx-preview");

        if (!isMounted || !containerRef.current) return;

        // Clear previous content
        containerRef.current.innerHTML = "";

        // Default options merged with user options
        const renderOpts = {
          breakPages: options.breakPages ?? true,
          ignoreWidth: options.ignoreWidth ?? false,
          ignoreHeight: options.ignoreHeight ?? false,
          experimental: options.experimental ?? false,
          className: options.className ?? "docx-content",
          inWrapper: true,
          renderHeaders: options.renderHeaders ?? true,
          renderFooters: options.renderFooters ?? true,
          renderFootnotes: options.renderFootnotes ?? true,
          renderEndnotes: options.renderEndnotes ?? true,
          useBase64URL: options.useBase64URL ?? true,
        };

        await docxPreview.renderAsync(buffer, containerRef.current, undefined, renderOpts);

        if (isMounted) {
          setLoading(false);
          onLoadingChange?.(false);
          onSuccess?.();
        }
      } catch (err: any) {
        console.error("DOCX Önizleme Hatası:", err);
        if (isMounted) {
          const msg = err?.message || "DOCX dosyası ayrıştırılırken beklenmeyen bir hata oluştu.";
          setError(msg);
          setLoading(false);
          onLoadingChange?.(false);
          onError?.(err instanceof Error ? err : new Error(msg));
        }
      }
    }

    loadDocx();

    return () => {
      isMounted = false;
    };
  }, [file, options.breakPages, options.ignoreWidth, options.renderHeaders, options.renderFooters]);

  return (
    <div className={`relative w-full h-full min-h-[400px] flex flex-col overflow-auto ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs transition-opacity duration-200">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            DOCX Belgesi Önizlemeye Hazırlanıyor...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-destructive/5 rounded-xl border border-destructive/20 m-4">
          <div className="p-3 bg-destructive/10 rounded-full text-destructive mb-3">
            <FileWarning className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Belge Yüklenemedi</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
        </div>
      )}

      {/* Document Render Container with Zoom scale */}
      <div
        className="w-full flex-1 flex justify-center p-4 md:p-8 overflow-auto transition-transform duration-150 origin-top"
        style={{
          transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
          width: zoom > 100 ? `${zoom}%` : "100%",
        }}
      >
        <div
          ref={containerRef}
          className="docx-viewer-wrapper shadow-2xl rounded-sm bg-white text-slate-900 border border-slate-200 max-w-full"
        />
      </div>

      {/* Custom Styles for DOCX Render */}
      <style jsx global>{`
        .docx-viewer-wrapper {
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 0 5px rgba(0, 0, 0, 0.05);
          background-color: white !important;
          color: #0f172a !important;
        }

        .docx-viewer-wrapper .docx-content {
          padding: 2.5rem !important;
          min-height: 1000px;
        }

        .docx-viewer-wrapper section.docx {
          margin-bottom: 2rem !important;
          background: white !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1) !important;
          padding: 2rem !important;
          border-radius: 4px !important;
        }

        /* Dark mode adjustments inside docx pages */
        .dark .docx-viewer-wrapper section.docx {
          color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
