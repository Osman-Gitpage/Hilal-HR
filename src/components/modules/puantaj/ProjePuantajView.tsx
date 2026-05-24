"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { compareValues, type SortDir } from "@/lib/utils/sort";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUIStore } from "@/stores/uiStore";
import {
  useDonemAktifProjeler,
  useProjePuantaj,
  useProjePuantajVeGenelGir,
  useProjePuantajVeGenelSil,
  useAyPuantaj,
  type ProjePuantajSatir,
} from "@/hooks/usePuantaj";
import { OZEL_DURUMLAR } from "@/lib/constants";
import type { Proje } from "@/supabase/app-types";
import type { OzelDurum } from "@/types";
import { GunVeriGirisiModal } from "./GunVeriGirisiModal";
import { TopluGunGirisiPanel } from "./TopluGunGirisiPanel";
import Link from "next/link";
import { ExcelExportButton } from "@/components/ui/ExcelExportButton";
import { useTopluProjePuantajGirisi } from "@/hooks/usePuantaj";
import { PdfOnizleButton } from "@/components/ui/PdfOnizleButton";
import { projePuantajPdfOnizle } from "@/lib/pdf/puantajPdf";
import { projePuantajExport } from "@/lib/excel/puantajExport";

// ─────────────────────────────────────────────────────────────────────────────
// Sabitler
// ─────────────────────────────────────────────────────────────────────────────
const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const GUN_KISALTMALARI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Özel durum renk → Tailwind class (Genel Puantaj ile aynı)
const RENK_SINIFI: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  green:  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  gray:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  pink:   "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  red:    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// ─────────────────────────────────────────────────────────────────────────────
// Dönem Seçici
// ─────────────────────────────────────────────────────────────────────────────
function DonemSecici() {
  const { seciliDonemYil, seciliDonemAy, setSeciliDonem } = useUIStore();

  function oncekiAy() {
    if (seciliDonemAy === 1) setSeciliDonem(seciliDonemYil - 1, 12);
    else setSeciliDonem(seciliDonemYil, seciliDonemAy - 1);
  }
  function sonrakiAy() {
    if (seciliDonemAy === 12) setSeciliDonem(seciliDonemYil + 1, 1);
    else setSeciliDonem(seciliDonemYil, seciliDonemAy + 1);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={oncekiAy} id="btn-onceki-ay">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-sm w-36 text-center">
        {AY_ADLARI[seciliDonemAy]} {seciliDonemYil}
      </span>
      <Button variant="outline" size="icon" onClick={sonrakiAy} id="btn-sonraki-ay">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hücre — Genel Puantaj ile aynı stil (özel durum badge + saat)
// ─────────────────────────────────────────────────────────────────────────────
interface HucreDurumu {
  giris_saati?: string | null;
  cikis_saati?: string | null;
  calisma_saati?: number | null;
  mesai_saati?: number | null;
  ozel_durum?: OzelDurum | null;
  aciklama?: string | null;
  saat?: number | null; // puantaj_proje'den
}

function ProjePuantajHucre({
  durum,
  pazar,
  onClick,
}: {
  durum?: HucreDurumu;
  pazar: boolean;
  onClick: () => void;
}) {
  let icerik: React.ReactNode = (
    <span className="text-muted-foreground/30 text-xs">—</span>
  );
  let hucreRenk = pazar ? "bg-rose-50/50 dark:bg-rose-950/10" : "";

  if (durum?.ozel_durum) {
    const oz = OZEL_DURUMLAR[durum.ozel_durum];
    const sinif = oz ? RENK_SINIFI[oz.renk] ?? "" : "";
    hucreRenk = sinif;
    icerik = (
      <span className="text-[11px] font-bold leading-none">{oz?.kod ?? durum.ozel_durum}</span>
    );
  } else if (durum?.saat != null) {
    icerik = (
      <span className="text-xs font-semibold tabular-nums text-primary">
        {durum.saat}
      </span>
    );
  } else if (durum?.calisma_saati != null) {
    icerik = (
      <span className="text-xs font-semibold tabular-nums text-primary">
        {durum.calisma_saati}
      </span>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full gap-0.5">
      <button
        type="button"
        onClick={onClick}
        className={[
          "w-full h-9 rounded flex flex-col items-center justify-center transition-colors text-xs",
          hucreRenk,
          "hover:ring-2 hover:ring-primary/40 cursor-pointer",
        ].join(" ")}
        title={durum?.aciklama ?? undefined}
      >
        {icerik}
        {(() => {
          // PM ise mesai_saati yoksa oz.mesai (16) fallback
          const oz = durum?.ozel_durum ? OZEL_DURUMLAR[durum.ozel_durum as keyof typeof OZEL_DURUMLAR] : null;
          const m = durum?.mesai_saati ?? (oz?.mesai && oz.mesai > 0 ? oz.mesai : null);
          return m != null && m > 0 ? (
            <span className="text-[9px] font-bold leading-none text-amber-500">+{m}M</span>
          ) : null;
        })()}
      </button>
      {durum?.aciklama && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────────────────────────────────────
export function ProjePuantajView() {
  const { seciliDonemYil: yil, seciliDonemAy: ay } = useUIStore();

  // Sadece O AY aktif projeler
  const { data: donemProjeler = [], isLoading: projelerYukleniyor } =
    useDonemAktifProjeler(yil, ay);

  // Seçili proje
  const [seciliProjeId, setSeciliProjeId] = useState<string | null>(null);
  const seciliProje = donemProjeler.find((p: Proje) => p.id === seciliProjeId) ?? null;

  // Dönem değişince veya projeler yüklenince ilk projeyi otomatik seç
  useEffect(() => {
    if (donemProjeler.length > 0) {
      // Mevcut seçim geçerliyse koru, değilse ilk projeyi seç
      const gecerli = donemProjeler.some((p: Proje) => p.id === seciliProjeId);
      if (!gecerli) setSeciliProjeId(donemProjeler[0].id);
    } else {
      setSeciliProjeId(null);
    }
  }, [donemProjeler, seciliProjeId]);

  // Proje puantaj kayıtları (puantaj_proje)
  const { data: satirlar = [], isLoading: puantajYukleniyor } = useProjePuantaj(
    seciliProjeId,
    yil,
    ay
  );

  // Dönem personel listesi (Genel Puantaj ile aynı kaynak)
  const { data: ayData, isLoading: personelYukleniyor } = useAyPuantaj(yil, ay);
  const personellerRaw = ayData?.personeller ?? [];
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const personeller = useMemo(
    () => [...personellerRaw].sort((a, b) => compareValues(`${a.ad} ${a.soyad}`, `${b.ad} ${b.soyad}`, sortDir)),
    [personellerRaw, sortDir]
  );

  // Proje + Genel çift yazma mutation'ları
  const veriGirMutation = useProjePuantajVeGenelGir(seciliProjeId, yil, ay);
  const veriSilMutation = useProjePuantajVeGenelSil(seciliProjeId, yil, ay);
  const topluGirisMutation = useTopluProjePuantajGirisi(seciliProjeId, yil, ay);

  // Modal + toplu giriş paneli durumu
  const [topluGirisAcik, setTopluGirisAcik] = useState(false);
  const [secilenHucre, setSecilenHucre] = useState<{
    personelId: string;
    personelAd: string;
    tarih: string;
    mevcutVeri?: HucreDurumu;
  } | null>(null);

  // Ayın günleri
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

  // Veri haritası: personelId → tarih → satır (puantaj_proje)
  const veriMap = useMemo(() => {
    const map = new Map<string, Map<string, ProjePuantajSatir>>();
    for (const s of satirlar) {
      if (!map.has(s.personel_id)) map.set(s.personel_id, new Map());
      map.get(s.personel_id)!.set(s.tarih, s);
    }
    return map;
  }, [satirlar]);

  // Toplam saat hesabı
  function hesaplaToplam(personelId: string): number {
    return Array.from(veriMap.get(personelId)?.values() ?? []).reduce(
      (s, v) => s + (v.saat ?? 0),
      0
    );
  }

  // Toplam mesai hesabı
  function hesaplaToplamMesai(personelId: string): number {
    return Array.from(veriMap.get(personelId)?.values() ?? []).reduce(
      (s, v) => s + (v.mesai_saati ?? 0),
      0
    );
  }

  const isLoading = projelerYukleniyor || puantajYukleniyor || personelYukleniyor;

  // ── Proje yok durumu ──────────────────────────────────────────────────────
  if (!projelerYukleniyor && donemProjeler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <FolderOpen className="h-16 w-16 text-muted-foreground/20" />
        <div>
          <p className="font-medium text-muted-foreground">
            {AY_ADLARI[ay]} {yil} döneminde aktif proje yok.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <Link
              href="/puantaj/projeler"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              Projeler
            </Link>{" "}
            sayfasından proje ekleyin veya başlangıç/bitiş tarihlerini kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Üst Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <DonemSecici />

        {/* Proje Dropdown — sadece o ay aktif olanlar */}
        <Select
          value={seciliProjeId ?? ""}
          onValueChange={(v) => v && setSeciliProjeId(v)}
          disabled={projelerYukleniyor}
        >
          <SelectTrigger id="select-proje" className="w-64">
            <span className={seciliProje ? "" : "text-muted-foreground"}>
              {seciliProje ? seciliProje.ad : "Proje seçin\u2026"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {donemProjeler.map((p: Proje) => (
              <SelectItem key={p.id} value={p.id}>
                {p.ad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {seciliProje && (
          <Badge variant="outline" className="text-xs gap-1.5">
            {seciliProje.firma_adi ?? ""}
          </Badge>
        )}

        {/* Excel Export */}
        {seciliProje && !isLoading && personeller.length > 0 && (
          <ExcelExportButton
            id="btn-proje-puantaj-excel"
            label="Excel'e Aktar"
            onExport={() =>
              projePuantajExport({
                personeller,
                satirlar: satirlar as never,
                projeAdi: seciliProje.ad,
                yil,
                ay,
              })
            }
          />
        )}

        {/* PDF Önizle */}
        {seciliProje && !isLoading && personeller.length > 0 && (
          <PdfOnizleButton
            id="btn-proje-puantaj-pdf"
            baslik={`${AY_ADLARI[ay]} ${yil} Proje Puantaj Tablosu`}
            dosyaAdi={`Proje_Puantaj_${seciliProje.ad.replace(/\s+/g, '_')}_${yil}_${String(ay).padStart(2, '0')}`}
            onOlustur={() =>
              projePuantajPdfOnizle({
                personeller,
                satirlar: satirlar as never,
                projeAdi: seciliProje.ad,
                yil,
                ay,
              })
            }
          />
        )}

        {/* Toplu Giriş Toggle */}
        {seciliProjeId && !isLoading && (
          <Button
            id="btn-proje-toplu-giris"
            variant={topluGirisAcik ? "default" : "outline"}
            size="sm"
            onClick={() => setTopluGirisAcik((p) => !p)}
            className="gap-1.5"
          >
            Toplu Giriş
          </Button>
        )}
      </div>

      {/* Toplu Giriş Paneli */}
      {topluGirisAcik && seciliProjeId && (
        <TopluGunGirisiPanel
          yil={yil}
          ay={ay}
          personeller={personeller}
          gunler={gunler}
          ayKapali={false}
          onKapat={() => setTopluGirisAcik(false)}
          onUygula={(kayitlar) =>
            topluGirisMutation.mutateAsync(kayitlar) as Promise<{
              hata?: string;
              eklenenSayisi?: number;
              atlananSayisi?: number;
            }>
          }
        />
      )}
      {seciliProjeId && (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="sticky left-0 bg-muted/40 z-20 min-w-[140px] font-semibold">
                  <button
                    type="button"
                    id="btn-personel-sort"
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
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
                  ? Array.from({ length: 10 }).map((_, i) => (
                    <TableHead key={i} className="min-w-[36px] text-center">
                      <Skeleton className="h-3 w-4 mx-auto" />
                    </TableHead>
                  ))
                  : gunler.map(({ gun, haftaGunu, pazar }) => (
                    <TableHead
                      key={gun}
                      className={[
                        "min-w-[36px] text-center p-1",
                        pazar ? "bg-rose-50 dark:bg-rose-950/30" : "",
                      ].join(" ")}
                    >
                      <div className="flex flex-col items-center">
                        <span className={pazar ? "text-rose-500 font-bold" : ""}>
                          {gun}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {GUN_KISALTMALARI[haftaGunu]}
                        </span>
                      </div>
                    </TableHead>
                  ))}

                <TableHead className="min-w-[56px] text-center bg-muted/60 border-l font-semibold">
                  Toplam
                </TableHead>
                <TableHead className="min-w-[56px] text-center bg-muted/60 font-semibold text-amber-700 dark:text-amber-400">
                  Mesai
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="sticky left-0 bg-card">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    {Array.from({ length: 13 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-6 mx-auto" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : personeller.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={gunler.length + 3}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Bu dönemde aktif personel bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                personeller.map((p) => {
                  const toplam = hesaplaToplam(p.id);
                  const toplamMesai = hesaplaToplamMesai(p.id);
                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="sticky left-0 bg-card z-10 font-medium whitespace-nowrap pr-3">
                        <div className="flex flex-col">
                          <span>{p.ad} {p.soyad}</span>
                          {p.gorev_unvan && (
                            <span className="text-[10px] text-muted-foreground">
                              {p.gorev_unvan}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {gunler.map(({ gun, tarihStr, pazar }) => {
                        const satir = veriMap.get(p.id)?.get(tarihStr);
                        const hucreDurum: HucreDurumu | undefined = satir
                          ? {
                              saat: satir.saat,
                              mesai_saati: satir.mesai_saati ?? null,
                              ozel_durum: satir.ozel_durum as OzelDurum | null,
                              aciklama: satir.aciklama,
                            }
                          : undefined;
                        // Modal için mevcut veriyi (saat + mesai + özel durum + açıklama) geçir
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
                      <TableCell className="text-center font-semibold bg-muted/30 border-l text-primary tabular-nums">
                        {toplam > 0 ? toplam : "—"}
                      </TableCell>
                      {/* Mesai */}
                      <TableCell className="text-center font-semibold bg-muted/30 text-amber-700 dark:text-amber-400 tabular-nums">
                        {toplamMesai > 0 ? toplamMesai : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Seçim yapılmadı */}
      {!seciliProjeId && !projelerYukleniyor && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Yukarıdan bir proje seçin.
        </div>
      )}

      {/* Gün Veri Girişi Modal — Genel Puantaj ile AYNI */}
      {secilenHucre && seciliProjeId && (
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
          // Proje sayfasında özel mutation kullan
          onKaydetOverride={async (veri) => {
            const sonuc = await veriGirMutation.mutateAsync({
              personelId: secilenHucre.personelId,
              tarih: secilenHucre.tarih,
              veri,
            });
            return sonuc;
          }}
          onSilOverride={async () => {
            const sonuc = await veriSilMutation.mutateAsync({
              personelId: secilenHucre.personelId,
              tarih: secilenHucre.tarih,
            });
            return sonuc;
          }}
        />
      )}
    </div>
  );
}
