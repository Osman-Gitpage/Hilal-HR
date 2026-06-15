"use client";

// ─── Özlük Hazırlama Wizard ──────────────────────────────────────────────────
// 5 adım: Şablon seç → Personel seç → Eksik kontrol → Önizleme → Oluştur/İndir

import { useState, useMemo } from "react";
import { usePersonelList } from "@/hooks/usePersonelList";
import { useEksikKontrol, useOzlukOlustur, useTersaneSablonlar } from "@/hooks/useTersane";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  User,
  CheckCircle2,
  AlertTriangle,
  PackageOpen,
  Download,
  Loader2,
  FileStack,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════

interface OzlukHazirlaWizardProps {
  acik: boolean;
  onKapat: () => void;
  sablonId: string;
}

type WizardAdim = "personel" | "kontrol" | "olustur";

export function OzlukHazirlaWizard({ acik, onKapat, sablonId }: OzlukHazirlaWizardProps) {
  const [adim, setAdim] = useState<WizardAdim>("personel");
  const [seciliPersonelId, setSeciliPersonelId] = useState<string | null>(null);
  const [arama, setArama] = useState("");

  const { data: sablonlar } = useTersaneSablonlar();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sablon = (sablonlar as any[])?.find((s: any) => s.id === sablonId);
  const { data: personeller, isLoading: personelYukleniyor } = usePersonelList();
  const { data: eksikSonuc, isLoading: eksikYukleniyor } = useEksikKontrol(
    seciliPersonelId ?? undefined,
    sablonId
  );
  const ozlukMutation = useOzlukOlustur();

  // Filtrelenmiş personeller
  const filtrelenmis = useMemo(() => {
    if (!personeller) return [];
    if (!arama) return personeller;
    const q = arama.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return personeller.filter(
      (p: any) =>
        p.ad.toLowerCase().includes(q) ||
        p.soyad.toLowerCase().includes(q)
    );
  }, [personeller, arama]);

  const handlePersonelSec = (id: string) => {
    setSeciliPersonelId(id);
    setAdim("kontrol");
  };

  const handleOlustur = async () => {
    if (!seciliPersonelId) return;
    const result = await ozlukMutation.mutateAsync({
      personelId: seciliPersonelId,
      sablonId,
    });

    // Sonuç başarılıysa dosyayı indir
    if ("zipBase64" in result) {
      const binaryStr = atob(result.zipBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.dosyaAdi;
      a.click();
      URL.revokeObjectURL(url);
      setAdim("olustur");
    }
  };

  const handleKapat = () => {
    setAdim("personel");
    setSeciliPersonelId(null);
    setArama("");
    ozlukMutation.reset();
    onKapat();
  };

  // Seçili personel bilgisi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seciliPersonel = personeller?.find((p: any) => p.id === seciliPersonelId);

  // Adım başlıkları
  const adimlar: { key: WizardAdim; etiket: string }[] = [
    { key: "personel", etiket: "Personel Seç" },
    { key: "kontrol", etiket: "Eksik Kontrol" },
    { key: "olustur", etiket: "Oluştur" },
  ];

  const aktifAdimIndex = adimlar.findIndex((a) => a.key === adim);

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && handleKapat()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5 text-indigo-500" />
            Özlük Paketi Hazırla
            {sablon && (
              <Badge variant="secondary" className="text-xs font-normal">
                {sablon.ad}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Adım İndikatörü */}
        <div className="flex items-center gap-2 py-2">
          {adimlar.map((a, i) => (
            <div key={a.key} className="flex items-center gap-2 flex-1">
              <div
                className={`
                  flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium shrink-0
                  ${i <= aktifAdimIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {i + 1}
              </div>
              <span className={`text-xs ${i <= aktifAdimIndex ? "font-medium" : "text-muted-foreground"}`}>
                {a.etiket}
              </span>
              {i < adimlar.length - 1 && (
                <div className={`flex-1 h-px ${i < aktifAdimIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {/* Adım 1: Personel Seç */}
          {adim === "personel" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Personel ara..."
                  className="pl-9"
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                />
              </div>

              {personelYukleniyor ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {filtrelenmis.map((p: any) => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted/50 transition-colors"
                      onClick={() => handlePersonelSec(p.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.ad} {p.soyad}</p>
                        <p className="text-xs text-muted-foreground">{p.gorev_unvan || "—"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                  {filtrelenmis.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Personel bulunamadı.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Adım 2: Eksik Kontrol */}
          {adim === "kontrol" && (
            <div className="space-y-4">
              {seciliPersonel && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{seciliPersonel.ad} {seciliPersonel.soyad}</p>
                    <p className="text-xs text-muted-foreground">{seciliPersonel.gorev_unvan || "—"}</p>
                  </div>
                </div>
              )}

              {eksikYukleniyor ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>
              ) : eksikSonuc && !("error" in eksikSonuc) ? (
                <div className="space-y-3">
                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>Evrak tamamlanma</span>
                      <span className="font-medium">
                        {eksikSonuc.toplamGerekli - eksikSonuc.eksikSayisi}/{eksikSonuc.toplamGerekli}
                      </span>
                    </div>
                    <Progress
                      value={
                        eksikSonuc.toplamGerekli > 0
                          ? ((eksikSonuc.toplamGerekli - eksikSonuc.eksikSayisi) / eksikSonuc.toplamGerekli) * 100
                          : 100
                      }
                      className="h-2"
                    />
                  </div>

                  {eksikSonuc.tamam ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <p className="text-sm font-medium">Tüm gerekli evraklar tamam!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{eksikSonuc.eksikSayisi} eksik evrak</p>
                          <p className="text-xs mt-0.5">Eksik evraklarla da oluşturabilirsiniz.</p>
                        </div>
                      </div>
                      <div className="space-y-1 px-1">
                        {eksikSonuc.eksikKategoriler.map((ad, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-red-400">✕</span>
                            {ad}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : eksikSonuc && "error" in eksikSonuc ? (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {eksikSonuc.error}
                </div>
              ) : null}
            </div>
          )}

          {/* Adım 3: Oluştur/İndir */}
          {adim === "olustur" && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">Özlük Paketi Hazır!</p>
              <p className="text-sm text-muted-foreground mt-1">
                ZIP dosyası otomatik olarak indirildi.
              </p>
              {ozlukMutation.data && "hatalar" in ozlukMutation.data && ozlukMutation.data.hatalar.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 text-amber-600 text-xs text-left">
                  <p className="font-medium mb-1">Uyarılar:</p>
                  {ozlukMutation.data.hatalar.map((h, i) => (
                    <p key={i}>• {h}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigasyon */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (adim === "kontrol") {
                setAdim("personel");
                setSeciliPersonelId(null);
              } else {
                handleKapat();
              }
            }}
            className="gap-1.5"
          >
            {adim === "personel" || adim === "olustur" ? (
              "Kapat"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Geri
              </>
            )}
          </Button>

          {adim === "kontrol" && (
            <Button
              onClick={handleOlustur}
              disabled={ozlukMutation.isPending}
              className="gap-1.5"
            >
              {ozlukMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Oluşturuluyor…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Oluştur ve İndir
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
