"use client";

import { useState, useEffect, useRef } from "react";
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
import { Arac, YakitTipi, VitesTipi } from "./types";
import {
  aracEkleAction,
  aracGuncelleAction,
  garajGorselYukleAction,
} from "@/app/actions/garaj";
import { toast } from "sonner";
import {
  Car,
  Sparkles,
  UploadCloud,
  Loader2,
  Camera,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AracFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duzenlenecekArac?: Arac | null;
  onBasarili?: (aracId: string, aracBilgi?: { plaka: string; marka: string; model: string }) => void;
}

export function AracFormModal({
  open,
  onOpenChange,
  duzenlenecekArac,
  onBasarili,
}: AracFormModalProps) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  const isDuzenleme = Boolean(duzenlenecekArac);

  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [altBaslik, setAltBaslik] = useState("");
  const [paket, setPaket] = useState("");
  const [yil, setYil] = useState(new Date().getFullYear());
  const [plaka, setPlaka] = useState("");
  const [yakitTipi, setYakitTipi] = useState<YakitTipi>("Benzin");
  const [vites, setVites] = useState<VitesTipi>("Otomatik");
  const [km, setKm] = useState(0);
  const [gorsel, setGorsel] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ruhsatSeriNo, setRuhsatSeriNo] = useState("");
  const [motorNo, setMotorNo] = useState("");
  const [saseNo, setSaseNo] = useState("");

  useEffect(() => {
    if (duzenlenecekArac) {
      setMarka(duzenlenecekArac.marka);
      setModel(duzenlenecekArac.model);
      setAltBaslik(duzenlenecekArac.altBaslik || "");
      setPaket(duzenlenecekArac.paket || "");
      setYil(duzenlenecekArac.yil);
      setPlaka(duzenlenecekArac.plaka);
      setYakitTipi(duzenlenecekArac.yakitTipi);
      setVites(duzenlenecekArac.vites);
      setKm(duzenlenecekArac.km);
      setGorsel(duzenlenecekArac.gorsel || "");
      setPreviewUrl(duzenlenecekArac.gorsel || null);
      setSelectedFile(null);
      setRuhsatSeriNo(duzenlenecekArac.ruhsat?.ruhsatSeriNo || "");
      setMotorNo(duzenlenecekArac.ruhsat?.motorNo || "");
      setSaseNo(duzenlenecekArac.ruhsat?.saseNo || "");
    } else {
      setMarka("");
      setModel("");
      setAltBaslik("");
      setPaket("");
      setYil(new Date().getFullYear());
      setPlaka("");
      setYakitTipi("Benzin");
      setVites("Otomatik");
      setKm(0);
      setGorsel("");
      setPreviewUrl(null);
      setSelectedFile(null);
      setRuhsatSeriNo("");
      setMotorNo("");
      setSaseNo("");
    }
  }, [duzenlenecekArac, open]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Görsel dosya boyutu en fazla 10MB olabilir.");
      return;
    }
    setSelectedFile(file);
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
    setGorsel(objUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleGorselKaldir = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGorsel("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!marka.trim() || !model.trim() || !plaka.trim()) {
      toast.error("Lütfen Marka, Model ve Plaka alanlarını doldurunuz.");
      return;
    }

    setYukleniyor(true);

    let finalGorsel = gorsel.trim();

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await garajGorselYukleAction(formData);

      if (!uploadRes.basarili) {
        setYukleniyor(false);
        toast.error(uploadRes.hata || "Görsel yüklenemedi.");
        return;
      }

      finalGorsel = uploadRes.veri.url;
    }

    const kayitGorsel = finalGorsel || "/cars.png";

    if (isDuzenleme && duzenlenecekArac) {
      const res = await aracGuncelleAction(duzenlenecekArac.id, {
        marka: marka.trim(),
        model: model.trim(),
        altBaslik: altBaslik.trim() || `${yakitTipi} • ${vites}`,
        paket: paket.trim(),
        yil: Number(yil) || new Date().getFullYear(),
        plaka: plaka.trim().toUpperCase(),
        yakitTipi,
        vites,
        km: Number(km) || 0,
        gorsel: kayitGorsel,
        ruhsat: {
          ruhsatSeriNo: ruhsatSeriNo.trim() || `GI ${Math.floor(100000 + Math.random() * 900000)}`,
          motorNo: motorNo.trim() || `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
          saseNo: saseNo.trim() || `NM4263${Math.floor(100000 + Math.random() * 900000)}Y60210`,
          belgeUrl: duzenlenecekArac.ruhsat?.belgeUrl,
          belgeAdi: duzenlenecekArac.ruhsat?.belgeAdi,
        },
      });

      setYukleniyor(false);

      if (res.basarili) {
        toast.success(`${marka} ${model} bilgileri güncellendi.`);
        onOpenChange(false);
        if (onBasarili) onBasarili(duzenlenecekArac.id);
        router.refresh();
      } else {
        toast.error(res.hata || "Araç güncellenemedi.");
      }
    } else {
      const res = await aracEkleAction({
        marka: marka.trim(),
        model: model.trim(),
        altBaslik: altBaslik.trim() || `${yakitTipi} • ${vites}`,
        paket: paket.trim(),
        yil: Number(yil) || new Date().getFullYear(),
        plaka: plaka.trim().toUpperCase(),
        yakitTipi,
        vites,
        km: Number(km) || 0,
        gorsel: kayitGorsel,
        ruhsatSeriNo: ruhsatSeriNo.trim() || `GI ${Math.floor(100000 + Math.random() * 900000)}`,
        motorNo: motorNo.trim() || `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
        saseNo: saseNo.trim() || `NM4263${Math.floor(100000 + Math.random() * 900000)}Y60210`,
      });

      setYukleniyor(false);

      if (res.basarili) {
        toast.success(`${marka} ${model} başarıyla filoya eklendi.`);
        onOpenChange(false);
        if (onBasarili) {
          onBasarili(res.veri.id, {
            plaka: plaka.trim().toUpperCase(),
            marka: marka.trim(),
            model: model.trim(),
          });
        }
        router.refresh();
      } else {
        toast.error(res.hata || "Araç eklenemedi.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {isDuzenleme ? "Araç Bilgilerini Düzenle" : "Filoya Yeni Araç Ekle"}
              </DialogTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isDuzenleme
                  ? `${duzenlenecekArac?.plaka} plakalı aracın bilgilerini güncelleyin`
                  : "Şirket filosuna dahil edilecek aracın veritabanı kaydını oluşturun"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* ── 1. Temel Bilgiler ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Marka *</Label>
              <Input
                placeholder="Örn: Volvo, BMW, Mercedes"
                value={marka}
                onChange={(e) => setMarka(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Model *</Label>
              <Input
                placeholder="Örn: EX30, 320i, Sprinter"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Plaka *</Label>
              <Input
                placeholder="34 ABC 123"
                value={plaka}
                onChange={(e) => setPlaka(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-mono font-bold uppercase"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Model Yılı *</Label>
              <Input
                type="number"
                min={1990}
                max={2030}
                value={yil}
                onChange={(e) => setYil(Number(e.target.value))}
                required
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mevcut Kilometre (KM)</Label>
              <Input
                type="number"
                min={0}
                value={km}
                onChange={(e) => setKm(Number(e.target.value))}
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          {/* ── 2. Yakıt, Vites ve Paket ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Yakıt Tipi</Label>
              <Select value={yakitTipi} onValueChange={(val) => { if (val) setYakitTipi(val as YakitTipi); }}>
                <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Yakıt Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Benzin">Benzin</SelectItem>
                  <SelectItem value="Dizel">Dizel</SelectItem>
                  <SelectItem value="Elektrik">Elektrik</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Plug-in Hybrid">Plug-in Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Vites</Label>
              <Select value={vites} onValueChange={(val) => { if (val) setVites(val as VitesTipi); }}>
                <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Vites Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Otomatik">Otomatik</SelectItem>
                  <SelectItem value="Manuel">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Donanım Paketi</Label>
              <Input
                placeholder="Örn: M Sport, AMG, Long Range"
                value={paket}
                onChange={(e) => setPaket(e.target.value)}
                className="rounded-xl h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Alt Açıklama (Opsiyonel)</Label>
            <Input
              placeholder="Örn: SUV / Elektrikli veya Şirket Makam Aracı"
              value={altBaslik}
              onChange={(e) => setAltBaslik(e.target.value)}
              className="rounded-xl h-9 text-xs"
            />
          </div>

          {/* ── 3. Ruhsat Bilgileri ── */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Ruhsat ve Tescil Numaraları</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-500">Ruhsat Seri No</Label>
                <Input
                  placeholder="GI 431226"
                  value={ruhsatSeriNo}
                  onChange={(e) => setRuhsatSeriNo(e.target.value)}
                  className="rounded-xl h-8 text-xs font-mono uppercase bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-500">Motor No</Label>
                <Input
                  placeholder="463460201136131"
                  value={motorNo}
                  onChange={(e) => setMotorNo(e.target.value)}
                  className="rounded-xl h-8 text-xs font-mono uppercase bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-500">Şase No</Label>
                <Input
                  placeholder="NM426300006Y60210"
                  value={saseNo}
                  onChange={(e) => setSaseNo(e.target.value)}
                  className="rounded-xl h-8 text-xs font-mono uppercase bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* ── 4. Araç Görseli Yükleme ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>Araç Görseli / Fotoğrafı</span>
              </Label>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleGorselKaldir}
                  className="text-[11px] text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Görseli Kaldır
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850/50 p-3 overflow-hidden">
                <div className="relative w-full h-44 rounded-xl overflow-hidden bg-zinc-100/80 dark:bg-zinc-900/80 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Araç Önizleme"
                    className="w-full h-full object-contain p-2"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 rounded-xl text-xs font-medium gap-1.5 bg-white/95 dark:bg-zinc-900/95 hover:bg-white text-zinc-900 dark:text-zinc-100 shadow-md"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Fotoğrafı Değiştir
                    </Button>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium">
                      {selectedFile ? selectedFile.name : "Mevcut Araç Görseli"}
                    </span>
                  </div>
                  {selectedFile && (
                    <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[0.99]"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-850/30 hover:bg-zinc-50 dark:hover:bg-zinc-850/60"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Araç fotoğrafı yüklemek için tıklayın veya sürükleyin
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    PNG, JPG, WEBP • Maksimum 10MB
                  </p>
                </div>
              </div>
            )}

            {/* Opsiyonel Doğrudan URL Girişi */}
            <div className="pt-0.5">
              <Input
                placeholder="Veya harici görsel URL'si yapıştırın (https://...)"
                value={selectedFile ? "" : (previewUrl || "")}
                disabled={Boolean(selectedFile)}
                onChange={(e) => {
                  const val = e.target.value;
                  setGorsel(val);
                  setPreviewUrl(val || null);
                }}
                className="rounded-xl h-8 text-xs font-mono"
              />
            </div>
          </div>

          {/* ── Alt Butonlar ── */}
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
              className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold"
            >
              {yukleniyor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {yukleniyor
                ? selectedFile
                  ? "Görsel Yükleniyor..."
                  : "Kaydediliyor..."
                : isDuzenleme
                ? "Değişiklikleri Kaydet"
                : "Aracı Veritabanına Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
