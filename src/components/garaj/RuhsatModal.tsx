"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Arac } from "./types";
import { ZoomIn, ZoomOut, RotateCcw, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RuhsatModalProps {
  arac: Arac;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RuhsatModal({ arac, open, onOpenChange }: RuhsatModalProps) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setScale(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[94vh] flex flex-col bg-zinc-950 text-white border border-zinc-800 rounded-3xl p-0 shadow-2xl overflow-hidden">
        {/* ── Modal Başlığı ve Kontroller (Responsive) ── */}
        <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/95 shrink-0 pr-12">
          <div className="space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 flex-wrap">
              <span>Araç Ruhsat Görseli</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200">
                {arac.plaka}
              </span>
            </DialogTitle>
            <p className="text-xs text-zinc-400">
              {arac.marka} {arac.model} • Resmi Tescil Belgesi Taraması
            </p>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Yakınlaştırma Araçları */}
            <div className="flex items-center bg-zinc-800/90 rounded-xl p-0.5 border border-zinc-700">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="h-7 w-7 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg"
                title="Küçült"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[11px] font-mono px-1.5 text-zinc-400 min-w-[40px] text-center">
                %{Math.round(scale * 100)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="h-7 w-7 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg"
                title="Büyüt"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                className="h-7 w-7 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg"
                title="Sıfırla"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>

            {/* Yazdır */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 text-xs gap-1.5 rounded-xl border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Yazdır</span>
            </Button>

            {/* İndir */}
            <a
              href="/ruhsat-ornek.svg"
              download={`${arac.plaka}-ruhsat.svg`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">İndir</span>
            </a>
          </div>
        </DialogHeader>

        {/* ── Ruhsat Belgesi Fotoğrafı / Taraması Alanı ── */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-zinc-950/80 flex items-center justify-center min-h-[360px] sm:min-h-[480px]">
          <div
            className="transition-transform duration-200 ease-out origin-center w-full max-w-4xl"
            style={{ transform: `scale(${scale})` }}
          >
            <div className="relative w-full aspect-[1200/800] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900">
              <Image
                src="/ruhsat-ornek.svg"
                alt={`${arac.plaka} Araç Ruhsat Belgesi Fotoğrafı`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
