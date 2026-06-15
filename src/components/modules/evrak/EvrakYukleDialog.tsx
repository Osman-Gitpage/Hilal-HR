"use client";

// ─── Evrak Yükleme Dialog ─────────────────────────────────────────────────────
// Drag-drop dosya seçimi, süreli evrak tarih hesaplama, versiyon uyarı, progress

import { useState, useCallback, useRef } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useEvrakMutations } from "@/hooks/useEvrak";
import { useSirketStore } from "@/stores/sirketStore";
import { EVRAK_KABUL_EDILEN_TIPLER, EVRAK_MAX_DOSYA_BOYUT } from "@/types/evrak";
import type { EvrakKategori } from "@/types/evrak";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════

interface EvrakYukleDialogProps {
  acik: boolean;
  onKapat: () => void;
  kategori: EvrakKategori;
  personelId?: string;
  donemId?: string;
}

export function EvrakYukleDialog({
  acik,
  onKapat,
  kategori,
  personelId,
  donemId,
}: EvrakYukleDialogProps) {
  const sirketId = useSirketStore((s) => s.aktifSirketId) ?? "";
  const { olustur } = useEvrakMutations();

  const [dosya, setDosya] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [baslangicTarihi, setBaslangicTarihi] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [bitisTarihi, setBitisTarihi] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, progress, sifirla: uploadSifirla } = useFileUpload({
    sirketId,
    kategoriId: kategori.id,
    personelId,
    onSuccess: async (objectKey, dosyaAdi, dosyaBoyut) => {
      // Evrak kaydını oluştur
      await olustur.mutateAsync({
        kategori_id: kategori.id,
        personel_id: personelId,
        employment_period_id: donemId,
        dosya_url: objectKey,
        dosya_adi: dosyaAdi,
        dosya_boyut: dosyaBoyut,
        dosya_tipi: dosya?.type,
        baslangic_tarihi: baslangicTarihi || undefined,
        bitis_tarihi: bitisTarihi || undefined,
      });
      handleKapat();
    },
    onError: () => {
      // useFileUpload zaten hata set eder
    },
  });

  // Süreli evrak ise bitiş tarihini otomatik hesapla
  const handleBaslangicChange = (val: string) => {
    setBaslangicTarihi(val);
    if (kategori.sureli && kategori.varsayilan_sure && val) {
      const tarih = new Date(val);
      tarih.setDate(tarih.getDate() + kategori.varsayilan_sure);
      setBitisTarihi(tarih.toISOString().split("T")[0]);
    }
  };

  const handleDosyaSec = (file: File) => {
    setDosya(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleDosyaSec(file);
  }, []);

  const handleYukle = async () => {
    if (!dosya) return;
    await upload(dosya);
  };

  const handleKapat = () => {
    setDosya(null);
    setDragOver(false);
    setBaslangicTarihi(new Date().toISOString().split("T")[0]);
    setBitisTarihi("");
    uploadSifirla();
    onKapat();
  };

  const yukleniyor = progress.durum === "yukleniyor";
  const tamamlandi = progress.durum === "tamamlandi";

  // Dosya boyut formatı
  const boyutStr = dosya
    ? dosya.size > 1024 * 1024
      ? `${(dosya.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(dosya.size / 1024).toFixed(0)} KB`
    : "";

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && handleKapat()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Evrak Yükle
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{kategori.ad}</span> kategorisine dosya yükleyin.
            {kategori.sureli && (
              <span className="block mt-1 text-xs">
                <Clock className="inline h-3 w-3 mr-1" />
                Süreli evrak — varsayılan {kategori.varsayilan_sure} gün
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drag-Drop Alanı */}
          {!dosya ? (
            <div
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-colors
                ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-muted-foreground/40"
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                Dosyayı sürükleyip bırakın
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                veya tıklayarak seçin
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                PDF, Word, Excel, Resim — Max {EVRAK_MAX_DOSYA_BOYUT / (1024 * 1024)} MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={EVRAK_KABUL_EDILEN_TIPLER.join(",")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDosyaSec(file);
                  e.target.value = ""; // reset
                }}
              />
            </div>
          ) : (
            /* Seçilen Dosya */
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{dosya.name}</p>
                <p className="text-xs text-muted-foreground">{boyutStr}</p>
              </div>
              {!yukleniyor && !tamamlandi && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setDosya(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Progress */}
          {yukleniyor && (
            <div className="space-y-2">
              <Progress value={progress.yuzde} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Yükleniyor... %{progress.yuzde}
              </p>
            </div>
          )}

          {/* Hata */}
          {progress.durum === "hata" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {progress.hata}
            </div>
          )}

          {/* Tamamlandı */}
          {tamamlandi && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Evrak başarıyla yüklendi!
            </div>
          )}

          {/* Tarih Alanları (süreli ise) */}
          {kategori.sureli && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="baslangic" className="text-xs">Başlangıç Tarihi</Label>
                  <Input
                    id="baslangic"
                    type="date"
                    value={baslangicTarihi}
                    onChange={(e) => handleBaslangicChange(e.target.value)}
                    disabled={yukleniyor}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bitis" className="text-xs">Bitiş Tarihi</Label>
                  <Input
                    id="bitis"
                    type="date"
                    value={bitisTarihi}
                    onChange={(e) => setBitisTarihi(e.target.value)}
                    disabled={yukleniyor}
                  />
                </div>
              </div>
              {bitisTarihi && (
                <p className="text-xs text-muted-foreground">
                  Geçerlilik:{" "}
                  {new Date(baslangicTarihi).toLocaleDateString("tr-TR")} →{" "}
                  {new Date(bitisTarihi).toLocaleDateString("tr-TR")}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleKapat} disabled={yukleniyor}>
            {tamamlandi ? "Kapat" : "İptal"}
          </Button>
          {!tamamlandi && (
            <Button
              onClick={handleYukle}
              disabled={!dosya || yukleniyor}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              {yukleniyor ? "Yükleniyor…" : "Yükle"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
