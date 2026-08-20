"use client";

// ─── Özlük Hazırlama Wizard (4 Adım) ─────────────────────────────────────────
// Adım 1: Personel Seç
// Adım 2: Eksik Evrak Kontrolü
// Adım 3: Form Verileri Doldurma (Formlar Sekmesi & Hızlı Otomatik Doldur)
// Adım 4: Paket Oluştur & İndir

import { useState, useMemo, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles,
  FileEdit,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface OzlukHazirlaWizardProps {
  acik: boolean;
  onKapat: () => void;
  sablonId: string;
}

type WizardAdim = "personel" | "kontrol" | "formlar" | "olustur";

export function OzlukHazirlaWizard({ acik, onKapat, sablonId }: OzlukHazirlaWizardProps) {
  const [adim, setAdim] = useState<WizardAdim>("personel");
  const [seciliPersonelId, setSeciliPersonelId] = useState<string | null>(null);
  const [arama, setArama] = useState("");

  // Form Verileri State (Adım 3 için)
  const [formVerileri, setFormVerileri] = useState({
    gorevYeri: "Tersane / Şantiye Proje Alanı",
    baslangicTarihi: new Date().toISOString().split("T")[0],
    bitisTarihi: "",
    kkdListesi: "Baret, İş Ayakkabısı, Yüksek Görünürlüklü Yelek, İş Eldiveni, Emniyet Kemeri",
    ozelNotlar: "",
  });

  const { data: sablonlar } = useTersaneSablonlar();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sablon = (sablonlar as any[])?.find((s: any) => s.id === sablonId);
  const { data: personeller, isLoading: personelYukleniyor } = usePersonelList();
  const { data: eksikSonuc, isLoading: eksikYukleniyor } = useEksikKontrol(
    seciliPersonelId ?? undefined,
    sablonId
  );
  const ozlukMutation = useOzlukOlustur();

  // Seçili personel bilgisi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seciliPersonel = personeller?.find((p: any) => p.id === seciliPersonelId);

  // Otomatik Doldur Tetiklendiğinde
  const handleHizliOtomatikDoldur = () => {
    if (seciliPersonel) {
      setFormVerileri({
        gorevYeri: sablon?.ad ? `${sablon.ad} Sahası` : "Yalova Tersane Havuz Alanı",
        baslangicTarihi: new Date().toISOString().split("T")[0],
        bitisTarihi: "",
        kkdListesi: "Baret, İş Ayakkabısı (Çelik Burun), Yüksek Görünürlüklü Yelek, İş Eldiveni, Emniyet Kemeri",
        ozelNotlar: `${seciliPersonel.ad} ${seciliPersonel.soyad} (${seciliPersonel.gorev_unvan || "Personel"}) için tersane kabul belgeleri hazırlanmıştır.`,
      });
      toast.success("Tüm form alanları personel verileriyle otomatik dolduruldu!");
    }
  };

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

  // Adım başlıkları (4 Adım)
  const adimlar: { key: WizardAdim; etiket: string }[] = [
    { key: "personel", etiket: "1. Personel" },
    { key: "kontrol", etiket: "2. Eksik Kontrol" },
    { key: "formlar", etiket: "3. Formlar" },
    { key: "olustur", etiket: "4. İndir" },
  ];

  const aktifAdimIndex = adimlar.findIndex((a) => a.key === adim);

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && handleKapat()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PackageOpen className="h-5 w-5 text-indigo-500" />
            Tersane Özlük Paketi Sihirbazı
            {sablon && (
              <Badge variant="secondary" className="text-xs font-normal ml-auto">
                {sablon.ad}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Adım İndikatörü (4 Aşama) */}
        <div className="flex items-center gap-1.5 py-2 border-b">
          {adimlar.map((a, i) => (
            <div key={a.key} className="flex items-center gap-1.5 flex-1">
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0
                  ${i <= aktifAdimIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                  }
                `}
              >
                {i + 1}
              </div>
              <span className={`text-[11px] truncate ${i <= aktifAdimIndex ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {a.etiket}
              </span>
              {i < adimlar.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < aktifAdimIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-3">
          {/* Adım 1: Personel Seç */}
          {adim === "personel" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Personel ara..."
                  className="pl-9 text-xs h-9"
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                />
              </div>

              {personelYukleniyor ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {filtrelenmis.map((p: any) => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                      onClick={() => handlePersonelSec(p.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{p.ad} {p.soyad}</p>
                        <p className="text-[11px] text-muted-foreground">{p.gorev_unvan || "—"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                  {filtrelenmis.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">
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
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border text-xs">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{seciliPersonel.ad} {seciliPersonel.soyad}</p>
                    <p className="text-muted-foreground">{seciliPersonel.gorev_unvan || "—"}</p>
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
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>Evrak Tamamlanma Durumu</span>
                      <span>
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
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Tüm zorunlu özlük evrakları tam. Form adımına geçebilirsiniz.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 text-xs">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-semibold">{eksikSonuc.eksikSayisi} eksik evrak tespit edildi</p>
                          <p className="text-[11px] opacity-90">Form adımında eksiklikleri tamamlayabilir veya devam edebilirsiniz.</p>
                        </div>
                      </div>
                      <div className="space-y-1 px-1">
                        {eksikSonuc.eksikKategoriler.map((ad, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-rose-500">✕</span>
                            {ad}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Adım 3: Form Verileri Doldurma (YENİ SEKMELİ ADIM) */}
          {adim === "formlar" && (
            <div className="space-y-4">
              {/* Üst Hızlı Otomatik Doldur Butonu */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div>
                  <h4 className="text-xs font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Paket Şablon Formları
                  </h4>
                  <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                    Tersane paketine ekli Görevlendirme ve KKD form verilerini kontrol edin.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleHizliOtomatikDoldur}
                  className="h-8 text-xs bg-white dark:bg-zinc-900 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-semibold gap-1 shrink-0"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Hızlı Otomatik Doldur
                </Button>
              </div>

              {/* Form Alanları */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="wiz-gorevYeri" className="text-xs">Görev Yeri / Tersane Saha Adı</Label>
                  <Input
                    id="wiz-gorevYeri"
                    className="h-8 text-xs"
                    value={formVerileri.gorevYeri}
                    onChange={(e) => setFormVerileri({ ...formVerileri, gorevYeri: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="wiz-baslangic" className="text-xs">Başlangıç Tarihi</Label>
                    <Input
                      id="wiz-baslangic"
                      type="date"
                      className="h-8 text-xs"
                      value={formVerileri.baslangicTarihi}
                      onChange={(e) => setFormVerileri({ ...formVerileri, baslangicTarihi: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wiz-bitis" className="text-xs">Bitiş Tarihi (Opsiyonel)</Label>
                    <Input
                      id="wiz-bitis"
                      type="date"
                      className="h-8 text-xs"
                      value={formVerileri.bitisTarihi}
                      onChange={(e) => setFormVerileri({ ...formVerileri, bitisTarihi: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wiz-kkd" className="text-xs">Zimmet Edilen KKD Ekipmanları</Label>
                  <Input
                    id="wiz-kkd"
                    className="h-8 text-xs"
                    value={formVerileri.kkdListesi}
                    onChange={(e) => setFormVerileri({ ...formVerileri, kkdListesi: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wiz-not" className="text-xs">Özel Şartlar / Notlar</Label>
                  <Textarea
                    id="wiz-not"
                    rows={2}
                    className="text-xs"
                    value={formVerileri.ozelNotlar}
                    onChange={(e) => setFormVerileri({ ...formVerileri, ozelNotlar: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Adım 4: İndir */}
          {adim === "olustur" && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-semibold">Tersane Özlük Paketi Oluşturuldu!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm formlar dolduruldu, PDF belgeleri birleştirildi ve ZIP dosyası olarak indirildi.
              </p>
              {ozlukMutation.data && "hatalar" in ozlukMutation.data && ozlukMutation.data.hatalar.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 text-amber-600 text-xs text-left">
                  <p className="font-semibold mb-1">Uyarılar:</p>
                  {ozlukMutation.data.hatalar.map((h, i) => (
                    <p key={i}>• {h}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigasyon */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (adim === "kontrol") {
                setAdim("personel");
              } else if (adim === "formlar") {
                setAdim("kontrol");
              } else {
                handleKapat();
              }
            }}
            className="gap-1 text-xs"
          >
            {adim === "personel" || adim === "olustur" ? (
              "Kapat"
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                Geri
              </>
            )}
          </Button>

          {adim === "kontrol" && (
            <Button
              size="sm"
              onClick={() => {
                handleHizliOtomatikDoldur();
                setAdim("formlar");
              }}
              className="gap-1 text-xs"
            >
              Form Verilerine Geç
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {adim === "formlar" && (
            <Button
              size="sm"
              onClick={handleOlustur}
              disabled={ozlukMutation.isPending}
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {ozlukMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Paket Birleştiriliyor…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Paketi Oluştur ve İndir
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
