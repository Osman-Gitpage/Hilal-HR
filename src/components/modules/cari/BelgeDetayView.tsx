"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Edit3, Trash2, AlertCircle, Clock,
  Building2, Calendar, FileText, CreditCard,
  CheckCircle2, Loader2, Save, Banknote, X, Ship,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  useBelgeDetay,
  useBelgeSil,
  useOdemeSil,
  useBelgeNotlarGuncelle,
} from "@/hooks/useCari";
import {
  paraFormat,
  tarihFormat,
  belgeTypeName,
} from "@/lib/cari";
import type { BelgeTur, OdemeDurumu, Odeme } from "@/types/cari";
import { OdemeEkleModal } from "./OdemeEkleModal";
import { BelgeDosyaPanel } from "./BelgeDosyaPanel";

// ─── Durum Badge ──────────────────────────────────────────────────────────────

function DurumBadge({ durum, gecikmiş }: { durum: OdemeDurumu; gecikmiş: boolean }) {
  if (gecikmiş)
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" /> Gecikmiş
      </Badge>
    );
  if (durum === "odendi")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Ödendi
      </Badge>
    );
  if (durum === "kismi")
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
        <Clock className="h-3 w-3" /> Kısmi Ödendi
      </Badge>
    );
  return (
    <Badge className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 gap-1">
      <AlertCircle className="h-3 w-3" /> Ödenmedi
    </Badge>
  );
}

// ─── Ödeme Satırı ─────────────────────────────────────────────────────────────

function OdemeSatiri({
  odeme,
  belgeId,
}: {
  odeme: Odeme;
  belgeId: string;
}) {
  const { mutateAsync: sil, isPending } = useOdemeSil();
  const [silOnay, setSilOnay] = React.useState(false);

  const handleSil = async () => {
    const sonuc = await sil({ odemeId: odeme.id, belgeId });
    if (sonuc.basarili) {
      toast.success("Ödeme silindi.");
    } else {
      toast.error(`Hata: ${sonuc.hata}`);
    }
    setSilOnay(false);
  };

  const tlKarsiligi = odeme.tutar * odeme.kur;

  return (
    <>
      <TableRow className="group">
        <TableCell className="text-sm">{tarihFormat(odeme.tarih)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums text-sm">
          {paraFormat(odeme.tutar, odeme.para_birimi)}
          {odeme.kur !== 1 && (
            <div className="text-[10px] text-muted-foreground/60 font-normal">
              × {odeme.kur.toFixed(4)} = {paraFormat(tlKarsiligi, "TRY")}
            </div>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${
              odeme.yontem === "banka"
                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400"
            }`}
          >
            {odeme.yontem === "banka" ? "Banka" : "Elden"}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
          {odeme.aciklama ?? "—"}
        </TableCell>
        <TableCell className="w-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={() => setSilOnay(true)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </TableCell>
      </TableRow>

      <AlertDialog open={silOnay} onOpenChange={setSilOnay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödemeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              {tarihFormat(odeme.tarih)} tarihli{" "}
              {paraFormat(odeme.tutar, odeme.para_birimi)} tutarındaki ödeme kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSil}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Notlar Tab ───────────────────────────────────────────────────────────────

function NotlarTab({ belgeId, notlar }: { belgeId: string; notlar: string | null }) {
  const { mutateAsync: kaydet, isPending } = useBelgeNotlarGuncelle();
  const [not, setNot] = React.useState(notlar ?? "");
  const degisti = not !== (notlar ?? "");

  const handleKaydet = async () => {
    const sonuc = await kaydet({ id: belgeId, notlar: not.trim() || null });
    if (sonuc.basarili) {
      toast.success("Notlar kaydedildi.");
    } else {
      toast.error(`Hata: ${sonuc.hata}`);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <Textarea
        value={not}
        onChange={(e) => setNot(e.target.value)}
        placeholder="Belge ile ilgili notlarınızı buraya yazın…"
        className="min-h-[160px] text-sm resize-none"
      />
      <div className="flex justify-end">
        <Button
          onClick={handleKaydet}
          disabled={!degisti || isPending}
          className="gap-1.5 h-8 text-sm"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
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

  // Yükleniyor
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // Hata
  if (error || !belge) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/40 mb-3" />
        <p className="text-base font-semibold">Belge bulunamadı</p>
        <Button
          variant="ghost"
          className="mt-4 gap-1.5"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Geri Dön
        </Button>
      </div>
    );
  }

  const tlTutari = belge.tutar * belge.kur;
  const odenenYuzde =
    tlTutari > 0 ? Math.min(100, (belge.odenen_toplam_tl / tlTutari) * 100) : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* ── Geri + Aksiyonlar ── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/cari/belge/${belgeId}/duzenle`)}
            className="gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSilOnay(true)}
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Sil
          </Button>
        </div>
      </div>

      {/* ── Gecikmiş Uyarı Bandı ── */}
      {belge.gecikmiş && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-400 font-semibold">
            Bu belge 30 günü geçti ve hâlâ ödenmedi.
          </p>
        </div>
      )}

      {/* ── Üst Kart ── */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        {/* Başlık satırı */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-muted-foreground tracking-widest">
                {belge.belge_no}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-black tracking-wider"
              >
                {belgeTypeName(belge.tur as BelgeTur)}
              </Badge>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">{belge.aciklama}</h1>
          </div>
          <DurumBadge durum={belge.odeme_durumu} gecikmiş={belge.gecikmiş} />
        </div>

        {/* Meta bilgiler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tarih</p>
              <p className="text-sm font-semibold">{tarihFormat(belge.tarih)}</p>
            </div>
          </div>
          {belge.firma && (
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Firma</p>
                <p className="text-sm font-semibold">{belge.firma.ad}</p>
              </div>
            </div>
          )}
          {belge.gemi_adi && (
            <div className="flex items-start gap-2">
              <Ship className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gemi</p>
                <p className="text-sm font-semibold">{belge.gemi_adi}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Banknote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tutar</p>
              <p className="text-sm font-bold tabular-nums">
                {paraFormat(belge.tutar, belge.para_birimi)}
              </p>
              {belge.kur !== 1 && (
                <p className="text-[10px] text-muted-foreground">
                  × {belge.kur} = {paraFormat(tlTutari, "TRY")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Kalan{belge.para_birimi !== "TRY" ? " (TL)" : ""}
              </p>
              <p className={`text-sm font-bold tabular-nums ${belge.kalan > 0 ? (belge.gecikmiş ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400") : "text-emerald-600 dark:text-emerald-400"}`}>
                {belge.kalan > 0
                  ? paraFormat(belge.kalan, "TRY")
                  : "Kapandı ✓"}
              </p>
              {/* Dövizli belgeler için orijinal para birimi karşılığı */}
              {belge.kalan > 0 && belge.para_birimi !== "TRY" && belge.kur > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  ≈ {paraFormat(belge.kalan / belge.kur, belge.para_birimi)} ({belge.para_birimi})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* İlerleme çubuğu */}
        {tlTutari > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>{Math.round(odenenYuzde)}% ödendi</span>
              <span>{paraFormat(belge.odenen_toplam_tl, "TRY")} / {paraFormat(tlTutari, "TRY")}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  odenenYuzde >= 100
                    ? "bg-emerald-500"
                    : odenenYuzde > 0
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${odenenYuzde}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tab Sistemi ── */}
      <Tabs defaultValue="odemeler" className="space-y-4">
        <TabsList className="h-9">
          <TabsTrigger value="odemeler" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            Ödemeler
            {belge.odemeler.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5">
                {belge.odemeler.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="dosyalar" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Dosyalar
            {belge.dosyalar.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5">
                {belge.dosyalar.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notlar" className="gap-1.5 text-xs">
            <Edit3 className="h-3.5 w-3.5" />
            Notlar
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Ödemeler */}
        <TabsContent value="odemeler" className="space-y-3 mt-0">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setOdemeModalAcik(true)}
              disabled={belge.odeme_durumu === "odendi"}
              className="gap-1.5 h-8 text-xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Ödeme Ekle
            </Button>
          </div>

          {belge.odemeler.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Henüz ödeme eklenmemiş</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-bold">Tarih</TableHead>
                    <TableHead className="text-xs font-bold text-right">Tutar</TableHead>
                    <TableHead className="text-xs font-bold">Yöntem</TableHead>
                    <TableHead className="text-xs font-bold">Açıklama</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {belge.odemeler.map((odeme) => (
                    <OdemeSatiri key={odeme.id} odeme={odeme} belgeId={belgeId} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Dosyalar */}
        <TabsContent value="dosyalar" className="mt-0">
          <BelgeDosyaPanel
            belgeId={belgeId}
            sirketId={belge.sirket_id}
            dosyalar={belge.dosyalar}
          />
        </TabsContent>

        {/* Tab 3: Notlar */}
        <TabsContent value="notlar" className="mt-0">
          <NotlarTab belgeId={belgeId} notlar={belge.notlar} />
        </TabsContent>
      </Tabs>

      {/* ── Ödeme Ekle Modal ── */}
      {odemeModalAcik && (
        <OdemeEkleModal
          belgeId={belgeId}
          kalanTutar={belge.kalan}
          belgePb={belge.para_birimi}
          acik={odemeModalAcik}
          onKapat={() => setOdemeModalAcik(false)}
        />
      )}

      {/* ── Belge Sil Onay ── */}
      <AlertDialog open={silOnay} onOpenChange={setSilOnay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belgeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{belge.belge_no}</strong> numaralı belge ve tüm ödemeleri/dosyaları
              kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBelgeSil}
              disabled={siliniyor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {siliniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
