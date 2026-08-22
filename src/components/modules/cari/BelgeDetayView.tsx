"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Edit3, Trash2, AlertCircle,
  Building2, Calendar, Ship, Banknote,
  CreditCard, CheckCircle2, Clock, Loader2,
  Save, Plus, Paperclip, StickyNote,
  MoreHorizontal, FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpInfo } from "@/components/ui/help-info";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useBelgeDetay,
  useBelgeSil,
  useOdemeSil,
  useBelgeNotlarGuncelle,
} from "@/hooks/useCari";
import { paraFormat, formatKur, tarihFormat, odemeYontemEtiket, odemeYontemBadgeClass } from "@/lib/cari";
import type { BelgeTur, OdemeDurumu, Odeme } from "@/types/cari";
import { OdemeEkleModal } from "./OdemeEkleModal";
import { BelgeDosyaPanel } from "./BelgeDosyaPanel";
import { belgeDetayPdf } from "@/lib/pdf/cariPdf";

// ─── Konfigürasyon ────────────────────────────────────────────────────────────

const TUR_CFG: Record<string, { label: string; color: string }> = {
  fatura:        { label: "Resmi Fatura",  color: "#3b82f6" },
  proforma:      { label: "Proforma",      color: "#8b5cf6" },
  hesap_bilgisi: { label: "Hesap Bilgisi", color: "#64748b" },
};

type DurumKey = "odendi" | "kismi" | "odenmedi" | "gecikmiş";
const DURUM_CFG: Record<DurumKey, {
  label: string;
  textCls: string;
  bgCls: string;
  borderCls: string;
  barCls: string;
  icon: React.ElementType;
}> = {
  odendi: {
    label: "Ödendi",
    textCls: "text-emerald-700 dark:text-emerald-400",
    bgCls: "bg-emerald-50 dark:bg-emerald-950/30",
    borderCls: "border-emerald-200 dark:border-emerald-800/50",
    barCls: "bg-emerald-500",
    icon: CheckCircle2,
  },
  kismi: {
    label: "Kısmi Ödendi",
    textCls: "text-amber-700 dark:text-amber-400",
    bgCls: "bg-amber-50 dark:bg-amber-950/30",
    borderCls: "border-amber-200 dark:border-amber-800/50",
    barCls: "bg-amber-500",
    icon: Clock,
  },
  odenmedi: {
    label: "Ödenmedi",
    textCls: "text-slate-600 dark:text-slate-400",
    bgCls: "bg-slate-50 dark:bg-slate-800/30",
    borderCls: "border-slate-200 dark:border-slate-700/50",
    barCls: "bg-slate-300 dark:bg-slate-600",
    icon: Clock,
  },
  gecikmiş: {
    label: "Gecikmiş",
    textCls: "text-rose-700 dark:text-rose-400",
    bgCls: "bg-rose-50 dark:bg-rose-950/30",
    borderCls: "border-rose-200 dark:border-rose-800/50",
    barCls: "bg-rose-500",
    icon: AlertCircle,
  },
};

function getDurum(durum: OdemeDurumu, gecikmiş: boolean): DurumKey {
  if (gecikmiş) return "gecikmiş";
  return durum;
}

// ─── Ödeme Timeline Kartı ─────────────────────────────────────────────────────

function OdemeItem({ odeme, belgeId, index }: { odeme: Odeme; belgeId: string; index: number }) {
  const { mutateAsync: sil, isPending } = useOdemeSil();
  const [silOnay, setSilOnay] = React.useState(false);

  const handleSil = async () => {
    const sonuc = await sil({ odemeId: odeme.id, belgeId });
    if (sonuc.basarili) toast.success("Ödeme silindi.");
    else toast.error(`Hata: ${sonuc.hata}`);
    setSilOnay(false);
  };

  return (
    <>
      <div className="relative group px-4 py-3">
        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {tarihFormat(odeme.tarih)}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${odemeYontemBadgeClass(odeme.yontem)}`}>
                  {odemeYontemEtiket(odeme.yontem)}
                </span>
              </div>
              {odeme.aciklama && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{odeme.aciklama}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{paraFormat(odeme.tutar, odeme.para_birimi)}
                </p>
                {odeme.kur !== 1 && (
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    = {paraFormat(odeme.tutar * odeme.kur, "TRY")}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSilOnay(true)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center
                  text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30
                  transition-all shrink-0"
              >
                {isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={silOnay} onOpenChange={setSilOnay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödemeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              {tarihFormat(odeme.tarih)} tarihli {paraFormat(odeme.tutar, odeme.para_birimi)} tutarındaki
              ödeme kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSil}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Evet, Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Not Paneli ───────────────────────────────────────────────────────────────

function NotPanel({ belgeId, notlar }: { belgeId: string; notlar: string | null }) {
  const { mutateAsync: kaydet, isPending } = useBelgeNotlarGuncelle();
  const [not, setNot] = React.useState(notlar ?? "");
  const degisti = not !== (notlar ?? "");

  const handle = async () => {
    const sonuc = await kaydet({ id: belgeId, notlar: not.trim() || null });
    if (sonuc.basarili) toast.success("Notlar kaydedildi.");
    else toast.error(`Hata: ${sonuc.hata}`);
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={not}
        onChange={(e) => setNot(e.target.value)}
        placeholder="Bu belge hakkında notlarınızı buraya yazın…"
        className="min-h-[200px] resize-none text-sm bg-muted/20 border-border/50 focus:bg-background transition-colors rounded-xl"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {not.length > 0 ? `${not.length} karakter` : ""}
        </span>
        <Button onClick={handle} disabled={!degisti || isPending} size="sm" className="gap-1.5 h-8 text-xs">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetaySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function BelgeDetayView({ belgeId }: { belgeId: string }) {
  const router = useRouter();
  const { data: belge, isLoading, error } = useBelgeDetay(belgeId);
  const { mutateAsync: belgeSil, isPending: siliniyor } = useBelgeSil();

  const [odemeModalAcik, setOdemeModalAcik] = React.useState(false);
  const [silOnay, setSilOnay] = React.useState(false);

  const handleBelgeSil = async () => {
    const sonuc = await belgeSil(belgeId);
    if (sonuc.basarili) {
      toast.success("Belge silindi.");
      router.push("/cari");
    } else {
      toast.error(`Hata: ${sonuc.hata}`);
    }
    setSilOnay(false);
  };

  if (isLoading) return <DetaySkeleton />;

  if (error || !belge) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <p className="text-base font-bold text-foreground/70">Belge bulunamadı</p>
        <p className="text-sm text-muted-foreground/50 mt-1">Silinmiş ya da erişim izniniz yok olabilir.</p>
        <Button variant="ghost" className="mt-6 gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }

  const tlTutari = belge.tutar * belge.kur;
  const pct = tlTutari > 0 ? Math.min(100, (belge.odenen_toplam_tl / tlTutari) * 100) : 0;
  const durumKey = getDurum(belge.odeme_durumu, belge.gecikmiş);
  const dc = DURUM_CFG[durumKey];
  const DurumIcon = dc.icon;
  const tc = TUR_CFG[belge.tur] ?? TUR_CFG.fatura;

  return (
    <div className="space-y-5 pb-16">

      {/* ── Top Nav ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Belgeler
        </button>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2">
          {belge && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await belgeDetayPdf(belge);
                  toast.success("PDF fişi başarıyla indirildi.");
                } catch {
                  toast.error("PDF oluşturulurken hata oluştu.");
                }
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF Fişi İndir
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/cari/belge/${belgeId}/duzenle`)}
            className="gap-1.5 h-8 text-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Düzenle
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => router.push(`/cari/belge/${belgeId}/duzenle`)}
                className="gap-2 text-sm"
              >
                <Edit3 className="h-3.5 w-3.5" /> Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSilOnay(true)}
                className="gap-2 text-sm text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" /> Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Gecikmiş Uyarı ── */}
      {belge.gecikmiş && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-400">
            <strong>30 gün geçti</strong> — bu belge hâlâ ödenmedi.
          </p>
        </div>
      )}

      {/* ── İki Sütun Layout (desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

        {/* SOL: Belge Bilgileri */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">

          {/* Durum renkli üst çizgi */}
          <div className={`h-[3px] ${dc.barCls}`} />

          <div className="p-7 space-y-8">

            {/* Tür + Belge No */}
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border"
                style={{
                  background: `${tc.color}14`,
                  color: tc.color,
                  borderColor: `${tc.color}35`,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: tc.color }} />
                {tc.label}
              </span>
              <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                {belge.belge_no}
              </span>
            </div>

            {/* Başlık + Durum */}
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight leading-tight">
                {belge.aciklama || "Açıklama yok"}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${dc.textCls} ${dc.bgCls} ${dc.borderCls}`}>
                <DurumIcon className="h-3.5 w-3.5" />
                {dc.label}
              </span>
            </div>

            {/* Büyük Tutar */}
            <div className="space-y-1.5 pb-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Toplam Alacak
              </p>
              <p className="text-5xl font-black tracking-tight tabular-nums leading-none">
                {paraFormat(belge.tutar, belge.para_birimi)}
              </p>
              {belge.kur !== 1 && (
                <p className="text-sm text-muted-foreground tabular-nums pt-1">
                  × {formatKur(belge.kur)} kur ={" "}
                  <strong className="text-foreground">{paraFormat(tlTutari, "TRY")}</strong>
                </p>
              )}
            </div>

            {/* Progress + Ödenen/Kalan/Oran */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  Tahsilat oranı
                  <HelpInfo
                    title="Tahsilat Oranı"
                    description="Belgenin toplam alacak tutarına karşılık şimdiye kadar tahsil edilen ödemelerin yüzdesel tamamlanma oranıdır."
                    side="right"
                  />
                </span>
                <span className="font-bold tabular-nums">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${dc.barCls}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="grid grid-cols-3 rounded-xl border border-border/40 overflow-hidden divide-x divide-border/40">
                <div className="px-4 py-3.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Ödenen</p>
                  <p className="text-base font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                    {paraFormat(belge.odenen_toplam_tl, "TRY")}
                  </p>
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Kalan</p>
                  <p className={`text-base font-black tabular-nums ${
                    belge.kalan <= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : belge.gecikmiş
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}>
                    {belge.kalan > 0 ? paraFormat(belge.kalan, "TRY") : "Kapandı ✓"}
                  </p>
                  {belge.kalan > 0 && belge.para_birimi !== "TRY" && belge.kur > 0 && (
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      ≈ {paraFormat(belge.kalan / belge.kur, belge.para_birimi)}
                    </p>
                  )}
                </div>
                <div className="px-4 py-3.5">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Tahsilat</p>
                  <p className="text-base font-black tabular-nums">{Math.round(pct)}%</p>
                </div>
              </div>
            </div>

            {/* Meta bilgiler */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tarih</p>
                  <p className="text-sm font-semibold truncate">{tarihFormat(belge.tarih)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Firma</p>
                  <p className="text-sm font-semibold truncate">{belge.firma?.ad ?? "—"}</p>
                </div>
              </div>
              {belge.gemi_adi && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-3">
                  <Ship className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Gemi</p>
                    <p className="text-sm font-semibold truncate">{belge.gemi_adi}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-3">
                <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Para Birimi</p>
                  <p className="text-sm font-semibold">{belge.para_birimi}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ: Sticky Tab Paneli */}
        <div className="lg:sticky lg:top-6 space-y-0">
          <Tabs defaultValue="odemeler">
            <div className="p-0.5">
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">

              {/* Tab başlıkları */}
              <TabsList className="w-full h-auto p-0 bg-transparent rounded-none border-b border-border/40 grid grid-cols-3">
                <TabsTrigger
                  value="odemeler"
                  className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-foreground
                    data-[state=active]:bg-transparent data-[state=active]:shadow-none
                    h-11 gap-1.5 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Ödemeler
                  {belge.odemeler.length > 0 && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center">
                      {belge.odemeler.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="dosyalar"
                  className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-foreground
                    data-[state=active]:bg-transparent data-[state=active]:shadow-none
                    h-11 gap-1.5 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Dosyalar
                  {belge.dosyalar.length > 0 && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center">
                      {belge.dosyalar.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="notlar"
                  className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-foreground
                    data-[state=active]:bg-transparent data-[state=active]:shadow-none
                    h-11 gap-1.5 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  Notlar
                  {belge.notlar && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                </TabsTrigger>
              </TabsList>

              {/* Ödemeler */}
              <TabsContent value="odemeler" className="mt-0">
                <div className="p-4 flex items-center justify-between border-b border-border/30">
                  <p className="text-xs text-muted-foreground">
                    {belge.odemeler.length > 0
                      ? `${belge.odemeler.length} kayıt`
                      : "Kayıt yok"}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setOdemeModalAcik(true)}
                    disabled={belge.odeme_durumu === "odendi"}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Ödeme Ekle
                  </Button>
                </div>

                {belge.odemeler.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/60">Ödeme yok</p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">İlk ödemeyi ekleyin</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {belge.odemeler.map((odeme, i) => (
                      <OdemeItem key={odeme.id} odeme={odeme} belgeId={belgeId} index={i} />
                    ))}
                  </div>
                )}

                {belge.odemeler.length > 0 && (
                  <div className="px-4 py-3 border-t border-border/30 bg-muted/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Toplam ödenen</span>
                    <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {paraFormat(belge.odenen_toplam_tl, "TRY")}
                    </span>
                  </div>
                )}
              </TabsContent>

              {/* Dosyalar */}
              <TabsContent value="dosyalar" className="mt-0 p-4">
                <BelgeDosyaPanel
                  belgeId={belgeId}
                  sirketId={belge.sirket_id}
                  dosyalar={belge.dosyalar}
                />
              </TabsContent>

              {/* Notlar */}
              <TabsContent value="notlar" className="mt-0 p-4">
                <NotPanel belgeId={belgeId} notlar={belge.notlar} />
              </TabsContent>
            </div>
            </div>
          </Tabs>
        </div>
      </div>

      {/* ── Ödeme Modal ── */}
      {odemeModalAcik && (
        <OdemeEkleModal
          belgeId={belgeId}
          kalanTutar={belge.kalan}
          belgePb={belge.para_birimi}
          acik={odemeModalAcik}
          onKapat={() => setOdemeModalAcik(false)}
        />
      )}

      {/* ── Sil Onay ── */}
      <AlertDialog open={silOnay} onOpenChange={setSilOnay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belgeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{belge.belge_no}</strong> numaralı belge ve tüm ödemeleri/dosyaları kalıcı olarak silinecek.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBelgeSil}
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
