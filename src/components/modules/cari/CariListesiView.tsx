"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ship, Plus, Search, MoreHorizontal, Eye, Pencil, Trash2,
  TrendingUp, DollarSign, Euro, Loader2, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGemiList, useCariKpi, useInvalidateCari } from "@/hooks/useCari";
import { GemiEkleModal } from "./GemiEkleModal";
import { gemiSil } from "@/app/actions/cari";
import { paraFormat } from "@/lib/cari";
import type { ParaBirimi } from "@/types";
import { ExcelSutunSeciciModal } from "@/components/ui/ExcelSutunSeciciModal";
import { gemiListesiExport, GEMI_TUM_SUTUNLAR, GEMI_SUTUN_SETLERI } from "@/lib/excel/cariExport";

// ─────────────────────────────────────────────
// KPI Kart
// ─────────────────────────────────────────────
function KpiKart({
  pb, toplam, odenen, kalan, yukleniyor,
}: {
  pb: ParaBirimi;
  toplam: number;
  odenen: number;
  kalan: number;
  yukleniyor: boolean;
}) {
  const icons: Record<ParaBirimi, React.ElementType> = {
    TRY: TrendingUp,
    EUR: Euro,
    USD: DollarSign,
  };
  const colors: Record<ParaBirimi, string> = {
    TRY: "bg-blue-600",
    EUR: "bg-emerald-600",
    USD: "bg-amber-600",
  };
  const Ikon = icons[pb];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {pb} — Toplam Alacak
        </CardTitle>
        <div className={`rounded-lg p-2 ${colors[pb]}`}>
          <Ikon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {yukleniyor ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <p className="text-2xl font-bold">{paraFormat(toplam, pb)}</p>
        )}
        <div className="flex gap-3 text-xs text-muted-foreground">
          {yukleniyor ? (
            <Skeleton className="h-4 w-40" />
          ) : (
            <>
              <span className="text-emerald-600">↑ {paraFormat(odenen, pb)} ödendi</span>
              <span className="text-destructive">↓ {paraFormat(kalan, pb)} kalan</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Özet badge'leri
// ─────────────────────────────────────────────
function OzetBadgeler({
  ozet,
}: {
  ozet: Record<string, { alacak: number; odenen: number }>;
}) {
  const girişler = Object.entries(ozet).filter(([, v]) => v.alacak > 0);
  if (!girişler.length)
    return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {girişler.map(([pb, v]) => {
        const kalan = Math.max(0, v.alacak - v.odenen);
        return (
          <Badge
            key={pb}
            variant="outline"
            className={
              kalan <= 0
                ? "border-emerald-500 text-emerald-600 text-[10px]"
                : "border-amber-500 text-amber-700 text-[10px]"
            }
          >
            {pb} {paraFormat(kalan, pb as ParaBirimi)}
          </Badge>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
export function CariListesiView() {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [ekleAcik, setEkleAcik] = useState(false);
  const [silGemiId, setSilGemiId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [excelModalAcik, setExcelModalAcik] = useState(false);

  const { data: gemiler = [], isLoading: gemiLoading } = useGemiList();
  const { data: kpiData = [], isLoading: kpiLoading } = useCariKpi();
  const { invalidateGemiList, invalidateKpi } = useInvalidateCari();

  const aramaLower = arama.toLowerCase();
  const filtrelenmis = gemiler.filter(
    (g) =>
      !aramaLower ||
      g.ad.toLowerCase().includes(aramaLower) ||
      (g.imo_no ?? "").toLowerCase().includes(aramaLower)
  );

  function handleSil() {
    if (!silGemiId) return;
    startTransition(async () => {
      const res = await gemiSil(silGemiId);
      if (res?.hata) {
        toast.error(res.hata);
      } else {
        toast.success("Gemi silindi.");
        invalidateGemiList();
        invalidateKpi();
      }
      setSilGemiId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cari / Fatura</h1>
          <p className="text-muted-foreground mt-1">
            Gemi bazlı alacak takibi, proforma ve fatura yönetimi.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            id="btn-firma-yonetim"
            onClick={() => router.push("/cari/firma")}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Firmalar
          </Button>
          <Button
            variant="outline"
            id="btn-cari-genel"
            onClick={() => router.push("/cari/genel")}
          >
            Genel Görünüm
          </Button>
          <Button id="btn-gemi-ekle" onClick={() => setEkleAcik(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Gemi Ekle
          </Button>
          <Button
            id="btn-gemi-excel"
            variant="outline"
            size="sm"
            onClick={() => setExcelModalAcik(true)}
            disabled={gemiLoading}
            className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700"
          >
            Excel&apos;e Aktar
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiData.length > 0
          ? kpiData.map((k) => (
            <KpiKart
              key={k.para_birimi}
              pb={k.para_birimi}
              toplam={k.toplam_alacak}
              odenen={k.odenen}
              kalan={k.odenmemis}
              yukleniyor={kpiLoading}
            />
          ))
          : (["TRY", "EUR", "USD"] as ParaBirimi[]).map((pb) => (
            <KpiKart
              key={pb}
              pb={pb}
              toplam={0}
              odenen={0}
              kalan={0}
              yukleniyor={kpiLoading}
            />
          ))}
      </div>

      {/* Tablo */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Gemi Listesi</span>
            {!gemiLoading && (
              <Badge variant="secondary">{filtrelenmis.length}</Badge>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="input-gemi-ara"
              placeholder="Gemi adı veya IMO no..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gemi Adı</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>IMO No</TableHead>
              <TableHead>Kalan Bakiye</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {gemiLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
              : filtrelenmis.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      {arama ? "Arama kriterlerine uyan gemi bulunamadı." : "Henüz gemi kaydı yok."}
                    </TableCell>
                  </TableRow>
                )
                : filtrelenmis.map((g) => (
                  <TableRow
                    key={g.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/cari/gemiler/${g.id}`)}
                  >
                    <TableCell className="font-medium">{g.ad}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(g as any).firma?.ad ?? <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {g.imo_no ?? "—"}
                    </TableCell>
                    <TableCell>
                      <OzetBadgeler ozet={g.ozet} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          id={`btn-gemi-islem-${g.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/cari/gemiler/${g.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Detay
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/cari/belge/yeni?gemiId=${g.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Belge Ekle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setSilGemiId(g.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Gemi Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Gemi Ekle Modal */}
      <GemiEkleModal open={ekleAcik} onClose={() => setEkleAcik(false)} />

      {/* Sil Onay */}
      <AlertDialog open={!!silGemiId} onOpenChange={() => setSilGemiId(null)}>
        <AlertDialogContent id="dialog-gemi-sil">
          <AlertDialogHeader>
            <AlertDialogTitle>Gemi silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Gemiye ait tüm belgeler ve ödemeler de silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              id="btn-gemi-sil-onayla"
              onClick={handleSil}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Sütun Seçici */}
      <ExcelSutunSeciciModal
        acik={excelModalAcik}
        onKapat={() => setExcelModalAcik(false)}
        baslik="Gemi Listesi — Excel'e Aktar"
        tumSutunlar={GEMI_TUM_SUTUNLAR}
        sutunSetleri={GEMI_SUTUN_SETLERI}
        onExport={(sutunlar) => gemiListesiExport(filtrelenmis, { sutunlar })}
      />
    </div>
  );
}
