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
import { cezaEkleAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { FileSpreadsheet, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CezaEkleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aracId: string;
  plaka: string;
  onBasarili?: () => void;
}

export function CezaEkleModal({
  open,
  onOpenChange,
  aracId,
  plaka,
  onBasarili,
}: CezaEkleModalProps) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(false);

  const [tarih, setTarih] = useState(new Date().toISOString().split("T")[0]);
  const [cezaTuru, setCezaTuru] = useState("Hız İhlali");
  const [aciklama, setAciklama] = useState("Hız sınırını %10-30 oranında aşmak");
  const [tutar, setTutar] = useState<number | "">(1506);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cezaTuru.trim() || !tutar) {
      toast.error("Lütfen Ceza Türü ve Tutar alanlarını doldurunuz.");
      return;
    }

    setYukleniyor(true);

    const res = await cezaEkleAction(aracId, {
      tarih,
      cezaTuru: cezaTuru.trim(),
      aciklama: aciklama.trim() || cezaTuru.trim(),
      tutar: Number(tutar) || 0,
    });

    setYukleniyor(false);

    if (res.basarili) {
      toast.success("Trafik cezası kaydı veritabanına eklendi.");
      onOpenChange(false);
      if (onBasarili) onBasarili();
      router.refresh();
    } else {
      toast.error(res.hata || "Ceza eklenemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800 text-left">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Trafik Cezası Ekle
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {plaka} plakalı araca tebliğ edilen ceza kaydı
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tebliğ / İhlal Tarihi *</Label>
              <Input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
                className="rounded-xl h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ceza Tutarı (₺) *</Label>
              <Input
                type="number"
                placeholder="Örn: 1506"
                value={tutar}
                onChange={(e) => setTutar(e.target.value ? Number(e.target.value) : "")}
                required
                className="rounded-xl h-9 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">İhlal / Ceza Türü *</Label>
            <Select
              value={cezaTuru}
              onValueChange={(v) => {
                if (v) {
                  setCezaTuru(v);
                  if (v === "Hız İhlali") {
                    setAciklama("Hız sınırını %10-30 oranında aşmak");
                    setTutar(1506);
                  } else if (v === "Park İhlali") {
                    setAciklama("Yasak park alanında park etmek");
                    setTutar(993);
                  } else if (v === "Kırmızı Işık") {
                    setAciklama("Kırmızı ışık kuralına uymamak");
                    setTutar(2167);
                  } else if (v === "Emniyet Kemeri") {
                    setAciklama("Emniyet kemeri takmamak");
                    setTutar(436);
                  } else if (v === "Cep Telefonu") {
                    setAciklama("Seyir halinde cep telefonu kullanmak");
                    setTutar(1506);
                  }
                }
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                <SelectValue placeholder="Ceza Türü Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hız İhlali">Hız İhlali (%10-30)</SelectItem>
                <SelectItem value="Park İhlali">Park İhlali / Hatalı Park</SelectItem>
                <SelectItem value="Kırmızı Işık">Kırmızı Işık İhlali</SelectItem>
                <SelectItem value="Emniyet Kemeri">Emniyet Kemeri Takmamak</SelectItem>
                <SelectItem value="Cep Telefonu">Seyir Halinde Cep Telefonu</SelectItem>
                <SelectItem value="Şerit İhlali">Trafik Güvenliği & Şerit İhlali</SelectItem>
                <SelectItem value="Diğer">Diğer İdari Para Cezası</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Açıklama / İhlal Maddesi</Label>
            <Input
              placeholder="Örn: 51/2-A Hız sınırını aşmak"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="rounded-xl h-9 text-xs"
            />
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
              className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {yukleniyor ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Cezayı Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
