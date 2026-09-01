"use client";

import { useState, useEffect } from "react";
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
import { aracEkleAction, aracGuncelleAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { Car, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AracFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duzenlenecekArac?: Arac | null;
  onBasarili?: (aracId: string) => void;
}

const PRESET_GORSELLER = [
  {
    etiket: "Volvo EX30",
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  },
  {
    etiket: "BMW Sedan",
    url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    etiket: "VW VIP Van",
    url: "/cars.png",
  },
  {
    etiket: "Tesla Model S",
    url: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80",
  },
  {
    etiket: "Mercedes Sedan",
    url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    etiket: "Porsche Spor",
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  },
];

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
  const [gorsel, setGorsel] = useState(PRESET_GORSELLER[0].url);
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
      setGorsel(duzenlenecekArac.gorsel);
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
      setGorsel(PRESET_GORSELLER[0].url);
      setRuhsatSeriNo("");
      setMotorNo("");
      setSaseNo("");
    }
  }, [duzenlenecekArac, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!marka.trim() || !model.trim() || !plaka.trim()) {
      toast.error("Lütfen Marka, Model ve Plaka alanlarını doldurunuz.");
      return;
    }

    setYukleniyor(true);

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
        gorsel: gorsel.trim() || PRESET_GORSELLER[0].url,
        ruhsat: {
          ruhsatSeriNo: ruhsatSeriNo.trim() || `GI ${Math.floor(100000 + Math.random() * 900000)}`,
          motorNo: motorNo.trim() || `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
          saseNo: saseNo.trim() || `NM4263${Math.floor(100000 + Math.random() * 900000)}Y60210`,
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
        gorsel: gorsel.trim() || PRESET_GORSELLER[0].url,
        ruhsatSeriNo: ruhsatSeriNo.trim() || `GI ${Math.floor(100000 + Math.random() * 900000)}`,
        motorNo: motorNo.trim() || `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
        saseNo: saseNo.trim() || `NM4263${Math.floor(100000 + Math.random() * 900000)}Y60210`,
      });

      setYukleniyor(false);

      if (res.basarili) {
        toast.success(`${marka} ${model} başarıyla filoya eklendi.`);
        onOpenChange(false);
        if (onBasarili) onBasarili(res.veri.id);
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

          {/* ── 4. Araç Görseli Seçimi ── */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Araç Görseli (Hazır Stüdyo Çekimleri)</span>
            </Label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_GORSELLER.map((p) => (
                <button
                  key={p.etiket}
                  type="button"
                  onClick={() => setGorsel(p.url)}
                  className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    gorsel === p.url
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  }`}
                >
                  <div className="w-full h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden mb-1">
                    <img
                      src={p.url}
                      alt={p.etiket}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 block truncate">
                    {p.etiket}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-1">
              <Input
                placeholder="Veya Özel Görsel URL'si yapıştırın (https://...)"
                value={gorsel}
                onChange={(e) => setGorsel(e.target.value)}
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
              {isDuzenleme ? "Değişiklikleri Kaydet" : "Aracı Veritabanına Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
