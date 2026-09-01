"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ServisKaydi } from "./types";
import {
  Wrench,
  Calendar,
  Gauge,
  Building2,
  Receipt,
  FileText,
  Eye,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ServisDetayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servis?: ServisKaydi | null;
  plaka: string;
}

export function ServisDetayModal({
  open,
  onOpenChange,
  servis,
  plaka,
}: ServisDetayModalProps) {
  const [belgeOnizlemeAcik, setBelgeOnizlemeAcik] = useState(false);

  if (!servis) return null;

  const handleBelgeGoruntule = () => {
    if (servis.faturaDosyaUrl) {
      window.open(servis.faturaDosyaUrl, "_blank");
    } else {
      setBelgeOnizlemeAcik(true);
      toast.info(`${servis.faturaDosyaAdi} faturası açıldı.`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[94vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="flex flex-row items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {servis.islemTuru}
                </DialogTitle>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                  {plaka}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Servis & Tamir Harcama Detay Fişi
              </p>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Tutar Vitrini */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Ödenen Masraf Tutarı:
              </span>
              <span className="font-mono font-extrabold text-lg text-blue-900 dark:text-blue-200">
                {servis.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </span>
            </div>

            {/* Detay Tablosu */}
            <div className="space-y-2.5 divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>İşlem Tarihi:</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {servis.tarih}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>İşlem Kilometresi:</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {servis.km.toLocaleString("tr-TR")} KM
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Servis / Firma:</span>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {servis.servisAdi}
                </span>
              </div>

              {servis.faturaNo && (
                <div className="flex items-center justify-between pt-2.5">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Fatura / Fiş No:</span>
                  </div>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {servis.faturaNo}
                  </span>
                </div>
              )}
            </div>

            {/* Açıklama / Yapılan İşlemler */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                Yapılan İşlemler & Parça Notları
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                {servis.aciklama}
              </p>
            </div>

            {/* Fatura Dosya Eki & Belgeyi Görüntüle Butonu */}
            {servis.faturaDosyaAdi && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between gap-2.5 min-w-0 w-full overflow-hidden">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p
                      className="font-bold text-emerald-950 dark:text-emerald-200 truncate text-xs block"
                      title={servis.faturaDosyaAdi}
                    >
                      {servis.faturaDosyaAdi}
                    </p>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400 truncate">
                      Fatura Belgesi Eklendi
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleBelgeGoruntule}
                  className="rounded-xl h-8 text-xs gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950 shrink-0 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Görüntüle
                </Button>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs h-9 px-5 font-semibold"
              >
                Kapat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Belge Önizleme Modal (Görsel veya Dummy Fatura Şablonu) */}
      <Dialog open={belgeOnizlemeAcik} onOpenChange={setBelgeOnizlemeAcik}>
        <DialogContent className="w-[94vw] sm:max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                {servis.faturaDosyaAdi}
              </DialogTitle>
            </div>
          </DialogHeader>

          {servis.faturaDosyaUrl ? (
            <div className="w-full h-80 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
              <iframe src={servis.faturaDosyaUrl} className="w-full h-full" />
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {servis.servisAdi} - Resmi Fatura Belgesi
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Fatura No: {servis.faturaNo || "FAT-2026-8819"} • Tarih: {servis.tarih}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Hizmet / Parça:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{servis.aciklama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Araç / Plaka:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{plaka} ({servis.km} KM)</span>
                </div>
                <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-1 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Genel Toplam:</span>
                  <span>{servis.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setBelgeOnizlemeAcik(false)}
              className="rounded-xl text-xs h-9 px-4"
            >
              Tamam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
