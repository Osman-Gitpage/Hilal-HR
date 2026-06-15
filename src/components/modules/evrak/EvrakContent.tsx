"use client";

// ─── Evrak Ana Liste ──────────────────────────────────────────────────────────
// KPI kartları, filtre sistemi, personel×kategori matris tablosu,
// Liste/Grid toggle, çoklu personel karşılaştırma

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEvrakOzeti, useSuresiYaklasanlar } from "@/hooks/useEvrak";
import { gecerlilikDurumuHesapla, durumRengi, kalanGunEtiketi } from "@/lib/utils/evrak-utils";
import type { EvrakKategori, EvrakGecerlilikDurumu, EvrakListeFiltre } from "@/types/evrak";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  FileX,
  CheckCircle2,
  Search,
  LayoutGrid,
  LayoutList,
  GitCompare,
  X,
  FileText,
  Clock,
  Building2,
  FileStack,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════

export function EvrakContent() {
  const { data: ozet, isLoading } = useEvrakOzeti();
  const { data: yaklasanlar } = useSuresiYaklasanlar();
  const [filtre, setFiltre] = useState<EvrakListeFiltre>({});
  const [gorunum, setGorunum] = useState<"liste" | "grid">("liste");
  const [seciliPersoneller, setSeciliPersoneller] = useState<string[]>([]);
  const [karsilastirmaAcik, setKarsilastirmaAcik] = useState(false);

  // Hesaplanmış matris
  const matris = useMemo(() => {
    if (!ozet) return [];
    return hesaplaMatris(ozet, filtre);
  }, [ozet, filtre]);

  const kpiVerisi = useMemo(() => {
    if (!matris.length || !ozet?.kategoriler?.length) return { eksik: 0, yaklasan: 0, tamam: 0 };
    let eksik = 0, yaklasan = 0, tamam = 0;
    matris.forEach((satir) => {
      satir.durumlar.forEach((d) => {
        if (d === "eksik" || d === "gecersiz") eksik++;
        else if (d === "yaklasan") yaklasan++;
        else tamam++;
      });
    });
    return { eksik, yaklasan, tamam };
  }, [matris, ozet?.kategoriler?.length]);

  const handlePersonelSec = (id: string) => {
    setSeciliPersoneller((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  if (isLoading) return <EvrakSkeleton />;

  const kategoriler = (ozet?.kategoriler ?? []) as EvrakKategori[];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Evrak Yönetimi</h1>
            <div className="flex items-center gap-2">
              <Link href="/evrak/sirket">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Şirket Evrakları
                </Button>
              </Link>
              <Link href="/evrak/tersane">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileStack className="h-3.5 w-3.5" />
                  Tersane Şablonları
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            Personel evrak durumları ve takibi.
          </p>
        </div>
        {seciliPersoneller.length >= 2 && (
          <Button
            onClick={() => setKarsilastirmaAcik(true)}
            variant="outline"
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            Karşılaştır ({seciliPersoneller.length})
          </Button>
        )}
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiKart
          baslik="Eksik / Geçersiz"
          deger={kpiVerisi.eksik}
          icon={<FileX className="h-5 w-5" />}
          renk="text-red-500"
          bgRenk="bg-red-500/10"
        />
        <KpiKart
          baslik="Süresi Yaklaşan"
          deger={yaklasanlar?.length ?? kpiVerisi.yaklasan}
          icon={<AlertTriangle className="h-5 w-5" />}
          renk="text-amber-500"
          bgRenk="bg-amber-500/10"
        />
        <KpiKart
          baslik="Tamamlanan"
          deger={kpiVerisi.tamam}
          icon={<CheckCircle2 className="h-5 w-5" />}
          renk="text-emerald-500"
          bgRenk="bg-emerald-500/10"
        />
      </div>

      {/* Filtre Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Personel ara..."
            className="pl-9"
            value={filtre.arama ?? ""}
            onChange={(e) => setFiltre((f) => ({ ...f, arama: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="eksik-filtre"
            checked={filtre.sadece_eksik ?? false}
            onCheckedChange={(v) => setFiltre((f) => ({ ...f, sadece_eksik: v }))}
          />
          <Label htmlFor="eksik-filtre" className="text-sm cursor-pointer">
            Sadece eksik
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="yaklasan-filtre"
            checked={filtre.sadece_yaklasan ?? false}
            onCheckedChange={(v) => setFiltre((f) => ({ ...f, sadece_yaklasan: v }))}
          />
          <Label htmlFor="yaklasan-filtre" className="text-sm cursor-pointer">
            Süresi yaklaşan
          </Label>
        </div>

        <div className="ml-auto flex items-center gap-1 border rounded-lg p-0.5">
          <Button
            variant={gorunum === "liste" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setGorunum("liste")}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={gorunum === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setGorunum("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* İçerik */}
      {matris.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Personel bulunamadı</p>
          <p className="text-sm mt-1">Filtreleri temizlemeyi deneyin.</p>
        </div>
      ) : gorunum === "liste" ? (
        <MatrisTablo
          matris={matris}
          kategoriler={kategoriler}
          seciliPersoneller={seciliPersoneller}
          onPersonelSec={handlePersonelSec}
        />
      ) : (
        <GridGorunum
          matris={matris}
          kategoriler={kategoriler}
        />
      )}

      {/* Karşılaştırma Dialog */}
      <KarsilastirmaDialog
        acik={karsilastirmaAcik}
        onKapat={() => {
          setKarsilastirmaAcik(false);
          setSeciliPersoneller([]);
        }}
        matris={matris}
        kategoriler={kategoriler}
        seciliIdler={seciliPersoneller}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATRİS HESAPLAMA
// ═══════════════════════════════════════════════════════════════════════════════

interface MatrisSatir {
  personelId: string;
  ad: string;
  soyad: string;
  durumlar: EvrakGecerlilikDurumu[]; // her kategori için bir durum
  eksikSayisi: number;
  yaklasanSayisi: number;
}

function hesaplaMatris(
  ozet: NonNullable<ReturnType<typeof useEvrakOzeti>["data"]>,
  filtre: EvrakListeFiltre
): MatrisSatir[] {
  const { kategoriler, personeller, evraklar } = ozet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedKategoriler = kategoriler as any as EvrakKategori[];

  let sonuc: MatrisSatir[] = personeller.map((p) => {
    const durumlar = typedKategoriler.map((kat) => {
      // Bu personelin bu kategorideki en son evrakını bul
      const personelEvraklari = evraklar.filter(
        (e) => e.personel_id === p.id && e.kategori_id === kat.id
      );
      const evrak = personelEvraklari.length > 0 ? personelEvraklari[0] : null;

      return gecerlilikDurumuHesapla(
        evrak
          ? {
              id: evrak.id,
              sirket_id: "",
              kategori_id: evrak.kategori_id,
              personel_id: evrak.personel_id,
              employment_period_id: null,
              dosya_url: evrak.dosya_url,
              dosya_adi: "",
              dosya_boyut: null,
              dosya_tipi: null,
              versiyon: evrak.versiyon,
              baslangic_tarihi: null,
              bitis_tarihi: evrak.bitis_tarihi,
              durum: "aktif",
              onay_durumu: "beklemede",
              yuklenme_tarihi: "",
              created_at: "",
              updated_at: "",
            }
          : null,
        kat
      );
    });

    return {
      personelId: p.id,
      ad: p.ad,
      soyad: p.soyad,
      durumlar,
      eksikSayisi: durumlar.filter((d) => d === "eksik" || d === "gecersiz").length,
      yaklasanSayisi: durumlar.filter((d) => d === "yaklasan").length,
    };
  });

  // Filtreler
  if (filtre.arama) {
    const q = filtre.arama.toLowerCase();
    sonuc = sonuc.filter(
      (s) =>
        s.ad.toLowerCase().includes(q) || s.soyad.toLowerCase().includes(q)
    );
  }
  if (filtre.sadece_eksik) {
    sonuc = sonuc.filter((s) => s.eksikSayisi > 0);
  }
  if (filtre.sadece_yaklasan) {
    sonuc = sonuc.filter((s) => s.yaklasanSayisi > 0);
  }

  return sonuc;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI KART
// ═══════════════════════════════════════════════════════════════════════════════

function KpiKart({
  baslik,
  deger,
  icon,
  renk,
  bgRenk,
}: {
  baslik: string;
  deger: number;
  icon: React.ReactNode;
  renk: string;
  bgRenk: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`rounded-lg p-2.5 ${bgRenk}`}>
          <div className={renk}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{baslik}</p>
          <p className="text-2xl font-bold">{deger}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATRİS TABLO (Liste Görünümü)
// ═══════════════════════════════════════════════════════════════════════════════

function MatrisTablo({
  matris,
  kategoriler,
  seciliPersoneller,
  onPersonelSec,
}: {
  matris: MatrisSatir[];
  kategoriler: EvrakKategori[];
  seciliPersoneller: string[];
  onPersonelSec: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="rounded-xl border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground w-8">
              {/* Checkbox header */}
            </th>
            <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-muted/50 min-w-[180px]">
              Personel
            </th>
            {kategoriler.map((kat) => (
              <th
                key={kat.id}
                className="text-center p-3 font-medium text-muted-foreground min-w-[100px]"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs">{kat.ad}</span>
                  {kat.zorunlu && (
                    <span className="text-[9px] text-red-400">zorunlu</span>
                  )}
                </div>
              </th>
            ))}
            <th className="text-center p-3 font-medium text-muted-foreground w-20">
              Durum
            </th>
          </tr>
        </thead>
        <tbody>
          {matris.map((satir) => {
            const secili = seciliPersoneller.includes(satir.personelId);
            return (
              <tr
                key={satir.personelId}
                className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${
                  secili ? "bg-primary/5" : ""
                }`}
              >
                {/* Checkbox */}
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={secili}
                    onChange={() => onPersonelSec(satir.personelId)}
                    className="rounded border-muted-foreground/30"
                    disabled={
                      !secili && seciliPersoneller.length >= 3
                    }
                  />
                </td>
                {/* Personel adı */}
                <td
                  className="p-3 font-medium sticky left-0 bg-card cursor-pointer hover:text-primary transition-colors"
                  onClick={() =>
                    router.push(`/personel/${satir.personelId}?tab=evraklar`)
                  }
                >
                  {satir.ad} {satir.soyad}
                </td>
                {/* Kategori hücreleri */}
                {satir.durumlar.map((durum, i) => (
                  <DurumHucre
                    key={kategoriler[i].id}
                    durum={durum}
                    kategoriAd={kategoriler[i].ad}
                  />
                ))}
                {/* Özet badge */}
                <td className="p-3 text-center">
                  {satir.eksikSayisi > 0 ? (
                    <Badge variant="destructive" className="text-[10px]">
                      {satir.eksikSayisi} eksik
                    </Badge>
                  ) : satir.yaklasanSayisi > 0 ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500/30 text-amber-600"
                    >
                      {satir.yaklasanSayisi} yaklaşan
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-500/30 text-emerald-600"
                    >
                      Tamam
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DURUM HÜCRE (matris tablosundaki renk kodlu hücre)
// ═══════════════════════════════════════════════════════════════════════════════

function DurumHucre({
  durum,
  kategoriAd,
}: {
  durum: EvrakGecerlilikDurumu;
  kategoriAd: string;
}) {
  const renkler = durumRengi(durum);
  const etiketler: Record<EvrakGecerlilikDurumu, string> = {
    gecerli: "Geçerli",
    yaklasan: "Süresi yaklaşıyor",
    gecersiz: "Süresi geçmiş",
    eksik: "Eksik",
  };

  return (
    <td className="p-2 text-center">
      <TooltipProvider delay={200}>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`
                inline-flex items-center justify-center
                w-9 h-9 rounded-lg text-sm font-medium
                ${renkler.bg} ${renkler.text} ${renkler.border}
                border transition-all hover:scale-110 cursor-default
              `}
            >
              {renkler.icon}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p className="font-medium">{kategoriAd}</p>
            <p className="text-muted-foreground">{etiketler[durum]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </td>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRID GÖRÜNÜMÜ
// ═══════════════════════════════════════════════════════════════════════════════

function GridGorunum({
  matris,
  kategoriler,
}: {
  matris: MatrisSatir[];
  kategoriler: EvrakKategori[];
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {matris.map((satir) => (
        <Card
          key={satir.personelId}
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() =>
            router.push(`/personel/${satir.personelId}?tab=evraklar`)
          }
        >
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              {satir.ad} {satir.soyad}
            </CardTitle>
            {satir.eksikSayisi > 0 ? (
              <Badge variant="destructive" className="text-[10px]">
                {satir.eksikSayisi} eksik
              </Badge>
            ) : satir.yaklasanSayisi > 0 ? (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-500/30 text-amber-600"
              >
                {satir.yaklasanSayisi}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-600"
              >
                ✓
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1.5">
              {satir.durumlar.map((durum, i) => {
                const renkler = durumRengi(durum);
                return (
                  <TooltipProvider key={kategoriler[i].id} delay={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs
                            ${renkler.bg} ${renkler.text} border ${renkler.border}`}
                        >
                          {renkler.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {kategoriler[i].ad}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KARŞILAŞTIRMA DİALOG
// ═══════════════════════════════════════════════════════════════════════════════

function KarsilastirmaDialog({
  acik,
  onKapat,
  matris,
  kategoriler,
  seciliIdler,
}: {
  acik: boolean;
  onKapat: () => void;
  matris: MatrisSatir[];
  kategoriler: EvrakKategori[];
  seciliIdler: string[];
}) {
  const seciliPersoneller = matris.filter((s) =>
    seciliIdler.includes(s.personelId)
  );

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && onKapat()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Evrak Karşılaştırma
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium text-muted-foreground min-w-[140px]">
                  Kategori
                </th>
                {seciliPersoneller.map((p) => (
                  <th key={p.personelId} className="text-center p-2 font-medium min-w-[120px]">
                    {p.ad} {p.soyad}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kategoriler.map((kat, i) => (
                <tr key={kat.id} className="border-b last:border-0">
                  <td className="p-2 text-sm">
                    <div className="flex items-center gap-2">
                      {kat.ad}
                      {kat.zorunlu && (
                        <span className="text-[9px] text-red-400 font-medium">
                          zorunlu
                        </span>
                      )}
                    </div>
                  </td>
                  {seciliPersoneller.map((p) => {
                    const durum = p.durumlar[i];
                    const renkler = durumRengi(durum);
                    return (
                      <td key={p.personelId} className="p-2 text-center">
                        <Badge className={`text-[10px] ${renkler.badge}`}>
                          {renkler.icon}{" "}
                          {durum === "gecerli"
                            ? "Geçerli"
                            : durum === "yaklasan"
                            ? "Yaklaşıyor"
                            : durum === "gecersiz"
                            ? "Geçersiz"
                            : "Eksik"}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator />

        {/* Özet */}
        <div className="flex gap-4 justify-center text-xs text-muted-foreground">
          {seciliPersoneller.map((p) => (
            <div key={p.personelId} className="text-center">
              <p className="font-medium text-foreground">{p.ad} {p.soyad}</p>
              <p>
                {p.eksikSayisi > 0 && (
                  <span className="text-red-500">{p.eksikSayisi} eksik</span>
                )}
                {p.eksikSayisi > 0 && p.yaklasanSayisi > 0 && " · "}
                {p.yaklasanSayisi > 0 && (
                  <span className="text-amber-500">{p.yaklasanSayisi} yaklaşan</span>
                )}
                {p.eksikSayisi === 0 && p.yaklasanSayisi === 0 && (
                  <span className="text-emerald-500">Tüm evraklar tamam</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

function EvrakSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
