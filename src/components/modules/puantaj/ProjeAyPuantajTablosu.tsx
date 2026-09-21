"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  Users,
  Filter,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useProjePuantaj,
  useAyPuantaj,
  useProjePuantajVeGenelGir,
  useProjePuantajVeGenelSil,
  type ProjePuantajSatir,
} from "@/hooks/usePuantaj";
import { compareValues, type SortDir } from "@/lib/utils/sort";
import { ProjePuantajHucre, type HucreDurumu } from "./ProjePuantajView";
import { GunVeriGirisiModal } from "./GunVeriGirisiModal";
import { ExcelExportButton } from "@/components/ui/ExcelExportButton";
import { PdfOnizleButton } from "@/components/ui/PdfOnizleButton";
import { projePuantajPdfOnizle } from "@/lib/pdf/puantajPdf";
import { projePuantajExport } from "@/lib/excel/puantajExport";
import type { OzelDurum } from "@/types";

const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const GUN_KISALTMALARI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

interface ProjeAyPuantajTablosuProps {
  projeId: string;
  projeAdi: string;
  yil: number;
  ay: number;
}

export function ProjeAyPuantajTablosu({
  projeId,
  projeAdi,
  yil,
  ay,
}: ProjeAyPuantajTablosuProps) {
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sadeceCalisanlar, setSadeceCalisanlar] = useState(true);

  // Proje puantaj verisi
  const { data: satirlar = [], isLoading: puantajYukleniyor } = useProjePuantaj(
    projeId,
    yil,
    ay
  );

  // Genel ay verisi (personel listesi ve ay kapalılık durumu için)
  const { data: ayData, isLoading: personelYukleniyor } = useAyPuantaj(yil, ay);
  const tumPersoneller = ayData?.personeller ?? [];
  const ayKapali = ayData?.ayKapali ?? false;

  // Çift yazma mutation'ları (proje detayından yapılan düzeltmeler için)
  const veriGirMutation = useProjePuantajVeGenelGir(projeId, yil, ay);
  const veriSilMutation = useProjePuantajVeGenelSil(projeId, yil, ay);

  // Modal durumu
  const [secilenHucre, setSecilenHucre] = useState<{
    personelId: string;
    personelAd: string;
    tarih: string;
    mevcutVeri?: HucreDurumu;
  } | null>(null);

  // Ay günleri
  const gunler = useMemo(() => {
    const sonGun = new Date(yil, ay, 0).getDate();
    return Array.from({ length: sonGun }, (_, i) => {
      const gun = i + 1;
      const tarihStr = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
      const gunObj = new Date(yil, ay - 1, gun);
      const haftaGunu = gunObj.getDay();
      return { gun, tarihStr, haftaGunu, pazar: haftaGunu === 0 };
    });
  }, [yil, ay]);

  // Veri haritası: personelId -> tarih -> satır
  const veriMap = useMemo(() => {
    const map = new Map<string, Map<string, ProjePuantajSatir>>();
    for (const s of satirlar) {
      if (!map.has(s.personel_id)) map.set(s.personel_id, new Map());
      map.get(s.personel_id)!.set(s.tarih, s);
    }
    return map;
  }, [satirlar]);

  // Personel listesi:
  // Sadece bu projede çalışanlar veya tüm şirket personelleri
  const gosterilecekPersoneller = useMemo(() => {
    const calisanIdSet = new Set(
      satirlar
        .filter((s) => (s.saat != null && s.saat > 0) || (s.mesai_saati != null && s.mesai_saati > 0) || s.ozel_durum != null)
        .map((s) => s.personel_id)
    );

    let list = [...tumPersoneller];

    // Satırlarda olup ayData'da olmayan personeller varsa ekle
    for (const s of satirlar) {
      if (s.personel && !list.some((p) => p.id === s.personel_id)) {
        list.push({
          id: s.personel_id,
          ad: s.personel.ad,
          soyad: s.personel.soyad,
          gorev_unvan: null,
          employment_periods: [],
        });
      }
    }

    if (sadeceCalisanlar) {
      list = list.filter((p) => calisanIdSet.has(p.id));
    }

    return list.sort((a, b) =>
      compareValues(`${a.ad} ${a.soyad}`, `${b.ad} ${b.soyad}`, sortDir)
    );
  }, [satirlar, tumPersoneller, sadeceCalisanlar, sortDir]);

  // Toplam saat hesabı (personel bazlı)
  function hesaplaToplam(personelId: string): number {
    return Array.from(veriMap.get(personelId)?.values() ?? []).reduce(
      (s, v) => s + (v.saat ?? 0),
      0
    );
  }

  // Toplam mesai hesabı (personel bazlı)
  function hesaplaToplamMesai(personelId: string): number {
    return Array.from(veriMap.get(personelId)?.values() ?? []).reduce(
      (s, v) => s + (v.mesai_saati ?? 0),
      0
    );
  }

  // Günlük toplam saat (tüm personeller için o günün saati)
  const gunlukToplamlar = useMemo(() => {
    return gunler.map(({ tarihStr }) => {
      let saatToplam = 0;
      let mesaiToplam = 0;
      for (const s of satirlar) {
        if (s.tarih === tarihStr) {
          saatToplam += s.saat ?? 0;
          mesaiToplam += s.mesai_saati ?? 0;
        }
      }
      return { tarihStr, saatToplam, mesaiToplam };
    });
  }, [gunler, satirlar]);

  // Genel toplamlar
  const genelToplamSaat = useMemo(() => {
    return satirlar.reduce((acc, s) => acc + (s.saat ?? 0), 0);
  }, [satirlar]);

  const genelToplamMesai = useMemo(() => {
    return satirlar.reduce((acc, s) => acc + (s.mesai_saati ?? 0), 0);
  }, [satirlar]);

  const isLoading = puantajYukleniyor || personelYukleniyor;

  return (
    <div className="space-y-3 bg-muted/10 border-t p-4 rounded-b-xl">
      {/* Üst Eylem ve Filtre Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-semibold bg-background">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {AY_ADLARI[ay]} {yil} Puantajı
          </Badge>
          <span className="text-xs text-muted-foreground">
            Toplam: <strong className="text-foreground">{genelToplamSaat.toFixed(1)} sa</strong>
            {genelToplamMesai > 0 && (
              <> · Mesai: <strong className="text-amber-600">{genelToplamMesai.toFixed(1)} sa</strong></>
            )}
            {" · "}
            <strong className="text-foreground">{gosterilecekPersoneller.length}</strong> personel
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sadece Bu Projede Çalışanlar / Tüm Liste Filtresi */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => setSadeceCalisanlar((v) => !v)}
          >
            <Filter className="h-3 w-3 text-muted-foreground" />
            {sadeceCalisanlar ? "Tüm Personelleri Göster" : "Sadece Çalışanları Göster"}
          </Button>

          {/* Excel Export */}
          {!isLoading && gosterilecekPersoneller.length > 0 && (
            <ExcelExportButton
              id={`btn-excel-detay-${yil}-${ay}`}
              label="Excel"
              size="sm"
              onExport={() =>
                projePuantajExport({
                  personeller: gosterilecekPersoneller as any,
                  satirlar: satirlar as any,
                  projeAdi,
                  yil,
                  ay,
                })
              }
            />
          )}

          {/* PDF Önizle */}
          {!isLoading && gosterilecekPersoneller.length > 0 && (
            <PdfOnizleButton
              id={`btn-pdf-detay-${yil}-${ay}`}
              label="PDF"
              baslik={`${AY_ADLARI[ay]} ${yil} ${projeAdi} Puantaj Tablosu`}
              dosyaAdi={`Proje_Puantaj_${projeAdi.replace(/\s+/g, "_")}_${yil}_${String(ay).padStart(2, "0")}`}
              onOlustur={() =>
                projePuantajPdfOnizle({
                  personeller: gosterilecekPersoneller as any,
                  satirlar: satirlar as any,
                  projeAdi,
                  yil,
                  ay,
                })
              }
            />
          )}
        </div>
      </div>

      {/* Puantaj Matrisi */}
      <div className="rounded-lg border bg-background overflow-x-auto shadow-sm">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="sticky left-0 bg-muted/90 backdrop-blur-sm z-20 min-w-[140px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="flex items-center gap-1 hover:text-primary transition-colors text-left"
                >
                  Personel
                  {sortDir === "asc" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                </button>
              </TableHead>

              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => (
                    <TableHead key={i} className="min-w-[34px] text-center">
                      <Skeleton className="h-3 w-4 mx-auto" />
                    </TableHead>
                  ))
                : gunler.map(({ gun, haftaGunu, pazar }) => (
                    <TableHead
                      key={gun}
                      className={[
                        "min-w-[34px] text-center p-1",
                        pazar ? "bg-rose-50 dark:bg-rose-950/30" : "",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center">
                        <span className={pazar ? "text-rose-500 font-bold" : ""}>
                          {gun}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {GUN_KISALTMALARI[haftaGunu]}
                        </span>
                      </div>
                    </TableHead>
                  ))}

              <TableHead className="min-w-[52px] text-center bg-muted/60 border-l font-semibold">
                Toplam
              </TableHead>
              <TableHead className="min-w-[52px] text-center bg-muted/60 font-semibold text-amber-700 dark:text-amber-400">
                Mesai
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="sticky left-0 bg-background">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  {Array.from({ length: 15 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-5 mx-auto" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : gosterilecekPersoneller.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={gunler.length + 3}
                  className="text-center py-8 text-muted-foreground text-xs"
                >
                  Bu dönemde projeye ait puantaj kaydı bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              gosterilecekPersoneller.map((p) => {
                const pSatirlar = veriMap.get(p.id);
                const toplam = hesaplaToplam(p.id);
                const toplamMesai = hesaplaToplamMesai(p.id);

                return (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    {/* Personel Adı */}
                    <TableCell className="sticky left-0 bg-background/95 backdrop-blur-sm z-10 font-medium py-1.5 border-r">
                      <div className="truncate max-w-[140px]" title={`${p.ad} ${p.soyad}`}>
                        {p.ad} {p.soyad}
                      </div>
                      {p.gorev_unvan && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {p.gorev_unvan}
                        </div>
                      )}
                    </TableCell>

                    {/* Gün Hücreleri */}
                    {gunler.map(({ gun, tarihStr, pazar }) => {
                      const satir = pSatirlar?.get(tarihStr);
                      const hucreDurum: HucreDurumu | undefined = satir
                        ? {
                            saat: satir.saat,
                            mesai_saati: satir.mesai_saati,
                            ozel_durum: satir.ozel_durum as OzelDurum | null,
                            aciklama: satir.aciklama,
                          }
                        : undefined;

                      const modalVeri = satir
                        ? {
                            calisma_saati: satir.saat,
                            mesai_saati: satir.mesai_saati ?? undefined,
                            ozel_durum: (satir.ozel_durum ?? undefined) as OzelDurum | undefined,
                            aciklama: satir.aciklama,
                          }
                        : undefined;

                      return (
                        <TableCell
                          key={gun}
                          className={[
                            "p-0.5",
                            pazar ? "bg-rose-50/50 dark:bg-rose-950/10" : "",
                          ].join(" ")}
                        >
                          <ProjePuantajHucre
                            durum={hucreDurum}
                            pazar={pazar}
                            onClick={() =>
                              setSecilenHucre({
                                personelId: p.id,
                                personelAd: `${p.ad} ${p.soyad}`,
                                tarih: tarihStr,
                                mevcutVeri: modalVeri,
                              })
                            }
                          />
                        </TableCell>
                      );
                    })}

                    {/* Toplam */}
                    <TableCell className="text-center font-semibold bg-muted/20 border-l text-primary tabular-nums">
                      {toplam > 0 ? toplam : "—"}
                    </TableCell>
                    {/* Mesai */}
                    <TableCell className="text-center font-semibold bg-muted/20 text-amber-700 dark:text-amber-400 tabular-nums">
                      {toplamMesai > 0 ? toplamMesai : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Günlük Toplam Alt Satırı */}
            {!isLoading && gosterilecekPersoneller.length > 0 && (
              <TableRow className="bg-muted/40 font-semibold border-t-2">
                <TableCell className="sticky left-0 bg-muted/90 backdrop-blur-sm z-10 text-xs font-bold py-2">
                  GÜNLÜK TOPLAM
                </TableCell>
                {gunlukToplamlar.map(({ tarihStr, saatToplam }) => (
                  <TableCell
                    key={tarihStr}
                    className="text-center text-[11px] tabular-nums font-medium p-1"
                  >
                    {saatToplam > 0 ? (
                      <span className="text-primary font-bold">{saatToplam}</span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-center font-bold bg-muted/60 border-l text-primary tabular-nums text-xs">
                  {genelToplamSaat > 0 ? genelToplamSaat.toFixed(1) : "0"}
                </TableCell>
                <TableCell className="text-center font-bold bg-muted/60 text-amber-700 dark:text-amber-400 tabular-nums text-xs">
                  {genelToplamMesai > 0 ? genelToplamMesai.toFixed(1) : "0"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Gün Veri Girişi Modal */}
      {secilenHucre && (
        <GunVeriGirisiModal
          key={`${secilenHucre.personelId}-${secilenHucre.tarih}`}
          acik={!!secilenHucre}
          personelId={secilenHucre.personelId}
          personelAd={secilenHucre.personelAd}
          tarih={secilenHucre.tarih}
          mevcutVeri={secilenHucre.mevcutVeri}
          yil={yil}
          ay={ay}
          onKapat={() => setSecilenHucre(null)}
          onKaydetOverride={async (veri) => {
            const sonuc = await veriGirMutation.mutateAsync({
              personelId: secilenHucre.personelId,
              tarih: secilenHucre.tarih,
              veri,
            });
            return sonuc as { hata?: string; basarili?: boolean };
          }}
          onSilOverride={async () => {
            const sonuc = await veriSilMutation.mutateAsync({
              personelId: secilenHucre.personelId,
              tarih: secilenHucre.tarih,
            });
            return sonuc as { hata?: string; basarili?: boolean };
          }}
        />
      )}
    </div>
  );
}
