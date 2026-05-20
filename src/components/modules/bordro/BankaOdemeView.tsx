"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2, Banknote, HandCoins, Shield, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUIStore } from "@/stores/uiStore";
import { useBankaOdeme, type BankaOdemeSatiri } from "@/hooks/useMaasBordro";
import { bankaOdemeKaydet } from "@/app/actions/maas";
import { bankaEldenHesapla } from "@/lib/utils/maasHesap";
import { formatPara, formatAdSoyad, num } from "@/lib/utils/index";
import { DonemSecici } from "@/components/modules/bordro/DonemSecici";

interface SatirState {
  bordro_id: string;
  personel_id: string;
  banka: number;
  bes_bordro: number;
  tazminat: number;
  avans: number;
  odeme_not: string;
  toplam_odeme: number;
}

export function BankaOdemeView() {
  const { seciliDonemYil, seciliDonemAy } = useUIStore();
  // T4.7: useBankaOdeme — mevcut banka_odeme + bordro birleşik
  const { data: satirListesi = [], isLoading, isError, refetch } = useBankaOdeme(
    seciliDonemYil, seciliDonemAy
  );
  const [yerelDuzenlemeler, setYerelDuzenlemeler] = useState<Record<string, SatirState>>({});
  const [isPending, startTransition] = useTransition();

  // Satir state: yerel düzenleme varsa onu, yoksa hook verisini kullan
  const getSatir = (b: BankaOdemeSatiri): SatirState => {
    return yerelDuzenlemeler[b.bordro_id] ?? {
      bordro_id:   b.bordro_id,
      personel_id: b.personel_id,
      banka:       b.banka,
      bes_bordro:  b.bes_bordro,
      tazminat:    b.tazminat,
      avans:       b.avans,
      odeme_not:   b.odeme_not ?? "",
      toplam_odeme: b.toplam_odeme,
    };
  };

  const guncelle = (bordroId: string, alan: keyof SatirState, deger: number | string, b: BankaOdemeSatiri) => {
    setYerelDuzenlemeler(prev => ({
      ...prev,
      [bordroId]: { ...getSatir(b), [alan]: deger },
    }));
  };

  // KPI
  const toplamBanka    = satirListesi.reduce((s, b) => s + (getSatir(b).banka    ?? 0), 0);
  const toplamTazminat = satirListesi.reduce((s, b) => s + (getSatir(b).tazminat ?? 0), 0);
  const toplamAvans    = satirListesi.reduce((s, b) => s + (getSatir(b).avans    ?? 0), 0);
  const toplamElden = satirListesi.reduce((s, b) => {
    const satir = getSatir(b);
    return s + bankaEldenHesapla(satir.toplam_odeme, satir.banka, satir.bes_bordro, satir.tazminat, satir.avans);
  }, 0);

  async function handleKaydet() {
    if (satirListesi.length === 0) { toast.error("Kaydedilecek veri yok."); return; }
    startTransition(async () => {
      const payload = satirListesi.map(b => {
        const s = getSatir(b);
        return {
          bordro_id:   s.bordro_id,
          personel_id: s.personel_id,
          banka:       s.banka,
          tazminat:    s.tazminat,
          avans:       s.avans,
          odeme_not:   s.odeme_not || null,
          toplam_odeme: s.toplam_odeme,
          bes_bordro:  s.bes_bordro,
        };
      });
      const sonuc = await bankaOdemeKaydet(seciliDonemYil, seciliDonemAy, payload);
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Banka ödeme verileri kaydedildi.");
      setYerelDuzenlemeler({});
      refetch();
    });
  }

  return (
    <div className="space-y-5">
      {/* Uyarı */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-4 py-2 text-sm text-blue-700 dark:text-blue-400">
        ℹ️ Bu sayfadaki veriler ayrı kaydedilir — maaş bordro verilerini etkilemez.
      </div>

      {/* Üst bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <DonemSecici />
        <Button id="btn-banka-kaydet" onClick={handleKaydet} disabled={isPending || satirListesi.length === 0} className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Kaydet
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { baslik: "Toplam Banka", deger: toplamBanka, ikon: Banknote, renk: "bg-blue-600" },
          { baslik: "Toplam Tazminat", deger: toplamTazminat, ikon: Shield, renk: "bg-purple-600" },
          { baslik: "Toplam Avans", deger: toplamAvans, ikon: TrendingDown, renk: "bg-rose-600" },
          { baslik: "Toplam Elden", deger: toplamElden, ikon: HandCoins, renk: "bg-amber-600" },
        ].map(({ baslik, deger, ikon: Ikon, renk }) => (
          <Card key={baslik}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{baslik}</CardTitle>
              <div className={`rounded-lg p-2 ${renk}`}><Ikon className="h-4 w-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-7 w-28" /> : <p className="text-xl font-bold">{formatPara(deger)}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tablo */}
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="sticky left-0 bg-card z-10 w-8">#</TableHead>
              <TableHead className="sticky left-8 bg-card z-10 min-w-[140px]">Ad Soyad</TableHead>
              <TableHead className="text-muted-foreground">Bordro Bankası</TableHead>
              <TableHead>Banka (Düzenle)</TableHead>
              <TableHead>BES</TableHead>
              <TableHead>Tazminat</TableHead>
              <TableHead>Avans</TableHead>
              <TableHead>Not</TableHead>
              <TableHead className="font-bold">Elden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-destructive">Veriler yüklenirken hata oluştu.</TableCell>
              </TableRow>
            ) : satirListesi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  Bu dönemde bordro kaydı yok.
                </TableCell>
              </TableRow>
            ) : (
              satirListesi.map((b: BankaOdemeSatiri, idx: number) => {
                const s = getSatir(b);
                const elden = bankaEldenHesapla(s.toplam_odeme, s.banka, s.bes_bordro, s.tazminat, s.avans);
                return (
                  <TableRow key={b.bordro_id}>
                    <TableCell className="sticky left-0 bg-card text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="sticky left-8 bg-card font-medium">
                      {formatAdSoyad(b.personel.ad, b.personel.soyad)}
                    </TableCell>
                    <TableCell>
                      {/* Bordro'daki ham banka değeri (readonly referans) */}
                      <Input
                        value={formatPara(b.banka)}
                        disabled
                        className="w-28 h-8 bg-muted text-muted-foreground"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        id={`banka-${b.bordro_id}`}
                        type="number"
                        className="w-28 h-8"
                        value={s.banka || ""}
                        onChange={e => guncelle(b.bordro_id, "banka", num(e.target.value), b)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input value={formatPara(s.bes_bordro)} disabled className="w-24 h-8 bg-muted" />
                    </TableCell>
                    <TableCell>
                      <Input
                        id={`tazminat-${b.bordro_id}`}
                        type="number"
                        className="w-28 h-8"
                        value={s.tazminat || ""}
                        onChange={e => guncelle(b.bordro_id, "tazminat", num(e.target.value), b)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        id={`avans-${b.bordro_id}`}
                        type="number"
                        className="w-28 h-8"
                        value={s.avans || ""}
                        onChange={e => guncelle(b.bordro_id, "avans", num(e.target.value), b)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        id={`not-${b.bordro_id}`}
                        className="w-40 h-8"
                        value={s.odeme_not}
                        onChange={e => guncelle(b.bordro_id, "odeme_not", e.target.value, b)}
                        placeholder="Not…"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-amber-600 dark:text-amber-400">
                      {formatPara(elden)}
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
