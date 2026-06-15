"use client";

// ─── Şirket Evrakları Sayfası ─────────────────────────────────────────────────
// Şirket geneli evraklar (Vergi Levhası, İmza Sirküleri, Kaşe vb.)
// Kaşe/İmza özel işleme: şeffaf PNG görseli, önizleme

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useEvrakKategorileri,
  useSirketEvraklar,
  useEvrakMutations,
} from "@/hooks/useEvrak";
import { downloadUrlOlustur } from "@/app/actions/upload";
import { gecerlilikDurumuHesapla, durumRengi, sureEtiketi } from "@/lib/utils/evrak-utils";
import type { EvrakKategori } from "@/types/evrak";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  Building2,
  FileText,
  Clock,
  Stamp,
  PenTool,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { EvrakYukleDialog } from "@/components/modules/evrak/EvrakYukleDialog";
import { DosyaOnizleme } from "@/components/modules/evrak/DosyaOnizleme";

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════

export function SirketEvrakContent() {
  const { data: kategoriler, isLoading: katYukleniyor } = useEvrakKategorileri("sirket");
  const { data: evraklar, isLoading: evrakYukleniyor } = useSirketEvraklar();

  const [yukleDialogAcik, setYukleDialogAcik] = useState(false);
  const [yukleKategori, setYukleKategori] = useState<EvrakKategori | null>(null);
  const [onizlemeUrl, setOnizlemeUrl] = useState<string | null>(null);
  const [onizlemeDosyaAdi, setOnizlemeDosyaAdi] = useState("");

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

  const handleOnizle = async (objectKey: string, dosyaAdi: string) => {
    const result = await downloadUrlOlustur({ objectKey });
    if ("url" in result) {
      setOnizlemeUrl(result.url);
      setOnizlemeDosyaAdi(dosyaAdi);
    } else {
      toast.error("Dosya URL'si alınamadı.");
    }
  };

  const handleIndir = async (objectKey: string, dosyaAdi: string) => {
    const result = await downloadUrlOlustur({ objectKey });
    if ("url" in result) {
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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <Link href="/evrak" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          Evrak Yönetimi
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-emerald-500" />
          Şirket Evrakları
        </h1>
        <p className="text-muted-foreground mt-1">
          Şirket geneli resmi belgeler ve görseller (kaşe, imza sirküleri vb.)
        </p>
      </div>

      {/* Kategoriler */}
      {typedKategoriler.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Şirket kategorisi yok</p>
          <p className="text-sm mt-1">Ayarlar → Evrak Kategorileri'nden şirket kategorisi ekleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typedKategoriler.map((kategori) => {
            const katEvraklar = kategoriEvrakMap.get(kategori.id) ?? [];
            const isKaseImza = isKaseVeyaImza(kategori.ad);

            return (
              <SirketEvrakKart
                key={kategori.id}
                kategori={kategori}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                evraklar={katEvraklar as any[]}
                isKaseImza={isKaseImza}
                onYukle={() => {
                  setYukleKategori(kategori);
                  setYukleDialogAcik(true);
                }}
                onOnizle={handleOnizle}
                onIndir={handleIndir}
              />
            );
          })}
        </div>
      )}

      {/* Yükleme Dialog */}
      {yukleKategori && (
        <EvrakYukleDialog
          acik={yukleDialogAcik}
          onKapat={() => {
            setYukleDialogAcik(false);
            setYukleKategori(null);
          }}
          kategori={yukleKategori}
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
// KAŞE / İMZA ALGILAMA
// ═══════════════════════════════════════════════════════════════════════════════

/** Kategori adı kaşe veya imza içeriyor mu */
function isKaseVeyaImza(ad: string): boolean {
  const lower = ad.toLowerCase();
  return lower.includes("kaşe") || lower.includes("kase") || lower.includes("imza");
}

/** Dosya tipi resim mi */
function isResimDosya(dosyaAdi: string): boolean {
  const ext = dosyaAdi.split(".").pop()?.toLowerCase() ?? "";
  return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ŞİRKET EVRAK KARTI
// ═══════════════════════════════════════════════════════════════════════════════

function SirketEvrakKart({
  kategori,
  evraklar,
  isKaseImza,
  onYukle,
  onOnizle,
  onIndir,
}: {
  kategori: EvrakKategori;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evraklar: any[];
  isKaseImza: boolean;
  onYukle: () => void;
  onOnizle: (objectKey: string, dosyaAdi: string) => void;
  onIndir: (objectKey: string, dosyaAdi: string) => void;
}) {
  const { sil } = useEvrakMutations();
  const [silinecekId, setSilinecekId] = useState<string | null>(null);
  const [versiyonlarAcik, setVersiyonlarAcik] = useState(false);
  const [gorselUrl, setGorselUrl] = useState<string | null>(null);

  const enSonEvrak = evraklar.length > 0 ? evraklar[0] : null;
  const durum = gecerlilikDurumuHesapla(enSonEvrak, kategori);
  const renkler = durumRengi(durum);
  const eskiVersiyonlar = evraklar.length > 1 ? evraklar.slice(1) : [];

  // Kaşe/İmza ise ve resim yüklenmişse görsel önizleme yükle
  const enSonResimMi = enSonEvrak && isResimDosya(enSonEvrak.dosya_adi);

  const handleGorselYukle = async () => {
    if (!enSonEvrak || gorselUrl) return;
    const result = await downloadUrlOlustur({ objectKey: enSonEvrak.dosya_url });
    if ("url" in result) setGorselUrl(result.url);
  };

  // Görsel yükleme tetikle
  if (isKaseImza && enSonResimMi && !gorselUrl) {
    handleGorselYukle();
  }

  // İkon seçimi
  const kartIcon = isKaseImza
    ? kategori.ad.toLowerCase().includes("kaşe") || kategori.ad.toLowerCase().includes("kase")
      ? <Stamp className="h-5 w-5 text-purple-500" />
      : <PenTool className="h-5 w-5 text-blue-500" />
    : <FileText className="h-5 w-5 text-emerald-500" />;

  return (
    <Card className={`border-t-4 ${renkler.border}`}>
      <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${renkler.bg}`}>
            {kartIcon}
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{kategori.ad}</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              {kategori.sureli && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  {sureEtiketi(kategori.varsayilan_sure)}
                </Badge>
              )}
              {isKaseImza && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                  <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                  PNG/JPG
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={onYukle} size="sm" variant="outline" className="gap-1.5 shrink-0">
          <Upload className="h-3.5 w-3.5" />
          {enSonEvrak ? "Güncelle" : "Yükle"}
        </Button>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Kaşe/İmza Görsel Önizleme */}
        {isKaseImza && enSonResimMi && gorselUrl && (
          <div className="flex justify-center p-4 rounded-lg bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gorselUrl}
              alt={kategori.ad}
              className="max-h-24 max-w-[200px] object-contain"
            />
          </div>
        )}

        {!enSonEvrak ? (
          <p className="text-xs text-muted-foreground py-2">
            Henüz yüklenmemiş.
            {isKaseImza && (
              <span className="block mt-0.5">
                💡 Şeffaf arka planlı PNG dosyası önerilir.
              </span>
            )}
          </p>
        ) : (
          <div className="space-y-2">
            {/* Son Versiyon */}
            <div className="flex items-center gap-3 py-2 px-2 rounded-lg bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{enSonEvrak.dosya_adi}</p>
                <p className="text-[10px] text-muted-foreground">
                  v{enSonEvrak.versiyon}
                  {enSonEvrak.dosya_boyut && (
                    <span>
                      {" · "}
                      {enSonEvrak.dosya_boyut > 1024 * 1024
                        ? `${(enSonEvrak.dosya_boyut / (1024 * 1024)).toFixed(1)} MB`
                        : `${(enSonEvrak.dosya_boyut / 1024).toFixed(0)} KB`}
                    </span>
                  )}
                  {enSonEvrak.bitis_tarihi && (
                    <span>
                      {" · Son: "}
                      {new Date(enSonEvrak.bitis_tarihi).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onOnizle(enSonEvrak.dosya_url, enSonEvrak.dosya_adi)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onIndir(enSonEvrak.dosya_url, enSonEvrak.dosya_adi)}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setSilinecekId(enSonEvrak.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Eski Versiyonlar */}
            {eskiVersiyonlar.length > 0 && (
              <Collapsible open={versiyonlarAcik} onOpenChange={setVersiyonlarAcik}>
                <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${versiyonlarAcik ? "rotate-180" : ""}`} />
                  {eskiVersiyonlar.length} eski versiyon
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {eskiVersiyonlar.map((evrak: any) => (
                    <div
                      key={evrak.id}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-lg bg-muted/30 opacity-70"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs flex-1 truncate">{evrak.dosya_adi}</p>
                      <span className="text-[10px] text-muted-foreground">v{evrak.versiyon}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onIndir(evrak.dosya_url, evrak.dosya_adi)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setSilinecekId(evrak.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
              Bu evrak kalıcı olarak silinecek.
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
