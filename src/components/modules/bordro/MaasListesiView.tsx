"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Users, Banknote, TrendingDown, HandCoins,
  CheckCircle2, Lock, Clock, FileEdit, Loader2, RotateCcw,
  ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react";
import { nextSort, compareValues, type SortState } from "@/lib/utils/sort";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/uiStore";
import { useDonemBordrolari, useInvalidateBordro, type BordroListeItem } from "@/hooks/useMaasBordro";
import { useAyarlar } from "@/hooks/useAyarlar";
import { bordroDurumGuncelle, revizyonBaslat } from "@/app/actions/maas";
import { formatPara, formatAdSoyad } from "@/lib/utils/index";
import { VARSAYILAN_AYLIK_CALISMA_SAATI, AY_ADLARI } from "@/lib/constants";
import { DonemSecici } from "@/components/modules/bordro/DonemSecici";

// ─────────────────────────────────────────────
// Durum Badge
// ─────────────────────────────────────────────
function DurumBadge({ durum }: { durum: string }) {
  const ayar: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
    taslak: { label: "Taslak", variant: "secondary", icon: FileEdit },
    kontrol_bekliyor: { label: "Kontrol Bekliyor", variant: "outline", icon: Clock },
    onaylandi: { label: "Onaylandı", variant: "default", icon: CheckCircle2 },
    kilitlendi: { label: "Kilitlendi", variant: "destructive", icon: Lock },
  };
  const a = ayar[durum] ?? ayar.taslak;
  const Ikon = a.icon;
  return (
    <Badge variant={a.variant} className="gap-1 text-xs">
      <Ikon className="h-3 w-3" />
      {a.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────
// KPI Kart
// ─────────────────────────────────────────────
function KpiKart({
  baslik, deger, ikon: Ikon, renk, yukleniyor, para = true,
}: {
  baslik: string; deger: number; ikon: React.ElementType; renk: string;
  yukleniyor: boolean; para?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{baslik}</CardTitle>
        <div className={`rounded-lg p-2 ${renk}`}>
          <Ikon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {yukleniyor ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-bold">{para ? formatPara(deger) : deger}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
type BordroSortField = "adSoyad" | "toplamOdeme" | "toplamKesinti" | "elden" | "durum";

function SortIcon({ field, sort }: { field: BordroSortField; sort: SortState<BordroSortField> }) {
  if (sort.field !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50 inline" />;
  return sort.dir === "asc"
    ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary inline" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary inline" />;
}

export function MaasListesiView() {
  const { seciliDonemYil, seciliDonemAy } = useUIStore();
  const { data: bordro_listesi_raw = [], isLoading, isError } = useDonemBordrolari(
    seciliDonemYil, seciliDonemAy
  );
  const [isPending, startTransition] = useTransition();
  const [sort, setSort] = useState<SortState<BordroSortField>>({ field: "adSoyad", dir: "asc" });
  const [revizyonYukleniyor, setRevizyonYukleniyor] = useState<string | null>(null);
  const { data: ayarlar } = useAyarlar();
  const aylikCalisma = ayarlar?.aylik_calisma_saati ?? VARSAYILAN_AYLIK_CALISMA_SAATI;
  const invalidate = useInvalidateBordro();

  const bordro_listesi = useMemo(() => {
    if (!sort.field) return bordro_listesi_raw;
    return [...bordro_listesi_raw].sort((a, b) => {
      switch (sort.field) {
        case "adSoyad": return compareValues(`${a.personel.ad} ${a.personel.soyad}`, `${b.personel.ad} ${b.personel.soyad}`, sort.dir);
        case "toplamOdeme": return compareValues(a.toplam_odeme, b.toplam_odeme, sort.dir);
        case "toplamKesinti": return compareValues(a.toplam_kesinti, b.toplam_kesinti, sort.dir);
        case "elden": return compareValues(a.elden, b.elden, sort.dir);
        case "durum": return compareValues(a.durum, b.durum, sort.dir);
        default: return 0;
      }
    });
  }, [bordro_listesi_raw, sort]);

  function handleSort(field: BordroSortField) {
    setSort((s) => nextSort(s, field));
  }

  // KPI hesapla — Number() cast: Supabase numeric → JS string olarak gelebilir
  const kpi = useMemo(() => {
    const aktif = bordro_listesi.filter(
      (b) => b.durum === "onaylandi" || b.durum === "kilitlendi"
    );
    return {
      personelSayisi: bordro_listesi.length,
      toplamOdeme:   aktif.reduce((s, b) => s + Number(b.toplam_odeme  ?? 0), 0),
      toplamKesinti: aktif.reduce((s, b) => s + Number(b.toplam_kesinti ?? 0), 0),
      toplamElden:   aktif.reduce((s, b) => s + Number(b.elden          ?? 0), 0),
    };
  }, [bordro_listesi]);

  function durumGuncelle(bordroId: string, yeniDurum: "kontrol_bekliyor" | "onaylandi" | "kilitlendi" | "taslak") {
    startTransition(async () => {
      const sonuc = await bordroDurumGuncelle(bordroId, yeniDurum);
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Bordro durumu güncellendi.");
      invalidate(seciliDonemYil, seciliDonemAy, null);
    });
  }

  function revizyonBaslat_handler(bordroId: string) {
    // Zaten işlemde ise çıkt
    if (revizyonYukleniyor) return;
    const neden = window.prompt("Revizyon nedeni giriniz:");
    if (!neden?.trim()) { toast.error("Revizyon nedeni boş olamaz."); return; }
    // Hemen loading'e al — double-click engelle
    setRevizyonYukleniyor(bordroId);
    startTransition(async () => {
      const sonuc = await revizyonBaslat(bordroId, neden.trim());
      setRevizyonYukleniyor(null);
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Revizyon başlatıldı — bordro taslak durumuna alındı.");
      // Tüm ilgili query cache'ini temizle
      invalidate(seciliDonemYil, seciliDonemAy, null);
    });
  }

  // Sütun sayısı
  const COL = 19;

  return (
    <div className="space-y-5">
      {/* Üst bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DonemSecici />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiKart baslik="Toplam Personel" deger={kpi.personelSayisi} ikon={Users} renk="bg-blue-600" yukleniyor={isLoading} para={false} />
        <KpiKart baslik="Toplam Ödeme" deger={kpi.toplamOdeme} ikon={Banknote} renk="bg-emerald-600" yukleniyor={isLoading} />
        <KpiKart baslik="Toplam Kesinti" deger={kpi.toplamKesinti} ikon={TrendingDown} renk="bg-rose-600" yukleniyor={isLoading} />
        <KpiKart baslik="Toplam Elden" deger={kpi.toplamElden} ikon={HandCoins} renk="bg-amber-600" yukleniyor={isLoading} />
      </div>

      {/* Tablo */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="sticky left-0 bg-card z-10 w-8">#</TableHead>
                <TableHead className="sticky left-8 bg-card z-10 min-w-[140px]">
                  <button onClick={() => handleSort("adSoyad")} className="flex items-center hover:text-foreground transition-colors">
                    Ad Soyad<SortIcon field="adSoyad" sort={sort} />
                  </button>
                </TableHead>
                <TableHead>Çalış. S.</TableHead>
                <TableHead>Hak Ediş</TableHead>
                <TableHead>Mesai S.</TableHead>
                <TableHead>Mesai B.</TableHead>
                <TableHead>Yol</TableHead>
                <TableHead>Yemek</TableHead>
                <TableHead>Prim</TableHead>
                <TableHead>Diğer(+)</TableHead>
                <TableHead className="font-bold">
                  <button onClick={() => handleSort("toplamOdeme")} className="flex items-center hover:text-foreground transition-colors">
                    Toplam<SortIcon field="toplamOdeme" sort={sort} />
                  </button>
                </TableHead>
                <TableHead>Banka</TableHead>
                <TableHead>BES</TableHead>
                <TableHead>Avans</TableHead>
                <TableHead>Diğer(-)</TableHead>
                <TableHead className="font-bold">
                  <button onClick={() => handleSort("toplamKesinti")} className="flex items-center hover:text-foreground transition-colors">
                    Kesinti<SortIcon field="toplamKesinti" sort={sort} />
                  </button>
                </TableHead>
                <TableHead className="font-bold">
                  <button onClick={() => handleSort("elden")} className="flex items-center hover:text-foreground transition-colors">
                    Elden<SortIcon field="elden" sort={sort} />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("durum")} className="flex items-center hover:text-foreground transition-colors">
                    Durum<SortIcon field="durum" sort={sort} />
                  </button>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COL }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={COL} className="text-center py-10 text-destructive">
                  Veriler yüklenirken hata oluştu.
                </TableCell>
              </TableRow>
            ) : bordro_listesi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL} className="text-center py-12 text-muted-foreground">
                  Bu döneme ait bordro kaydı yok.
                </TableCell>
              </TableRow>
            ) : (
              bordro_listesi.map((b: BordroListeItem, idx: number) => {
                // Ek kalemler artık bordro_ek_kalem tablosundan geliyor.
                // Detay sayfasında gösterilir; listede sadece bordronun kayıtlı toplam_odeme değerini kullanıyoruz.
                // Number() cast: Supabase numeric → JS string olarak gelebilir
                const _maasNet       = Number(b.maas_net);
                const _calismaSaati  = Number(b.calisma_saati);
                const _mesaiSaati    = Number(b.mesai_saati);
                const saatlikUcret   = aylikCalisma > 0 ? _maasNet / aylikCalisma : 0;
                const hakEdis        = _calismaSaati * saatlikUcret;
                const mesaiBedeli    = _mesaiSaati   * saatlikUcret;

                return (
                  <TableRow key={b.id} className="text-sm hover:bg-muted/40 transition-colors">
                    <TableCell className="sticky left-0 bg-card text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="sticky left-8 bg-card font-medium">
                      <Link
                        href={`/bordro/${b.id}`}
                        className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                      >
                        {formatAdSoyad(b.personel.ad, b.personel.soyad)}
                      </Link>
                    </TableCell>
                    <TableCell>{_calismaSaati}</TableCell>
                    <TableCell>{formatPara(hakEdis)}</TableCell>
                    <TableCell>{_mesaiSaati}</TableCell>
                    <TableCell>{formatPara(mesaiBedeli)}</TableCell>
                    <TableCell>{formatPara(Number(b.yol))}</TableCell>
                    <TableCell>{formatPara(Number(b.yemek))}</TableCell>
                    <TableCell>{formatPara(Number(b.prim))}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                      {formatPara(Number(b.toplam_odeme))}
                    </TableCell>
                    <TableCell>{formatPara(Number(b.banka))}</TableCell>
                    <TableCell>{formatPara(Number(b.bes))}</TableCell>
                    <TableCell>{formatPara(Number(b.avans))}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="font-bold text-rose-600 dark:text-rose-400">
                      {formatPara(Number(b.toplam_kesinti))}
                    </TableCell>
                    <TableCell className="font-bold text-amber-600 dark:text-amber-400">
                      {formatPara(Number(b.toplam_odeme) - Number(b.toplam_kesinti))}
                    </TableCell>
                    <TableCell>
                      <DurumBadge durum={b.durum} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted transition-colors outline-none"
                          id={`btn-bordro-islem-${b.id}`}
                        >
                          <span className="text-base leading-none">⋯</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {b.durum === "taslak" && (
                            <DropdownMenuItem
                              onClick={() => durumGuncelle(b.id, "kontrol_bekliyor")}
                              disabled={isPending}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Onaya Gönder
                            </DropdownMenuItem>
                          )}
                          {b.durum === "kontrol_bekliyor" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => durumGuncelle(b.id, "onaylandi")}
                                disabled={isPending}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                Onayla
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => durumGuncelle(b.id, "taslak")}
                                disabled={isPending}
                              >
                                <FileEdit className="mr-2 h-4 w-4" />
                                Taslağa Geri Al
                              </DropdownMenuItem>
                            </>
                          )}
                          {b.durum === "onaylandi" && (
                            <DropdownMenuItem
                              onClick={() => durumGuncelle(b.id, "kilitlendi")}
                              disabled={isPending}
                            >
                              <Lock className="mr-2 h-4 w-4 text-rose-600" />
                              Kilitle
                            </DropdownMenuItem>
                          )}
                          {b.durum === "kilitlendi" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => revizyonBaslat_handler(b.id)}
                                disabled={revizyonYukleniyor === b.id}
                                className="text-amber-600"
                              >
                                {revizyonYukleniyor === b.id
                                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  : <RotateCcw className="mr-2 h-4 w-4" />}
                                Revizyon Başlat
                              </DropdownMenuItem>
                            </>
                          )}
                          {isPending && (
                            <DropdownMenuItem disabled>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              İşleniyor…
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
