"use client";

/**
 * src/components/ui/PdfOnizlemeModal.tsx
 * PDF önizleme modal — iframe ile blob URL gösterir
 */

import { useEffect, useRef } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  blobUrl: string | null;
  yukleniyor: boolean;
  baslik: string;
  dosyaAdi: string;
  onKapat: () => void;
}

export function PdfOnizlemeModal({ blobUrl, yukleniyor, baslik, dosyaAdi, onKapat }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // ESC ile kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKapat]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onKapat(); }}
    >
      <div className="bg-card rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden border">
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
          <span className="font-semibold text-sm">{baslik}</span>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={`${dosyaAdi}.pdf`}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                İndir
              </a>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onKapat}
              id="btn-pdf-modal-kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 relative bg-muted/10">
          {yukleniyor ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">PDF oluşturuluyor…</p>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full rounded-b-2xl"
              title={baslik}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              PDF yüklenemedi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
