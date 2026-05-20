"use client";

import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Ship, Plus, ChevronDown, ChevronRight,
  Trash2, Loader2, Receipt, FileText, CreditCard, User, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGemiDetay, useBelgeList, useInvalidateCari } from "@/hooks/useCari";
import { OdemeEkleModal } from "./OdemeEkleModal";
import { IlgiliKisiPanel } from "./IlgiliKisiPanel";
import { belgeSil, odemeSil } from "@/app/actions/cari";
import { paraFormat } from "@/lib/cari";
import type { ParaBirimi } from "@/types";

// ─────────────────────────────────────────────
// Durum Badge
// ─────────────────────────────────────────────
function DurumBadge({ durum }: { durum: string }) {
  if (durum === "odendi")
    return <Badge className="bg-emerald-500 text-white border-0 text-xs">Ödendi</Badge>;
  if (durum === "kismi")
    return <Badge className="bg-amber-500 text-white border-0 text-xs">Kısmi</Badge>;
  return <Badge variant="outline" className="border-red-400 text-red-500 text-xs">Ödenmedi</Badge>;
}

// ─────────────────────────────────────────────
// Belge Satırı (accordion ile ödemeler)
// ─────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function BelgeSatiri({
  belge,
  gemiId,
  onOdemeEkle,
}: {
  belge: any;
  gemiId: string;
  onOdemeEkle: (belgeId: string, pb: string) => void;
}) {
  const [acik, setAcik] = useState(false);
  const [silId, setSilId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { invalidateBelgeList, invalidateKpi, invalidateGenel } = useInvalidateCari();

  function handleBelgeSil() {
    startTransition(async () => {
      const res = await belgeSil(belge.id, gemiId);
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("Belge silindi.");
        invalidateBelgeList(gemiId);
        invalidateKpi();
        invalidateGenel();
      }
      setSilId(null);
    });
  }

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setAcik((v) => !v)}
      >
        <TableCell className="w-8">
          {acik
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs font-mono mr-2">
            {belge.tur === "proforma" ? "PRF" : "FAT"}
          </Badge>
          {belge.belge_no}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{belge.tarih}</TableCell>
        <TableCell className="font-mono font-medium">
          {paraFormat(belge.genel_toplam, belge.para_birimi)}
        </TableCell>
        <TableCell><DurumBadge durum={belge.odeme_durumu} /></TableCell>
        <TableCell className="font-mono text-sm">
          {belge.kalan > 0
            ? <span className="text-destructive">{paraFormat(belge.kalan, belge.para_birimi)}</span>
            : <span className="text-emerald-600">—</span>}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              id={`btn-odeme-ekle-${belge.id}`}
              onClick={() => onOdemeEkle(belge.id, belge.para_birimi)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              id={`btn-belge-duzenle-${belge.id}`}
              onClick={() => router.push(`/cari/belge/${belge.id}/duzenle`)}
            >
              <FileText className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              id={`btn-belge-sil-${belge.id}`}
              onClick={() => setSilId(belge.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Accordion: Ödemeler */}
      {acik && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={7} className="py-3 px-6">
            <OdemelerAccordion belgeId={belge.id} gemiId={gemiId} />
          </TableCell>
        </TableRow>
      )}

      {/* Sil onay */}
      <AlertDialog open={!!silId} onOpenChange={() => setSilId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belge silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Belgeye ait tüm ödemeler de silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBelgeSil}
              disabled={isPending}
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
// Ödemeler Accordion içeriği
// ─────────────────────────────────────────────
function OdemelerAccordion({ belgeId, gemiId }: { belgeId: string; gemiId: string }) {
  const [silId, setSilId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { invalidateBelgeList, invalidateOdemeList, invalidateKpi } = useInvalidateCari();

  // fetch ödemeler inline (hook with supabase client)
  const { data: odemeler = [], isLoading } = useOdemeListInline(belgeId);

  function handleSil() {
    if (!silId) return;
    startTransition(async () => {
      const res = await odemeSil(silId, gemiId);
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("Ödeme silindi.");
        invalidateOdemeList(belgeId);
        invalidateBelgeList(gemiId);
        invalidateKpi();
      }
      setSilId(null);
    });
  }

  if (isLoading) return <Skeleton className="h-8 w-full" />;
  if (!odemeler.length)
    return <p className="text-muted-foreground text-sm">Henüz ödeme kaydı yok.</p>;

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
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
            {odemeler.map((o: any) => {
              const caprazKur = o.baz_tutar != null && o.baz_para_birimi != null;
              return (
                <TableRow key={o.id}>
                  <TableCell className="text-sm">{o.tarih}</TableCell>
                  <TableCell>
                    <div className="font-mono font-medium">
                      {paraFormat(Number(o.tutar), o.para_birimi as ParaBirimi)}
                    </div>
                    {caprazKur && (
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5 space-x-1">
                        <span className="text-amber-600">
                          ≈ {paraFormat(Number(o.baz_tutar), o.baz_para_birimi as ParaBirimi)}
                        </span>
                        {o.kur && (
                          <span>(kur: {Number(o.kur).toLocaleString("tr-TR")})</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {o.yontem === "banka" ? "Banka" : "Elden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{o.aciklama ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setSilId(o.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!silId} onOpenChange={() => setSilId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödeme silinsin mi?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSil}
              disabled={isPending}
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

// Inline hook — ödemeleri çek
import { useOdemeList } from "@/hooks/useCari";
function useOdemeListInline(belgeId: string) {
  return useOdemeList(belgeId);
}

// ─────────────────────────────────────────────
// Belge Tablosu (tab içinde)
// ─────────────────────────────────────────────
function BelgeTablosu({
  gemiId,
  tur,
  onOdemeEkle,
}: {
  gemiId: string;
  tur?: "proforma" | "fatura";
  onOdemeEkle: (belgeId: string, pb: string) => void;
}) {
  const { data: belgeler = [], isLoading } = useBelgeList(gemiId, tur);

  if (isLoading)
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );

  if (!belgeler.length)
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        Henüz kayıt yok.
      </div>
    );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Belge No</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Tutar</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Kalan</TableHead>
          <TableHead className="w-28">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {belgeler.map((b: any) => (
          <BelgeSatiri key={b.id} belge={b} gemiId={gemiId} onOdemeEkle={onOdemeEkle} />
        ))}
      </TableBody>
    </Table>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
export function GemiDetayView({
  paramsPromise,
}: {
  paramsPromise: Promise<{ gemiId: string }>;
}) {
  const { gemiId } = use(paramsPromise);
  const router = useRouter();
  const [odemeEkle, setOdemeEkle] = useState<string | null>(null);
  const [odemeBelgePb, setOdemeBelgePb] = useState<string | undefined>();

  const { data: gemi, isLoading } = useGemiDetay(gemiId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Geri */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/cari/gemiler")}
          id="btn-geri-cari"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Gemiler
        </Button>
      </div>

      {/* Gemi Kart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Ship className="h-5 w-5 text-white" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                <CardTitle className="text-xl">{gemi?.ad}</CardTitle>
              )}
              {isLoading ? (
                <Skeleton className="h-4 w-24 mt-1" />
              ) : gemi?.imo_no ? (
                <p className="text-sm text-muted-foreground font-mono">{gemi.imo_no}</p>
              ) : null}
            </div>
          </div>
          <Button
            id="btn-belge-ekle"
            onClick={() => router.push(`/cari/belge/yeni?gemiId=${gemiId}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Belge Ekle
          </Button>
        </CardHeader>

        {gemi?.firma && (
          <CardContent className="pt-0 pb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{gemi.firma.ad}</span>
            </div>
          </CardContent>
        )}
        {gemi?.notlar && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{gemi.notlar}</p>
          </CardContent>
        )}
      </Card>

      {/* İlgili Kişiler + Belgeler */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* İlgili Kişiler */}
        <div className="lg:col-span-1">
          <IlgiliKisiPanel gemiId={gemiId} />
        </div>

        {/* Belgeler */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="tumu">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="tumu" id="tab-tumu">
                  <Receipt className="h-3.5 w-3.5 mr-1.5" />
                  Tümü
                </TabsTrigger>
                <TabsTrigger value="proforma" id="tab-proforma">
                  Proforma
                </TabsTrigger>
                <TabsTrigger value="fatura" id="tab-fatura">
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Fatura
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="rounded-xl border bg-card">
              <TabsContent value="tumu" className="m-0">
                <BelgeTablosu gemiId={gemiId} onOdemeEkle={(id, pb) => { setOdemeEkle(id); setOdemeBelgePb(pb); }} />
              </TabsContent>
              <TabsContent value="proforma" className="m-0">
                <BelgeTablosu gemiId={gemiId} tur="proforma" onOdemeEkle={(id, pb) => { setOdemeEkle(id); setOdemeBelgePb(pb); }} />
              </TabsContent>
              <TabsContent value="fatura" className="m-0">
                <BelgeTablosu gemiId={gemiId} tur="fatura" onOdemeEkle={(id, pb) => { setOdemeEkle(id); setOdemeBelgePb(pb); }} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Ödeme Ekle Modal */}
      <OdemeEkleModal
        belgeId={odemeEkle}
        gemiId={gemiId}
        belgePb={odemeBelgePb as any}
        onClose={() => { setOdemeEkle(null); setOdemeBelgePb(undefined); }}
      />
    </div>
  );
}
