"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Search, Building2, ArrowLeft,
  Edit3, Trash2, Loader2, ChevronRight,
  TrendingUp, TrendingDown, X, Users,
  CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// ─── Para Birimi Renk Paleti ──────────────────────────────────────────────────

const PB_RENK: Record<ParaBirimi, { bg: string; text: string; border: string }> = {
  TRY: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800/50",
  },
  EUR: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/50",
  },
  USD: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800/50",
  },
};

// ─── Firma Avatarı ────────────────────────────────────────────────────────────

function FirmaAvatar({ ad, tamOdendi }: { ad: string; tamOdendi: boolean }) {
  const harf = ad.trim().charAt(0).toUpperCase();
  return (
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-black transition-all
      ${tamOdendi
        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        : "bg-primary/10 text-primary"
      }`}
    >
      {harf}
    </div>
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
  const belgeSayisi = firma.bakiye.length;

  return (
    <div
      className={`group relative rounded-2xl border bg-card cursor-pointer
        transition-all duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5
        ${tamOdendi
          ? "border-emerald-200/60 dark:border-emerald-900/40"
          : "border-border/60 hover:border-border"
        }`}
      onClick={onClick}
    >
      {/* Aksiyon butonları - hover'da */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 z-10">
        <button
          className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all"
          onClick={(e) => { e.stopPropagation(); onDuzenle(); }}
          title="Düzenle"
        >
          <Edit3 className="h-3 w-3" />
        </button>
        <button
          className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"
          onClick={(e) => { e.stopPropagation(); onSilIste(); }}
          title="Sil"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="p-5">
        {/* Üst: Avatar + Ad */}
        <div className="flex items-start gap-3 mb-4 pr-14">
          <FirmaAvatar ad={firma.ad} tamOdendi={tamOdendi} />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate group-hover:text-primary transition-colors leading-snug">
              {firma.ad}
            </p>
            {firma.notlar ? (
              <p className="text-xs text-muted-foreground truncate mt-0.5 leading-relaxed">{firma.notlar}</p>
            ) : (
              <p className="text-xs text-muted-foreground/40 mt-0.5">Not eklenmemiş</p>
            )}
          </div>
        </div>

        {/* Bakiye içeriği */}
        {firma.bakiye.length > 0 ? (
          <div className="space-y-3">
            {/* Para birimi etiketleri */}
            <div className="flex flex-wrap gap-1.5">
              {firma.bakiye.map((b) => {
                const renk = PB_RENK[b.para_birimi];
                return (
                  <span
                    key={b.para_birimi}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${renk.bg} ${renk.text} ${renk.border}`}
                  >
                    {b.para_birimi}
                    {b.kalan > 0
                      ? <span className="font-normal opacity-80">{paraFormat(b.kalan, b.para_birimi)}</span>
                      : <span className="font-normal opacity-60">Kapandı ✓</span>
                    }
                  </span>
                );
              })}
            </div>

            {/* Detay satırları */}
            <div className="space-y-1.5 pt-0.5">
              {firma.bakiye.map((b) => (
                <div key={b.para_birimi} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-2.5 w-2.5" /> Alacak ({b.para_birimi})
                    </span>
                    <span className="font-semibold tabular-nums text-foreground/80">
                      {paraFormat(b.alacak, b.para_birimi)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-2.5 w-2.5 text-emerald-500" /> Ödenen
                    </span>
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                      {paraFormat(b.odenen, b.para_birimi)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2 flex items-center gap-2 text-xs text-muted-foreground/50">
            <div className="h-5 w-5 rounded-lg bg-muted/60 flex items-center justify-center">
              <TrendingUp className="h-3 w-3" />
            </div>
            Henüz belge yok
          </div>
        )}
      </div>

      {/* Alt çizgi + ok */}
      <div className="px-5 py-2.5 border-t border-border/40 bg-muted/10 rounded-b-2xl flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {belgeSayisi > 0 ? `${belgeSayisi} para birimi` : "Belge bekleniyor"}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function FirmaSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-52 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Özet İstatistik Kartı ───────────────────────────────────────────────────

function StatKart({
  label, deger, icon: Icon, className
}: {
  label: string;
  deger: string | number;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border/40">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-black leading-tight">{deger}</p>
      </div>
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
  const [modalAcik, setModalAcik] = React.useState(searchParams.get("yeni") === "1");
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

  // İstatistikler
  const toplamKalanTry = firmalar
    .flatMap((f) => f.bakiye)
    .filter((b) => b.para_birimi === "TRY")
    .reduce((s, b) => s + b.kalan, 0);

  const bakiyeliCount = firmalar.filter((f) => f.bakiye.some((b) => b.kalan > 0)).length;
  const kapananCount = firmalar.filter((f) => f.bakiye.length > 0 && f.bakiye.every((b) => b.kalan === 0)).length;
  const belgesiYokCount = firmalar.filter((f) => f.bakiye.length === 0).length;

  return (
    <div className="space-y-6 pb-10">

      {/* ── Başlık ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/cari")}
            className="gap-1.5 -ml-1 mt-0.5 text-muted-foreground hover:text-foreground h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Geri
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Building2 className="h-4 w-4 text-primary/60" />
              <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                Cari Firmalar
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Firma Listesi</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {firmalar.length} firma kayıtlı
              {toplamKalanTry > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold"> · {paraFormat(toplamKalanTry, "TRY")} açık bakiye</span>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={() => { setDuzenlenecek(undefined); setModalAcik(true); }}
          className="gap-1.5 h-9"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Firma
        </Button>
      </div>

      {/* ── İstatistik Kartları ── */}
      {!isLoading && firmalar.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatKart
            label="Toplam Firma"
            deger={firmalar.length}
            icon={Users}
            className="bg-primary/10 text-primary"
          />
          <StatKart
            label="Açık Bakiye"
            deger={bakiyeliCount}
            icon={AlertTriangle}
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatKart
            label="Kapanan"
            deger={kapananCount}
            icon={CheckCircle2}
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatKart
            label="Belgesi Yok"
            deger={belgesiYokCount}
            icon={Clock}
            className="bg-muted text-muted-foreground"
          />
        </div>
      )}

      {/* ── Arama ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <Input
          placeholder="Firma ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="pl-9 h-9 text-sm bg-muted/30 border-transparent focus:border-border focus:bg-background transition-all"
        />
        {arama && (
          <button
            onClick={() => setArama("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Kart Grid ── */}
      {isLoading ? (
        <FirmaSkeleton />
      ) : filtreli.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <p className="text-base font-semibold text-foreground/70">
            {arama ? "Firma bulunamadı" : "Henüz firma eklenmemiş"}
          </p>
          <p className="text-sm text-muted-foreground/50 mt-1">
            {arama ? `"${arama}" ile eşleşen kayıt yok` : "Cari belgelerinizi firmalarla ilişkilendirin"}
          </p>
          {arama ? (
            <button
              onClick={() => setArama("")}
              className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Aramayı temizle
            </button>
          ) : (
            <Button
              className="mt-5 gap-1.5"
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
              onClick={() => router.push(`/cari?firmaId=${firma.id}`)}
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
