"use client";

// ─── PDF Thumbnail Bileşeni ───────────────────────────────────────────────────
// react-pdf ile PDF'in ilk sayfasını küçük resim olarak render eder

import { useState, useEffect, useCallback } from "react";
import { storageGetDownloadUrl } from "@/app/actions/storage";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// react-pdf worker ayarı (lazy)
let pdfWorkerConfigured = false;

async function configurePdfWorker() {
  if (pdfWorkerConfigured) return;
  const pdfjs = await import("react-pdf");
  pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  pdfWorkerConfigured = true;
}

interface PdfThumbnailProps {
  objectKey: string;
  className?: string;
  width?: number;
  height?: number;
}

export function PdfThumbnail({
  objectKey,
  className = "",
  width = 48,
  height = 64,
}: PdfThumbnailProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [hata, setHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Presigned URL al
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await storageGetDownloadUrl({ objectKey });
        if (!cancelled && result.success) {
          setPdfUrl(result.url);
        } else {
          setHata(true);
          setYukleniyor(false);
        }
      } catch {
        if (!cancelled) {
          setHata(true);
          setYukleniyor(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [objectKey]);

  // PDF'in ilk sayfasını canvas'a render et → image data
  const renderThumbnail = useCallback(async () => {
    if (!pdfUrl) return;
    try {
      await configurePdfWorker();
      const pdfjs = await import("react-pdf");
      const pdf = await pdfjs.pdfjs.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      setImageData(canvas.toDataURL("image/png"));
      setYukleniyor(false);
    } catch {
      setHata(true);
      setYukleniyor(false);
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfUrl) renderThumbnail();
  }, [pdfUrl, renderThumbnail]);

  if (hata) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 rounded border border-border/50 ${className}`}
        style={{ width, height }}
      >
        <FileText className="h-5 w-5 text-muted-foreground/50" />
      </div>
    );
  }

  if (yukleniyor) {
    return <Skeleton className={`rounded ${className}`} style={{ width, height }} />;
  }

  return (
    <img
      src={imageData!}
      alt="PDF önizleme"
      className={`rounded border border-border/50 object-cover ${className}`}
      style={{ width, height }}
    />
  );
}
