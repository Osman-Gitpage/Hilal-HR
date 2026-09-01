"use client";

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Arac, ServisKaydi, MuayeneBilgileri } from "./types";
import { Printer, Download, Wrench } from "lucide-react";

interface ServisRaporPdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arac: Arac;
  secilenYil: number;
  servisKayitlari: ServisKaydi[];
  muayene: MuayeneBilgileri;
}

export function ServisRaporPdfModal({
  open,
  onOpenChange,
  arac,
  secilenYil,
  servisKayitlari,
  muayene,
}: ServisRaporPdfModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const toplamServisTutar = servisKayitlari.reduce((acc, s) => acc + (s.tutar || 0), 0);
  const muayeneMasrafi = secilenYil === 2026 ? (muayene.muayeneUcreti || 0) : 0;
  const genelToplamTutar = toplamServisTutar + muayeneMasrafi;
  const toplamIslemSayisi = servisKayitlari.length + (muayeneMasrafi > 0 ? 1 : 0);

  const handlePrint = () => {
    if (!printAreaRef.current) return;

    const printContent = printAreaRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=800");

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Servis_Masraf_Ekstresi_${arac.plaka.replace(/\s+/g, "_")}_${secilenYil}</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: white;
                color: #18181b;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @media print {
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body class="p-4 sm:p-8">
            ${printContent}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-4xl max-h-[94vh] flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-0 shadow-2xl overflow-hidden">
        {/* Modal Başlığı & İşlem Butonları */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Servis, Tamir & Muayene Raporu (PDF)
              </DialogTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {arac.plaka} • {secilenYil} Yılı Resmi Bakım & Onarım Ekstresi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl h-9 text-xs gap-1.5 font-semibold bg-white dark:bg-zinc-900 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Yazdır
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl h-9 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Olarak İndir
            </Button>
          </div>
        </DialogHeader>

        {/* ── PDF ÖNİZLEME ALANI (A4 Şablonu) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-100/50 dark:bg-zinc-900/30">
          <div
            ref={printAreaRef}
            className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-sm text-zinc-900 dark:text-zinc-100 space-y-8"
          >
            {/* 1. Üst Kurumsal Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-100 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-black text-sm">
                    H
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                    Hilal Filo Yönetimi
                  </h1>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Mekanik Servis, Bakım & Muayene Harcama Dökümü
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs font-mono uppercase tracking-wider">
                  Servis Ekstresi
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Rapor Tarihi: {new Date().toLocaleDateString("tr-TR")}
                </p>
              </div>
            </div>

            {/* 2. Araç & Dönem Bilgileri */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  PLAKA
                </span>
                <span className="text-sm font-black font-mono mt-0.5 block">
                  {arac.plaka}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  ARAÇ BİLGİSİ
                </span>
                <span className="font-bold mt-0.5 block truncate">
                  {arac.marka} {arac.model}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  GÜNCEL KM
                </span>
                <span className="font-bold font-mono mt-0.5 block">
                  {arac.km.toLocaleString("tr-TR")} KM
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  MALİ DÖNEM
                </span>
                <span className="font-bold font-mono mt-0.5 block text-blue-600 dark:text-blue-400">
                  {secilenYil} Mali Yılı
                </span>
              </div>
            </div>

            {/* 3. Özet KPI Kartları */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                  Toplam İşlem
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-zinc-900 dark:text-zinc-100 mt-1 block">
                  {toplamIslemSayisi} Kayıt
                </span>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                  Mekanik Servis / Tamir
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-zinc-900 dark:text-zinc-100 mt-1 block">
                  {toplamServisTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                <span className="text-[10px] uppercase font-semibold text-blue-800 dark:text-blue-300 block">
                  Yıllık Toplam Bakım Gideri
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-blue-700 dark:text-blue-400 mt-1 block">
                  {genelToplamTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>
            </div>

            {/* 4. Servis & Muayene Döküm Tablosu */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Detaylı Servis, Onarım & Muayene Harcamaları
              </h3>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-850/80 border-b border-zinc-200 dark:border-zinc-800">
                    <tr className="text-[10px] font-bold text-zinc-500 uppercase">
                      <th className="py-3 px-4">Tarih & KM</th>
                      <th className="py-3 px-3">İşlem Türü</th>
                      <th className="py-3 px-3">Servis / Açıklama</th>
                      <th className="py-3 px-3">Fatura No</th>
                      <th className="py-3 px-4 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                    {/* TÜVTÜRK Muayene */}
                    {secilenYil === 2026 && muayene.muayeneUcreti && (
                      <tr className="bg-indigo-50/20">
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          <div>{muayene.muayeneTarihi}</div>
                          <span className="text-[10px] text-indigo-600 font-mono">TÜVTÜRK</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-indigo-700">
                          Muayene & Emisyon
                        </td>
                        <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                          {muayene.istasyon || "TÜVTÜRK Maslak"} ({muayene.sonuc || "Kusursuz"})
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-500">
                          {muayene.raporNo || "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900 dark:text-indigo-200">
                          {muayene.muayeneUcreti.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    )}

                    {servisKayitlari.length === 0 && (!muayene.muayeneUcreti || secilenYil !== 2026) ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-400">
                          {secilenYil} yılına ait servis masraf kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      servisKayitlari.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50/50">
                          <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                            <div>{s.tarih}</div>
                            <span className="text-[10px] text-zinc-400 font-mono">{s.km.toLocaleString("tr-TR")} KM</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-blue-700 dark:text-blue-300">
                            {s.islemTuru}
                          </td>
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                            <p className="font-semibold">{s.aciklama}</p>
                            <span className="text-[10px] text-zinc-400">{s.servisAdi}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-500">
                            {s.faturaNo || "-"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {s.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-zinc-50/90 dark:bg-zinc-850/90 border-t-2 border-zinc-200 dark:border-zinc-700 font-bold">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 uppercase text-xs">
                        YILLIK GENEL TOPLAM ({toplamIslemSayisi} İŞLEM)
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-500">
                        {secilenYil}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                        {genelToplamTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 5. Alt İmza & Onay Alanı */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-8 text-xs">
              <div className="space-y-12">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                  Filo Teknik Sorumlusu
                </span>
                <div className="border-t border-zinc-300 dark:border-zinc-700 pt-2 text-[10px] text-zinc-400">
                  İsim - Soyisim / İmza
                </div>
              </div>

              <div className="space-y-12 text-right">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
                  Muhasebe / Harcama Onayı
                </span>
                <div className="border-t border-zinc-300 dark:border-zinc-700 pt-2 text-[10px] text-zinc-400">
                  Kaşe / Onay İmzası
                </div>
              </div>
            </div>

            {/* Dipnot */}
            <div className="pt-4 text-center text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
              Bu belge Hilal Filo Yönetim Sistemi tarafından dijital olarak üretilmiştir.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
