"use client";

/**
 * src/components/ui/DosyaGoruntule.tsx
 * Ortak dosya görüntüleme dialog — PDF, resim, Office ve diğer formatlar
 * Kullanım: url + dosyaAdi prop'ları ile herhangi bir yerde çağırılabilir.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════

export interface DosyaGoruntuleProps {
  /** Görüntülenecek dosyanın URL'si. null ise dialog kapalıdır. */
  url: string | null;
  /** Dosya adı — uzantıya göre format algılanır. */
  dosyaAdi: string;
  /** Dialog'u kapat callback'i */
  onKapat: () => void;
}

export function DosyaGoruntule({ url, dosyaAdi, onKapat }: DosyaGoruntuleProps) {
  if (!url) return null;

  const ext = dosyaAdi.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext);
  const isOffice = ["doc", "docx", "xls", "xlsx", "csv"].includes(ext);

  const handleIndir = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = dosyaAdi;
    a.click();
  };

  return (
    <Dialog open={!!url} onOpenChange={(open) => !open && onKapat()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-0">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold truncate max-w-[60%]">
            {isPdf && <FileText className="h-4 w-4 shrink-0 text-rose-500" />}
            {isImage && <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />}
            {isOffice && <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-500" />}
            {!isPdf && !isImage && !isOffice && <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="truncate">{dosyaAdi}</span>
          </DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleIndir}>
              <Download className="h-3.5 w-3.5" />
              İndir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => window.open(url, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Yeni Sekmede Aç
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto rounded-lg border bg-muted/20 mt-3">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="w-full h-[70vh] rounded-lg"
              title={dosyaAdi}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center p-4 min-h-[40vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={dosyaAdi}
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          ) : isOffice ? (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[40vh]">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">Office dosyası önizlemesi</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Word ve Excel dosyaları tarayıcıda doğrudan görüntülenemez.
              </p>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="gap-1.5" onClick={handleIndir}>
                  <Download className="h-3.5 w-3.5" />
                  İndir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    window.open(
                      `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Office Online
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[40vh]">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">Önizleme desteklenmiyor</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Bu dosya formatı tarayıcıda görüntülenemez.
              </p>
              <Button variant="default" size="sm" className="gap-1.5" onClick={handleIndir}>
                <Download className="h-3.5 w-3.5" />
                İndir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
