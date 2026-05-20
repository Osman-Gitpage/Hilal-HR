"use client";

import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Anchor, Building2, FileText, Plus, Trash2,
  ChevronDown, ChevronRight, Loader2, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useOdemeList, useInvalidateCari } from "@/hooks/useCari";
import { OdemeEkleModal } from "./OdemeEkleModal";
import { belgeSil, odemeSil } from "@/app/actions/cari";
import { paraFormat } from "@/lib/cari";
import { createClient } from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { ParaBirimi } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─────────────────────────────────────────────
// Belge detayını çek (client hook)
// ─────────────────────────────────────────────
function useBelgeDetay(belgeId: string) {
  return useQuery({
    queryKey: ["belge", "detay", belgeId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("belge")
        .select(`
          *, 
          ilgili_kisi ( id, ad, iletisim ),
          gemi ( id, ad, imo_no ),
          firma ( id, ad ),
          cari_odeme ( id, tutar, para_birimi, kur, baz_tutar, baz_para_birimi, tarih, yontem, dekont_url, aciklama )
        `)
        .eq("id", belgeId)
        .single();
      if (error) throw new Error(error.message);
      return data as any;
    },
    enabled: !!belgeId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Durum Badge
// ─────────────────────────────────────────────
function DurumBadge({ durum }: { durum: string }) {
  if (durum === "odendi")
    return <Badge className="bg-emerald-500 text-white border-0">Ödendi</Badge>;
  if (durum === "kismi")
    return <Badge className="bg-amber-500 text-white border-0">Kısmi Ödendi</Badge>;
  return <Badge variant="outline" className="border-red-400 text-red-500">Ödenmedi</Badge>;
}

function calcDurum(genel: number, odenen: number) {
  if (genel <= 0) return "odendi";
  if (odenen <= 0) return "odenmedi";
  if (odenen >= genel) return "odendi";
  return "kismi";
}

// ─────────────────────────────────────────────
// Ödeme Satırı
// ─────────────────────────────────────────────
function OdemeSatiri({ odeme, belgeId, belge }: { odeme: any; belgeId: string; belge: any }) {
  const [silOpen, setSilOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { invalidateOdemeList, invalidateTumBelgeList, invalidateKpi } = useInvalidateCari();
  const caprazKur = odeme.baz_tutar != null && odeme.baz_para_birimi != null;

  function handleSil() {
    startTransition(async () => {
      const res = await odemeSil(odeme.id, belge?.gemi?.id ?? "");
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("Ödeme silindi.");
        invalidateOdemeList(belgeId);
        invalidateTumBelgeList();
        invalidateKpi();
      }
      setSilOpen(false);
    });
  }

  return (
    <>
      <TableRow>
        <TableCell className="text-sm">{odeme.tarih}</TableCell>
        <TableCell>
          <div className="font-mono font-medium">
            {paraFormat(Number(odeme.tutar), odeme.para_birimi as ParaBirimi)}
          </div>
          {caprazKur && (
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5 space-x-1">
              <span className="text-amber-600">
                ≈ {paraFormat(Number(odeme.baz_tutar), odeme.baz_para_birimi as ParaBirimi)}
              </span>
              {odeme.kur && (
                <span>(kur: {Number(odeme.kur).toLocaleString("tr-TR")})</span>
              )}
            </div>
          )}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-xs">
            {odeme.yontem === "banka" ? "Banka" : "Elden"}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{odeme.aciklama ?? "—"}</TableCell>
        <TableCell>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => setSilOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      </TableRow>

      <AlertDialog open={silOpen} onOpenChange={() => setSilOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödeme silinsin mi?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSil} disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─────────────────────────────────────────────
// Ana Bileşen
// ─────────────────────────────────────────────
export function BelgeDetayView({ paramsPromise }: { paramsPromise: Promise<{ belgeId: string }> }) {
  const { belgeId } = use(paramsPromise);
  const router = useRouter();
  const [odemeEkleAcik, setOdemeEkleAcik] = useState(false);
  const [silOpen, setSilOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { invalidateTumBelgeList, invalidateKpi, invalidateGenel } = useInvalidateCari();

  const { data: belge, isLoading } = useBelgeDetay(belgeId);
  const { data: odemeler = [], isLoading: odemeLoading } = useOdemeList(belgeId);

  // Hesaplamalar
  const odenenToplam = (odemeler as any[]).reduce(
    (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0), 0
  );
  const genel = Number(belge?.genel_toplam ?? 0);
  const kalan = Math.max(0, genel - odenenToplam);
  const durum = calcDurum(genel, odenenToplam);

  function handleBelgeSil() {
    startTransition(async () => {
      const res = await belgeSil(belgeId, belge?.gemi?.id ?? "");
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("Belge silindi.");
        invalidateTumBelgeList();
        invalidateKpi();
        invalidateGenel();
        router.push("/cari");
      }
      setSilOpen(false);
    });
  }

  // Bağlantı (gemi veya firma)
  const baglanti = isLoading ? null : belge?.gemi
    ? { tip: "gemi" as const, ad: belge.gemi.ad, alt: belge.gemi.imo_no }
    : belge?.firma
    ? { tip: "firma" as const, ad: belge.firma.ad, alt: null }
    : belge?.tek_gemi_adi
    ? { tip: "gemi" as const, ad: belge.tek_gemi_adi, alt: "tek seferlik" }
    : belge?.tek_firma_adi
    ? { tip: "firma" as const, ad: belge.tek_firma_adi, alt: "tek seferlik" }
    : null;

  return (
    <div className="space-y-6">
      {/* Geri */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/cari")} id="btn-geri">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Belgeler
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm" id="btn-belge-duzenle"
            onClick={() => router.push(`/cari/belge/${belgeId}/duzenle`)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Düzenle
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            id="btn-belge-sil"
            onClick={() => setSilOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Sil
          </Button>
        </div>
      </div>

      {/* Belge Başlık Kartı */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              {isLoading ? (
                <Skeleton className="h-7 w-48" />
              ) : (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      belge?.tur === "proforma"
                        ? "border-blue-400 text-blue-600"
                        : "border-purple-400 text-purple-600"
                    }
                  >
                    {belge?.tur === "proforma" ? "Proforma" : "Fatura"}
                  </Badge>
                  <CardTitle className="text-xl font-mono">{belge?.belge_no}</CardTitle>
                </div>
              )}
              {/* Bağlantı */}
              {isLoading ? (
                <Skeleton className="h-5 w-36" />
              ) : baglanti ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {baglanti.tip === "gemi"
                    ? <Anchor className="h-4 w-4 text-blue-500" />
                    : <Building2 className="h-4 w-4 text-purple-500" />}
                  <span className="font-medium text-foreground">{baglanti.ad}</span>
                  {baglanti.alt && (
                    <span className="font-mono text-xs">{baglanti.alt}</span>
                  )}
                </div>
              ) : null}
              {/* Tarih */}
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <p className="text-sm text-muted-foreground">{belge?.tarih}</p>
              )}
            </div>
            {/* Durum + Tutar */}
            <div className="text-right space-y-1 shrink-0">
              {isLoading ? (
                <Skeleton className="h-8 w-36" />
              ) : (
                <>
                  <p className="text-2xl font-bold font-mono">
                    {paraFormat(genel, belge?.para_birimi as ParaBirimi)}
                  </p>
                  <DurumBadge durum={durum} />
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Özet satırları */}
        {!isLoading && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Ödenen</p>
                <p className="font-mono font-semibold text-emerald-600">
                  {paraFormat(odenenToplam, belge?.para_birimi as ParaBirimi)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Kalan</p>
                <p className={`font-mono font-semibold ${kalan > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {kalan > 0 ? paraFormat(kalan, belge?.para_birimi as ParaBirimi) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Para Birimi</p>
                <p className="font-mono font-semibold">{belge?.para_birimi}</p>
              </div>
            </div>
            {belge?.notlar && (
              <p className="mt-4 text-sm text-muted-foreground border-t pt-3">{belge.notlar}</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Kalemler */}
      {!isLoading && Array.isArray(belge?.kalemler) && belge.kalemler.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kalemler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="w-20 text-right">Miktar</TableHead>
                  <TableHead className="w-20">Birim</TableHead>
                  <TableHead className="w-28 text-right">Birim Fiyat</TableHead>
                  <TableHead className="w-24 text-right">İskonto</TableHead>
                  <TableHead className="w-32 text-right">Satır Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(belge.kalemler as any[]).map((k: any, i: number) => {
                  const satirToplam = Math.max(0, k.miktar * k.birim_fiyat - (k.iskonto ?? 0));
                  return (
                    <TableRow key={i}>
                      <TableCell>{k.aciklama}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{k.miktar}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{k.birim}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {paraFormat(k.birim_fiyat, belge.para_birimi)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {k.iskonto > 0 ? paraFormat(k.iskonto, belge.para_birimi) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-sm">
                        {paraFormat(satirToplam, belge.para_birimi)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* Toplam satırları */}
            <div className="p-4 border-t space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Ara Toplam</span>
                <span className="font-mono">{paraFormat(Number(belge.toplam), belge.para_birimi)}</span>
              </div>
              {Number(belge.iskonto) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Belge İskontosu</span>
                  <span className="font-mono text-destructive">-{paraFormat(Number(belge.iskonto), belge.para_birimi)}</span>
                </div>
              )}
              {belge.kdv_orani && (
                <div className="flex justify-between text-muted-foreground">
                  <span>KDV (%{belge.kdv_orani})</span>
                  <span className="font-mono text-amber-600">
                    {paraFormat(genel - (Number(belge.toplam) - Number(belge.iskonto)), belge.para_birimi)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Genel Toplam</span>
                <span className="font-mono">{paraFormat(genel, belge.para_birimi)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ödemeler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Ödemeler</CardTitle>
          <Button
            size="sm" id="btn-odeme-ekle"
            onClick={() => setOdemeEkleAcik(true)}
            disabled={durum === "odendi"}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ödeme Ekle
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {odemeLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (odemeler as any[]).length === 0 ? (
            <p className="text-center py-10 text-muted-foreground text-sm">
              Henüz ödeme kaydı yok.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Yöntem</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(odemeler as any[]).map((o: any) => (
                  <OdemeSatiri key={o.id} odeme={o} belgeId={belgeId} belge={belge} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ödeme Ekle Modal */}
      <OdemeEkleModal
        belgeId={odemeEkleAcik ? belgeId : null}
        gemiId={belge?.gemi?.id ?? null}
        belgePb={belge?.para_birimi as ParaBirimi}
        onClose={() => setOdemeEkleAcik(false)}
      />

      {/* Belge Sil Onay */}
      <AlertDialog open={silOpen} onOpenChange={() => setSilOpen(false)}>
        <AlertDialogContent id="dialog-belge-sil">
          <AlertDialogHeader>
            <AlertDialogTitle>Belge silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Belgeye ait tüm ödemeler de silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              id="btn-belge-sil-onayla"
              onClick={handleBelgeSil}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
