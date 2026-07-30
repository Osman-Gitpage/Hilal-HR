"use client";

// ─── Personel Evraklar Tab Bileşeni ───────────────────────────────────────────
// Kategori bazlı evrak kartları, durum ikonları, versiyon yönetimi, arşiv tab

import { useState, useMemo } from "react";
import {
  useEvrakKategorileri,
  usePersonelEvraklar,
  useEvrakMutations,
} from "@/hooks/useEvrak";
import { storageGetDownloadUrl } from "@/app/actions/storage";
import { gecerlilikDurumuHesapla, durumRengi, kalanGunEtiketi, sureEtiketi } from "@/lib/utils/evrak-utils";
import type { EvrakKategori } from "@/types/evrak";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Upload,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  FileText,
  Clock,
  Shield,
  Archive,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EvrakYukleDialog } from "@/components/modules/evrak/EvrakYukleDialog";
import { DosyaGoruntule as DosyaOnizleme } from "@/components/ui/DosyaGoruntule";

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════

interface PersonelEvraklarProps {
  personelId: string;
  aktifDonemId: string | null;
}

export function PersonelEvraklar({ personelId, aktifDonemId }: PersonelEvraklarProps) {
  const { data: kategoriler, isLoading: katYukleniyor } = useEvrakKategorileri("personel");
  const { data: evraklar, isLoading: evrakYukleniyor } = usePersonelEvraklar(personelId, aktifDonemId ?? undefined);
  const { data: arsivEvraklar } = usePersonelEvraklar(personelId); // tüm dönemler

  const [yukleDialogAcik, setYukleDialogAcik] = useState(false);
  const [yukleKategori, setYukleKategori] = useState<EvrakKategori | null>(null);
  const [onizlemeUrl, setOnizlemeUrl] = useState<string | null>(null);
  const [onizlemeDosyaAdi, setOnizlemeDosyaAdi] = useState<string>("");

  const typedKategoriler = (kategoriler ?? []) as unknown as EvrakKategori[];
  const isLoading = katYukleniyor || evrakYukleniyor;

  // Evrakları kategori bazında grupla
  const kategoriEvrakMap = useMemo(() => {
    const map = new Map<string, typeof evraklar>();
    if (!evraklar) return map;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const evrak of evraklar as any[]) {
      const katId = evrak.kategori_id as string;
      if (!map.has(katId)) map.set(katId, []);
      map.get(katId)!.push(evrak);
    }
    return map;
  }, [evraklar]);

  // Eksik kategori sayısı
  const eksikSayisi = useMemo(() => {
    return typedKategoriler.filter((kat) => {
      if (!kat.zorunlu) return false;
      return !kategoriEvrakMap.has(kat.id) || kategoriEvrakMap.get(kat.id)!.length === 0;
    }).length;
  }, [typedKategoriler, kategoriEvrakMap]);

  const handleYukle = (kategori: EvrakKategori) => {
    setYukleKategori(kategori);
    setYukleDialogAcik(true);
  };

  const handleOnizle = async (objectKey: string, dosyaAdi: string) => {
    const result = await storageGetDownloadUrl({ objectKey });
    if (result.success) {
      setOnizlemeUrl(result.url);
      setOnizlemeDosyaAdi(dosyaAdi);
    } else {
      toast.error("Dosya URL'si alınamadı.");
    }
  };

  const handleIndir = async (objectKey: string, dosyaAdi: string) => {
    const result = await storageGetDownloadUrl({ objectKey });
    if (result.success) {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = dosyaAdi;
      a.click();
    } else {
      toast.error("İndirme URL'si alınamadı.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Evraklar</h3>
          {eksikSayisi > 0 && (
            <Badge variant="destructive" className="text-xs">
              {eksikSayisi} eksik
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="aktif">
        <TabsList>
          <TabsTrigger value="aktif" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Aktif Dönem
          </TabsTrigger>
          <TabsTrigger value="arsiv" className="gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            Arşiv
          </TabsTrigger>
        </TabsList>

        {/* Aktif Dönem */}
        <TabsContent value="aktif" className="mt-4 space-y-3">
          {typedKategoriler.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Henüz kategori tanımlanmamış.</p>
              <p className="text-xs mt-1">Ayarlar → Evrak Kategorileri'nden ekleyin.</p>
            </div>
          ) : (
            typedKategoriler.map((kategori) => {
              const katEvraklar = kategoriEvrakMap.get(kategori.id) ?? [];
              return (
                <EvrakKategoriKart
                  key={kategori.id}
                  kategori={kategori}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  evraklar={katEvraklar as any[]}
                  onYukle={() => handleYukle(kategori)}
                  onOnizle={handleOnizle}
                  onIndir={handleIndir}
                  readonly={false}
                />
              );
            })
          )}
        </TabsContent>

        {/* Arşiv */}
        <TabsContent value="arsiv" className="mt-4 space-y-3">
          <ArsivTab personelId={personelId} aktifDonemId={aktifDonemId} />
        </TabsContent>
      </Tabs>

      {/* Yükleme Dialog */}
      {yukleKategori && (
        <EvrakYukleDialog
          acik={yukleDialogAcik}
          onKapat={() => {
            setYukleDialogAcik(false);
            setYukleKategori(null);
          }}
          kategori={yukleKategori}
          personelId={personelId}
          donemId={aktifDonemId ?? undefined}
        />
      )}

      {/* Dosya Önizleme */}
      <DosyaOnizleme
        url={onizlemeUrl}
        dosyaAdi={onizlemeDosyaAdi}
        onKapat={() => {
          setOnizlemeUrl(null);
          setOnizlemeDosyaAdi("");
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ KARTI
// ═══════════════════════════════════════════════════════════════════════════════

function EvrakKategoriKart({
  kategori,
  evraklar,
  onYukle,
  onOnizle,
  onIndir,
  readonly,
}: {
  kategori: EvrakKategori;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evraklar: any[];
  onYukle: () => void;
  onOnizle: (objectKey: string, dosyaAdi: string) => void;
  onIndir: (objectKey: string, dosyaAdi: string) => void;
  readonly: boolean;
}) {
  const { sil, versiyonSil } = useEvrakMutations();
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [versiyonlarAcik, setVersiyonlarAcik] = useState(false);

  const enSonEvrak = evraklar.length > 0 ? evraklar[0] : null;
  const durum = gecerlilikDurumuHesapla(enSonEvrak, kategori);
  const renkler = durumRengi(durum);
  const eskiVersiyonlar = evraklar.length > 1 ? evraklar.slice(1) : [];

  return (
    <Card className={`border-l-4 ${renkler.border}`}>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${renkler.bg}`}>
            {renkler.icon}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{kategori.ad}</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              {kategori.zorunlu && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  Zorunlu
                </Badge>
              )}
              {kategori.sureli && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  {sureEtiketi(kategori.varsayilan_sure)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {!readonly && (
          <Button onClick={onYukle} size="sm" variant="outline" className="gap-1.5 shrink-0">
            <Upload className="h-3.5 w-3.5" />
            {enSonEvrak ? "Yeni Versiyon" : "Yükle"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {!enSonEvrak ? (
          <p className="text-xs text-muted-foreground py-2">
            {kategori.zorunlu ? "⚠️ Bu evrak henüz yüklenmemiş." : "Henüz yüklenmemiş."}
          </p>
        ) : (
          <div className="space-y-2">
            {/* Son Versiyon */}
            <EvrakSatir
              evrak={enSonEvrak}
              onOnizle={onOnizle}
              onIndir={onIndir}
              onSil={readonly ? undefined : () => setSilinecekId(enSonEvrak.id)}
              durum={durum}
            />

            {/* Eski Versiyonlar */}
            {eskiVersiyonlar.length > 0 && (
              <Collapsible open={versiyonlarAcik} onOpenChange={setVersiyonlarAcik}>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${versiyonlarAcik ? "rotate-180" : ""}`} />
                  {eskiVersiyonlar.length} eski versiyon
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {eskiVersiyonlar.map((evrak: typeof enSonEvrak) => (
                    <EvrakSatir
                      key={evrak.id}
                      evrak={evrak}
                      onOnizle={onOnizle}
                      onIndir={onIndir}
                      onSil={readonly ? undefined : () => setSilinecekId(evrak.id)}
                      eskiVersiyon
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>

      {/* Silme onay */}
      <AlertDialog open={!!silinecekId} onOpenChange={(open) => !open && setSilinecekId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Evrak Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu evrak kalıcı olarak silinecek ve B2 depolama alanından kaldırılacak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (silinecekId) {
                  sil.mutate(silinecekId);
                  setSilinecekId(null);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVRAK SATIR
// ═══════════════════════════════════════════════════════════════════════════════

function EvrakSatir({
  evrak,
  onOnizle,
  onIndir,
  onSil,
  durum,
  eskiVersiyon,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evrak: any;
  onOnizle: (objectKey: string, dosyaAdi: string) => void;
  onIndir: (objectKey: string, dosyaAdi: string) => void;
  onSil?: () => void;
  durum?: string;
  eskiVersiyon?: boolean;
}) {
  const boyut = evrak.dosya_boyut
    ? evrak.dosya_boyut > 1024 * 1024
      ? `${(evrak.dosya_boyut / (1024 * 1024)).toFixed(1)} MB`
      : `${(evrak.dosya_boyut / 1024).toFixed(0)} KB`
    : null;

  return (
    <div
      className={`flex items-center gap-3 py-2 px-2 rounded-lg ${
        eskiVersiyon ? "bg-muted/30 opacity-70" : "bg-muted/50"
      }`}
    >
      {/* Dosya ikonu */}
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Dosya bilgileri */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{evrak.dosya_adi}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          <span>v{evrak.versiyon}</span>
          {boyut && <span>· {boyut}</span>}
          {evrak.bitis_tarihi && (
            <span>
              · Son: {new Date(evrak.bitis_tarihi).toLocaleDateString("tr-TR")}
            </span>
          )}
          {evrak.bitis_tarihi && durum === "yaklasan" && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-amber-500/30 text-amber-600">
              {kalanGunEtiketi(evrak.bitis_tarihi)}
            </Badge>
          )}
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onOnizle(evrak.dosya_url, evrak.dosya_adi)}
          title="Önizle"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onIndir(evrak.dosya_url, evrak.dosya_adi)}
          title="İndir"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        {onSil && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onSil}
            title="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARŞİV TAB
// ═══════════════════════════════════════════════════════════════════════════════

function ArsivTab({
  personelId,
  aktifDonemId,
}: {
  personelId: string;
  aktifDonemId: string | null;
}) {
  const { data: tumEvraklar } = usePersonelEvraklar(personelId);

  // Arşivlenmiş evrakları filtrele
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arsivEvraklar = useMemo(() => {
    if (!tumEvraklar) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (tumEvraklar as any[]).filter(
      (e) => e.durum === "arsiv" || (aktifDonemId && e.employment_period_id !== aktifDonemId && e.employment_period_id !== null)
    );
  }, [tumEvraklar, aktifDonemId]);

  if (arsivEvraklar.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        <Archive className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Arşivde evrak yok</p>
        <p className="text-xs mt-1">Geçmiş dönemlere ait evraklar burada görünür.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Geçmiş dönemlere ait salt okunur evraklar. "Arşivden Getir" ile aktif döneme kopyalayabilirsiniz.
      </p>
      {arsivEvraklar.map((evrak) => (
        <div
          key={evrak.id}
          className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/30 border"
        >
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{evrak.dosya_adi}</p>
            <p className="text-[10px] text-muted-foreground">
              {evrak.evrak_kategori?.ad ?? "Bilinmeyen Kategori"} · v{evrak.versiyon}
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <Archive className="h-3 w-3 mr-1" />
            Arşiv
          </Badge>
        </div>
      ))}
    </div>
  );
}
