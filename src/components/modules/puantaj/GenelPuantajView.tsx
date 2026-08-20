"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  Loader2,
  Clock,
  Users,
  CheckCheck,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { compareValues, type SortDir } from "@/lib/utils/sort";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUIStore } from "@/stores/uiStore";
import { useAyPuantaj, useAyKapat, useAyAc, useAyOzet, useAyOzetKaydet } from "@/hooks/usePuantaj";
import { OZEL_DURUMLAR } from "@/lib/constants";
import type { OzelDurum } from "@/types";
import { Input } from "@/components/ui/input";
import { GunVeriGirisiModal } from "./GunVeriGirisiModal";
import { TopluGunGirisiPanel } from "./TopluGunGirisiPanel";
import { ExcelExportButton } from "@/components/ui/ExcelExportButton";
import { puantajExport, topluPuantajExport } from "@/lib/excel/puantajExport";
import { PdfOnizleButton } from "@/components/ui/PdfOnizleButton";
import { puantajPdfOnizle, topluPuantajPdfOnizle } from "@/lib/pdf/puantajPdf";
import { topluPuantajVerisiGetir } from "@/app/actions/puantaj";

// ─────────────────────────────────────────────
// Sabitler
// ─────────────────────────────────────────────
const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const GUN_KISALTMALARI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Özel durum renk → Tailwind class
const RENK_SINIFI: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// ─────────────────────────────────────────────
// Dönem Seçici
// ─────────────────────────────────────────────
function DonemSecici({ ayKapali }: { ayKapali: boolean }) {
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
      <span className="font-semibold text-sm min-w-36 text-center flex items-center justify-center gap-1.5">
        {AY_ADLARI[seciliDonemAy]} {seciliDonemYil}
        {ayKapali && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
            Kilitli
          </Badge>
        )}
      </span>
      <Button variant="outline" size="icon" onClick={sonrakiAy} id="btn-sonraki-ay">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Hücre Bileşeni
// ─────────────────────────────────────────────
interface HucreDurumu {
  giris_saati?: string | null;
  cikis_saati?: string | null;
  calisma_saati?: number | null;
  ozel_durum?: OzelDurum | null;
  aciklama?: string | null;
  mesai_saati?: number | null;
}

function PuantajHucre({
  durum,
  kapali,
  pazar,
  projeAdi,
  onClick,
}: {
  durum?: HucreDurumu;
  kapali: boolean;
  pazar: boolean;
  projeAdi?: string;
  onClick: () => void;
}) {
  const disabled = kapali;

  // Render içerik
  let icerik: React.ReactNode = (
    <span className="text-muted-foreground/40 text-xs">—</span>
  );
  let hucreRenk = pazar ? "bg-muted/30" : "";

  if (durum?.ozel_durum) {
    const oz = OZEL_DURUMLAR[durum.ozel_durum];
    const sinif = oz ? RENK_SINIFI[oz.renk] ?? "" : "";
    hucreRenk = sinif;
    // DB'den mesai, yoksa oz.mesai fallback (PM → 16)
    const dbMesai = durum.mesai_saati;
    const mesaiGoster = dbMesai != null ? dbMesai : (oz?.mesai && oz.mesai > 0 ? oz.mesai : null);
    icerik = (
      <div className="flex flex-col items-center leading-none gap-0.5">
        <span className="text-[11px] font-bold leading-none">{oz?.kod ?? durum.ozel_durum}</span>
        {mesaiGoster != null && mesaiGoster > 0 && (
          <span className="text-[9px] font-bold tabular-nums text-amber-600 dark:text-amber-400">
            +{mesaiGoster}M
          </span>
        )}
      </div>
    );
  } else if (durum?.calisma_saati != null) {
    const mesai = (durum as any).mesai_saati;
    icerik = (
      <div className="flex flex-col items-center leading-none gap-0.5">
        <span className="text-xs font-semibold tabular-nums">
          {durum.calisma_saati}
        </span>
        {mesai ? (
          <span className="text-[9px] font-bold tabular-nums text-amber-600 dark:text-amber-400">
            +{mesai}M
          </span>
        ) : null}
      </div>
    );
  } else if (durum?.giris_saati) {
    icerik = (
      <span className="text-[11px] text-muted-foreground">
        {durum.giris_saati.slice(0, 5)}
      </span>
    );
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={[
          "w-full h-9 rounded flex items-center justify-center transition-colors text-xs",
          hucreRenk,
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:ring-2 hover:ring-primary/40 cursor-pointer",
        ].join(" ")}
        title={
          projeAdi
            ? `Proje: ${projeAdi}`
            : disabled
              ? "Bu ay kilitli"
              : undefined
        }
      >
        {icerik}
      </button>
      {/* Proje göstergesi — mavi nokta sol üst */}
      {projeAdi && !kapali && (
        <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
      )}
      {/* Açıklama nokta göstergesi — sarı sağ üst */}
      {durum?.aciklama && !kapali && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// Özet Hücre — Inline Edit (SGK Gün / Maaş Saat)
// ─────────────────────────────────────────────
function OzetHucre({
  hesaplanan,
  override,
  onSave,
  suffix = "",
}: {
  hesaplanan: number;
  override: number | null;
  onSave: (deger: number | null) => void;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [deger, setDeger] = useState("");

  const gosterilen = override ?? hesaplanan;
  const isOverride = override !== null && override !== hesaplanan;

  function handleClick() {
    setDeger(gosterilen > 0 ? String(gosterilen) : "");
    setEditing(true);
  }

  function handleBlur() {
    const sayi = parseFloat(deger);
    if (deger === "" || isNaN(sayi)) {
      onSave(null);
    } else {
      onSave(sayi);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <Input
        autoFocus
        type="number"
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-7 w-16 text-xs text-center px-1 tabular-nums"
        min={0}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isOverride ? `Hesaplanan: ${hesaplanan}${suffix} | Düzenlenmiş` : "Düzenlemek için tıkla"}
      className={[
        "w-full text-center tabular-nums text-xs rounded px-1 py-0.5 transition-colors",
        "hover:bg-primary/10 hover:text-primary cursor-pointer",
        isOverride ? "font-bold text-primary" : "font-semibold",
      ].join(" ")}
    >
      {gosterilen > 0 ? `${gosterilen}${suffix}` : "—"}
    </button>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
export function GenelPuantajView() {
  const { seciliDonemYil: yil, seciliDonemAy: ay } = useUIStore();
  const { data, isLoading, isError } = useAyPuantaj(yil, ay);
  const { data: ozetler = [] } = useAyOzet(yil, ay);
  const ozetKaydetMutation = useAyOzetKaydet(yil, ay);
  const ayKapatMutation = useAyKapat(yil, ay);
  const ayAcMutation = useAyAc(yil, ay);

  const [kapamaDiyalogAcik, setKapamaDiyalogAcik] = useState(false);
  const [kilidiAcDiyalogAcik, setKilidiAcDiyalogAcik] = useState(false);
  const [topluGirisAcik, setTopluGirisAcik] = useState(false);
  const [secilenHucre, setSecilenHucre] = useState<{
    personelId: string;
    personelAd: string;
    tarih: string;
    mevcutVeri?: HucreDurumu;
    projeAdi?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ayın günlerini hesapla
  const gunler = useMemo(() => {
    const sonGun = new Date(yil, ay, 0).getDate();
    return Array.from({ length: sonGun }, (_, i) => {
      const gun = i + 1;
      const tarihStr = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
      const gunObj = new Date(yil, ay - 1, gun);
      const gunHaftaIci = gunObj.getDay(); // 0=Paz
      return { gun, tarihStr, haftaGunu: gunHaftaIci, pazar: gunHaftaIci === 0 };
    });
  }, [yil, ay]);

  // Puantaj haritası: personel_id → tarih → veri
  const puantajMap = useMemo(() => {
    const map = new Map<string, Map<string, HucreDurumu>>();
    for (const p of data?.puantajlar ?? []) {
      if (!map.has(p.personel_id)) map.set(p.personel_id, new Map());
      map.get(p.personel_id)!.set(p.tarih, p as HucreDurumu);
    }
    return map;
  }, [data?.puantajlar]);

  // Proje haritası: personel_id → tarih → proje adları dizisi
  // Aynı kişi aynı günde birden fazla gemide çalışabilir
  const projeMap = useMemo(() => {
    const map = new Map<string, Map<string, string[]>>();
    for (const s of data?.projeSaatleri ?? []) {
      if (!s.proje?.ad) continue;
      if (!map.has(s.personel_id)) map.set(s.personel_id, new Map());
      const tarihMap = map.get(s.personel_id)!;
      const mevcutlar = tarihMap.get(s.tarih) ?? [];
      if (!mevcutlar.includes(s.proje.ad)) mevcutlar.push(s.proje.ad);
      tarihMap.set(s.tarih, mevcutlar);
    }
    return map;
  }, [data?.projeSaatleri]);

  // İstemci tarafı toplam hesabı
  function hesaplaToplam(personelId: string) {
    const kayitlar = puantajMap.get(personelId);
    if (!kayitlar) return { calisma: 0, mesai: 0, sgkGun: 0 };

    let calisma = 0;
    let mesai = 0;
    let sgkGun = 0;

    for (const [, v] of kayitlar) {
      if (v.ozel_durum) {
        const oz = OZEL_DURUMLAR[v.ozel_durum as OzelDurum];
        if (oz) {
          calisma += oz.saat;
          if (oz.saat > 0) sgkGun += 1;
        }
        // Mesai: DB'den oku. Yoksa oz.mesai fallback (PM → 16)
        const dbMesai = (v as any).mesai_saati;
        mesai += dbMesai != null ? Number(dbMesai) : (oz?.mesai ?? 0);
      } else if (v.calisma_saati) {
        calisma += v.calisma_saati;
        sgkGun += 1;
        // Normal çalışma günü mesai_saati
        if ((v as any).mesai_saati) {
          mesai += Number((v as any).mesai_saati);
        }
      }
    }
    return { calisma, mesai, sgkGun };
  }

  // Hücre tıklama
  function handleHucreTikla(
    personelId: string,
    personelAd: string,
    tarih: string,
    projeAdi?: string
  ) {
    // puantajlar dizisinden doğrudan bul (puantajMap'ten daha güvenilir)
    const mevcutVeri = data?.puantajlar?.find(
      (p: Record<string, unknown>) => p.personel_id === personelId && p.tarih === tarih
    ) as HucreDurumu | undefined;
    setSecilenHucre({ personelId, personelAd, tarih, mevcutVeri, projeAdi });
  }

  // Ay kapat
  function handleAyKapat() {
    startTransition(async () => {
      const sonuc = await ayKapatMutation.mutateAsync();
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(`${AY_ADLARI[ay]} ${yil} puantajı kilitlendi.`);
      setKapamaDiyalogAcik(false);
    });
  }

  // Kilidi aç (sadece admin)
  function handleAyAc() {
    startTransition(async () => {
      const sonuc = await ayAcMutation.mutateAsync();
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(`${AY_ADLARI[ay]} ${yil} kilidi açıldı.`);
      setKilidiAcDiyalogAcik(false);
    });
  }

  const ayKapali = data?.ayKapali ?? false;
  const kullaniciRol = data?.kullaniciRol ?? "editor";
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const personellerRaw = data?.personeller ?? [];
  const personeller = useMemo(
    () => [...personellerRaw].sort((a, b) => compareValues(`${a.ad} ${a.soyad}`, `${b.ad} ${b.soyad}`, sortDir)),
    [personellerRaw, sortDir]
  );
  const ozetMap = useMemo(() => {
    const map = new Map<string, { sgkGun: number | null; maasSaati: number | null; mesaiSaati: number | null }>();
    for (const o of ozetler) {
      map.set(o.personel_id, {
        sgkGun: o.sgk_gun_override,
        maasSaati: o.maas_saati_override,
        mesaiSaati: (o as any).mesai_saati_override ?? null,
      });
    }
    return map;
  }, [ozetler]);

  // Özet kaydetme
  const handleOzetKaydet = useCallback(
    (personelId: string, sgkGun: number | null, maasSaati: number | null, mesaiSaati: number | null = null) => {
      ozetKaydetMutation.mutate({ personelId, sgkGun, maasSaati, mesaiSaati });
    },
    [ozetKaydetMutation]
  );


  return (
    <div className="space-y-4">
      {/* Üst Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DonemSecici ayKapali={ayKapali} />

        <div className="flex flex-wrap items-center gap-2">
          {/* Toplu Giriş Toggle */}
          {!ayKapali && (
            <Button
              variant={topluGirisAcik ? "default" : "outline"}
              size="sm"
              id="btn-toplu-giris-toggle"
              onClick={() => setTopluGirisAcik((v) => !v)}
              className="gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              Toplu Giriş
            </Button>
          )}
          {!ayKapali && (
            <Button
              variant="outline"
              size="sm"
              id="btn-ay-kapat"
              onClick={() => setKapamaDiyalogAcik(true)}
              className="gap-1.5 border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              <Lock className="h-4 w-4" />
              Ayı Kapat
            </Button>
          )}
          {ayKapali && kullaniciRol === "admin" && (
            <Button
              variant="outline"
              size="sm"
              id="btn-kilidi-ac"
              onClick={() => setKilidiAcDiyalogAcik(true)}
              className="gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <LockOpen className="h-4 w-4" />
              Kilidi Aç
            </Button>
          )}
          {/* Excel Export */}
          {!isLoading && personeller.length > 0 && (
            <ExcelExportButton
              id="btn-puantaj-excel"
              label="Excel'e Aktar"
              onExport={() =>
                puantajExport({
                  personeller,
                  puantajlar: data?.puantajlar ?? [],
                  ozetler,
                  yil,
                  ay,
                })
              }
            />
          )}
          {/* PDF Önizle */}
          {!isLoading && personeller.length > 0 && (
            <PdfOnizleButton
              id="btn-puantaj-pdf"
              baslik={`${AY_ADLARI[ay]} ${yil} Puantaj Tablosu`}
              dosyaAdi={`Puantaj_${yil}_${String(ay).padStart(2, '0')}`}
              onOlustur={() =>
                puantajPdfOnizle({
                  personeller,
                  puantajlar: data?.puantajlar ?? [],
                  ozetler,
                  yil,
                  ay,
                })
              }
            />
          )}
          {/* Toplu Excel Export */}
          {!isLoading && personeller.length > 0 && (
            <ExcelExportButton
              id="btn-toplu-excel"
              label="Toplu Excel"
              onExport={async () => {
                const veri = await topluPuantajVerisiGetir(yil, ay);
                topluPuantajExport(veri);
              }}
            />
          )}
          {/* Toplu PDF Önizle */}
          {!isLoading && personeller.length > 0 && (
            <PdfOnizleButton
              id="btn-toplu-pdf"
              label="Toplu PDF"
              baslik={`${AY_ADLARI[ay]} ${yil} Toplu Puantaj Raporu`}
              dosyaAdi={`Toplu_Puantaj_${yil}_${String(ay).padStart(2, '0')}`}
              onOlustur={async () => {
                const veri = await topluPuantajVerisiGetir(yil, ay);
                return topluPuantajPdfOnizle(veri);
              }}
            />
          )}
        </div>
      </div>

      {/* Toplu Giriş Paneli */}
      {topluGirisAcik && (
        <TopluGunGirisiPanel
          yil={yil}
          ay={ay}
          personeller={personeller}
          gunler={gunler}
          ayKapali={ayKapali}
          onKapat={() => setTopluGirisAcik(false)}
        />
      )}

      {/* İstatistik özet */}
      {!isLoading && personeller.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {personeller.length} personel
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {gunler.length} gün
          </span>
        </div>
      )}

      {/* Hata */}
      {isError && (
        <div className="flex items-center justify-center py-12 text-destructive text-sm">
          Puantaj verileri yüklenirken bir hata oluştu.
        </div>
      )}

      {/* Grid Tablosu */}
      {!isError && (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40">
                {/* Personel kolonu */}
                <TableHead className="sticky left-0 bg-muted/40 z-20 min-w-[140px] font-semibold">
                  <button
                    onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    title="Sıralama yönünü değiştir"
                  >
                    Personel
                    {sortDir === "asc"
                      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      : <ArrowDown className="h-3.5 w-3.5 text-primary" />}
                  </button>
                </TableHead>

                {/* Gün kolonları */}
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                    <TableHead key={i} className="min-w-[40px] text-center">
                      <Skeleton className="h-3 w-6 mx-auto" />
                    </TableHead>
                  ))
                  : gunler.map(({ gun, haftaGunu, pazar }) => (
                    <TableHead
                      key={gun}
                      className={[
                        "min-w-[40px] text-center p-1",
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

                {/* Özet kolonları */}
                <TableHead className="min-w-[52px] text-center bg-muted/60 border-l font-semibold">
                  Toplam
                </TableHead>
                <TableHead className="min-w-[52px] text-center bg-muted/60 font-semibold">
                  Mesai
                </TableHead>
                <TableHead className="min-w-[60px] text-center bg-amber-50 dark:bg-amber-950/20 bg-muted/60 font-semibold text-amber-700 dark:text-amber-400" title="Elle girilen ek mesai saati — korunur, kaybolmaz">
                  Ek Mesai
                </TableHead>
                <TableHead className="min-w-[56px] text-center bg-muted/60 font-semibold" title="Tıklayarak düzzenleyebilirsiniz">
                  SGK Gün
                </TableHead>
                <TableHead className="min-w-[60px] text-center bg-muted/60 font-semibold" title="Tıklayarak düzzenleyebilirsiniz">
                  Maaş Saat
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="sticky left-0 bg-card">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    {Array.from({ length: 13 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : personeller.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={gunler.length + 5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Bu dönemde aktif personel bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                personeller.map((p: { id: string; ad: string; soyad: string; gorev_unvan: string | null }) => {
                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Personel adı — sticky */}
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

                      {/* Gün hücreleri */}
                      {gunler.map(({ gun, tarihStr, pazar }) => {
                        const veri = puantajMap.get(p.id)?.get(tarihStr);
                        const projeAdlari = projeMap.get(p.id)?.get(tarihStr);
                        const projeAdi = projeAdlari?.join(", ");
                        return (
                          <TableCell
                            key={gun}
                            className={[
                              "p-0.5",
                              pazar ? "bg-rose-50/50 dark:bg-rose-950/10" : "",
                            ].join(" ")}
                          >
                            <PuantajHucre
                              durum={veri}
                              kapali={ayKapali}
                              pazar={pazar}
                              projeAdi={projeAdi}
                              onClick={() =>
                                handleHucreTikla(p.id, `${p.ad} ${p.soyad}`, tarihStr, projeAdi)
                              }
                            />
                          </TableCell>
                        );
                      })}

                      {/* Özet sütunlar — Hesaplanan + Düzzenlenebilir */}
                      {(() => {
                        const { calisma, mesai, sgkGun } = hesaplaToplam(p.id);
                        const ozet = ozetMap.get(p.id);
                        const maasSaatiHesap = calisma; // default: calisma saati
                        const ekMesai = ozet?.mesaiSaati ?? null;
                        const toplamMesai = mesai + (ekMesai ?? 0);
                        return (
                          <>
                            <TableCell className="text-center font-semibold bg-muted/30 border-l tabular-nums">
                              {calisma > 0 ? calisma : "—"}
                            </TableCell>
                            <TableCell className="text-center bg-muted/30 tabular-nums text-amber-700 dark:text-amber-400 font-medium">
                              {toplamMesai > 0 ? toplamMesai : "—"}
                            </TableCell>
                            <TableCell className="bg-amber-50/60 dark:bg-amber-950/10 p-0.5">
                              <OzetHucre
                                hesaplanan={0}
                                override={ekMesai}
                                onSave={(val) => handleOzetKaydet(
                                  p.id,
                                  ozet?.sgkGun ?? null,
                                  ozet?.maasSaati ?? null,
                                  val
                                )}
                                suffix="s"
                              />
                            </TableCell>
                            <TableCell className="bg-muted/30 p-0.5">
                              <OzetHucre
                                hesaplanan={sgkGun}
                                override={ozet?.sgkGun ?? null}
                                onSave={(val) => handleOzetKaydet(
                                  p.id,
                                  val,
                                  ozet?.maasSaati ?? null,
                                  ozet?.mesaiSaati ?? null
                                )}
                              />
                            </TableCell>
                            <TableCell className="bg-muted/30 p-0.5">
                              <OzetHucre
                                hesaplanan={maasSaatiHesap}
                                override={ozet?.maasSaati ?? null}
                                onSave={(val) => handleOzetKaydet(
                                  p.id,
                                  ozet?.sgkGun ?? null,
                                  val,
                                  ozet?.mesaiSaati ?? null
                                )}
                                suffix="s"
                              />
                            </TableCell>
                          </>
                        );
                      })()}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legand */}
      {!isLoading && !isError && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Sarı nokta = açıklama var
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Mavi nokta = proje saati (hover ile proje adı)
          </span>
          <span className="flex items-center gap-1 text-primary/70">
            ✎ SGK Gün / Maaş Saat / Ek Mesai = tıklayarak düzenle
          </span>
          {Object.entries(OZEL_DURUMLAR).map(([, oz]) => (
            <Badge
              key={oz.kod}
              variant="outline"
              className={[
                "text-[10px] px-1.5 py-0 h-5",
                RENK_SINIFI[oz.renk] ?? "",
              ].join(" ")}
            >
              {oz.kod} — {oz.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Gün Veri Girişi Modal */}
      {secilenHucre && (
        <GunVeriGirisiModal
          key={`${secilenHucre.personelId}-${secilenHucre.tarih}`}
          acik={!!secilenHucre}
          personelId={secilenHucre.personelId}
          personelAd={secilenHucre.personelAd}
          tarih={secilenHucre.tarih}
          mevcutVeri={secilenHucre.mevcutVeri}
          projeAdi={secilenHucre.projeAdi}
          yil={yil}
          ay={ay}
          onKapat={() => setSecilenHucre(null)}
        />
      )}

      {/* Ay Kapat Onay */}
      <AlertDialog
        open={kapamaDiyalogAcik}
        onOpenChange={setKapamaDiyalogAcik}
      >
        <AlertDialogContent id="alertdialog-ay-kapat">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {AY_ADLARI[ay]} {yil} Puantajını Kapat
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Ay kilitlendiğinde hiçbir gün verisi
              düzenlenemez. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id="btn-ay-kapat-iptal" disabled={isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              id="btn-ay-kapat-onayla"
              onClick={handleAyKapat}
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Evet, Kilitle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kilidi Aç Onay — sadece admin */}
      <AlertDialog
        open={kilidiAcDiyalogAcik}
        onOpenChange={setKilidiAcDiyalogAcik}
      >
        <AlertDialogContent id="alertdialog-kilidi-ac">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LockOpen className="h-5 w-5 text-emerald-600" />
              {AY_ADLARI[ay]} {yil} Kilidini Aç
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu ay kilitli. Kilidi açarsanız veriler tekrar düzenlenebilir hale
              gelir. Bu işlem yönetici yetkisi gerektirir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id="btn-kilidi-ac-iptal" disabled={isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              id="btn-kilidi-ac-onayla"
              onClick={handleAyAc}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Evet, Kilidi Aç
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
