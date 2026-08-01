"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  FileText, FileIcon, Trash2, Download, Upload,
  Loader2, File, FileSpreadsheet, Eye, Plus,
  Receipt, FileBadge, ChevronDown, ChevronUp,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DosyaGoruntule } from "@/components/ui/DosyaGoruntule";

import { useBelgeDosyaEkle, useBelgeDosyaSil } from "@/hooks/useCari";
import { formatBoyut } from "@/lib/cari";
import { storageUpload, storageGetDownloadUrl } from "@/app/actions/storage";
import type { BelgeDosya, DosyaTipi, DosyaKategori } from "@/types/cari";

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function dosyaTipiTespit(file: File): DosyaTipi {
  if (file.name.toLowerCase().match(/\.pdf$/i) || file.type === "application/pdf")
    return "PDF";
  return "Word";
}

// ─── B2 Upload ────────────────────────────────────────────────────────────────

/**
 * Dosyayı B2'ye yükler, object key döndürür.
 * Hata durumunda fırlatır — blob: URL fallback yok.
 */
async function dosyayiB2YeYukle(
  file: File,
  sirketId: string,
  belgeId: string
): Promise<{ objectKey: string; adi: string; tipi: DosyaTipi; boyut: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("module", "cari");
  formData.append("entityId", `belge-${belgeId}`);
  formData.append("category", "dosya");

  const result = await storageUpload(formData);
  if (!result.success) throw new Error(result.error);

  return { objectKey: result.data.objectKey, adi: file.name, tipi: dosyaTipiTespit(file), boyut: file.size };
}

// ─── Presigned URL Yardımcısı ─────────────────────────────────────────────────

async function presignedUrlAl(objectKey: string): Promise<string | null> {
  const res = await storageGetDownloadUrl({ objectKey });
  if (res.success) return res.url;
  return null;
}

// ─── Slot Bileşeni (dolu veya boş) ───────────────────────────────────────────

interface SlotProps {
  kategori: "belge" | "dekont";
  dosya: BelgeDosya | null;
  yukleniyor: boolean;
  siliniyor: boolean;
  onYukle: (file: File) => void;
  onSil: () => void;
  onGoruntule: () => void;
  onIndir: () => void;
}

function Slot({ kategori, dosya, yukleniyor, siliniyor, onYukle, onSil, onGoruntule, onIndir }: SlotProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const isBelge = kategori === "belge";
  const label = isBelge ? "Belge" : "Dekont";
  const Icon = isBelge ? FileBadge : Receipt;
  const accentColor = isBelge
    ? "text-violet-600 dark:text-violet-400"
    : "text-emerald-600 dark:text-emerald-400";
  const accentBg = isBelge
    ? "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50"
    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50";
  const accentHover = isBelge
    ? "hover:border-violet-400 hover:bg-violet-50/80 dark:hover:border-violet-600"
    : "hover:border-emerald-400 hover:bg-emerald-50/80 dark:hover:border-emerald-600";
  const placeholderBorder = isBelge
    ? "border-violet-200/60 dark:border-violet-800/30"
    : "border-emerald-200/60 dark:border-emerald-800/30";
  const dragActiveBorder = isBelge
    ? "border-violet-500 bg-violet-50/80 dark:border-violet-400 dark:bg-violet-950/50 scale-[1.02]"
    : "border-emerald-500 bg-emerald-50/80 dark:border-emerald-400 dark:bg-emerald-950/50 scale-[1.02]";

  if (yukleniyor) {
    return (
      <div className="flex-1 rounded-xl border border-border/40 bg-muted/20 p-4 flex flex-col items-center justify-center gap-2 min-h-[110px]">
        <Loader2 className={`h-5 w-5 animate-spin ${accentColor}`} />
        <p className="text-xs text-muted-foreground">Yükleniyor…</p>
      </div>
    );
  }

  if (dosya) {
    const ext = dosya.dosya_adi.split(".").pop()?.toLowerCase() ?? "";
    const isPdf = ext === "pdf";

    return (
      <div className={`flex-1 rounded-xl border p-3.5 ${accentBg} group relative transition-all`}>
        {/* Kategori etiketi */}
        <div className={`flex items-center gap-1.5 mb-2.5`}>
          <Icon className={`h-3.5 w-3.5 ${accentColor}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${accentColor}`}>{label}</span>
        </div>

        {/* Dosya bilgisi */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPdf ? "bg-rose-100 dark:bg-rose-900/30" : "bg-blue-100 dark:bg-blue-900/30"
          }`}>
            {isPdf
              ? <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              : <FileIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight">{dosya.dosya_adi}</p>
            {dosya.boyut_byte && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatBoyut(dosya.boyut_byte)}</p>
            )}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 flex-1 gap-1.5 text-xs ${accentColor} hover:bg-white/60 dark:hover:bg-black/20`}
            onClick={onGoruntule}
          >
            <Eye className="h-3 w-3" />
            Görüntüle
          </Button>
          <button
            type="button"
            title="İndir"
            onClick={onIndir}
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-white/60 dark:hover:bg-black/20 hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
            onClick={onSil}
            disabled={siliniyor}
          >
            {siliniyor ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  // Boş slot — placeholder
  return (
    <div
      className={`flex-1 rounded-xl border-2 border-dashed ${
        dragOver
          ? dragActiveBorder
          : `${placeholderBorder} ${accentHover}`
      } 
        p-4 flex flex-col items-center justify-center gap-2 min-h-[110px] 
        cursor-pointer transition-all duration-200 group`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onYukle(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onYukle(f);
          e.target.value = "";
        }}
      />
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
        dragOver ? "scale-110" : ""
      } ${
        isBelge ? "bg-violet-100 dark:bg-violet-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
      }`}>
        <Icon className={`h-4 w-4 ${accentColor}`} />
      </div>
      <div className="text-center">
        <p className={`text-xs font-semibold ${accentColor}`}>{label} ekle</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {dragOver ? "Bırak ve yükle" : "Tıkla veya sürükle"}
        </p>
      </div>
    </div>
  );
}

// ─── Çift Kartı ──────────────────────────────────────────────────────────────

interface CiftKartiProps {
  ciftNo: number;
  belgeDosya: BelgeDosya | null;
  dekontDosya: BelgeDosya | null;
  belgeId: string;
  sirketId: string;
  onGoruntule: (dosya: BelgeDosya) => void;
  onCiftSil: () => void;
}

function CiftKarti({
  ciftNo, belgeDosya, dekontDosya, belgeId, sirketId, onGoruntule, onCiftSil,
}: CiftKartiProps) {
  const { mutateAsync: dosyaEkle } = useBelgeDosyaEkle();
  const { mutateAsync: dosyaSil } = useBelgeDosyaSil();

  const [belgeYukleniyor, setBelgeYukleniyor] = React.useState(false);
  const [dekontYukleniyor, setDekontYukleniyor] = React.useState(false);
  const [belgeSiliniyor, setBelgeSiliniyor] = React.useState(false);
  const [dekontSiliniyor, setDekontSiliniyor] = React.useState(false);

  const bosmu = !belgeDosya && !dekontDosya;

  const handleYukle = async (file: File, kategori: "belge" | "dekont") => {
    const setYukleniyor = kategori === "belge" ? setBelgeYukleniyor : setDekontYukleniyor;
    setYukleniyor(true);
    try {
      const r = await dosyayiB2YeYukle(file, sirketId, belgeId);
      const sonuc = await dosyaEkle({
        belge_id: belgeId,
        dosya_url: r.objectKey,
        dosya_adi: r.adi,
        dosya_tipi: r.tipi,
        boyut_byte: r.boyut,
        kategori,
        cift_no: ciftNo,
      });
      if (sonuc.basarili) toast.success(`${r.adi} eklendi.`);
      else toast.error(sonuc.hata);
    } catch (err) {
      toast.error(`Yüklenemedi: ${String(err)}`);
    } finally {
      setYukleniyor(false);
    }
  };

  const handleSil = async (dosya: BelgeDosya) => {
    const setSiliniyor = dosya.kategori === "belge" ? setBelgeSiliniyor : setDekontSiliniyor;
    setSiliniyor(true);
    try {
      const sonuc = await dosyaSil({ dosyaId: dosya.id, belgeId });
      if (!sonuc.basarili) toast.error(sonuc.hata);
    } finally {
      setSiliniyor(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Kart başlığı */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-black text-primary">#{ciftNo}</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {belgeDosya?.dosya_adi
              ? belgeDosya.dosya_adi.replace(/\.[^.]+$/, "").slice(0, 30)
              : `Belge-Dekont Çifti ${ciftNo}`}
          </span>
        </div>
        {bosmu && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
            onClick={onCiftSil}
            title="Boş çifti kaldır"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Slot'lar */}
      <div className="p-3 flex gap-3">
        <Slot
          kategori="belge"
          dosya={belgeDosya}
          yukleniyor={belgeYukleniyor}
          siliniyor={belgeSiliniyor}
          onYukle={(f) => handleYukle(f, "belge")}
          onSil={() => belgeDosya && handleSil(belgeDosya)}
          onGoruntule={() => belgeDosya && onGoruntule(belgeDosya)}
          onIndir={async () => {
            if (!belgeDosya) return;
            const url = await presignedUrlAl(belgeDosya.dosya_url);
            if (!url) { toast.error("İndirme bağlantısı alınamadı."); return; }
            const a = document.createElement("a");
            a.href = url; a.download = belgeDosya.dosya_adi; a.click();
          }}
        />
        <Slot
          kategori="dekont"
          dosya={dekontDosya}
          yukleniyor={dekontYukleniyor}
          siliniyor={dekontSiliniyor}
          onYukle={(f) => handleYukle(f, "dekont")}
          onSil={() => dekontDosya && handleSil(dekontDosya)}
          onGoruntule={() => dekontDosya && onGoruntule(dekontDosya)}
          onIndir={async () => {
            if (!dekontDosya) return;
            const url = await presignedUrlAl(dekontDosya.dosya_url);
            if (!url) { toast.error("İndirme bağlantısı alınamadı."); return; }
            const a = document.createElement("a");
            a.href = url; a.download = dekontDosya.dosya_adi; a.click();
          }}
        />
      </div>
    </div>
  );
}

// ─── Diğer Dosya Satırı ────────────────────────────────────────────────────

interface DigerDosyaSatiriProps {
  dosya: BelgeDosya;
  onSil: () => void;
  siliniyor: boolean;
  onGoruntule: () => void;
  onIndir: () => void;
}

function DigerDosyaSatiri({ dosya, onSil, siliniyor, onGoruntule, onIndir }: DigerDosyaSatiriProps) {
  const ext = dosya.dosya_adi.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";
  const isExcel = ["xlsx", "xls", "csv"].includes(ext);

  return (
    <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
        isPdf ? "bg-rose-100 dark:bg-rose-900/30"
        : isExcel ? "bg-emerald-100 dark:bg-emerald-900/30"
        : "bg-blue-100 dark:bg-blue-900/30"
      }`}>
        {isPdf && <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
        {isExcel && <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
        {!isPdf && !isExcel && <FileIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{dosya.dosya_adi}</p>
        {dosya.boyut_byte && <p className="text-xs text-muted-foreground">{formatBoyut(dosya.boyut_byte)}</p>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={onGoruntule}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          title="İndir"
          onClick={onIndir}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onSil} disabled={siliniyor}
        >
          {siliniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Ana Panel ─────────────────────────────────────────────────────────────

interface BelgeDosyaPanelProps {
  belgeId: string;
  sirketId: string;
  dosyalar: BelgeDosya[];
  yukleniyor?: boolean;
}

export function BelgeDosyaPanel({ belgeId, sirketId, dosyalar, yukleniyor }: BelgeDosyaPanelProps) {
  const { mutateAsync: dosyaEkle } = useBelgeDosyaEkle();
  const { mutateAsync: dosyaSil } = useBelgeDosyaSil();

  // Görüntüleme state'i — objectKey + çözümlü presigned URL
  const [goruntulenenDosya, setGoruntulenenDosya] = React.useState<BelgeDosya | null>(null);
  const [goruntulemeUrl, setGoruntulemeUrl] = React.useState<string | null>(null);

  // Dosya görüntüleme: objectKey → presigned URL al
  const handleGoruntule = React.useCallback(async (dosya: BelgeDosya) => {
    setGoruntulenenDosya(dosya);
    setGoruntulemeUrl(null);
    const url = await presignedUrlAl(dosya.dosya_url);
    if (url) {
      setGoruntulemeUrl(url);
    } else {
      toast.error("Dosya görüntüleme bağlantısı alınamadı.");
      setGoruntulenenDosya(null);
    }
  }, []);

  // Diğer dosyalar collapse
  const [digerAcik, setDigerAcik] = React.useState(true);

  // Serbest eklenen boş çift numaraları (henüz dosya yüklenmemiş)
  const [bosIDs, setBosIDs] = React.useState<number[]>([]);

  // Yükleme ve silme durumları (diger kategorisi için)
  const [digerYuklenenler, setDigerYuklenenler] = React.useState<Set<string>>(new Set());
  const [digerSilinenler, setDigerSilinenler] = React.useState<Set<string>>(new Set());
  const [surukleniyor, setSurukleniyor] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (yukleniyor) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
      </div>
    );
  }

  // Dosyaları kategorilere ayır
  const ciftDosyalar = dosyalar.filter((d) => d.kategori === "belge" || d.kategori === "dekont");
  const digerDosyalar = dosyalar.filter((d) => d.kategori === "diger");

  // Mevcut çift numaralarını bul
  const mevcutCiftler = Array.from(
    new Set(ciftDosyalar.map((d) => d.cift_no).filter((n): n is number => n !== null))
  ).sort((a, b) => a - b);

  // Boş çiftlerden sadece mevcutta olmayan numaraları göster
  const tumBosIDs = bosIDs.filter((id) => !mevcutCiftler.includes(id));

  // Tüm çift numaraları (mevcut + boş)
  const tumCiftler = [
    ...mevcutCiftler,
    ...tumBosIDs.filter((id) => !mevcutCiftler.includes(id)),
  ].sort((a, b) => a - b);

  // Sonraki çift numarasını hesapla
  const sonrakiNo = tumCiftler.length > 0 ? Math.max(...tumCiftler) + 1 : 1;

  const getCiftDosyasi = (ciftNo: number, kat: DosyaKategori) =>
    ciftDosyalar.find((d) => d.cift_no === ciftNo && d.kategori === kat) ?? null;

  // Diğer dosya yükleme
  const handleDigerYukle = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const izin = file.name.match(/\.(pdf|doc|docx|xlsx|xls|csv)$/i) ||
        ["application/pdf","application/msword",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         "application/vnd.ms-excel","text/csv"].includes(file.type);
      if (!izin) { toast.error(`${file.name} desteklenmiyor.`); continue; }

      const key = `${file.name}-${file.size}`;
      setDigerYuklenenler((p) => new Set(p).add(key));
      try {
        const r = await dosyayiB2YeYukle(file, sirketId, belgeId);
        const sonuc = await dosyaEkle({
          belge_id: belgeId,
          dosya_url: r.objectKey,
          dosya_adi: r.adi,
          dosya_tipi: r.tipi,
          boyut_byte: r.boyut,
          kategori: "diger",
        });
        if (sonuc.basarili) toast.success(`${file.name} eklendi.`);
        else toast.error(`${file.name}: ${sonuc.hata}`);
      } catch (err) {
        toast.error(`Yüklenemedi: ${String(err)}`);
      } finally {
        setDigerYuklenenler((p) => { const n = new Set(p); n.delete(key); return n; });
      }
    }
  };

  const handleDigerSil = async (dosya: BelgeDosya) => {
    setDigerSilinenler((p) => new Set(p).add(dosya.id));
    try {
      const sonuc = await dosyaSil({ dosyaId: dosya.id, belgeId });
      if (!sonuc.basarili) toast.error(`Hata: ${sonuc.hata}`);
    } finally {
      setDigerSilinenler((p) => { const n = new Set(p); n.delete(dosya.id); return n; });
    }
  };

  return (
    <div className="space-y-5">

      {/* ═══ BELGE & DEKONT ÇİFTLERİ ═══ */}
      <div className="space-y-2">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              <FileBadge className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Belgeler & Dekontlar</span>
            {tumCiftler.length > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center">
                {tumCiftler.length}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setBosIDs((p) => [...p, sonrakiNo])}
          >
            <Plus className="h-3 w-3" />
            Çift Ekle
          </Button>
        </div>

        {/* Çiftler */}
        {tumCiftler.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border/40 py-10 flex flex-col items-center justify-center gap-3 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
              <FileBadge className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/60">Henüz belge eklenmedi</p>
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                &quot;Çift Ekle&quot; ile belge &amp; dekont çifti oluşturun
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs mt-1"
              onClick={() => setBosIDs((p) => [...p, sonrakiNo])}
            >
              <Plus className="h-3 w-3" />
              İlk Çifti Ekle
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tumCiftler.map((ciftNo) => (
              <CiftKarti
                key={ciftNo}
                ciftNo={ciftNo}
                belgeDosya={getCiftDosyasi(ciftNo, "belge")}
                dekontDosya={getCiftDosyasi(ciftNo, "dekont")}
                belgeId={belgeId}
                sirketId={sirketId}
                onGoruntule={handleGoruntule}
                onCiftSil={() => setBosIDs((p) => p.filter((id) => id !== ciftNo))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ DİĞER DOSYALAR ═══ */}
      <div className="space-y-2">
        {/* Başlık — collapsible */}
        <button
          type="button"
          className="flex items-center gap-2 w-full group"
          onClick={() => setDigerAcik((p) => !p)}
        >
          <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center">
            <File className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            Diğer Dosyalar
          </span>
          {digerDosyalar.length > 0 && (
            <span className="h-4 min-w-[16px] px-1 rounded-full bg-muted text-muted-foreground text-[9px] font-black flex items-center justify-center">
              {digerDosyalar.length}
            </span>
          )}
          <div className="ml-auto text-muted-foreground/40">
            {digerAcik
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />
            }
          </div>
        </button>

        {digerAcik && (
          <div className="space-y-2">
            {/* Dosya listesi */}
            {digerDosyalar.length > 0 && (
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {digerDosyalar.map((d) => (
                  <DigerDosyaSatiri
                    key={d.id}
                    dosya={d}
                    onSil={() => handleDigerSil(d)}
                    siliniyor={digerSilinenler.has(d.id)}
                    onGoruntule={() => handleGoruntule(d)}
                    onIndir={async () => {
                      const url = await presignedUrlAl(d.dosya_url);
                      if (!url) { toast.error("İndirme bağlantısı alınamadı."); return; }
                      const a = document.createElement("a");
                      a.href = url; a.download = d.dosya_adi; a.click();
                    }}
                  />
                ))}
              </div>
            )}

            {/* Upload alanı */}
            <div
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                surukleniyor
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/40 hover:border-primary/40 hover:bg-muted/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
              onDragLeave={() => setSurukleniyor(false)}
              onDrop={(e) => { e.preventDefault(); setSurukleniyor(false); handleDigerYukle(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file" multiple
                accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleDigerYukle(e.target.files)}
              />
              {digerYuklenenler.size > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium text-primary">{digerYuklenenler.size} dosya yükleniyor…</span>
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-muted-foreground">Sürükle & bırak</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">PDF · Word · Excel</p>
                  <Button
                    type="button" variant="outline" size="sm"
                    className="mt-2.5 gap-1.5 h-7 text-xs"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  >
                    <Upload className="h-3 w-3" />
                    Dosya Seç
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Görüntüleme Dialog — presigned URL ile */}
      <DosyaGoruntule
        url={goruntulemeUrl}
        dosyaAdi={goruntulenenDosya?.dosya_adi ?? ""}
        onKapat={() => { setGoruntulenenDosya(null); setGoruntulemeUrl(null); }}
      />
    </div>
  );
}
