"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Share2, 
  RotateCcw, 
  Calendar, 
  Building, 
  User, 
  Briefcase, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { PDFDocument, rgb, PDFName } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { saveAs } from "file-saver";

interface PersonnelRow {
  no: number;
  adSoyad: string;
  gorev: string;
  calismaAlani: string;
}

const TOTAL_ROWS = 25;
const STORAGE_KEY = "hilal_tevzi_draft_v2";

export default function HilalTevziPage() {
  const getTodayFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Sabit Meta Bilgileri
  const FIXED_PROJE = "8000TLC HAVUZ";
  const FIXED_FORMEN = "HARUN TURAN";
  const FIXED_FIRMA = "HİLAL İZOLASYON";

  // State'ler
  const [docDate, setDocDate] = useState<string>(getTodayFormatted());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [rows, setRows] = useState<PersonnelRow[]>(() => {
    return Array.from({ length: TOTAL_ROWS }, (_, i) => ({
      no: i + 1,
      adSoyad: "",
      gorev: "",
      calismaAlani: "",
    }));
  });

  // Hücre referansları (Klavye navigasyonu ve Excel deneyimi için)
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Şablon ve font önbelleği (iOS ve mobil gecikmelerini sıfırlamak için)
  const cachedTemplateRef = useRef<ArrayBuffer | null>(null);
  const cachedFontRef = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    // Sayfa açıldığında şablon ve fontu arka planda RAM'e yükle
    fetch("/hilal-tevzi-sablon.pdf")
      .then(r => r.ok ? r.arrayBuffer() : null)
      .then(b => { if (b) cachedTemplateRef.current = b; })
      .catch(() => {});

    fetch("/fonts/TimesNewRoman.ttf")
      .then(r => r.ok ? r.arrayBuffer() : null)
      .then(b => { if (b) cachedFontRef.current = b; })
      .catch(() => {});
  }, []);

  // LocalStorage'dan taslak yükleme
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rows && Array.isArray(parsed.rows)) {
          setRows(parsed.rows);
        }
        if (parsed.docDate) {
          setDocDate(parsed.docDate);
        }
      }
    } catch (e) {
      console.error("Taslak yüklenirken hata:", e);
    }
  }, []);

  // Değişiklikleri otomatik kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ docDate, rows }));
    } catch (e) {
      console.error("Taslak kaydedilirken hata:", e);
    }
  }, [docDate, rows]);

  // Hücre değerini güncelle
  const handleCellChange = (index: number, field: keyof Omit<PersonnelRow, "no">, value: string) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Excel / Sheets tarzı klavye navigasyonu (Enter, Tab, Ok Tuşları)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: "adSoyad" | "gorev" | "calismaAlani"
  ) => {
    const fields: ("adSoyad" | "gorev" | "calismaAlani")[] = ["adSoyad", "gorev", "calismaAlani"];
    const fieldIndex = fields.indexOf(field);

    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < TOTAL_ROWS - 1) {
        cellRefs.current[`${rowIndex + 1}-${field}`]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowIndex > 0) {
        cellRefs.current[`${rowIndex - 1}-${field}`]?.focus();
      }
    } else if (e.key === "Tab" && !e.shiftKey) {
      if (fieldIndex === fields.length - 1 && rowIndex < TOTAL_ROWS - 1) {
        e.preventDefault();
        cellRefs.current[`${rowIndex + 1}-${fields[0]}`]?.focus();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      if (fieldIndex === 0 && rowIndex > 0) {
        e.preventDefault();
        cellRefs.current[`${rowIndex - 1}-${fields[fields.length - 1]}`]?.focus();
      }
    }
  };

  // Excel'den toplu kopyala - yapıştır (Ctrl+V) desteği
  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    startRowIndex: number,
    startField: "adSoyad" | "gorev" | "calismaAlani"
  ) => {
    const pasteData = e.clipboardData.getData("text");
    if (!pasteData || (!pasteData.includes("\t") && !pasteData.includes("\n"))) {
      return;
    }

    e.preventDefault();
    const rowsText = pasteData.split(/\r?\n/).filter(r => r.length > 0);
    const fields: ("adSoyad" | "gorev" | "calismaAlani")[] = ["adSoyad", "gorev", "calismaAlani"];
    const startColIndex = fields.indexOf(startField);

    setRows(prev => {
      const nextRows = [...prev];
      rowsText.forEach((rowText, rOffset) => {
        const targetRow = startRowIndex + rOffset;
        if (targetRow < TOTAL_ROWS) {
          const cols = rowText.split("\t");
          cols.forEach((colVal, cOffset) => {
            const targetColIndex = startColIndex + cOffset;
            if (targetColIndex < fields.length) {
              const fieldName = fields[targetColIndex];
              nextRows[targetRow] = {
                ...nextRows[targetRow],
                [fieldName]: colVal.trim(),
              };
            }
          });
        }
      });
      return nextRows;
    });

    toast.success("Excel verileri hücrelere aktarıldı.");
  };

  // Tabloyu Temizle
  const handleClearTable = () => {
    if (window.confirm("Tablodaki tüm personel verileri temizlensin mi?")) {
      setRows(
        Array.from({ length: TOTAL_ROWS }, (_, i) => ({
          no: i + 1,
          adSoyad: "",
          gorev: "",
          calismaAlani: "",
        }))
      );
      toast.info("Tablo temizlendi.");
    }
  };

  // Aktif dolu satır sayısı
  const filledCount = rows.filter(r => r.adSoyad.trim() !== "").length;

  // PDF Oluşturma ve Doğrudan Gmail Uygulamasına Yönlendirme
  const handleSendMail = async () => {
    if (filledCount === 0) {
      toast.warning("Lütfen en az bir personel bilgisi girin.");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      toast.loading("PDF hazırlanıyor ve Gmail'e yönlendiriliyor...", { id: "mail-toast" });

      // 1. Şablon PDF ve Fontu Getir (Varsa Önbellekten 0ms)
      let templateBytes = cachedTemplateRef.current;
      if (!templateBytes) {
        const tRes = await fetch("/hilal-tevzi-sablon.pdf");
        if (tRes.ok) templateBytes = await tRes.arrayBuffer();
      }

      if (!templateBytes) {
        throw new Error("Şablon PDF dosyası (public/hilal-tevzi-sablon.pdf) bulunamadı.");
      }

      let fontBytes = cachedFontRef.current;
      if (!fontBytes) {
        const fRes = await fetch("/fonts/TimesNewRoman.ttf");
        if (fRes.ok) fontBytes = await fRes.arrayBuffer();
      }

      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);

      let customFont = null;
      if (fontBytes) {
        customFont = await pdfDoc.embedFont(fontBytes);
      }

      const form = pdfDoc.getForm();

      // 2. Tarih Alanını Doldur
      try {
        const tarihField = form.getTextField("tarih");
        if (tarihField) {
          tarihField.setText(docDate || "");
          if (customFont) tarihField.updateAppearances(customFont);
        }
      } catch (e) {}

      // 3. 25 Satırlık Personel Form Alanlarını Doldur
      for (let i = 1; i <= TOTAL_ROWS; i++) {
        const row = rows[i - 1];
        const adSoyadVal = row?.adSoyad?.trim() || "";
        const gorevVal = row?.gorev?.trim() || "";
        const calismaVal = row?.calismaAlani?.trim() || "";

        try {
          const adField = form.getTextField(`ad_soyad_${i}`);
          if (adField) {
            adField.setText(adSoyadVal);
            if (customFont) adField.updateAppearances(customFont);
          }
        } catch (e) {}

        try {
          const gorevField = form.getTextField(`gorev_${i}`);
          if (gorevField) {
            gorevField.setText(gorevVal);
            if (customFont) gorevField.updateAppearances(customFont);
          }
        } catch (e) {}

        try {
          const alanField = form.getTextField(`calisma_alani_${i}`);
          if (alanField) {
            alanField.setText(calismaVal);
            if (customFont) alanField.updateAppearances(customFont);
          }
        } catch (e) {}
      }

      // 4. Tüm form alanlarının çevre çizgilerini (border) ve arka planlarını sıfırla / tamamen şeffaf yap
      for (const field of form.getFields()) {
        try {
          for (const widget of (field as any).acroField?.getWidgets?.() || []) {
            const bs = widget.getOrCreateBorderStyle();
            bs.setWidth(0);
            const app = widget.getOrCreateAppearanceCharacteristics();
            app?.dict?.delete(PDFName.of("BC"));
            app?.dict?.delete(PDFName.of("BG"));
          }
        } catch (e) {}
      }

      // 5. Formu düzleştir ve PDF dosyasını üret
      form.flatten({ updateFieldAppearances: false });
      const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

      const cleanDate = docDate ? docDate.replace(/[/\\?%*:|"<>]/g, ".") : "tarihsiz";
      const fileName = `Hilal ${cleanDate}.pdf`;
      const mailSubject = `Hilal Tevzi ${docDate || cleanDate}`;
      const pdfFile = new File([blob], fileName, { type: "application/pdf" });

      // 6. Cihazın Yerel Paylaşım Menüsünü Aç (Web Share API - Gmail, WhatsApp vb.)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              title: mailSubject,
              files: [pdfFile],
            });
            toast.success("Paylaşım menüsü açıldı.", { id: "mail-toast" });
            return;
          } else {
            // Dosya desteklenmiyorsa PDF'i indir ve metin olarak paylaşımı tetikle
            saveAs(blob, fileName);
            await navigator.share({
              title: mailSubject,
              text: `${mailSubject} formu ektedir.`,
            });
            toast.success("PDF indirildi ve paylaşım menüsü açıldı.", { id: "mail-toast" });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") {
            toast.dismiss("mail-toast");
            return; // Kullanıcı menüyü kapattı
          }
          console.warn("Share API hatası:", shareErr);
        }
      }

      // Tarayıcı Paylaşım API'sini Desteklemiyorsa (veya HTTP üzerinden bağlanıldığı için tarayıcı kilitlediyse):
      saveAs(blob, fileName);
      if (typeof window !== "undefined" && !window.isSecureContext) {
        toast.info(`${fileName} indirildi. (Mobilde doğrudan Paylaş menüsü için 'dev:https' ile bağlanabilirsiniz)`, { id: "mail-toast", duration: 5000 });
      } else {
        toast.success(`${fileName} başarıyla indirildi.`, { id: "mail-toast" });
      }

    } catch (err: any) {
      console.error("Paylaşım hatası:", err);
      toast.error(err.message || "İşlem sırasında bir hata oluştu.", { id: "mail-toast" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 pb-24 sm:pb-12 pt-3 sm:pt-6 px-2 sm:px-6 antialiased">
      <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
        
        {/* Üst Başlık & Kontrol Çubuğu */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-200 p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 truncate">
                Hilal Tevzi Formu
              </h1>
              <p className="text-[11px] sm:text-xs text-neutral-500">
                25 Satır Tablo • Dolu: <span className="font-bold text-blue-600">{filledCount} / 25</span>
              </p>
            </div>
          </div>

          {/* Masaüstü Aksiyon Butonları */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearTable}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temizle</span>
            </button>

            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleSendMail}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Hazırlanıyor...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Paylaş</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ana İçerik / Excel Belge Görünümü */}
        <div className="bg-white rounded-xl shadow-xs border border-neutral-300 p-3 sm:p-7">
          
          {/* Başlık */}
          <div className="text-center pb-3 border-b-2 border-neutral-800 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-2xl font-black tracking-wider text-neutral-900 uppercase">
              PERSONEL GÜNLÜK TAKİP FORMU
            </h2>
          </div>

          {/* Üst Bilgiler (Metadata) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-4 sm:mb-6">
            {/* Sol: Proje & Formen */}
            <div className="space-y-2">
              <div className="flex border border-neutral-300 rounded-lg overflow-hidden bg-white">
                <span className="w-24 sm:w-32 bg-neutral-100 px-2.5 py-2 font-bold text-neutral-600 text-xs flex items-center gap-1 border-r border-neutral-300 shrink-0">
                  <Building className="w-3 h-3 text-neutral-500" />
                  PROJE
                </span>
                <span className="px-2.5 py-2 font-semibold text-neutral-800 flex-1 truncate">
                  {FIXED_PROJE}
                </span>
              </div>

              <div className="flex border border-neutral-300 rounded-lg overflow-hidden bg-white">
                <span className="w-24 sm:w-32 bg-neutral-100 px-2.5 py-2 font-bold text-neutral-600 text-xs flex items-center gap-1 border-r border-neutral-300 shrink-0">
                  <User className="w-3 h-3 text-neutral-500" />
                  FORMEN
                </span>
                <span className="px-2.5 py-2 font-semibold text-neutral-800 flex-1 truncate">
                  {FIXED_FORMEN}
                </span>
              </div>
            </div>

            {/* Sağ: Tarih & Firma */}
            <div className="space-y-2">
              <div className="flex border-2 border-blue-500 rounded-lg overflow-hidden bg-white shadow-xs">
                <span className="w-24 sm:w-36 bg-blue-50 px-2.5 py-2 font-bold text-blue-900 text-xs flex items-center gap-1 border-r border-blue-200 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  TARİH
                </span>
                <input
                  type="text"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  placeholder="GG/AA/YYYY"
                  className="px-2.5 py-2 font-bold text-neutral-900 flex-1 outline-none text-sm bg-yellow-50/30 focus:bg-white"
                />
              </div>

              <div className="flex border border-neutral-300 rounded-lg overflow-hidden bg-white">
                <span className="w-24 sm:w-36 bg-neutral-100 px-2.5 py-2 font-bold text-neutral-600 text-xs flex items-center gap-1 border-r border-neutral-300 shrink-0">
                  <Briefcase className="w-3 h-3 text-neutral-500" />
                  FİRMA / İŞ
                </span>
                <span className="px-2.5 py-2 font-semibold text-neutral-800 flex-1 truncate">
                  {FIXED_FIRMA}
                </span>
              </div>
            </div>
          </div>

          {/* SADECE TABLO GÖRÜNÜMÜ (AD SOYAD SÜTUNU SOLA SABİT / STICKY) */}
          <div className="border border-neutral-400 rounded-lg overflow-x-auto shadow-2xs relative">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[560px]">
              <thead>
                <tr className="bg-neutral-200 text-neutral-800 border-b border-neutral-400 font-bold uppercase select-none">
                  {/* NO Sütunu (Normal, kaydırılabilir) */}
                  <th className="w-10 text-center py-2 px-1 border-r border-neutral-400">
                    NO
                  </th>
                  {/* AD SOYAD (SABİT DONDURULMUŞ SÜTUN) */}
                  <th className="py-2 px-2.5 border-r border-neutral-400 min-w-[150px] sm:min-w-[200px] sticky left-0 z-20 bg-neutral-200 shadow-[2px_0_4px_rgba(0,0,0,0.06)]">
                    AD SOYAD
                  </th>
                  <th className="py-2 px-2 border-r border-neutral-400 min-w-[130px] sm:w-1/4">
                    GÖREVİ
                  </th>
                  <th className="py-2 px-2 border-r border-neutral-400 min-w-[130px] sm:w-1/4">
                    ÇALIŞMA ALANI
                  </th>
                  <th className="py-2 px-1 text-center w-14">
                    İMZA
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr 
                    key={row.no}
                    className={`border-b border-neutral-300 transition-colors ${
                      index % 2 === 1 ? "bg-neutral-50/70" : "bg-white"
                    } hover:bg-blue-50/30`}
                  >
                    {/* NO Kolonu */}
                    <td className="text-center font-bold text-neutral-500 py-1 px-1 border-r border-neutral-300 bg-neutral-100 select-none">
                      {row.no}
                    </td>

                    {/* AD SOYAD (SABİT DONDURULMUŞ HÜCRE) */}
                    <td className={`p-0 border-r border-neutral-300 sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.06)] ${
                      index % 2 === 1 ? "bg-neutral-50" : "bg-white"
                    }`}>
                      <input
                        ref={(el) => { cellRefs.current[`${index}-adSoyad`] = el; }}
                        type="text"
                        value={row.adSoyad}
                        onChange={(e) => handleCellChange(index, "adSoyad", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "adSoyad")}
                        onPaste={(e) => handlePaste(e, index, "adSoyad")}
                        placeholder={index === 0 ? "Ad Soyad yazın..." : ""}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-transparent outline-none font-semibold text-neutral-900 focus:bg-amber-50 focus:ring-1 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm"
                      />
                    </td>

                    {/* GÖREVİ */}
                    <td className="p-0 border-r border-neutral-300">
                      <input
                        ref={(el) => { cellRefs.current[`${index}-gorev`] = el; }}
                        type="text"
                        value={row.gorev}
                        onChange={(e) => handleCellChange(index, "gorev", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "gorev")}
                        onPaste={(e) => handlePaste(e, index, "gorev")}
                        placeholder={index === 0 ? "Görevi..." : ""}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-transparent outline-none text-neutral-800 focus:bg-amber-50 focus:ring-1 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm"
                      />
                    </td>

                    {/* ÇALIŞMA ALANI */}
                    <td className="p-0 border-r border-neutral-300">
                      <input
                        ref={(el) => { cellRefs.current[`${index}-calismaAlani`] = el; }}
                        type="text"
                        value={row.calismaAlani}
                        onChange={(e) => handleCellChange(index, "calismaAlani", e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, "calismaAlani")}
                        onPaste={(e) => handlePaste(e, index, "calismaAlani")}
                        placeholder={index === 0 ? "Çalışma alanı..." : ""}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-transparent outline-none text-neutral-800 focus:bg-amber-50 focus:ring-1 focus:ring-inset focus:ring-blue-500 text-xs sm:text-sm"
                      />
                    </td>

                    {/* İMZA (Boş) */}
                    <td className="py-1 px-1 text-center text-neutral-300 select-none text-[11px]">
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alt Kısım: Firma Yetkilisi Kaşe / İmza */}
          <div className="mt-6 sm:mt-8 flex justify-center sm:justify-end">
            <div className="w-full sm:w-72 border-2 border-neutral-300 rounded-lg p-3 sm:p-4 text-center bg-neutral-50/50 space-y-8 sm:space-y-12">
              <div>
                <p className="text-[11px] sm:text-xs font-extrabold tracking-wider text-neutral-700 uppercase">
                  FİRMA YETKİLİSİ
                </p>
                <p className="text-xs sm:text-sm font-black text-neutral-900 mt-0.5">
                  {FIXED_FIRMA}
                </p>
              </div>
              <div className="border-t border-dashed border-neutral-300 pt-1 text-[11px] text-neutral-400">
                Kaşe / İmza
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MOBİL İÇİN SABİT ALT AKSİYON ÇUBUĞU */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-neutral-200 p-2.5 px-3 z-50 flex items-center justify-between gap-2 shadow-lg">
        <button
          type="button"
          onClick={handleClearTable}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Temizle
        </button>

        <button
          type="button"
          disabled={isGeneratingPdf}
          onClick={handleSendMail}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Paylaş ({filledCount}/25)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
