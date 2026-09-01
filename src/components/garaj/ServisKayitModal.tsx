"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { servisKaydiEkleAction, garajDosyaYukleAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { Wrench, Plus, UploadCloud, FileCheck, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ServisKayitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aracId: string;
  plaka: string;
  varsayilanYil?: number;
  onBasarili?: () => void;
}

export function ServisKayitModal({
  open,
  onOpenChange,
  aracId,
  plaka,
  varsayilanYil = 2026,
  onBasarili,
}: ServisKayitModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const [tarih, setTarih] = useState(new Date().toISOString().split("T")[0]);
  const [km, setKm] = useState<number | "">(24000);
  const [islemTuru, setIslemTuru] = useState("Periyodik Bakım");
  const [servisAdi, setServisAdi] = useState("Yetkili Servis");
  const [aciklama, setAciklama] = useState("");
  const [faturaNo, setFaturaNo] = useState("");
  const [tutar, setTutar] = useState<number | "">(12500);

  // Opsiyonel Fatura Yükleme
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [faturaDosyaAdi, setFaturaDosyaAdi] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFaturaDosyaAdi(file.name);
      toast.success(`${file.name} faturası seçildi.`);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFaturaDosyaAdi("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aciklama.trim() || !tutar) {
      toast.error("Lütfen Yapılan İşlem Açıklaması ve Tutar alanlarını doldurunuz.");
      return;
    }

    setYukleniyor(true);

    let uploadedUrl: string | undefined = undefined;
    let finalDocName = faturaDosyaAdi;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await garajDosyaYukleAction(formData);
      if (uploadRes.basarili && uploadRes.veri) {
        uploadedUrl = uploadRes.veri.url;
        finalDocName = uploadRes.veri.dosyaAdi;
      }
    }

    const res = await servisKaydiEkleAction(aracId, {
      yil: Number(tarih.split("-")[0]) || varsayilanYil,
      tarih,
      km: Number(km) || 0,
      islemTuru,
      servisAdi: servisAdi.trim() || "Özel Servis",
      aciklama: aciklama.trim(),
      faturaNo: faturaNo.trim() || undefined,
      faturaDosyaAdi: finalDocName || undefined,
      faturaDosyaUrl: uploadedUrl,
      tutar: Number(tutar) || 0,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("Servis & tamir kaydı veritabanına eklendi.");
      setAciklama("");
      setFaturaNo("");
      setSelectedFile(null);
      setFaturaDosyaAdi("");
      onOpenChange(false);
      if (onBasarili) onBasarili();
      router.refresh();
    } else {
      toast.error(res.hata || "Servis kaydı eklenemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden min-w-0">
        <DialogHeader className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Servis & Tamir Kaydı Ekle
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {plaka} plakalı araca ait periyodik bakım veya onarım harcaması
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">İşlem Tarihi *</Label>
              <Input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Araç Kilometresi (KM)</Label>
              <Input
                type="number"
                placeholder="Örn: 24000"
                value={km}
                onChange={(e) => setKm(e.target.value ? Number(e.target.value) : "")}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">İşlem Türü</Label>
              <Select value={islemTuru} onValueChange={(v) => { if (v) setIslemTuru(v); }}>
                <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                  <SelectValue placeholder="İşlem Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Periyodik Bakım">Periyodik Bakım</SelectItem>
                  <SelectItem value="Mekanik Onarım">Mekanik Onarım</SelectItem>
                  <SelectItem value="Lastik Değişimi">Lastik Değişimi</SelectItem>
                  <SelectItem value="Akü Değişimi">Akü Değişimi</SelectItem>
                  <SelectItem value="Fren & Balata">Fren & Balata</SelectItem>
                  <SelectItem value="Kaporta / Boya">Kaporta / Boya</SelectItem>
                  <SelectItem value="Detaylı Temizlik">Detaylı Temizlik</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Servis / Firma Adı</Label>
              <Input
                placeholder="Örn: Borusan Oto"
                value={servisAdi}
                onChange={(e) => setServisAdi(e.target.value)}
                className="rounded-xl h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Yapılan İşlem Açıklaması *</Label>
            <Input
              placeholder="Örn: Motor yağı, hava filtreleri ve ön balata değişimi"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              required
              className="rounded-xl h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Fatura / Fiş No</Label>
              <Input
                placeholder="FAT-2026-99"
                value={faturaNo}
                onChange={(e) => setFaturaNo(e.target.value)}
                className="rounded-xl h-9 text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Toplam Tutar (₺) *</Label>
              <Input
                type="number"
                placeholder="Örn: 12500"
                value={tutar}
                onChange={(e) => setTutar(e.target.value ? Number(e.target.value) : "")}
                required
                className="rounded-xl h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Opsiyonel Fatura Yükleme */}
          <div className="space-y-1.5 pt-1 min-w-0">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Servis Faturası / Fiş Görseli (Opsiyonel)
            </Label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,image/*"
              className="hidden"
            />

            {!faturaDosyaAdi ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-850/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-xs font-medium"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Fatura / Fiş Yükle (PDF veya Görsel)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden pr-2">
                  <FileCheck className="w-4 h-4 shrink-0 text-blue-600" />
                  <span className="font-semibold truncate block min-w-0">{faturaDosyaAdi}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFileRemove}
                  className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-zinc-500 hover:text-red-500 transition-colors shrink-0"
                  title="Faturayı Kaldır"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              disabled={yukleniyor}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9 px-4"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={yukleniyor}
              className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {yukleniyor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Servis Kaydını Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
