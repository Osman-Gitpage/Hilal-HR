"use client";

import { useState } from "react";
import { GarajCard } from "@/components/garaj/GarajCard";
import { Arac } from "@/components/garaj/types";
import { AracFormModal } from "@/components/garaj/AracFormModal";
import { AracSilModal } from "@/components/garaj/AracSilModal";
import { Button } from "@/components/ui/button";
import { Plus, Car } from "lucide-react";
import { useRouter } from "next/navigation";

interface GarajFiloGorunumuProps {
  baslangicAraclar: Arac[];
}

export function GarajFiloGorunumu({ baslangicAraclar }: GarajFiloGorunumuProps) {
  const router = useRouter();

  const [formModalAcik, setFormModalAcik] = useState(false);
  const [duzenlenecekArac, setDuzenlenecekArac] = useState<Arac | null>(null);

  const [silModalAcik, setSilModalAcik] = useState(false);
  const [silinecekArac, setSilinecekArac] = useState<Arac | null>(null);

  const handleYeniAracEkle = () => {
    setDuzenlenecekArac(null);
    setFormModalAcik(true);
  };

  const handleAracDuzenle = (arac: Arac) => {
    setDuzenlenecekArac(arac);
    setFormModalAcik(true);
  };

  const handleAracSil = (arac: Arac) => {
    setSilinecekArac(arac);
    setSilModalAcik(true);
  };

  const handleBasarili = () => {
    router.refresh();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Sayfa Başlığı ve Aksiyon Butonu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Araç Filosu
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Şirket bünyesindeki tüm araçlar ({baslangicAraclar.length} Araç)
          </p>
        </div>

        {/* Yeni Araç Ekle Butonu */}
        <Button
          onClick={handleYeniAracEkle}
          className="rounded-2xl h-10 px-4 text-xs font-semibold gap-2 shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Yeni Araç Ekle
        </Button>
      </div>

      {/* ── Şık Araç Kartları Izgarası ── */}
      {baslangicAraclar.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {baslangicAraclar.map((arac) => (
            <GarajCard
              key={arac.id}
              arac={arac}
              onDuzenle={handleAracDuzenle}
              onSil={handleAracSil}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
            Filoda Kayıtlı Araç Bulunmuyor
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Yeni bir araç ekleyerek filo yönetimine başlayabilirsiniz.
          </p>
          <Button
            onClick={handleYeniAracEkle}
            variant="outline"
            className="rounded-xl text-xs gap-1.5 mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            İlk Aracı Ekle
          </Button>
        </div>
      )}

      {/* ── Ekleme & Düzenleme Modalı ── */}
      <AracFormModal
        open={formModalAcik}
        onOpenChange={setFormModalAcik}
        duzenlenecekArac={duzenlenecekArac}
        onBasarili={handleBasarili}
      />

      {/* ── Silme Onay Modalı ── */}
      <AracSilModal
        open={silModalAcik}
        onOpenChange={setSilModalAcik}
        arac={silinecekArac}
        onSilindi={handleBasarili}
      />
    </div>
  );
}
