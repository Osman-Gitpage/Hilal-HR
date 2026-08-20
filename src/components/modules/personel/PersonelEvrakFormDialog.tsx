"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Sparkles, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { pdfMetinOlustur } from "@/lib/templates/pdf-form";
import { formatTarih } from "@/lib/utils/index";

export type SablonTipi =
  | "gorevlendirme"
  | "kkd_zimmet"
  | "is_sozlesmesi"
  | "isg_taahhut"
  | "izin_formu";

interface PersonelEvrakFormDialogProps {
  acik: boolean;
  onKapat: () => void;
  sablonTip: SablonTipi;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personel: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sirket?: Record<string, any>;
}

const SABLON_BASLIKLARI: Record<SablonTipi, string> = {
  gorevlendirme: "Tersane / Şantiye Görevlendirme Belgesi",
  kkd_zimmet: "KKD (Kişisel Koruyucu Donanım) Zimmet Formu",
  is_sozlesmesi: "Belirsiz Süreli İş Sözleşmesi Ek-1",
  isg_taahhut: "İSG Talimatı ve Uyarı Taahhütnamesi",
  izin_formu: "Yıllık İzin / Mazeret İzin Talep Formu",
};

export function PersonelEvrakFormDialog({
  acik,
  onKapat,
  sablonTip,
  personel,
  sirket,
}: PersonelEvrakFormDialogProps) {
  const [yukleniyor, setYukleniyor] = useState(false);

  // Form State (Pre-filled with employee & company data)
  const [formData, setFormData] = useState({
    adSoyad: "",
    tc: "",
    gorevUnvan: "",
    sirketAdi: "",
    gorevYeri: "Tersane / Proje Alanı",
    baslangicTarihi: new Date().toISOString().split("T")[0],
    bitisTarihi: "",
    izinTuru: "Yıllık İzin",
    kkdMalzemeler: ["Baret", "İş Ayakkabısı (Çelik Burun)", "Yüksek Görünürlüklü Yelek", "İş Eldiveni"],
    aciklama: "",
  });

  useEffect(() => {
    if (personel) {
      const adSoyad = `${personel.ad ?? ""} ${personel.soyad ?? ""}`.trim();
      setFormData((prev) => ({
        ...prev,
        adSoyad: adSoyad || "—",
        tc: personel.tc ?? "",
        gorevUnvan: personel.gorev_unvan ?? "",
        sirketAdi: sirket?.ad ?? "Hilal HR Şirketi",
      }));
    }
  }, [personel, sirket]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleKkdMalzeme = (item: string) => {
    setFormData((prev) => {
      const varMi = prev.kkdMalzemeler.includes(item);
      return {
        ...prev,
        kkdMalzemeler: varMi
          ? prev.kkdMalzemeler.filter((m) => m !== item)
          : [...prev.kkdMalzemeler, item],
      };
    });
  };

  // İndirme Mantığı (Anında Browser Download — DB'ye kayıt atmaz)
  const handleIndir = async (format: "pdf" | "docx") => {
    try {
      setYukleniyor(true);
      const baslik = SABLON_BASLIKLARI[sablonTip];
      const bugunTarih = new Date().toLocaleDateString("tr-TR");

      if (format === "pdf") {
        const satirlar: string[] = [
          `DÜZENLEME TARİHİ: ${bugunTarih}`,
          `ŞİRKET: ${formData.sirketAdi.toUpperCase()}`,
          `--------------------------------------------------------------------------------`,
          `PERSONEL BİLGİLERİ`,
          `  Ad Soyad        : ${formData.adSoyad}`,
          `  TC Kimlik No    : ${formData.tc}`,
          `  Görev / Unvan   : ${formData.gorevUnvan}`,
          `--------------------------------------------------------------------------------`,
        ];

        if (sablonTip === "gorevlendirme") {
          satirlar.push(
            `GÖREVLENDİRME DETAYLARI`,
            `  Görev Yeri      : ${formData.gorevYeri}`,
            `  Başlangıç Tarihi: ${formatTarih(formData.baslangicTarihi)}`,
            `  Bitiş Tarihi    : ${formData.bitisTarihi ? formatTarih(formData.bitisTarihi) : "Süresiz / Belirtilmedi"}`,
            `  Açıklama / Not  : ${formData.aciklama || "Yok"}`
          );
        } else if (sablonTip === "kkd_zimmet") {
          satirlar.push(
            `ZİMMET EDİLEN KKD MALZEMELERİ`,
            ...formData.kkdMalzemeler.map((m) => `  [X] ${m}`),
            ``,
            `Yukarıda belirtilen kişisel koruyucu donanımları sağlam ve eksiksiz olarak`,
            `teslim aldığımı, çalışma esnasında kullanmayı taahhüt ederim.`
          );
        } else if (sablonTip === "izin_formu") {
          satirlar.push(
            `İZİN TALEBİ DETAYLARI`,
            `  İzin Türü       : ${formData.izinTuru}`,
            `  Başlangıç Tarihi: ${formatTarih(formData.baslangicTarihi)}`,
            `  Bitiş Tarihi    : ${formatTarih(formData.bitisTarihi || formData.baslangicTarihi)}`,
            `  Gerekçe / Not   : ${formData.aciklama || "Yok"}`
          );
        } else {
          satirlar.push(
            `BEYAN VE TAAHHÜT`,
            `  ${formData.aciklama || "İşbu belge personel özlük dosyası ve yasal yükümlülükler kapsamında düzenlenmiştir."}`
          );
        }

        satirlar.push(
          ``,
          ``,
          ` Teslim Eden (İşveren / Yetkili)            Teslim Alan (Personel)`,
          ` İmza: ________________________             İmza: ________________________`
        );

        const pdfBytes = await pdfMetinOlustur(satirlar, { baslik, fontSize: 10 });
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formData.adSoyad.replace(/\s+/g, "_")}_${sablonTip}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // DOCX İndirme Simulation / Metin Dosyası
        const icerik = `=== ${baslik} ===\nTarih: ${bugunTarih}\nŞirket: ${formData.sirketAdi}\n\nPersonel: ${formData.adSoyad}\nTC: ${formData.tc}\nUnvan: ${formData.gorevUnvan}\n\nDetaylar:\n${formData.aciklama || "Belge başarıyla oluşturuldu."}`;
        const blob = new Blob([icerik], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formData.adSoyad.replace(/\s+/g, "_")}_${sablonTip}.doc`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success("Belge bilgisayarınıza indirildi. (Arşive kayıt yapılmadı)");
      onKapat();
    } catch (err) {
      console.error(err);
      toast.error("Belge indirilirken bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && onKapat()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            {SABLON_BASLIKLARI[sablonTip]}
            <Badge variant="secondary" className="text-[10px] ml-auto">
              Pre-filled Form
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-sm">
          {/* Sabit Personel Bilgileri */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-xs">
            <div>
              <span className="text-muted-foreground block">Personel:</span>
              <span className="font-semibold text-foreground">{formData.adSoyad}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">TC No:</span>
              <span className="font-medium text-foreground">{formData.tc || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Görevi:</span>
              <span className="font-medium text-foreground">{formData.gorevUnvan || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Şirket:</span>
              <span className="font-medium text-foreground">{formData.sirketAdi}</span>
            </div>
          </div>

          {/* Dinamik Form Alanları (Manuel Düzenlenebilir) */}
          {sablonTip === "gorevlendirme" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="gorevYeri" className="text-xs">Görev Yeri / Tersane / Şantiye</Label>
                <Input
                  id="gorevYeri"
                  value={formData.gorevYeri}
                  onChange={(e) => handleChange("gorevYeri", e.target.value)}
                  placeholder="Örn: Yalova Tersanesi 2. Havuz"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="baslangicTarihi" className="text-xs">Görev Başlangıç Tarihi</Label>
                  <Input
                    id="baslangicTarihi"
                    type="date"
                    value={formData.baslangicTarihi}
                    onChange={(e) => handleChange("baslangicTarihi", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bitisTarihi" className="text-xs">Görev Bitiş Tarihi (Opsiyonel)</Label>
                  <Input
                    id="bitisTarihi"
                    type="date"
                    value={formData.bitisTarihi}
                    onChange={(e) => handleChange("bitisTarihi", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {sablonTip === "kkd_zimmet" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Zimmet Edilecek KKD Malzemeleri</Label>
              <div className="grid grid-cols-1 gap-1.5 border rounded-lg p-2.5 bg-background">
                {[
                  "Baret (Sarı/Beyaz)",
                  "İş Ayakkabısı (Çelik Burun)",
                  "Yüksek Görünürlüklü Yelek",
                  "İş Eldiveni",
                  "Emniyet Kemeri (Çift Kayışlı)",
                  "Kaynak Maskesi / Gözlük",
                  "Kulak Koruyucu (Manşonlu)",
                ].map((item) => {
                  const secili = formData.kkdMalzemeler.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleKkdMalzeme(item)}
                      className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-muted/50 text-left transition-colors"
                    >
                      {secili ? (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={secili ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sablonTip === "izin_formu" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="baslangicTarihi" className="text-xs">İzin Başlangıç Tarihi</Label>
                <Input
                  id="baslangicTarihi"
                  type="date"
                  value={formData.baslangicTarihi}
                  onChange={(e) => handleChange("baslangicTarihi", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bitisTarihi" className="text-xs">İzin Bitiş Tarihi</Label>
                <Input
                  id="bitisTarihi"
                  type="date"
                  value={formData.bitisTarihi}
                  onChange={(e) => handleChange("bitisTarihi", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="aciklama" className="text-xs">Özel Açıklama / Notlar</Label>
            <Textarea
              id="aciklama"
              rows={3}
              value={formData.aciklama}
              onChange={(e) => handleChange("aciklama", e.target.value)}
              placeholder="Belge üzerine eklenecek özel notlar veya açıklamalar..."
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center border-t pt-3 gap-2">
          <span className="text-[11px] text-muted-foreground">
            ⚡ Belge doğrudan indirilir, kaydolmaz.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleIndir("docx")}
              disabled={yukleniyor}
            >
              {yukleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
              DOCX İndir
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleIndir("pdf")}
              disabled={yukleniyor}
            >
              {yukleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
              PDF İndir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
