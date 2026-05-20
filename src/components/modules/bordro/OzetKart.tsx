"use client";

/**
 * Bordro özet kartları — Toplam Ödeme, Toplam Kesinti, Elden.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPara } from "@/lib/utils/index";

interface OzetKartProps {
  toplamOdeme: number;
  toplamKesinti: number;
  elden: number;
  yukleniyor?: boolean;
}

const KARTLAR = [
  { baslik: "Toplam Ödeme",  key: "toplamOdeme",   renk: "text-emerald-600 dark:text-emerald-400" },
  { baslik: "Toplam Kesinti", key: "toplamKesinti", renk: "text-rose-600 dark:text-rose-400" },
  { baslik: "Elden",          key: "elden",         renk: "text-amber-600 dark:text-amber-400 font-bold" },
] as const;

export function OzetKart({ toplamOdeme, toplamKesinti, elden, yukleniyor }: OzetKartProps) {
  const degerler: Record<string, number> = { toplamOdeme, toplamKesinti, elden };

  return (
    <div className="grid grid-cols-3 gap-3">
      {KARTLAR.map(({ baslik, key, renk }) => (
        <Card key={key}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">{baslik}</p>
            {yukleniyor ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className={`text-lg font-bold ${renk}`}>
                {formatPara(degerler[key])}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
