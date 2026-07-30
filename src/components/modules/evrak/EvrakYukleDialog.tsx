"use client";

// ─── Evrak Yükleme Dialog (Proje UI Select & DatePicker Entegreli) ─────────────

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useEvrakMutations, useEvrakKategorileri } from "@/hooks/useEvrak";
import { useSirketStore } from "@/stores/sirketStore";
import { EVRAK_KABUL_EDILEN_TIPLER, EVRAK_MAX_DOSYA_BOYUT } from "@/types/evrak";
import type { EvrakKategori } from "@/types/evrak";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCode,
  Image as ImageIcon,
  FileType,
  Loader2,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";

// Standart Personel Evrak Kategorileri Listesi
const STANDART_KATEGORILER = [
  { id: "kat-saglik", ad: "Sağlık Raporu (İSG)", sureli: true, varsayilan_sure: 365 },
  { id: "kat-tetenoz", ad: "Tetenoz Aşı Kartı / Belgesi", sureli: true, varsayilan_sure: 365 },
  { id: "kat-adli-sicil", ad: "Adli Sicil Kaydı", sureli: true, varsayilan_sure: 365 },
  { id: "kat-sgk", ad: "SGK İşe Giriş Bildirgesi", sureli: false },
  { id: "kat-kkd", ad: "KKD (Kişisel Koruyucu Donanım) Teslim Formu", sureli: true, varsayilan_sure: 365 },
  { id: "kat-sozlesme", ad: "İş Sözleşmesi", sureli: true, varsayilan_sure: 730 },
  { id: "kat-kimlik", ad: "Kimlik Fotokopisi", sureli: false },
  { id: "kat-sertifika", ad: "Sertifika / Mesleki Yeterlilik", sureli: true, varsayilan_sure: 1095 },
  { id: "kat-ikametgah", ad: "Yerleşim Yeri (İkametgah) Belgesi", sureli: true, varsayilan_sure: 180 },
  { id: "kat-diploma", ad: "Diploma / Mezuniyet Belgesi", sureli: false },
  { id: "kat-fotograf", ad: "Biyometrik Fotoğraf", sureli: false },
  { id: "kat-referans", ad: "Referans Mektubu / Diğer", sureli: false },
];

interface EvrakYukleDialogProps {
  acik: boolean;
  onKapat: () => void;
  kategori?: EvrakKategori | null;
  personelId?: string;
  donemId?: string;
}

export function EvrakYukleDialog({
  acik,
  onKapat,
  kategori: initialKategori,
  personelId,
  donemId,
}: EvrakYukleDialogProps) {
  const sirketId = useSirketStore((s) => s.aktifSirketId) ?? "";
  const { data: dbKategoriler } = useEvrakKategorileri("personel");
  const { olustur } = useEvrakMutations();

  // Tüm mevcut kategorileri harmanla
  const kategorilerListesi = useMemo(() => {
    const list = [...((dbKategoriler as unknown as EvrakKategori[]) ?? [])];
    STANDART_KATEGORILER.forEach((std) => {
      if (!list.some((k) => k.ad.toLowerCase() === std.ad.toLowerCase())) {
        list.push(std as EvrakKategori);
      }
    });
    return list;
  }, [dbKategoriler]);

  // Seçili kategori state'i
  const [selectedKatId, setSelectedKatId] = useState<string>(() => {
    return initialKategori?.id ?? kategorilerListesi[0]?.id ?? "kat-adli-sicil";
  });

  // Modal açıldığında tıklanan kategoriyi otomatik seç
  useEffect(() => {
    if (acik) {
      if (initialKategori) {
        const match = kategorilerListesi.find(
          (k) =>
            k.id === initialKategori.id ||
            k.ad.toLowerCase().trim() === initialKategori.ad.toLowerCase().trim()
        );
        if (match) {
          setSelectedKatId(match.id);
        } else if (initialKategori.id) {
          setSelectedKatId(initialKategori.id);
        }
      } else if (kategorilerListesi.length > 0) {
        setSelectedKatId(kategorilerListesi[0].id);
      }
    }
  }, [acik, initialKategori, kategorilerListesi]);

  const seciliKategori = useMemo(() => {
    return (
      kategorilerListesi.find((k) => k.id === selectedKatId) ??
      initialKategori ??
      kategorilerListesi[0]
    );
  }, [kategorilerListesi, selectedKatId, initialKategori]);

  const [dosya, setDosya] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [tetenozIceriyor, setTetenozIceriyor] = useState(false);
  const [baslangicTarihi, setBaslangicTarihi] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [bitisTarihi, setBitisTarihi] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, progress, reset: uploadSifirla } = useFileUpload({
    module: "evrak",
    entityId: personelId ?? "sirket",
    category: seciliKategori?.id ?? "genel",
    onSuccess: async (result) => {
      if (seciliKategori?.id) {
        await olustur.mutateAsync({
          kategori_id: seciliKategori.id,
          personel_id: personelId,
          employment_period_id: donemId,
          dosya_url: result.objectKey,
          dosya_adi: result.fileName,
          dosya_boyut: result.fileSize,
          dosya_tipi: result.mimeType,
          baslangic_tarihi: baslangicTarihi || undefined,
          bitis_tarihi: bitisTarihi || undefined,
          tetenoz_iceriyor: tetenozIceriyor,
        });
      }
      toast.success(`${seciliKategori?.ad ?? "Evrak"} başarıyla yüklendi!`);
      handleKapat();
    },
    onError: () => {
      toast.error("Dosya yüklenirken bir hata oluştu.");
    },
  });

  // Hızlı tarih presetleri (3 Ay, 6 Ay, 1 Yıl, 2 Yıl, Süresiz)
  const applyPresetAy = (ay: number | null) => {
    if (ay === null) {
      setBitisTarihi("");
      return;
    }
    const baslangic = baslangicTarihi ? new Date(baslangicTarihi) : new Date();
    baslangic.setMonth(baslangic.getMonth() + ay);
    setBitisTarihi(baslangic.toISOString().split("T")[0]);
  };

  const handleDosyaSec = (file: File) => {
    if (file.size > EVRAK_MAX_DOSYA_BOYUT) {
      toast.error(`Dosya boyutu maksimum ${EVRAK_MAX_DOSYA_BOYUT / (1024 * 1024)}MB olabilir.`);
      return;
    }
    setDosya(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleDosyaSec(file);
  }, []);

  const handleYukle = async () => {
    if (!dosya) return;
    await upload(dosya);
  };

  const handleKapat = () => {
    setDosya(null);
    setDragOver(false);
    setTetenozIceriyor(false);
    setBaslangicTarihi(new Date().toISOString().split("T")[0]);
    setBitisTarihi("");
    uploadSifirla();
    onKapat();
  };

  const yukleniyor = progress.status === "uploading";
  const tamamlandi = progress.status === "success";

  // Format ikonunu belirle
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) {
      return <ImageIcon className="w-7 h-7 text-sky-500" />;
    }
    if (["pdf"].includes(ext || "")) {
      return <FileText className="w-7 h-7 text-rose-500" />;
    }
    if (["doc", "docx"].includes(ext || "")) {
      return <FileType className="w-7 h-7 text-indigo-500" />;
    }
    return <FileCode className="w-7 h-7 text-purple-500" />;
  };

  const boyutStr = dosya
    ? dosya.size > 1024 * 1024
      ? `${(dosya.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(dosya.size / 1024).toFixed(0)} KB`
    : "";

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && handleKapat()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl bg-white dark:bg-zinc-900">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/50 dark:from-zinc-900 dark:to-zinc-900 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center border border-[#7c3aed]/20 shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Evrak Yükle</span>
                {seciliKategori && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-[11px] font-semibold border border-[#7c3aed]/20">
                    {seciliKategori.ad}
                  </span>
                )}
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kategori seçin, dosyanızı ekleyin ve geçerlilik süresini girin.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 1. Kategori Seçimi Dropdown (UI Select Bileşeni) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#7c3aed]" />
              Evrak Kategorisi Seçin *
            </Label>
            <Select
              value={selectedKatId}
              onValueChange={(val) => {
                if (val) setSelectedKatId(val);
              }}
              disabled={yukleniyor}
            >
              <SelectTrigger className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-white shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all cursor-pointer">
                <SelectValue>{seciliKategori?.ad ?? "Kategori seçiniz..."}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-h-60 overflow-y-auto z-50">
                {kategorilerListesi.map((kat) => (
                  <SelectItem
                    key={kat.id}
                    value={kat.id}
                    className="text-xs py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <span className="font-medium">{kat.ad}</span>
                    {kat.sureli && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 font-semibold ml-2">
                        Süreli
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 1.5. Sağlık Raporu İçin Tetenoz Aşı Bilgisi Checkbox */}
          {(seciliKategori?.id === "kat-saglik" ||
            seciliKategori?.ad.toLowerCase().includes("sağlık")) && (
            <div className="p-3 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 flex items-start gap-3 transition-all">
              <input
                type="checkbox"
                id="tetenozIceriyor"
                checked={tetenozIceriyor}
                onChange={(e) => setTetenozIceriyor(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-[#7c3aed] focus:ring-[#7c3aed] cursor-pointer"
              />
              <label
                htmlFor="tetenozIceriyor"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer flex-1 select-none"
              >
                Bu Sağlık Raporu Tetenoz Aşı Kaydını Da İçeriyor
                <span className="block text-[10px] text-zinc-500 font-normal mt-0.5 leading-snug">
                  İşaretlendiğinde Tetenoz Aşı Belgesi de otomatik olarak geçerli sayılacak ve Sağlık Raporuna bağlanacaktır.
                </span>
              </label>
            </div>
          )}

          {/* 2. Drag & Drop Upload Zone */}
          {!dosya ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3 group ${
                dragOver
                  ? "border-[#7c3aed] bg-[#7c3aed]/5 scale-[0.99]"
                  : "border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10 hover:border-[#7c3aed]/60 hover:bg-purple-50/60"
              }`}
            >
              <div className="w-13 h-13 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-purple-100 dark:border-purple-900/40 flex items-center justify-center text-[#7c3aed] group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Dosyayı buraya sürükleyin
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  veya bilgisayarınızdan{" "}
                  <span className="text-[#7c3aed] font-semibold underline">
                    dosya seçin
                  </span>
                </p>
              </div>

              {/* Format pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium">
                  PDF
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium">
                  PNG
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium">
                  JPG
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium">
                  DOCX
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[#7c3aed] text-[10px] font-semibold">
                  Maks. 10 MB
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={EVRAK_KABUL_EDILEN_TIPLER.join(",")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDosyaSec(file);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            /* Selected File Card */
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                  {getFileIcon(dosya.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {dosya.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {boyutStr} • Yüklemeye Hazır
                  </p>
                </div>
              </div>

              {!yukleniyor && !tamamlandi && (
                <button
                  onClick={() => setDosya(null)}
                  className="w-7 h-7 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title="Dosyayı kaldır"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Progress */}
          {yukleniyor && (
            <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center justify-between text-xs font-medium text-purple-950 dark:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7c3aed]" />
                  Yükleniyor...
                </span>
                <span className="font-bold text-[#7c3aed]">%{progress.percent}</span>
              </div>
              <Progress value={progress.percent} className="h-2 bg-purple-100 dark:bg-purple-900/40" />
            </div>
          )}

          {/* Hata Mesajı */}
          {progress.status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{progress.error || "Yükleme sırasında hata oluştu."}</span>
            </div>
          )}

          {/* Başarı Mesajı */}
          {tamamlandi && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-900 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Evrak başarıyla yüklendi!</span>
            </div>
          )}

          {/* 3. Tarih ve Geçerlilik Ayarları (DatePicker Entegreli) */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <Label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#7c3aed]" />
                Geçerlilik Tarihi (Süre Seçimi)
              </Label>

              {/* Hızlı Preset Butonları */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyPresetAy(1)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="1 Ay (1. Doz Aşı)"
                >
                  1 Ay
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(3)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-[#7c3aed] border border-purple-200 dark:border-purple-900/50 transition-colors cursor-pointer"
                  title="3 Ay (Minimum Geçerlilik)"
                >
                  3 Ay
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(6)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-[#7c3aed] border border-purple-200 dark:border-purple-900/50 transition-colors cursor-pointer"
                  title="6 Ay (2. Doz / Standart)"
                >
                  6 Ay
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(12)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  1 Yıl
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(24)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  2 Yıl
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(60)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 border border-blue-200 dark:border-blue-900/50 transition-colors cursor-pointer"
                  title="5 Yıl (Tetanoz / İSG Serisi)"
                >
                  5 Yıl
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(120)}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-200 dark:border-indigo-900/50 transition-colors cursor-pointer"
                  title="10 Yıl (Tam Doz Koruma)"
                >
                  10 Yıl
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetAy(null)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors cursor-pointer"
                >
                  Süresiz
                </button>
              </div>
            </div>

            {/* Tetanoz / Sağlık / Süreli Evrak İpucu */}
            {(seciliKategori?.ad.toLowerCase().includes("tetanoz") ||
              seciliKategori?.ad.toLowerCase().includes("aşı") ||
              seciliKategori?.ad.toLowerCase().includes("sağlık") ||
              seciliKategori?.ad.toLowerCase().includes("adli sicil")) && (
              <p className="text-[10.5px] text-purple-800 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40 leading-relaxed">
                💡 <strong>Tetanoz & Sağlık Aşı Rehberi:</strong> Doz takvimine göre geçerlilik süresi değişir:
                <span className="block mt-0.5 font-medium text-purple-900 dark:text-purple-200">
                  • 1. Doz: 1 Ay | • 2. Doz: 6 Ay | • 3. Doz: 1 Yıl | • Tam Doz (4/5. Doz): 5–10 Yıl
                </span>
                İlgili butonla süreyi anında ekleyebilir veya özel tarih belirleyebilirsiniz.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Düzenlenme Tarihi</span>
                <DatePicker
                  value={baslangicTarihi}
                  onChange={setBaslangicTarihi}
                  placeholder="Başlangıç Tarihi"
                  disabled={yukleniyor}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium">Son Geçerlilik Tarihi</span>
                <DatePicker
                  value={bitisTarihi}
                  onChange={setBitisTarihi}
                  placeholder="Bitiş Tarihi"
                  disabled={yukleniyor}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between sm:justify-between gap-3">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Güvenli Depolama</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleKapat}
              disabled={yukleniyor}
              className="h-9 px-4 text-xs font-medium rounded-xl border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              {tamamlandi ? "Kapat" : "İptal"}
            </Button>

            {!tamamlandi && (
              <Button
                type="button"
                onClick={handleYukle}
                disabled={!dosya || yukleniyor}
                className="h-9 px-5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                {yukleniyor ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Yükleniyor…
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Belge Yükle
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
