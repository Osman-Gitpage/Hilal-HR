"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  FileText, FileIcon, Trash2, Download, Upload,
  Loader2, File, FileSpreadsheet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { useBelgeDosyaEkle, useBelgeDosyaSil } from "@/hooks/useCari";
import { formatBoyut } from "@/lib/cari";
import type { BelgeDosya, DosyaTipi } from "@/types/cari";

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function dosyaTipiTespit(file: File): DosyaTipi {
  if (file.name.toLowerCase().match(/\.pdf$/i) || file.type === "application/pdf")
    return "PDF";
  return "Word";
}

function dosyaGorunumTipi(dosya: BelgeDosya): "pdf" | "excel" | "docx" {
  if (dosya.dosya_tipi === "PDF") return "pdf";
  if (dosya.dosya_adi.match(/\.(xlsx|xls|csv)$/i)) return "excel";
  return "docx";
}

function islemUrl(url: string): string | null {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:"))
    return url;
  return null;
}

// ─── B2 Upload ────────────────────────────────────────────────────────────────

async function uploadToB2(
  file: File,
  sirketId: string,
  belgeId: string
): Promise<{ url: string; adi: string; tipi: DosyaTipi; boyut: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sirket_id", sirketId);
  formData.append("belge_id", belgeId);
  const res = await fetch("/api/cari/dosya-yukle", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ hata: "Upload hatası" }));
    throw new Error(err.hata ?? "Dosya yüklenemedi");
  }
  const data = await res.json();
  return { url: data.url, adi: data.adi, tipi: data.tipi, boyut: data.boyut };
}

// ─── Dosya Satırı ──────────────────────────────────────────────────────────

interface DosyaSatiriProps {
  dosya: BelgeDosya;
  onSil: () => void;
  siliniyor: boolean;
}

function DosyaSatiri({ dosya, onSil, siliniyor }: DosyaSatiriProps) {
  const tip = dosyaGorunumTipi(dosya);
  const url = islemUrl(dosya.dosya_url);

  const ikonBg = {
    pdf: "bg-rose-100 dark:bg-rose-900/30",
    docx: "bg-blue-100 dark:bg-blue-900/30",
    excel: "bg-emerald-100 dark:bg-emerald-900/30",
  }[tip];

  const ikonRenk = {
    pdf: "text-rose-600 dark:text-rose-400",
    docx: "text-blue-600 dark:text-blue-400",
    excel: "text-emerald-600 dark:text-emerald-400",
  }[tip];

  const badgeCls = {
    pdf: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
    docx: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    excel: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  }[tip];

  const badgeLabel = { pdf: "PDF", docx: "Word", excel: "Excel" }[tip];

  return (
    <div className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors">
      {/* İkon */}
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${ikonBg}`}>
        {tip === "pdf" && <FileText className={`h-4 w-4 ${ikonRenk}`} />}
        {tip === "excel" && <FileSpreadsheet className={`h-4 w-4 ${ikonRenk}`} />}
        {tip === "docx" && <FileIcon className={`h-4 w-4 ${ikonRenk}`} />}
      </div>

      {/* Ad + boyut */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{dosya.dosya_adi}</p>
        <p className="text-xs text-muted-foreground">{formatBoyut(dosya.boyut_byte)}</p>
      </div>

      {/* Tür badge */}
      <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${badgeCls}`}>
        {badgeLabel}
      </Badge>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={dosya.dosya_adi}
            title="İndir"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onSil}
          disabled={siliniyor}
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

  const [yuklenenler, setYuklenenler] = React.useState<Set<string>>(new Set());
  const [silinenler, setSilinenler] = React.useState<Set<string>>(new Set());
  const [surukleniyor, setSurukleniyor] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const tipi = dosyaTipiTespit(file);
      const izin =
        file.name.match(/\.(pdf|doc|docx|xlsx|xls|csv)$/i) ||
        [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ].includes(file.type);

      if (!izin) { toast.error(`${file.name} desteklenmiyor.`); continue; }

      const fileKey = `${file.name}-${file.size}`;
      setYuklenenler((p) => new Set(p).add(fileKey));

      try {
        let url: string, adi: string, boyut: number;
        try {
          const r = await uploadToB2(file, sirketId, belgeId);
          url = r.url; adi = r.adi; boyut = r.boyut;
        } catch {
          url = URL.createObjectURL(file);
          adi = file.name; boyut = file.size;
        }

        const sonuc = await dosyaEkle({
          belge_id: belgeId, dosya_url: url, dosya_adi: adi,
          dosya_tipi: tipi, boyut_byte: boyut,
        });
        if (sonuc.basarili) toast.success(`${file.name} eklendi.`);
        else toast.error(`${file.name}: ${sonuc.hata}`);
      } catch (err) {
        toast.error(`${file.name} yüklenemedi: ${String(err)}`);
      } finally {
        setYuklenenler((p) => { const n = new Set(p); n.delete(fileKey); return n; });
      }
    }
  };

  const handleSil = async (dosya: BelgeDosya) => {
    setSilinenler((p) => new Set(p).add(dosya.id));
    try {
      const sonuc = await dosyaSil({ dosyaId: dosya.id, belgeId });
      if (sonuc.basarili) toast.success("Dosya silindi.");
      else toast.error(`Hata: ${sonuc.hata}`);
    } finally {
      setSilinenler((p) => { const n = new Set(p); n.delete(dosya.id); return n; });
    }
  };

  if (yukleniyor) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dosya Listesi */}
      {dosyalar.length > 0 ? (
        <div className="divide-y divide-border rounded-xl border overflow-hidden">
          {dosyalar.map((d) => (
            <DosyaSatiri
              key={d.id}
              dosya={d}
              onSil={() => handleSil(d)}
              siliniyor={silinenler.has(d.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <File className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Henüz dosya eklenmemiş</p>
        </div>
      )}

      {/* Upload Alanı */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          surukleniyor
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-primary/40 hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
        onDragLeave={() => setSurukleniyor(false)}
        onDrop={(e) => { e.preventDefault(); setSurukleniyor(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {yuklenenler.size > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-primary">{yuklenenler.size} dosya yükleniyor…</span>
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-muted-foreground">Dosyaları buraya sürükleyin</p>
            <p className="text-xs text-muted-foreground/60 mt-1">PDF · Word · Excel desteklenir</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5 h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            >
              <Upload className="h-3 w-3" />
              Dosya Seç
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
