"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Search, Building2, ArrowLeft,
  Edit3, Trash2, Loader2, ChevronRight,
  TrendingUp, TrendingDown, Minus, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useFirmaList, useFirmaSil } from "@/hooks/useCari";
import { paraFormat } from "@/lib/cari";
import type { FirmaListItem, ParaBirimi } from "@/types/cari";
import { FirmaEkleModal } from "./FirmaEkleModal";

// ─── Para birimi bakiye çipi ──────────────────────────────────────────────────

function BakiyeChip({ pb, kalan }: { pb: ParaBirimi; kalan: number }) {
  const renkMap: Record<ParaBirimi, string> = {
    TRY: kalan > 0
      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
      : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    EUR: kalan > 0
      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
      : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    USD: kalan > 0
      ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
      : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-bold gap-1 ${renkMap[pb]}`}>
      {pb}
      {kalan > 0
        ? <span className="font-normal">{paraFormat(kalan, pb)}</span>
        : <span className="font-normal">Kapandı ✓</span>
      }
    </Badge>
  );
}

// ─── Firma Kartı ──────────────────────────────────────────────────────────────

interface FirmaKartiProps {
  firma: FirmaListItem;
  onDuzenle: () => void;
  onSilIste: () => void;
  onClick: () => void;
}

function FirmaKarti({ firma, onDuzenle, onSilIste, onClick }: FirmaKartiProps) {
  const toplamAlacak = firma.bakiye.reduce((s, b) => s + b.alacak, 0);
  const toplamKalan = firma.bakiye.reduce((s, b) => s + b.kalan, 0);
  const tamOdendi = toplamAlacak > 0 && toplamKalan === 0;

  return (
    <div
      className={`group relative rounded-2xl border bg-card p-5 cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20
        ${tamOdendi ? "border-emerald-200/60 dark:border-emerald-800/40" : ""}
      `}
      onClick={onClick}
    >
      {/* Aksiyonlar — hover'da görünür */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onDuzenle(); }}
          title="Düzenle"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onSilIste(); }}
          title="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* İkon + Ad */}
      <div className="flex items-start gap-3 mb-4 pr-16">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
          ${tamOdendi
            ? "bg-emerald-100 dark:bg-emerald-900/30"
            : "bg-primary/10 group-hover:bg-primary/15"
          }`}
        >
          <Building2 className={`h-5 w-5 ${tamOdendi ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
            {firma.ad}
          </p>
          {firma.notlar && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{firma.notlar}</p>
          )}
        </div>
      </div>

      {/* Bakiye özeti */}
      {firma.bakiye.length > 0 ? (
        <div className="space-y-2">
          {/* PB badge'leri */}
          <div className="flex flex-wrap gap-1.5">
            {firma.bakiye.map((b) => (
              <BakiyeChip key={b.para_birimi} pb={b.para_birimi} kalan={b.kalan} />
            ))}
          </div>

          {/* Detay satırları */}
          {firma.bakiye.map((b) => (
            <div key={b.para_birimi} className="text-[11px] text-muted-foreground space-y-0.5">
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-2.5 w-2.5" /> Alacak ({b.para_birimi})
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {paraFormat(b.alacak, b.para_birimi)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-2.5 w-2.5 text-emerald-500" /> Ödenen
                </span>
                <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                  {paraFormat(b.odenen, b.para_birimi)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/60">Henüz belge yok</p>
      )}

      {/* Alt ok */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function FirmaSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function FirmaListesiView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: firmalar = [], isLoading } = useFirmaList();
  const { mutateAsync: firmaSil } = useFirmaSil();

  const [arama, setArama] = React.useState("");
  const [aramaDebounce, setAramaDebounce] = React.useState("");
  const [modalAcik, setModalAcik] = React.useState(
    searchParams.get("yeni") === "1"
  );
  const [duzenlenecek, setDuzenlenecek] = React.useState<FirmaListItem | undefined>();
  const [silinecek, setSilinecek] = React.useState<FirmaListItem | null>(null);
  const [siliniyor, setSiliniyor] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setAramaDebounce(arama), 300);
    return () => clearTimeout(t);
  }, [arama]);

  const filtreli = aramaDebounce
    ? firmalar.filter((f) =>
        f.ad.toLowerCase().includes(aramaDebounce.toLowerCase()) ||
        (f.notlar ?? "").toLowerCase().includes(aramaDebounce.toLowerCase())
      )
    : firmalar;

  const handleSil = async () => {
    if (!silinecek) return;
    setSiliniyor(true);
    try {
      const sonuc = await firmaSil(silinecek.id);
      if (sonuc.basarili) {
        toast.success(`"${silinecek.ad}" silindi.`);
      } else {
        toast.error(`Hata: ${sonuc.hata}`);
      }
    } finally {
      setSiliniyor(false);
      setSilinecek(null);
    }
  };

  const handleDuzenle = (firma: FirmaListItem) => {
    setDuzenlenecek(firma);
    setModalAcik(true);
  };

  const handleModalKapat = () => {
    setModalAcik(false);
    setDuzenlenecek(undefined);
  };

  // Özet: toplam firma, toplam kalan TL
  const toplamKalanTry = firmalar
    .flatMap((f) => f.bakiye)
    .filter((b) => b.para_birimi === "TRY")
    .reduce((s, b) => s + b.kalan, 0);

  return (
    <div className="space-y-6 pb-10">
      {/* ── Başlık ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/cari")}
            className="gap-1.5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Cari
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Firmalar</h1>
            <p className="text-sm text-muted-foreground">
              {firmalar.length} firma
              {toplamKalanTry > 0 && ` · ${paraFormat(toplamKalanTry, "TRY")} toplam kalan`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => { setDuzenlenecek(undefined); setModalAcik(true); }}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Firma
        </Button>
      </div>

      {/* ── Özet Kartları ── */}
      {!isLoading && firmalar.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Toplam Firma",
              deger: firmalar.length.toString(),
              renk: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Bakiyeli Firma",
              deger: firmalar.filter((f) => f.bakiye.some((b) => b.kalan > 0)).length.toString(),
              renk: "text-amber-600 dark:text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              label: "Kapanan Firma",
              deger: firmalar.filter(
                (f) => f.bakiye.length > 0 && f.bakiye.every((b) => b.kalan === 0)
              ).length.toString(),
              renk: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Belgesi Yok",
              deger: firmalar.filter((f) => f.bakiye.length === 0).length.toString(),
              renk: "text-muted-foreground",
              bg: "bg-muted",
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${k.bg}`}>
                <Building2 className={`h-4 w-4 ${k.renk}`} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{k.label}</p>
                <p className={`text-lg font-extrabold ${k.renk}`}>{k.deger}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Arama ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Firma ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* ── Kart Grid ── */}
      {isLoading ? (
        <FirmaSkeleton />
      ) : filtreli.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-base font-semibold text-muted-foreground">
            {arama ? "Firma bulunamadı" : "Henüz firma eklenmemiş"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {arama
              ? `"${arama}" ile eşleşen firma yok`
              : "Cari belgelerinizi firmalarla ilişkilendirin"}
          </p>
          {!arama && (
            <Button
              className="mt-4 gap-1.5"
              onClick={() => { setDuzenlenecek(undefined); setModalAcik(true); }}
            >
              <Plus className="h-4 w-4" />
              İlk Firmayı Ekle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtreli.map((firma) => (
            <FirmaKarti
              key={firma.id}
              firma={firma}
              onDuzenle={() => handleDuzenle(firma)}
              onSilIste={() => setSilinecek(firma)}
              onClick={() =>
                router.push(`/cari?firmaId=${firma.id}`)
              }
            />
          ))}
        </div>
      )}

      {/* ── Firma Ekle/Düzenle Modal ── */}
      <FirmaEkleModal
        acik={modalAcik}
        onKapat={handleModalKapat}
        mevcutFirma={duzenlenecek}
      />

      {/* ── Silme Onayı ── */}
      <AlertDialog open={!!silinecek} onOpenChange={(o) => !o && setSilinecek(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firmayı sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{silinecek?.ad}</strong> firma kaydı kalıcı olarak silinecek.
              Bu firmaya bağlı belgeler silinmez; ancak firma bağlantısını kaybeder.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={siliniyor}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSil}
              disabled={siliniyor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {siliniyor && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
