"use client";

import { useActionState, useEffect, useState } from "react";
import { ayarlariKaydet } from "@/app/actions/ayarlar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Clock, Calculator, Info } from "lucide-react";
import { VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";

interface AyarlarViewProps {
  gunlukSaat: number;
  aylikSaat: number;
}

export function AyarlarView({ gunlukSaat, aylikSaat }: AyarlarViewProps) {
  const [state, formAction, isPending] = useActionState(ayarlariKaydet, undefined);
  const [aylik, setAylik] = useState(aylikSaat);
  const [gunluk, setGunluk] = useState(gunlukSaat);

  useEffect(() => {
    if (state?.basarili) {
      toast.success("Ayarlar kaydedildi.");
    }
    if (state?.hata) {
      toast.error(state.hata);
    }
  }, [state]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Maaş Hesaplama Ayarları */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Maaş Hesaplama Ayarları</CardTitle>
          </div>
          <CardDescription>
            Saatlik ücret ve hakediş hesaplamalarında kullanılan temel saat değerleri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {/* Aylık Çalışma Saati */}
            <div className="space-y-2">
              <Label htmlFor="aylik_calisma_saati" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Aylık Çalışma Saati
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="aylik_calisma_saati"
                  name="aylik_calisma_saati"
                  type="number"
                  step="0.5"
                  min="1"
                  max="744"
                  value={aylik}
                  onChange={(e) => setAylik(Number(e.target.value))}
                  className="w-36"
                  required
                />
                <span className="text-sm text-muted-foreground">saat / ay</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Saatlik ücret = Net Maaş ÷ Aylık Çalışma Saati.{" "}
                <span className="font-medium text-foreground">
                  Varsayılan: {VARSAYILAN_AYLIK_CALISMA_SAATI} saat
                </span>
              </p>
            </div>

            <Separator />

            {/* Günlük Çalışma Saati */}
            <div className="space-y-2">
              <Label htmlFor="gunluk_calisma_saati" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Günlük Çalışma Saati
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="gunluk_calisma_saati"
                  name="gunluk_calisma_saati"
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={gunluk}
                  onChange={(e) => setGunluk(Number(e.target.value))}
                  className="w-36"
                  required
                />
                <span className="text-sm text-muted-foreground">saat / gün</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Mesai günü hesabında kullanılır: Mesai Saati ÷ Günlük Saat.{" "}
                <span className="font-medium text-foreground">Varsayılan: 8 saat</span>
              </p>
            </div>

            {/* Hesap Önizleme */}
            <PreviewCard
              gunlukSaat={gunluk}
              aylikSaat={aylik}
            />

            {/* Kaydet */}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kaydediliyor…" : "Ayarları Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// Önizleme kartı (örnek hesap)
// ─────────────────────────────────────────────
function PreviewCard({
  gunlukSaat,
  aylikSaat,
}: {
  gunlukSaat: number;
  aylikSaat: number;
}) {
  const ornekMaas = 20000;
  const saatlikUcret = aylikSaat > 0 ? ornekMaas / aylikSaat : 0;
  const ornekMesaiSaat = 10;
  const ornekMesaiGun = ornekMesaiSaat / gunlukSaat;

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Örnek Hesap — {ornekMaas.toLocaleString("tr-TR")} ₺ net maaş
      </p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
        <span className="text-muted-foreground">Aylık çalışma</span>
        <span className="font-medium">{aylikSaat} saat</span>

        <span className="text-muted-foreground">Saatlik ücret</span>
        <span className="font-medium text-primary">{fmt(saatlikUcret)} ₺</span>

        <span className="text-muted-foreground">
          {ornekMesaiSaat} saat mesai → kaç gün?
        </span>
        <span className="font-medium">{fmt(ornekMesaiGun)} gün</span>
      </div>
    </div>
  );
}
