"use client";

/**
 * src/components/ui/PdfViewerCore.tsx
 * Client-only react-pdf çekirdek bileşeni (SSR güvenli)
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  FileWarning,
  Download,
  ExternalLink,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// PDF.js Worker Configuration (Sadece tarayıcıda çalışır)
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface PdfViewerCoreProps {
  file: string | File | Blob | null;
  dosyaAdi?: string;
  className?: string;
  onDownload?: () => void;
}

export function PdfViewerCore({
  file,
  dosyaAdi = "belge.pdf",
  className = "",
  onDownload,
}: PdfViewerCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [yukleniyor, setYukleniyor] = useState<boolean>(true);
  const [hata, setHata] = useState<string | null>(null);
  const [gorunumModu, setGorunumModu] = useState<"tek" | "hepsi">("tek");

  // Harici S3 / B2 presigned URL'lerinde CORS engeline takılmamak için same-origin proxy kullan
  const resolvedFile = React.useMemo(() => {
    if (!file) return null;
    if (typeof file === "string") {
      if (file.startsWith("blob:") || file.startsWith("data:")) {
        return file;
      }
      if (file.startsWith("http://") || file.startsWith("https://")) {
        if (typeof window !== "undefined" && !file.includes(window.location.host)) {
          return `/api/pdf-proxy?url=${encodeURIComponent(file)}`;
        }
      }
    }
    return file;
  }, [file]);

  // Mouse ile sürükle-bırak pan durumu (Desktop/Pointer)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Touch Pinch-to-zoom ve Double-Tap takibi
  const touchStateRef = useRef<{
    initialDist: number;
    initialScale: number;
    lastTapTime: number;
  }>({
    initialDist: 0,
    initialScale: 1,
    lastTapTime: 0,
  });

  // Konteyner genişliğini dinamik izle
  useEffect(() => {
    if (!containerRef.current) return;

    const guncelleGenislik = () => {
      if (containerRef.current) {
        const genislik = Math.max(containerRef.current.clientWidth - 24, 260);
        setContainerWidth(genislik);
      }
    };

    guncelleGenislik();

    const resizeObserver = new ResizeObserver(() => {
      guncelleGenislik();
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
      setYukleniyor(false);
      setHata(null);
    },
    []
  );

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("PDF yükleme hatası:", err);
    setHata("PDF belgesi yüklenirken veya işlenirken bir sorun oluştu.");
    setYukleniyor(false);
  }, []);

  const oncekiSayfa = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const sonrakiSayfa = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages));
    }
  };

  const yakinlastir = () => {
    setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
  };

  const uzaklastir = () => {
    setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  };

  const sifirlaOlcek = () => {
    setScale(1);
  };

  const dondur = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // ─── Touch Pinch-To-Zoom & Double-Tap ──────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current.initialDist = dist;
      touchStateRef.current.initialScale = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - touchStateRef.current.lastTapTime < 300) {
        setScale((prev) => (prev > 1.2 ? 1 : 1.8));
        touchStateRef.current.lastTapTime = 0;
      } else {
        touchStateRef.current.lastTapTime = now;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.initialDist > 0) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchStateRef.current.initialDist;
      const newScale = Math.min(
        Math.max(
          Number((touchStateRef.current.initialScale * ratio).toFixed(2)),
          0.5
        ),
        3.5
      );
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.initialDist = 0;
  };

  // ─── Mouse Drag-to-Pan (Desktop/Pointer) ──────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1 || !scrollAreaRef.current) return;
    if (e.button !== 0) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollAreaRef.current.scrollLeft,
      scrollTop: scrollAreaRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollAreaRef.current) return;
    e.preventDefault();

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    scrollAreaRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    scrollAreaRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Klavye ok tuşları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") oncekiSayfa();
      if (e.key === "ArrowRight") sonrakiSayfa();
      if (e.key === "+" || e.key === "=") yakinlastir();
      if (e.key === "-") uzaklastir();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages]);

  // Hesaplanan render genişliği
  const renderWidth = Math.round(containerWidth * scale);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full w-full bg-slate-900/5 dark:bg-slate-950/40 relative select-none ${className}`}
    >
      {/* Üst Araç Çubuğu */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-background/95 backdrop-blur border-b z-10 shrink-0 text-xs sm:text-sm overflow-x-auto">
        {/* Sayfa Gezintisi */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={oncekiSayfa}
            disabled={pageNumber <= 1 || yukleniyor || gorunumModu === "hepsi"}
            title="Önceki Sayfa (Sol Ok)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-1 font-medium whitespace-nowrap text-muted-foreground text-[11px] sm:text-xs">
            {gorunumModu === "hepsi" ? (
              <span>Toplam {numPages ?? "..."} Sayfa</span>
            ) : (
              <span>
                <strong className="text-foreground">{pageNumber}</strong> /{" "}
                {numPages ?? "..."}
              </span>
            )}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={sonrakiSayfa}
            disabled={
              !numPages || pageNumber >= numPages || yukleniyor || gorunumModu === "hepsi"
            }
            title="Sonraki Sayfa (Sağ Ok)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Görünüm Modu ve Zoom Kontrolleri */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button
            variant={gorunumModu === "hepsi" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 sm:h-8 px-1.5 sm:px-2 text-[11px] sm:text-xs font-medium"
            onClick={() =>
              setGorunumModu((m) => (m === "tek" ? "hepsi" : "tek"))
            }
            title="Görünüm Modu (Tek / Tüm Sayfalar)"
          >
            {gorunumModu === "hepsi" ? "Tek Sayfa" : "Tüm Sayfalar"}
          </Button>

          <div className="h-4 w-px bg-border mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={uzaklastir}
            disabled={scale <= 0.5 || yukleniyor}
            title="Uzaklaştır (-)"
          >
            <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          <button
            onClick={sifirlaOlcek}
            className="px-1 py-0.5 rounded text-[11px] sm:text-xs font-mono font-medium hover:bg-muted transition-colors"
            title="Genişliğe Sığdır (%100)"
          >
            %{Math.round(scale * 100)}
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={yakinlastir}
            disabled={scale >= 3.5 || yukleniyor}
            title="Yakınlaştır (+)"
          >
            <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:inline-flex"
            onClick={dondur}
            disabled={yukleniyor}
            title="Döndür (90°)"
          >
            <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Doküman İçerik Alanı (Pan & Zoom & Pinch Container) */}
      <div
        ref={scrollAreaRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-auto p-2 sm:p-4 min-h-0 ${
          scale > 1
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        }`}
        style={{
          touchAction: scale > 1 ? "pan-x pan-y pinch-zoom" : "pan-y pinch-zoom",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="flex flex-col items-center justify-start min-w-fit min-h-full mx-auto">
          {resolvedFile ? (
            <Document
              file={resolvedFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground my-auto">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">PDF sayfası oluşturuluyor...</p>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-card rounded-xl border shadow-sm my-auto">
                  <FileWarning className="h-12 w-12 text-amber-500 mb-3" />
                  <h4 className="font-semibold text-sm mb-1">
                    PDF Görüntülenemedi
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    {hata || "Tarayıcınız bu PDF belgesini doğrudan işleyemedi."}
                  </p>
                  <div className="flex items-center gap-2">
                    {typeof file === "string" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => window.open(file, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Yeni Sekmede Aç
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={onDownload}
                      >
                        <Download className="h-3.5 w-3.5" />
                        İndir
                      </Button>
                    )}
                  </div>
                </div>
              }
              className="flex flex-col items-center gap-4 max-w-none"
            >
              {gorunumModu === "tek" ? (
                <div className="shadow-lg rounded-sm overflow-hidden bg-white border border-slate-200 dark:border-slate-800 transition-shadow">
                  <Page
                    pageNumber={pageNumber}
                    width={renderWidth}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="max-w-none"
                  />
                </div>
              ) : (
                numPages &&
                Array.from({ length: numPages }, (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    className="shadow-lg rounded-sm overflow-hidden bg-white border border-slate-200 dark:border-slate-800 mb-4 transition-shadow"
                  >
                    <Page
                      pageNumber={index + 1}
                      width={renderWidth}
                      rotate={rotation}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="max-w-none"
                    />
                    <div className="text-center py-1 text-[11px] text-muted-foreground bg-muted/40 border-t">
                      Sayfa {index + 1} / {numPages}
                    </div>
                  </div>
                ))
              )}
            </Document>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground my-auto">
              <p className="text-sm">Görüntülenecek PDF dosyası bulunamadı.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobilde Zoom İpucu */}
      {scale > 1 && (
        <div className="absolute bottom-3 right-3 pointer-events-none bg-black/75 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur shadow-md animate-in fade-in duration-200">
          <Move className="h-3 w-3" />
          <span>Sürükleyerek gezin</span>
        </div>
      )}
    </div>
  );
}
