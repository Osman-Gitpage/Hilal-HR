"use client";

import { useState } from "react";
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
import { yakitKaydiEkleAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { Fuel, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface YakitGirisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aracId: string;
  plaka: string;
  varsayilanYil?: number;
  onBasarili?: () => void;
}

const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export function YakitGirisModal({
  open,
  onOpenChange,
  aracId,
  plaka,
  varsayilanYil = 2026,
  onBasarili,
}: YakitGirisModalProps) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  const [yil, setYil] = useState(varsayilanYil);
  const [ay, setAy] = useState("Nisan");
  const [yakitTuru, setYakitTuru] = useState("Motorin (Dizel)");
  const [miktar, setMiktar] = useState<number | "">(160);
  const [birimFiyat, setBirimFiyat] = useState<number | "">(47.8);
  const [belgeNo, setBelgeNo] = useState("");

  const sayisalMiktar = typeof miktar === "number" ? miktar : 0;
  const sayisalBirim = typeof birimFiyat === "number" ? birimFiyat : 0;
  const hesaplananToplam = Math.round(sayisalMiktar * sayisalBirim * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sayisalMiktar || !sayisalBirim) {
      toast.error("Lütfen Yakıt Miktarı ve Birim Fiyat alanlarını doldurunuz.");
      return;
    }

    setYukleniyor(true);

    const res = await yakitKaydiEkleAction(aracId, {
      yil: Number(yil),
      ay,
      yakitTuru,
      miktar: sayisalMiktar,
      birimFiyat: sayisalBirim,
      toplamTutar: hesaplananToplam,
      belgeNo: belgeNo.trim() || undefined,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success(`${yil} ${ay} ayı yakıt kaydı veritabanına eklendi.`);
      setBelgeNo("");
      onOpenChange(false);
      if (onBasarili) onBasarili();
      router.refresh();
    } else {
      toast.error(res.hata || "Yakıt kaydı eklenemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Aylık Akaryakıt / Enerji Girişi
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {plaka} plakalı araca ait anlaşmalı yakıt ekstresi
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mali Yıl *</Label>
              <Select value={String(yil)} onValueChange={(v) => { if (v) setYil(Number(v)); }}>
                <SelectTrigger className="w-full h-9 rounded-xl text-xs font-mono font-bold">
                  <SelectValue placeholder="Yıl Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dönem / Ay *</Label>
              <Select value={ay} onValueChange={(v) => { if (v) setAy(v); }}>
                <SelectTrigger className="w-full h-9 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Ay Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {AYLAR.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Yakıt / Enerji Türü</Label>
            <Select value={yakitTuru} onValueChange={(v) => { if (v) setYakitTuru(v); }}>
              <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                <SelectValue placeholder="Yakıt Türü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Motorin (Dizel)">Motorin (Dizel)</SelectItem>
                <SelectItem value="Kurşunsuz Benzin 95">Kurşunsuz Benzin 95</SelectItem>
                <SelectItem value="Elektrik (kWh Dolum)">Elektrik (kWh Dolum)</SelectItem>
                <SelectItem value="LPG / Otogaz">LPG / Otogaz</SelectItem>
                <SelectItem value="AdBlue Katkısı">AdBlue Katkısı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Miktar (LT veya kWh) *</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Örn: 160"
                value={miktar}
                onChange={(e) => setMiktar(e.target.value ? Number(e.target.value) : "")}
                required
                className="rounded-xl h-9 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Birim Fiyat (₺) *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Örn: 47.80"
                value={birimFiyat}
                onChange={(e) => setBirimFiyat(e.target.value ? Number(e.target.value) : "")}
                required
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ekstre / Fiş No</Label>
              <Input
                placeholder="TTS-2026-04"
                value={belgeNo}
                onChange={(e) => setBelgeNo(e.target.value)}
                className="rounded-xl h-9 text-xs font-mono uppercase"
              />
            </div>

            {/* Otomatik Hesaplanmış Tutar */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-right">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold block uppercase">
                Hesaplanan Tutar
              </span>
              <span className="text-sm font-mono font-black text-amber-900 dark:text-amber-100">
                {hesaplananToplam.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                ₺
              </span>
            </div>
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
              className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {yukleniyor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Yakıtı Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
