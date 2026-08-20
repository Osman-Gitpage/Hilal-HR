"use client";

/**
 * src/components/ui/PdfOnizlemeModal.tsx
 * PDF önizleme modal — Mobil ve masaüstü uyumlu PDF render
 */

import { useEffect, useRef } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfGoruntuleyici } from "@/components/ui/PdfGoruntuleyici";

interface Props {
  blobUrl: string | null;
  yukleniyor: boolean;
  baslik: string;
  dosyaAdi: string;
  onKapat: () => void;
}

export function PdfOnizlemeModal({
  blobUrl,
  yukleniyor,
  baslik,
  dosyaAdi,
  onKapat,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ESC ile kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKapat]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${dosyaAdi}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onKapat();
      }}
    >
      <div className="bg-card rounded-none sm:rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[100dvh] sm:h-[90vh] overflow-hidden border-0 sm:border animate-in fade-in zoom-in-95 duration-150">
        {/* Başlık ve İşlem Çubuğu */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b bg-muted/40 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="font-semibold text-sm sm:text-base truncate">
              {baslik}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {blobUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs sm:text-sm font-medium"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                <span>İndir</span>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={onKapat}
              id="btn-pdf-modal-kapat"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* İçerik / PDF Görüntüleyici */}
        <div className="flex-1 relative bg-muted/10 min-h-0 overflow-hidden flex flex-col">
          {yukleniyor ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">PDF oluşturuluyor…</p>
            </div>
          ) : blobUrl ? (
            <PdfGoruntuleyici
              file={blobUrl}
              dosyaAdi={dosyaAdi}
              onDownload={handleDownload}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              PDF oluşturulamadı veya yüklenemedi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
