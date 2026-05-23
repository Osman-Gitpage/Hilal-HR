"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, FileText, Ship, Building2,
  TrendingUp, DollarSign, Euro, Anchor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTumBelgeList, useCariKpi } from "@/hooks/useCari";
import { paraFormat } from "@/lib/cari";
import type { ParaBirimi } from "@/types";
import { ExcelSutunSeciciModal } from "@/components/ui/ExcelSutunSeciciModal";
import { belgeListesiExport, BELGE_TUM_SUTUNLAR, BELGE_SUTUN_SETLERI } from "@/lib/excel/cariExport";

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
// Bağlantı etiketi (gemi / firma)
// ─────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function BaglantiBadge({ belge }: { belge: any }) {
  if (belge.gemi_ad) {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <Anchor className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="font-medium">{belge.gemi_ad}</span>
      </span>
    );
  }
  if (belge.firma_ad) {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <Building2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
        <span className="font-medium">{belge.firma_ad}</span>
      </span>
    );
  }
  return <span className="text-muted-foreground text-sm">—</span>;
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
type TurFiltre = "tumu" | "proforma" | "fatura";
type DurumFiltre = "tumu" | "odendi" | "kismi" | "odenmedi";

export function BelgeListesiView() {
  const router = useRouter();
  const [arama, setArama] = useState("");
  const [turFiltre, setTurFiltre] = useState<TurFiltre>("tumu");
  const [durumFiltre, setDurumFiltre] = useState<DurumFiltre>("tumu");
  const [excelModalAcik, setExcelModalAcik] = useState(false);

  const { data: kpiData = [], isLoading: kpiLoading } = useCariKpi();

  const { data: belgeler = [], isLoading: belgeLoading } = useTumBelgeList({
    tur: turFiltre === "tumu" ? undefined : turFiltre,
    durum: durumFiltre === "tumu" ? undefined : durumFiltre,
    arama: arama || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cari / Fatura</h1>
          <p className="text-muted-foreground mt-1">
            Proforma ve fatura takibi — gemi veya firma bazlı.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            id="btn-firmalar"
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
          <Button id="btn-belge-ekle" onClick={() => router.push("/cari/belge/yeni")}>
            <Plus className="h-4 w-4 mr-2" />
            Belge Ekle
          </Button>
          <Button
            id="btn-belge-excel"
            variant="outline"
            size="sm"
            onClick={() => setExcelModalAcik(true)}
            disabled={belgeLoading}
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

      {/* Filtreler + Tablo */}
      <div className="rounded-xl border bg-card">
        {/* Araç çubuğu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Belgeler</span>
            {!belgeLoading && (
              <Badge variant="secondary">{belgeler.length}</Badge>
            )}
            {/* Tür filtresi */}
            <div className="flex rounded-md border overflow-hidden text-xs ml-2">
              {(["tumu", "proforma", "fatura"] as TurFiltre[]).map((t) => (
                <button
                  key={t}
                  id={`btn-tur-${t}`}
                  onClick={() => setTurFiltre(t)}
                  className={`px-3 py-1.5 transition-colors ${
                    turFiltre === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {t === "tumu" ? "Tümü" : t === "proforma" ? "Proforma" : "Fatura"}
                </button>
              ))}
            </div>
            {/* Durum filtresi */}
            <div className="flex rounded-md border overflow-hidden text-xs">
              {(["tumu", "odenmedi", "kismi", "odendi"] as DurumFiltre[]).map((d) => (
                <button
                  key={d}
                  id={`btn-durum-${d}`}
                  onClick={() => setDurumFiltre(d)}
                  className={`px-3 py-1.5 transition-colors ${
                    durumFiltre === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  {d === "tumu" ? "Tüm Durum" : d === "odendi" ? "Ödendi" : d === "kismi" ? "Kısmi" : "Ödenmedi"}
                </button>
              ))}
            </div>
          </div>
          {/* Arama */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="input-belge-ara"
              placeholder="Belge no, gemi, firma..."
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Tablo */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Belge No</TableHead>
              <TableHead>Tür</TableHead>
              <TableHead>Bağlantı</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Kalan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {belgeLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
              : belgeler.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {arama || turFiltre !== "tumu" || durumFiltre !== "tumu"
                        ? "Filtreye uyan belge bulunamadı."
                        : "Henüz belge kaydı yok. Yeni belge ekleyin."}
                    </TableCell>
                  </TableRow>
                )
                : belgeler.map((b: any) => (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/cari/belge/${b.id}`)}
                  >
                    <TableCell className="font-mono font-medium text-sm">
                      {b.belge_no}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          b.tur === "proforma"
                            ? "border-blue-400 text-blue-600 text-xs"
                            : "border-purple-400 text-purple-600 text-xs"
                        }
                      >
                        {b.tur === "proforma" ? "Proforma" : "Fatura"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <BaglantiBadge belge={b} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {b.tarih}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {paraFormat(b.genel_toplam, b.para_birimi)}
                    </TableCell>
                    <TableCell>
                      <DurumBadge durum={b.odeme_durumu} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {b.kalan > 0
                        ? <span className="text-destructive">{paraFormat(b.kalan, b.para_birimi)}</span>
                        : <span className="text-emerald-600">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Excel Sütun Seçici */}
      <ExcelSutunSeciciModal
        acik={excelModalAcik}
        onKapat={() => setExcelModalAcik(false)}
        baslik="Belge Listesi — Excel'e Aktar"
        tumSutunlar={BELGE_TUM_SUTUNLAR}
        sutunSetleri={BELGE_SUTUN_SETLERI}
        onExport={(sutunlar) => belgeListesiExport(belgeler, { sutunlar })}
      />
    </div>
  );
}
