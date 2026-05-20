"use client";

/**
 * Dönem (Ay/Yıl) seçici bileşeni.
 * Bordro, puantaj ve banka ödeme sayfalarında ortak kullanılır.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { AY_ADLARI } from "@/lib/constants";

export function DonemSecici() {
  const { seciliDonemYil, seciliDonemAy, setSeciliDonem } = useUIStore();

  const prev = () =>
    seciliDonemAy === 1
      ? setSeciliDonem(seciliDonemYil - 1, 12)
      : setSeciliDonem(seciliDonemYil, seciliDonemAy - 1);

  const next = () =>
    seciliDonemAy === 12
      ? setSeciliDonem(seciliDonemYil + 1, 1)
      : setSeciliDonem(seciliDonemYil, seciliDonemAy + 1);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={prev} aria-label="Önceki ay">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-sm w-36 text-center">
        {AY_ADLARI[seciliDonemAy]} {seciliDonemYil}
      </span>
      <Button variant="outline" size="icon" onClick={next} aria-label="Sonraki ay">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
